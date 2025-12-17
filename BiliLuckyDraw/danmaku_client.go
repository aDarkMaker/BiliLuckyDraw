package main

import (
	"context"
	"encoding/binary"
	"encoding/json"
	"fmt"
	"strings"

	"BiliLuckyDraw/internal/bili"
	"BiliLuckyDraw/internal/danmaku"
)

type DanmakuClient struct {
	roomID  int
	c       *danmaku.Client
	onUser  func(uid int64, uname string, text string)
	onDebug func(payload any)
	cookie  string
}

type dmUser struct {
	UID   int64
	Uname string
	Text  string
}

func (c *DanmakuClient) Close() error {
	if c.c != nil {
		return c.c.Close()
	}
	return nil
}

func (c *DanmakuClient) Run(ctx context.Context, onPacket func(any)) error {
	info, err := bili.ResolveRoom(ctx, c.roomID)
	if err == nil && info.RoomID != 0 {
		c.roomID = info.RoomID
	}

	c.c = danmaku.New(c.roomID)
	if di, err := bili.GetDanmuInfo(ctx, c.roomID, c.cookie); err == nil {
		wsURL := fmt.Sprintf("wss://%s:%d/sub", di.WSHost, di.WSPort)
		c.c.SetEndpoint(wsURL, di.Token)
		if c.onDebug != nil {
			c.onDebug(map[string]any{"stage": "danmu_info", "ws": wsURL, "hosts": di.RawHosts})
		}
	} else if c.onDebug != nil {
		hasSess := strings.Contains(c.cookie, "SESSDATA=")
		c.onDebug(map[string]any{
			"stage":       "danmu_info_failed",
			"err":         err.Error(),
			"cookieLen":   len(c.cookie),
			"hasSESSDATA": hasSess,
		})
	}
	c.c.SetOnDebug(func(payload any) {
		if c.onDebug != nil {
			c.onDebug(payload)
		}
	})
	c.c.SetOnRaw(func(messageType int, data []byte) {
		if c.onDebug == nil {
			return
		}
		if len(data) >= 16 {
			pLen := int(binary.BigEndian.Uint32(data[0:4]))
			hLen := int(binary.BigEndian.Uint16(data[4:6]))
			ver := int(binary.BigEndian.Uint16(data[6:8]))
			op := int(binary.BigEndian.Uint32(data[8:12]))
			c.onDebug(map[string]any{
				"type": messageType,
				"len":  len(data),
				"pLen": pLen,
				"hLen": hLen,
				"ver":  ver,
				"op":   op,
			})
			return
		}
		c.onDebug(map[string]any{"type": messageType, "len": len(data)})
	})
	return c.c.Run(ctx, func(payload []byte) {
		var m danmaku.Msg
		if err := json.Unmarshal(payload, &m); err != nil {
			if c.onDebug != nil {
				c.onDebug(map[string]any{"parse": "json.Unmarshal", "err": err.Error(), "payloadLen": len(payload)})
			}
			return
		}

		if c.onUser != nil && strings.HasPrefix(m.Cmd, "DANMU_MSG") {
			if u, ok := parseDanmuMsg(payload); ok {
				c.onUser(u.UID, u.Uname, u.Text)
			}
		}

		onPacket(map[string]any{
			"roomId": c.roomID,
			"cmd":    m.Cmd,
			"raw":    json.RawMessage(payload),
		})
	})
}

func parseDanmuMsg(payload []byte) (dmUser, bool) {
	var m struct {
		Cmd  string            `json:"cmd"`
		Info []json.RawMessage `json:"info"`
	}
	if err := json.Unmarshal(payload, &m); err != nil {
		return dmUser{}, false
	}
	if !strings.HasPrefix(m.Cmd, "DANMU_MSG") || len(m.Info) < 3 {
		return dmUser{}, false
	}

	var text string
	if err := json.Unmarshal(m.Info[1], &text); err != nil {
		return dmUser{}, false
	}

	var userArr []json.RawMessage
	if err := json.Unmarshal(m.Info[2], &userArr); err != nil || len(userArr) < 2 {
		return dmUser{}, false
	}

	var uid int64
	_ = json.Unmarshal(userArr[0], &uid)
	var uname string
	_ = json.Unmarshal(userArr[1], &uname)

	if uid == 0 || uname == "" {
		return dmUser{}, false
	}
	return dmUser{UID: uid, Uname: uname, Text: text}, true
}
