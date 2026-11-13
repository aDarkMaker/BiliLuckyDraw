import { AppService } from '../../../bindings/luckydraw/internal/app';
import type { Winner } from '@/types';
import { parseJSON } from '@/utils/json';
import { callHTTP, fallback } from '@/services/http';

export interface LotteryStatus {
	running?: boolean;
	participants?: number;
	failures?: { room_id: number }[];
}

export const lotteryApi = {
	status: async (): Promise<{ running: boolean; participants: number }> =>
		fallback(
			async () => ({
				running: await AppService.IsLiveLotteryRunning(),
				participants: await AppService.GetParticipantCount(),
			}),
			() => callHTTP<{ running: boolean; participants: number }>('/api/lottery/status')
		),
	isRunning: () =>
		fallback(
			() => AppService.IsLiveLotteryRunning(),
			async () => (await callHTTP<{ running: boolean }>('/api/lottery/status')).running
		),
	participants: () =>
		fallback(
			() => AppService.GetParticipantCount(),
			async () => (await callHTTP<{ participants: number }>('/api/lottery/status')).participants
		),
	connect: (roomIDs: number[]) =>
		fallback(
			() => AppService.ConnectLiveRooms(roomIDs),
			async () => {
				await callHTTP('/api/lottery/connect', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ room_ids: roomIDs }),
				});
			}
		),
	start: async (keyword: string): Promise<LotteryStatus> =>
		fallback(
			async () => {
				const raw = await AppService.StartLiveLottery(keyword);
				if (!raw) throw new Error('empty start');
				return parseJSON<LotteryStatus>(raw, {});
			},
			() =>
				callHTTP<LotteryStatus>('/api/lottery/start', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ keyword }),
				})
		),
	stop: () =>
		fallback(
			() => AppService.StopLiveLottery(),
			async () => {
				await callHTTP('/api/lottery/stop', { method: 'POST' });
			}
		),
	draw: async (count: number): Promise<Winner[]> =>
		fallback(
			async () => parseJSON<Winner[]>(await AppService.DrawWinners(count), []),
			() =>
				callHTTP<Winner[]>('/api/lottery/draw', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ count }),
				})
		),
	lastHistoryError: () =>
		fallback(
			() => AppService.GetLastHistoryError(),
			async () => (await callHTTP<{ error?: string }>('/api/lottery/history-error')).error || ''
		),
};
