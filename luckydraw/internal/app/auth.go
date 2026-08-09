package app

func (a *AppService) Login(cookie string) (string, error) {
	return a.auth.Login(cookie)
}

func (a *AppService) GetQRCode() (string, error) {
	return a.auth.GetQRCode()
}

func (a *AppService) CheckQRCodeStatus(qrcodeKey string) (string, error) {
	return a.auth.CheckQRCodeStatus(qrcodeKey)
}

func (a *AppService) LoginWithQRCode(cookie string) (string, error) {
	return a.auth.LoginWithQRCode(cookie)
}

func (a *AppService) IsLoggedIn() bool {
	return a.auth.IsLoggedIn()
}

func (a *AppService) GetAccountInfo() (string, error) {
	return a.auth.GetAccountInfo()
}

func (a *AppService) Logout() error {
	a.live.Stop()
	return a.auth.Logout()
}
