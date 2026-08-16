package domain

import "luckydraw/internal/config"

type ProfileService interface {
	GetProfiles() (string, error)
	SwitchProfile(id string) (string, error)
	CreateProfile(name string) (string, error)
	DeleteProfile(id string) error
	RenameProfile(id, name string) error
	SaveProfileConfig(keyword string, winnerCount int) error
	SetBackgroundImage(imagePath string) error
	GetBackgroundImage() string
	AddWatchedRoom(roomID int) error
	RemoveWatchedRoom(roomID int) error
	GetWatchedRooms() (string, error)
	ActiveProfile() *config.ProfileConfig
	AddHistory(profileID, keyword string, winnerCount int, winners []config.HistoryWinner) error
	GetHistory(profileID string) (string, error)
	DeleteHistory(profileID, historyID string) error
	DeleteAllHistory(profileID string) error
	HistoryExportFilename(profileID, historyID string) (string, error)
	ExportHistory(profileID, historyID, path string) (string, error)
}
