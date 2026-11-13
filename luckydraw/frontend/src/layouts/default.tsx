import React, { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { useLocation } from 'react-router-dom';

import { Backdrop } from '@/components/backdrop';
import Icon from '@/components/icon';
import { CachedImage } from '@/components/image';
import { useQuietScroll } from '@/components/scroll';
import Sidebar from '@/components/sidebar';
import SidebarFooter from '@/components/sidebar_footer';
import { siteConfig } from '@/config/site';
import { useApp } from '@/contexts/app';
import { useI18n } from '@/i18n';

const WIDE_QUERY = '(min-width: 1024px)';

export const DefaultLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const { t } = useI18n();
	const { account, loggedIn, logout } = useApp();
	const location = useLocation();
	const scrollRef = useQuietScroll<HTMLDivElement>();
	const [wide, setWide] = useState(() => window.matchMedia(WIDE_QUERY).matches);
	const [open, setOpen] = useState(() => window.matchMedia(WIDE_QUERY).matches);

	useEffect(() => {
		const query = window.matchMedia(WIDE_QUERY);
		const sync = (event: MediaQueryListEvent) => {
			setWide(event.matches);
			setOpen(event.matches);
		};
		query.addEventListener('change', sync);
		return () => query.removeEventListener('change', sync);
	}, []);

	const current = siteConfig.navItems.find((item) => item.href === location.pathname);
	const title = current ? t(current.labelKey) : siteConfig.name;

	useEffect(() => {
		scrollRef.current?.scrollTo({ top: 0 });
		if (!wide) setOpen(false);
	}, [location.pathname, wide]);

	return (
		<div className="relative flex h-screen overflow-hidden bg-background text-foreground">
			<Backdrop />

			{wide ? (
				<Sidebar open={open}>
					<SidebarFooter loggedIn={loggedIn} onLogout={logout} />
				</Sidebar>
			) : (
				<>
					<div
						className={clsx(
							'fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-200',
							open ? 'opacity-100' : 'pointer-events-none opacity-0'
						)}
						onClick={() => setOpen(false)}
					/>
					<div
						className={clsx(
							'fixed inset-y-0 left-0 z-50 border-r border-default-500/10 transition-transform duration-300 ease-out',
							open ? 'translate-x-0' : '-translate-x-full'
						)}
					>
						<Sidebar open>
							<SidebarFooter loggedIn={loggedIn} onLogout={logout} />
						</Sidebar>
					</div>
				</>
			)}

			<div className="relative z-10 flex min-w-0 flex-1 flex-col">
				<header className="flex h-14 shrink-0 items-center gap-2 px-3 md:px-6">
					<button
						aria-label={t('sidebar.toggle')}
						className="flex h-9 w-9 items-center justify-center rounded-medium text-default-500 outline-none transition-colors hover:bg-default-500/10 hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary/40"
						type="button"
						onClick={() => setOpen((v) => !v)}
					>
						{open ? <Icon name="menu-open" size={19} /> : <Icon name="menu" size={19} />}
					</button>
					<h1 className="text-[16px] font-semibold tracking-tight text-foreground">{title}</h1>
					{loggedIn && account && (
						<div className="ml-auto flex items-center gap-2 rounded-full border border-default-500/10 bg-content1/60 py-1 pl-1 pr-3 backdrop-blur-xl">
							{account.face ? (
								<CachedImage alt={account.name} className="h-6 w-6 rounded-full object-cover" src={account.face} thumb={24} />
							) : (
								<div className="h-6 w-6 rounded-full bg-primary/20" />
							)}
							<span className="font-a61 hidden max-w-[9rem] truncate text-[12px] font-medium text-default-600 sm:inline dark:text-default-400">
								{account.name}
							</span>
						</div>
					)}
				</header>

				<div ref={scrollRef} className="scroll-quiet min-h-0 flex-1 overflow-y-auto px-3 pb-6 md:px-6">
					{children}
				</div>
			</div>
		</div>
	);
};

export default DefaultLayout;
