# Use Cases

## Live-stream interactive draw

The most common usage: a streamer runs a keyword interaction in the live room; viewers who send danmaku containing the keyword are auto-added to the pool, and winners are drawn at random after stopping.

1. Log in to a Bilibili account (Cookie or QR code)
2. Add the live room ID(s) to monitor
3. Enter the keyword and set the winner count (1–9999) in the top bar
4. Click Start → danmaku enters the pool in real time, participant count climbs live
5. Click Stop → draw, reveal the winner list

## Multi-room monitoring

`WatchedRooms` accepts multiple room IDs. `ConnectLiveRooms` opens all their danmaku WebSockets at once; the participant pools merge, and the draw picks from the combined pool.

## Multi-scenario config switching

Save multiple draw configurations as **Profiles**. Each Profile independently stores keyword, winner count, watched rooms, and background image. Switch in one click without reconfiguring.

::: tip What a Profile is
A Profile is a "draw-configuration set", **not a Bilibili account**. One Bilibili login (Cookie/QR) is reused across all Profiles. For example: daily draw, fan festival, and New-Year special each get their own Profile.
:::

## Themed events

Four built-in themes fit different scenarios:

- **light / dark**: everyday general use
- **spring-festival**: Spring Festival / festive events (red palette + bundled background)
- **beach**: summer / relaxed vibes (bundled background)

You can also set a custom background image on any Profile (a theme background takes priority over a custom background).

## Multi-account management

Manage via multiple Profiles: switching a Profile swaps a complete draw config while reusing the same Bilibili login. Handy for reusing presets across different stream sessions.

::: warning Unsupported capabilities
This is a local desktop app. It does **not** provide: cloud config sync, auto-announcing winners to danmaku, or auto prize distribution. The winner list is shown locally only.
:::
