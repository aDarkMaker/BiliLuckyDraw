import React, { useState } from 'react';
import clsx from 'clsx';

import Icon, { type IconName } from '@/components/icon';
import { AppearanceSection } from '@/features/settings/components/appearance_section';
import { HistorySection } from '@/features/settings/components/history_section';
import { AccountSection } from '@/features/settings/components/account_section';
import { ProfilesSection } from '@/features/settings/components/profiles_section';
import { RoomsSection } from '@/features/settings/components/rooms_section';
import { useApp } from '@/contexts/app';
import { useI18n } from '@/i18n';
import { useTheme } from '@/theme';
import { errorMessage } from '@/utils/json';
import { prepareBackground } from '@/utils/image';

type TabKey = 'account' | 'appearance' | 'lottery' | 'history';

const TABS: { key: TabKey; labelKey: string; icon: IconName }[] = [
	{ key: 'account', labelKey: 'settings.tab.account', icon: 'person' },
	{ key: 'appearance', labelKey: 'settings.tab.appearance', icon: 'palette' },
	{ key: 'lottery', labelKey: 'settings.tab.lottery', icon: 'checklist' },
	{ key: 'history', labelKey: 'settings.tab.history', icon: 'history' },
];

export const SettingsPage: React.FC = () => {
	const { t } = useI18n();
	const { applyBackground, notify } = useApp();
	const { customImage, setCustomImage, setPreset } = useTheme();
	const [tab, setTab] = useState<TabKey>('account');
	const [mounted, setMounted] = useState<TabKey[]>(['account']);

	const open = (key: TabKey) => {
		setTab(key);
		setMounted((prev) => (prev.includes(key) ? prev : [...prev, key]));
	};

	const selectImage = async (dataUrl: string, blob?: Blob) => {
		try {
			await applyBackground(dataUrl, blob);
			setCustomImage(dataUrl);
			setPreset('none');
			notify(t('settings.toast.backgroundSet'));
		} catch (error) {
			notify(t('settings.toast.backgroundFailed', { error: errorMessage(error) }));
		}
	};

	const selectFile = async (file: File) => {
		try {
			const prepared = await prepareBackground(file);
			await selectImage(prepared.dataUrl, prepared.blob);
		} catch (error) {
			notify(t('settings.toast.backgroundFailed', { error: errorMessage(error) }));
		}
	};

	const clearImage = async () => {
		try {
			await applyBackground('');
			setCustomImage('');
			notify(t('settings.toast.backgroundCleared'));
		} catch (error) {
			notify(t('settings.toast.backgroundFailed', { error: errorMessage(error) }));
		}
	};

	const panels: Record<TabKey, React.ReactNode> = {
		account: <AccountSection />,
		appearance: <AppearanceSection customImage={customImage} onClearImage={clearImage} onPickFile={selectFile} />,
		lottery: (
			<div className="flex flex-col gap-3">
				<ProfilesSection />
				<RoomsSection />
			</div>
		),
		history: <HistorySection />,
	};

	return (
		<div className="mx-auto grid w-full max-w-[68rem] gap-3 md:grid-cols-[13rem_minmax(0,1fr)] md:items-start">
			<nav className="surface flex h-fit flex-row gap-1 overflow-x-auto rounded-large p-1.5 md:flex-col">
				{TABS.map((item) => (
					<button
						key={item.key}
						aria-current={tab === item.key ? 'page' : undefined}
						className={clsx(
							'flex h-9 flex-1 items-center justify-center gap-2 rounded-medium text-[12.5px] font-medium transition-colors md:flex-none md:justify-start md:px-3',
							tab === item.key
								? 'bg-primary/10 text-primary'
								: 'text-default-500 hover:bg-default-500/10 hover:text-foreground'
						)}
						type="button"
						onClick={() => open(item.key)}
					>
						<Icon name={item.icon} size={16} />
						<span className="hidden sm:inline">{t(item.labelKey)}</span>
					</button>
				))}
			</nav>

			<div className="min-w-0">
				{TABS.map((item) => (
					<div key={item.key} className={clsx(tab !== item.key && 'hidden')}>
						{mounted.includes(item.key) ? panels[item.key] : null}
					</div>
				))}
			</div>
		</div>
	);
};

export default SettingsPage;
