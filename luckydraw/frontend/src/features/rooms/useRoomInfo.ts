import { useEffect, useMemo, useSyncExternalStore } from 'react';

import { ROOM_OFFLINE_TTL, ROOM_TTL, cachedRoom, loadRooms, roomVersion, subscribeRooms } from '@/features/rooms/room_store';
import type { RoomInfo } from '@/types';

export const useRoomInfo = (roomIDs: number[], enabled: boolean) => {
	const key = roomIDs.join(',');
	const version = useSyncExternalStore(subscribeRooms, roomVersion, roomVersion);

	const rooms = useMemo(() => {
		const next: Record<number, RoomInfo> = {};
		for (const id of roomIDs) {
			const info = cachedRoom(id);
			if (info) next[id] = info;
		}
		return next;
		// roomIDs identity changes every render; key + version is the real signal.
	}, [key, version]);

	useEffect(() => {
		if (!enabled) return;
		const ids = key ? key.split(',').map(Number) : [];
		if (ids.length === 0) return;
		let timer: number | null = null;
		let cancelled = false;

		// Poll faster while anything is offline so a room going live is picked up quickly.
		const tick = async () => {
			await loadRooms(ids);
			if (cancelled) return;
			const allLive = ids.every((id) => cachedRoom(id)?.live_status === 1);
			timer = window.setTimeout(() => void tick(), allLive ? ROOM_TTL : ROOM_OFFLINE_TTL);
		};
		void tick();

		return () => {
			cancelled = true;
			if (timer !== null) window.clearTimeout(timer);
		};
	}, [enabled, key]);

	return {
		rooms,
		loading: roomIDs.some((id) => !cachedRoom(id)),
		refresh: () => loadRooms(roomIDs, true),
	};
};
