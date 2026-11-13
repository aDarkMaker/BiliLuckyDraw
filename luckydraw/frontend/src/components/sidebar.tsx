import React from 'react';
import clsx from 'clsx';
import { NavLink } from 'react-router-dom';

import Icon from '@/components/icon';
import Logo from '@/components/logo';
import { siteConfig } from '@/config/site';
import { useI18n } from '@/i18n';

interface SidebarProps {
	open: boolean;
	children: React.ReactNode;
}

const SidebarNav: React.FC = () => {
	const { t } = useI18n();

	return (
		<nav className="flex flex-col gap-1">
			{siteConfig.navItems.map((item) => (
				<NavLink
					key={item.href}
					className={({ isActive }) =>
						clsx(
							'group relative flex h-10 items-center gap-3 rounded-medium px-3 text-[13.5px] font-medium transition-colors duration-150',
							'outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
							isActive ? 'bg-primary/10 text-primary' : 'text-default-600 hover:bg-default-500/10 hover:text-foreground dark:text-default-400'
						)
					}
					to={item.href}
				>
					{({ isActive }) => (
						<>
							<span
								className={clsx(
									'absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-full bg-primary transition-opacity duration-150',
									isActive ? 'opacity-100' : 'opacity-0'
								)}
							/>
							<Icon name={item.icon} size={17} />
							<span className="truncate">{t(item.labelKey)}</span>
						</>
					)}
				</NavLink>
			))}
		</nav>
	);
};

export const Sidebar: React.FC<SidebarProps> = ({ open, children }) => (
	<aside
		className={clsx(
			'relative z-30 flex h-full shrink-0 flex-col overflow-hidden border-r border-default-500/10 sidebar-surface',
			'transition-[width] duration-300 ease-out',
			open ? 'w-[15rem]' : 'w-0'
		)}
	>
		<div className="flex h-full w-[15rem] flex-col gap-5 px-3 py-4">
			<div className="flex items-center gap-2.5 px-1.5">
				<Logo size={32} />
				<div className="min-w-0">
					<div className="truncate text-[14.5px] font-semibold leading-tight text-foreground">{siteConfig.name}</div>
					<div className="truncate text-[10.5px] leading-tight text-default-400">{siteConfig.tagline}</div>
				</div>
			</div>
			<SidebarNav />
			<div className="mt-auto">{children}</div>
		</div>
	</aside>
);

export default Sidebar;
