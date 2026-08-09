# 应用场景

## 直播间互动抽奖

主播发起关键词互动，观众发送含关键词的弹幕即自动入池，停止后随机开奖。

```mermaid
flowchart LR
    A[登录] --> B[添加房间]
    B --> C[设关键词与中奖数]
    C --> D[开始]
    D --> E[停止开奖]

classDef step fill:var(--vp-c-brand-soft),stroke:var(--vp-c-brand-1),color:var(--vp-c-text-1);
class A,B,C,D,E step;
```

## 多房间同时监控

`WatchedRooms` 支持添加多个房间号，`ConnectLiveRooms` 一次性连接所有房间弹幕 WebSocket，参与者池合并，开奖时从合并池中统一抽取。

## 多场景配置切换

通过 **Profile**（抽奖配置集）保存多套配置，每个 Profile 独立保存关键词、中奖数、监控房间、背景图。可一键切换，无需重复设置。

::: tip Profile 是什么
Profile 是「抽奖配置集」，**不是 B 站账号**。一个 B 站登录（Cookie/扫码）可复用于所有 Profile。例如：日常抽奖、粉丝节、新年专场各建一个 Profile。
:::

## 主题活动

四套内置主题适配不同场景：

- **light / dark**：日常通用
- **spring-festival**：春节/喜庆专场（红色调色板 + 专属背景图）
- **beach**：夏日/轻松氛围（专属背景图）

也可在任意 Profile 设置自定义背景图（主题背景优先级高于自定义背景图）。

::: warning 当前不支持的能力
本应用为本地桌面应用，**不提供**：云端同步配置、自动公告中奖者到弹幕、自动发奖。中奖名单仅在本地展示。
:::
