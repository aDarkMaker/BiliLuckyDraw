package service

import (
	"encoding/json"
	"fmt"
	"os"
	"strings"
	"time"

	"luckydraw/internal/config"
)

func (s *ProfileService) AddHistory(profileID string, keyword string, winnerCount int, winners []config.HistoryWinner) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	for i := range s.state.Profiles {
		if s.state.Profiles[i].ID != profileID {
			continue
		}
		record := config.HistoryRecord{
			ID:          fmt.Sprintf("hs_%d", time.Now().UnixNano()),
			Keyword:     keyword,
			WinnerCount: winnerCount,
			Time:        time.Now(),
			Winners:     winners,
		}
		s.state.Profiles[i].History = append(s.state.Profiles[i].History, record)
		return config.SaveRuntimeState(s.statePath, s.state)
	}
	return fmt.Errorf("没有这个配置喵")
}

func (s *ProfileService) GetHistory(profileID string) (string, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	for _, p := range s.state.Profiles {
		if p.ID == profileID {
			data, err := json.Marshal(p.History)
			if err != nil {
				return "", err
			}
			return string(data), nil
		}
	}
	return "[]", nil
}

func (s *ProfileService) DeleteHistory(profileID, historyID string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	for i := range s.state.Profiles {
		if s.state.Profiles[i].ID != profileID {
			continue
		}
		hist := s.state.Profiles[i].History
		for j, h := range hist {
			if h.ID == historyID {
				s.state.Profiles[i].History = append(hist[:j], hist[j+1:]...)
				return config.SaveRuntimeState(s.statePath, s.state)
			}
		}
		return fmt.Errorf("没有这条历史喵")
	}
	return fmt.Errorf("没有这个配置喵")
}

func (s *ProfileService) DeleteAllHistory(profileID string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	for i := range s.state.Profiles {
		if s.state.Profiles[i].ID != profileID {
			continue
		}
		s.state.Profiles[i].History = nil
		return config.SaveRuntimeState(s.statePath, s.state)
	}
	return fmt.Errorf("没有这个配置喵")
}

func (s *ProfileService) HistoryExportFilename(profileID, historyID string) (string, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	record := s.findHistory(profileID, historyID)
	if record == nil {
		return "", fmt.Errorf("没有这条历史喵")
	}
	name := sanitizeFilename(record.Keyword)
	if name == "" {
		name = "lottery"
	}
	return fmt.Sprintf("%s-%d-%s.md", name, record.WinnerCount, record.Time.Format("20060102-150405")), nil
}

func (s *ProfileService) ExportHistory(profileID, historyID, path string) (string, error) {
	s.mu.Lock()
	record := s.findHistory(profileID, historyID)
	s.mu.Unlock()

	if record == nil {
		return "", fmt.Errorf("没有这条历史喵")
	}

	md := buildMarkdown(record)
	if err := os.WriteFile(path, []byte(md), 0644); err != nil {
		return "", err
	}
	return path, nil
}

func (s *ProfileService) findHistory(profileID, historyID string) *config.HistoryRecord {
	for i := range s.state.Profiles {
		if s.state.Profiles[i].ID != profileID {
			continue
		}
		for j := range s.state.Profiles[i].History {
			if s.state.Profiles[i].History[j].ID == historyID {
				return &s.state.Profiles[i].History[j]
			}
		}
	}
	return nil
}

func sanitizeFilename(s string) string {
	s = strings.TrimSpace(s)
	var b strings.Builder
	for _, r := range s {
		if r == '/' || r == '\\' || r == ':' || r == '*' || r == '?' || r == '"' || r == '<' || r == '>' || r == '|' {
			continue
		}
		b.WriteRune(r)
	}
	return b.String()
}

func buildMarkdown(r *config.HistoryRecord) string {
	var b strings.Builder
	b.WriteString(fmt.Sprintf("# %s 中奖名单\n\n", r.Keyword))
	b.WriteString(fmt.Sprintf("- 中奖人数：%d\n", r.WinnerCount))
	b.WriteString(fmt.Sprintf("- 抽奖时间：%s\n\n", r.Time.Format("2006-01-02 15:04:05")))
	b.WriteString("| 排名 | 昵称 | UID |\n| --- | --- | --- |\n")
	for i, w := range r.Winners {
		b.WriteString(fmt.Sprintf("| %d | %s | %d |\n", i+1, w.Username, w.UID))
	}
	return b.String()
}
