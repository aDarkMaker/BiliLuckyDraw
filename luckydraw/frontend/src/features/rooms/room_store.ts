import { roomApi } from '@/services/api';
import type { RoomInfo } from '@/types';

export const ROOM_TTL = 60_000;
export const ROOM_OFFLINE_TTL = 15_000;

interface Entry {
	info: RoomInfo;
	at: number;
}

const cache = new Map<number, Entry>();
const inflight = new Map<number, Promise<void>>();
const listeners = new Set<() => void>();
let version = 0;

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

const emit = () => {
	version += 1;
	for (const listener of listeners) listener();
};

export const subscribeRooms = (listener: () => void) => {
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
	};
};

export const roomVersion = () => version;

export const cachedRoom = (roomID: number): RoomInfo | undefined => cache.get(roomID)?.info;

export const loadRoom = (roomID: number, force = false): Promise<void> => {
	const hit = cache.get(roomID);
	const ttl = hit?.info.live_status === 1 ? ROOM_TTL : ROOM_OFFLINE_TTL;
	if (!force && hit && Date.now() - hit.at < ttl) return Promise.resolve();

	const running = inflight.get(roomID);
	if (running) return running;

	const task = roomApi
		.info(roomID)
		.then((info) => {
			const prev = cache.get(roomID);
			const at = Date.now();
			if (prev && sameRoom(prev.info, info)) {
				cache.set(roomID, { info: prev.info, at });
				return;
			}
			cache.set(roomID, { info, at });
			emit();
		})
		.catch(() => {})
		.finally(() => {
			inflight.delete(roomID);
		});

	inflight.set(roomID, task);
	return task;
};

export const loadRooms = (roomIDs: number[], force = false): Promise<void> =>
	Promise.all(roomIDs.map((id) => loadRoom(id, force))).then(() => undefined);
