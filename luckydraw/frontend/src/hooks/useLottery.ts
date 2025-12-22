import { useState, useEffect } from "react";
import {
  ConnectLiveRooms,
  StartLiveLottery,
  StopLiveLottery,
  DrawWinners,
  GetParticipantCount,
  IsLiveLotteryRunning,
} from "../../wailsjs/go/main/App";

interface Winner {
  uid: number;
  username: string;
  count: number;
}

export const useLottery = (watchedRooms: number[]) => {
  const [keyword, setKeyword] = useState("");
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
        // ignore
      }
    };

    const interval = setInterval(checkLotteryStatus, 1000);
    return () => clearInterval(interval);
  }, []);

  const startLottery = async (onError: (message: string) => void) => {
    if (watchedRooms.length === 0) {
      onError("Please add a live room in settings first");
      return;
    }

    try {
      await ConnectLiveRooms(watchedRooms);
      await StartLiveLottery(keyword);
      setLotteryRunning(true);
      setShowResults(false);
      setWinners([]);
      onError("Starting to collect danmaku...");
    } catch (e: any) {
      onError("Failed to start: " + (e?.message || e || "Unknown error"));
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
      onError(`Lottery completed! Drawn ${winnersData.length} winners`);
    } catch (e: any) {
      onError("Lottery failed: " + (e?.message || e || "Unknown error"));
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
