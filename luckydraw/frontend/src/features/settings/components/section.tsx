import React from 'react';
import clsx from 'clsx';

interface SectionProps {
	icon?: React.ReactNode;
	title: string;
	description?: string;
	action?: React.ReactNode;
	children: React.ReactNode;
}

export const Section: React.FC<SectionProps> = ({ icon, title, description, action, children }) => (
	<section className="surface rounded-large">
		<div className="px-4 pt-3.5">
			<div className="flex items-center gap-2">
				{icon && <span className="inline-flex shrink-0 text-primary">{icon}</span>}
				<h2 className="shrink-0 text-[14px] font-semibold leading-none text-foreground">{title}</h2>
				{description && <p className="min-w-0 flex-1 truncate text-[11.5px] leading-none text-default-400">{description}</p>}
				{!description && <div className="min-w-0 flex-1" />}
				{action}
			</div>
		</div>
		<div className="p-4 pt-3">{children}</div>
	</section>
);

interface SegmentedProps<T extends string> {
	value: T;
	options: { value: T; label: string }[];
	onChange: (value: T) => void;
	disabled?: boolean;
}

export const Segmented = <T extends string>({ value, options, onChange, disabled }: SegmentedProps<T>) => (
	<div className="flex gap-1 rounded-medium bg-default-500/[0.07] p-1 dark:bg-white/[0.06]">
		{options.map((option) => (
			<button
				key={option.value}
				className={clsx(
					'flex h-8 flex-1 items-center justify-center rounded-small text-[12.5px] font-medium transition-colors',
					option.value === value
						? 'bg-content1 text-primary shadow-sm dark:bg-default-200/80'
						: 'text-default-500 hover:text-foreground'
				)}
				disabled={disabled}
				type="button"
				onClick={() => onChange(option.value)}
			>
				{option.label}
			</button>
		))}
	</div>
);
