import React from 'react';

import Icon from '@/components/icon';
import { useI18n } from '@/i18n';
import { useTheme } from '@/theme';

interface SidebarFooterProps {
	loggedIn: boolean;
	onLogout: () => void;
}

const base =
	'flex h-10 w-full items-center gap-3 rounded-medium px-3 text-[13px] font-medium text-default-600 outline-none transition-colors duration-150 hover:bg-default-500/10 hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary/40 dark:text-default-400';

export const SidebarFooter: React.FC<SidebarFooterProps> = ({ loggedIn, onLogout }) => {
	const { t } = useI18n();
	const { isDark, toggleMode } = useTheme();

	return (
		<div className="flex flex-col gap-1 border-t border-default-500/10 pt-3">
			<button aria-label={t('sidebar.theme')} className={base} type="button" onClick={toggleMode}>
				<Icon name={isDark ? 'light-mode' : 'dark-mode'} size={17} />
				{t('sidebar.theme')}
			</button>
			{loggedIn && (
				<button aria-label={t('sidebar.logout')} className={base} type="button" onClick={onLogout}>
					<Icon name="logout" size={17} />
					{t('sidebar.logout')}
				</button>
			)}
		</div>
	);
};

export default SidebarFooter;
