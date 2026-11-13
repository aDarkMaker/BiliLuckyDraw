package devbridge

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
)

var errMissingKey = errors.New("missing qrcode key")

// API is the subset of the app service that browsers reach over plain HTTP
// when the Wails IPC bridge is not available (e.g. Cursor's embedded browser).
type API interface {
	Login(cookie string) (string, error)
	Logout() error
	GetQRCode() (string, error)
	CheckQRCodeStatus(qrcodeKey string) (string, error)
	LoginWithQRCode(cookie string) (string, error)
	IsLoggedIn() bool
	GetAccountInfo() (string, error)
	GetBackgroundImage() string
	SetBackgroundImage(imagePath string) error
	GetWatchedRooms() (string, error)
	AddWatchedRoom(roomID int) error
	RemoveWatchedRoom(roomID int) error
	GetRoomInfo(roomID int) (string, error)
	GetRoomPlayURL(roomID int) (string, error)
	ConnectLiveRooms(roomIDs []int) error
	StartLiveLottery(keyword string) (string, error)
	StopLiveLottery() error
	DrawWinners(count int) (string, error)
	IsLiveLotteryRunning() bool
	GetParticipantCount() int
	GetLastHistoryError() string
	WatchDanmaku(roomID int) error
	StopDanmaku() error
	GetDanmakuFeed(since int64) (string, error)
	GetEmoteMap() (string, error)
	CopyText(text string) error
}

// APIHandler exposes the browser-facing JSON API as a standalone handler so the
// standalone bridge binary and the Wails dev transport serve identical routes.
func (t *Transport) APIHandler() http.Handler { return t.apiHandler() }

func (t *Transport) apiHandler() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("/api/qr", t.handleQRCode)
	mux.HandleFunc("/api/qr/status", t.handleQRCodeStatus)
	mux.HandleFunc("/api/login/qr", t.handleLoginWithQRCode)
	mux.HandleFunc("/api/login", t.handleLogin)
	mux.HandleFunc("/api/logout", t.handleLogout)
	mux.HandleFunc("/api/session", t.handleSession)
	mux.HandleFunc("/api/background", t.handleBackground)
	mux.HandleFunc("/api/rooms", t.handleRooms)
	mux.HandleFunc("/api/rooms/info", t.handleRoomInfo)
	mux.HandleFunc("/api/rooms/play", t.handleRoomPlay)
	mux.HandleFunc("/api/lottery/connect", t.handleLotteryConnect)
	mux.HandleFunc("/api/lottery/start", t.handleLotteryStart)
	mux.HandleFunc("/api/lottery/stop", t.handleLotteryStop)
	mux.HandleFunc("/api/lottery/draw", t.handleLotteryDraw)
	mux.HandleFunc("/api/lottery/status", t.handleLotteryStatus)
	mux.HandleFunc("/api/lottery/history-error", t.handleLotteryHistoryError)
	mux.HandleFunc("/api/danmaku/watch", t.handleDanmakuWatch)
	mux.HandleFunc("/api/danmaku", t.handleDanmakuFeed)
	mux.HandleFunc("/api/danmaku/emotes", t.handleDanmakuEmotes)
	mux.HandleFunc("/api/clipboard", t.handleClipboard)
	return mux
}

