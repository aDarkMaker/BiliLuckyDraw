import React from 'react';
import clsx from 'clsx';

interface PanelProps extends React.HTMLAttributes<HTMLDivElement> {
	children: React.ReactNode;
}

export const Panel: React.FC<PanelProps> = ({ children, className, ...rest }) => (
	<div {...rest} className={clsx('surface rounded-large', className)}>
		{children}
	</div>
);

interface PanelHeaderProps {
	icon?: React.ReactNode;
	title: string;
	extra?: React.ReactNode;
	className?: string;
}

export const PanelHeader: React.FC<PanelHeaderProps> = ({ icon, title, extra, className }) => (
	<div className={clsx('flex shrink-0 items-center gap-2 px-4 pt-3.5', className)}>
		{icon && <span className="text-primary">{icon}</span>}
		<h2 className="text-[14px] font-semibold leading-none text-foreground">{title}</h2>
		{extra && <div className="ml-auto flex min-w-0 items-center gap-1.5">{extra}</div>}
	</div>
);

interface PanelBodyProps extends React.HTMLAttributes<HTMLDivElement> {
	children: React.ReactNode;
}

export const PanelBody = React.forwardRef<HTMLDivElement, PanelBodyProps>(({ children, className, ...rest }, ref) => (
	<div {...rest} ref={ref} className={clsx('p-4', className)}>
		{children}
	</div>
));
PanelBody.displayName = 'PanelBody';
