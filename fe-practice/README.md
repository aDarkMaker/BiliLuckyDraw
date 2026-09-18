# BiliLuckyDraw

千早爱音是华中科技大学计算机学院的一名学生，很不幸，她年纪轻轻就已经是重度管人痴了，自从上了大学，她每次在 B 站看高松灯直播抽奖次次都不在名单上，她觉得这里面一定有黑幕，于是灵机一动，为什么不自己写一个呢？

但是爱音貌似不太会前端，有一点点糖，只自学了 HTML/CSS/JS 这前端三件套，她只自己写了一个负责转发的本地小服务作为后端。

接下来呢，请你帮助爱音同学：

- 只使用三件套
- 不使用现有的前端框架
- 完成核心逻辑和前端交互

## 跑起来

```bash
cd fe-practice/server
go run . -addr 127.0.0.1:8787 -web ../web
```

打开 http://127.0.0.1:8787 ，改 `web/` 直接刷页面。

## 目录

```
fe-practice/
├── server/          # 转发服务，不用动
├── web/             # 你要写的地方（现在是空壳）
│   ├── index.html
│   ├── style.css
│   └── js/main.js
└── docs/
    ├── features.md  # 功能清单
    ├── api.md       # 接口说明
    └── delivery.md  # 交付说明
```

## 后端干了啥

- 静态托管 `web/`
- `/api` `/live` `/passport` 反代到 B 站（解决跨域）
- `/ws` 弹幕中转（字节原样转发，不解析）

登录 Cookie 走请求头 `X-Cookie`（浏览器不让脚本设 `Cookie`），扫码拿到的 Cookie 从响应头 `X-Set-Cookie` 读。

详见 [docs/api.md](docs/api.md)。
