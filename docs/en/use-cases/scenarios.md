# Use Cases

## Live-stream interactive draw

A streamer runs a keyword interaction; viewers who send the keyword are auto-added to the pool, and winners are drawn at random after stopping.

```mermaid
flowchart LR
    A[Log in] --> B[Add rooms]
    B --> C[Set keyword & winner count]
    C --> D[Start]
    D --> E[Stop & draw]

classDef step fill:var(--vp-c-brand-soft),stroke:var(--vp-c-brand-1),color:var(--vp-c-text-1);
class A,B,C,D,E step;
```

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

::: warning Unsupported capabilities
This is a local desktop app. It does **not** provide: cloud config sync, auto-announcing winners to danmaku, or auto prize distribution. The winner list is shown locally only.
:::
