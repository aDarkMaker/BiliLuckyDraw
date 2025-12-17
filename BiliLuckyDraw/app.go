package main

import (
	"context"
	"errors"
	"sync"

	"github.com/wailsapp/wails/v2/pkg/runtime"

	"BiliLuckyDraw/internal/lottery"
)

type App struct {
	ctx context.Context

	mu      sync.Mutex
	dm      *DanmakuClient
	running bool

	collector  *lottery.Collector
	biliCookie string
}

func NewApp() *App { return &App{collector: lottery.NewCollector()} }

func (a *App) startup(ctx context.Context) { a.ctx = ctx }

func (a *App) emitCollectStatus() {
	runtime.EventsEmit(a.ctx, "collect_status", map[string]any{
		"enabled": a.collector.Enabled(),
		"count":   a.collector.Count(),
	})
}

func (a *App) StartDanmaku(roomID int) error {
	if roomID <= 0 {
		return errors.New("roomID must be > 0")
	}

	a.mu.Lock()
	defer a.mu.Unlock()

	if a.running {
		return errors.New("danmaku already running")
	}

	c := &DanmakuClient{roomID: roomID, cookie: a.biliCookie}
	c.onDebug = func(payload any) {
		runtime.EventsEmit(a.ctx, "danmaku_debug", payload)
	}
	c.onUser = func(uid int64, uname string, text string) {
		a.collector.Add(lottery.User{UID: uid, Uname: uname}, text)
		runtime.EventsEmit(a.ctx, "danmu_msg", map[string]any{"uid": uid, "uname": uname, "text": text})
		a.emitCollectStatus()
	}
	a.dm = c
	a.running = true

	go func() {
		err := c.Run(a.ctx, func(payload any) {
			runtime.EventsEmit(a.ctx, "danmaku", payload)
		})

		a.mu.Lock()
		a.running = false
		a.mu.Unlock()

		if err != nil {
			runtime.EventsEmit(a.ctx, "danmaku_error", map[string]any{"error": err.Error()})
		}
	}()

	return nil
}

func (a *App) SetBiliCookie(cookie string) {
	a.biliCookie = cookie
}

func (a *App) StopDanmaku() {
	a.mu.Lock()
	defer a.mu.Unlock()

	if a.dm != nil {
		_ = a.dm.Close()
		a.dm = nil
	}
	a.running = false
}

func (a *App) StartCollect(keyword string) {
	a.collector.Start(keyword)
	a.emitCollectStatus()
}

func (a *App) StopCollect() {
	a.collector.Stop()
	a.emitCollectStatus()
}

func (a *App) DrawWinners(n int) []lottery.User {
	return a.collector.Draw(n)
}
