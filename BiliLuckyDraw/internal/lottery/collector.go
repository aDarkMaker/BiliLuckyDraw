package lottery

import (
	"math/rand/v2"
	"strings"
	"sync"
	"time"
)

type User struct {
	UID   int64  `json:"uid"`
	Uname string `json:"uname"`
}

type Collector struct {
	mu        sync.RWMutex
	enabled   bool
	keyword   string
	users     map[int64]User
	updatedAt time.Time
}

func NewCollector() *Collector {
	return &Collector{users: map[int64]User{}}
}

func (c *Collector) Start(keyword string) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.enabled = true
	c.keyword = strings.TrimSpace(keyword)
	c.users = map[int64]User{}
	c.updatedAt = time.Now()
}

func (c *Collector) Stop() {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.enabled = false
	c.updatedAt = time.Now()
}

func (c *Collector) Enabled() bool {
	c.mu.RLock()
	defer c.mu.RUnlock()
	return c.enabled
}

func (c *Collector) Add(u User, text string) {
	c.mu.Lock()
	defer c.mu.Unlock()
	if !c.enabled {
		return
	}
	if c.keyword != "" && strings.TrimSpace(text) != c.keyword {
		return
	}
	if u.UID == 0 || u.Uname == "" {
		return
	}
	c.users[u.UID] = u
	c.updatedAt = time.Now()
}

func (c *Collector) Count() int {
	c.mu.RLock()
	defer c.mu.RUnlock()
	return len(c.users)
}

func (c *Collector) Snapshot() []User {
	c.mu.RLock()
	defer c.mu.RUnlock()
	out := make([]User, 0, len(c.users))
	for _, u := range c.users {
		out = append(out, u)
	}
	return out
}

func (c *Collector) Draw(n int) []User {
	users := c.Snapshot()
	if n <= 0 || len(users) == 0 {
		return nil
	}
	if n > len(users) {
		n = len(users)
	}
	rand.Shuffle(len(users), func(i, j int) { users[i], users[j] = users[j], users[i] })
	return users[:n]
}
