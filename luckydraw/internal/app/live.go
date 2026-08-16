package app

import (
	"encoding/json"

	"luckydraw/internal/config"
)

func (a *AppService) ConnectLiveRooms(roomIDs []int) error {
	return a.live.ConnectLiveRooms(roomIDs)
}

func (a *AppService) StartLiveLottery(keyword string) error {
	return a.live.StartLiveLottery(keyword)
}

func (a *AppService) StopLiveLottery() error {
	return a.live.StopLiveLottery()
}

func (a *AppService) DrawWinners(count int) (string, error) {
	result, err := a.live.DrawWinners(count)
	if err != nil {
		return "", err
	}

	var winners []config.HistoryWinner
	if err := json.Unmarshal([]byte(result), &winners); err == nil {
		profile := a.profile.ActiveProfile()
		if profile != nil {
			_ = a.profile.AddHistory(profile.ID, profile.Keyword, count, winners)
		}
	}
	return result, nil
}

func (a *AppService) GetParticipantCount() int {
	return a.live.GetParticipantCount()
}

func (a *AppService) IsLiveLotteryRunning() bool {
	return a.live.IsLiveLotteryRunning()
}
