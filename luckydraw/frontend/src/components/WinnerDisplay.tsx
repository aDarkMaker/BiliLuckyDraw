import React from 'react';
import { Button } from './Button';
import { useI18n } from '../i18n';
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
	const { t } = useI18n();
	return (
		<div className="winners-display">
			<h2 className="winners-title">{t('winner.title')}</h2>
			<div className="winners-list">
				{winners.map((winner, index) => (
					<div key={winner.uid} className="winner-card">
						<div className="winner-rank">#{index + 1}</div>
						<div className="winner-info">
							<div className="winner-name">{winner.username}</div>
							<div className="winner-uid">{t('winner.uid', { uid: winner.uid })}</div>
						</div>
					</div>
				))}
			</div>
			<Button variant="secondary" className="btn-reset" onClick={onReset}>
				{t('winner.again')}
			</Button>
		</div>
	);
};
