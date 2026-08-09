package service

import (
	"encoding/json"
	"fmt"
	"strings"
	"sync"

	"luckydraw/internal/bili"
	"luckydraw/internal/config"
	"luckydraw/internal/login"
)

type AuthService struct {
	mu         sync.Mutex
	client     *bili.Client
	config     *config.Config
	configPath string
}

func NewAuthService(cfg *config.Config, configPath string) *AuthService {
	s := &AuthService{config: cfg, configPath: configPath}
	if cfg.Cookie != "" {
		s.autoLogin(cfg.Cookie)
	}
	return s
}

func (s *AuthService) autoLogin(cookie string) {
	if cookie == "" {
		return
	}
	s.client = bili.NewClient(cookie)
	if info, err := s.client.GetMyInfo(); err != nil {
		s.config.Cookie = ""
		config.SaveConfig(s.configPath, s.config)
		s.client = nil
	} else {
		_ = info
	}
}

func (s *AuthService) Client() *bili.Client {
	s.mu.Lock()
	defer s.mu.Unlock()
	return s.client
}

func (s *AuthService) Login(cookie string) (string, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	cookie = strings.TrimSpace(cookie)
	if cookie == "" {
		return "", fmt.Errorf("Cookie是空的！")
	}

	s.client = bili.NewClient(cookie)
	info, err := s.client.GetMyInfo()
	if err != nil {
		return "", fmt.Errorf("雜魚: %v", err)
	}

	s.config.Cookie = cookie
	config.SaveConfig(s.configPath, s.config)

	return fmt.Sprintf("这号是你吗: %s (UID: %d)", info.Name, info.Mid), nil
}

func (s *AuthService) GetQRCode() (string, error) {
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

func (s *AuthService) CheckQRCodeStatus(qrcodeKey string) (string, error) {
	qrLogin := login.NewQRLogin()
	status, err := qrLogin.CheckQRCodeStatus(qrcodeKey)
	if err != nil {
		return "", fmt.Errorf("验牌失败了: %v", err)
	}

	result := map[string]interface{}{
		"code":    status.Code,
		"message": status.Message,
		"data":    status.Data,
		"cookie":  status.Cookie,
	}
	data, _ := json.Marshal(result)
	return string(data), nil
}

func (s *AuthService) LoginWithQRCode(cookie string) (string, error) {
	if cookie == "" {
		return "", fmt.Errorf("登陆有点问题哎～")
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	s.client = bili.NewClient(cookie)
	info, err := s.client.GetMyInfo()
	if err != nil {
		return "", fmt.Errorf("登陆失效了喵: %v", err)
	}

	s.config.Cookie = cookie
	config.SaveConfig(s.configPath, s.config)

	return fmt.Sprintf("这号是你吗: %s (UID: %d)", info.Name, info.Mid), nil
}

func (s *AuthService) IsLoggedIn() bool {
	s.mu.Lock()
	defer s.mu.Unlock()
	return s.client != nil
}

func (s *AuthService) GetAccountInfo() (string, error) {
	s.mu.Lock()
	client := s.client
	s.mu.Unlock()

	if client == nil {
		return "", fmt.Errorf("Login First！")
	}

	info, err := client.GetMyInfo()
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

func (s *AuthService) Logout() error {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.client = nil
	s.config.Cookie = ""
	return config.SaveConfig(s.configPath, s.config)
}
