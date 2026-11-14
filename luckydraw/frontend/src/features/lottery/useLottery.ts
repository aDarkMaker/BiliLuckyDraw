import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useI18n } from '@/i18n';
import { lotteryApi } from '@/services/api';
import { probeHTTPBridge } from '@/services/http';
import type { Winner } from '@/types';
import { errorMessage } from '@/utils/json';

interface LotteryOptions {
	watchedRooms: number[];
	keyword: string;
	winnerCount: number;
	enabled: boolean;
	notify: (message: string) => void;
}

export const useLottery = ({ watchedRooms, keyword, winnerCount, enabled, notify }: LotteryOptions) => {
	const { t } = useI18n();
	const [running, setRunning] = useState(false);
	const [participantCount, setParticipantCount] = useState(0);
	const [winners, setWinners] = useState<Winner[]>([]);
	const [showResults, setShowResults] = useState(false);
	const [connecting, setConnecting] = useState(false);
	const starting = useRef(false);
	const runningRef = useRef(false);
	const participantsRef = useRef(0);

	useEffect(() => {
		void probeHTTPBridge();
	}, []);

	useEffect(() => {
		if (!enabled) return;
		let alive = true;
		const tick = async () => {
			const status = await lotteryApi.status().catch(() => null);
			if (!alive || !status) return;
			if (status.running !== runningRef.current) {
				runningRef.current = status.running;
				setRunning(status.running);
			}
			if (status.running) {
				const count = status.participants;
				if (count !== participantsRef.current) {
					participantsRef.current = count;
					setParticipantCount(count);
				}
			}
		};
		void tick();
		const timer = setInterval(() => void tick(), 2000);
		return () => {
			alive = false;
			clearInterval(timer);
		};
	}, [enabled]);

	const start = useCallback(async () => {
		if (watchedRooms.length === 0) {
			notify(t('lottery.toast.noRooms'));
			return;
		}
		setConnecting(true);
		try {
			await probeHTTPBridge();
			await lotteryApi.connect(watchedRooms);
			const status = await lotteryApi.start(keyword);
			const alive = await lotteryApi.isRunning().catch(() => false);
			if (!alive) throw new Error('not running');
			runningRef.current = true;
			participantsRef.current = 0;
			setRunning(true);
			setParticipantCount(0);
			setShowResults(false);
			setWinners([]);
			const failed = status.failures?.map((f) => f.room_id).join(', ');
			notify(failed ? t('lottery.toast.roomPartial', { rooms: failed }) : t('lottery.toast.accumulating'));
		} catch (error) {
			runningRef.current = false;
			setRunning(false);
			notify(t('lottery.toast.startFailed', { error: errorMessage(error) }));
		} finally {
			setConnecting(false);
		}
	}, [keyword, notify, t, watchedRooms]);

	const stop = useCallback(async () => {
		try {
			const count = await lotteryApi.participants().catch(() => participantsRef.current);
			await lotteryApi.stop();
			if (count === 0) {
				runningRef.current = false;
				participantsRef.current = 0;
				setRunning(false);
				setParticipantCount(0);
				setShowResults(false);
				notify(t('lottery.toast.emptyPool'));
				return;
			}
			const result = await lotteryApi.draw(winnerCount);
			participantsRef.current = count;
			setParticipantCount(count);
			setWinners(result);
			setShowResults(true);
			runningRef.current = false;
			setRunning(false);
			const historyError = await lotteryApi.lastHistoryError();
			notify(historyError ? t('settings.toast.historySaveFailed', { error: historyError }) : t('lottery.toast.drawSuccess', { n: result.length }));
		} catch (error) {
			notify(t('lottery.toast.drawFailed', { error: errorMessage(error) }));
		}
	}, [notify, t, winnerCount]);

	const toggle = useCallback(async () => {
		if (starting.current) return;
		starting.current = true;
		try {
			if (running) await stop();
			else if (!showResults) await start();
		} finally {
			starting.current = false;
		}
	}, [running, showResults, start, stop]);

	const reset = useCallback(() => {
		setWinners([]);
		setShowResults(false);
		participantsRef.current = 0;
		setParticipantCount(0);
	}, []);

	return useMemo(
		() => ({ running, connecting, participantCount, winners, showResults, toggle, reset }),
		[running, connecting, participantCount, winners, showResults, toggle, reset]
	);
};