func (t *Transport) handleClipboard(rw http.ResponseWriter, r *http.Request) {
	if !t.requireAPI(rw, r, http.MethodPost) {
		return
	}
	var body struct {
		Text string `json:"text"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeAPIError(rw, err)
		return
	}
	if err := t.api.CopyText(body.Text); err != nil {
		writeAPIError(rw, err)
		return
	}
	writeJSON(rw, http.StatusOK, map[string]bool{"ok": true})
}

func (t *Transport) handleQRCode(rw http.ResponseWriter, r *http.Request) {
	if !t.requireAPI(rw, r, http.MethodGet) {
		return
	}
	payload, err := t.api.GetQRCode()
	if err != nil {
		writeAPIError(rw, err)
		return
	}
	writeRawJSON(rw, payload)
}

func (t *Transport) handleQRCodeStatus(rw http.ResponseWriter, r *http.Request) {
	if !t.requireAPI(rw, r, http.MethodGet) {
		return
	}
	key := r.URL.Query().Get("key")
	if key == "" {
		writeAPIError(rw, errMissingKey)
		return
	}
	payload, err := t.api.CheckQRCodeStatus(key)
	if err != nil {
		writeAPIError(rw, err)
		return
	}
	writeRawJSON(rw, payload)
}

func (t *Transport) handleLoginWithQRCode(rw http.ResponseWriter, r *http.Request) {
	if !t.requireAPI(rw, r, http.MethodPost) {
		return
	}
	var body struct {
		Cookie string `json:"cookie"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeAPIError(rw, err)
		return
	}
	message, err := t.api.LoginWithQRCode(body.Cookie)
	if err != nil {
		writeAPIError(rw, err)
		return
	}
	writeJSON(rw, http.StatusOK, map[string]string{"message": message})
}

func (t *Transport) handleLogin(rw http.ResponseWriter, r *http.Request) {
	if !t.requireAPI(rw, r, http.MethodPost) {
		return
	}
	var body struct {
		Cookie string `json:"cookie"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeAPIError(rw, err)
		return
	}
	message, err := t.api.Login(body.Cookie)
	if err != nil {
		writeAPIError(rw, err)
		return
	}
	writeJSON(rw, http.StatusOK, map[string]string{"message": message})
}

func (t *Transport) handleLogout(rw http.ResponseWriter, r *http.Request) {
	if !t.requireAPI(rw, r, http.MethodPost) {
		return
	}
	if err := t.api.Logout(); err != nil {
		writeAPIError(rw, err)
		return
	}
	writeJSON(rw, http.StatusOK, map[string]bool{"ok": true})
}

func (t *Transport) handleSession(rw http.ResponseWriter, r *http.Request) {
	if !t.requireAPI(rw, r, http.MethodGet) {
		return
	}

	payload := map[string]any{"logged_in": t.api.IsLoggedIn()}
	if payload["logged_in"] == true {
		account, err := t.api.GetAccountInfo()
		if err != nil {
			writeAPIError(rw, err)
			return
		}
		payload["account"] = json.RawMessage(account)
	}

	writeJSON(rw, http.StatusOK, payload)
}

func (t *Transport) handleBackground(rw http.ResponseWriter, r *http.Request) {
	if t.api == nil {
		writeJSON(rw, http.StatusServiceUnavailable, map[string]string{"error": "dev bridge api unavailable"})
		return
	}
	switch r.Method {
	case http.MethodGet:
		writeJSON(rw, http.StatusOK, map[string]string{"image": t.api.GetBackgroundImage()})
	case http.MethodPost:
		var body struct {
			Image string `json:"image"`
		}
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			writeAPIError(rw, err)
			return
		}
		if err := t.api.SetBackgroundImage(body.Image); err != nil {
			writeAPIError(rw, err)
			return
		}
		writeJSON(rw, http.StatusOK, map[string]bool{"ok": true})
	default:
		rw.Header().Set("Allow", "GET, POST")
		writeJSON(rw, http.StatusMethodNotAllowed, map[string]string{"error": "method not allowed"})
	}
}

func (t *Transport) handleRooms(rw http.ResponseWriter, r *http.Request) {
	if t.api == nil {
		writeJSON(rw, http.StatusServiceUnavailable, map[string]string{"error": "dev bridge api unavailable"})
		return
	}
	switch r.Method {
	case http.MethodGet:
		payload, err := t.api.GetWatchedRooms()
		if err != nil {
			writeAPIError(rw, err)
			return
		}
		writeRawJSON(rw, payload)
	case http.MethodPost:
		var body struct {
			RoomID int `json:"room_id"`
		}
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			writeAPIError(rw, err)
			return
		}
		if body.RoomID <= 0 {
			writeJSON(rw, http.StatusBadRequest, map[string]string{"error": "invalid room_id"})
			return
		}
		if err := t.api.AddWatchedRoom(body.RoomID); err != nil {
			writeAPIError(rw, err)
			return
		}
		writeJSON(rw, http.StatusOK, map[string]bool{"ok": true})
	case http.MethodDelete:
		var body struct {
			RoomID int `json:"room_id"`
		}
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			writeAPIError(rw, err)
			return
		}
		if err := t.api.RemoveWatchedRoom(body.RoomID); err != nil {
			writeAPIError(rw, err)
			return
		}
		writeJSON(rw, http.StatusOK, map[string]bool{"ok": true})
	default:
		rw.Header().Set("Allow", "GET, POST, DELETE")
		writeJSON(rw, http.StatusMethodNotAllowed, map[string]string{"error": "method not allowed"})
	}
}

func (t *Transport) handleRoomInfo(rw http.ResponseWriter, r *http.Request) {
	if !t.requireAPI(rw, r, http.MethodGet) {
		return
	}
	id := 0
	if _, err := fmt.Sscanf(r.URL.Query().Get("id"), "%d", &id); err != nil || id <= 0 {
		writeJSON(rw, http.StatusBadRequest, map[string]string{"error": "invalid room id"})
		return
	}
	payload, err := t.api.GetRoomInfo(id)
	if err != nil {
		writeAPIError(rw, err)
		return
	}
	writeRawJSON(rw, payload)
}

func (t *Transport) handleRoomPlay(rw http.ResponseWriter, r *http.Request) {
	if !t.requireAPI(rw, r, http.MethodGet) {
		return
	}
	id := 0
	if _, err := fmt.Sscanf(r.URL.Query().Get("id"), "%d", &id); err != nil || id <= 0 {
		writeJSON(rw, http.StatusBadRequest, map[string]string{"error": "invalid room id"})
		return
	}
	payload, err := t.api.GetRoomPlayURL(id)
	if err != nil {
		writeAPIError(rw, err)
		return
	}
	writeRawJSON(rw, payload)
}

func (t *Transport) handleLotteryConnect(rw http.ResponseWriter, r *http.Request) {
	if !t.requireAPI(rw, r, http.MethodPost) {
		return
	}
	var body struct {
		RoomIDs []int `json:"room_ids"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeAPIError(rw, err)
		return
	}
	if err := t.api.ConnectLiveRooms(body.RoomIDs); err != nil {
		writeAPIError(rw, err)
		return
	}
	writeJSON(rw, http.StatusOK, map[string]bool{"ok": true})
}

