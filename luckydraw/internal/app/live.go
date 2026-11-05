package app

import (
	"encoding/json"
	"fmt"

	"luckydraw/internal/config"
)

func (a *AppService) ConnectLiveRooms(roomIDs []int) error {
	return a.live.ConnectLiveRooms(roomIDs)
}

func (a *AppService) StartLiveLottery(keyword string) (string, error) {
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
	if err := json.Unmarshal([]byte(result), &winners); err == nil && len(winners) > 0 {
		profile := a.profile.ActiveProfile()
		if profile != nil {
			if err := a.profile.AddHistory(profile.ID, a.live.LastKeyword(), len(winners), winners); err != nil {
				a.lastHistoryError = err.Error()
			}
		}
	}
	return result, nil
}

func (a *AppService) GetLastHistoryError() string {
	err := a.lastHistoryError
	a.lastHistoryError = ""
	return err
}

func (a *AppService) GetParticipantCount() int {
	return a.live.GetParticipantCount()
}

func (a *AppService) CopyText(text string) error {
	if a.app == nil || !a.app.Clipboard.SetText(text) {
		return fmt.Errorf("clipboard unavailable")
	}
	return nil
}

func (a *AppService) IsLiveLotteryRunning() bool {
	return a.live.IsLiveLotteryRunning()
}
