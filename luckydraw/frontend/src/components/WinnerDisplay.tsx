import React from 'react';
import { Button } from './Button';
import { useI18n } from '../i18n';
import { AppService } from '../../bindings/luckydraw/internal/app';
import '../styles/WinnerDisplay.css';

interface Winner {
	uid: number;
	username: string;
	count: number;
}

interface WinnerDisplayProps {
	winners: Winner[];
	onReset: () => void;
	onMessage?: (message: string) => void;
}

export const WinnerDisplay: React.FC<WinnerDisplayProps> = ({ winners, onReset, onMessage }) => {
	const { t } = useI18n();

	const handleCopy = async () => {
		const text = winners.map((w, i) => `${i + 1}. ${w.username} (UID: ${w.uid})`).join('\n');
		try {
			await AppService.CopyText(text);
			onMessage?.(t('winner.copied'));
		} catch {
			onMessage?.(t('winner.copyFailed'));
		}
	};

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
			<div className="winner-actions">
				<Button variant="secondary" className="btn-reset" onClick={handleCopy}>
					{t('winner.copy')}
				</Button>
				<Button variant="secondary" className="btn-reset" onClick={onReset}>
					{t('winner.again')}
				</Button>
			</div>
		</div>
	);
};
