package app

func (a *AppService) GetProfiles() (string, error) {
	return a.profile.GetProfiles()
}

func (a *AppService) SwitchProfile(id string) (string, error) {
	return a.profile.SwitchProfile(id)
}

func (a *AppService) CreateProfile(name string) (string, error) {
	return a.profile.CreateProfile(name)
}

func (a *AppService) DeleteProfile(id string) error {
	return a.profile.DeleteProfile(id)
}

func (a *AppService) RenameProfile(id, name string) error {
	return a.profile.RenameProfile(id, name)
}

func (a *AppService) SaveProfileConfig(keyword string, winnerCount int) error {
	return a.profile.SaveProfileConfig(keyword, winnerCount)
}

func (a *AppService) SetBackgroundImage(imagePath string) error {
	return a.profile.SetBackgroundImage(imagePath)
}

func (a *AppService) GetBackgroundImage() string {
	return a.profile.GetBackgroundImage()
}

func (a *AppService) AddWatchedRoom(roomID int) error {
	return a.profile.AddWatchedRoom(roomID)
}

func (a *AppService) RemoveWatchedRoom(roomID int) error {
	return a.profile.RemoveWatchedRoom(roomID)
}

func (a *AppService) GetWatchedRooms() (string, error) {
	return a.profile.GetWatchedRooms()
}
