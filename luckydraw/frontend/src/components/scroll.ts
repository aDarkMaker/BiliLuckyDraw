import { useEffect, useRef } from 'react';

const FADE_MS = 700;

/** Marks a scroll container while it scrolls so the scrollbar can fade in/out. */
export const useQuietScroll = <T extends HTMLElement>() => {
	const ref = useRef<T>(null);

	useEffect(() => {
		const el = ref.current;
		if (!el) return;

		let timer: number | null = null;
		const onScroll = () => {
			el.dataset.scrolling = 'true';
			if (timer !== null) window.clearTimeout(timer);
			timer = window.setTimeout(() => {
				timer = null;
				delete el.dataset.scrolling;
			}, FADE_MS);
		};

		el.addEventListener('scroll', onScroll, { passive: true });
		return () => {
			el.removeEventListener('scroll', onScroll);
			if (timer !== null) window.clearTimeout(timer);
		};
	}, []);

	return ref;
};

export default useQuietScroll;
