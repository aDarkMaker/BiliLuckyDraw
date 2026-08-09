package domain

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
}
