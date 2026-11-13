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
	Timeout: 20 * time.Second,
	Transport: &http.Transport{
		MaxIdleConns:        32,
		MaxIdleConnsPerHost: 8,
		MaxConnsPerHost:     12,
		IdleConnTimeout:     120 * time.Second,
		TLSHandshakeTimeout: 10 * time.Second,
		ForceAttemptHTTP2:   true,
		DisableCompression:  false,
	},
}

func NewClient(cookie string) *Client {
	return &Client{
		cookie: cookie,
		client: DefaultHTTPClient,
	}
}

type APIError struct {
	Code    int
	Message string
}

func (e *APIError) Error() string {
	return fmt.Sprintf("api error: %d %s", e.Code, e.Message)
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
		return nil, &APIError{Code: resp.Code, Message: resp.Message}
	}

	var info UserInfo
	if err := json.Unmarshal(resp.Data, &info); err != nil {
		return nil, err
	}

	return &info, nil
}

func (c *Client) GetUserCard(mid int64) (*UserCard, error) {
	data, err := c.Get("https://api.bilibili.com/x/web-interface/card", map[string]string{
		"mid":   fmt.Sprintf("%d", mid),
		"photo": "true",
	})
	if err != nil {
		return nil, err
	}

	var resp APIResponse
	if err := json.Unmarshal(data, &resp); err != nil {
		return nil, err
	}
	if resp.Code != 0 {
		return nil, &APIError{Code: resp.Code, Message: resp.Message}
	}

	var card UserCard
	if err := json.Unmarshal(resp.Data, &card); err != nil {
		return nil, err
	}
	return &card, nil
}

func (c *Client) GetUpStat(mid int64) (*UpStat, error) {
	data, err := c.Get("https://api.bilibili.com/x/space/upstat", map[string]string{
		"mid": fmt.Sprintf("%d", mid),
	})
	if err != nil {
		return nil, err
	}

	var resp APIResponse
	if err := json.Unmarshal(data, &resp); err != nil {
		return nil, err
	}
	if resp.Code != 0 {
		return nil, &APIError{Code: resp.Code, Message: resp.Message}
	}

	var stat UpStat
	if err := json.Unmarshal(resp.Data, &stat); err != nil {
		return nil, err
	}
	return &stat, nil
}

type UserInfo struct {
	Mid       int64  `json:"mid"`
	Name      string `json:"name"`
	Face      string `json:"face"`
	Sign      string `json:"sign"`
	Level     int    `json:"level"`
	Follower  int64  `json:"follower"`
	Following int64  `json:"following"`
}

type UserCard struct {
	Card struct {
		Mid         string `json:"mid"`
		Name        string `json:"name"`
		Face        string `json:"face"`
		Sign        string `json:"sign"`
		Fans        int64  `json:"fans"`
		Attention   int64  `json:"attention"`
		LevelInfo   struct {
			CurrentLevel int `json:"current_level"`
		} `json:"level_info"`
	} `json:"card"`
	Space *struct {
		SImg string `json:"s_img"`
		LImg string `json:"l_img"`
	} `json:"space"`
	Follower     int64 `json:"follower"`
	ArchiveCount int64 `json:"archive_count"`
	LikeNum      int64 `json:"like_num"`
	ArticleCount int64 `json:"article_count"`
}

type UpStat struct {
	Archive struct {
		View int64 `json:"view"`
	} `json:"archive"`
	Article struct {
		View int64 `json:"view"`
	} `json:"article"`
	Likes int64 `json:"likes"`
}
