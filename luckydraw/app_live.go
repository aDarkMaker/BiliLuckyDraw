package main

import (
	"encoding/json"
	"fmt"

	"luckydraw/internal/live"
)

func (a *App) ConnectLiveRooms(roomIDs []int) error {
	a.mu.Lock()
	defer a.mu.Unlock()

	if a.client == nil {
		return fmt.Errorf("Login First")
	}

	if a.liveLottery != nil && a.liveLottery.IsRunning() {
		a.liveLottery.Stop()
	}

	cookie := a.client.GetCookie()
	a.liveLottery = live.NewLiveLottery(roomIDs, cookie)
	return nil
}

func (a *App) StartLiveLottery(keyword string) error {
	a.mu.Lock()
	defer a.mu.Unlock()

	if a.liveLottery == nil {
		return fmt.Errorf("先看几个直播呢？")
	}

	return a.liveLottery.Start(keyword)
}

func (a *App) StopLiveLottery() error {
	a.mu.Lock()
	defer a.mu.Unlock()

	if a.liveLottery == nil {
		return fmt.Errorf("啥也不看抽什么奖？")
	}

	a.liveLottery.Stop()
	return nil
}

func (a *App) DrawWinners(count int) (string, error) {
	a.mu.Lock()
	defer a.mu.Unlock()

	if a.liveLottery == nil {
		return "", fmt.Errorf("没有直播间给你抽哦～")
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
