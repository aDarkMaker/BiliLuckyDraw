import { useEffect, useMemo, useRef, useState } from 'react';

import { preloadImage } from '@/components/image_queue';
import { danmakuApi } from '@/services/api';
import type { DanmakuLine } from '@/types';

const maxLines = 120;
const maxPreloadPerBatch = 6;

export const useDanmakuFeed = (roomID: number | null, enabled: boolean) => {
	const [lines, setLines] = useState<DanmakuLine[]>([]);
	const [watching, setWatching] = useState(false);
	const [emotes, setEmotes] = useState<Record<string, string>>({});
	const cursor = useRef(0);
	const roomRef = useRef<number | null>(null);
	const queue = useRef<DanmakuLine[]>([]);
	const flush = useRef<number | null>(null);

	useEffect(() => {
		if (!enabled) return;
		let cancelled = false;
		void danmakuApi
			.emotes()
			.then((map) => {
				if (!cancelled) setEmotes(map);
			})
			.catch(() => {});
		return () => {
			cancelled = true;
		};
	}, [enabled]);

	useEffect(() => {
		if (!enabled || !roomID) {
			roomRef.current = null;
			cursor.current = 0;
			queue.current = [];
			setLines([]);
			setWatching(false);
			void danmakuApi.stop().catch(() => {});
			return;
		}

		let cancelled = false;
		roomRef.current = roomID;
		cursor.current = 0;
		queue.current = [];
		setLines([]);
		setWatching(false);

		// Batch incoming lines so a busy room cannot re-render per message.
		const scheduleFlush = () => {
			if (flush.current !== null) return;
			flush.current = window.setTimeout(() => {
				flush.current = null;
				const batch = queue.current;
				queue.current = [];
				if (!batch.length || cancelled || roomRef.current !== roomID) return;
				// Warm only the newest avatars; older rows mount lazily via CachedImage.
				for (const line of batch.slice(-maxPreloadPerBatch)) preloadImage(line.face, 24);
				setLines((prev) => {
					const next = prev.concat(batch);
					return next.length > maxLines ? next.slice(next.length - maxLines) : next;
				});
			}, 200);
		};

		const boot = async () => {
			try {
				await danmakuApi.watch(roomID);
				if (!cancelled && roomRef.current === roomID) setWatching(true);
			} catch {
				if (!cancelled && roomRef.current === roomID) setWatching(false);
			}
		};
		void boot();

		const timer = setInterval(() => {
			if (roomRef.current !== roomID) return;
			void danmakuApi
				.poll(cursor.current)
				.then((payload) => {
					if (cancelled || roomRef.current !== roomID) return;
					cursor.current = payload.cursor;
					if (!payload.lines.length) return;
					queue.current.push(...payload.lines);
					scheduleFlush();
				})
				.catch(() => {});
		}, 700);

		return () => {
			cancelled = true;
			clearInterval(timer);
			if (flush.current !== null) {
				clearTimeout(flush.current);
				flush.current = null;
			}
			if (roomRef.current === roomID) {
				roomRef.current = null;
				void danmakuApi.stop().catch(() => {});
			}
		};
	}, [enabled, roomID]);

	return useMemo(() => ({ lines, watching, emotes }), [lines, watching, emotes]);
};
