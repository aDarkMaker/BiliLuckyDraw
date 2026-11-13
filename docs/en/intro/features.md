# Features

## Real-time danmaku draw

Once connected to a room the app listens to danmaku continuously. Any message containing your keyword is added to the draw pool — no manual list-keeping for the streamer or mods. A viewer sending several qualifying messages in the same room is counted once, keeping the draw fair.

An empty keyword means "collect everything": every viewer who speaks joins the pool, and the lottery page labels the active mode. At draw time the configured number of winners is picked at random and written to the active profile's history.

## Watch and draw on one screen

The lottery page puts the stream, the room list and the danmaku feed together:

- **Stream player** — an embedded HLS player following the selected room; the cover shows while the room is offline.
- **Room list** — every joined room with its streamer, online count and live status; click to switch the preview.
- **Live danmaku** — the current room's feed, including Bilibili's built-in emotes such as `[oh]`.

The feed sticks to the bottom by default. Scrolling up pauses auto-follow, and about three seconds after you stop it snaps back. Incoming lines are batched so a busy room cannot re-render per message.

## Stability during long streams

- **Player watchdog** — some streams stall silently: no `error` or `stalled` event fires and `currentTime` stops advancing. The player checks the clock every 1.5s; after 5s without progress it attempts a soft resume, and if that fails it rebuilds the player with a fresh play URL, backing off up to 20s.
- **Danmaku reconnect** — the danmaku WebSocket reconnects with backoff. The handshake carries the login state and `buvid3`, so nicknames are not masked and UIDs are not zeroed (which would collapse every viewer into one participant).

## Two login methods

- **Cookie login** — copy the Bilibili Cookie from a browser and paste it in.
- **QR-code login** — click "QR login" to generate a code and scan it with the Bilibili mobile app. Expired and scanned states are surfaced, and the code can be refreshed at any time.

## Multiple draw profiles

Keep a profile per scenario. Each stores its own keyword, winner count, joined rooms and background image. Switching a profile switches all of it at once, and every profile survives restarts.

## Draw history and export

Every draw is recorded automatically under the active profile — keyword, winner count, draw time and the full winner list. The "History" tab in Settings lets you:

- **Export one** — write the winner list to a Markdown file named `keyword-count-time.md`, with a nickname + UID table.
- **Delete one** — remove a single entry.
- **Delete all** — clear every entry for the current profile (with a confirmation dialog).

Switching profiles switches the list. Deleting a profile clears its history too, and each profile keeps the latest 100 entries.

## Appearance

- **Light / dark** — switch manually; the first launch follows the system preference and the choice is remembered.
- **Backgrounds** — the default gradient, the spring-festival or beach image, or an image you upload.
- **Accent** — sampled from the active background, then expanded into a full primary ramp, so every page follows one palette.
- **Language** — built-in 中文 / English switch, Chinese by default.

## Interaction details

- Long winner lists scroll inside their card, so the page itself never gains a scrollbar.
- Panel and list scrollbars appear only while scrolling and fade out when idle.
- Copying the winner list tries the browser clipboard first, then the native backend clipboard, then a system command over the dev bridge.
- Rooms can be added by ID or by pasting a live-room link.
