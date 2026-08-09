package domain

type AccountInfo struct {
	Name string `json:"name"`
	UID  int64  `json:"uid"`
	Face string `json:"face"`
}

type AuthService interface {
	Login(cookie string) (string, error)
	LoginWithQRCode(cookie string) (string, error)
	GetQRCode() (string, error)
	CheckQRCodeStatus(qrcodeKey string) (string, error)
	IsLoggedIn() bool
	GetAccountInfo() (string, error)
	Logout() error
}
