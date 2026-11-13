package service

import (
	"encoding/json"
	"fmt"
	"strconv"
	"strings"
	"sync"
	"time"

	"luckydraw/internal/bili"
)

type EmoteService struct {
	mu     sync.Mutex
	cookie func() *bili.Client
	cache  map[string]string
	loaded time.Time
	roomID int
}

func NewEmoteService(cookie func() *bili.Client) *EmoteService {
	return &EmoteService{cookie: cookie, cache: map[string]string{}}
}

// Latin chat shortcuts that Bilibili clients accept for yellow-face names.
// Values are Chinese names already present in the reply emote pack; URLs always
// come from the API, never from this table.
var latinAliases = map[string]string{
	"oh": "哦呼",
}

func (s *EmoteService) Map(roomID int) (map[string]string, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	needReload := len(s.cache) == 0 || time.Since(s.loaded) >= 6*time.Hour
	needLive := roomID > 0 && s.roomID != roomID
	if !needReload && !needLive {
		return cloneEmotes(s.cache), nil
	}

	client := s.cookie()
	if client == nil {
		return nil, fmt.Errorf("Login First")
	}

	next := map[string]string{}
	if needReload {
		if err := loadReplyEmotes(client, next); err != nil {
			return nil, err
		}
	} else {
		for k, v := range s.cache {
			next[k] = v
		}
	}

	if roomID > 0 {
		_ = mergeLiveEmotes(client, roomID, next)
		s.roomID = roomID
	}

	applyLatinAliases(next)
	if len(next) == 0 {
		return nil, fmt.Errorf("no emotes")
	}
	s.cache = next
	if needReload {
		s.loaded = time.Now()
	}
	return cloneEmotes(s.cache), nil
}

