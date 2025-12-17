package bili

import (
	"context"
	"net/http"
	"strconv"
)

const userAgent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

func itoa(n int) string { return strconv.Itoa(n) }

func newGET(ctx context.Context, url string, referRoomID int, cookie string) (*http.Request, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("User-Agent", userAgent)
	req.Header.Set("Accept", "application/json, text/plain, */*")
	req.Header.Set("Origin", "https://live.bilibili.com")
	if referRoomID > 0 {
		req.Header.Set("Referer", "https://live.bilibili.com/"+itoa(referRoomID))
	}
	if cookie != "" {
		req.Header.Set("Cookie", cookie)
	}
	return req, nil
}


