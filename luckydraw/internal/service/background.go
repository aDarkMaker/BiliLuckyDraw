package service

import (
	"bytes"
	"encoding/base64"
	"fmt"
	"image"
	_ "image/gif"
	"image/jpeg"
	_ "image/png"
	"os"
	"path/filepath"
	"strings"

	"luckydraw/internal/config"
)

const (
	bgFilePrefix = "file:"
	bgMaxEdge    = 1920
	bgMaxBytes   = 640 << 10
)

var bgQualityLadder = []int{86, 78, 70, 62, 54}
var bgEdgeLadder = []int{1920, 1600, 1280, 1024, 896, 768}

func (s *ProfileService) bgDir() string {
	return filepath.Join(filepath.Dir(s.statePath), "backgrounds")
}

func (s *ProfileService) bgPath(profileID string) string {
	return filepath.Join(s.bgDir(), profileID+".img")
}

func (s *ProfileService) bgRef(profileID string) string {
	return bgFilePrefix + profileID + ".img"
}

func decodeDataURL(image string) (mime string, data []byte, ok bool) {
	if !strings.HasPrefix(image, "data:") {
		return "", nil, false
	}
	rest := strings.TrimPrefix(image, "data:")
	comma := strings.IndexByte(rest, ',')
	if comma < 0 {
		return "", nil, false
	}
	meta, payload := rest[:comma], rest[comma+1:]
	if !strings.Contains(meta, ";base64") {
		return "", nil, false
	}
	mime = strings.TrimSuffix(meta, ";base64")
	if mime == "" {
		mime = "application/octet-stream"
	}
	raw, err := base64.StdEncoding.DecodeString(payload)
	if err != nil {
		return "", nil, false
	}
	return mime, raw, true
}

func encodeDataURL(mime string, data []byte) string {
	if mime == "" {
		mime = "application/octet-stream"
	}
	return "data:" + mime + ";base64," + base64.StdEncoding.EncodeToString(data)
}

func sniffMIME(data []byte) string {
	switch {
	case len(data) >= 3 && data[0] == 0xff && data[1] == 0xd8 && data[2] == 0xff:
		return "image/jpeg"
	case len(data) >= 8 && string(data[:8]) == "\x89PNG\r\n\x1a\n":
		return "image/png"
	case len(data) >= 12 && string(data[:4]) == "RIFF" && string(data[8:12]) == "WEBP":
		return "image/webp"
	case len(data) >= 6 && (string(data[:6]) == "GIF87a" || string(data[:6]) == "GIF89a"):
		return "image/gif"
	default:
		return "application/octet-stream"
	}
}

func fitImage(src image.Image, maxEdge int) image.Image {
	bounds := src.Bounds()
	w, h := bounds.Dx(), bounds.Dy()
	if w <= maxEdge && h <= maxEdge {
		return src
	}
	scale := float64(maxEdge) / float64(w)
	if h > w {
		scale = float64(maxEdge) / float64(h)
	}
	nw := max(1, int(float64(w)*scale))
	nh := max(1, int(float64(h)*scale))
	dst := image.NewRGBA(image.Rect(0, 0, nw, nh))
	for y := 0; y < nh; y++ {
		sy := bounds.Min.Y + int(float64(y)/scale)
		for x := 0; x < nw; x++ {
			sx := bounds.Min.X + int(float64(x)/scale)
			dst.Set(x, y, src.At(sx, sy))
		}
	}
	return dst
}

