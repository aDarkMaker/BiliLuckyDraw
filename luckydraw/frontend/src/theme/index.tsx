import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { accentForPreset, applyAccent, cachedAccent, extractAccent, type Accent } from './accent';
import { isBackgroundPreset, presetImage, type BackgroundPreset, type ThemeMode } from './presets';

const MODE_KEY = 'luckydraw.mode';
const PRESET_KEY = 'luckydraw.preset';

const readMode = (): ThemeMode => {
	const stored = localStorage.getItem(MODE_KEY);
	if (stored === 'light' || stored === 'dark') return stored;
	return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const readPreset = (): BackgroundPreset => {
	const stored = localStorage.getItem(PRESET_KEY);
	return stored && isBackgroundPreset(stored) ? stored : 'none';
};

interface ThemeValue {
	mode: ThemeMode;
	isDark: boolean;
	setMode: (mode: ThemeMode) => void;
	toggleMode: () => void;
	preset: BackgroundPreset;
	setPreset: (preset: BackgroundPreset) => void;
	customImage: string;
	setCustomImage: (image: string) => void;
	customActive: boolean;
	setCustomActive: (active: boolean) => void;
	background: string | null;
	backgroundThumb: string | null;
	hasBackground: boolean;
}

const ThemeContext = createContext<ThemeValue | null>(null);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const [mode, setModeState] = useState<ThemeMode>(readMode);
	const [preset, setPresetState] = useState<BackgroundPreset>(readPreset);
	const [customImage, setCustomImageState] = useState('');
	const [customActive, setCustomActiveState] = useState(false);
	const lastAccent = useRef<{ src: string; accent: Accent }>({ src: '', accent: accentForPreset('none') });

	useEffect(() => {
		document.documentElement.classList.toggle('dark', mode === 'dark');
		document.documentElement.classList.toggle('light', mode === 'light');
		document.documentElement.style.colorScheme = mode;
		localStorage.setItem(MODE_KEY, mode);
	}, [mode]);

	useEffect(() => {
		const root = document.documentElement;
		const activeImage = customActive && customImage ? customImage : null;
		const background = activeImage || presetImage(preset);
		const thumb = activeImage || presetImage(preset, 'thumb');
		const src = background ? thumb || background : '';

		if (lastAccent.current.src === src) {
			applyAccent(root, lastAccent.current.accent, mode);
			return;
		}

		if (!src) {
			lastAccent.current = { src, accent: accentForPreset('none') };
			applyAccent(root, lastAccent.current.accent, mode);
			return;
		}

		const cached = cachedAccent(src);
		if (cached) {
			lastAccent.current = { src, accent: cached };
			applyAccent(root, cached, mode);
			return;
		}

		let cancelled = false;
		void extractAccent(src).then((accent) => {
			if (cancelled) return;
			lastAccent.current = { src, accent };
			applyAccent(root, accent, mode);
		});
		return () => {
			cancelled = true;
		};
	}, [mode, preset, customImage, customActive]);

	const setPreset = useCallback((next: BackgroundPreset) => {
		setPresetState(next);
		localStorage.setItem(PRESET_KEY, next);
	}, []);

	const setMode = useCallback((next: ThemeMode) => setModeState(next), []);
	const toggleMode = useCallback(() => setModeState((prev) => (prev === 'dark' ? 'light' : 'dark')), []);
	const setCustomImage = useCallback((image: string) => {
		setCustomImageState(image);
		setCustomActiveState(Boolean(image));
	}, []);
	const setCustomActive = useCallback((active: boolean) => setCustomActiveState(active), []);

	const value = useMemo<ThemeValue>(() => {
		const activeImage = customActive && customImage ? customImage : null;
		const background = activeImage || presetImage(preset);
		return {
			mode,
			isDark: mode === 'dark',
			setMode,
			toggleMode,
			preset,
			setPreset,
			customImage,
			setCustomImage,
			customActive,
			setCustomActive,
			background,
			backgroundThumb: activeImage || presetImage(preset, 'thumb'),
			hasBackground: Boolean(background),
		};
	}, [mode, setMode, toggleMode, preset, setPreset, customImage, setCustomImage, customActive, setCustomActive]);

	return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeValue => {
	const ctx = useContext(ThemeContext);
	if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
	return ctx;
};

export type { BackgroundPreset, ThemeMode } from './presets';
export { BACKGROUND_PRESETS, PRESET_MANIFEST, isBackgroundPreset, presetImage } from './presets';
