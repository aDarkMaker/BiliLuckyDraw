import React, { useRef } from 'react';
import { Input } from './Input';
import { Button } from './Button';
import { formatAvatarUrl } from '../utils/format';
import settingsIcon from '../assets/icon/settings.svg';
import '../styles/layout.css';

interface Profile {
	id: string;
	name: string;
	keyword: string;
	winner_count: number;
}

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
	profiles: Profile[];
	activeProfileId: string;
	onSwitchProfile: (id: string) => void;
	onCreateProfile: (name: string) => void;
	onDeleteProfile: (id: string) => void;
	onRenameProfile: (id: string, name: string) => void;
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
	profiles,
	activeProfileId,
	onSwitchProfile,
	onCreateProfile,
	onDeleteProfile,
	onRenameProfile,
}) => {
	const keywordWidth = Math.max(100, keyword.length * 14 + 32);
	const [inputValue, setInputValue] = React.useState(winnerCount.toString());
	const [showDropdown, setShowDropdown] = React.useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);

	React.useEffect(() => {
		setInputValue(winnerCount.toString());
	}, [winnerCount]);

	React.useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
				setShowDropdown(false);
			}
		};
		if (showDropdown) {
			document.addEventListener('mousedown', handleClickOutside);
		}
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, [showDropdown]);

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

	const activeProfile = profiles.find((p) => p.id === activeProfileId);
	const profileName = activeProfile?.name || '默认配置';

	return (
		<div className={`top-bar ${lotteryRunning ? 'is-lottery-running' : ''}`}>
			<div className="lottery-controls">
				{loggedIn && (
					<>
						<div className="profile-selector" ref={dropdownRef}>
							<button
								type="button"
								className="profile-selector-btn"
								onClick={() => setShowDropdown(!showDropdown)}
								disabled={lotteryRunning}
							>
								<span className="profile-name">{profileName}</span>
							</button>
							{showDropdown && (
								<div className="profile-dropdown">
									<div className="profile-dropdown-header">切换配置</div>
									{profiles.map((p) => (
										<div
											key={p.id}
											className={`profile-dropdown-item ${p.id === activeProfileId ? 'is-active' : ''} ${lotteryRunning ? 'is-disabled' : ''}`}
											onClick={() => { if (!lotteryRunning) { onSwitchProfile(p.id); setShowDropdown(false); } }}
										>
											{p.name}
										</div>
									))}
								</div>
							)}
						</div>
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