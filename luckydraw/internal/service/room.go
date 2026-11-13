package service

import (
	"encoding/json"
	"fmt"
	"sync"
	"time"

	"luckydraw/internal/bili"
)

type RoomAnchor struct {
	UID  int64  `json:"uid"`
	Name string `json:"name"`
	Face string `json:"face"`
}

type RoomInfo struct {
	RoomID     int        `json:"room_id"`
	Title      string     `json:"title"`
	Cover      string     `json:"cover"`
	Keyframe   string     `json:"keyframe"`
	LiveStatus int        `json:"live_status"`
	Online     int        `json:"online"`
	Attention  int        `json:"attention"`
	AreaName   string     `json:"area_name"`
	ParentArea string     `json:"parent_area_name"`
	Tags       string     `json:"tags"`
	Anchor     RoomAnchor `json:"anchor"`
}

type RoomService struct {
	client func() *bili.Client
	mu     sync.Mutex
	cache  map[int]roomCacheEntry
}

type roomCacheEntry struct {
	payload string
	at      time.Time
}

const roomCacheTTL = 45 * time.Second

func NewRoomService(client func() *bili.Client) *RoomService {
	return &RoomService{client: client, cache: map[int]roomCacheEntry{}}
}

func (s *RoomService) GetRoomInfo(roomID int) (string, error) {
	s.mu.Lock()
	entry, ok := s.cache[roomID]
	s.mu.Unlock()
	if ok && time.Since(entry.at) < roomCacheTTL {
		return entry.payload, nil
	}

	client := s.client()
	if client == nil {
		client = bili.NewClient("")
	}

	info := RoomInfo{RoomID: roomID}
	if err := fetchRoomDetail(client, &info); err != nil {
		data, _ := json.Marshal(info)
		return string(data), nil
	}
	fetchRoomAnchor(client, &info)

	data, err := json.Marshal(info)
	if err != nil {
		return "", err
	}
	payload := string(data)

	s.mu.Lock()
	s.cache[roomID] = roomCacheEntry{payload: payload, at: time.Now()}
	s.mu.Unlock()
	return payload, nil
}

func (s *RoomService) GetRoomPlayURL(roomID int) (string, error) {
	client := s.client()
	if client == nil {
		client = bili.NewClient("")
	}

	url, err := fetchRoomPlayURL(client, roomID)
	if err != nil {
		return "", err
	}
	data, err := json.Marshal(map[string]string{"url": url})
	if err != nil {
		return "", err
	}
	return string(data), nil
}

func fetchRoomDetail(client *bili.Client, info *RoomInfo) error {
	raw, err := client.Get("https://api.live.bilibili.com/room/v1/Room/get_info", map[string]string{
		"room_id": fmt.Sprint(info.RoomID),
	})
	if err != nil {
		return err
	}

	var resp struct {
		Code int `json:"code"`
		Data struct {
			RoomID         int    `json:"room_id"`
			UID            int64  `json:"uid"`
			Title          string `json:"title"`
			UserCover      string `json:"user_cover"`
			Keyframe       string `json:"keyframe"`
			LiveStatus     int    `json:"live_status"`
			Online         int    `json:"online"`
			Attention      int    `json:"attention"`
			AreaName       string `json:"area_name"`
			ParentAreaName string `json:"parent_area_name"`
			Tags           string `json:"tags"`
		} `json:"data"`
	}
	if err := json.Unmarshal(raw, &resp); err != nil {
		return err
	}
	if resp.Code != 0 {
		return fmt.Errorf("room api code %d", resp.Code)
	}

	info.RoomID = resp.Data.RoomID
	info.Title = resp.Data.Title
	info.Cover = resp.Data.UserCover
	info.Keyframe = resp.Data.Keyframe
	info.LiveStatus = resp.Data.LiveStatus
	info.Online = resp.Data.Online
	info.Attention = resp.Data.Attention
	info.AreaName = resp.Data.AreaName
	info.ParentArea = resp.Data.ParentAreaName
	info.Tags = resp.Data.Tags
	info.Anchor.UID = resp.Data.UID
	return nil
}

