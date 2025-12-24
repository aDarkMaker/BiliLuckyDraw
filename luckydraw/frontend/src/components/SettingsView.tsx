import React from 'react';
import { Button } from './Button';
import { Input } from './Input';
import { SetBackgroundImage, AddWatchedRoom, RemoveWatchedRoom } from '../../wailsjs/go/main/App';
import './SettingsView.css';

import avatarSvg from '../assets/icon/avatar.svg';

interface SettingsViewProps {
	accountInfo: any;
	backgroundImage: string;
	watchedRooms: number[];
	loggedIn: boolean;
	onLogout: () => void;
	onBackgroundImageChange: (image: string) => void;
	onWatchedRoomsChange: () => void;
	onMessage: (message: string) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
	accountInfo,
	backgroundImage,
	watchedRooms,
	loggedIn,
	onLogout,
	onBackgroundImageChange,
	onWatchedRoomsChange,
	onMessage,
}) => {
	const [newRoomID, setNewRoomID] = React.useState('');

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

	return (
		<div className="settings-view">
			<div className="settings-view-content">
				<div className="settings-card">
				<h2 className="settings-title">账号信息</h2>
				<div className="account-section">
					<div className="account-main">
						<img
							src={loggedIn ? (accountInfo?.face || "https://i0.hdslb.com/bfs/face/member/noface.jpg") : avatarSvg}
							alt="Avatar"
							className={`account-avatar ${!loggedIn ? 'is-placeholder' : ''}`}
						/>
						<div className="account-info">
							<div className="account-name">
								{loggedIn ? (accountInfo?.name || "Loading...") : "xxxx"}
							</div>
							<div className="account-uid">UID: {loggedIn ? (accountInfo?.uid || "--") : "--"}</div>
						</div>
					</div>
					{loggedIn && (
						<Button variant="danger" size="small" onClick={onLogout}>
							退出登录
						</Button>
					)}
				</div>
			</div>

			<div className="settings-card">
				<h2 className="settings-title">背景图片</h2>
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
							清除背景
						</Button>
					)}
				</div>
			</div>

			<div className="settings-card">
				<h2 className="settings-title">监听直播间</h2>
				<div className="room-input-group">
					<Input type="text" placeholder="Room ID" value={newRoomID} onChange={(e) => setNewRoomID(e.target.value)} />
					<Button variant="primary" onClick={handleAddRoom}>
						添加
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
					{(!watchedRooms || watchedRooms.length === 0) && <p className="empty-hint">暂无监听的直播间</p>}
				</div>
			</div>
			</div>
		</div>
	);
};
