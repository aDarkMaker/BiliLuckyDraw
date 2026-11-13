import type { IconName } from '@/components/icon';

export interface NavItem {
	labelKey: string;
	href: string;
	icon: IconName;
}

export const siteConfig = {
	name: 'BiliLuckyDraw',
	tagline: 'Bilibili Live Draw',
	navItems: [
		{ labelKey: 'nav.lottery', href: '/', icon: 'redeem' },
		{ labelKey: 'nav.settings', href: '/settings', icon: 'settings' },
	] as NavItem[],
};
