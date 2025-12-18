package live

import (
	"encoding/json"
	"fmt"
	"math/rand"
	"strings"
	"sync"
	"time"
)

type LiveLottery struct {
	client    *DanmakuClient
	keyword   string
	mu        sync.Mutex
	users     map[int64]*DanmakuUser
	isRunning bool
}

func NewLiveLottery(roomID int, cookie string) *LiveLottery {
	return &LiveLottery{
		client: NewDanmakuClient(roomID, cookie),
		users:  make(map[int64]*DanmakuUser),
	}
}

func (l *LiveLottery) Start(keyword string) error {
	l.mu.Lock()
	if l.isRunning {
		l.mu.Unlock()
		return fmt.Errorf("抽奖已在运行中")
	}
	l.keyword = keyword
	l.isRunning = true
	l.users = make(map[int64]*DanmakuUser)
	l.mu.Unlock()

	l.client.SetOnMessage(func(msg *DanmakuMessage) {
		l.handleDanmaku(msg)
	})

	if err := l.client.Connect(); err != nil {
		l.mu.Lock()
		l.isRunning = false
		l.mu.Unlock()
		return err
	}

	return nil
}

func (l *LiveLottery) handleDanmaku(msg *DanmakuMessage) {
	if msg.CMD != "DANMU_MSG" {
		return
	}

	var info []interface{}
	if err := json.Unmarshal(msg.Info, &info); err != nil {
		return
	}

	if len(info) < 3 {
		return
	}

	userInfo, ok := info[2].([]interface{})
	if !ok || len(userInfo) < 2 {
		return
	}

	uidFloat, ok := userInfo[0].(float64)
	if !ok {
		return
	}
	uid := int64(uidFloat)

	username, ok := userInfo[1].(string)
	if !ok {
		return
	}

	message, ok := info[1].(string)
	if !ok {
		return
	}

	l.mu.Lock()
	defer l.mu.Unlock()

	if l.keyword == "" || strings.Contains(message, l.keyword) {
		if _, exists := l.users[uid]; !exists {
			l.users[uid] = &DanmakuUser{
				UID:      uid,
				Username: username,
				Count:    1,
			}
		}
	}
}

func (l *LiveLottery) Stop() {
	l.mu.Lock()
	l.isRunning = false
	l.mu.Unlock()

	l.client.Close()
}

func (l *LiveLottery) Draw(count int) []*DanmakuUser {
	l.mu.Lock()
	defer l.mu.Unlock()

	allUsers := make([]*DanmakuUser, 0, len(l.users))
	for _, user := range l.users {
		allUsers = append(allUsers, user)
	}

	if count <= 0 || count > len(allUsers) {
		count = len(allUsers)
	}

	r := rand.New(rand.NewSource(time.Now().UnixNano()))
	r.Shuffle(len(allUsers), func(i, j int) {
		allUsers[i], allUsers[j] = allUsers[j], allUsers[i]
	})

	return allUsers[:count]
}

func (l *LiveLottery) GetParticipantCount() int {
	l.mu.Lock()
	defer l.mu.Unlock()
	return len(l.users)
}

func (l *LiveLottery) IsRunning() bool {
	l.mu.Lock()
	defer l.mu.Unlock()
	return l.isRunning
}
