package app

import "encoding/json"

func (a *AppService) WatchDanmaku(roomID int) error {
	return a.danmaku.Watch(roomID)
}

func (a *AppService) StopDanmaku() error {
	a.danmaku.Stop()
	return nil
}

func (a *AppService) GetDanmakuFeed(since int64) (string, error) {
	return a.danmaku.Snapshot(since)
}

func (a *AppService) GetEmoteMap() (string, error) {
	m, err := a.emote.Map(a.danmaku.RoomID())
	if err != nil {
		return "", err
	}
	data, err := json.Marshal(m)
	if err != nil {
		return "", err
	}
	return string(data), nil
}
