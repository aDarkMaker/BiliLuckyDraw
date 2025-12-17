package bili

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"strings"
)

type DanmuInfo struct {
	Token    string
	WSHost   string
	WSPort   int
	RoomID   int
	RawHosts int
}

func GetDanmuInfo(ctx context.Context, roomID int, cookie string) (DanmuInfo, error) {
	// B站这里偶发/地区性风控（常见 code=-352）。实践中“带 Cookie 反而更容易被拦截”，
	// 所以遇到 -352 时自动降级为匿名请求再试一次，避免直接进入 WS 空 token 导致 1006。
	tryOnce := func(cookie string) (DanmuInfo, int, error) {
		req, err := newGET(ctx, "https://api.live.bilibili.com/xlive/web-room/v1/index/getDanmuInfo?id="+itoa(roomID)+"&type=0", roomID, cookie)
		if err != nil {
			return DanmuInfo{}, 0, err
		}
		req.Header.Set("Accept-Language", "zh-CN,zh;q=0.9,en;q=0.8")
		req.Header.Set("Cache-Control", "no-cache")
		req.Header.Set("Pragma", "no-cache")
		req.Header.Set("Sec-Fetch-Dest", "empty")
		req.Header.Set("Sec-Fetch-Mode", "cors")
		req.Header.Set("Sec-Fetch-Site", "same-site")
		req.Header.Set("sec-ch-ua", "\"Not_A Brand\";v=\"8\", \"Chromium\";v=\"120\", \"Google Chrome\";v=\"120\"")
		req.Header.Set("sec-ch-ua-mobile", "?0")
		req.Header.Set("sec-ch-ua-platform", "\"macOS\"")

		do := func(client *http.Client) (DanmuInfo, int, error) {
			resp, err := client.Do(req)
			if err != nil && strings.Contains(err.Error(), "malformed HTTP response") {
				// 若发生协议错配导致的乱码响应，退回标准库 TLS 栈重试一次。
				resp, err = newPlainHTTPClient().Do(req)
			}
			if err != nil {
				return DanmuInfo{}, 0, err
			}
			defer resp.Body.Close()
			body, err := io.ReadAll(resp.Body)
			if err != nil {
				return DanmuInfo{}, 0, err
			}

			var r struct {
				Code    int    `json:"code"`
				Message string `json:"message"`
				Data    struct {
					Token    string `json:"token"`
					HostList []struct {
						Host    string `json:"host"`
						WSPort  int    `json:"ws_port"`
						WSSPort int    `json:"wss_port"`
					} `json:"host_list"`
				} `json:"data"`
			}
			if err := json.Unmarshal(body, &r); err != nil {
				return DanmuInfo{}, 0, err
			}
			if r.Code != 0 {
				return DanmuInfo{}, r.Code, errors.New(itoa(r.Code) + ": " + r.Message)
			}
			if r.Data.Token == "" || len(r.Data.HostList) == 0 {
				return DanmuInfo{}, 0, errors.New("danmu info empty")
			}
			h := r.Data.HostList[0]
			port := h.WSSPort
			if port == 0 {
				port = h.WSPort
			}
			if h.Host == "" || port == 0 {
				return DanmuInfo{}, 0, errors.New("danmu host empty")
			}
			return DanmuInfo{
				Token:    r.Data.Token,
				WSHost:   h.Host,
				WSPort:   port,
				RoomID:   roomID,
				RawHosts: len(r.Data.HostList),
			}, 0, nil
		}

		// 优先使用标准库 TLS（更兼容/更像正常请求），-352 再尝试 uTLS。
		di, code, err := do(newPlainHTTPClient())
		if err == nil || code != -352 {
			return di, code, err
		}
		return do(newHTTPClient())
	}

	di, code, err := tryOnce(cookie)
	if err == nil {
		return di, nil
	}
	if code == -352 && cookie != "" {
		di2, _, err2 := tryOnce("")
		return di2, err2
	}
	return DanmuInfo{}, err
}
