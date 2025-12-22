import React from 'react';
import { Input } from './Input';
import { Button } from './Button';
import settingsIcon from '../assets/icon/settings.svg';
import '../styles/layout.css';

interface TopBarProps {
	keyword: string;
	onKeywordChange: (value: string) => void;
	winnerCount: number;
	onWinnerCountChange: (value: number) => void;
	lotteryRunning: boolean;
	onSettingsToggle: () => void;
	isSettingsOpen: boolean;
	loggedIn?: boolean;
	userAvatar?: string;
}

export const TopBar: React.FC<TopBarProps> = ({
	keyword,
	onKeywordChange,
	winnerCount,
	onWinnerCountChange,
	lotteryRunning,
	onSettingsToggle,
	isSettingsOpen,
	loggedIn,
	userAvatar,
}) => {
	return (
		<div className="top-bar">
			<div className="lottery-controls">
				{loggedIn && (
					<>
						<Input
							type="text"
							size="small"
							placeholder="弹幕口令"
							value={keyword}
							onChange={(e) => onKeywordChange(e.target.value)}
							disabled={lotteryRunning}
						/>
						<Input
							type="number"
							size="small"
							placeholder="人数"
							min="1"
							value={winnerCount}
							onChange={(e) => onWinnerCountChange(parseInt(e.target.value) || 1)}
							disabled={lotteryRunning}
						/>
					</>
				)}
			</div>
			<Button
				variant="text"
				className={`btn-settings ${!loggedIn ? 'btn-settings-svg' : 'btn-settings-avatar'}`}
				onClick={onSettingsToggle}
			>
				{loggedIn && userAvatar ? (
					<img src={userAvatar} alt="Avatar" className="top-bar-avatar" />
				) : (
					<img src={settingsIcon} alt="Settings" className="top-bar-settings-icon" />
				)}
			</Button>
		</div>
	);
};