func (t *Transport) handleLotteryStart(rw http.ResponseWriter, r *http.Request) {
	if !t.requireAPI(rw, r, http.MethodPost) {
		return
	}
	var body struct {
		Keyword string `json:"keyword"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeAPIError(rw, err)
		return
	}
	payload, err := t.api.StartLiveLottery(body.Keyword)
	if err != nil {
		writeAPIError(rw, err)
		return
	}
	writeRawJSON(rw, payload)
}

func (t *Transport) handleLotteryStop(rw http.ResponseWriter, r *http.Request) {
	if !t.requireAPI(rw, r, http.MethodPost) {
		return
	}
	if err := t.api.StopLiveLottery(); err != nil {
		writeAPIError(rw, err)
		return
	}
	writeJSON(rw, http.StatusOK, map[string]bool{"ok": true})
}

func (t *Transport) handleLotteryDraw(rw http.ResponseWriter, r *http.Request) {
	if !t.requireAPI(rw, r, http.MethodPost) {
		return
	}
	var body struct {
		Count int `json:"count"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeAPIError(rw, err)
		return
	}
	if body.Count <= 0 {
		body.Count = 1
	}
	payload, err := t.api.DrawWinners(body.Count)
	if err != nil {
		writeAPIError(rw, err)
		return
	}
	writeRawJSON(rw, payload)
}

