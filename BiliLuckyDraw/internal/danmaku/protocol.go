package danmaku

import (
	"bytes"
	"compress/zlib"
	"encoding/binary"
	"io"

	"github.com/andybalholm/brotli"
)

func Pack(op uint32, ver uint16, body []byte) []byte {
	const headerLen = 16
	packetLen := headerLen + len(body)
	buf := make([]byte, packetLen)

	binary.BigEndian.PutUint32(buf[0:4], uint32(packetLen))
	binary.BigEndian.PutUint16(buf[4:6], uint16(headerLen))
	binary.BigEndian.PutUint16(buf[6:8], ver)
	binary.BigEndian.PutUint32(buf[8:12], op)
	binary.BigEndian.PutUint32(buf[12:16], 1)

	copy(buf[16:], body)
	return buf
}

func UnpackAll(packet []byte) [][]byte {
	var out [][]byte
	for len(packet) >= 16 {
		pLen := int(binary.BigEndian.Uint32(packet[0:4]))
		hLen := int(binary.BigEndian.Uint16(packet[4:6]))
		ver := int(binary.BigEndian.Uint16(packet[6:8]))
		op := int(binary.BigEndian.Uint32(packet[8:12]))
		if pLen <= 0 || pLen > len(packet) || hLen < 16 {
			break
		}
		body := packet[hLen:pLen]

		if op == 5 && (ver == 2 || ver == 3) {
			decoded := decompress(ver, body)
			out = append(out, UnpackAll(decoded)...)
		} else if op == 5 && (ver == 0 || ver == 1) {
			out = append(out, body)
		}
		packet = packet[pLen:]
	}
	return out
}

func decompress(ver int, b []byte) []byte {
	var r io.Reader = bytes.NewReader(b)
	if ver == 2 {
		zr, err := zlib.NewReader(r)
		if err != nil {
			return nil
		}
		defer zr.Close()
		x, _ := io.ReadAll(zr)
		return x
	}
	if ver == 3 {
		br := brotli.NewReader(r)
		x, _ := io.ReadAll(br)
		return x
	}
	return nil
}