func fetchRoomAnchor(client *bili.Client, info *RoomInfo) {
	raw, err := client.Get("https://api.live.bilibili.com/live_user/v1/UserInfo/get_anchor_in_room", map[string]string{
		"roomid": fmt.Sprint(info.RoomID),
	})
	if err != nil {
		return
	}

	var resp struct {
		Code int `json:"code"`
		Data struct {
			Info struct {
				UID   int64  `json:"uid"`
				Uname string `json:"uname"`
				Face  string `json:"face"`
			} `json:"info"`
		} `json:"data"`
	}
	if err := json.Unmarshal(raw, &resp); err != nil {
		return
	}
	if resp.Code != 0 {
		return
	}

	if resp.Data.Info.UID != 0 {
		info.Anchor.UID = resp.Data.Info.UID
	}
	info.Anchor.Name = resp.Data.Info.Uname
	info.Anchor.Face = resp.Data.Info.Face
}

func fetchRoomPlayURL(client *bili.Client, roomID int) (string, error) {
	raw, err := client.Get("https://api.live.bilibili.com/xlive/web-room/v2/index/getRoomPlayInfo", map[string]string{
		"room_id":  fmt.Sprint(roomID),
		"protocol": "0,1",
		"format":   "0,1,2",
		"codec":    "0,1",
		"qn":       "0",
		"platform": "web",
		"ptype":    "8",
	})
	if err != nil {
		return "", err
	}

	var resp struct {
		Code    int    `json:"code"`
		Message string `json:"message"`
		Data    struct {
			LiveStatus int `json:"live_status"`
			PlayURLInfo *struct {
				PlayURL *struct {
					Stream []struct {
						ProtocolName string `json:"protocol_name"`
						Format       []struct {
							FormatName string `json:"format_name"`
							Codec      []struct {
								CodecName string `json:"codec_name"`
								BaseURL   string `json:"base_url"`
								URLInfo   []struct {
									Host  string `json:"host"`
									Extra string `json:"extra"`
								} `json:"url_info"`
							} `json:"codec"`
						} `json:"format"`
					} `json:"stream"`
				} `json:"playurl"`
			} `json:"playurl_info"`
		} `json:"data"`
	}
	if err := json.Unmarshal(raw, &resp); err != nil {
		return "", err
	}
	if resp.Code != 0 {
		return "", fmt.Errorf("play api code %d: %s", resp.Code, resp.Message)
	}
	if resp.Data.LiveStatus != 1 || resp.Data.PlayURLInfo == nil || resp.Data.PlayURLInfo.PlayURL == nil {
		return "", fmt.Errorf("room not living")
	}

	prefer := [][3]string{
		{"http_hls", "fmp4", "avc"},
		{"http_hls", "ts", "avc"},
		{"http_hls", "fmp4", "hevc"},
		{"http_hls", "ts", "hevc"},
	}
	streams := resp.Data.PlayURLInfo.PlayURL.Stream
	for _, want := range prefer {
		for _, stream := range streams {
			if stream.ProtocolName != want[0] {
				continue
			}
			for _, format := range stream.Format {
				if format.FormatName != want[1] {
					continue
				}
				for _, codec := range format.Codec {
					if codec.CodecName != want[2] || len(codec.URLInfo) == 0 {
						continue
					}
					info := codec.URLInfo[0]
					return info.Host + codec.BaseURL + info.Extra, nil
				}
			}
		}
	}

	for _, stream := range streams {
		for _, format := range stream.Format {
			for _, codec := range format.Codec {
				if len(codec.URLInfo) == 0 {
					continue
				}
				info := codec.URLInfo[0]
				return info.Host + codec.BaseURL + info.Extra, nil
			}
		}
	}
	return "", fmt.Errorf("no play url")
}
