package app

func (a *AppService) GetRoomInfo(roomID int) (string, error) {
	return a.room.GetRoomInfo(roomID)
}

func (a *AppService) GetRoomPlayURL(roomID int) (string, error) {
	return a.room.GetRoomPlayURL(roomID)
}
