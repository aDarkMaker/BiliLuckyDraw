package live

import (
	"bytes"
	"compress/gzip"
	"encoding/json"
	"fmt"
	"io"
	"net/http"

	"github.com/gorilla/websocket"
	"luckydraw/internal/bili"
)

var httpClient = bili.DefaultHTTPClient

func (c *DanmakuClient) sendAuth(roomID int, token string) error {
	if c.buvid == "" {
		c.buvid = c.client.EnsureBuvid()
	}

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
		return fmt.Errorf("暂时还没对齐颗粒度……")
	}

	return conn.WriteMessage(websocket.BinaryMessage, packet)
}

func (c *DanmakuClient) getRoomInfo() (*RoomMeta, error) {
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
	req1.Header.Set("Connection", "close")
	if c.cookie != "" {
		req1.Header.Set("Cookie", c.cookie)
	}

	resp, err := httpClient.Do(req1)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		io.Copy(io.Discard, resp.Body)
		return nil, fmt.Errorf("火星的网络有点意思: HTTP %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var result struct {
		Code int             `json:"code"`
		Data json.RawMessage `json:"data"`
	}

	if err := json.Unmarshal(body, &result); err != nil {
		return nil, fmt.Errorf("老大这个是什么喵: %v", err)
	}

	if result.Code != 0 {
		return nil, fmt.Errorf("握握手: code=%d", result.Code)
	}

	var roomData RoomMeta
	if err := json.Unmarshal(result.Data, &roomData); err != nil {
		return nil, fmt.Errorf("叽里咕噜看不懂: %v", err)
	}

	realRoomID := roomData.RoomID
	if realRoomID == 0 {
		mobileURL := fmt.Sprintf("https://api.live.bilibili.com/room/v1/Room/mobileRoomInit?id=%d", c.roomID)
		reqMobile, err := http.NewRequest("GET", mobileURL, nil)
		if err == nil {
			reqMobile.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
			reqMobile.Header.Set("Accept", "application/json, text/plain, */*")
			reqMobile.Header.Set("Connection", "close")
			if c.cookie != "" {
				reqMobile.Header.Set("Cookie", c.cookie)
			}
			respMobile, err := httpClient.Do(reqMobile)
			if err == nil {
				defer respMobile.Body.Close()
				if respMobile.StatusCode == http.StatusOK {
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
				} else {
					io.Copy(io.Discard, respMobile.Body)
				}
			}
		}
		if realRoomID == 0 {
			realRoomID = c.roomID
		}
	}

	roomInfo := &roomData
	roomInfo.RoomID = realRoomID

	// 签名接口优先，旧接口仅作降级兜底
	signedURL := ""
	if signed, err := c.client.SignWBI(map[string]string{
		"id":           fmt.Sprintf("%d", realRoomID),
		"type":         "0",
		"web_location": "444.8",
	}); err == nil {
		signedURL = "https://api.live.bilibili.com/xlive/web-room/v1/index/getDanmuInfo?" + signed.Encode()
	}

	danmakuURLs := []string{
		signedURL,
		fmt.Sprintf("https://api.live.bilibili.com/room/v1/Danmu/getConf?room_id=%d", realRoomID),
	}

	for _, danmakuURL := range danmakuURLs {
		if danmakuURL == "" {
			continue
		}
		req2, err := http.NewRequest("GET", danmakuURL, nil)
		if err != nil {
			continue
		}

		req2.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
		req2.Header.Set("Accept", "application/json, text/plain, */*")
		req2.Header.Set("Accept-Language", "zh-CN,zh;q=0.9,en;q=0.8")
		req2.Header.Set("Referer", fmt.Sprintf("https://live.bilibili.com/%d", realRoomID))
		req2.Header.Set("Origin", "https://live.bilibili.com")
		req2.Header.Set("Connection", "close")
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

		resp2, err := httpClient.Do(req2)
		if err != nil {
			continue
		}
		defer resp2.Body.Close()

		if resp2.StatusCode != http.StatusOK {
			io.Copy(io.Discard, resp2.Body)
			continue
		}

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

		var danmakuResult struct {
			Code int `json:"code"`
			Data struct {
				Token          string        `json:"token"`
				Host           string        `json:"host"`
				Port           int           `json:"port"`
				HostList       []DanmakuHost `json:"host_list"`
				HostServerList []DanmakuHost `json:"host_server_list"`
			} `json:"data"`
		}

		if err := json.Unmarshal(body2, &danmakuResult); err != nil || danmakuResult.Code != 0 {
			continue
		}

		roomInfo.DanmakuToken = danmakuResult.Data.Token

		hosts := danmakuResult.Data.HostList
		if len(hosts) == 0 {
			hosts = danmakuResult.Data.HostServerList
		}
		if len(hosts) == 0 && danmakuResult.Data.Host != "" {
			hosts = []DanmakuHost{{
				Host: danmakuResult.Data.Host,
				Port: danmakuResult.Data.Port,
			}}
		}
		if len(hosts) > 0 {
			roomInfo.HostList = hosts
			return roomInfo, nil
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
