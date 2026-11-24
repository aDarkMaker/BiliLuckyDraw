package service

import (
	"encoding/json"
	"fmt"
	"strings"
	"sync"
	"time"

	"luckydraw/internal/config"
	"luckydraw/internal/event"
)

type ProfileService struct {
	mu        sync.Mutex
	state     *config.RuntimeState
	statePath string
	emitter   event.Emitter
}

func NewProfileService(state *config.RuntimeState, statePath string, emitter event.Emitter) *ProfileService {
	s := &ProfileService{state: state, statePath: statePath, emitter: emitter}
	s.migrateInlineBackgrounds()
	return s
}

func (s *ProfileService) ActiveProfile() *config.ProfileConfig {
	s.mu.Lock()
	defer s.mu.Unlock()
	return s.state.GetActiveProfile()
}

func (s *ProfileService) GetProfiles() (string, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	profiles := make([]config.ProfileConfig, len(s.state.Profiles))
	for i, profile := range s.state.Profiles {
		profiles[i] = publicProfile(profile)
	}
	result := map[string]interface{}{
		"profiles":       profiles,
		"active_profile": s.state.ActiveProfile,
	}
	data, _ := json.Marshal(result)
	return string(data), nil
}

func (s *ProfileService) SwitchProfile(id string) (string, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	found := false
	for _, p := range s.state.Profiles {
		if p.ID == id {
			found = true
			break
		}
	}
	if !found {
		return "", fmt.Errorf("没有这个配置喵")
	}

	s.state.ActiveProfile = id
	if err := config.SaveRuntimeState(s.statePath, s.state); err != nil {
		return "", err
	}

	active := s.state.GetActiveProfile()
	if active == nil {
		return "", fmt.Errorf("没有活跃的配置喵")
	}
	profile := publicProfile(*active)
	profileData, _ := json.Marshal(profile)
	if s.emitter != nil {
		s.emitter.Emit("profile:switched", string(profileData))
	}
	return string(profileData), nil
}

func (s *ProfileService) CreateProfile(name string) (string, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	id := fmt.Sprintf("pf_%d", time.Now().UnixNano())
	profile := config.ProfileConfig{
		ID:           id,
		Name:         name,
		WatchedRooms: []int{},
		WinnerCount:  1,
	}
	s.state.Profiles = append(s.state.Profiles, profile)
	s.state.ActiveProfile = id

	if err := config.SaveRuntimeState(s.statePath, s.state); err != nil {
		return "", err
	}

	profileData, _ := json.Marshal(profile)
	if s.emitter != nil {
		s.emitter.Emit("profile:created", string(profileData))
	}
	return string(profileData), nil
}

func (s *ProfileService) DeleteProfile(id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if len(s.state.Profiles) <= 1 {
		return fmt.Errorf("好歹留一个Profile吧")
	}

	idx := -1
	for i, p := range s.state.Profiles {
		if p.ID == id {
			idx = i
			break
		}
	}
	if idx < 0 {
		return fmt.Errorf("没有这个配置喵")
	}

	s.removeBackgroundFile(id)
	s.state.Profiles = append(s.state.Profiles[:idx], s.state.Profiles[idx+1:]...)
	if s.state.ActiveProfile == id {
		s.state.ActiveProfile = s.state.Profiles[0].ID
	}

	return config.SaveRuntimeState(s.statePath, s.state)
}

func (s *ProfileService) RenameProfile(id, name string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	for i := range s.state.Profiles {
		if s.state.Profiles[i].ID == id {
			s.state.Profiles[i].Name = name
			return config.SaveRuntimeState(s.statePath, s.state)
		}
	}
	return fmt.Errorf("没有这个配置喵")
}

func (s *ProfileService) SaveProfileConfig(keyword string, winnerCount int) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	profile := s.state.GetActiveProfile()
	if profile == nil {
		return fmt.Errorf("没有活跃的配置喵")
	}
	profile.Keyword = keyword
	profile.WinnerCount = winnerCount
	s.state.SetActiveProfile(profile)
	return config.SaveRuntimeState(s.statePath, s.state)
}

func (s *ProfileService) SetBackgroundImage(imagePath string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	profile := s.state.GetActiveProfile()
	if profile == nil {
		return fmt.Errorf("没有活跃的配置喵")
	}

	if imagePath == "" {
		s.removeBackgroundFile(profile.ID)
		profile.BackgroundImage = ""
	} else if strings.HasPrefix(imagePath, "data:") {
		ref, err := s.writeBackgroundFile(profile.ID, imagePath)
		if err != nil {
			return err
		}
		profile.BackgroundImage = ref
	} else {
		profile.BackgroundImage = imagePath
	}

	s.state.SetActiveProfile(profile)
	return config.SaveRuntimeState(s.statePath, s.state)
}

func (s *ProfileService) GetBackgroundImage() string {
	s.mu.Lock()
	defer s.mu.Unlock()

	profile := s.state.GetActiveProfile()
	if profile == nil {
		return ""
	}
	image := profile.BackgroundImage
	if strings.HasPrefix(image, bgFilePrefix) {
		return s.readBackgroundFile(image)
	}
	return image
}

func (s *ProfileService) AddWatchedRoom(roomID int) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	profile := s.state.GetActiveProfile()
	if profile == nil {
		return fmt.Errorf("没有活跃的配置喵")
	}
	for _, id := range profile.WatchedRooms {
		if id == roomID {
			return nil
		}
	}

	profile.WatchedRooms = append(profile.WatchedRooms, roomID)
	s.state.SetActiveProfile(profile)
	return config.SaveRuntimeState(s.statePath, s.state)
}

func (s *ProfileService) RemoveWatchedRoom(roomID int) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	profile := s.state.GetActiveProfile()
	if profile == nil {
		return fmt.Errorf("没有活跃的配置喵")
	}
	var newRooms []int
	for _, id := range profile.WatchedRooms {
		if id != roomID {
			newRooms = append(newRooms, id)
		}
	}

	profile.WatchedRooms = newRooms
	s.state.SetActiveProfile(profile)
	return config.SaveRuntimeState(s.statePath, s.state)
}

func (s *ProfileService) GetWatchedRooms() (string, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	profile := s.state.GetActiveProfile()
	if profile == nil {
		return "[]", nil
	}
	data, err := json.Marshal(profile.WatchedRooms)
	if err != nil {
		return "", err
	}
	return string(data), nil
}
