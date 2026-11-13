package live

import (
	"fmt"
	"strings"
	"time"

	"github.com/gorilla/websocket"
	"luckydraw/internal/bili"
)

func NewDanmakuClient(roomID int, cookie string) *DanmakuClient {
	uid, buvid := extractUIDAndBuvid(cookie)
	return &DanmakuClient{
		roomID: roomID,
		stop:   make(chan struct{}),
		users:  make(map[int64]*DanmakuUser),
		cookie: cookie,
		client: bili.NewClient(cookie),
		uid:    uid,
		buvid:  buvid,
	}
}

func extractUIDAndBuvid(cookie string) (int64, string) {
	var uid int64
	var buvid string
	parts := strings.Split(cookie, ";")
	for _, part := range parts {
		part = strings.TrimSpace(part)
		if strings.HasPrefix(part, "DedeUserID=") {
			fmt.Sscanf(strings.TrimPrefix(part, "DedeUserID="), "%d", &uid)
		} else if strings.HasPrefix(part, "buvid3=") {
			buvid = strings.TrimPrefix(part, "buvid3=")
		}
	}
	return uid, buvid
}

func (c *DanmakuClient) Connect() error {
	return c.connectWithRetry(true)
}

func (c *DanmakuClient) connectWithRetry(isReconnect bool) error {
	roomInfo, err := c.getRoomInfo()
	if err != nil {
		return fmt.Errorf("找不到直播间信息了喵: %v", err)
	}

	hosts := roomInfo.HostList
	if len(hosts) == 0 {
		hosts = []DanmakuHost{
			{Host: "broadcastlv.chat.bilibili.com", Port: 443},
		}
	}

	for _, host := range hosts {
		port := host.wssPort()
		wsURL := fmt.Sprintf("wss://%s:%d/sub", host.Host, port)
		conn, _, err := websocket.DefaultDialer.Dial(wsURL, nil)
		if err != nil {
			continue
		}

		c.mu.Lock()
		c.conn = conn
		c.authSuccess = false
		c.mu.Unlock()

		authChan := make(chan bool, 1)

		go func() {
			c.receiveMessagesWithAuth(authChan)
			if !isReconnect {
				return
			}
			select {
			case <-c.stop:
				return
			default:
			}
			backoff := 1 * time.Second
			maxBackoff := 30 * time.Second
			for {
				select {
				case <-c.stop:
					return
				case <-time.After(backoff):
				}
				if err := c.connectWithRetry(true); err == nil {
					return
				}
				backoff *= 2
				if backoff > maxBackoff {
					backoff = maxBackoff
				}
			}
		}()

		time.Sleep(200 * time.Millisecond)

		if err := c.sendAuth(roomInfo.RoomID, roomInfo.DanmakuToken); err != nil {
			conn.Close()
			continue
		}

		select {
		case success := <-authChan:
			if success {
				go c.heartbeat()
				return nil
			}
			conn.Close()
		case <-time.After(5 * time.Second):
			conn.Close()
			continue
		}
	}

	return fmt.Errorf("老大我们连接都失败了哎！")
}

func (c *DanmakuClient) heartbeat() {
	ticker := time.NewTicker(10 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-c.stop:
			return
		case <-ticker.C:
			c.mu.Lock()
			conn := c.conn
			c.mu.Unlock()
			if conn == nil {
				return
			}
			heartbeatBody := []byte("[Object object]")
			packet := c.makePacket(heartbeatBody, OperationHeartbeat)
			if err := conn.WriteMessage(websocket.BinaryMessage, packet); err != nil {
				return
			}
		}
	}
}

func (c *DanmakuClient) receiveMessagesWithAuth(authChan chan<- bool) {
	authSent := false
	for {
		select {
		case <-c.stop:
			return
		default:
			c.mu.Lock()
			conn := c.conn
			c.mu.Unlock()
			if conn == nil {
				return
			}

			_, message, err := conn.ReadMessage()
			if err != nil {
				if !authSent {
					select {
					case authChan <- false:
					default:
					}
				}
				return
			}
			c.parsePacket(message, authChan, &authSent)
		}
	}
}

func (c *DanmakuClient) handleMessage(msg *DanmakuMessage) {
	if c.onMessage != nil {
		c.onMessage(msg)
	}

	uid, username, _, ok := ParseDanmakuText(msg)
	if !ok {
		return
	}
	c.mu.Lock()
	if user, exists := c.users[uid]; exists {
		user.Count++
	} else {
		c.users[uid] = &DanmakuUser{
			UID:      uid,
			Username: username,
			Count:    1,
		}
	}
	c.mu.Unlock()
}

func (c *DanmakuClient) GetUsers(keyword string) []*DanmakuUser {
	c.mu.Lock()
	defer c.mu.Unlock()

	users := make([]*DanmakuUser, 0)
	for _, user := range c.users {
		users = append(users, user)
	}
	return users
}

func (c *DanmakuClient) Close() {
	select {
	case <-c.stop:
		return
	default:
		close(c.stop)
	}

	if c.conn != nil {
		c.conn.Close()
	}
}

func (c *DanmakuClient) SetOnMessage(handler func(*DanmakuMessage)) {
	c.onMessage = handler
}
