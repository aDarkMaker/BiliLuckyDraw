import React, { useState } from 'react';
import { Input, Spinner } from '@heroui/react';
import clsx from 'clsx';

import Icon from '@/components/icon';
import { fieldClassNames } from '@/components/field';
import { GhostButton, IconButton, Pill, PrimaryButton } from '@/components/ui';
import { Section } from '@/features/settings/components/section';
import { useApp } from '@/contexts/app';
import { useI18n } from '@/i18n';

export const ProfilesSection: React.FC = () => {
	const { t } = useI18n();
	const { profiles, activeProfileId, running, switchProfile, createProfile, deleteProfile, renameProfile, notify } = useApp();
	const [name, setName] = useState('');
	const [editingId, setEditingId] = useState('');
	const [draft, setDraft] = useState('');
	const [switchingId, setSwitchingId] = useState('');

	const create = async () => {
		const trimmed = name.trim();
		if (!trimmed) {
			notify(t('settings.toast.profileNameEmpty'));
			return;
		}
		await createProfile(trimmed);
		setName('');
		notify(t('settings.toast.profileCreated', { name: trimmed }));
	};

	const remove = async (id: string) => {
		if (profiles.length <= 1) {
			notify(t('settings.toast.profileKeepOne'));
			return;
		}
		await deleteProfile(id);
		notify(t('settings.toast.profileDeleted'));
	};

	const commitRename = async () => {
		if (!draft.trim()) return;
		await renameProfile(editingId, draft.trim());
		setEditingId('');
		setDraft('');
	};

	const select = (id: string) => {
		if (running || switchingId || id === activeProfileId) return;
		setSwitchingId(id);
		void switchProfile(id).finally(() => setSwitchingId(''));
	};

	return (
		<Section icon={<Icon name="checklist" size={16} />} title={t('settings.lottery.title')}>
			<div className="flex flex-col gap-2.5">
				<div className="flex gap-2">
					<Input
						className="flex-1"
						classNames={fieldClassNames}
						placeholder={t('settings.lottery.newNamePlaceholder')}
						radius="md"
						value={name}
						onKeyDown={(e) => {
							if (e.key === 'Enter') create();
						}}
						onValueChange={setName}
					/>
					<PrimaryButton aria-label={t('settings.lottery.create')} className="h-11 w-11" onClick={create}>
						<Icon name="add" size={18} />
					</PrimaryButton>
				</div>

				<div className="flex flex-col gap-1.5">
					{profiles.map((profile) => {
						const active = profile.id === activeProfileId;

						if (editingId === profile.id) {
							return (
								<div key={profile.id} className="flex items-center gap-2 rounded-medium border border-primary/40 bg-primary/[0.06] p-1.5 pl-2.5">
									<Input
										className="flex-1"
										classNames={fieldClassNames}
										radius="sm"
										size="sm"
										value={draft}
										onKeyDown={(e) => {
											if (e.key === 'Enter') commitRename();
											if (e.key === 'Escape') setEditingId('');
										}}
										onValueChange={setDraft}
									/>
									<IconButton label={t('common.confirm')} tone="success" onClick={commitRename}>
										<Icon name="check" size={15} />
									</IconButton>
									<GhostButton className="h-7 border-0 px-2 text-[11.5px]" onClick={() => setEditingId('')}>
										{t('common.cancel')}
									</GhostButton>
								</div>
							);
						}

						return (
							<div
								key={profile.id}
								className={clsx(
									'group flex items-center gap-2 rounded-medium border p-1.5 pl-2.5 transition-colors',
									active
										? 'border-primary/40 bg-primary/[0.07]'
										: 'border-default-200/50 bg-default-500/[0.04] hover:border-primary/25 dark:border-white/10 dark:bg-white/[0.035]'
								)}
							>
								<button
									className="flex min-w-0 flex-1 items-center gap-2.5 py-1 text-left disabled:cursor-default"
									disabled={running || Boolean(switchingId)}
									type="button"
									onClick={() => select(profile.id)}
								>
									{switchingId === profile.id ? (
										<Spinner size="sm" />
									) : (
										<span className={clsx('h-1.5 w-1.5 shrink-0 rounded-full', active ? 'bg-primary' : 'bg-default-300 dark:bg-default-500')} />
									)}
									<span className="flex min-w-0 flex-1 items-center gap-1.5">
										<span
											className={clsx(
												'font-a61 truncate text-[13px]',
												active ? 'font-semibold text-primary' : 'text-default-600 dark:text-default-400'
											)}
										>
											{profile.name}
										</span>
										{active && <Pill>{t('common.current')}</Pill>}
									</span>
								</button>
								<IconButton
									className="opacity-0 focus-visible:opacity-100 group-hover:opacity-100"
									label={t('settings.lottery.rename')}
									onClick={() => {
										setEditingId(profile.id);
										setDraft(profile.name);
									}}
								>
									<Icon name="edit" size={14} />
								</IconButton>
								<IconButton
									className="opacity-0 focus-visible:opacity-100 group-hover:opacity-100"
									label={t('settings.lottery.delete')}
									tone="danger"
									onClick={() => remove(profile.id)}
								>
									<Icon name="delete" size={14} />
								</IconButton>
							</div>
						);
					})}
				</div>
			</div>
		</Section>
	);
};

export default ProfilesSection;
