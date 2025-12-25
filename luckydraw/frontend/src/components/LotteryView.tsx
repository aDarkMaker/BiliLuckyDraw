import React from 'react';
import { Button } from './Button';
import { WinnerDisplay } from './WinnerDisplay';
import './LotteryView.css';

interface Winner {
	uid: number;
	username: string;
	count: number;
}

interface LotteryViewProps {
	lotteryRunning: boolean;
	participantCount: number;
	showResults: boolean;
	winners: Winner[];
	onStartLottery: () => void;
	onReset: () => void;
}

export const LotteryView: React.FC<LotteryViewProps> = ({ lotteryRunning, participantCount, showResults, winners, onStartLottery, onReset }) => {
	return (
		<div className="lottery-view">
			<div className="lottery-view-content">
				<div className="lottery-main">
					{!showResults ? (
						<>
							<Button variant="primary" className={`btn-lottery ${lotteryRunning ? 'btn-running' : ''}`} onClick={onStartLottery}>
								{lotteryRunning ? <>正在收集... ({participantCount}人)</> : '开始抽奖'}
							</Button>
							{lotteryRunning && <p className="lottery-hint">再按一下结束抽奖</p>}
						</>
					) : (
						<WinnerDisplay winners={winners} onReset={onReset} />
					)}
				</div>
			</div>
		</div>
	);
};
