import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import Icon from '@/components/icon';
import { Panel, PanelBody, PanelHeader } from '@/components/panel';
import { useQuietScroll } from '@/components/scroll';
import { useI18n } from '@/i18n';
import type { Winner } from '@/types';

interface WinnersPanelProps {
	winners: Winner[];
	onCopy: () => void;
}

export const WinnersPanel: React.FC<WinnersPanelProps> = ({ winners, onCopy }) => {
	const { t } = useI18n();
	const listRef = useQuietScroll<HTMLDivElement>();

	return (
		<Panel className="flex min-h-0 w-full flex-1 flex-col overflow-hidden">
			<PanelHeader
				icon={<Icon name="emoji-events" size={16} />}
				title={t('winner.title')}
				extra={
					<span className="rounded-full bg-primary/10 px-2 py-1 font-mono text-[11px] text-primary">{winners.length}</span>
				}
			/>
			<PanelBody className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
				<div ref={listRef} className="scroll-quiet flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto overscroll-contain pr-1">
					<AnimatePresence initial={false}>
						{winners.map((winner, index) => (
							<motion.div
								key={winner.uid}
								animate={{ opacity: 1, y: 0 }}
								className="well flex items-center gap-3 rounded-medium px-3 py-2.5"
								initial={{ opacity: 0, y: 6 }}
								transition={{ delay: Math.min(index * 0.03, 0.4), duration: 0.22, ease: 'easeOut' }}
							>
								<span className="w-7 shrink-0 font-mono text-[13px] tabular-nums text-primary">{index + 1}</span>
								<div className="min-w-0 flex-1">
									<div className="font-a61 truncate text-[13.5px] font-medium leading-tight text-foreground">
										{winner.username}
									</div>
									<div className="mt-0.5 font-mono text-[11px] leading-none text-default-400">
										{t('winner.uid', { uid: winner.uid })}
									</div>
								</div>
							</motion.div>
						))}
					</AnimatePresence>
				</div>
				<button
					className="flex h-9 shrink-0 items-center justify-center gap-2 rounded-full border border-default-200/70 text-[12.5px] font-medium text-default-600 outline-none transition-colors hover:bg-default-500/10 hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary/40 dark:border-white/10 dark:text-default-400"
					type="button"
					onClick={onCopy}
				>
					<Icon name="content-copy" size={15} />
					{t('winner.copy')}
				</button>
			</PanelBody>
		</Panel>
	);
};

export default WinnersPanel;
