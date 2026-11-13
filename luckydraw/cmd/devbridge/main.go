// Standalone browser bridge: serves the same JSON API as the Wails dev
// transport so a plain browser tab can drive the backend without Wails IPC.
package main

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"

	"luckydraw/internal/config"
	"luckydraw/internal/devbridge"
	"luckydraw/internal/service"
)

func main() {
	home, _ := os.UserHomeDir()
	configPath := filepath.Join(home, ".luckydraw", "config.json")
	statePath := filepath.Join(home, ".luckydraw", "state.json")
	cfg, _ := config.LoadConfig(configPath)
	state, _ := config.LoadRuntimeState(statePath)

	auth := service.NewAuthService(cfg, configPath)
	profile := service.NewProfileService(state, statePath, nil)
	room := service.NewRoomService(auth.Client)
	live := service.NewLiveLotteryService(nil, auth.Client)
	emotes := service.NewEmoteService(auth.Client)
	danmaku := service.NewDanmakuFeedService(auth.Client, emotes)

	api := &standalone{profile: profile, live: live}
	bridge := devbridge.New(api)
	api.auth = auth
	api.room = room
	api.danmaku = danmaku
	api.emotes = emotes

	mux := http.NewServeMux()
	mux.Handle("/api/", bridge.APIHandler())
	mux.HandleFunc("/wails/", func(rw http.ResponseWriter, _ *http.Request) {
		rw.Header().Set("Content-Type", "application/json")
		rw.WriteHeader(http.StatusServiceUnavailable)
		_, _ = rw.Write([]byte(`{"error":"wails ipc unavailable in standalone bridge; use /api"}`))
	})

	log.Printf("standalone browser bridge listening on http://127.0.0.1:9246")
	if err := http.ListenAndServe("127.0.0.1:9246", mux); err != nil {
		log.Fatal(err)
	}
}

type standalone struct {
	auth    *service.AuthService
	profile *service.ProfileService
	room    *service.RoomService
	live    *service.LiveLotteryService
	emotes  *service.EmoteService
	danmaku *service.DanmakuFeedService

	lastHistoryError string
}

func (s *standalone) Login(cookie string) (string, error) { return s.auth.Login(cookie) }
func (s *standalone) Logout() error                       { return s.auth.Logout() }
func (s *standalone) GetQRCode() (string, error)          { return s.auth.GetQRCode() }
func (s *standalone) CheckQRCodeStatus(key string) (string, error) {
	return s.auth.CheckQRCodeStatus(key)
}
func (s *standalone) LoginWithQRCode(cookie string) (string, error) {
	return s.auth.LoginWithQRCode(cookie)
}
func (s *standalone) IsLoggedIn() bool                  { return s.auth.IsLoggedIn() }
func (s *standalone) GetAccountInfo() (string, error)   { return s.auth.GetAccountInfo() }
func (s *standalone) GetBackgroundImage() string        { return s.profile.GetBackgroundImage() }
func (s *standalone) SetBackgroundImage(p string) error { return s.profile.SetBackgroundImage(p) }
func (s *standalone) GetWatchedRooms() (string, error)  { return s.profile.GetWatchedRooms() }
func (s *standalone) AddWatchedRoom(id int) error       { return s.profile.AddWatchedRoom(id) }
func (s *standalone) RemoveWatchedRoom(id int) error    { return s.profile.RemoveWatchedRoom(id) }
func (s *standalone) GetRoomInfo(id int) (string, error) {
	return s.room.GetRoomInfo(id)
}
func (s *standalone) GetRoomPlayURL(id int) (string, error) { return s.room.GetRoomPlayURL(id) }
func (s *standalone) ConnectLiveRooms(ids []int) error {
	return s.live.ConnectLiveRooms(ids)
}
func (s *standalone) StartLiveLottery(keyword string) (string, error) {
	return s.live.StartLiveLottery(keyword)
}
func (s *standalone) StopLiveLottery() error { return s.live.StopLiveLottery() }
func (s *standalone) IsLiveLotteryRunning() bool {
	return s.live.IsLiveLotteryRunning()
}
func (s *standalone) GetParticipantCount() int  { return s.live.GetParticipantCount() }
func (s *standalone) WatchDanmaku(id int) error { return s.danmaku.Watch(id) }
func (s *standalone) StopDanmaku() error        { s.danmaku.Stop(); return nil }
func (s *standalone) GetDanmakuFeed(since int64) (string, error) {
	return s.danmaku.Snapshot(since)
}

func (s *standalone) GetEmoteMap() (string, error) {
	m, err := s.emotes.Map(s.danmaku.RoomID())
	if err != nil {
		return "", err
	}
	data, err := json.Marshal(m)
	if err != nil {
		return "", err
	}
	return string(data), nil
}

func (s *standalone) DrawWinners(count int) (string, error) {
	result, err := s.live.DrawWinners(count)
	if err != nil {
		return "", err
	}
	var winners []config.HistoryWinner
	if err := json.Unmarshal([]byte(result), &winners); err == nil && len(winners) > 0 {
		if active := s.profile.ActiveProfile(); active != nil {
			if err := s.profile.AddHistory(active.ID, s.live.LastKeyword(), len(winners), winners); err != nil {
				s.lastHistoryError = err.Error()
			}
		}
	}
	return result, nil
}

func (s *standalone) GetLastHistoryError() string {
	err := s.lastHistoryError
	s.lastHistoryError = ""
	return err
}

// No Wails runtime in the standalone bridge, so shell out to the OS clipboard.
func (s *standalone) CopyText(text string) error {
	cmd := clipboardCommand()
	if cmd == nil {
		return errors.New("clipboard unavailable")
	}
	cmd.Stdin = strings.NewReader(text)
	return cmd.Run()
}

func clipboardCommand() *exec.Cmd {
	switch runtime.GOOS {
	case "darwin":
		return exec.Command("pbcopy")
	case "windows":
		return exec.Command("cmd", "/c", "clip")
	default:
		if path, err := exec.LookPath("wl-copy"); err == nil {
			return exec.Command(path)
		}
		if path, err := exec.LookPath("xclip"); err == nil {
			return exec.Command(path, "-selection", "clipboard")
		}
		return nil
	}
}
