import { AppService } from '../../../bindings/luckydraw/internal/app';
import type { DanmakuLine, RoomInfo } from '@/types';
import { parseJSON } from '@/utils/json';
import { callHTTP, fallback } from '@/services/http';

const emptyRoom = (roomID: number): RoomInfo => ({
	room_id: roomID,
	title: '',
	cover: '',
	keyframe: '',
	live_status: 0,
	online: 0,
	attention: 0,
	area_name: '',
	parent_area_name: '',
	tags: '',
	anchor: { uid: 0, name: '', face: '' },
});

export const roomApi = {
	list: async (): Promise<number[]> =>
		fallback(
			async () => parseJSON<number[]>(await AppService.GetWatchedRooms(), []),
			() => callHTTP<number[]>('/api/rooms')
		),
	add: (roomID: number) =>
		fallback(
			() => AppService.AddWatchedRoom(roomID),
			async () => {
				await callHTTP('/api/rooms', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ room_id: roomID }),
				});
			}
		),
	remove: (roomID: number) =>
		fallback(
			() => AppService.RemoveWatchedRoom(roomID),
			async () => {
				await callHTTP('/api/rooms', {
					method: 'DELETE',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ room_id: roomID }),
				});
			}
		),
	info: async (roomID: number): Promise<RoomInfo> =>
		fallback(
			async () => {
				const info = parseJSON<RoomInfo>(await AppService.GetRoomInfo(roomID), emptyRoom(roomID));
				if (!info.title && !info.keyframe && !info.cover && !info.anchor?.name) {
					throw new Error('incomplete room info');
				}
				return { ...emptyRoom(roomID), ...info, room_id: info.room_id || roomID };
			},
			async () => {
				const info = await callHTTP<RoomInfo>(`/api/rooms/info?id=${roomID}`);
				return { ...emptyRoom(roomID), ...info, room_id: info.room_id || roomID };
			}
		),
	playUrl: async (roomID: number): Promise<string> =>
		fallback(
			async () => {
				const getPlayURL = (AppService as { GetRoomPlayURL?: (id: number) => Promise<string> }).GetRoomPlayURL;
				if (!getPlayURL) throw new Error('play binding missing');
				const payload = parseJSON<{ url?: string }>(await getPlayURL(roomID), {});
				if (!payload.url) throw new Error('no play url');
				return payload.url;
			},
			async () => {
				const payload = await callHTTP<{ url: string }>(`/api/rooms/play?id=${roomID}`);
				if (!payload.url) throw new Error('no play url');
				return payload.url;
			}
		),
};

export const danmakuApi = {
	watch: (roomID: number) =>
		callHTTP('/api/danmaku/watch', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ room_id: roomID }),
		}),
	stop: () => callHTTP('/api/danmaku', { method: 'DELETE' }),
	poll: async (since: number): Promise<{ room_id: number; cursor: number; lines: DanmakuLine[] }> => {
		const payload = await callHTTP<{ room_id: number; cursor: number; lines?: DanmakuLine[] }>(
			`/api/danmaku?since=${since}`
		);
		return { room_id: payload.room_id, cursor: payload.cursor, lines: payload.lines ?? [] };
	},
	emotes: () => callHTTP<Record<string, string>>('/api/danmaku/emotes'),
};
