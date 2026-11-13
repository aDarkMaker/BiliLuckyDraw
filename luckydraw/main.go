package main

import (
	"embed"
	"log"
	"os"

	"luckydraw/internal/app"
	"luckydraw/internal/devbridge"

	"github.com/wailsapp/wails/v3/pkg/application"
)

//go:embed all:frontend/dist
var assets embed.FS

//go:embed build/appicon.png
var appIcon []byte

func main() {
	appSvc := app.New()

	a := application.New(application.Options{
		Name:        "BiliLuckyDraw",
		Description: "B站直播抽奖助手",
		Services: []application.Service{
			application.NewService(appSvc),
		},
		Assets: application.AssetOptions{
			Handler: application.AssetFileServerFS(assets),
		},
		Icon:      appIcon,
		Transport: devbridge.New(appSvc),
		Mac: application.MacOptions{
			// Keep the process (and the browser bridge) alive while Vite is attached.
			ApplicationShouldTerminateAfterLastWindowClosed: os.Getenv("FRONTEND_DEVSERVER_URL") == "",
		},
	})

	a.Window.NewWithOptions(application.WebviewWindowOptions{
		Title:            "BiliLuckyDraw",
		Width:            1200,
		Height:           800,
		URL:              "/",
		BackgroundColour: application.NewRGB(255, 255, 255),
	})

	if err := a.Run(); err != nil {
		log.Fatal(err)
	}
}
