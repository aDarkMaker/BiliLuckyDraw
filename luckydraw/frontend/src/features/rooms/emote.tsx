import React from 'react';

import { CachedImage } from '@/components/image';

const tokenRe = /(\[[^\[\]]+\])/g;

interface EmoteIndex {
	exact: Map<string, string>;
	byName: Map<string, string>;
}

const indexes = new WeakMap<Record<string, string>, EmoteIndex>();

const isURL = (value: string) => value.startsWith('http://') || value.startsWith('https://');

const indexFor = (emotes: Record<string, string>): EmoteIndex => {
	const cached = indexes.get(emotes);
	if (cached) return cached;

	const exact = new Map<string, string>();
	const byName = new Map<string, string>();
	for (const key of Object.keys(emotes)) {
		const url = emotes[key];
		if (!url || !isURL(url)) continue;
		exact.set(key, url);
		exact.set(key.toLowerCase(), url);
		if (key.length < 3 || key[0] !== '[' || key[key.length - 1] !== ']') continue;
		const name = key.slice(1, -1).toLowerCase();
		if (!name || byName.has(name)) continue;
		byName.set(name, url);
	}

	const index = { exact, byName };
	indexes.set(emotes, index);
	return index;
};

const resolveEmoteURL = (token: string, index: EmoteIndex): string | undefined => {
	const hit = index.exact.get(token) || index.exact.get(token.toLowerCase());
	if (hit) return hit;
	if (token.length < 3 || token[0] !== '[' || token[token.length - 1] !== ']') return undefined;

	const inner = token.slice(1, -1).toLowerCase();
	if (!inner) return undefined;
	if (index.byName.has(inner)) return index.byName.get(inner);

	// Prefer shortest prefix/alias hit (dog → doge) without stealing short tokens.
	let best: { name: string; url: string } | undefined;
	for (const [name, url] of index.byName) {
		if (!(name.startsWith(inner) || inner.startsWith(name))) continue;
		if (!best || name.length < best.name.length) best = { name, url };
	}
	return best?.url;
};

export const renderEmoteText = (text: string, emotes: Record<string, string>): React.ReactNode => {
	if (!text) return null;
	const parts = text.split(tokenRe);
	if (parts.length === 1) return text;

	const index = indexFor(emotes);
	return parts.map((part, position) => {
		const url = resolveEmoteURL(part, index);
		if (!url) return <React.Fragment key={`${position}-${part}`}>{part}</React.Fragment>;
		return (
			<CachedImage
				alt={part}
				className="danmaku-emote"
				key={`${position}-${part}`}
				src={url}
				thumb={22}
				title={part}
			/>
		);
	});
};
