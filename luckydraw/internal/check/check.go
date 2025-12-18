package check

import (
	"fmt"
	"regexp"
	"strings"

	"luckydraw/internal/bili"
	"luckydraw/internal/config"
)

type Service struct {
	client *bili.Client
	config *config.Config
	myUID  int64
}

func NewService(client *bili.Client, cfg *config.Config, myUID int64) *Service {
	return &Service{
		client: client,
		config: cfg,
		myUID:  myUID,
	}
}

type CheckResult struct {
	HasPrize bool     `json:"has_prize"`
	Messages []string `json:"messages"`
}

func (s *Service) CheckPrize() (*CheckResult, error) {
	result := &CheckResult{
		Messages: []string{},
	}

	unread, err := s.client.GetUnreadNum()
	if err != nil {
		return result, err
	}

	if unread.At > 0 {
		atInfo, err := s.client.GetMyAtInfo()
		if err == nil {
			for _, at := range atInfo {
				if s.matchNoticeKeywords(at.SourceContent) {
					result.HasPrize = true
					result.Messages = append(result.Messages,
						fmt.Sprintf("[@] %s 在%s中@了你: %s", at.UpUname, at.Business, at.SourceContent))
				}
			}
		}
	}

	return result, nil
}

func (s *Service) matchNoticeKeywords(text string) bool {
	if len(s.config.NoticeKeyWords) == 0 {
		return false
	}

	for _, pattern := range s.config.NoticeKeyWords {
		if strings.HasPrefix(pattern, "~") {
			matched, _ := regexp.MatchString(pattern[1:], text)
			if matched {
				return false
			}
		} else {
			matched, _ := regexp.MatchString(pattern, text)
			if matched {
				return true
			}
		}
	}

	return false
}
