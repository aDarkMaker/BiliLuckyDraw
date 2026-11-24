package service

import (
	"bytes"
	"encoding/base64"
	"image"
	"image/color"
	"image/jpeg"
	"image/png"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"luckydraw/internal/config"
)

func pngDataURL(t *testing.T, size int) string {
	t.Helper()
	img := image.NewRGBA(image.Rect(0, 0, size, size))
	path := filepath.Join(t.TempDir(), "t.png")
	f, err := os.Create(path)
	if err != nil {
		t.Fatal(err)
	}
	if err := png.Encode(f, img); err != nil {
		t.Fatal(err)
	}
	_ = f.Close()
	raw, err := os.ReadFile(path)
	if err != nil {
		t.Fatal(err)
	}
	return "data:image/png;base64," + base64.StdEncoding.EncodeToString(raw)
}

func TestBackgroundFileRoundTrip(t *testing.T) {
	dir := t.TempDir()
	statePath := filepath.Join(dir, "state.json")
	state := &config.RuntimeState{
		ActiveProfile: "default",
		Profiles: []config.ProfileConfig{
			{ID: "default", Name: "default", WinnerCount: 1},
		},
	}
	s := &ProfileService{state: state, statePath: statePath}

	if err := s.SetBackgroundImage(pngDataURL(t, 64)); err != nil {
		t.Fatal(err)
	}
	ref := state.GetActiveProfile().BackgroundImage
	if !strings.HasPrefix(ref, bgFilePrefix) {
		t.Fatalf("expected file ref, got %q", ref)
	}
	got := s.GetBackgroundImage()
	if !strings.HasPrefix(got, "data:image/png;base64,") {
		t.Fatalf("expected original png data url, got %q", got[:min(48, len(got))])
	}
	if len(got) < 100 {
		t.Fatalf("background too small: %d", len(got))
	}

	raw, err := os.ReadFile(statePath)
	if err != nil {
		t.Fatal(err)
	}
	if strings.Contains(string(raw), "data:image") {
		t.Fatal("state still embeds data url")
	}

	if err := s.SetBackgroundImage(""); err != nil {
		t.Fatal(err)
	}
	if s.GetBackgroundImage() != "" {
		t.Fatal("expected empty after clear")
	}
}

func TestCompressBackgroundKeepsSmallOriginal(t *testing.T) {
	img := image.NewRGBA(image.Rect(0, 0, 64, 64))
	var buf bytes.Buffer
	if err := jpeg.Encode(&buf, img, &jpeg.Options{Quality: 90}); err != nil {
		t.Fatal(err)
	}
	out, mime := compressBackground(buf.Bytes())
	if mime != "image/jpeg" {
		t.Fatalf("unexpected mime %q", mime)
	}
	if !bytes.Equal(out, buf.Bytes()) {
		t.Fatal("small jpeg should be stored verbatim")
	}
}

func TestCompressBackgroundBudget(t *testing.T) {
	img := image.NewRGBA(image.Rect(0, 0, 4000, 3000))
	for y := 0; y < 3000; y++ {
		for x := 0; x < 4000; x++ {
			img.Set(x, y, color.RGBA{uint8(x % 251), uint8(y % 241), uint8((x * y) % 233), 255})
		}
	}
	var buf bytes.Buffer
	if err := jpeg.Encode(&buf, img, &jpeg.Options{Quality: 100}); err != nil {
		t.Fatal(err)
	}
	if buf.Len() <= bgMaxBytes {
		t.Fatalf("fixture too small to exercise the budget: %d", buf.Len())
	}

	out, mime := compressBackground(buf.Bytes())
	if mime != "image/jpeg" {
		t.Fatalf("unexpected mime %q", mime)
	}
	if len(out) > bgMaxBytes {
		t.Fatalf("compressed size %d exceeds budget %d", len(out), bgMaxBytes)
	}

	cfg, _, err := image.DecodeConfig(bytes.NewReader(out))
	if err != nil {
		t.Fatal(err)
	}
	if cfg.Width > bgMaxEdge || cfg.Height > bgMaxEdge {
		t.Fatalf("kept oversized dimensions %dx%d", cfg.Width, cfg.Height)
	}
}

func TestSetBackgroundImageBytes(t *testing.T) {
	dir := t.TempDir()
	state := &config.RuntimeState{
		ActiveProfile: "default",
		Profiles:      []config.ProfileConfig{{ID: "default", Name: "default", WinnerCount: 1}},
	}
	s := &ProfileService{state: state, statePath: filepath.Join(dir, "state.json")}

	img := image.NewRGBA(image.Rect(0, 0, 1200, 800))
	var buf bytes.Buffer
	if err := jpeg.Encode(&buf, img, &jpeg.Options{Quality: 95}); err != nil {
		t.Fatal(err)
	}
	if err := s.SetBackgroundImageBytes(buf.Bytes()); err != nil {
		t.Fatal(err)
	}
	if ref := state.GetActiveProfile().BackgroundImage; ref != s.bgRef("default") {
		t.Fatalf("unexpected ref %q", ref)
	}
	if err := s.SetBackgroundImageBytes(nil); err != nil {
		t.Fatal(err)
	}
	if state.GetActiveProfile().BackgroundImage != "" {
		t.Fatal("expected cleared background")
	}
}
