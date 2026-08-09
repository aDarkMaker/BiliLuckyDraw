package app

import (
	"context"
	"os"
	"path/filepath"

	"luckydraw/internal/config"
	"luckydraw/internal/event"
	"luckydraw/internal/service"

	"github.com/wailsapp/wails/v3/pkg/application"
)

type AppService struct {
	auth    *service.AuthService
	live    *service.LiveLotteryService
	profile *service.ProfileService
	app     *application.App
}

func New() *AppService {
	return &AppService{}
}

func (a *AppService) ServiceStartup(ctx context.Context, options application.ServiceOptions) error {
	home, _ := os.UserHomeDir()
	configPath := filepath.Join(home, ".luckydraw", "config.json")
	statePath := filepath.Join(home, ".luckydraw", "state.json")

	cfg, _ := config.LoadConfig(configPath)
	state, _ := config.LoadRuntimeState(statePath)

	a.app = application.Get()
	emitter := &wailsEmitter{app: a.app}

	a.auth = service.NewAuthService(cfg, configPath)
	a.live = service.NewLiveLotteryService(emitter, a.auth.Client)
	a.profile = service.NewProfileService(state, statePath, emitter)
	return nil
}

func (a *AppService) ServiceShutdown() error {
	if a.live != nil {
		a.live.Stop()
	}
	return nil
}

func (a *AppService) ServiceName() string {
	return "App"
}

type wailsEmitter struct {
	app *application.App
}

func (e *wailsEmitter) Emit(name string, data ...any) bool {
	if e.app == nil {
		return false
	}
	return e.app.Event.Emit(name, data...)
}

var _ event.Emitter = (*wailsEmitter)(nil)
