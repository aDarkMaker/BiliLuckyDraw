<div align="center">
  <img src="./img/logo.png" width="160" alt="BiliLuckyDraw logo" />

  # BiliLuckyDraw
  ![Wails](https://img.shields.io/badge/Wails-v2-red?style=for-the-badge)
  ![Go](https://img.shields.io/badge/Go-1.21+-00ADD8?style=for-the-badge&logo=go&logoColor=white)
</div>

---

## 1. 快速开始

1. **下载安装包**：从下方的“下载方式”中选择一个，下载最新的安装文件
2. **登录配置**：支持 Cookie 登录和二维码登录
3. **设置直播间**：在设置界面配置您想要监控的直播间
4. **开启抽奖**：点击“开始”，程序将自动监控弹幕或动态进行抽奖。

## 3. 下载方式

- **[GitHub Releases](https://github.com/aDarkMaker/BiliLuckyDraw/releases)**: 侧边下载即可，暂未支持其他渠道~

## 4. 功能介绍

- **直播间抽奖**：实时监控直播间弹幕，根据关键词自动参与抽奖
- **多种登录方式**：支持 Cookie 登录及二维码扫码登录，安全便捷
- **高度可定制化**：自定义关键词、监控房间

## 5. 技术栈

- **后端**: Wails + Go
- **前端**: React + TypeScript + Vite
- **通信**: WebSocket & Gorilla

## 6. 开发与构建

### 环境要求
- Go
- Node.js / Bun
- Wails CLI

### 本地开发

```bash
git clone https://github.com/aDarkMaker/BiliLuckyDraw.git
cd luckydraw
cd frontend && bun install
```

### 运行与编译

```bash
# macOS
bash dev.sh   # 开发
bash build.sh # 构建

# Windows
wails dev     # 开发
wails build   # 构建
```
