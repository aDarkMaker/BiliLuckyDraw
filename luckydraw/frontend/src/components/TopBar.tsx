import React from 'react';
import { Input } from './Input';
import { Button } from './Button';
import '../styles/layout.css';

interface TopBarProps {
	keyword: string;
	onKeywordChange: (value: string) => void;
	winnerCount: number;
	onWinnerCountChange: (value: number) => void;
	lotteryRunning: boolean;
	onSettingsToggle: () => void;
	isSettingsOpen: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
	keyword,
	onKeywordChange,
	winnerCount,
	onWinnerCountChange,
	lotteryRunning,
	onSettingsToggle,
	isSettingsOpen,
}) => {
	return (
		<div className="top-bar">
			<div className="lottery-controls">
				<Input
					type="text"
					size="small"
					placeholder="关键词（可选）"
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
			</div>
			<Button variant="text" className="btn-settings" onClick={onSettingsToggle}>
				⚙️
			</Button>
		</div>
	);
};
