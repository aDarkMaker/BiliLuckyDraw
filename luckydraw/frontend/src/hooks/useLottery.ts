import { useState, useEffect } from 'react';
import {
	ConnectLiveRooms,
	StartLiveLottery,
	StopLiveLottery,
	DrawWinners,
	GetParticipantCount,
	IsLiveLotteryRunning,
} from '../../wailsjs/go/main/App';

interface Winner {
	uid: number;
	username: string;
	count: number;
}

export const useLottery = (watchedRooms: number[]) => {
	const [keyword, setKeyword] = useState('');
	const [winnerCount, setWinnerCount] = useState(1);
	const [lotteryRunning, setLotteryRunning] = useState(false);
	const [participantCount, setParticipantCount] = useState(0);
	const [winners, setWinners] = useState<Winner[]>([]);
	const [showResults, setShowResults] = useState(false);
	const [isConnecting, setIsConnecting] = useState(false);

	useEffect(() => {
		const checkLotteryStatus = async () => {
			try {
				const running = await IsLiveLotteryRunning();
				setLotteryRunning(running);

				if (running) {
					const count = await GetParticipantCount();
					setParticipantCount(count);
				}
			} catch (e) {
				// ignore
			}
		};

		const interval = setInterval(checkLotteryStatus, 1000);
		return () => clearInterval(interval);
	}, []);

	const startLottery = async (onError: (message: string) => void) => {
		if (watchedRooms.length === 0) {
			onError('请先加几个直播间！');
			return;
		}

		setIsConnecting(true);
		try {
			await ConnectLiveRooms(watchedRooms);
			await StartLiveLottery(keyword);
			setLotteryRunning(true);
			setShowResults(false);
			setWinners([]);
			onError('奖池积累ing...');
		} catch (e: any) {
			onError('不出意外出意外了: ' + (e?.message || e || '未知错误'));
		} finally {
			setIsConnecting(false);
		}
	};

	const stopLottery = async (onError: (message: string) => void) => {
		try {
			await StopLiveLottery();
			const result = await DrawWinners(winnerCount);
			const winnersData = JSON.parse(result);
			setWinners(winnersData);
			setShowResults(true);
			setLotteryRunning(false);
			onError(`好哦！恭喜这 ${winnersData.length} 位LuckyDog！`);
		} catch (e: any) {
			onError('有点小意外: ' + (e?.message || e || '未知错误'));
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
		keyword,
		setKeyword,
		winnerCount,
		setWinnerCount,
		lotteryRunning,
		participantCount,
		winners,
		showResults,
		isConnecting,
		handleStartLottery,
		resetLottery,
	};
};
