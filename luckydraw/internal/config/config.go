package config

import (
	"encoding/json"
	"os"
	"path/filepath"
)

type Config struct {
	UIDs                 []int64         `json:"uids"`
	Tags                 []string        `json:"tags"`
	Articles             []string        `json:"articles"`
	LotteryOrder         []int           `json:"lottery_order"`
	KeyWords             []string        `json:"key_words"`
	Model                string          `json:"model"`
	ChatModel            string          `json:"chat_model"`
	DisableReserve       bool            `json:"disable_reserve_lottery"`
	CheckDuplicated      int             `json:"check_if_duplicated"`
	SneakTower           bool            `json:"sneaktower"`
	BlockDynamicType     []int           `json:"block_dynamic_type"`
	MaxCreateTime        int             `json:"max_create_time"`
	UIDScanPage          int             `json:"uid_scan_page"`
	TagScanPage          int             `json:"tag_scan_page"`
	ArticleScanPage      int             `json:"article_scan_page"`
	MaxDay               int             `json:"maxday"`
	LotteryLoopWait      int             `json:"lottery_loop_wait"`
	CheckLoopWait        int             `json:"check_loop_wait"`
	ClearLoopWait        int             `json:"clear_loop_wait"`
	Wait                 int             `json:"wait"`
	SearchWait           int             `json:"search_wait"`
	MinFollower          int             `json:"minfollower"`
	OnlyFollowed         bool            `json:"only_followed"`
	CreateDy             bool            `json:"create_dy"`
	CreateDyNum          int             `json:"create_dy_num"`
	Relay                []string        `json:"relay"`
	Chat                 []string        `json:"chat"`
	AtUsers              [][]interface{} `json:"at_users"`
	Blacklist            string          `json:"blacklist"`
	Blockword            []string        `json:"blockword"`
	NoticeKeyWords       []string        `json:"notice_key_words"`
	CheckSessionPages    int             `json:"check_session_pages"`
	ClearMaxDay          int             `json:"clear_max_day"`
	ClearRemoveDynamic   bool            `json:"clear_remove_dynamic"`
	ClearRemoveAttention bool            `json:"clear_remove_attention"`
}

var defaultConfig = &Config{
	UIDs:                 []int64{},
	Tags:                 []string{},
	Articles:             []string{},
	LotteryOrder:         []int{2, 0, 1, 3},
	KeyWords:             []string{"[抽奖送揪]|福利", "[转关评粉]|参与"},
	Model:                "11",
	ChatModel:            "01",
	DisableReserve:       false,
	CheckDuplicated:      1,
	SneakTower:           true,
	BlockDynamicType:     []int{0},
	MaxCreateTime:        60,
	UIDScanPage:          3,
	TagScanPage:          3,
	ArticleScanPage:      3,
	MaxDay:               999999,
	LotteryLoopWait:      0,
	CheckLoopWait:        0,
	ClearLoopWait:        0,
	Wait:                 30000,
	SearchWait:           2000,
	MinFollower:          1000,
	OnlyFollowed:         false,
	CreateDy:             false,
	CreateDyNum:          1,
	Relay:                []string{"转发动态"},
	Chat:                 []string{"[OK]", "[星星眼]", "万一呢", "来了"},
	AtUsers:              [][]interface{}{},
	Blacklist:            "",
	Blockword:            []string{"脚本", "抽奖号", "钓鱼"},
	NoticeKeyWords:       []string{"中奖", "获得", "填写", "收货地址"},
	CheckSessionPages:    16,
	ClearMaxDay:          30,
	ClearRemoveDynamic:   true,
	ClearRemoveAttention: true,
}

func LoadConfig(path string) (*Config, error) {
	if path == "" {
		return defaultConfig, nil
	}

	data, err := os.ReadFile(path)
	if err != nil {
		if os.IsNotExist(err) {
			return defaultConfig, nil
		}
		return nil, err
	}

	var cfg Config
	if err := json.Unmarshal(data, &cfg); err != nil {
		return nil, err
	}

	return &cfg, nil
}

func SaveConfig(path string, cfg *Config) error {
	if path == "" {
		home, _ := os.UserHomeDir()
		path = filepath.Join(home, ".luckydraw", "config.json")
	}

	dir := filepath.Dir(path)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return err
	}

	data, err := json.MarshalIndent(cfg, "", "  ")
	if err != nil {
		return err
	}

	return os.WriteFile(path, data, 0644)
}