// Observe merges emote URLs learned from live DANMU_MSG payloads.
func (s *EmoteService) Observe(emotes map[string]string) {
	if len(emotes) == 0 {
		return
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.cache == nil {
		s.cache = map[string]string{}
	}
	changed := false
	for key, url := range emotes {
		if putEmote(s.cache, key, url) {
			changed = true
		}
	}
	if changed {
		applyLatinAliases(s.cache)
	}
}

func loadReplyEmotes(client *bili.Client, out map[string]string) error {
	raw, err := client.Get("https://api.bilibili.com/x/emote/user/panel/web", map[string]string{
		"business": "reply",
	})
	if err != nil {
		return err
	}
	var panel struct {
		Code int `json:"code"`
		Data struct {
			Packages []struct {
				ID int `json:"id"`
			} `json:"packages"`
		} `json:"data"`
	}
	if err := json.Unmarshal(raw, &panel); err != nil {
		return err
	}
	if panel.Code != 0 {
		return fmt.Errorf("emote panel code=%d", panel.Code)
	}
	ids := make([]string, 0, len(panel.Data.Packages))
	for _, pkg := range panel.Data.Packages {
		if pkg.ID > 0 {
			ids = append(ids, strconv.Itoa(pkg.ID))
		}
	}
	if len(ids) == 0 {
		return fmt.Errorf("no emote packages")
	}

	detailRaw, err := client.Get("https://api.bilibili.com/x/emote/package", map[string]string{
		"business": "reply",
		"ids":      strings.Join(ids, ","),
	})
	if err != nil {
		return err
	}
	var detail struct {
		Code int `json:"code"`
		Data struct {
			Packages []struct {
				Emote []struct {
					Text string `json:"text"`
					URL  string `json:"url"`
					Meta struct {
						Alias   string   `json:"alias"`
						Suggest []string `json:"suggest"`
					} `json:"meta"`
				} `json:"emote"`
			} `json:"packages"`
		} `json:"data"`
	}
	if err := json.Unmarshal(detailRaw, &detail); err != nil {
		return err
	}
	if detail.Code != 0 {
		return fmt.Errorf("emote package code=%d", detail.Code)
	}
	for _, pkg := range detail.Data.Packages {
		for _, emote := range pkg.Emote {
			putEmote(out, emote.Text, emote.URL)
			if alias := strings.TrimSpace(emote.Meta.Alias); alias != "" {
				putEmote(out, bracket(alias), emote.URL)
			}
			for _, suggest := range emote.Meta.Suggest {
				if suggest = strings.TrimSpace(suggest); suggest != "" {
					putEmote(out, bracket(suggest), emote.URL)
				}
			}
		}
	}
	return nil
}

func mergeLiveEmotes(client *bili.Client, roomID int, out map[string]string) error {
	if roomID <= 0 {
		return fmt.Errorf("invalid room id")
	}
	raw, err := client.Get("https://api.live.bilibili.com/xlive/web-ucenter/v2/emoticon/GetEmoticons", map[string]string{
		"platform": "pc",
		"room_id":  fmt.Sprint(roomID),
	})
	if err != nil {
		return err
	}
	var resp struct {
		Code int `json:"code"`
		Data struct {
			Data []struct {
				Emoticons []struct {
					Emoji   string `json:"emoji"`
					URL     string `json:"url"`
					Emotion string `json:"emotion"`
				} `json:"emoticons"`
			} `json:"data"`
		} `json:"data"`
	}
	if err := json.Unmarshal(raw, &resp); err != nil {
		return err
	}
	if resp.Code != 0 {
		return fmt.Errorf("live emote api code=%d", resp.Code)
	}
	for _, pkg := range resp.Data.Data {
		for _, emote := range pkg.Emoticons {
			key := emote.Emoji
			if key == "" {
				key = emote.Emotion
			}
			putEmote(out, bracket(key), emote.URL)
		}
	}
	return nil
}

func applyLatinAliases(out map[string]string) {
	for latin, chinese := range latinAliases {
		url, ok := out[bracket(chinese)]
		if !ok {
			url, ok = out[chinese]
		}
		if !ok || !isEmoteURL(url) {
			continue
		}
		putEmote(out, bracket(latin), url)
		putEmote(out, bracket(strings.ToUpper(latin)), url)
	}

	extras := map[string]string{}
	for key, url := range out {
		if !isEmoteURL(url) || !strings.HasPrefix(key, "[") || !strings.HasSuffix(key, "]") {
			continue
		}
		inner := key[1 : len(key)-1]
		if inner == "" || !isASCIILetters(inner) {
			continue
		}
		lower := bracket(strings.ToLower(inner))
		upper := bracket(strings.ToUpper(inner))
		if _, exists := out[lower]; !exists {
			extras[lower] = url
		}
		if _, exists := out[upper]; !exists {
			extras[upper] = url
		}
	}
	for key, url := range extras {
		out[key] = url
	}
}

func putEmote(out map[string]string, key, url string) bool {
	key = strings.TrimSpace(key)
	url = strings.TrimSpace(url)
	if key == "" || !isEmoteURL(url) {
		return false
	}
	if !strings.HasPrefix(key, "[") {
		key = bracket(key)
	}
	if existing, ok := out[key]; ok && isEmoteURL(existing) {
		return false
	}
	out[key] = url
	return true
}

func bracket(name string) string {
	name = strings.TrimSpace(name)
	if name == "" {
		return ""
	}
	if strings.HasPrefix(name, "[") && strings.HasSuffix(name, "]") {
		return name
	}
	return "[" + name + "]"
}

func isEmoteURL(url string) bool {
	return strings.HasPrefix(url, "http://") || strings.HasPrefix(url, "https://")
}

func isASCIILetters(s string) bool {
	for i := 0; i < len(s); i++ {
		c := s[i]
		if (c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z') {
			continue
		}
		return false
	}
	return true
}

func cloneEmotes(src map[string]string) map[string]string {
	out := make(map[string]string, len(src))
	for k, v := range src {
		out[k] = v
	}
	return out
}
