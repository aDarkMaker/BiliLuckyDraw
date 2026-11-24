export type ThemeMode = 'light' | 'dark';
export type BackgroundPreset = string;
export type PresetVariant = 'screen' | 'thumb';

export interface Accent {
	h: number;
	s: number;
}

export const DEFAULT_ACCENT: Accent = { h: 344, s: 95 };

interface PresetManifestEntry {
	id: string;
	labelKey: string;
	accent?: Accent;
}

/** Optional metadata for discovered assets: label + accent fallback. */
export const PRESET_MANIFEST: PresetManifestEntry[] = [
	{ id: 'spring-festival', labelKey: 'theme.spring-festival', accent: { h: 2, s: 78 } },
	{ id: 'beach', labelKey: 'theme.beach', accent: { h: 218, s: 90 } },
];

const THUMB_SUFFIX = '-thumb';

const SOURCE = import.meta.glob('../assets/backgrounds/*.webp', { eager: true, import: 'default' }) as Record<string, string>;

const basename = (path: string) => path.slice(path.lastIndexOf('/') + 1).replace(/\.webp$/i, '');

const discovered = new Map<string, Partial<Record<PresetVariant, string>>>();

for (const [path, url] of Object.entries(SOURCE)) {
	const name = basename(path);
	const isThumb = name.endsWith(THUMB_SUFFIX);
	const id = isThumb ? name.slice(0, -THUMB_SUFFIX.length) : name;
	if (!id) continue;
	const entry = discovered.get(id) ?? {};
	entry[isThumb ? 'thumb' : 'screen'] = url;
	discovered.set(id, entry);
}

const manifestFor = (id: string) => PRESET_MANIFEST.find((item) => item.id === id);

const ordered = [
	...PRESET_MANIFEST.filter((item) => discovered.has(item.id)).map((item) => item.id),
	...[...discovered.keys()].filter((id) => !manifestFor(id)).sort(),
];

export const BACKGROUND_PRESETS: { id: BackgroundPreset; labelKey: string }[] = [
	{ id: 'none', labelKey: 'settings.background.none' },
	...ordered.map((id) => ({ id, labelKey: manifestFor(id)?.labelKey ?? `theme.${id}` })),
];

export const isBackgroundPreset = (value: string): boolean => BACKGROUND_PRESETS.some((item) => item.id === value);

export const presetAccent = (preset: BackgroundPreset): Accent | null => manifestFor(preset)?.accent ?? null;

export const presetImage = (preset: BackgroundPreset, variant: PresetVariant = 'screen'): string | null => {
	if (preset === 'none') return null;
	const entry = discovered.get(preset);
	if (!entry) return null;
	return entry[variant] ?? entry.screen ?? null;
};