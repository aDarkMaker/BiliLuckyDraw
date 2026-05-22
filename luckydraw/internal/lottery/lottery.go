package lottery

import (
	"encoding/json"
	"fmt"
	"math/rand"
	"regexp"
	"strconv"
	"strings"
	"time"

	"luckydraw/internal/bili"
	"luckydraw/internal/config"
)

type Service struct {
	client     *bili.Client
	config     *config.Config
	myUID      int64
	rng        *rand.Rand
	keyPatterns []*regexp.Regexp
}

func NewService(client *bili.Client, cfg *config.Config, myUID int64) *Service {
	s := &Service{
		client: client,
		config: cfg,
		myUID:  myUID,
		rng:    rand.New(rand.NewSource(time.Now().UnixNano())),
	}
	for _, p := range cfg.KeyWords {
		if re, err := regexp.Compile(p); err == nil {
			s.keyPatterns = append(s.keyPatterns, re)
		}
	}
	return s
}

type LotteryInfo struct {
	Type               string   `json:"lottery_info_type"`
	CreateTime         int64    `json:"create_time"`
	IsLiked            bool     `json:"is_liked"`
	UIDs               []int64  `json:"uids"`
	Uname              string   `json:"uname"`
	Ctrl               []string `json:"ctrl"`
	Dyid               string   `json:"dyid"`
	ReserveID          string   `json:"reserve_id"`
	ReserveLotteryText string   `json:"reserve_lottery_text"`
	Rid                string   `json:"rid"`
	Des                string   `json:"des"`
	TypeNum            int      `json:"type"`
	HasOfficialLottery bool     `json:"hasOfficialLottery"`
	ChatType           int      `json:"chat_type"`
}

func (s *Service) SearchLotteries() ([]LotteryInfo, error) {
	var allLotteries []LotteryInfo

	for _, order := range s.config.LotteryOrder {
		switch order {
		case 0:
			lotteries, err := s.searchByUIDs()
			if err == nil {
				allLotteries = append(allLotteries, lotteries...)
			}
		case 1:
			lotteries, err := s.searchByTags()
			if err == nil {
				allLotteries = append(allLotteries, lotteries...)
			}
		case 2:
			lotteries, err := s.searchByArticles()
			if err == nil {
				allLotteries = append(allLotteries, lotteries...)
			}
		}
		time.Sleep(time.Duration(s.config.SearchWait) * time.Millisecond)
	}

	return s.filterLotteries(allLotteries), nil
}

func (s *Service) searchByUIDs() ([]LotteryInfo, error) {
	var result []LotteryInfo

	for _, uid := range s.config.UIDs {
		for page := 1; page <= s.config.UIDScanPage; page++ {
			offset := ""
			if page > 1 {
				offset = strconv.FormatInt(time.Now().Unix(), 10)
			}

			data, err := s.client.GetDynamicFeed(uid, offset)
			if err != nil {
				continue
			}

			lotteries := s.parseDynamicData(data)
			result = append(result, lotteries...)

			time.Sleep(time.Duration(s.config.SearchWait) * time.Millisecond)
		}
	}

	return result, nil
}

func (s *Service) searchByTags() ([]LotteryInfo, error) {
	var result []LotteryInfo

	for _, tag := range s.config.Tags {
		for page := 1; page <= s.config.TagScanPage; page++ {
			offset := ""
			if page > 1 {
				offset = strconv.Itoa(page)
			}

			data, err := s.client.GetTagFeed(tag, offset)
			if err != nil {
				continue
			}

			lotteries := s.parseSearchData(data)
			result = append(result, lotteries...)

			time.Sleep(time.Duration(s.config.SearchWait) * time.Millisecond)
		}
	}

	return result, nil
}

func (s *Service) searchByArticles() ([]LotteryInfo, error) {
	var result []LotteryInfo

	for _, uid := range s.config.UIDs {
		for page := 1; page <= s.config.ArticleScanPage; page++ {
			data, err := s.client.GetArticleList(uid, page)
			if err != nil {
				continue
			}

			lotteries := s.parseArticleData(data)
			result = append(result, lotteries...)

			time.Sleep(time.Duration(s.config.SearchWait) * time.Millisecond)
		}
	}

	return result, nil
}

func (s *Service) parseSearchData(data []byte) []LotteryInfo {
	var result []LotteryInfo

	var resp struct {
		Code int `json:"code"`
		Data struct {
			Items []struct {
				Title       string `json:"title"`
				Description string `json:"description"`
				Pubdate     int64  `json:"pubdate"`
				Mid         int64  `json:"mid"`
				Author      string `json:"author"`
				DynamicID   string `json:"dynamic_id"`
				Type        string `json:"type"`
			} `json:"items"`
		} `json:"data"`
	}

	if err := json.Unmarshal(data, &resp); err != nil {
		return result
	}

	if resp.Code != 0 {
		return result
	}

	for _, item := range resp.Data.Items {
		desc := item.Description
		if desc == "" {
			desc = item.Title
		}
		if !s.matchKeywords(desc) {
			continue
		}

		lottery := LotteryInfo{
			UIDs:       []int64{item.Mid},
			Uname:      item.Author,
			CreateTime: item.Pubdate,
			Dyid:       item.DynamicID,
			Des:        desc,
			ChatType:   17,
			TypeNum:    1,
		}

		result = append(result, lottery)
	}

	return result
}