func compressBackground(raw []byte) ([]byte, string) {
	mime := sniffMIME(raw)
	// Keep originals that already fit the budget — re-encoding anime/flat art as
	// JPEG (especially after nearest-neighbor resize) produces muddy/wrong colors.
	if len(raw) <= bgMaxBytes && (mime == "image/jpeg" || mime == "image/png" || mime == "image/webp") {
		return raw, mime
	}

	img, _, err := image.Decode(bytes.NewReader(raw))
	if err != nil {
		return raw, mime
	}

	longest := img.Bounds().Dx()
	if img.Bounds().Dy() > longest {
		longest = img.Bounds().Dy()
	}

	var smallest []byte
	for _, edge := range bgEdgeLadder {
		limit := edge
		if limit > bgMaxEdge {
			limit = bgMaxEdge
		}
		if limit > longest && len(smallest) == 0 {
			limit = longest
		}
		fitted := fitImage(img, limit)
		for _, quality := range bgQualityLadder {
			var buf bytes.Buffer
			if err := jpeg.Encode(&buf, fitted, &jpeg.Options{Quality: quality}); err != nil {
				continue
			}
			data := buf.Bytes()
			if smallest == nil || len(data) < len(smallest) {
				smallest = data
			}
			if len(data) <= bgMaxBytes {
				return data, "image/jpeg"
			}
		}
		if limit >= longest {
			break
		}
	}

	if smallest == nil {
		return raw, mime
	}
	return smallest, "image/jpeg"
}

func (s *ProfileService) writeBackgroundBytes(profileID string, raw []byte) (string, error) {
	if sniffMIME(raw) == "application/octet-stream" {
		return "", fmt.Errorf("无法识别的图片格式")
	}
	raw, mime := compressBackground(raw)
	if err := os.MkdirAll(s.bgDir(), 0700); err != nil {
		return "", err
	}
	path := s.bgPath(profileID)
	if err := os.WriteFile(path, raw, 0600); err != nil {
		return "", err
	}
	_ = os.WriteFile(path+".mime", []byte(mime), 0600)
	return s.bgRef(profileID), nil
}

func (s *ProfileService) SetBackgroundImageBytes(raw []byte) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	return s.setBackgroundLocked(raw)
}

func (s *ProfileService) setBackgroundLocked(raw []byte) error {
	profile := s.state.GetActiveProfile()
	if profile == nil {
		return fmt.Errorf("没有活跃的配置喵")
	}
	if len(raw) == 0 {
		s.removeBackgroundFile(profile.ID)
		profile.BackgroundImage = ""
	} else {
		ref, err := s.writeBackgroundBytes(profile.ID, raw)
		if err != nil {
			return err
		}
		profile.BackgroundImage = ref
	}
	s.state.SetActiveProfile(profile)
	return config.SaveRuntimeState(s.statePath, s.state)
}

func (s *ProfileService) writeBackgroundFile(profileID, image string) (string, error) {
	_, raw, ok := decodeDataURL(image)
	if !ok {
		return image, nil
	}
	return s.writeBackgroundBytes(profileID, raw)
}

func (s *ProfileService) readBackgroundFile(ref string) string {
	name := strings.TrimPrefix(ref, bgFilePrefix)
	if name == "" || strings.Contains(name, "..") || strings.ContainsAny(name, `/\`) {
		return ""
	}
	path := filepath.Join(s.bgDir(), name)
	raw, err := os.ReadFile(path)
	if err != nil || len(raw) == 0 {
		return ""
	}
	// Prefer magic-byte sniffing so a stale .mime file cannot serve JPEG as PNG (乱色).
	mime := sniffMIME(raw)
	if mime == "application/octet-stream" {
		if meta, err := os.ReadFile(path + ".mime"); err == nil {
			if m := strings.TrimSpace(string(meta)); m != "" {
				mime = m
			}
		}
	}
	return encodeDataURL(mime, raw)
}

func (s *ProfileService) removeBackgroundFile(profileID string) {
	path := s.bgPath(profileID)
	_ = os.Remove(path)
	_ = os.Remove(path + ".mime")
}

func (s *ProfileService) migrateInlineBackgrounds() {
	changed := false
	for i := range s.state.Profiles {
		image := s.state.Profiles[i].BackgroundImage
		if !strings.HasPrefix(image, "data:") {
			continue
		}
		ref, err := s.writeBackgroundFile(s.state.Profiles[i].ID, image)
		if err != nil || ref == image {
			continue
		}
		s.state.Profiles[i].BackgroundImage = ref
		changed = true
	}
	if changed {
		_ = config.SaveRuntimeState(s.statePath, s.state)
	}
}

func publicProfile(p config.ProfileConfig) config.ProfileConfig {
	out := p
	if out.BackgroundImage != "" {
		out.BackgroundImage = "1"
	}
	return out
}
