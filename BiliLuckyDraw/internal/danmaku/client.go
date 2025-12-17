package danmaku

import (
	"context"
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"github.com/gorilla/websocket"
)

type Client struct {
	roomID  int
	wsURL   string
	token   string
	conn    *websocket.Conn
	cancel  context.CancelFunc
	onRaw   func(messageType int, data []byte)
	onDebug func(payload any)
}

type Msg struct {
	Cmd  string          `json:"cmd"`
	Info json.RawMessage `json:"info"`
	Data json.RawMessage `json:"data"`
}

func New(roomID int) *Client {
	return &Client{roomID: roomID}
}

func (c *Client) SetEndpoint(wsURL string, token string) {
	c.wsURL = wsURL
	c.token = token
}

func (c *Client) SetOnRaw(fn func(messageType int, data []byte)) {
	c.onRaw = fn
}

func (c *Client) SetOnDebug(fn func(payload any)) {
	c.onDebug = fn
}

func (c *Client) Close() error {
	if c.cancel != nil {
		c.cancel()
	}
	if c.conn != nil {
		_ = c.conn.WriteMessage(websocket.CloseMessage, websocket.FormatCloseMessage(websocket.CloseNormalClosure, ""))
		return c.conn.Close()
	}
	return nil
}

func (c *Client) Run(ctx context.Context, onPayload func([]byte)) error {
	ctx, cancel := context.WithCancel(ctx)
	c.cancel = cancel

	backoff := 500 * time.Millisecond
	for {
		if ctx.Err() != nil {
			return nil
		}

		if c.onDebug != nil {
			c.onDebug(map[string]any{"stage": "dial", "roomId": c.roomID})
		}

		err := c.runOnce(ctx, onPayload)
		if ctx.Err() != nil {
			return nil
		}
		if err != nil {
			if c.onDebug != nil {
				c.onDebug(map[string]any{"stage": "error", "err": err.Error(), "backoffMs": backoff.Milliseconds()})
			}
			if backoff < 10*time.Second {
				backoff *= 2
			}
			time.Sleep(backoff)
			continue
		}
		backoff = 500 * time.Millisecond
	}
}

func (c *Client) runOnce(ctx context.Context, onPayload func([]byte)) error {
	dialer := websocket.Dialer{HandshakeTimeout: 8 * time.Second}
	url := c.wsURL
	if strings.TrimSpace(url) == "" {
		url = "wss://broadcastlv.chat.bilibili.com/sub"
	}
	h := http.Header{}
	h.Set("Origin", "https://live.bilibili.com")
	h.Set("User-Agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
	conn, _, err := dialer.DialContext(ctx, url, h)
	if err != nil {
		if c.onDebug != nil {
			c.onDebug(map[string]any{"stage": "dial_failed", "err": err.Error()})
		}
		return err
	}
	c.conn = conn
	defer conn.Close()
	if c.onDebug != nil {
		c.onDebug(map[string]any{"stage": "dial_ok"})
	}

	authBody, _ := json.Marshal(map[string]any{
		"uid":      0,
		"roomid":   c.roomID,
		"protover": 3,
		"platform": "web",
		"type":     2,
		"key":      c.token,
	})
	if err := conn.WriteMessage(websocket.BinaryMessage, Pack(7, 1, authBody)); err != nil {
		if c.onDebug != nil {
			c.onDebug(map[string]any{"stage": "auth_write_failed", "err": err.Error()})
		}
		return err
	}
	if c.onDebug != nil {
		c.onDebug(map[string]any{"stage": "auth_sent"})
	}

	hbCtx, hbCancel := context.WithCancel(ctx)
	defer hbCancel()
	go func() {
		t := time.NewTicker(30 * time.Second)
		defer t.Stop()
		for {
			select {
			case <-hbCtx.Done():
				return
			case <-t.C:
				_ = conn.WriteMessage(websocket.BinaryMessage, Pack(2, 1, []byte{}))
			}
		}
	}()

	for {
		if ctx.Err() != nil {
			return nil
		}

		messageType, data, err := conn.ReadMessage()
		if err != nil {
			if c.onDebug != nil {
				c.onDebug(map[string]any{"stage": "read_failed", "err": err.Error()})
			}
			return err
		}
		if c.onRaw != nil {
			c.onRaw(messageType, data)
		}

		for _, payload := range UnpackAll(data) {
			onPayload(payload)
		}
	}
}
