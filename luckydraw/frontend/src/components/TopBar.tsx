import React from 'react';
import { Input } from './Input';
import { Button } from './Button';
import { formatAvatarUrl } from '../utils/format';
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
	const keywordWidth = Math.max(100, keyword.length * 14 + 32);
	const [inputValue, setInputValue] = React.useState(winnerCount.toString());

	React.useEffect(() => {
		setInputValue(winnerCount.toString());
	}, [winnerCount]);

	const handleWinnerCountChange = (value: string) => {
		if (value === '') {
			setInputValue('');
			return;
		}

		const num = parseInt(value);
		if (!isNaN(num) && num >= 0) {
			setInputValue(num.toString());
			onWinnerCountChange(num || 1);
		}
	};

	const handleBlur = () => {
		if (inputValue === '' || parseInt(inputValue) <= 0) {
			setInputValue('1');
			onWinnerCountChange(1);
		}
	};

	return (
		<div className={`top-bar ${lotteryRunning ? 'is-lottery-running' : ''}`}>
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
							style={{ width: `${keywordWidth}px` }}
						/>
						<Input
							type="text"
							size="small"
							placeholder="Number"
							value={inputValue}
							onChange={(e) => handleWinnerCountChange(e.target.value)}
							onBlur={handleBlur}
							disabled={lotteryRunning}
							className="input-winner-count"
						/>
					</>
				)}
			</div>
			<Button variant="text" className={`btn-settings ${!loggedIn ? 'btn-settings-svg' : 'btn-settings-avatar'}`} onClick={onSettingsToggle}>
				{loggedIn && userAvatar ? (
					<img src={formatAvatarUrl(userAvatar)} alt="Avatar" className="top-bar-avatar" />
				) : (
					<img src={settingsIcon} alt="Settings" className="top-bar-settings-icon" />
				)}
			</Button>
		</div>
	);
};