func (t *Transport) handleLotteryStatus(rw http.ResponseWriter, r *http.Request) {
	if !t.requireAPI(rw, r, http.MethodGet) {
		return
	}
	writeJSON(rw, http.StatusOK, map[string]any{
		"running":      t.api.IsLiveLotteryRunning(),
		"participants": t.api.GetParticipantCount(),
	})
}

func (t *Transport) handleLotteryHistoryError(rw http.ResponseWriter, r *http.Request) {
	if !t.requireAPI(rw, r, http.MethodGet) {
		return
	}
	writeJSON(rw, http.StatusOK, map[string]string{"error": t.api.GetLastHistoryError()})
}

func (t *Transport) handleDanmakuWatch(rw http.ResponseWriter, r *http.Request) {
	if !t.requireAPI(rw, r, http.MethodPost) {
		return
	}
	var body struct {
		RoomID int `json:"room_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeAPIError(rw, err)
		return
	}
	if body.RoomID <= 0 {
		writeJSON(rw, http.StatusBadRequest, map[string]string{"error": "invalid room_id"})
		return
	}
	if err := t.api.WatchDanmaku(body.RoomID); err != nil {
		writeAPIError(rw, err)
		return
	}
	writeJSON(rw, http.StatusOK, map[string]bool{"ok": true})
}

func (t *Transport) handleDanmakuFeed(rw http.ResponseWriter, r *http.Request) {
	if t.api == nil {
		writeJSON(rw, http.StatusServiceUnavailable, map[string]string{"error": "dev bridge api unavailable"})
		return
	}
	switch r.Method {
	case http.MethodGet:
		var since int64
		_, _ = fmt.Sscanf(r.URL.Query().Get("since"), "%d", &since)
		payload, err := t.api.GetDanmakuFeed(since)
		if err != nil {
			writeAPIError(rw, err)
			return
		}
		writeRawJSON(rw, payload)
	case http.MethodDelete:
		if err := t.api.StopDanmaku(); err != nil {
			writeAPIError(rw, err)
			return
		}
		writeJSON(rw, http.StatusOK, map[string]bool{"ok": true})
	default:
		rw.Header().Set("Allow", "GET, DELETE")
		writeJSON(rw, http.StatusMethodNotAllowed, map[string]string{"error": "method not allowed"})
	}
}

func (t *Transport) handleDanmakuEmotes(rw http.ResponseWriter, r *http.Request) {
	if !t.requireAPI(rw, r, http.MethodGet) {
		return
	}
	payload, err := t.api.GetEmoteMap()
	if err != nil {
		writeAPIError(rw, err)
		return
	}
	writeRawJSON(rw, payload)
}

func (t *Transport) requireAPI(rw http.ResponseWriter, r *http.Request, method string) bool {
	if t.api == nil {
		writeJSON(rw, http.StatusServiceUnavailable, map[string]string{"error": "dev bridge api unavailable"})
		return false
	}
	if r.Method != method {
		rw.Header().Set("Allow", method)
		writeJSON(rw, http.StatusMethodNotAllowed, map[string]string{"error": "method not allowed"})
		return false
	}
	return true
}

func writeRawJSON(rw http.ResponseWriter, payload string) {
	rw.Header().Set("Content-Type", "application/json")
	rw.WriteHeader(http.StatusOK)
	_, _ = rw.Write([]byte(payload))
}

func writeJSON(rw http.ResponseWriter, status int, payload any) {
	data, err := json.Marshal(payload)
	if err != nil {
		http.Error(rw, err.Error(), http.StatusInternalServerError)
		return
	}
	rw.Header().Set("Content-Type", "application/json")
	rw.WriteHeader(status)
	_, _ = rw.Write(data)
}

func writeAPIError(rw http.ResponseWriter, err error) {
	writeJSON(rw, http.StatusBadGateway, map[string]string{"error": err.Error()})
}
