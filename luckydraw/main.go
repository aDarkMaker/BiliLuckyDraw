package main

import (
	"embed"
	"log"
	"net/http"
	"os"
	"strings"

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
	transport := devbridge.New(appSvc)
	// Mount the JSON API next to the bundled assets so the desktop webview can
	// move binary payloads over HTTP instead of the size-limited IPC bridge.
	assetHandler := application.AssetFileServerFS(assets)
	apiHandler := transport.APIHandler()

	a := application.New(application.Options{
		Name:        "BiliLuckyDraw",
		Description: "B站直播抽奖助手",
		Services: []application.Service{
			application.NewService(appSvc),
		},
		Assets: application.AssetOptions{
			Handler: http.HandlerFunc(func(rw http.ResponseWriter, r *http.Request) {
				if strings.HasPrefix(r.URL.Path, "/api/") {
					apiHandler.ServeHTTP(rw, r)
					return
				}
				assetHandler.ServeHTTP(rw, r)
			}),
		},
		Icon:      appIcon,
		Transport: transport,
		Mac: application.MacOptions{
			// Keep the process (and the browser bridge) alive while Vite is attached.
			ApplicationShouldTerminateAfterLastWindowClosed: os.Getenv("FRONTEND_DEVSERVER_URL") == "",
		},
	})

	a.Window.NewWithOptions(application.WebviewWindowOptions{
		Title:            "BiliLuckyDraw",
		Width:            1200,
		Height:           800,
		MinWidth:         960,
		MinHeight:        720,
		URL:              "/",
		BackgroundColour: application.NewRGB(255, 255, 255),
	})

	if err := a.Run(); err != nil {
		log.Fatal(err)
	}
}
