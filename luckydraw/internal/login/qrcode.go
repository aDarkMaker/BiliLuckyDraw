package login

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"

	"luckydraw/internal/bili"
)

type QRLogin struct {
	client *http.Client
}

func NewQRLogin() *QRLogin {
	return &QRLogin{
		client: bili.DefaultHTTPClient,
	}
}

type QRCodeInfo struct {
	URL       string `json:"url"`
	QrcodeKey string `json:"qrcode_key"`
}

type QRCodeStatus struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
	Data    struct {
		URL          string `json:"url"`
		RefreshToken string `json:"refresh_token"`
		Timestamp    int64  `json:"timestamp"`
		Code         int    `json:"code"`
		Message      string `json:"message"`
	} `json:"data"`
	Cookie string `json:"cookie,omitempty"`
}

func (q *QRLogin) GetQRCode() (*QRCodeInfo, error) {
	resp, err := q.client.Get("https://passport.bilibili.com/x/passport-login/web/qrcode/generate")
	if err != nil {
		return nil, fmt.Errorf("你码不理我: %v", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("零人在意: %v", err)
	}

	var result struct {
		Code int `json:"code"`
		Data struct {
			URL       string `json:"url"`
			QrcodeKey string `json:"qrcode_key"`
		} `json:"data"`
		Message string `json:"message"`
	}

	if err := json.Unmarshal(body, &result); err != nil {
		return nil, fmt.Errorf("解析一败涂地: %v, body: %s", err, string(body))
	}

	if result.Code != 0 {
		return nil, fmt.Errorf("你的码不理我: code=%d, message=%s", result.Code, result.Message)
	}

	if result.Data.URL == "" || result.Data.QrcodeKey == "" {
		return nil, fmt.Errorf("码扫不出来啊: %s", string(body))
	}

	return &QRCodeInfo{
		URL:       result.Data.URL,
		QrcodeKey: result.Data.QrcodeKey,
	}, nil
}

func (q *QRLogin) CheckQRCodeStatus(qrcodeKey string) (*QRCodeStatus, error) {
	params := url.Values{}
	params.Set("qrcode_key", qrcodeKey)

	req, err := http.NewRequest("GET", "https://passport.bilibili.com/x/passport-login/web/qrcode/poll?"+params.Encode(), nil)
	if err != nil {
		return nil, fmt.Errorf("你码不理我: %v", err)
	}
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")

	resp, err := q.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("你码不理我: %v", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("零人在意: %v", err)
	}

	var status QRCodeStatus
	if err := json.Unmarshal(body, &status); err != nil {
		return nil, fmt.Errorf("解析一败涂地: %v, body: %s", err, string(body))
	}

	if status.Code == 0 && status.Data.Code == 0 {
		status.Cookie = collectSetCookies(resp)
	}

	return &status, nil
}

func collectSetCookies(resp *http.Response) string {
	var parts []string
	for _, h := range resp.Header["Set-Cookie"] {
		if idx := strings.IndexByte(h, ';'); idx > 0 {
			parts = append(parts, strings.TrimSpace(h[:idx]))
		} else {
			parts = append(parts, strings.TrimSpace(h))
		}
	}
	return strings.Join(parts, "; ")
}
