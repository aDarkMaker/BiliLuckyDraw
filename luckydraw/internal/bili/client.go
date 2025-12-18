package bili

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"
)

type Client struct {
	cookie string
	csrf   string
	client *http.Client
}

func NewClient(cookie string) *Client {
	csrf := extractCSRF(cookie)
	return &Client{
		cookie: cookie,
		csrf:   csrf,
		client: &http.Client{Timeout: 30 * time.Second},
	}
}

func extractCSRF(cookie string) string {
	parts := strings.Split(cookie, ";")
	for _, part := range parts {
		part = strings.TrimSpace(part)
		if strings.HasPrefix(part, "bili_jct=") {
			return strings.TrimPrefix(part, "bili_jct=")
		}
	}
	return ""
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

func (c *Client) Post(urlStr string, data map[string]string) ([]byte, error) {
	values := url.Values{}
	for k, v := range data {
		values.Set(k, v)
	}

	req, err := http.NewRequest("POST", urlStr, strings.NewReader(values.Encode()))
	if err != nil {
		return nil, err
	}

	req.Header.Set("Cookie", c.cookie)
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8")
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
	req.Header.Set("Accept", "application/json, text/plain, */*")

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
}

func (c *Client) GetUnreadNum() (*UnreadInfo, error) {
	data, err := c.Get("https://api.bilibili.com/x/msgfeed/unread", nil)
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

	var info UnreadInfo
	if err := json.Unmarshal(resp.Data, &info); err != nil {
		return nil, err
	}

	return &info, nil
}

type UnreadInfo struct {
	At    int `json:"at"`
	Reply int `json:"reply"`
}

func (c *Client) GetMyAtInfo() ([]AtInfo, error) {
	data, err := c.Get("https://api.bilibili.com/x/msgfeed/at", nil)
	if err != nil {
		return nil, err
	}

	var resp struct {
		Code int `json:"code"`
		Data struct {
			Items []struct {
				AtTime int64 `json:"at_time"`
				Item   struct {
					Business      string `json:"business"`
					Uri           string `json:"uri"`
					SourceContent string `json:"source_content"`
				} `json:"item"`
				User struct {
					Nickname string `json:"nickname"`
				} `json:"user"`
			} `items"`
		} `json:"data"`
	}

	if err := json.Unmarshal(data, &resp); err != nil {
		return nil, err
	}

	if resp.Code != 0 {
		return nil, fmt.Errorf("api error: %d", resp.Code)
	}

	var result []AtInfo
	for _, item := range resp.Data.Items {
		result = append(result, AtInfo{
			AtTime:        item.AtTime,
			UpUname:       item.User.Nickname,
			Business:      item.Item.Business,
			SourceContent: item.Item.SourceContent,
			URL:           item.Item.Uri,
		})
	}

	return result, nil
}

type AtInfo struct {
	AtTime        int64  `json:"at_time"`
	UpUname       string `json:"up_uname"`
	Business      string `json:"business"`
	SourceContent string `json:"source_content"`
	URL           string `json:"url"`
}

func (c *Client) AutoRelay(uid int64, dyid string, msg string) error {
	data := map[string]string{
		"uid":        fmt.Sprintf("%d", uid),
		"dynamic_id": dyid,
		"content":    msg,
		"ctrl":       "[]",
		"csrf":       c.csrf,
	}

	respData, err := c.Post("https://api.vc.bilibili.com/dynamic_repost/v1/dynamic_repost/repost", data)
	if err != nil {
		return err
	}

	var resp APIResponse
	if err := json.Unmarshal(respData, &resp); err != nil {
		return err
	}

	if resp.Code != 0 {
		return fmt.Errorf("api error: %d %s", resp.Code, resp.Message)
	}

	return nil
}

func (c *Client) AutoLike(dyid string) error {
	data := map[string]string{
		"dynamic_id": dyid,
		"up":         "1",
		"csrf":       c.csrf,
	}

	respData, err := c.Post("https://api.vc.bilibili.com/dynamic_like/v1/dynamic_like/thumb", data)
	if err != nil {
		return err
	}

	var resp APIResponse
	if err := json.Unmarshal(respData, &resp); err != nil {
		return err
	}

	if resp.Code != 0 {
		return fmt.Errorf("api error: %d %s", resp.Code, resp.Message)
	}

	return nil
}

func (c *Client) SendChat(rid string, msg string, chatType int) error {
	data := map[string]string{
		"oid":     rid,
		"type":    fmt.Sprintf("%d", chatType),
		"message": msg,
		"csrf":    c.csrf,
	}

	respData, err := c.Post("https://api.bilibili.com/x/v2/reply/add", data)
	if err != nil {
		return err
	}

	var resp APIResponse
	if err := json.Unmarshal(respData, &resp); err != nil {
		return err
	}

	if resp.Code != 0 {
		return fmt.Errorf("api error: %d %s", resp.Code, resp.Message)
	}

	return nil
}

func (c *Client) GetDynamicDetail(dyid string) ([]byte, error) {
	return c.Get("https://api.bilibili.com/x/polymer/web-dynamic/v1/detail", map[string]string{
		"id":       dyid,
		"features": "itemOpusStyle",
	})
}

func (c *Client) GetDynamicFeed(hostMid int64, offset string) ([]byte, error) {
	params := map[string]string{
		"host_mid": fmt.Sprintf("%d", hostMid),
		"offset":   offset,
	}
	return c.Get("https://api.bilibili.com/x/polymer/web-dynamic/v1/feed/space", params)
}

func (c *Client) GetLotteryNotice(dyid string) (*LotteryNotice, error) {
	data, err := c.Get("https://api.vc.bilibili.com/lottery_svr/v1/lottery_svr/lottery_notice", map[string]string{
		"dynamic_id": dyid,
	})
	if err != nil {
		return nil, err
	}

	var resp APIResponse
	if err := json.Unmarshal(data, &resp); err != nil {
		return nil, err
	}

	if resp.Code == -9999 {
		return &LotteryNotice{TS: -9999}, nil
	}

	if resp.Code != 0 {
		return &LotteryNotice{TS: -1}, fmt.Errorf("api error: %d %s", resp.Code, resp.Message)
	}

	var notice struct {
		LotteryTime int64 `json:"lottery_time"`
	}
	if err := json.Unmarshal(resp.Data, &notice); err != nil {
		return nil, err
	}

	return &LotteryNotice{TS: notice.LotteryTime}, nil
}

type LotteryNotice struct {
	TS int64 `json:"ts"`
}

func (c *Client) ReserveLottery(reserveID string) error {
	data := map[string]string{
		"cur_btn_status": "1",
		"reserve_id":     reserveID,
		"csrf":           c.csrf,
	}

	respData, err := c.Post("https://api.vc.bilibili.com/dynamic_mix/v1/dynamic_mix/reserve_attach_card_button", data)
	if err != nil {
		return err
	}

	var resp APIResponse
	if err := json.Unmarshal(respData, &resp); err != nil {
		return err
	}

	if resp.Code != 0 && resp.Code != 7604003 {
		return fmt.Errorf("api error: %d %s", resp.Code, resp.Message)
	}

	return nil
}
