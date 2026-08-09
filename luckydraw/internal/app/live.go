package app

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
	return a.live.DrawWinners(count)
}

func (a *AppService) GetParticipantCount() int {
	return a.live.GetParticipantCount()
}

func (a *AppService) IsLiveLotteryRunning() bool {
	return a.live.IsLiveLotteryRunning()
}
