import React from 'react';
import clsx from 'clsx';

import Icon from '@/components/icon';
import { CachedImage } from '@/components/image';
import { GhostButton } from '@/components/ui';
import { Section } from '@/features/settings/components/section';
import { useApp } from '@/contexts/app';
import { useI18n } from '@/i18n';
import { formatCount } from '@/utils/format';

export const AccountSection: React.FC = () => {
	const { t } = useI18n();
	const { account, loggedIn, logout } = useApp();
	const stats = [
		{ icon: 'groups' as const, label: t('settings.account.follower'), value: account?.follower },
		{ icon: 'person-add' as const, label: t('settings.account.following'), value: account?.following },
		{ icon: 'video-library' as const, label: t('settings.account.archives'), value: account?.archive_count },
		{ icon: 'play-circle' as const, label: t('settings.account.views'), value: account?.view_count },
		{ icon: 'thumb-up' as const, label: t('settings.account.likes'), value: account?.like_count },
	];

	return (
		<Section icon={<Icon name="person" size={16} />} title={t('settings.account.title')}>
			<div className="flex flex-col gap-3">
				<div className="relative overflow-hidden rounded-medium border border-default-200/40 dark:border-white/10">
					{loggedIn && account?.top_photo ? (
						<CachedImage
							aria-hidden
							alt=""
							className="absolute inset-0 h-full w-full scale-110 object-cover opacity-35 blur-2xl"
							fade={false}
							src={account.top_photo}
							wide={192}
						/>
					) : (
						<div aria-hidden className="absolute inset-0 bg-gradient-to-br from-primary/20 via-secondary/10 to-transparent" />
					)}
					<div aria-hidden className="absolute inset-0 bg-gradient-to-b from-transparent via-[hsl(var(--surface)/0.35)] to-[hsl(var(--surface)/0.92)]" />

					<div className="relative overflow-hidden">
						{loggedIn && account?.top_photo ? (
							<CachedImage alt="" className="absolute inset-0 h-full w-full object-cover" eager fade={false} src={account.top_photo} wide={384} />
						) : (
							<div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-secondary/15 to-default-200/30" />
						)}
						<div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/20 to-transparent" />
						<div className="relative flex items-end gap-3 px-3 pb-3 pt-16">
							{loggedIn && account?.face ? (
								<CachedImage
									alt={account.name}
									className="h-16 w-16 rounded-full border-[3px] border-white/90 object-cover shadow-[0_8px_20px_-10px_rgba(0,0,0,0.55)]"
									src={account.face}
									thumb={64}
								/>
							) : (
								<div className="flex h-16 w-16 items-center justify-center rounded-full border-[3px] border-white/90 bg-primary/15 text-primary shadow-sm">
									<Icon name="bilibili" size={26} />
								</div>
							)}
							<div className="min-w-0 flex-1 pb-1">
								<div className="flex items-center gap-1.5">
									<div className="font-a61 truncate text-[15px] font-semibold text-white drop-shadow">
										{loggedIn ? account?.name || '--' : t('settings.account.placeholder')}
									</div>
									{loggedIn && account?.level ? (
										<span className="shrink-0 rounded-full bg-primary px-1.5 py-0.5 font-mono text-[10px] font-semibold text-primary-foreground shadow-sm">
											Lv.{account.level}
										</span>
									) : null}
								</div>
								<div className="mt-0.5 font-mono text-[11px] text-white/75">UID {loggedIn ? account?.uid || '--' : '--'}</div>
							</div>
						</div>
					</div>

					<div className="relative px-3 pb-3 pt-2.5">
						{loggedIn && account?.sign ? (
							<p className="font-a61 line-clamp-2 rounded-medium bg-black/[0.04] px-2.5 py-1.5 text-[12px] leading-relaxed text-default-600 dark:bg-white/[0.06] dark:text-default-400">
								{account.sign}
							</p>
						) : null}

						{loggedIn && (
							<div className={clsx('grid grid-cols-5 gap-1.5', account?.sign && 'mt-2.5')}>
								{stats.map((item) => (
									<div
										key={item.label}
										className="flex min-w-0 flex-col items-center gap-0.5 rounded-medium bg-[hsl(var(--surface)/0.72)] px-0.5 py-2 shadow-[inset_0_0_0_1px_hsl(var(--surface-border))] backdrop-blur-sm"
									>
										<span className="text-primary">
											<Icon name={item.icon} size={14} />
										</span>
										<span className="font-a61 text-[12px] font-semibold tabular-nums text-foreground">{formatCount(item.value)}</span>
										<span className="truncate text-[10px] text-default-400">{item.label}</span>
									</div>
								))}
							</div>
						)}
					</div>
				</div>
				{loggedIn && (
					<GhostButton className="h-9 hover:border-danger/40 hover:text-danger" onClick={logout}>
						{t('settings.account.logout')}
					</GhostButton>
				)}
			</div>
		</Section>
	);
};

export default AccountSection;
