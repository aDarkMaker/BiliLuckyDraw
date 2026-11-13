import React from 'react';
import clsx from 'clsx';

interface StatProps {
	value: React.ReactNode;
	label: string;
	highlight?: boolean;
}

export const Stat: React.FC<StatProps> = ({ value, label, highlight }) => (
	<div className="surface flex flex-col items-center justify-center gap-1 rounded-large px-2 py-3">
		<span
			className={clsx(
				'font-mono text-xl leading-none tabular-nums md:text-2xl',
				highlight ? 'text-primary' : 'text-foreground'
			)}
		>
			{value}
		</span>
		<span className="whitespace-nowrap text-[11px] text-default-400">{label}</span>
	</div>
);

export default Stat;
