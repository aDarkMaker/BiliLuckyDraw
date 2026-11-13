package devbridge

import (
	"context"
	"log"
	"net"
	"net/http"
	"os"
	"time"

	"github.com/wailsapp/wails/v3/pkg/application"
)

const addr = "127.0.0.1:9246"

type Transport struct {
	inner  *application.HTTPTransport
	server *http.Server
	api    API
}

// New creates the bridge transport. The api handler powers the plain-HTTP
// endpoints browsers use when the Wails IPC bridge is unreachable.
func New(api API) *Transport {
	return &Transport{inner: application.NewHTTPTransport(), api: api}
}

func (t *Transport) Start(ctx context.Context, messageProcessor *application.MessageProcessor) error {
	return t.inner.Start(ctx, messageProcessor)
}

func (t *Transport) JSClient() []byte {
	return t.inner.JSClient()
}

func (t *Transport) Stop() error {
	if t.server != nil {
		ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
		defer cancel()
		_ = t.server.Shutdown(ctx)
		t.server = nil
	}
	return t.inner.Stop()
}

func (t *Transport) Handler() func(next http.Handler) http.Handler {
	return t.inner.Handler()
}

func (t *Transport) ServeAssets(assetHandler http.Handler) error {
	if os.Getenv("FRONTEND_DEVSERVER_URL") == "" {
		return nil
	}

	mux := http.NewServeMux()
	mux.Handle("/api/", t.apiHandler())
	mux.Handle("/", assetHandler)

	listener := listenWithRetry()
	if listener == nil {
		log.Printf("browser dev bridge unavailable on http://%s, the desktop window keeps working but browser tabs cannot reach the backend", addr)
		return nil
	}

	t.server = &http.Server{
		Handler:           mux,
		ReadHeaderTimeout: 10 * time.Second,
	}

	log.Printf("browser dev bridge listening on http://%s (Vite proxies /wails and /api here)", addr)
	go func() {
		if err := t.server.Serve(listener); err != nil && err != http.ErrServerClosed {
			log.Printf("browser dev bridge: %v", err)
		}
	}()

	return nil
}

// listenWithRetry tolerates the previous wails3 dev run releasing the port.
func listenWithRetry() net.Listener {
	for attempt := 0; attempt < 20; attempt++ {
		if listener, err := net.Listen("tcp", addr); err == nil {
			return listener
		}
		time.Sleep(250 * time.Millisecond)
	}
	return nil
}
