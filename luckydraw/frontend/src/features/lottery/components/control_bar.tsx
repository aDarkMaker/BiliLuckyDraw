import React from 'react';
import clsx from 'clsx';
import { Input } from '@heroui/react';

import Icon from '@/components/icon';
import { fieldClassNames } from '@/components/field';
import { useI18n } from '@/i18n';

interface ControlBarProps {
	keyword: string;
	winnerCount: number;
	running: boolean;
	connecting: boolean;
	showResults: boolean;
	onKeywordChange: (value: string) => void;
	onWinnerCountChange: (value: number) => void;
	onToggle: () => void;
	onReset: () => void;
}

const clamp = (n: number) => Math.max(1, Math.min(9999, n || 1));

const labelClass = 'text-[12px] text-default-500';

const controlFieldClassNames = {
	...fieldClassNames,
	base: 'gap-0',
	label: 'hidden',
};

export const ControlBar: React.FC<ControlBarProps> = ({
	keyword,
	winnerCount,
	running,
	connecting,
	showResults,
	onKeywordChange,
	onWinnerCountChange,
	onToggle,
	onReset,
}) => {
	const { t } = useI18n();
	const primary = showResults;

	return (
		<div className="surface rounded-large p-3">
			<div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_10rem_auto] sm:items-end">
				<div className="flex min-w-0 flex-col gap-1">
					<span className={labelClass}>{t('lottery.keyword.label')}</span>
					<Input
						aria-label={t('lottery.keyword.label')}
						className="min-w-0"
						classNames={controlFieldClassNames}
						isClearable
						isDisabled={running}
						placeholder={t('lottery.keyword.placeholder')}
						radius="md"
						value={keyword}
						onClear={() => onKeywordChange('')}
						onValueChange={onKeywordChange}
					/>
				</div>

				<div className="flex min-w-0 flex-col gap-1">
					<span className={labelClass}>{t('lottery.count.label')}</span>
					<div className="flex h-11 items-center justify-between gap-0.5 rounded-medium border border-default-200/60 bg-content1/70 px-1 backdrop-blur-xl dark:border-white/10 dark:bg-content2/60">
						<button
							aria-label={t('lottery.count.dec')}
							className="flex h-8 w-8 shrink-0 items-center justify-center rounded-small text-default-500 outline-none transition-colors hover:bg-default-500/10 hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-40"
							disabled={running || winnerCount <= 1}
							type="button"
							onClick={() => onWinnerCountChange(clamp(winnerCount - 1))}
						>
							<Icon name="remove" size={15} />
						</button>
						<input
							aria-label={t('lottery.count.label')}
							className="min-w-0 flex-1 bg-transparent text-center font-mono text-[15px] font-medium tabular-nums text-foreground outline-none"
							disabled={running}
							inputMode="numeric"
							value={winnerCount}
							onBlur={() => onWinnerCountChange(clamp(winnerCount))}
							onChange={(e) => {
								const digits = e.target.value.replace(/\D/g, '');
								onWinnerCountChange(digits === '' ? 1 : clamp(Number(digits)));
							}}
						/>
						<button
							aria-label={t('lottery.count.inc')}
							className="flex h-8 w-8 shrink-0 items-center justify-center rounded-small text-default-500 outline-none transition-colors hover:bg-default-500/10 hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-40"
							disabled={running || winnerCount >= 9999}
							type="button"
							onClick={() => onWinnerCountChange(clamp(winnerCount + 1))}
						>
							<Icon name="add" size={15} />
						</button>
					</div>
				</div>

				<button
					className={clsx(
						'flex h-11 w-full shrink-0 items-center justify-center gap-2 rounded-full px-5 text-[13.5px] font-semibold outline-none transition duration-150 sm:w-auto',
						'focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-50',
						primary
							? 'border border-default-200/70 text-default-600 hover:bg-default-500/10 hover:text-foreground dark:border-white/10 dark:text-default-400'
							: 'bg-primary text-primary-foreground shadow-[0_14px_30px_-18px_hsl(var(--heroui-primary)/0.95)] hover:-translate-y-px active:translate-y-0'
					)}
					disabled={connecting}
					type="button"
					onClick={primary ? onReset : onToggle}
				>
					<Icon name={primary ? 'refresh' : running ? 'stop-circle' : 'redeem'} size={16} />
					{primary ? t('winner.again') : running ? t('lottery.stop') : t('lottery.start')}
				</button>
			</div>
		</div>
	);
};

export default ControlBar;
