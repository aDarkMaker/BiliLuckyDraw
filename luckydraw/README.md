# B站抽奖助手

基于 Wails 开发的 B站自动抽奖工具，使用 Go 后端和 React 前端。

## 功能特性

- 自动监控指定用户的动态抽奖
- 自动转发、点赞、评论
- 中奖检测（@消息、私信）
- 图形化界面，操作简单
- 配置持久化保存

## 环境要求

- Go 1.23+
- Node.js 18+
- Wails v2

## 安装

### 1. 安装 Wails

```bash
go install github.com/wailsapp/wails/v2/cmd/wails@latest
```

### 2. 安装前端依赖

```bash
cd frontend
npm install
cd ..
```

### 3. 构建前端

```bash
cd frontend
npm run build
cd ..
```

### 4. 运行开发模式

```bash
wails dev
```

### 5. 构建应用

```bash
wails build
```

## 使用说明

### 获取 Cookie

1. 打开浏览器，访问 [B站主页](https://www.bilibili.com)
2. 按 F12 打开开发者工具
3. 切换到 Network 标签
4. 刷新页面
5. 找到 `nav` 请求，查看 Headers 中的 Cookie
6. 复制完整的 Cookie 字符串

### 登录

1. 启动应用
2. 在登录界面粘贴 Cookie
3. 点击"登录"按钮

### 配置

在配置页面可以设置：

- **监控UID**: 要监控的用户ID列表（每行一个）
- **关键词**: 抽奖动态必须包含的关键词（每行一个正则表达式）
- **转发间隔**: 每次转发之间的等待时间（毫秒）
- **循环等待**: 完成一轮后的等待时间，0表示不循环

### 开始抽奖

1. 配置完成后点击"保存配置"
2. 点击"开始抽奖"按钮
3. 程序会自动监控并参与抽奖

### 检查中奖

点击"检查中奖"按钮可以检查是否有中奖消息。

## 配置说明

配置文件保存在 `~/.luckydraw/config.json`

主要配置项：

- `uids`: 监控的用户ID列表
- `key_words`: 关键词列表（正则表达式）
- `model`: 抽奖模式
  - `"00"`: 关闭自动抽奖
  - `"10"`: 只转发官方抽奖
  - `"01"`: 只转发非官方抽奖
  - `"11"`: 都转发
- `chat_model`: 评论模式（同上）
- `wait`: 转发间隔（毫秒）
- `lottery_loop_wait`: 循环等待时间（毫秒，0为不循环）
- `minfollower`: 最小粉丝数限制
- `relay`: 转发文案列表
- `chat`: 评论内容列表

## 注意事项

1. 请合理设置转发间隔，避免频率过高
2. Cookie 会过期，需要定期更新
3. 本工具仅供学习使用，请勿滥用
4. 使用前请仔细阅读 B站服务条款

## 开发

### 项目结构

```
luckydraw/
├── app.go              # Wails应用主文件
├── main.go             # 程序入口
├── internal/
│   ├── bili/          # B站API客户端
│   ├── config/        # 配置管理
│   ├── lottery/       # 抽奖逻辑
│   └── check/         # 中奖检查
└── frontend/          # React前端
    └── src/
        ├── App.tsx    # 主组件
        └── App.css    # 样式
```

### 重新生成 Wails 绑定

修改 Go 代码后需要重新生成前端绑定：

```bash
wails generate module
```

## 许可证

GPL-3.0

## 免责声明

本工具仅供学习交流使用，作者不对使用本工具造成的任何后果负责。请遵守相关法律法规和平台规则。
