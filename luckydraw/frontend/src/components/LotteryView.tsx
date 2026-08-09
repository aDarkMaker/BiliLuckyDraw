import React from 'react';
import { Button } from './Button';
import { WinnerDisplay } from './WinnerDisplay';
import { useThemeImage } from '../themes';
import { useI18n } from '../i18n';
import '../styles/LotteryView.css';

interface Winner {
	uid: number;
	username: string;
	count: number;
}

interface LotteryViewProps {
	lotteryRunning: boolean;
	isConnecting: boolean;
	participantCount: number;
	showResults: boolean;
	winners: Winner[];
	onStartLottery: () => void;
	onReset: () => void;
}

export const LotteryView: React.FC<LotteryViewProps> = ({
	lotteryRunning,
	isConnecting,
	participantCount,
	showResults,
	winners,
	onStartLottery,
	onReset,
}) => {
	const { t } = useI18n();
	const startImg = useThemeImage('lottery-start');
	const ingImg = useThemeImage('lottery-ing');

	return (
		<div className="lottery-view">
			<div className="lottery-view-content">
				<div className="lottery-main">
					{!showResults ? (
						<div className="lottery-action-area">
							<div
								className={`lottery-button-container ${isConnecting ? 'is-connecting' : ''}`}
								onClick={!isConnecting ? onStartLottery : undefined}
							>
								{isConnecting ? (
									<div className="loading-container">
										<span className="loading-spinner"></span>
										<p className="loading-text">{t('lottery.connecting')}</p>
									</div>
								) : lotteryRunning ? (
									ingImg ? (
										<img src={ingImg} alt={t('lottery.alt.collecting')} className="lottery-image-btn btn-ing pulse" />
									) : (
										<div className="lottery-css-btn pulse">
											<span className="lottery-css-btn-icon">
												<svg viewBox="0 0 16 16" width="18" height="18" aria-hidden="true">
													<circle cx="8" cy="8" r="3.5" fill="currentColor" />
												</svg>
											</span>
											{t('lottery.collecting')}
										</div>
									)
								) : startImg ? (
									<img src={startImg} alt={t('lottery.alt.start')} className="lottery-image-btn btn-start" />
								) : (
									<div className="lottery-css-btn">
										<span className="lottery-css-btn-icon">
											<svg viewBox="0 0 16 16" width="18" height="18" aria-hidden="true">
												<path d="M4 3l9 5-9 5V3z" fill="currentColor" />
											</svg>
										</span>
										{t('lottery.start')}
									</div>
								)}
							</div>
							<div className="lottery-hint-container">{lotteryRunning && <p className="lottery-hint">{t('lottery.hint')}</p>}</div>
						</div>
					) : (
						<WinnerDisplay winners={winners} onReset={onReset} />
					)}
				</div>
			</div>
		</div>
	);
};
