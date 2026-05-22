package check

import (
	"fmt"
	"regexp"
	"strings"

	"luckydraw/internal/bili"
	"luckydraw/internal/config"
)

type Service struct {
	client        *bili.Client
	config        *config.Config
	myUID         int64
	noticePatterns []*regexp.Regexp
	noticeExcludes []*regexp.Regexp
}

func NewService(client *bili.Client, cfg *config.Config, myUID int64) *Service {
	s := &Service{
		client: client,
		config: cfg,
		myUID:  myUID,
	}
	for _, p := range cfg.NoticeKeyWords {
		if strings.HasPrefix(p, "~") {
			if re, err := regexp.Compile(p[1:]); err == nil {
				s.noticeExcludes = append(s.noticeExcludes, re)
			}
		} else {
			if re, err := regexp.Compile(p); err == nil {
				s.noticePatterns = append(s.noticePatterns, re)
			}
		}
	}
	return s
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
	if len(s.noticePatterns) == 0 && len(s.noticeExcludes) == 0 {
		return false
	}

	for _, re := range s.noticeExcludes {
		if re.MatchString(text) {
			return false
		}
	}

	for _, re := range s.noticePatterns {
		if re.MatchString(text) {
			return true
		}
	}

	return false
}
