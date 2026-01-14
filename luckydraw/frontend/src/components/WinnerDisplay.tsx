import React from 'react';
import { Button } from './Button';
import '../styles/WinnerDisplay.css';

interface Winner {
	uid: number;
	username: string;
	count: number;
}

interface WinnerDisplayProps {
	winners: Winner[];
	onReset: () => void;
}

export const WinnerDisplay: React.FC<WinnerDisplayProps> = ({ winners, onReset }) => {
	return (
		<div className="winners-display">
			<h2 className="winners-title">恭喜中奖</h2>
			<div className="winners-list">
				{winners.map((winner, index) => (
					<div key={winner.uid} className="winner-card">
						<div className="winner-rank">#{index + 1}</div>
						<div className="winner-info">
							<div className="winner-name">{winner.username}</div>
							<div className="winner-uid">UID: {winner.uid}</div>
						</div>
					</div>
				))}
			</div>
			<Button variant="secondary" className="btn-reset" onClick={onReset}>
				我觉得这次能行！
			</Button>
		</div>
	);
};
