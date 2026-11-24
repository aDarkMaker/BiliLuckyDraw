import React, { useRef, useState } from 'react';
import clsx from 'clsx';
import { Spinner } from '@heroui/react';

import Icon from '@/components/icon';
import { GhostButton, IconButton } from '@/components/ui';
import { Section, Segmented } from '@/features/settings/components/section';
import { useI18n, type Lang } from '@/i18n';
import { BACKGROUND_PRESETS, presetImage, useTheme, type BackgroundPreset } from '@/theme';

interface AppearanceSectionProps {
	customImage: string;
	onPickFile: (file: File) => Promise<void>;
	onClearImage: () => void | Promise<void>;
}

export const AppearanceSection: React.FC<AppearanceSectionProps> = ({ customImage, onPickFile, onClearImage }) => {
	const { t, lang, setLang } = useI18n();
	const { mode, setMode, preset, setPreset, customActive, setCustomActive } = useTheme();
	const fileInput = useRef<HTMLInputElement>(null);
	const [busy, setBusy] = useState(false);
	const customShown = customActive && Boolean(customImage);
	const current = customShown ? customImage : presetImage(preset);
	const activeLabel = BACKGROUND_PRESETS.find((item) => item.id === preset)?.labelKey ?? 'settings.background.none';

	const selectPreset = (next: BackgroundPreset) => {
		setCustomActive(false);
		setPreset(next);
	};

	const pick = async (file: File) => {
		setBusy(true);
		try {
			await onPickFile(file);
		} finally {
			setBusy(false);
		}
	};

	return (
		<div className="flex flex-col gap-3">
			<Section icon={<Icon name="palette" size={16} />} title={t('settings.appearance.title')}>
				<div className="flex flex-col gap-4">
					<div className="flex flex-col gap-1.5">
						<span className="text-[12px] text-default-500">{t('settings.theme.title')}</span>
						<Segmented
							options={[
								{ value: 'light', label: t('theme.light') },
								{ value: 'dark', label: t('theme.dark') },
							]}
							value={mode}
							onChange={setMode}
						/>
					</div>

					<div className="flex flex-col gap-2">
						<span className="text-[12px] text-default-500">{t('settings.background.title')}</span>

						<div className="relative aspect-[16/6] w-full overflow-hidden rounded-medium border border-default-200/60 bg-default-500/10 dark:border-white/10">
							{current ? (
								<img alt="" className="h-full w-full object-cover" decoding="async" draggable={false} src={current} />
							) : (
								<div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(var(--heroui-primary)/0.3),transparent_60%),radial-gradient(circle_at_75%_70%,hsl(var(--heroui-secondary)/0.28),transparent_60%)]" />
							)}
							<div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
							<span className="absolute bottom-2 left-2.5 rounded-full bg-black/45 px-2 py-0.5 text-[10.5px] text-white/85 backdrop-blur-sm">
								{t(customShown ? 'settings.background.custom' : activeLabel)}
							</span>
						</div>

						<div className="grid grid-cols-3 gap-2">
							{customImage && (
								<button
									aria-pressed={customShown}
									className={clsx(
										'relative flex h-16 items-center justify-center overflow-hidden rounded-medium text-[11.5px] transition-colors',
										customShown
											? 'border-2 border-primary font-medium text-white'
											: 'border border-default-200/70 text-white/90 hover:border-primary/40 dark:border-white/10'
									)}
									type="button"
									onClick={() => setCustomActive(true)}
								>
									<img alt="" className="absolute inset-0 h-full w-full object-cover" decoding="async" draggable={false} src={customImage} />
									<div className="absolute inset-0 bg-black/35" />
									<span className="relative z-10 drop-shadow-sm">{t('settings.background.custom')}</span>
									{customShown && (
										<span className="absolute right-1 top-1 z-10 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
											<Icon name="check" size={10} />
										</span>
									)}
								</button>
							)}
							{BACKGROUND_PRESETS.map((item) => {
								const active = !customShown && preset === item.id;
								const thumb = presetImage(item.id, 'thumb');
								return (
									<button
										key={item.id}
										aria-pressed={active}
										className={clsx(
											'relative flex h-16 items-center justify-center overflow-hidden rounded-medium text-[11.5px] transition-colors',
											active
												? 'border-2 border-primary font-medium text-white'
												: 'border border-default-200/70 text-white/90 hover:border-primary/40 dark:border-white/10'
										)}
										type="button"
										onClick={() => selectPreset(item.id)}
									>
										{thumb ? (
											<img alt="" className="absolute inset-0 h-full w-full object-cover" decoding="async" draggable={false} src={thumb} />
										) : (
											<div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(var(--heroui-primary)/0.3),transparent_60%),radial-gradient(circle_at_75%_70%,hsl(var(--heroui-secondary)/0.28),transparent_60%)] dark:bg-content2" />
										)}
										<div className="absolute inset-0 bg-black/35" />
										<span className="relative z-10 drop-shadow-sm">{t(item.labelKey)}</span>
										{active && (
											<span className="absolute right-1 top-1 z-10 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
												<Icon name="check" size={10} />
											</span>
										)}
									</button>
								);
							})}
						</div>

						<div className="flex items-center gap-2">
							<input
								ref={fileInput}
								accept="image/*"
								className="hidden"
								type="file"
								onChange={(e) => {
									const file = e.target.files?.[0];
									if (file) void pick(file);
									e.target.value = '';
								}}
							/>
							<GhostButton className="h-9 flex-1" disabled={busy} onClick={() => fileInput.current?.click()}>
								{busy ? <Spinner color="current" size="sm" /> : <Icon name="add-photo" size={15} />}
								{t('settings.background.selectImage')}
							</GhostButton>
							{customImage && (
								<IconButton className="h-9 w-9 border border-default-200/70 dark:border-white/10" label={t('settings.background.reset')} tone="danger" onClick={onClearImage}>
									<Icon name="delete" size={15} />
								</IconButton>
							)}
						</div>
					</div>

					<div className="flex flex-col gap-1.5">
						<span className="text-[12px] text-default-500">{t('settings.language.title')}</span>
						<Segmented
							options={[
								{ value: 'zh', label: '中文' },
								{ value: 'en', label: 'English' },
							]}
							value={lang}
							onChange={(value) => setLang(value as Lang)}
						/>
					</div>
				</div>
			</Section>
		</div>
	);
};

export default AppearanceSection;
