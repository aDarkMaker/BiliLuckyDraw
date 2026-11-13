# Quick Start

## 1. Download

Grab the build for your platform from [Releases](https://github.com/aDarkMaker/BiliLuckyDraw/releases):

| Platform | File |
| --- | --- |
| macOS (Apple Silicon / Intel) | `BiliLuckyDraw-darwin-universal.zip` |
| Windows | `luckydraw-amd64-installer.exe` (installer) or `luckydraw.exe` (portable) |

If macOS blocks the first launch, open System Settings → Privacy & Security and choose "Open Anyway".

## 2. Log in

Pick one method:

- **Cookie login** — copy the Bilibili Cookie from a browser, paste it into the box and click log in.
- **QR login** — switch to the QR tab, scan the code with the Bilibili mobile app and confirm on the phone.

Credentials are stored only on this machine, in `~/.luckydraw/config.json`.

## 3. Add rooms

Open **Settings → Lottery** and enter the room IDs to monitor, or paste a live-room link such as `https://live.bilibili.com/12345`. Several rooms are fine; all participants merge into one pool.

Back on the lottery page, the room list on the right shows each room's cover, streamer and online count — click one to preview it.

## 4. Start the draw

On the lottery page set the keyword and winner count (1–9999), then click **Start**. As viewers send danmaku containing the keyword, the participant count rises:

- An empty keyword collects every danmaku.
- The danmaku panel shows the current room's feed; scroll up to look back, and it returns to the newest line after a few seconds.
- Click **Stop** when you're ready — the randomly picked winners appear at once and the draw is recorded in history.

With many winners, the list scrolls inside its card and the page layout stays put.

## 5. Review and export history

The **History** tab lists draws for the active profile:

- **Export** saves that draw as Markdown (`keyword-count-winners-time.md`).
- Delete a single entry, or **Delete all** to clear the current profile's history.

## 6. Switch appearance and language

The **Appearance** tab switches light/dark, the background (default gradient / spring-festival / beach / your own image) and the language (中文 / English). Changes apply immediately and are remembered.

::: tip
The sidebar collapses in narrow windows, and danmaku / winner scrollbars only appear while you scroll.
:::
