import React from 'react';
import { Button } from './Button';
import { Input } from './Input';
import { SetBackgroundImage, AddWatchedRoom, RemoveWatchedRoom } from '../../wailsjs/go/main/App';
import { formatAvatarUrl } from '../utils/format';
import '../styles/SettingsView.css';

import avatarSvg from '../assets/icon/avatar.svg';

interface Profile {
	id: string;
	name: string;
	keyword: string;
	winner_count: number;
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

	const handleBackgroundImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			const reader = new FileReader();
			reader.onload = async (event) => {
				const dataUrl = event.target?.result as string;
				try {
					await SetBackgroundImage(dataUrl);
					onBackgroundImageChange(dataUrl);
					onMessage('Background image set');
				} catch (e: any) {
					onMessage('Failed to set background: ' + e.message);
				}
			};
			reader.readAsDataURL(file);
		}
	};

	const handleAddRoom = async () => {
		const id = parseInt(newRoomID);
		if (isNaN(id)) {
			onMessage('Please enter a valid room ID');
			return;
		}

		try {
			await AddWatchedRoom(id);
			onWatchedRoomsChange();
			setNewRoomID('');
			onMessage(`Added room ${id}`);
		} catch (e: any) {
			onMessage('Failed to add: ' + e.message);
		}
	};

	const handleRemoveRoom = async (roomID: number) => {
		try {
			await RemoveWatchedRoom(roomID);
			onWatchedRoomsChange();
			onMessage(`Removed room ${roomID}`);
		} catch (e: any) {
			onMessage('Failed to remove: ' + e.message);
		}
	};

	const handleCreateProfile = async () => {
		const name = newProfileName.trim();
		if (!name) {
			onMessage('给个名字吧');
			return;
		}
		await onCreateProfile(name);
		setNewProfileName('');
		onMessage(`创建配置 "${name}" 完成`);
	};

	const handleDeleteProfile = async (id: string) => {
		if (profiles.length <= 1) {
			onMessage('好歹留一个Profile吧');
			return;
		}
		await onDeleteProfile(id);
		onMessage('配置已删除');
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

	return (
		<div className="settings-view">
			<div className="settings-view-content">
				<div className="settings-card settings-bg-0">
					<h2 className="settings-title">账号信息</h2>
					<div className="account-section">
						<div className="account-main">
							<img
								src={loggedIn ? formatAvatarUrl(accountInfo?.face) || 'https://i0.hdslb.com/bfs/face/member/noface.jpg' : avatarSvg}
								alt="Avatar"
								className={`account-avatar ${!loggedIn ? 'is-placeholder' : ''}`}
							/>
							<div className="account-info">
								<div className="account-name">{loggedIn ? accountInfo?.name || 'Loading...' : 'xxxx'}</div>
								<div className="account-uid">UID: {loggedIn ? accountInfo?.uid || '--' : '--'}</div>
							</div>
						</div>
						{loggedIn && (
							<Button variant="danger" size="small" onClick={onLogout}>
								退出登录
							</Button>
						)}
					</div>
				</div>

				{loggedIn && (
					<div className="settings-card settings-bg-1">
						<h2 className="settings-title">抽奖配置</h2>
						<div className="profile-input-group">
							<Input type="text" placeholder="新配置名称" value={newProfileName} onChange={(e) => setNewProfileName(e.target.value)} />
							<Button variant="primary" onClick={handleCreateProfile}>
								新建配置
							</Button>
						</div>
						<div className="profile-list">
							{(profiles || []).map((p) => (
								<div key={p.id} className={`profile-item ${p.id === activeProfileId ? 'is-active' : ''}`}>
									{editingProfileId === p.id ? (
										<div className="profile-item-edit">
											<Input type="text" value={editingName} onChange={(e) => setEditingName(e.target.value)} size="small" />
											<Button variant="primary" size="small" onClick={handleConfirmRename}>
												确定
											</Button>
											<Button variant="text" size="small" onClick={() => setEditingProfileId('')}>
												取消
											</Button>
										</div>
									) : (
										<>
											<div className={`profile-item-info ${lotteryRunning ? 'is-disabled' : ''}`} onClick={() => !lotteryRunning && onSwitchProfile(p.id)}>
												<span className="profile-item-name">{p.name}</span>
												{p.id === activeProfileId && <span className="profile-item-badge">当前</span>}
											</div>
											<div className="profile-item-actions">
												<Button variant="text" size="small" onClick={() => handleStartRename(p.id, p.name)}>
													重命名
												</Button>
												<Button variant="text" size="small" onClick={() => handleDeleteProfile(p.id)}>
													删除
												</Button>
											</div>
										</>
									)}
								</div>
							))}
						</div>
					</div>
				)}

				<div className={`settings-card ${loggedIn ? 'settings-bg-2' : 'settings-bg-1'}`}>
					<h2 className="settings-title">设置背景</h2>
					{backgroundImage && (
						<div className="background-preview">
							<img src={backgroundImage} alt="Background preview" className="background-preview-image" />
						</div>
					)}
					<div className="background-actions">
						<label className="file-input-label">
							<input type="file" accept="image/*" onChange={handleBackgroundImageChange} className="file-input" />
							<span className="btn btn-secondary btn-small">选择图片</span>
						</label>
						{backgroundImage && (
							<Button
								variant="text"
								size="small"
								onClick={async () => {
									await SetBackgroundImage('');
									onBackgroundImageChange('');
									onMessage('Background image cleared');
								}}
							>
								重置背景
							</Button>
						)}
					</div>
				</div>

				<div className={`settings-card ${loggedIn ? 'settings-bg-3' : 'settings-bg-2'}`}>
					<h2 className="settings-title">抽奖列表</h2>
					<div className="room-input-group">
						<Input type="text" placeholder="Room ID" value={newRoomID} onChange={(e) => setNewRoomID(e.target.value)} />
						<Button variant="primary" onClick={handleAddRoom}>
							加注
						</Button>
					</div>
					<div className="rooms-list">
						{(watchedRooms || []).map((roomID) => (
							<div key={roomID} className="room-item">
								<span>房间 {roomID}</span>
								<Button variant="text" size="small" onClick={() => handleRemoveRoom(roomID)}>
									移除
								</Button>
							</div>
						))}
						{(!watchedRooms || watchedRooms.length === 0) && <p className="empty-hint">奖池有待积累</p>}
					</div>
				</div>
			</div>
		</div>
	);
};