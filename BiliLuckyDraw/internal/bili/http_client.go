package bili

import (
	"context"
	"crypto/tls"
	"net"
	"net/http"
	"time"

	utls "github.com/refraction-networking/utls"
)

// newPlainHTTPClient 使用 Go 标准库默认 TLS 栈（可能更稳），作为 fallback。
func newPlainHTTPClient() *http.Client {
	dialer := &net.Dialer{Timeout: 8 * time.Second, KeepAlive: 30 * time.Second}
	tr := &http.Transport{
		Proxy:               http.ProxyFromEnvironment,
		DialContext:         dialer.DialContext,
		ForceAttemptHTTP2:   true,
		MaxIdleConns:        100,
		IdleConnTimeout:     90 * time.Second,
		TLSHandshakeTimeout: 8 * time.Second,
		TLSClientConfig:     &tls.Config{MinVersion: tls.VersionTLS12},
	}
	return &http.Client{Timeout: 8 * time.Second, Transport: tr}
}

func newHTTPClient() *http.Client {
	dialer := &net.Dialer{Timeout: 8 * time.Second, KeepAlive: 30 * time.Second}

	tr := &http.Transport{
		Proxy:               http.ProxyFromEnvironment,
		DialContext:         dialer.DialContext,
		// 这里我们用 uTLS 自定义 DialTLSContext，net/http 无法可靠识别/切换到 http2，
		// 若 ALPN 协商到 h2，服务端会发 HTTP/2 帧但客户端用 HTTP/1.1 解析，导致 malformed response。
		// 因此 uTLS 分支固定为 http/1.1；需要 http2 时走 newPlainHTTPClient fallback。
		ForceAttemptHTTP2:   false,
		MaxIdleConns:        100,
		IdleConnTimeout:     90 * time.Second,
		TLSHandshakeTimeout: 8 * time.Second,
	}

	tr.DialTLSContext = func(ctx context.Context, network, addr string) (net.Conn, error) {
		rawConn, err := dialer.DialContext(ctx, network, addr)
		if err != nil {
			return nil, err
		}

		host, _, err := net.SplitHostPort(addr)
		if err != nil {
			_ = rawConn.Close()
			return nil, err
		}

		// 注意：这里必须固定 http/1.1，见上面 ForceAttemptHTTP2 的注释。
		cfg := &utls.Config{ServerName: host, NextProtos: []string{"http/1.1"}}
		uconn := utls.UClient(rawConn, cfg, utls.HelloCustom)

		spec, err := utls.UTLSIdToSpec(utls.HelloChrome_Auto)
		if err != nil {
			_ = rawConn.Close()
			return nil, err
		}
		for i, ext := range spec.Extensions {
			if alpn, ok := ext.(*utls.ALPNExtension); ok {
				alpn.AlpnProtocols = []string{"http/1.1"}
				spec.Extensions[i] = alpn
			}
		}
		if err := uconn.ApplyPreset(&spec); err != nil {
			_ = rawConn.Close()
			return nil, err
		}

		if err := uconn.Handshake(); err != nil {
			_ = rawConn.Close()
			return nil, err
		}
		return uconn, nil
	}

	tr.TLSClientConfig = &tls.Config{MinVersion: tls.VersionTLS12}

	return &http.Client{
		Timeout:   8 * time.Second,
		Transport: tr,
	}
}
