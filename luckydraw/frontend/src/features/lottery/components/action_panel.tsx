import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import Icon from '@/components/icon';
import { Panel } from '@/components/panel';
import { useI18n } from '@/i18n';

interface ActionPanelProps {
	running: boolean;
	connecting: boolean;
	participantCount: number;
	keyword: string;
}

export const ActionPanel: React.FC<ActionPanelProps> = ({ running, connecting, participantCount, keyword }) => {
	const { t } = useI18n();

	const status = connecting
		? t('lottery.connecting')
		: running
			? participantCount > 0
				? t('lottery.participants', { n: participantCount })
				: t('lottery.waiting')
			: t('lottery.idle');

	return (
		<Panel className="flex min-h-[11rem] flex-1 flex-col items-center justify-center overflow-hidden">
			<div className="relative flex w-full flex-1 flex-col items-center justify-center gap-3 px-4 py-7">
				<div className="pointer-events-none absolute inset-x-0 top-1/2 -z-0 h-36 -translate-y-1/2 bg-[radial-gradient(ellipse_at_center,hsl(var(--heroui-primary)/0.14),transparent_70%)]" />

				<div className="z-10 flex flex-col items-center gap-2">
					<span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
						<Icon name={running ? 'redeem' : 'live-tv'} size={24} />
					</span>
					<span className="text-[14px] font-semibold text-foreground">
						{connecting ? t('lottery.connecting') : running ? t('lottery.collecting') : t('lottery.start')}
					</span>
				</div>

				<AnimatePresence mode="wait">
					<motion.span
						key={status}
						animate={{ opacity: 1, y: 0 }}
						className="font-a61 z-10 text-[12px] text-default-400"
						exit={{ opacity: 0, y: -4 }}
						initial={{ opacity: 0, y: 4 }}
						transition={{ duration: 0.18 }}
					>
						{status}
					</motion.span>
				</AnimatePresence>

				<div className="font-a61 z-10 flex items-center gap-2 text-[11px] text-default-400">
					<span className="h-1.5 w-1.5 rounded-full bg-secondary" />
					{keyword.trim() ? t('lottery.mode.keyword', { keyword: keyword.trim() }) : t('lottery.mode.all')}
				</div>
			</div>
		</Panel>
	);
};

export default ActionPanel;
