import React from 'react';
import { Button } from './Button';
import { WinnerDisplay } from './WinnerDisplay';
import startImg from '../assets/images/lottery-start.png';
import ingImg from '../assets/images/lottery-ing.png';
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
										<p className="loading-text">正在连接直播间...</p>
									</div>
								) : lotteryRunning ? (
									<img src={ingImg} alt="正在收集" className="lottery-image-btn btn-ing pulse" />
								) : (
									<img src={startImg} alt="开始抽奖" className="lottery-image-btn btn-start" />
								)}
							</div>
							<div className="lottery-hint-container">{lotteryRunning && <p className="lottery-hint">再按一下结束抽奖</p>}</div>
						</div>
					) : (
						<WinnerDisplay winners={winners} onReset={onReset} />
					)}
				</div>
			</div>
		</div>
	);
};
