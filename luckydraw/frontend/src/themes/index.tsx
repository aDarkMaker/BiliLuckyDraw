import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import springBg from './spring-festival/images/background.webp';
import beachBg from './beach/images/background.webp';

export type ThemeName = 'light' | 'dark' | 'spring-festival' | 'beach';

export interface ThemeMeta {
	id: ThemeName;
	labelKey: string;
}

export const THEMES: ThemeMeta[] = [
	{ id: 'light', labelKey: 'theme.light' },
	{ id: 'dark', labelKey: 'theme.dark' },
	{ id: 'spring-festival', labelKey: 'theme.spring-festival' },
	{ id: 'beach', labelKey: 'theme.beach' },
];

const STORAGE_KEY = 'luckydraw-theme';

type ThemeImages = Record<'lottery-start' | 'lottery-ing', string | null>;

const NO_IMAGES: ThemeImages = {
	'lottery-start': null,
	'lottery-ing': null,
};

function themeImages(theme: ThemeName): ThemeImages {
	return NO_IMAGES;
}

function themeBackground(theme: ThemeName): string | null {
	if (theme === 'beach') return beachBg;
	if (theme === 'spring-festival') return springBg;
	return null;
}

const preloadedThemes = new Set<ThemeName>();
function preloadThemeBackground(theme: ThemeName): void {
	const bg = themeBackground(theme);
	if (!bg || preloadedThemes.has(theme)) return;
	preloadedThemes.add(theme);
	const link = document.createElement('link');
	link.rel = 'preload';
	link.as = 'image';
	link.href = bg;
	document.head.appendChild(link);
}

function detectInitialTheme(): ThemeName {
	const stored = localStorage.getItem(STORAGE_KEY) as ThemeName | null;
	if (stored && THEMES.some((t) => t.id === stored)) {
		return stored;
	}
	return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

interface ThemeContextValue {
	theme: ThemeName;
	setTheme: (t: ThemeName) => void;
}

const ThemeContext = createContext<ThemeContextValue>({ theme: 'light', setTheme: () => {} });

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const [theme, setThemeState] = useState<ThemeName>(detectInitialTheme);

	useEffect(() => {
		document.documentElement.className = `theme-${theme}`;
		localStorage.setItem(STORAGE_KEY, theme);
	}, [theme]);

	useEffect(() => {
		THEMES.forEach((t) => preloadThemeBackground(t.id));
	}, []);

	const setTheme = useCallback((t: ThemeName) => setThemeState(t), []);

	return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);

export const useThemeImage = (name: keyof ThemeImages): string | null => {
	const { theme } = useTheme();
	return themeImages(theme)[name];
};

export const useThemeBackground = (): string | null => {
	const { theme } = useTheme();
	return themeBackground(theme);
};
