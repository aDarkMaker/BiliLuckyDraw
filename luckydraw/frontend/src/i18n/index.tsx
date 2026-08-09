import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import zh from './zh.json';
import en from './en.json';

export type Lang = 'zh' | 'en';

const STORAGE_KEY = 'luckydraw-lang';

const DICTS: Record<Lang, Record<string, string>> = {
	zh,
	en,
};

const LANGS: Lang[] = ['zh', 'en'];

function detectInitialLang(): Lang {
	const stored = localStorage.getItem(STORAGE_KEY) as Lang | null;
	if (stored && LANGS.includes(stored)) {
		return stored;
	}
	return 'zh';
}

type TParams = Record<string, string | number>;

interface I18nContextValue {
	lang: Lang;
	setLang: (l: Lang) => void;
	t: (key: string, params?: TParams) => string;
}

const I18nContext = createContext<I18nContextValue>({
	lang: 'zh',
	setLang: () => {},
	t: (key) => key,
});

function translate(lang: Lang, key: string, params?: TParams): string {
	const dict = DICTS[lang];
	const raw = dict[key] ?? DICTS.zh[key] ?? key;
	if (!params) return raw;
	return raw.replace(/\{\{(\w+)\}\}/g, (_, k: string) => String(params[k] ?? ''));
}

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const [lang, setLangState] = useState<Lang>(detectInitialLang);

	useEffect(() => {
		document.documentElement.lang = lang;
		localStorage.setItem(STORAGE_KEY, lang);
	}, [lang]);

	const setLang = useCallback((l: Lang) => setLangState(l), []);
	const t = useCallback((key: string, params?: TParams) => translate(lang, key, params), [lang]);

	return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>;
};

export const useI18n = () => useContext(I18nContext);
