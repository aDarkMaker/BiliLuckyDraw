import springFestival from '@/assets/backgrounds/spring-festival.webp';
import beach from '@/assets/backgrounds/beach.webp';

export type ThemeMode = 'light' | 'dark';
export type BackgroundPreset = 'none' | 'spring-festival' | 'beach';

export const BACKGROUND_PRESETS: { id: BackgroundPreset; labelKey: string }[] = [
	{ id: 'none', labelKey: 'settings.background.none' },
	{ id: 'spring-festival', labelKey: 'theme.spring-festival' },
	{ id: 'beach', labelKey: 'theme.beach' },
];

const PRESET_IMAGES: Record<Exclude<BackgroundPreset, 'none'>, string> = {
	'spring-festival': springFestival,
	beach,
};

export const presetImage = (preset: BackgroundPreset): string | null => (preset === 'none' ? null : PRESET_IMAGES[preset]);
