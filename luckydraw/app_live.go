package main

import (
	"encoding/json"
	"fmt"

	"luckydraw/internal/live"
)

func (a *App) ConnectLiveRoom(roomID int) error {
	a.mu.Lock()
	defer a.mu.Unlock()

	if a.client == nil {
		return fmt.Errorf("请先登录")
	}

	if a.liveLottery != nil && a.liveLottery.IsRunning() {
		a.liveLottery.Stop()
	}

	cookie := a.client.GetCookie()
	a.liveLottery = live.NewLiveLottery(roomID, cookie)
	return nil
}

func (a *App) StartLiveLottery(keyword string) error {
	a.mu.Lock()
	defer a.mu.Unlock()

	if a.liveLottery == nil {
		return fmt.Errorf("请先连接直播间")
	}

	return a.liveLottery.Start(keyword)
}

func (a *App) StopLiveLottery() error {
	a.mu.Lock()
	defer a.mu.Unlock()

	if a.liveLottery == nil {
		return fmt.Errorf("未连接直播间")
	}

	a.liveLottery.Stop()
	return nil
}

func (a *App) DrawWinners(count int) (string, error) {
	a.mu.Lock()
	defer a.mu.Unlock()

	if a.liveLottery == nil {
		return "", fmt.Errorf("未连接直播间")
	}

	winners := a.liveLottery.Draw(count)
	data, err := json.Marshal(winners)
	if err != nil {
		return "", err
	}

	return string(data), nil
}

func (a *App) GetParticipantCount() int {
	a.mu.Lock()
	defer a.mu.Unlock()

	if a.liveLottery == nil {
		return 0
	}

	return a.liveLottery.GetParticipantCount()
}

func (a *App) IsLiveLotteryRunning() bool {
	a.mu.Lock()
	defer a.mu.Unlock()

	if a.liveLottery == nil {
		return false
	}

	return a.liveLottery.IsRunning()
}
