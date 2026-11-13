import React from 'react';
import clsx from 'clsx';

/* Shared interaction primitives: one source for button/row/pill styling. */

const focusRing = 'outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-0';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	label: string;
	tone?: 'default' | 'danger' | 'success';
	size?: 'sm' | 'md';
}

export const IconButton: React.FC<IconButtonProps> = ({ label, tone = 'default', size = 'sm', className, children, ...rest }) => (
	<button
		{...rest}
		aria-label={label}
		className={clsx(
			'flex shrink-0 items-center justify-center rounded-small text-default-400 transition-colors',
			focusRing,
			size === 'sm' ? 'h-7 w-7' : 'h-9 w-9',
			tone === 'danger' && 'hover:bg-danger/10 hover:text-danger',
			tone === 'success' && 'hover:bg-success/10 hover:text-success',
			tone === 'default' && 'hover:bg-default-500/10 hover:text-foreground',
			className
		)}
		type="button"
	>
		{children}
	</button>
);

interface RowProps extends React.HTMLAttributes<HTMLDivElement> {
	children: React.ReactNode;
	active?: boolean;
}

export const Row: React.FC<RowProps> = ({ children, active, className, ...rest }) => (
	<div
		{...rest}
		className={clsx('flex min-h-11 items-center gap-2 rounded-medium px-2.5 transition-colors', active ? 'bg-primary/10' : 'well well-hover', className)}
	>
		{children}
	</div>
);

export const Pill: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
	<span className={clsx('rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-medium leading-none text-primary', className)}>
		{children}
	</span>
);

export const PrimaryButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ className, ...rest }) => (
	<button
		{...rest}
		className={clsx(
			'flex items-center justify-center gap-2 rounded-full bg-primary text-[13px] font-semibold text-primary-foreground',
			focusRing,
			'shadow-[0_14px_30px_-18px_hsl(var(--heroui-primary)/0.95)] transition duration-150',
			'hover:-translate-y-px active:translate-y-0 disabled:translate-y-0 disabled:opacity-50',
			className
		)}
		type="button"
	/>
);

export const GhostButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ className, ...rest }) => (
	<button
		{...rest}
		className={clsx(
			'flex items-center justify-center gap-2 rounded-full border border-default-200/70 text-[13px] font-medium text-default-600',
			focusRing,
			'transition-colors hover:bg-default-500/10 hover:text-foreground disabled:opacity-50',
			'dark:border-white/10 dark:text-default-400',
			className
		)}
		type="button"
	/>
);
