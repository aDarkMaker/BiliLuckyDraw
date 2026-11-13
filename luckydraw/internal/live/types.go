package live

import (
	"encoding/json"
	"sync"

	"github.com/gorilla/websocket"
	"luckydraw/internal/bili"
)

const (
	PacketHeaderLength    = 16
	ProtocolVersion       = 1
	OperationHeartbeat    = 2
	OperationHeartbeatAck = 3
	OperationMessage      = 5
	OperationJoin         = 7
	OperationWelcome      = 8
)

type DanmakuClient struct {
	roomID      int
	conn        *websocket.Conn
	stop        chan struct{}
	mu          sync.Mutex
	users       map[int64]*DanmakuUser
	onMessage   func(*DanmakuMessage)
	cookie      string
	client      *bili.Client
	authSuccess bool
	online      int64
	uid         int64
	buvid       string
}

type DanmakuUser struct {
	UID      int64  `json:"uid"`
	Username string `json:"username"`
	Count    int    `json:"count"`
}

type DanmakuMessage struct {
	CMD  string          `json:"cmd"`
	Info json.RawMessage `json:"info"`
	Data json.RawMessage `json:"data"`
}

type RoomMeta struct {
	RoomID       int    `json:"room_id"`
	UID          int64  `json:"uid"`
	ShortID      int    `json:"short_id"`
	Title        string `json:"title"`
	LiveStatus   int    `json:"live_status"`
	DanmakuToken string
	HostList     []DanmakuHost
}

type DanmakuHost struct {
	Host    string `json:"host"`
	Port    int    `json:"port"`
	WsPort  int    `json:"ws_port"`
	WssPort int    `json:"wss_port"`
}

func (h DanmakuHost) wssPort() int {
	port := h.WssPort
	if port == 0 {
		port = h.WsPort
	}
	if port == 0 {
		port = h.Port
	}
	if port == 2243 || port == 0 {
		port = 443
	}
	return port
}

type DanmakuInfo struct {
	UID      int64
	Username string
	Message  string
}
