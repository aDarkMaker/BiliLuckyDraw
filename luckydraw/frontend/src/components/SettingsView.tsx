import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { Input } from './Input';
import { AppService } from '../../bindings/luckydraw/internal/app';
import { useTheme, THEMES, useThemeBackground } from '../themes';
import { useI18n, Lang } from '../i18n';
import { formatAvatarUrl } from '../utils/format';
import '../styles/SettingsView.css';

import avatarSvg from '../assets/icon/avatar.svg';

interface Profile {
	id: string;
	name: string;
	keyword: string;
	winner_count: number;
}

interface HistoryWinner {
	uid: number;
	username: string;
	count: number;
}

interface HistoryRecord {
	id: string;
	keyword: string;
	winner_count: number;
	time: string;
	winners: HistoryWinner[];
}

interface SettingsViewProps {
	accountInfo: any;
	backgroundImage: string;
	watchedRooms: number[];
	loggedIn: boolean;
	lotteryRunning?: boolean;
	onLogout: () => void;
	onBackgroundImageChange: (image: string) => void;
	onWatchedRoomsChange: () => void;
	onMessage: (message: string) => void;
	profiles: Profile[];
	activeProfileId: string;
	onCreateProfile: (name: string) => void;
	onDeleteProfile: (id: string) => void;
	onRenameProfile: (id: string, name: string) => void;
	onSwitchProfile: (id: string) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
	accountInfo,
	backgroundImage,
	watchedRooms,
	loggedIn,
	lotteryRunning,
	onLogout,
	onBackgroundImageChange,
	onWatchedRoomsChange,
	onMessage,
	profiles,
	activeProfileId,
	onCreateProfile,
	onDeleteProfile,
	onRenameProfile,
	onSwitchProfile,
}) => {
	const [newRoomID, setNewRoomID] = React.useState('');
	const [newProfileName, setNewProfileName] = React.useState('');
	const [editingProfileId, setEditingProfileId] = React.useState('');
	const [editingName, setEditingName] = React.useState('');
	const [switchingId, setSwitchingId] = React.useState('');
	const { theme, setTheme } = useTheme();
	const themeBackground = useThemeBackground();
	const { t, lang, setLang } = useI18n();

	const handleSwitchProfile = async (id: string) => {
		if (lotteryRunning || switchingId || id === activeProfileId) return;
		setSwitchingId(id);
		try {
			await onSwitchProfile(id);
		} finally {
			setSwitchingId('');
		}
	};

	const handleBackgroundImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			const reader = new FileReader();
			reader.onload = async (event) => {
				const dataUrl = event.target?.result as string;
				try {
					await AppService.SetBackgroundImage(dataUrl);
					onBackgroundImageChange(dataUrl);
					onMessage(t('settings.toast.backgroundSet'));
				} catch (e: any) {
					onMessage(t('settings.toast.backgroundFailed', { error: e.message }));
				}
			};
			reader.readAsDataURL(file);
		}
	};

	const handleAddRoom = async () => {
		const id = parseInt(newRoomID);
		if (isNaN(id)) {
			onMessage(t('settings.toast.invalidRoomId'));
			return;
		}

		try {
			await AppService.AddWatchedRoom(id);
			onWatchedRoomsChange();
			setNewRoomID('');
			onMessage(t('settings.toast.roomAdded', { id }));
		} catch (e: any) {
			onMessage(t('settings.toast.roomAddFailed', { error: e.message }));
		}
	};

	const handleRemoveRoom = async (roomID: number) => {
		try {
			await AppService.RemoveWatchedRoom(roomID);
			onWatchedRoomsChange();
			onMessage(t('settings.toast.roomRemoved', { id: roomID }));
		} catch (e: any) {
			onMessage(t('settings.toast.roomRemoveFailed', { error: e.message }));
		}
	};

	const handleCreateProfile = async () => {
		const name = newProfileName.trim();
		if (!name) {
			onMessage(t('settings.toast.profileNameEmpty'));
			return;
		}
		await onCreateProfile(name);
		setNewProfileName('');
		onMessage(t('settings.toast.profileCreated', { name }));
	};

	const handleDeleteProfile = async (id: string) => {
		if (profiles.length <= 1) {
			onMessage(t('settings.toast.profileKeepOne'));
			return;
		}
		await onDeleteProfile(id);
		onMessage(t('settings.toast.profileDeleted'));
	};

	const handleStartRename = (id: string, name: string) => {
		setEditingProfileId(id);
		setEditingName(name);
	};

	const handleConfirmRename = async () => {
		if (!editingName.trim()) return;
		await onRenameProfile(editingProfileId, editingName.trim());
		setEditingProfileId('');
		setEditingName('');
	};

	const [history, setHistory] = useState<HistoryRecord[]>([]);
	const [historyLoading, setHistoryLoading] = useState(false);

	const loadHistory = async () => {
		if (!activeProfileId) return;
		setHistoryLoading(true);
		try {
			const data = await AppService.GetHistory(activeProfileId);
			setHistory(JSON.parse(data) || []);
		} catch (e) {
			setHistory([]);
		} finally {
			setHistoryLoading(false);
		}
	};

	useEffect(() => {
		loadHistory();
	}, [activeProfileId]);

	const handleDeleteHistory = async (historyID: string) => {
		try {
			await AppService.DeleteHistory(activeProfileId, historyID);
			await loadHistory();
			onMessage(t('settings.toast.historyDeleted'));
		} catch (e: any) {
			onMessage(t('settings.toast.historyExportFailed', { error: e.message }));
		}
	};

	const handleDeleteAllHistory = async () => {
		try {
			await AppService.DeleteAllHistory(activeProfileId);
			await loadHistory();
			onMessage(t('settings.toast.historyAllDeleted'));
		} catch (e: any) {
			onMessage(t('settings.toast.historyExportFailed', { error: e.message }));
		}
	};

	const handleExportHistory = async (historyID: string) => {
		try {
			const path = await AppService.ExportHistory(activeProfileId, historyID);
			if (path) onMessage(t('settings.toast.historyExported', { path }));
		} catch (e: any) {
			onMessage(t('settings.toast.historyExportFailed', { error: e.message }));
		}
	};

	const formatHistoryTime = (time: string) => {
		try {
			return new Date(time).toLocaleString(lang === 'zh' ? 'zh-CN' : 'en-US');
		} catch {
			return time;
		}
	};

	return (
		<div className="settings-view">
			<div className="settings-view-content">
				<div className="settings-card settings-bg-0">
					<h2 className="settings-title">{t('settings.account.title')}</h2>
					<div className="account-section">
						<div className="account-main">
							<img
								src={loggedIn ? formatAvatarUrl(accountInfo?.face) || 'https://i0.hdslb.com/bfs/face/member/noface.jpg' : avatarSvg}
								alt="Avatar"
								className={`account-avatar ${!loggedIn ? 'is-placeholder' : ''}`}
							/>
							<div className="account-info">
								<div className="account-name">{loggedIn ? accountInfo?.name || t('common.loading') : t('settings.account.placeholder')}</div>
								<div className="account-uid">UID: {loggedIn ? accountInfo?.uid || '--' : '--'}</div>
							</div>
						</div>
						{loggedIn && (
							<Button variant="danger" size="small" onClick={onLogout}>
								{t('settings.account.logout')}
							</Button>
						)}
					</div>
				</div>

				<div className="settings-card settings-bg-1">
					<h2 className="settings-title">{t('settings.appearance.title')}</h2>
					<div className="seg-row">
						<span className="seg-label">{t('settings.theme.title')}</span>
						<div
							className="seg-options"
							style={{ '--seg-index': THEMES.findIndex((o) => o.id === theme), '--seg-count': THEMES.length } as React.CSSProperties}
						>
							<span className="seg-indicator" aria-hidden="true" />
							{THEMES.map((opt) => (
								<button
									key={opt.id}
									className={`seg-option ${theme === opt.id ? 'is-active' : ''}`}
									onClick={() => setTheme(opt.id)}
								>
									{t(opt.labelKey)}
								</button>
							))}
						</div>
					</div>
					<div className="seg-row">
						<span className="seg-label">{t('settings.language.title')}</span>
						<div
							className="seg-options"
							style={{ '--seg-index': (['zh', 'en'] as Lang[]).findIndex((l) => l === lang), '--seg-count': 2 } as React.CSSProperties}
						>
							<span className="seg-indicator" aria-hidden="true" />
							{(['zh', 'en'] as Lang[]).map((l) => (
								<button
									key={l}
									className={`seg-option ${lang === l ? 'is-active' : ''}`}
									onClick={() => setLang(l)}
								>
									{t(`settings.language.${l}`)}
								</button>
							))}
						</div>
					</div>
				</div>

				{loggedIn && (
					<div className="settings-card settings-bg-1">
						<h2 className="settings-title">{t('settings.lottery.title')}</h2>
						<div className="profile-input-group">
							<Input type="text" placeholder={t('settings.lottery.newNamePlaceholder')} value={newProfileName} onChange={(e) => setNewProfileName(e.target.value)} />
							<Button variant="primary" onClick={handleCreateProfile}>
								{t('settings.lottery.create')}
							</Button>
						</div>
						<div className="profile-list">
							{(profiles || []).map((p) => (
								<div key={p.id} className={`profile-item ${p.id === activeProfileId ? 'is-active' : ''}`}>
									{editingProfileId === p.id ? (
										<div className="profile-item-edit">
											<Input type="text" value={editingName} onChange={(e) => setEditingName(e.target.value)} size="small" />
											<Button variant="primary" size="small" onClick={handleConfirmRename}>
												{t('common.confirm')}
											</Button>
											<Button variant="text" size="small" onClick={() => setEditingProfileId('')}>
												{t('common.cancel')}
											</Button>
										</div>
									) : (
										<>
											<div
												className={`profile-item-info ${lotteryRunning || switchingId ? 'is-disabled' : ''}`}
												onClick={() => handleSwitchProfile(p.id)}
											>
												{switchingId === p.id && <span className="profile-switching-spinner" aria-hidden="true" />}
												<span className="profile-item-name">{p.name}</span>
												{p.id === activeProfileId && <span className="profile-item-badge">{t('common.current')}</span>}
											</div>
											<div className="profile-item-actions">
												<Button variant="text" size="small" onClick={() => handleStartRename(p.id, p.name)}>
													{t('settings.lottery.rename')}
												</Button>
												<Button variant="text" size="small" onClick={() => handleDeleteProfile(p.id)}>
													{t('settings.lottery.delete')}
												</Button>
											</div>
										</>
									)}
								</div>
							))}
						</div>
					</div>
				)}

				{!themeBackground && (
					<div className={`settings-card ${loggedIn ? 'settings-bg-2' : 'settings-bg-1'}`}>
						<h2 className="settings-title">{t('settings.background.title')}</h2>
						{backgroundImage && (
							<div className="background-preview">
								<img src={backgroundImage} alt={t('settings.background.preview')} className="background-preview-image" />
							</div>
						)}
						<div className="background-actions">
							<label className="file-input-label">
								<input type="file" accept="image/*" onChange={handleBackgroundImageChange} className="file-input" />
								<span className="btn btn-secondary btn-small">{t('settings.background.selectImage')}</span>
							</label>
							{backgroundImage && (
								<Button
									variant="text"
									size="small"
									onClick={async () => {
										await AppService.SetBackgroundImage('');
										onBackgroundImageChange('');
										onMessage(t('settings.toast.backgroundCleared'));
									}}
								>
									{t('settings.background.reset')}
								</Button>
							)}
						</div>
					</div>
				)}

				<div className={`settings-card ${loggedIn ? 'settings-bg-3' : 'settings-bg-2'}`}>
					<h2 className="settings-title">{t('settings.rooms.title')}</h2>
					<div className="room-input-group">
						<Input type="text" placeholder={t('settings.rooms.idPlaceholder')} value={newRoomID} onChange={(e) => setNewRoomID(e.target.value)} />
						<Button variant="primary" onClick={handleAddRoom}>
							{t('settings.rooms.add')}
						</Button>
					</div>
					<div className="rooms-list">
						{(watchedRooms || []).map((roomID) => (
							<div key={roomID} className="room-item">
								<span>{t('settings.rooms.roomLabel', { id: roomID })}</span>
								<Button variant="text" size="small" onClick={() => handleRemoveRoom(roomID)}>
									{t('settings.rooms.remove')}
								</Button>
							</div>
						))}
						{(!watchedRooms || watchedRooms.length === 0) && <p className="empty-hint">{t('settings.rooms.empty')}</p>}
					</div>
				</div>

				{loggedIn && (
					<div className="settings-card settings-bg-2">
						<div className="settings-card-header">
							<h2 className="settings-title">{t('settings.history.title')}</h2>
							{history.length > 0 && (
								<Button variant="text" size="small" onClick={handleDeleteAllHistory}>
									{t('settings.history.deleteAll')}
								</Button>
							)}
						</div>
						<div className="rooms-list">
							{history.map((record) => (
								<div key={record.id} className="history-item">
									<span className="history-label">
										{t('settings.history.recordLabel', {
											keyword: record.keyword || '--',
											count: record.winner_count,
											time: formatHistoryTime(record.time),
										})}
									</span>
									<div className="profile-item-actions">
										<Button variant="text" size="small" onClick={() => handleExportHistory(record.id)}>
											{t('settings.history.export')}
										</Button>
										<Button variant="text" size="small" onClick={() => handleDeleteHistory(record.id)}>
											{t('settings.lottery.delete')}
										</Button>
									</div>
								</div>
							))}
							{history.length === 0 && !historyLoading && <p className="empty-hint">{t('settings.history.empty')}</p>}
						</div>
					</div>
				)}
			</div>
		</div>
	);
};