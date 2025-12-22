import React from 'react';
import { Button } from './Button';
import { Input } from './Input';
import { SetBackgroundImage, AddWatchedRoom, RemoveWatchedRoom } from '../../wailsjs/go/main/App';
import './SettingsView.css';

interface SettingsViewProps {
	accountInfo: any;
	backgroundImage: string;
	watchedRooms: number[];
	onLogout: () => void;
	onBackgroundImageChange: (image: string) => void;
	onWatchedRoomsChange: () => void;
	onMessage: (message: string) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
	accountInfo,
	backgroundImage,
	watchedRooms,
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
					onMessage('背景图片已设置');
				} catch (e: any) {
					onMessage('设置背景失败: ' + e.message);
				}
			};
			reader.readAsDataURL(file);
		}
	};

	const handleAddRoom = async () => {
		const id = parseInt(newRoomID);
		if (isNaN(id)) {
			onMessage('请输入有效的房间号');
			return;
		}

		try {
			await AddWatchedRoom(id);
			onWatchedRoomsChange();
			setNewRoomID('');
			onMessage(`已添加房间 ${id}`);
		} catch (e: any) {
			onMessage('添加失败: ' + e.message);
		}
	};

	const handleRemoveRoom = async (roomID: number) => {
		try {
			await RemoveWatchedRoom(roomID);
			onWatchedRoomsChange();
			onMessage(`已移除房间 ${roomID}`);
		} catch (e: any) {
			onMessage('移除失败: ' + e.message);
		}
	};

	return (
		<div className="settings-view">
			<div className="settings-card">
				<h2 className="settings-title">账号信息</h2>
				<div className="account-section">
					<div className="account-main">
						<img
							src={accountInfo?.face || "https://i0.hdslb.com/bfs/face/member/noface.jpg"}
							alt="头像"
							className="account-avatar"
						/>
						<div className="account-info">
							<div className="account-name">
								{accountInfo?.name || "加载中..."}
							</div>
							<div className="account-uid">UID: {accountInfo?.uid || "--"}</div>
						</div>
					</div>
					<Button variant="danger" size="small" onClick={onLogout}>
						退出登录
					</Button>
				</div>
			</div>

			<div className="settings-card">
				<h2 className="settings-title">背景图片</h2>
				<label className="file-input-label">
					<input type="file" accept="image/*" onChange={handleBackgroundImageChange} className="file-input" />
					<span className="btn btn-secondary">选择图片</span>
				</label>
				{backgroundImage && (
					<Button
						variant="text"
						onClick={async () => {
							await SetBackgroundImage('');
							onBackgroundImageChange('');
							onMessage('已清除背景图片');
						}}
					>
						清除背景
					</Button>
				)}
			</div>

			<div className="settings-card">
				<h2 className="settings-title">监听直播间</h2>
				<div className="room-input-group">
					<Input type="text" placeholder="输入房间号" value={newRoomID} onChange={(e) => setNewRoomID(e.target.value)} />
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
	);
};
