---
layout: home

hero:
  name: BiliLuckyDraw
  text: Bilibili live-stream danmaku lucky draw
  tagline: Collect participants automatically and draw winners fairly in one click — with the stream and danmaku kept in the same window.
  image:
    src: /img/logo.png
    alt: BiliLuckyDraw
  actions:
    - theme: brand
      text: Quick Start
      link: /en/intro/quickstart
    - theme: alt
      text: Download
      link: https://github.com/aDarkMaker/BiliLuckyDraw/releases
    - theme: alt
      text: Learn more
      link: /en/intro/product

features:
  - icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8" cy="8" r="1.2" fill="currentColor"/><circle cx="16" cy="8" r="1.2" fill="currentColor"/><circle cx="8" cy="16" r="1.2" fill="currentColor"/><circle cx="16" cy="16" r="1.2" fill="currentColor"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/></svg>
    title: Real-time danmaku draw
    details: Connect a room and the app listens automatically — a viewer sending the keyword joins the draw, deduplicated by UID, no manual list-keeping.
  - icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="13" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/><path d="M10 8.5v4l3.5-2z" fill="currentColor" stroke="none"/></svg>
    title: Watch and draw together
    details: Stream player, room list and danmaku feed share one screen. A stalled stream is recovered automatically; the feed sticks to the bottom, pauses when you scroll up and resumes after a few idle seconds.
  - icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 10V8a5 5 0 0 1 10 0v2"/><rect x="5" y="10" width="14" height="10" rx="2"/><circle cx="12" cy="15" r="1.2" fill="currentColor"/></svg>
    title: Two login methods
    details: Log in by pasting a Cookie, or scan a QR code with the Bilibili mobile app. Credentials stay on your machine.
  - icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M16 18v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="3"/><path d="M22 18v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
    title: Multiple profiles
    details: Keep a profile per scenario — keyword, winner count, rooms and background switch together.
  - icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.39 5.39 0 0 1-4.4 2.26 5.4 5.4 0 0 1-3.14-9.8c-.44-.06-.9-.1-1.36-.1z"/></svg>
    title: Themes and backgrounds
    details: Light and dark switch instantly; the spring-festival and beach backdrops are optional, and the accent color is sampled from the active image.
  - icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v4"/><path d="M12 18v4"/><path d="M4.93 4.93l2.83 2.83"/><path d="M16.24 16.24l2.83 2.83"/><path d="M2 12h4"/><path d="M18 12h4"/><path d="M4.93 19.07l2.83-2.83"/><path d="M16.24 7.76l2.83-2.83"/></svg>
    title: Tuned for busy rooms
    details: A throttled image decode queue, Bilibili CDN thumbnails and visibility-gated mounting keep the UI responsive during danmaku bursts.
---
