/* Shared media cache: CDN variant helpers plus a decode-gated preload queue. */

const decoded = new Set<string>();
const queued = new Set<string>();
const pending: string[] = [];

const MAX_CONCURRENT = 4;

let active = 0;

const BILIBILI_IMAGE = /\/\/[^/]*hdslb\.com\//i;

const withVariant = (src: string, variant: string): string => {
	if (!src || !BILIBILI_IMAGE.test(src) || /@[^/]*$/.test(src.split('?')[0])) return src;
	const [path, query] = src.split('?');
	return query ? `${path}@${variant}?${query}` : `${path}@${variant}`;
};

export const imageThumb = (src: string, px?: number): string => {
	if (!px) return src;
	const size = Math.round(px * 2);
	return withVariant(src, `${size}w_${size}h_1c.webp`);
};

export const imageWide = (src: string, px: number): string => withVariant(src, `${Math.round(px * 2)}w.webp`);

export const isDecoded = (url: string): boolean => decoded.has(url);

export const markDecoded = (url: string): void => {
	decoded.add(url);
};

const drain = () => {
	while (active < MAX_CONCURRENT && pending.length > 0) {
		const url = pending.shift() as string;
		queued.delete(url);
		if (decoded.has(url)) continue;

		active += 1;
		const img = new Image();
		img.decoding = 'async';
		img.referrerPolicy = 'no-referrer';

		let settled = false;
		const settle = () => {
			if (settled) return;
			settled = true;
			decoded.add(url);
			active -= 1;
			drain();
		};

		img.onload = () => {
			if (typeof img.decode === 'function') void img.decode().then(settle, settle);
			else settle();
		};
		img.onerror = settle;
		img.src = url;
	}
};

/** Warms the decode cache off the main thread; concurrency is capped. */
export const preloadImage = (src?: string, px?: number): void => {
	const url = src ? (px ? imageThumb(src, px) : src) : '';
	if (!url || decoded.has(url) || queued.has(url)) return;
	queued.add(url);
	pending.push(url);
	drain();
};

export const preloadImages = (urls: Iterable<string | undefined>): void => {
	for (const url of urls) {
		if (!url || decoded.has(url) || queued.has(url)) continue;
		queued.add(url);
		pending.push(url);
	}
	drain();
};
