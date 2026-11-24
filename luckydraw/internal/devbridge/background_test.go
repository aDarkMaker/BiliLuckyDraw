package devbridge

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

type fakeAPI struct {
	API
	raw    []byte
	image  string
	called string
}

func (f *fakeAPI) GetBackgroundImage() string { return f.image }

func (f *fakeAPI) SetBackgroundImage(image string) error {
	f.called = "json"
	f.image = image
	return nil
}

func (f *fakeAPI) SetBackgroundImageBytes(raw []byte) error {
	f.called = "bytes"
	f.raw = append([]byte(nil), raw...)
	return nil
}

func TestBackgroundHandlerBytes(t *testing.T) {
	api := &fakeAPI{}
	tr := &Transport{api: api}
	body := []byte{0xff, 0xd8, 0xff, 0x01, 0x02}
	req := httptest.NewRequest(http.MethodPost, "/api/background", bytes.NewReader(body))
	req.Header.Set("Content-Type", "image/jpeg")
	rec := httptest.NewRecorder()

	tr.handleBackground(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("unexpected status %d: %s", rec.Code, rec.Body.String())
	}
	if api.called != "bytes" || !bytes.Equal(api.raw, body) {
		t.Fatalf("byte path not used: called=%q raw=%v", api.called, api.raw)
	}
}

func TestBackgroundHandlerJSON(t *testing.T) {
	api := &fakeAPI{}
	tr := &Transport{api: api}
	payload, _ := json.Marshal(map[string]string{"image": "data:image/png;base64,AAA"})
	req := httptest.NewRequest(http.MethodPost, "/api/background", bytes.NewReader(payload))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	tr.handleBackground(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("unexpected status %d: %s", rec.Code, rec.Body.String())
	}
	if api.called != "json" || api.image != "data:image/png;base64,AAA" {
		t.Fatalf("json path not used: called=%q image=%q", api.called, api.image)
	}
}
