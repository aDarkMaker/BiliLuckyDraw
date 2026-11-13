import React from 'react';
import clsx from 'clsx';
import { AnimatePresence, motion } from 'framer-motion';

import Icon from '@/components/icon';
import { useI18n } from '@/i18n';
import type { HistoryRecord } from '@/types';

interface HistoryRecordItemProps {
	record: HistoryRecord;
	open: boolean;
	onToggle: () => void;
	onExport: () => void;
	onRemove: () => void;
}

const formatTime = (time: string, lang: string) => {
	const date = new Date(time);
	return Number.isNaN(date.getTime()) ? time : date.toLocaleString(lang === 'zh' ? 'zh-CN' : 'en-US');
};

export const HistoryRecordItem: React.FC<HistoryRecordItemProps> = ({ record, open, onToggle, onExport, onRemove }) => {
	const { t, lang } = useI18n();

	return (
		<div className="overflow-hidden rounded-medium bg-default-500/[0.05] dark:bg-white/[0.045]">
			<button className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left" type="button" onClick={onToggle}>
				<span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-primary/10 px-1.5 font-mono text-[11px] tabular-nums text-primary">
					{record.winner_count}
				</span>
				<span className="font-a61 min-w-0 flex-1 truncate text-[12.5px] text-default-600 dark:text-default-400">
					{t('settings.history.meta', {
						time: formatTime(record.time, lang),
						keyword: record.keyword || t('settings.history.noKeyword'),
					})}
				</span>
				<Icon name="expand-more" className={clsx('shrink-0 text-default-400 transition-transform duration-200', open && 'rotate-180')} size={16} />
			</button>

			<AnimatePresence initial={false}>
				{open && (
					<motion.div
						animate={{ height: 'auto', opacity: 1 }}
						className="overflow-hidden"
						exit={{ height: 0, opacity: 0 }}
						initial={{ height: 0, opacity: 0 }}
						transition={{ duration: 0.2, ease: 'easeOut' }}
					>
						<div className="flex flex-col gap-1 px-3 pb-2.5">
							{record.winners.map((winner) => (
								<div key={winner.uid} className="flex items-center gap-2 text-[12px]">
									<span className="font-a61 truncate text-foreground">{winner.username || '--'}</span>
									<span className="ml-auto font-mono text-[10.5px] text-default-400">UID {winner.uid}</span>
								</div>
							))}
							{record.winners.length === 0 && <p className="text-[11.5px] text-default-400">{t('settings.history.noWinners')}</p>}
							<div className="mt-1.5 flex gap-1.5">
								<button
									className="flex h-7 items-center gap-1 rounded-full border border-default-200/70 px-2.5 text-[11px] text-default-500 transition-colors hover:text-foreground dark:border-white/10"
									type="button"
									onClick={onExport}
								>
									<Icon name="download" size={12} />
									{t('settings.history.export')}
								</button>
								<button
									className="flex h-7 items-center gap-1 rounded-full px-2.5 text-[11px] text-default-500 transition-colors hover:bg-danger/10 hover:text-danger"
									type="button"
									onClick={onRemove}
								>
									<Icon name="delete" size={12} />
									{t('settings.lottery.delete')}
								</button>
							</div>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
};

export default HistoryRecordItem;
