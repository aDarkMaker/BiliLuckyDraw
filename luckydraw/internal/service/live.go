package service

import (
	"encoding/json"
	"fmt"
	"sync"

	"luckydraw/internal/bili"
	"luckydraw/internal/event"
	"luckydraw/internal/live"
)

type LiveLotteryService struct {
	mu         sync.Mutex
	liveLottery *live.LiveLottery
	emitter    event.Emitter
	cookie     func() *bili.Client
	lastKeyword string
}

func NewLiveLotteryService(emitter event.Emitter, cookie func() *bili.Client) *LiveLotteryService {
	return &LiveLotteryService{emitter: emitter, cookie: cookie}
}

func (s *LiveLotteryService) ConnectLiveRooms(roomIDs []int) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	client := s.cookie()
	if client == nil {
		return fmt.Errorf("Login First")
	}

	if s.liveLottery != nil && s.liveLottery.IsRunning() {
		s.liveLottery.Stop()
	}

	s.liveLottery = live.NewLiveLottery(roomIDs, client.GetCookie())
	return nil
}

type ConnectStatus struct {
	Connected int                `json:"connected"`
	Total     int                `json:"total"`
	Failures  []live.RoomFailure `json:"failures,omitempty"`
}

func (s *LiveLotteryService) StartLiveLottery(keyword string) (string, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	if s.liveLottery == nil {
		return "", fmt.Errorf("先看几个直播呢？")
	}

	s.liveLottery.OnUserJoin = func(user *live.DanmakuUser) {
		if s.emitter != nil {
			s.emitter.Emit("live:user_join", user)
		}
	}
	total := s.liveLottery.RoomCount()
	connected, failures, err := s.liveLottery.Start(keyword)
	if err != nil {
		return "", err
	}
	s.lastKeyword = keyword
	data, err := json.Marshal(ConnectStatus{Connected: connected, Total: total, Failures: failures})
	if err != nil {
		return "", err
	}
	return string(data), nil
}

func (s *LiveLotteryService) StopLiveLottery() error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if s.liveLottery == nil {
		return fmt.Errorf("啥也不看抽什么奖？")
	}
	s.liveLottery.Stop()
	return nil
}

func (s *LiveLotteryService) DrawWinners(count int) (string, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	if s.liveLottery == nil {
		return "", fmt.Errorf("没有直播间给你抽哦～")
	}

	winners := s.liveLottery.Draw(count)
	data, err := json.Marshal(winners)
	if err != nil {
		return "", err
	}
	return string(data), nil
}

func (s *LiveLotteryService) LastKeyword() string {
	s.mu.Lock()
	defer s.mu.Unlock()
	return s.lastKeyword
}

func (s *LiveLotteryService) GetParticipantCount() int {
	s.mu.Lock()
	defer s.mu.Unlock()

	if s.liveLottery == nil {
		return 0
	}
	return s.liveLottery.GetParticipantCount()
}

func (s *LiveLotteryService) IsLiveLotteryRunning() bool {
	s.mu.Lock()
	defer s.mu.Unlock()

	if s.liveLottery == nil {
		return false
	}
	return s.liveLottery.IsRunning()
}

func (s *LiveLotteryService) Stop() {
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.liveLottery != nil {
		s.liveLottery.Stop()
		s.liveLottery = nil
	}
}
