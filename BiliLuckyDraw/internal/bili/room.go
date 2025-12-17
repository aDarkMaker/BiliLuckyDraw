package bili

import (
	"context"
	"encoding/json"
	"errors"
	"io"
)

type RoomInfo struct {
	RoomID int
	UID    int64
}

func ResolveRoom(ctx context.Context, roomID int) (RoomInfo, error) {
	client := newHTTPClient()

	doGet := func(url string, referRoom int) ([]byte, error) {
		req, err := newGET(ctx, url, referRoom, "")
		if err != nil {
			return nil, err
		}
		resp, err := client.Do(req)
		if err != nil {
			return nil, err
		}
		defer resp.Body.Close()
		return io.ReadAll(resp.Body)
	}

	body2, err := doGet("https://api.live.bilibili.com/xlive/web-room/v1/index/getInfoByRoom?room_id="+itoa(roomID), roomID)
	if err != nil {
		return RoomInfo{}, err
	}

	var r2 struct {
		Code    int    `json:"code"`
		Message string `json:"message"`
		Data    struct {
			RoomInfo struct {
				RoomID int   `json:"room_id"`
				UID    int64 `json:"uid"`
			} `json:"room_info"`
		} `json:"data"`
	}
	if err := json.Unmarshal(body2, &r2); err != nil {
		return RoomInfo{}, err
	}
	if r2.Code != 0 || r2.Data.RoomInfo.RoomID == 0 {
		return RoomInfo{}, errors.New(r2.Message)
	}
	return RoomInfo{RoomID: r2.Data.RoomInfo.RoomID, UID: r2.Data.RoomInfo.UID}, nil
}
