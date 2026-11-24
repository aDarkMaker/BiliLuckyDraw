import { DEFAULT_ACCENT, presetAccent, presetImage, type Accent, type BackgroundPreset, type ThemeMode } from './presets';

export type { Accent } from './presets';

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

const rgbToHsl = (r: number, g: number, b: number): { h: number; s: number; l: number } => {
	r /= 255;
	g /= 255;
	b /= 255;
	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	const l = (max + min) / 2;
	if (max === min) return { h: 0, s: 0, l };
	const d = max - min;
	const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
	let h = 0;
	switch (max) {
		case r:
			h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
			break;
		case g:
			h = ((b - r) / d + 2) / 6;
			break;
		default:
			h = ((r - g) / d + 4) / 6;
	}
	return { h: h * 360, s: s * 100, l: l * 100 };
};

export const accentForPreset = (preset: BackgroundPreset): Accent => presetAccent(preset) ?? DEFAULT_ACCENT;

const ACCENT_CACHE_LIMIT = 8;
const accentCache = new Map<string, Accent>();

export const cachedAccent = (src: string): Accent | undefined => {
	if (!src) return undefined;
	const hit = accentCache.get(src);
	if (!hit) return undefined;
	accentCache.delete(src);
	accentCache.set(src, hit);
	return hit;
};

const rememberAccent = (src: string, accent: Accent): Accent => {
	if (!src) return accent;
	accentCache.delete(src);
	accentCache.set(src, accent);
	if (accentCache.size > ACCENT_CACHE_LIMIT) {
		const oldest = accentCache.keys().next().value;
		if (oldest !== undefined) accentCache.delete(oldest);
	}
	return accent;
};

const sampleAccent = (src: string): Promise<Accent> =>
	new Promise((resolve) => {
		const img = new Image();
		img.decoding = 'async';
		img.onload = () => {
			const size = 48;
			const canvas = document.createElement('canvas');
			canvas.width = size;
			canvas.height = size;
			const ctx = canvas.getContext('2d', { willReadFrequently: true });
			if (!ctx) {
				resolve(DEFAULT_ACCENT);
				return;
			}
			ctx.drawImage(img, 0, 0, size, size);
			const { data } = ctx.getImageData(0, 0, size, size);
			let bestW = 0;
			let sumH = 0;
			let sumS = 0;
			for (let i = 0; i < data.length; i += 4) {
				const a = data[i + 3];
				if (a < 200) continue;
				const { h, s, l } = rgbToHsl(data[i], data[i + 1], data[i + 2]);
				if (s < 18 || l < 12 || l > 88) continue;
				const w = s * (1 - Math.abs(l - 52) / 52);
				sumH += h * w;
				sumS += s * w;
				bestW += w;
			}
			if (bestW < 1) {
				resolve(DEFAULT_ACCENT);
				return;
			}
			resolve({ h: sumH / bestW, s: clamp(sumS / bestW, 55, 96) });
		};
		img.onerror = () => resolve(DEFAULT_ACCENT);
		img.src = src;
	});

export const extractAccent = (src: string): Promise<Accent> => {
	const cached = cachedAccent(src);
	if (cached) return Promise.resolve(cached);
	return sampleAccent(src).then((accent) => rememberAccent(src, accent));
};

const set = (el: HTMLElement, key: string, value: string) => el.style.setProperty(key, value);

