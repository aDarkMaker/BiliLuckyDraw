package service

import (
	"encoding/json"
	"fmt"
	"sync"
	"time"

	"luckydraw/internal/bili"
	"luckydraw/internal/live"
)

type DanmakuLine struct {
	ID       int64  `json:"id"`
	RoomID   int    `json:"room_id"`
	UID      int64  `json:"uid"`
	Username string `json:"username"`
	Face     string `json:"face,omitempty"`
	Message  string `json:"message"`
	Kind     string `json:"kind"`
	Time     int64  `json:"time"`
}

type DanmakuFeedService struct {
	mu     sync.Mutex
	cookie func() *bili.Client
	emotes *EmoteService
	client *live.DanmakuClient
	roomID int
	gen    uint64
	nextID int64
	lines  []DanmakuLine
}

const danmakuFeedCap = 200

func NewDanmakuFeedService(cookie func() *bili.Client, emotes *EmoteService) *DanmakuFeedService {
	return &DanmakuFeedService{cookie: cookie, emotes: emotes, lines: make([]DanmakuLine, 0, 64)}
}

func (s *DanmakuFeedService) Watch(roomID int) error {
	if roomID <= 0 {
		return fmt.Errorf("invalid room id")
	}

	client := s.cookie()
	if client == nil {
		return fmt.Errorf("Login First")
	}

	s.mu.Lock()
	if s.roomID == roomID && s.client != nil {
		s.mu.Unlock()
		return nil
	}
	old := s.client
	s.client = nil
	s.roomID = 0
	s.lines = s.lines[:0]
	s.gen++
	myGen := s.gen
	s.mu.Unlock()
	if old != nil {
		old.Close()
	}

	if s.emotes != nil {
		go func() { _, _ = s.emotes.Map(roomID) }()
	}

	dc := live.NewDanmakuClient(roomID, client.GetCookie())
	dc.SetOnMessage(func(msg *live.DanmakuMessage) {
		s.mu.Lock()
		active := s.gen == myGen
		s.mu.Unlock()
		if !active {
			return
		}
		if s.emotes != nil {
			if learned := live.ParseDanmakuEmotes(msg); len(learned) > 0 {
				s.emotes.Observe(learned)
			}
		}
		uid, name, text, face, kind, ok := live.ParseFeedLine(msg)
		if !ok {
			return
		}
		s.push(DanmakuLine{
			RoomID:   roomID,
			UID:      uid,
			Username: name,
			Face:     face,
			Message:  text,
			Kind:     kind,
			Time:     time.Now().UnixMilli(),
		})
	})

	if err := dc.Connect(); err != nil {
		dc.Close()
		return err
	}

	s.mu.Lock()
	if s.gen != myGen {
		s.mu.Unlock()
		dc.Close()
		return nil
	}
	s.client = dc
	s.roomID = roomID
	s.mu.Unlock()
	return nil
}

func (s *DanmakuFeedService) Stop() {
	s.mu.Lock()
	old := s.client
	s.client = nil
	s.roomID = 0
	s.lines = s.lines[:0]
	s.mu.Unlock()
	if old != nil {
		old.Close()
	}
}

func (s *DanmakuFeedService) push(line DanmakuLine) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.nextID++
	line.ID = s.nextID
	s.lines = append(s.lines, line)
	if len(s.lines) > danmakuFeedCap {
		s.lines = append([]DanmakuLine(nil), s.lines[len(s.lines)-danmakuFeedCap:]...)
	}
}

func (s *DanmakuFeedService) Snapshot(since int64) (string, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	out := make([]DanmakuLine, 0, 32)
	for _, line := range s.lines {
		if line.ID > since {
			out = append(out, line)
		}
	}
	payload := map[string]any{
		"room_id": s.roomID,
		"cursor":  s.nextID,
		"lines":   out,
	}
	data, err := json.Marshal(payload)
	if err != nil {
		return "", err
	}
	return string(data), nil
}

func (s *DanmakuFeedService) RoomID() int {
	s.mu.Lock()
	defer s.mu.Unlock()
	return s.roomID
}
