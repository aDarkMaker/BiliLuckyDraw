package live

import (
	"bytes"
	"compress/gzip"
	"compress/zlib"
	"encoding/binary"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/gorilla/websocket"
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

type RoomInfo struct {
	RoomID       int    `json:"room_id"`
	UID          int64  `json:"uid"`
	ShortID      int    `json:"short_id"`
	Title        string `json:"title"`
	LiveStatus   int    `json:"live_status"`
	DanmakuToken string
	HostList     []DanmakuHost
}

type DanmakuHost struct {
	Host string `json:"host"`
	Port int    `json:"port"`
}

type DanmakuInfo struct {
	UID      int64
	Username string
	Message  string
}

func NewDanmakuClient(roomID int, cookie string) *DanmakuClient {
	uid, buvid := extractUIDAndBuvid(cookie)
	return &DanmakuClient{
		roomID: roomID,
		stop:   make(chan struct{}),
		users:  make(map[int64]*DanmakuUser),
		cookie: cookie,
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
	roomInfo, err := c.getRoomInfo()
	if err != nil {
		return fmt.Errorf("获取房间信息失败: %v", err)
	}

	hosts := roomInfo.HostList
	if len(hosts) == 0 {
		hosts = []DanmakuHost{
			{Host: "broadcastlv.chat.bilibili.com", Port: 443},
		}
	}

	for _, host := range hosts {
		port := host.Port
		if port == 0 {
			port = 443
		}
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

	return fmt.Errorf("所有弹幕服务器连接失败")
}

func (c *DanmakuClient) getRoomInfo() (*RoomInfo, error) {
	roomURL := fmt.Sprintf("https://api.live.bilibili.com/room/v1/Room/get_info?room_id=%d", c.roomID)
	req1, err := http.NewRequest("GET", roomURL, nil)
	if err != nil {
		return nil, err
	}

	req1.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
	req1.Header.Set("Accept", "application/json, text/plain, */*")
	req1.Header.Set("Accept-Language", "zh-CN,zh;q=0.9,en;q=0.8")
	req1.Header.Set("Referer", "https://live.bilibili.com/")
	req1.Header.Set("Origin", "https://live.bilibili.com")
	if c.cookie != "" {
		req1.Header.Set("Cookie", c.cookie)
	}

	resp, err := http.DefaultClient.Do(req1)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var result struct {
		Code int             `json:"code"`
		Data json.RawMessage `json:"data"`
	}

	if err := json.Unmarshal(body, &result); err != nil {
		return nil, fmt.Errorf("解析房间信息失败: %v", err)
	}

	if result.Code != 0 {
		return nil, fmt.Errorf("获取房间信息失败: code=%d", result.Code)
	}

	var roomData RoomInfo
	if err := json.Unmarshal(result.Data, &roomData); err != nil {
		return nil, fmt.Errorf("解析房间数据失败: %v", err)
	}

	realRoomID := roomData.RoomID
	if realRoomID == 0 {
		mobileURL := fmt.Sprintf("https://api.live.bilibili.com/room/v1/Room/mobileRoomInit?id=%d", c.roomID)
		reqMobile, err := http.NewRequest("GET", mobileURL, nil)
		if err == nil {
			reqMobile.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
			reqMobile.Header.Set("Accept", "application/json, text/plain, */*")
			if c.cookie != "" {
				reqMobile.Header.Set("Cookie", c.cookie)
			}
			respMobile, err := http.DefaultClient.Do(reqMobile)
			if err == nil {
				defer respMobile.Body.Close()
				bodyMobile, _ := io.ReadAll(respMobile.Body)
				var mobileResult struct {
					Code int `json:"code"`
					Data struct {
						RoomID int `json:"room_id"`
					} `json:"data"`
				}
				if json.Unmarshal(bodyMobile, &mobileResult) == nil && mobileResult.Code == 0 && mobileResult.Data.RoomID > 0 {
					realRoomID = mobileResult.Data.RoomID
				}
			}
		}
		if realRoomID == 0 {
			realRoomID = c.roomID
		}
	}

	roomInfo := &roomData
	roomInfo.RoomID = realRoomID

	danmakuURLs := []string{
		fmt.Sprintf("https://api.live.bilibili.com/xlive/web-room/v1/index/getDanmuInfo?id=%d&type=0", realRoomID),
		fmt.Sprintf("https://api.live.bilibili.com/xlive/web-room/v1/index/getDanmuInfo?id=%d", realRoomID),
		fmt.Sprintf("https://api.live.bilibili.com/room/v1/Danmu/getConf?room_id=%d", realRoomID),
	}

	for i, danmakuURL := range danmakuURLs {
		req2, err := http.NewRequest("GET", danmakuURL, nil)
		if err != nil {
			continue
		}

		req2.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
		req2.Header.Set("Accept", "application/json, text/plain, */*")
		req2.Header.Set("Accept-Language", "zh-CN,zh;q=0.9,en;q=0.8")
		req2.Header.Set("Referer", fmt.Sprintf("https://live.bilibili.com/%d", realRoomID))
		req2.Header.Set("Origin", "https://live.bilibili.com")
		req2.Header.Set("Sec-Fetch-Dest", "empty")
		req2.Header.Set("Sec-Fetch-Mode", "cors")
		req2.Header.Set("Sec-Fetch-Site", "same-site")
		req2.Header.Set("Sec-Ch-Ua", `"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"`)
		req2.Header.Set("Sec-Ch-Ua-Mobile", "?0")
		req2.Header.Set("Sec-Ch-Ua-Platform", `"Windows"`)

		if c.cookie != "" {
			req2.Header.Set("Cookie", c.cookie)
			req2.Header.Set("X-Requested-With", "XMLHttpRequest")
		}

		resp2, err := http.DefaultClient.Do(req2)
		if err != nil {
			continue
		}
		defer resp2.Body.Close()

		body2, err := io.ReadAll(resp2.Body)
		if err != nil {
			continue
		}

		contentEncoding := resp2.Header.Get("Content-Encoding")
		if contentEncoding == "gzip" || (len(body2) > 2 && body2[0] == 0x1f && body2[1] == 0x8b) {
			reader, err := gzip.NewReader(bytes.NewReader(body2))
			if err == nil {
				defer reader.Close()
				body2, err = io.ReadAll(reader)
				if err != nil {
					continue
				}
			}
		}

		if i == 2 {
			var danmakuResult2 struct {
				Code int `json:"code"`
				Data struct {
					Token          string `json:"token"`
					Host           string `json:"host"`
					Port           int    `json:"port"`
					HostServerList []struct {
						Host    string `json:"host"`
						Port    int    `json:"port"`
						WssPort int    `json:"wss_port"`
					} `json:"host_server_list"`
					ServerList []struct {
						Host string `json:"host"`
						Port int    `json:"port"`
					} `json:"server_list"`
				} `json:"data"`
			}

			if err := json.Unmarshal(body2, &danmakuResult2); err == nil && danmakuResult2.Code == 0 {
				roomInfo.DanmakuToken = danmakuResult2.Data.Token
				if len(danmakuResult2.Data.HostServerList) > 0 {
					hostList := make([]DanmakuHost, 0, len(danmakuResult2.Data.HostServerList))
					for _, host := range danmakuResult2.Data.HostServerList {
						port := host.WssPort
						if port == 0 {
							port = host.Port
						}
						if port == 0 {
							port = 443
						}
						hostList = append(hostList, DanmakuHost{
							Host: host.Host,
							Port: port,
						})
					}
					roomInfo.HostList = hostList
					return roomInfo, nil
				} else if danmakuResult2.Data.Host != "" {
					port := danmakuResult2.Data.Port
					if port == 0 {
						port = 443
					}
					roomInfo.HostList = []DanmakuHost{
						{Host: danmakuResult2.Data.Host, Port: port},
					}
					return roomInfo, nil
				}
			}
		} else {
			var danmakuResult struct {
				Code int `json:"code"`
				Data struct {
					Token    string        `json:"token"`
					HostList []DanmakuHost `json:"host_list"`
				} `json:"data"`
			}

			if err := json.Unmarshal(body2, &danmakuResult); err == nil && danmakuResult.Code == 0 {
				roomInfo.DanmakuToken = danmakuResult.Data.Token
				roomInfo.HostList = danmakuResult.Data.HostList
				if len(roomInfo.HostList) > 0 {
					for i := range roomInfo.HostList {
						if roomInfo.HostList[i].Port == 2243 {
							roomInfo.HostList[i].Port = 443
						}
					}
					return roomInfo, nil
				}
			}
		}
	}

	if len(roomInfo.HostList) == 0 {
		defaultHosts := []DanmakuHost{
			{Host: "broadcastlv.chat.bilibili.com", Port: 443},
			{Host: "zj-cn-live-comet.chat.bilibili.com", Port: 443},
		}
		roomInfo.DanmakuToken = ""
		roomInfo.HostList = defaultHosts
		return roomInfo, nil
	}

	return roomInfo, nil
}

func (c *DanmakuClient) sendAuth(roomID int, token string) error {
	authData := map[string]interface{}{
		"uid":      c.uid,
		"roomid":   roomID,
		"protover": 2,
		"platform": "web",
		"type":     2,
	}
	if token != "" {
		authData["key"] = token
	}
	if c.buvid != "" {
		authData["buvid"] = c.buvid
	}

	data, _ := json.Marshal(authData)
	packet := c.makePacket(data, OperationJoin)

	c.mu.Lock()
	conn := c.conn
	c.mu.Unlock()

	if conn == nil {
		return fmt.Errorf("连接未建立")
	}

	return conn.WriteMessage(websocket.BinaryMessage, packet)
}

func (c *DanmakuClient) makePacket(data []byte, operation int32) []byte {
	packetLen := int32(len(data) + PacketHeaderLength)
	buf := new(bytes.Buffer)

	binary.Write(buf, binary.BigEndian, packetLen)
	binary.Write(buf, binary.BigEndian, int16(PacketHeaderLength))
	binary.Write(buf, binary.BigEndian, int16(ProtocolVersion))
	binary.Write(buf, binary.BigEndian, operation)
	binary.Write(buf, binary.BigEndian, int32(2))
	buf.Write(data)

	return buf.Bytes()
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

func (c *DanmakuClient) parsePacket(data []byte, authChan chan<- bool, authSent *bool) {
	if len(data) == 0 {
		return
	}
	buf := bytes.NewReader(data)

	for buf.Len() > 0 {
		if buf.Len() < 16 {
			break
		}
		var header struct {
			PacketLen   int32
			HeaderLen   int16
			ProtocolVer int16
			Operation   int32
			SequenceID  int32
		}

		if err := binary.Read(buf, binary.BigEndian, &header); err != nil {
			break
		}

		if header.PacketLen < int32(header.HeaderLen) {
			break
		}

		bodyLen := header.PacketLen - int32(header.HeaderLen)
		if bodyLen < 0 || bodyLen > 1024*1024 {
			break
		}
		bodyData := make([]byte, bodyLen)
		if n, err := buf.Read(bodyData); err != nil || n != int(bodyLen) {
			break
		}

		switch header.Operation {
		case OperationMessage:
			switch header.ProtocolVer {
			case 2:
				reader, err := zlib.NewReader(bytes.NewReader(bodyData))
				if err == nil {
					decompressed, _ := io.ReadAll(reader)
					reader.Close()
					c.parsePacket(decompressed, authChan, authSent)
				}
			case 0:
				var msg DanmakuMessage
				if err := json.Unmarshal(bodyData, &msg); err == nil {
					c.handleMessage(&msg)
				}
			}
		case OperationWelcome:
			c.mu.Lock()
			c.authSuccess = true
			conn := c.conn
			c.mu.Unlock()
			if !*authSent {
				select {
				case authChan <- true:
				default:
				}
				*authSent = true
			}
			if conn != nil {
				packet := c.makePacket([]byte{}, OperationHeartbeat)
				conn.WriteMessage(websocket.BinaryMessage, packet)
			}
		case OperationHeartbeatAck:
			if len(bodyData) == 4 {
				online := binary.BigEndian.Uint32(bodyData)
				c.mu.Lock()
				c.online = int64(online)
				c.mu.Unlock()
			}
		}
	}
}

func (c *DanmakuClient) handleMessage(msg *DanmakuMessage) {
	if c.onMessage != nil {
		c.onMessage(msg)
	}

	if msg.CMD == "DANMU_MSG" {
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