export const applyAccent = (el: HTMLElement, accent: Accent, mode: ThemeMode) => {
	const { h } = accent;
	const s = clamp(accent.s, 55, 96);
	const sh = Math.round(h);
	const ss = Math.round(s);

	if (mode === 'light') {
		set(el, '--heroui-primary-50', `${sh} 100% 97%`);
		set(el, '--heroui-primary-100', `${sh} 100% 93%`);
		set(el, '--heroui-primary-200', `${sh} 100% 88%`);
		set(el, '--heroui-primary-300', `${sh} 98% 81%`);
		set(el, '--heroui-primary-400', `${sh} ${ss}% 74%`);
		set(el, '--heroui-primary-500', `${sh} ${Math.max(70, ss - 7)}% 65%`);
		set(el, '--heroui-primary-600', `${sh} ${Math.max(60, ss - 20)}% 55%`);
		set(el, '--heroui-primary-700', `${sh} ${Math.max(55, ss - 27)}% 44%`);
		set(el, '--heroui-primary-800', `${sh} ${Math.max(50, ss - 31)}% 32%`);
		set(el, '--heroui-primary-900', `${sh} ${Math.max(48, ss - 33)}% 21%`);
		set(el, '--heroui-primary', `${sh} ${ss}% 72%`);
		set(el, '--heroui-primary-foreground', '0 0% 100%');
		set(el, '--heroui-focus', `${sh} ${ss}% 72%`);
		set(el, '--surface', `${sh} 45% 99%`);
		set(el, '--surface-border', `${sh} 30% 30% / 0.09`);
		set(el, '--well', `${sh} 25% 25% / 0.05`);
		set(el, '--well-hover', `${sh} 25% 25% / 0.08`);
		set(el, '--backdrop-tint', `${sh} 55% 96%`);
		set(el, '--surface-shadow', `0 1px 2px hsl(${sh} 40% 20% / 0.05), 0 24px 48px -32px hsl(${sh} 40% 20% / 0.32)`);
		set(el, '--heroui-content1', `${sh} 14% 99%`);
		set(el, '--heroui-content2', `${sh} 16% 96%`);
		set(el, '--heroui-content3', `${sh} 14% 91%`);
		set(el, '--heroui-content4', `${sh} 12% 84%`);
		set(el, '--heroui-default-50', `${sh} 18% 98%`);
		set(el, '--heroui-default-100', `${sh} 16% 95%`);
		set(el, '--heroui-default-200', `${sh} 15% 90%`);
		set(el, '--heroui-default-300', `${sh} 13% 82%`);
		set(el, '--heroui-default-400', `${sh} 10% 50%`);
		set(el, '--heroui-default-500', `${sh} 10% 38%`);
		set(el, '--heroui-default-600', `${sh} 11% 33%`);
		set(el, '--heroui-default-700', `${sh} 12% 25%`);
		set(el, '--heroui-default-800', `${sh} 14% 16%`);
		set(el, '--heroui-default-900', `${sh} 16% 10%`);
		set(el, '--heroui-default', `${sh} 15% 90%`);
	} else {
		set(el, '--heroui-primary-50', `${sh} 60% 10%`);
		set(el, '--heroui-primary-100', `${sh} 66% 17%`);
		set(el, '--heroui-primary-200', `${sh} 70% 26%`);
		set(el, '--heroui-primary-300', `${sh} 80% 40%`);
		set(el, '--heroui-primary-400', `${sh} 90% 55%`);
		set(el, '--heroui-primary-500', `${sh} ${ss}% 68%`);
		set(el, '--heroui-primary-600', `${sh} ${Math.min(100, ss + 1)}% 76%`);
		set(el, '--heroui-primary-700', `${sh} 100% 85%`);
		set(el, '--heroui-primary-800', `${sh} 100% 92%`);
		set(el, '--heroui-primary-900', `${sh} 100% 96%`);
		set(el, '--heroui-primary', `${sh} ${ss}% 68%`);
		set(el, '--heroui-primary-foreground', `${sh} 60% 10%`);
		set(el, '--heroui-focus', `${sh} ${ss}% 72%`);
		set(el, '--surface', `${sh} 14% 7%`);
		set(el, '--surface-border', `${sh} 25% 100% / 0.1`);
		set(el, '--well', `${sh} 20% 100% / 0.06`);
		set(el, '--well-hover', `${sh} 20% 100% / 0.1`);
		set(el, '--backdrop-tint', `${sh} 40% 4%`);
		set(el, '--heroui-content1', `${sh} 8% 9%`);
		set(el, '--heroui-content2', `${sh} 8% 13%`);
		set(el, '--heroui-content3', `${sh} 8% 21%`);
		set(el, '--heroui-content4', `${sh} 8% 31%`);
		set(el, '--heroui-default-50', `${sh} 8% 9%`);
		set(el, '--heroui-default-100', `${sh} 8% 13%`);
		set(el, '--heroui-default-200', `${sh} 8% 21%`);
		set(el, '--heroui-default-300', `${sh} 8% 31%`);
		set(el, '--heroui-default-400', `${sh} 7% 60%`);
		set(el, '--heroui-default-500', `${sh} 7% 64%`);
		set(el, '--heroui-default-600', `${sh} 7% 82%`);
		set(el, '--heroui-default-700', `${sh} 7% 89%`);
		set(el, '--heroui-default-800', `${sh} 7% 95%`);
		set(el, '--heroui-default-900', `${sh} 6% 98%`);
		set(el, '--heroui-default', `${sh} 8% 21%`);
	}
};

export const resolveAccentSource = (preset: BackgroundPreset, customImage: string): string | null =>
	customImage || presetImage(preset);
