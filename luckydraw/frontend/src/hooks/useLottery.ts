import { useState, useEffect } from 'react';
import { Events } from '@wailsio/runtime';
import { AppService } from '../../bindings/luckydraw/internal/app';
import { useI18n } from '../i18n';

interface Winner {
	uid: number;
	username: string;
	count: number;
}

export const useLottery = (watchedRooms: number[], keyword: string, winnerCount: number) => {
	const { t } = useI18n();
	const [lotteryRunning, setLotteryRunning] = useState(false);
	const [participantCount, setParticipantCount] = useState(0);
	const [winners, setWinners] = useState<Winner[]>([]);
	const [showResults, setShowResults] = useState(false);
	const [isConnecting, setIsConnecting] = useState(false);

	useEffect(() => {
		const off = Events.On('live:user_join', () => {
			AppService.GetParticipantCount()
				.then((count) => setParticipantCount(count))
				.catch(() => {});
		});
		return () => {
			if (off) off();
		};
	}, []);

	useEffect(() => {
		const checkLotteryStatus = async () => {
			try {
				const running = await AppService.IsLiveLotteryRunning();
				setLotteryRunning(running);

				if (running) {
					const count = await AppService.GetParticipantCount();
					setParticipantCount(count);
				}
			} catch (e) {}
		};

		const interval = setInterval(checkLotteryStatus, 1000);
		return () => clearInterval(interval);
	}, []);

	const startLottery = async (onError: (message: string) => void) => {
		if (watchedRooms.length === 0) {
			onError(t('lottery.toast.noRooms'));
			return;
		}

		setIsConnecting(true);
		try {
			await AppService.ConnectLiveRooms(watchedRooms);
			await AppService.StartLiveLottery(keyword);
			setLotteryRunning(true);
			setShowResults(false);
			setWinners([]);
			onError(t('lottery.toast.accumulating'));
		} catch (e: any) {
			onError(t('lottery.toast.startFailed', { error: String(e?.message || e) }));
		} finally {
			setIsConnecting(false);
		}
	};

	const stopLottery = async (onError: (message: string) => void) => {
		try {
			await AppService.StopLiveLottery();
			const result = await AppService.DrawWinners(winnerCount);
			const winnersData = JSON.parse(result);
			setWinners(winnersData);
			setShowResults(true);
			setLotteryRunning(false);
			onError(t('lottery.toast.drawSuccess', { n: winnersData.length }));
		} catch (e: any) {
			onError(t('lottery.toast.drawFailed', { error: String(e?.message || e) }));
		}
	};

	const handleStartLottery = async (onError: (message: string) => void) => {
		if (!lotteryRunning && !showResults) {
			await startLottery(onError);
		} else if (lotteryRunning) {
			await stopLottery(onError);
		}
	};

	const resetLottery = () => {
		setWinners([]);
		setShowResults(false);
		setParticipantCount(0);
	};

	return {
		lotteryRunning,
		participantCount,
		winners,
		showResults,
		isConnecting,
		handleStartLottery,
		resetLottery,
	};
};