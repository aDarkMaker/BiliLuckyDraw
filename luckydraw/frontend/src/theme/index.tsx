import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { accentForPreset, applyAccent, extractAccent } from './accent';
import { presetImage, type BackgroundPreset, type ThemeMode } from './presets';

const MODE_KEY = 'luckydraw.mode';
const PRESET_KEY = 'luckydraw.preset';

const readMode = (): ThemeMode => {
	const stored = localStorage.getItem(MODE_KEY);
	if (stored === 'light' || stored === 'dark') return stored;
	return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const readPreset = (): BackgroundPreset => {
	const stored = localStorage.getItem(PRESET_KEY);
	if (stored === 'beach' || stored === 'spring-festival') return stored;
	return 'none';
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
	background: string | null;
	hasBackground: boolean;
}

const ThemeContext = createContext<ThemeValue | null>(null);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const [mode, setModeState] = useState<ThemeMode>(readMode);
	const [preset, setPresetState] = useState<BackgroundPreset>(readPreset);
	const [customImage, setCustomImageState] = useState('');

	useEffect(() => {
		document.documentElement.classList.toggle('dark', mode === 'dark');
		document.documentElement.classList.toggle('light', mode === 'light');
		document.documentElement.style.colorScheme = mode;
		localStorage.setItem(MODE_KEY, mode);
	}, [mode]);

	useEffect(() => {
		const root = document.documentElement;
		const background = customImage || presetImage(preset);
		let cancelled = false;

		if (!background) {
			applyAccent(root, accentForPreset('none'), mode);
			return;
		}

		void extractAccent(background).then((accent) => {
			if (!cancelled) applyAccent(root, accent, mode);
		});
		return () => {
			cancelled = true;
		};
	}, [mode, preset, customImage]);

	const setPreset = useCallback((next: BackgroundPreset) => {
		setPresetState(next);
		localStorage.setItem(PRESET_KEY, next);
	}, []);

	const setMode = useCallback((next: ThemeMode) => setModeState(next), []);
	const toggleMode = useCallback(() => setModeState((prev) => (prev === 'dark' ? 'light' : 'dark')), []);
	const setCustomImage = useCallback((image: string) => setCustomImageState(image), []);

	const value = useMemo<ThemeValue>(() => {
		const background = customImage || presetImage(preset);
		return {
			mode,
			isDark: mode === 'dark',
			setMode,
			toggleMode,
			preset,
			setPreset,
			customImage,
			setCustomImage,
			background,
			hasBackground: Boolean(background),
		};
	}, [mode, setMode, toggleMode, preset, setPreset, customImage, setCustomImage]);

	return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeValue => {
	const ctx = useContext(ThemeContext);
	if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
	return ctx;
};

export type { BackgroundPreset, ThemeMode } from './presets';
export { BACKGROUND_PRESETS, presetImage } from './presets';
