# Features

## Real-time danmaku draw

Once connected to a live room, the app continuously listens to danmaku. Any viewer whose message contains your configured keyword is automatically added to the draw pool — no manual list-keeping for the streamer or mods. A viewer who sends multiple qualifying messages in the same room is only counted once, keeping the draw fair. At draw time, the configured number of winners is picked at random from the pool.

## Two login methods

- **Cookie login**: copy your Bilibili Cookie from the browser and paste it in — handy if you're comfortable with it.
- **QR-code login**: click "QR login" to generate a QR code, then scan it with the Bilibili mobile app — secure and convenient, no manual Cookie copying.

## Multiple draw profiles

Keep a separate profile for each scenario — each one holds its own keyword, winner count, watched rooms and background image. Switch with one click before going live; everything is preserved across switches and restarts.

## Draw history & export

Every draw is automatically recorded as a history entry, bound to the active profile — it stores the keyword, winner count, draw time and the full winner list. The "Lottery History" card in Settings shows every entry for the current profile:

- **Export one**: click "Export" on an entry, pick where to save, and the winner list is exported as a Markdown file named `keyword-count-time.md` with a table of nickname + UID.
- **Delete one**: remove a history entry you no longer need.
- **Delete all**: clear every entry for the current profile in one click.

Switching profiles switches the history list to that profile's entries. Deleting a profile clears its history along with it.

## Four themes

Four built-in looks, switchable any time while running:

| Theme | Description | Bundled background |
| --- | --- | --- |
| light | Light interface; follows system color scheme on first launch | No (customizable) |
| dark | Dark interface, easy on the eyes | No (customizable) |
| spring-festival | Red palette, frosted-glass and festive feel | Yes |
| beach | Blue palette, frosted-glass and fresh feel | Yes |

Your choice is remembered across restarts. Spring-festival and beach ship with a background; under light and dark you can use your own.

## Flexible & customizable

- Custom keyword — decides which danmaku count as entries
- Custom watched rooms — monitor several rooms at once, with participants merged into one pool
- Custom winner count — anywhere from 1 to 9999
- Custom background image — applies under light / dark (spring-festival and beach use their bundled backgrounds)

## Winner-list display

When there are many winners, the winner-list card caps its height and scrolls internally (the scrollbar is hidden), so the lottery page itself never scrolls vertically and stays visually clean.
