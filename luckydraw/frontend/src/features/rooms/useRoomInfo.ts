import { useCallback, useEffect, useState } from 'react';

import { roomApi } from '@/services/api';
import type { RoomInfo } from '@/types';

const POLL_INTERVAL = 60_000;

const sameRoom = (a: RoomInfo, b: RoomInfo) =>
	a.room_id === b.room_id &&
	a.title === b.title &&
	a.cover === b.cover &&
	a.keyframe === b.keyframe &&
	a.live_status === b.live_status &&
	a.online === b.online &&
	a.attention === b.attention &&
	a.area_name === b.area_name &&
	a.parent_area_name === b.parent_area_name &&
	a.anchor.name === b.anchor.name &&
	a.anchor.face === b.anchor.face;

export const useRoomInfo = (roomIDs: number[], enabled: boolean) => {
	const [rooms, setRooms] = useState<Record<number, RoomInfo>>({});
	const [loading, setLoading] = useState(false);
	const key = roomIDs.join(',');

	const load = useCallback(async (ids: number[]) => {
		if (ids.length === 0) {
			setRooms((prev) => (Object.keys(prev).length ? {} : prev));
			return;
		}
		setLoading(true);
		const results = await Promise.all(ids.map((id) => roomApi.info(id).catch(() => null)));
		setRooms((prev) => {
			let changed = false;
			const next = { ...prev };
			results.forEach((info, index) => {
				if (!info) return;
				const id = ids[index];
				const current = next[id];
				if (!current || !sameRoom(current, info)) {
					next[id] = info;
					changed = true;
				}
			});
			return changed ? next : prev;
		});
		setLoading(false);
	}, []);

	useEffect(() => {
		if (!enabled) return;
		const ids = key ? key.split(',').map(Number) : [];
		void load(ids);
		if (ids.length === 0) return;

		const timer = setInterval(() => void load(ids), POLL_INTERVAL);
		return () => clearInterval(timer);
	}, [enabled, key, load]);

	return { rooms, loading, refresh: () => load(roomIDs) };
};
