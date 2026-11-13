import React, { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';

import { imageThumb, imageWide, isDecoded, markDecoded, preloadImage } from '@/components/image_queue';

export { imageThumb, imageWide } from '@/components/image_queue';

interface CachedImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src' | 'decoding' | 'loading'> {
	src?: string;
	/** Rendered CSS width, used to request a matching square CDN variant. */
	thumb?: number;
	/** Rendered CSS width, keeps the source aspect ratio (covers/keyframes). */
	wide?: number;
	eager?: boolean;
	fade?: boolean;
}

const supportsObserver = () => typeof IntersectionObserver === 'function';

// Judge visibility inside the nearest scroll container: the danmaku feed often
// sits below the window fold, where a viewport-rooted observer never fires.
const rootCache = new WeakMap<Element, Element | null>();

const scrollRoot = (el: Element): Element | null => {
	const cached = el.parentElement ? rootCache.get(el.parentElement) : undefined;
	if (cached !== undefined) return cached;

	let node = el.parentElement;
	let found: Element | null = null;
	while (node) {
		const overflow = getComputedStyle(node).overflowY;
		if (overflow === 'auto' || overflow === 'scroll') {
			found = node;
			break;
		}
		node = node.parentElement;
	}
	if (el.parentElement) rootCache.set(el.parentElement, found);
	return found;
};

export const CachedImage: React.FC<CachedImageProps> = ({ src, thumb, wide, eager, fade = false, className, onLoad, ...rest }) => {
	const url = src ? (wide ? imageWide(src, wide) : imageThumb(src, thumb)) : '';
	const firstViewport = Boolean(url) && (eager || isDecoded(url) || !supportsObserver());
	const [ready, setReady] = useState(() => !url || isDecoded(url));
	const [mounted, setMounted] = useState(firstViewport);
	const pending = useRef(url);
	const holder = useRef<HTMLImageElement>(null);

	useEffect(() => {
		pending.current = url;
		setReady(!url || isDecoded(url));
	}, [url]);

	// Only dial the CDN once a row is near the viewport: offscreen history never
	// fires requests, which is what kept the main thread busy during bursts.
	useEffect(() => {
		if (!url || mounted) return;
		const el = holder.current;
		if (!el) {
			setMounted(true);
			return;
		}
		const observer = new IntersectionObserver(
			(entries) => {
				if (!entries.some((entry) => entry.isIntersecting)) return;
				observer.disconnect();
				preloadImage(url);
				setMounted(true);
			},
			{ root: scrollRoot(el), rootMargin: '160px' }
		);
		observer.observe(el);
		return () => observer.disconnect();
	}, [url, mounted]);

	if (!url) return null;

	return (
		<img
			{...rest}
			ref={holder}
			className={clsx(className, fade && 'transition-opacity duration-200', fade && (ready ? 'opacity-100' : 'opacity-0'))}
			decoding="async"
			draggable={false}
			fetchPriority={eager ? 'high' : 'low'}
			loading={eager ? 'eager' : 'lazy'}
			src={mounted ? url : undefined}
			onLoad={(event) => {
				markDecoded(url);
				if (pending.current === url && fade) setReady(true);
				onLoad?.(event);
			}}
		/>
	);
};

export default CachedImage;
