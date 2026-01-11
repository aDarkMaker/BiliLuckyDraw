package main

import (
	"context"
	"encoding/json"
	"fmt"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"luckydraw/internal/bili"
	"luckydraw/internal/check"
	"luckydraw/internal/config"
	"luckydraw/internal/live"
	"luckydraw/internal/login"
	"luckydraw/internal/lottery"
)

type App struct {
	ctx         context.Context
	client      *bili.Client
	config      *config.Config
	myUID       int64
	myName      string
	configPath  string
	mu          sync.Mutex
	running     bool
	stopChan    chan struct{}
	liveLottery *live.LiveLottery
}

func NewApp() *App {
	home, _ := os.UserHomeDir()
	configPath := filepath.Join(home, ".luckydraw", "config.json")
	cfg, _ := config.LoadConfig(configPath)

	app := &App{
		config:     cfg,
		configPath: configPath,
		stopChan:   make(chan struct{}),
	}

	if cfg.Cookie != "" {
		app.autoLogin(cfg.Cookie)
	}

	return app
}

func (a *App) autoLogin(cookie string) {
	a.mu.Lock()
	defer a.mu.Unlock()

	if cookie == "" {
		return
	}

	a.client = bili.NewClient(cookie)
	info, err := a.client.GetMyInfo()
	if err != nil {
		a.config.Cookie = ""
		config.SaveConfig(a.configPath, a.config)
		return
	}

	a.myUID = info.Mid
	a.myName = info.Name
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

func (a *App) Login(cookie string) (string, error) {
	a.mu.Lock()
	defer a.mu.Unlock()

	cookie = strings.TrimSpace(cookie)

	if cookie == "" {
		return "", fmt.Errorf("Cookie是空的！")
	}

	a.client = bili.NewClient(cookie)
	info, err := a.client.GetMyInfo()
	if err != nil {
		return "", fmt.Errorf("雜魚: %v", err)
	}

	a.myUID = info.Mid
	a.myName = info.Name

	a.config.Cookie = cookie
	config.SaveConfig(a.configPath, a.config)

	return fmt.Sprintf("这号是你吗: %s (UID: %d)", info.Name, info.Mid), nil
}

func (a *App) GetQRCode() (string, error) {
	qrLogin := login.NewQRLogin()
	qrInfo, err := qrLogin.GetQRCode()
	if err != nil {
		return "", fmt.Errorf("老大咱码没了喵: %v", err)
	}

	result := map[string]string{
		"url":        qrInfo.URL,
		"qrcode_key": qrInfo.QrcodeKey,
	}

	data, _ := json.Marshal(result)
	return string(data), nil
}

func (a *App) CheckQRCodeStatus(qrcodeKey string) (string, error) {
	qrLogin := login.NewQRLogin()
	status, err := qrLogin.CheckQRCodeStatus(qrcodeKey)
	if err != nil {
		return "", fmt.Errorf("验牌失败了: %v", err)
	}

	result := map[string]interface{}{
		"code":    status.Code,
		"message": status.Message,
		"data":    status.Data,
	}

	data, _ := json.Marshal(result)
	return string(data), nil
}

func (a *App) LoginWithQRCode(loginURL string) (string, error) {
	if loginURL == "" {
		return "", fmt.Errorf("登陆有点问题哎～")
	}

	parsedURL, err := url.Parse(loginURL)
	if err != nil {
		return "", fmt.Errorf("前边的登陆现在还做不到哦: %v", err)
	}

	queryParams := parsedURL.Query()
	cookieNames := []string{"DedeUserID", "DedeUserID__ckMd5", "SESSDATA", "bili_jct"}
	var cookieParts []string

	for _, name := range cookieNames {
		value := queryParams.Get(name)
		if value != "" {
			cookieParts = append(cookieParts, fmt.Sprintf("%s=%s", name, value))
		}
	}

	if len(cookieParts) < 4 {
		return "", fmt.Errorf("我们在大量文字中只找到了 %d 个有效信息", len(cookieParts))
	}

	cookieStr := strings.Join(cookieParts, "; ")

	a.mu.Lock()
	a.client = bili.NewClient(cookieStr)
	info, err := a.client.GetMyInfo()
	if err != nil {
		a.mu.Unlock()
		return "", fmt.Errorf("登陆失效了喵: %v", err)
	}

	a.myUID = info.Mid
	a.myName = info.Name

	a.config.Cookie = cookieStr
	config.SaveConfig(a.configPath, a.config)
	a.mu.Unlock()

	return fmt.Sprintf("这号是你吗: %s (UID: %d)", info.Name, info.Mid), nil
}

func (a *App) IsLoggedIn() bool {
	a.mu.Lock()
	defer a.mu.Unlock()
	return a.client != nil && a.myUID > 0
}

func (a *App) GetAccountInfo() (string, error) {
	if a.client == nil {
		return "", fmt.Errorf("Login First！")
	}

	info, err := a.client.GetMyInfo()
	if err != nil {
		return "", err
	}

	result := map[string]interface{}{
		"name": info.Name,
		"uid":  info.Mid,
		"face": info.Face,
	}

	data, _ := json.Marshal(result)
	return string(data), nil
}

func (a *App) GetConfig() (string, error) {
	data, err := json.Marshal(a.config)
	if err != nil {
		return "", err
	}
	return string(data), nil
}

func (a *App) SaveConfig(cfgJSON string) error {
	var cfg config.Config
	if err := json.Unmarshal([]byte(cfgJSON), &cfg); err != nil {
		return err
	}

	a.mu.Lock()
	a.config = &cfg
	a.mu.Unlock()

	return config.SaveConfig(a.configPath, &cfg)
}

func (a *App) StartLottery() (string, error) {
	if a.client == nil {
		return "", fmt.Errorf("Login First！")
	}

	a.mu.Lock()
	if a.running {
		a.mu.Unlock()
		return "", fmt.Errorf("我有我的节奏……")
	}
	a.running = true
	a.mu.Unlock()

	go func() {
		defer func() {
			a.mu.Lock()
			a.running = false
			a.mu.Unlock()
		}()

		service := lottery.NewService(a.client, a.config, a.myUID)

		for {
			select {
			case <-a.stopChan:
				return
			default:
				lotteries, err := service.SearchLotteries()
				if err != nil {
					time.Sleep(time.Duration(a.config.LotteryLoopWait) * time.Millisecond)
					continue
				}

				for _, lottery := range lotteries {
					select {
					case <-a.stopChan:
						return
					default:
						service.Participate(lottery)
						time.Sleep(time.Duration(a.config.Wait) * time.Millisecond)
					}
				}

				if a.config.LotteryLoopWait > 0 {
					time.Sleep(time.Duration(a.config.LotteryLoopWait) * time.Millisecond)
				} else {
					return
				}
			}
		}
	}()

	return "牌没有问题！", nil
}

func (a *App) StopLottery() error {
	a.mu.Lock()
	defer a.mu.Unlock()

	if !a.running {
		return fmt.Errorf("还没有到时候～")
	}

	close(a.stopChan)
	a.stopChan = make(chan struct{})
	a.running = false

	return nil
}

func (a *App) CheckPrize() (string, error) {
	if a.client == nil {
		return "", fmt.Errorf("Login First！")
	}

	service := check.NewService(a.client, a.config, a.myUID)
	result, err := service.CheckPrize()
	if err != nil {
		return "", err
	}

	data, _ := json.Marshal(result)
	return string(data), nil
}

func (a *App) IsRunning() bool {
	a.mu.Lock()
	defer a.mu.Unlock()
	return a.running
}

func (a *App) SetBackgroundImage(imagePath string) error {
	a.mu.Lock()
	defer a.mu.Unlock()

	a.config.BackgroundImage = imagePath
	return config.SaveConfig(a.configPath, a.config)
}

func (a *App) GetBackgroundImage() string {
	a.mu.Lock()
	defer a.mu.Unlock()
	return a.config.BackgroundImage
}

func (a *App) AddWatchedRoom(roomID int) error {
	a.mu.Lock()
	defer a.mu.Unlock()

	for _, id := range a.config.WatchedRooms {
		if id == roomID {
			return fmt.Errorf("严肃观看 %d 的直播！", roomID)
		}
	}

	a.config.WatchedRooms = append(a.config.WatchedRooms, roomID)
	return config.SaveConfig(a.configPath, a.config)
}

func (a *App) RemoveWatchedRoom(roomID int) error {
	a.mu.Lock()
	defer a.mu.Unlock()

	var newRooms []int
	for _, id := range a.config.WatchedRooms {
		if id != roomID {
			newRooms = append(newRooms, id)
		}
	}

	a.config.WatchedRooms = newRooms
	return config.SaveConfig(a.configPath, a.config)
}

func (a *App) GetWatchedRooms() (string, error) {
	a.mu.Lock()
	defer a.mu.Unlock()

	data, err := json.Marshal(a.config.WatchedRooms)
	if err != nil {
		return "", err
	}
	return string(data), nil
}

func (a *App) Logout() error {
	a.mu.Lock()
	defer a.mu.Unlock()

	a.client = nil
	a.myUID = 0
	a.myName = ""
	a.config.Cookie = ""

	if a.liveLottery != nil {
		a.liveLottery.Stop()
		a.liveLottery = nil
	}

	return config.SaveConfig(a.configPath, a.config)
}
