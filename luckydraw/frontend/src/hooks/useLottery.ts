import { useState, useEffect } from 'react';
import {
	ConnectLiveRoom,
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
				console.error(e);
			}
		};

		const interval = setInterval(checkLotteryStatus, 1000);
		return () => clearInterval(interval);
	}, []);

	const startLottery = async (onError: (message: string) => void) => {
		if (watchedRooms.length === 0) {
			onError('请先在设置中添加监听的直播间');
			return;
		}

		try {
			await ConnectLiveRoom(watchedRooms[0]);
			await StartLiveLottery(keyword);
			setLotteryRunning(true);
			setShowResults(false);
			setWinners([]);
			onError('开始收集弹幕...');
		} catch (e: any) {
			onError('启动失败: ' + (e?.message || e || '未知错误'));
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
			onError(`抽奖完成！共抽取 ${winnersData.length} 位获奖者`);
		} catch (e: any) {
			onError('抽奖失败: ' + (e?.message || e || '未知错误'));
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
		handleStartLottery,
		resetLottery,
	};
};
