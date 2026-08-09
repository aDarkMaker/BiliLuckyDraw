package bili

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

type Client struct {
	cookie string
	client *http.Client
}

var DefaultHTTPClient = &http.Client{
	Timeout: 30 * time.Second,
	Transport: &http.Transport{
		MaxIdleConns:       10,
		IdleConnTimeout:    90 * time.Second,
		DisableCompression: false,
	},
}

func NewClient(cookie string) *Client {
	return &Client{
		cookie: cookie,
		client: DefaultHTTPClient,
	}
}

func (c *Client) GetCookie() string {
	return c.cookie
}

func (c *Client) Get(url string, params map[string]string) ([]byte, error) {
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Cookie", c.cookie)
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
	req.Header.Set("Accept", "application/json, text/plain, */*")

	if len(params) > 0 {
		q := req.URL.Query()
		for k, v := range params {
			q.Set(k, v)
		}
		req.URL.RawQuery = q.Encode()
	}

	resp, err := c.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	return io.ReadAll(resp.Body)
}

type APIResponse struct {
	Code    int             `json:"code"`
	Message string          `json:"message"`
	Data    json.RawMessage `json:"data"`
}

func (c *Client) GetMyInfo() (*UserInfo, error) {
	data, err := c.Get("https://api.bilibili.com/x/space/myinfo", nil)
	if err != nil {
		return nil, err
	}

	var resp APIResponse
	if err := json.Unmarshal(data, &resp); err != nil {
		return nil, err
	}

	if resp.Code != 0 {
		return nil, fmt.Errorf("api error: %d %s", resp.Code, resp.Message)
	}

	var info UserInfo
	if err := json.Unmarshal(resp.Data, &info); err != nil {
		return nil, err
	}

	return &info, nil
}

type UserInfo struct {
	Mid  int64  `json:"mid"`
	Name string `json:"name"`
	Face string `json:"face"`
}
