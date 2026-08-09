import React, { useRef } from 'react';
import { Button } from './Button';
import { formatAvatarUrl } from '../utils/format';
import { useI18n } from '../i18n';
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

const ChevronIcon: React.FC<{ open: boolean }> = ({ open }) => (
	<svg className="field-chevron" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" style={{ transform: open ? 'rotate(180deg)' : 'none' }}>
		<path d="M3.5 5.5L8 10l4.5-4.5" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
	</svg>
);

const CheckIcon: React.FC = () => (
	<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" className="dropdown-check">
		<path d="M3.5 8.5L6.5 11.5L12.5 4.5" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
	</svg>
);

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
	const { t } = useI18n();
	const [showDropdown, setShowDropdown] = React.useState(false);
	const [switching, setSwitching] = React.useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);

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

	const clampCount = (n: number) => Math.max(1, Math.min(9999, n || 1));

	const handleSwitch = async (id: string) => {
		if (lotteryRunning || switching || id === activeProfileId) return;
		setSwitching(true);
		setShowDropdown(false);
		try {
			await onSwitchProfile(id);
		} finally {
			setSwitching(false);
		}
	};

	const stepCount = (delta: number) => {
		if (lotteryRunning) return;
		onWinnerCountChange(clampCount(winnerCount + delta));
	};

	const activeProfile = profiles.find((p) => p.id === activeProfileId);
	const profileName = activeProfile?.name || t('topbar.profile.default');

	return (
		<div className={`top-bar ${lotteryRunning ? 'is-lottery-running' : ''}`}>
			<div className="lottery-controls">
				{loggedIn && (
					<>
						<div className="profile-selector" ref={dropdownRef}>
							<button
								type="button"
								className={`profile-selector-btn ${showDropdown ? 'is-open' : ''} ${switching ? 'is-switching' : ''}`}
								onClick={() => !lotteryRunning && !switching && setShowDropdown(!showDropdown)}
								disabled={lotteryRunning || switching}
							>
								{switching ? (
									<span className="profile-switching-spinner" aria-hidden="true" />
								) : (
									<>
										<span className="profile-name">{profileName}</span>
										<ChevronIcon open={showDropdown} />
									</>
								)}
							</button>
							{showDropdown && (
								<div className="profile-dropdown">
									<div className="profile-dropdown-header">{t('topbar.profile.switch')}</div>
									{profiles.map((p) => (
										<div
											key={p.id}
											className={`profile-dropdown-item ${p.id === activeProfileId ? 'is-active' : ''} ${lotteryRunning || switching ? 'is-disabled' : ''}`}
											onClick={() => handleSwitch(p.id)}
										>
											<span className="dropdown-item-label">{p.name}</span>
											{p.id === activeProfileId && <CheckIcon />}
										</div>
									))}
								</div>
							)}
						</div>

						<div className={`field keyword-field ${lotteryRunning ? 'is-disabled' : ''}`}>
							<span className="field-icon" aria-hidden="true">
								<svg viewBox="0 0 16 16" width="14" height="14">
									<path d="M2 3h12v8H6l-3 3v-3H2V3z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
								</svg>
							</span>
							<input
								type="text"
								className="field-input"
								placeholder={t('topbar.keywordPlaceholder')}
								value={keyword}
								onChange={(e) => onKeywordChange(e.target.value)}
								disabled={lotteryRunning}
							/>
						</div>

						<div className={`field stepper-field ${lotteryRunning ? 'is-disabled' : ''}`}>
							<button
								type="button"
								className="stepper-btn"
								onClick={() => stepCount(-1)}
								disabled={lotteryRunning || winnerCount <= 1}
								aria-label={t('topbar.countDec')}
							>
								−
							</button>
							<input
								type="text"
								inputMode="numeric"
								pattern="[0-9]*"
								className="stepper-input"
								value={winnerCount}
								onChange={(e) => {
									const v = e.target.value.replace(/\D/g, '');
									onWinnerCountChange(v === '' ? 1 : clampCount(parseInt(v)));
								}}
								onBlur={() => onWinnerCountChange(clampCount(winnerCount))}
								disabled={lotteryRunning}
								aria-label={t('topbar.countLabel')}
							/>
							<button
								type="button"
								className="stepper-btn"
								onClick={() => stepCount(1)}
								disabled={lotteryRunning || winnerCount >= 9999}
								aria-label={t('topbar.countInc')}
							>
								+
							</button>
						</div>
					</>
				)}
			</div>
			<Button variant="text" className={`btn-settings ${!loggedIn ? 'btn-settings-svg' : 'btn-settings-avatar'}`} onClick={() => !isSettingsOpen && onSettingsToggle()}>
				{loggedIn && userAvatar ? (
					<img src={formatAvatarUrl(userAvatar)} alt="Avatar" className="top-bar-avatar" />
				) : (
					<img src={settingsIcon} alt="Settings" className="top-bar-settings-icon" />
				)}
			</Button>
		</div>
	);
};
