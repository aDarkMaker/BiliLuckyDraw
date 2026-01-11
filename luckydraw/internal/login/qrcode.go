package login

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"time"
)

type QRLogin struct {
	client *http.Client
}

func NewQRLogin() *QRLogin {
	return &QRLogin{
		client: &http.Client{Timeout: 30 * time.Second},
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

	reqURL := "https://passport.bilibili.com/x/passport-login/web/qrcode/poll?" + params.Encode()
	resp, err := q.client.Get(reqURL)
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

	return &status, nil
}
