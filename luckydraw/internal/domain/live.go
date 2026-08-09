package domain

type LiveLotteryService interface {
	ConnectLiveRooms(roomIDs []int) error
	StartLiveLottery(keyword string) error
	StopLiveLottery() error
	DrawWinners(count int) (string, error)
	GetParticipantCount() int
	IsLiveLotteryRunning() bool
}