func (s *Service) parseArticleData(data []byte) []LotteryInfo {
	var result []LotteryInfo

	var resp struct {
		Code int `json:"code"`
		Data struct {
			Articles []struct {
				ID      int64  `json:"id"`
				Title   string `json:"title"`
				Summary string `json:"summary"`
				PublishTime int64  `json:"publish_time"`
				Author  struct {
					Mid  int64  `json:"mid"`
					Name string `json:"name"`
				} `json:"author"`
			} `json:"articles"`
		} `json:"data"`
	}

	if err := json.Unmarshal(data, &resp); err != nil {
		return result
	}

	if resp.Code != 0 {
		return result
	}

	for _, article := range resp.Data.Articles {
		desc := article.Summary
		if desc == "" {
			desc = article.Title
		}
		if !s.matchKeywords(desc) {
			continue
		}

		lottery := LotteryInfo{
			UIDs:       []int64{article.Author.Mid},
			Uname:      article.Author.Name,
			CreateTime: article.PublishTime,
			Dyid:       strconv.FormatInt(article.ID, 10),
			Des:        desc,
			ChatType:   17,
			TypeNum:    1,
		}

		result = append(result, lottery)
	}

	return result
}

func (s *Service) parseDynamicData(data []byte) []LotteryInfo {
	var result []LotteryInfo

	var resp struct {
		Code int `json:"code"`
		Data struct {
			Items []struct {
				Item struct {
					Modules struct {
						ModuleAuthor struct {
							Mid   int64  `json:"mid"`
							Name  string `json:"name"`
							PubTs int64  `json:"pub_ts"`
						} `json:"module_author"`
						ModuleStat struct {
							Like struct {
								Status bool `json:"status"`
							} `json:"like"`
						} `json:"module_stat"`
						ModuleDynamic struct {
							Major struct {
								Draw struct {
									Items []struct {
										ImgSrc string `json:"img_src"`
									} `json:"items"`
								} `json:"draw"`
								Article struct {
									Title string `json:"title"`
								} `json:"article"`
							} `json:"major"`
							Desc struct {
								Text string `json:"text"`
							} `json:"desc"`
						} `json:"module_dynamic"`
					} `json:"modules"`
					Basic struct {
						CommentIDStr string `json:"comment_id_str"`
					} `json:"basic"`
					IDStr string `json:"id_str"`
					Type  string `json:"type"`
				} `json:"item"`
			} `json:"items"`
		} `json:"data"`
	}

	if err := json.Unmarshal(data, &resp); err != nil {
		return result
	}

	if resp.Code != 0 {
		return result
	}

	for _, item := range resp.Data.Items {
		desc := item.Item.Modules.ModuleDynamic.Desc.Text
		if !s.matchKeywords(desc) {
			continue
		}

		lottery := LotteryInfo{
			UIDs:       []int64{item.Item.Modules.ModuleAuthor.Mid},
			Uname:      item.Item.Modules.ModuleAuthor.Name,
			CreateTime: item.Item.Modules.ModuleAuthor.PubTs,
			IsLiked:    item.Item.Modules.ModuleStat.Like.Status,
			Dyid:       item.Item.IDStr,
			Rid:        item.Item.Basic.CommentIDStr,
			Des:        desc,
		}

		switch item.Item.Type {
		case "DYNAMIC_TYPE_DRAW":
			lottery.ChatType = 11
			lottery.TypeNum = 2
		case "DYNAMIC_TYPE_WORD":
			lottery.ChatType = 17
			lottery.TypeNum = 4
		default:
			lottery.ChatType = 17
			lottery.TypeNum = 1
		}

		result = append(result, lottery)
	}

	return result
}

func (s *Service) matchKeywords(text string) bool {
	if len(s.keyPatterns) == 0 {
		return true
	}

	for _, re := range s.keyPatterns {
		if !re.MatchString(text) {
			return false
		}
	}

	return true
}

func (s *Service) filterLotteries(lotteries []LotteryInfo) []LotteryInfo {
	var result []LotteryInfo
	now := time.Now().Unix()

	for _, lottery := range lotteries {
		if lottery.CreateTime > 0 {
			days := (now - lottery.CreateTime) / 86400
			if days > int64(s.config.MaxCreateTime) {
				continue
			}
		}

		if s.config.Model == "00" {
			continue
		}

		if s.config.Model == "10" && !lottery.HasOfficialLottery {
			continue
		}

		if s.config.Model == "01" && lottery.HasOfficialLottery {
			continue
		}

		for _, word := range s.config.Blockword {
			if strings.Contains(lottery.Des, word) {
				goto skip
			}
		}

		result = append(result, lottery)
	skip:
	}

	return result
}

func (s *Service) Participate(lottery LotteryInfo) error {
	if s.config.CheckDuplicated >= 0 && lottery.IsLiked {
		return fmt.Errorf("already participated")
	}

	relayMsg := s.getRandomRelay()
	if err := s.client.AutoRelay(s.myUID, lottery.Dyid, relayMsg); err != nil {
		return err
	}

	time.Sleep(time.Duration(s.config.Wait) * time.Millisecond)

	if s.config.ChatModel != "00" {
		if s.config.ChatModel == "10" && !lottery.HasOfficialLottery {
			return nil
		}
		if s.config.ChatModel == "01" && lottery.HasOfficialLottery {
			return nil
		}

		chatMsg := s.getRandomChat()
		if lottery.Rid != "" {
			s.client.SendChat(lottery.Rid, chatMsg, lottery.ChatType)
		}
	}

	if !lottery.IsLiked {
		s.client.AutoLike(lottery.Dyid)
	}

	return nil
}

func (s *Service) getRandomRelay() string {
	if len(s.config.Relay) == 0 {
		return "转发动态"
	}
	return s.config.Relay[s.rng.Intn(len(s.config.Relay))]
}

func (s *Service) getRandomChat() string {
	if len(s.config.Chat) == 0 {
		return "[OK]"
	}
	return s.config.Chat[s.rng.Intn(len(s.config.Chat))]
}
