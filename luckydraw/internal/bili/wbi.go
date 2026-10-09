package bili

import (
	"crypto/md5"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/url"
	"sort"
	"strings"
	"sync"
	"time"
)

var mixinKeyEncTab = []int{
	46, 47, 18, 2, 53, 8, 23, 32, 15, 50, 10, 31, 58, 3, 45, 35, 27, 43, 5, 49,
	33, 9, 42, 19, 29, 28, 14, 39, 12, 38, 41, 13, 37, 48, 7, 16, 24, 55, 40,
	61, 26, 17, 0, 1, 60, 51, 30, 4, 22, 25, 54, 21, 56, 59, 6, 63, 57, 62, 11,
	36, 20, 34, 44, 52,
}

func getMixinKey(orig string) string {
	var b strings.Builder
	for _, i := range mixinKeyEncTab {
		if i < len(orig) {
			b.WriteByte(orig[i])
		}
	}
	s := b.String()
	if len(s) > 32 {
		s = s[:32]
	}
	return s
}

type wbiKeyCache struct {
	mu      sync.Mutex
	imgKey  string
	subKey  string
	expires time.Time
}

var globalWbiKeys wbiKeyCache

func (c *Client) wbiKeys() (string, string, error) {
	globalWbiKeys.mu.Lock()
	defer globalWbiKeys.mu.Unlock()

	if globalWbiKeys.imgKey != "" && time.Now().Before(globalWbiKeys.expires) {
		return globalWbiKeys.imgKey, globalWbiKeys.subKey, nil
	}

	data, err := c.Get("https://api.bilibili.com/x/web-interface/nav", nil)
	if err != nil {
		return "", "", err
	}

	var resp struct {
		Data struct {
			WbiImg struct {
				ImgURL string `json:"img_url"`
				SubURL string `json:"sub_url"`
			} `json:"wbi_img"`
		} `json:"data"`
	}
	if err := json.Unmarshal(data, &resp); err != nil {
		return "", "", err
	}

	imgKey := fileNameKey(resp.Data.WbiImg.ImgURL)
	subKey := fileNameKey(resp.Data.WbiImg.SubURL)
	if imgKey == "" || subKey == "" {
		return "", "", fmt.Errorf("wbi key missing")
	}

	globalWbiKeys.imgKey = imgKey
	globalWbiKeys.subKey = subKey
	globalWbiKeys.expires = time.Now().Add(12 * time.Hour)
	return imgKey, subKey, nil
}

func fileNameKey(u string) string {
	idx := strings.LastIndexByte(u, '/')
	if idx < 0 {
		return ""
	}
	name := u[idx+1:]
	if dot := strings.IndexByte(name, '.'); dot >= 0 {
		name = name[:dot]
	}
	return name
}

func (c *Client) SignWBI(params map[string]string) (url.Values, error) {
	imgKey, subKey, err := c.wbiKeys()
	if err != nil {
		return nil, err
	}
	return signWBI(params, imgKey, subKey), nil
}

func signWBI(params map[string]string, imgKey, subKey string) url.Values {
	mixinKey := getMixinKey(imgKey + subKey)

	signed := make(map[string]string, len(params)+1)
	for k, v := range params {
		signed[k] = v
	}
	signed["wts"] = fmt.Sprintf("%d", time.Now().Unix())

	keys := make([]string, 0, len(signed))
	for k := range signed {
		keys = append(keys, k)
	}
	sort.Strings(keys)

	q := url.Values{}
	for _, k := range keys {
		q.Set(k, stripReserved(signed[k]))
	}

	sum := md5.Sum([]byte(q.Encode() + mixinKey))
	q.Set("w_rid", hex.EncodeToString(sum[:]))
	return q
}

func stripReserved(s string) string {
	return strings.Map(func(r rune) rune {
		switch r {
		case '!', '\'', '(', ')', '*':
			return -1
		}
		return r
	}, s)
}

func (c *Client) EnsureBuvid() string {
	if v := cookieValue(c.cookie, "buvid3"); v != "" {
		return v
	}
	if v := cookieValue(c.cookie, "buvid2"); v != "" {
		return v
	}

	data, err := c.Get("https://api.bilibili.com/x/frontend/finger/spi", nil)
	if err != nil {
		return ""
	}
	var resp struct {
		Data struct {
			B3 string `json:"b_3"`
			B4 string `json:"b_4"`
		} `json:"data"`
	}
	if err := json.Unmarshal(data, &resp); err != nil || resp.Data.B3 == "" {
		return ""
	}
	return resp.Data.B3
}

func cookieValue(cookie, name string) string {
	prefix := name + "="
	for _, part := range strings.Split(cookie, ";") {
		part = strings.TrimSpace(part)
		if strings.HasPrefix(part, prefix) {
			return strings.TrimPrefix(part, prefix)
		}
	}
	return ""
}
