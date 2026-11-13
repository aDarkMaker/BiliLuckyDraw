import React, { useRef } from 'react';
import clsx from 'clsx';

import Icon from '@/components/icon';
import { GhostButton, IconButton } from '@/components/ui';
import { Section, Segmented } from '@/features/settings/components/section';
import { useI18n, type Lang } from '@/i18n';
import { BACKGROUND_PRESETS, presetImage, useTheme } from '@/theme';

interface AppearanceSectionProps {
	customImage: string;
	onSelectImage: (dataUrl: string) => void;
	onClearImage: () => void;
}

export const AppearanceSection: React.FC<AppearanceSectionProps> = ({ customImage, onSelectImage, onClearImage }) => {
	const { t, lang, setLang } = useI18n();
	const { mode, setMode, preset, setPreset } = useTheme();
	const fileInput = useRef<HTMLInputElement>(null);

	const readFile = (file: File) => {
		const reader = new FileReader();
		reader.onload = () => onSelectImage(String(reader.result || ''));
		reader.readAsDataURL(file);
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
						<div className="grid grid-cols-3 gap-2">
							{BACKGROUND_PRESETS.map((item) => {
								const active = !customImage && preset === item.id;
								const image = presetImage(item.id);
								return (
									<button
										key={item.id}
										className={clsx(
											'relative flex h-16 items-center justify-center overflow-hidden rounded-medium text-[11.5px] transition-colors',
											active
												? 'border-2 border-primary font-medium text-white'
												: 'border border-default-200/70 text-white/90 hover:border-primary/40 dark:border-white/10'
										)}
										type="button"
										onClick={() => {
											if (customImage) onClearImage();
											setPreset(item.id);
										}}
									>
										{image ? (
											<img
												alt=""
												className="absolute inset-0 h-full w-full object-cover"
												decoding="async"
												draggable={false}
												loading="lazy"
												src={image}
											/>
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
									if (file) readFile(file);
									e.target.value = '';
								}}
							/>
							<GhostButton className="h-9 flex-1" onClick={() => fileInput.current?.click()}>
								<Icon name="add-photo" size={15} />
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
