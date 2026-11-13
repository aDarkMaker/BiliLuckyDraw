package live

import (
	"encoding/json"
	"fmt"
	"strings"
)

func ParseDanmakuText(msg *DanmakuMessage) (uid int64, username, message string, ok bool) {
	uid, username, message, _, ok = ParseDanmakuContent(msg)
	return
}

func ParseDanmakuContent(msg *DanmakuMessage) (uid int64, username, message, face string, ok bool) {
	if msg == nil || (msg.CMD != "DANMU_MSG" && !strings.HasPrefix(msg.CMD, "DANMU_MSG:")) {
		return 0, "", "", "", false
	}
	var info []interface{}
	if err := json.Unmarshal(msg.Info, &info); err != nil || len(info) < 3 {
		return 0, "", "", "", false
	}
	userInfo, ok := info[2].([]interface{})
	if !ok || len(userInfo) < 2 {
		return 0, "", "", "", false
	}
	uid, ok = coerceInt64(userInfo[0])
	if !ok {
		return 0, "", "", "", false
	}
	username, ok = userInfo[1].(string)
	if !ok {
		return 0, "", "", "", false
	}
	message, ok = info[1].(string)
	if !ok {
		return 0, "", "", "", false
	}
	return uid, username, message, extractDanmakuFace(info), true
}

// ParseDanmakuEmotes pulls inline bracket→URL mappings from DANMU_MSG extras.
func ParseDanmakuEmotes(msg *DanmakuMessage) map[string]string {
	if msg == nil || (msg.CMD != "DANMU_MSG" && !strings.HasPrefix(msg.CMD, "DANMU_MSG:")) {
		return nil
	}
	var info []interface{}
	if err := json.Unmarshal(msg.Info, &info); err != nil || len(info) == 0 {
		return nil
	}
	meta, ok := info[0].([]interface{})
	if !ok {
		return nil
	}
	out := map[string]string{}
	for _, idx := range []int{13, 14, 15} {
		if idx >= len(meta) {
			continue
		}
		collectEmotes(meta[idx], out)
	}
	if len(out) == 0 {
		return nil
	}
	return out
}

func collectEmotes(v interface{}, out map[string]string) {
	switch node := v.(type) {
	case string:
		var nested interface{}
		if json.Unmarshal([]byte(node), &nested) == nil {
			collectEmotes(nested, out)
		}
	case map[string]interface{}:
		if emots, ok := node["emots"].(map[string]interface{}); ok {
			for key, raw := range emots {
				if item, ok := raw.(map[string]interface{}); ok {
					if url, _ := item["url"].(string); strings.HasPrefix(url, "http") {
						out[key] = url
					}
				}
			}
		}
		if url, _ := node["url"].(string); strings.HasPrefix(url, "http") {
			if emoji, _ := node["emoji"].(string); emoji != "" {
				out[emoji] = url
			}
			if descript, _ := node["descript"].(string); descript != "" {
				out[descript] = url
			}
		}
		for _, child := range node {
			collectEmotes(child, out)
		}
	case []interface{}:
		for _, child := range node {
			collectEmotes(child, out)
		}
	}
}

// ParseFeedLine extracts chat or enter-room lines for the danmaku panel.
func ParseFeedLine(msg *DanmakuMessage) (uid int64, username, message, face, kind string, ok bool) {
	if msg == nil {
		return 0, "", "", "", "", false
	}
	if uid, username, message, face, ok = ParseDanmakuContent(msg); ok {
		return uid, username, message, face, "danmaku", true
	}
	if msg.CMD != "INTERACT_WORD" {
		return 0, "", "", "", "", false
	}
	var data struct {
		UID     json.RawMessage `json:"uid"`
		Uname   string          `json:"uname"`
		Uface   string          `json:"uface"`
		Face    string          `json:"face"`
		MsgType int             `json:"msg_type"`
	}
	if err := json.Unmarshal(msg.Data, &data); err != nil || data.Uname == "" {
		return 0, "", "", "", "", false
	}
	uid, _ = coerceInt64Raw(data.UID)
	face = data.Uface
	if face == "" {
		face = data.Face
	}
	switch data.MsgType {
	case 1:
		return uid, data.Uname, "进入了直播间", face, "enter", true
	case 2:
		return uid, data.Uname, "关注了主播", face, "follow", true
	default:
		return 0, "", "", "", "", false
	}
}

func extractDanmakuFace(info []interface{}) string {
	if len(info) == 0 {
		return ""
	}
	meta, ok := info[0].([]interface{})
	if !ok || len(meta) <= 15 {
		return ""
	}
	return digFace(meta[15])
}

func digFace(v interface{}) string {
	switch node := v.(type) {
	case string:
		if strings.HasPrefix(node, "http") {
			return node
		}
		var nested interface{}
		if json.Unmarshal([]byte(node), &nested) == nil {
			return digFace(nested)
		}
	case map[string]interface{}:
		if face, ok := node["face"].(string); ok && face != "" {
			return face
		}
		if user, ok := node["user"].(map[string]interface{}); ok {
			if face := digFace(user); face != "" {
				return face
			}
		}
		if base, ok := node["base"].(map[string]interface{}); ok {
			if face, ok := base["face"].(string); ok {
				return face
			}
		}
	}
	return ""
}

func coerceInt64Raw(raw json.RawMessage) (int64, bool) {
	if len(raw) == 0 {
		return 0, false
	}
	var n float64
	if err := json.Unmarshal(raw, &n); err == nil {
		return int64(n), true
	}
	var s string
	if err := json.Unmarshal(raw, &s); err == nil {
		return coerceInt64(s)
	}
	return 0, false
}

func coerceInt64(v interface{}) (int64, bool) {
	switch n := v.(type) {
	case float64:
		return int64(n), true
	case json.Number:
		i, err := n.Int64()
		return i, err == nil
	case string:
		var i int64
		_, err := fmt.Sscanf(n, "%d", &i)
		return i, err == nil && n != ""
	case int64:
		return n, true
	case int:
		return int64(n), true
	default:
		return 0, false
	}
}
