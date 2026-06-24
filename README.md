# 🐭 跑刀鼠 · 三角洲行动跑刀接单平台

> 微信原生小程序 + 云开发 ｜ 三角洲行动游戏服务撮合平台

---

## 快速开始

```bash
# 1. 用微信开发者工具打开此目录
# 2. 修改 config/env.js 中的 CLOUD_ENV_ID 为你的云环境 ID
# 3. 修改 project.config.json 中的 appid 为你的小程序 AppID
# 4. 云开发控制台 → 数据库 → 创建集合（见下方）
# 5. 逐个右键 cloudfunctions/ 下各目录 → 上传并部署
# 6. 编译运行
```

---

## 项目结构

```
paodao/
├── app.js                          # 入口：云初始化、登录、角色切换
├── app.json                        # 页面注册 + TabBar（3个tab）
├── app.wxss                        # 全局样式变量 + 工具类
├── project.config.json             # 项目配置（云函数根目录）
├── config/
│   └── env.js                      # 集中配置：云ID、费率、分页、状态映射、地图、提现/聊天/首页参数
├── utils/
│   └── util.js                     # 工具函数：日期/价格/状态/防抖/节流/校验
├── components/
│   ├── order-card/                 # 订单卡片组件（类型图标+地图+价格+状态+slot）
│   ├── status-tag/                 # 状态标签组件（6种状态映射）
│   └── navigation-bar/             # 自定义导航栏
├── pages/
│   ├── index/                      # 首页：轮播图 + 快捷入口 + 推荐打手
│   ├── orderPublish/               # 发布订单：类型选择 + 地图picker + 图片上传
│   ├── orderHall/                  # 订单大厅：三筛选器 + 下拉刷新 + 接单
│   ├── orderDetail/                # 订单详情：状态流转 + 双视角操作
│   ├── profile/                    # 个人中心：信息编辑 + 角色切换 + 统计
│   ├── verify/                     # 打手认证：游戏ID + 截图上传
│   ├── myOrders/                   # 我的订单：Tab筛选（全部/待接单/进行中/已完成/已结算/已取消）
│   ├── chat/                       # 订单沟通：消息列表 + 图片发送 + 5秒轮询
│   ├── withdraw/                   # 收益提现：余额卡片 + 快捷金额 + 记录
│   └── admin/                      # 管理后台：打手认证审核（仅 admin 角色可访问）
├── cloudfunctions/
│   ├── login/                      # 用户登录/注册/认证提交
│   ├── publishOrder/               # 发布订单
│   ├── acceptOrder/                # 接单（含状态校验+认证检查）
│   ├── updateOrderStatus/          # 状态流转（含状态机规则+权限校验）
│   ├── confirmOrder/               # 确认完成与结算（双方确认→自动打款→扣5%平台费）
│   ├── uploadImage/                # 图片上传到云存储
│   ├── getOrderList/               # 订单列表查询（分页+多条件筛选+详情）
│   ├── withdrawApply/              # 提现申请（余额扣减+记录）
│   ├── sendMessage/                # 发送聊天消息（权限校验）
│   ├── getMessages/                # 获取聊天消息（双向过滤）
│   ├── initDatabase/               # 初始化数据库集合与索引（一键建表）
│   └── setAdmin/                   # 设置管理员角色
├── images/                         # TabBar图标等静态资源
└── README.md
```

---

## 技术栈

| 层 | 技术 |
|----|------|
| 框架 | 微信原生小程序（基础库 3.0+） |
| 语言 | JavaScript + WXML + WXSS |
| 后端 | 微信云开发（云函数 + 云数据库 + 云存储） |
| 状态管理 | 全局 app.globalData + wx.Storage |
| UI 主题 | 深色风  #0A0E17 / #F5A623 |

---

## 页面功能

| 页面 | 路径 | 功能要点 |
|------|------|----------|
| 首页 | `pages/index/index` | 轮播图 banner、快捷入口 grid（发布订单/订单大厅/我的订单）、推荐打手列表，按用户角色渲染不同操作 |
| 订单大厅 | `pages/orderHall/orderHall` | 三筛选器（服务类型 / 地图 / 价格区间），下拉刷新 + 触底加载，接单按钮（含角色 + 认证检查） |
| 发布订单 | `pages/orderPublish/orderPublish` | 服务类型选择（跑刀/护航/代肝）、地图 picker、一口价/时薪切换、图片上传最多 4 张、表单校验 |
| 订单详情 | `pages/orderDetail/orderDetail` | 状态栏 + 订单信息 + 截图展示 + 打手信息卡片，按老板/打手/路人 3 种视角显示不同操作按钮 |
| 个人中心 | `pages/profile/profile` | 微信头像昵称组件、角色切换（老板 ↔ 打手）、打手统计面板（累计收益/可提现/完成数/好评率）、功能菜单 |
| 打手认证 | `pages/verify/verify` | 认证状态提示（未提交/审核中/已通过/已拒绝）、游戏 ID + 段位截图 + 战绩截图上传 |
| 我的订单 | `pages/myOrders/myOrders` | 6 个状态 Tab 切换（全部/待接单/进行中/已完成/已结算/已取消）、分页列表 |
| 订单沟通 | `pages/chat/chat` | 文字 + 图片消息、5 秒轮询刷新、自动滚动到底、时间分组分隔线 |
| 收益提现 | `pages/withdraw/withdraw` | 余额卡片、快捷金额（¥10/¥50/¥100/全部）、微信收款、最低 ¥10、免手续费、提现记录 |
| 管理后台 | `pages/admin/admin` | 打手认证审核（通过/拒绝）、仅 admin 角色可访问、预览认证截图 |

---

## 订单状态流转

```
 pending ──→ accepted ──→ ongoing ──→ completed ──→ settled
   │              │                                      ↑
   └──────────────┴────→ cancelled                       │
                                     ┌─ bossConfirm=true ─┘
                                     ├─ playerConfirm=true
                                     └─ 自动结算：amount×95% → 打手余额，5% 平台费
```

- 仅老板可取消（pending / accepted 状态）
- 仅打手可开始服务（accepted → ongoing）
- 仅打手可申请完成（ongoing → completed）
- 双方确认后自动结算，无需人工审核

---

## 数据库集合

| 集合 | 说明 | 关键字段 |
|------|------|----------|
| `users` | 用户 | `_openid`, `role`(boss/player/admin), `isVerified`, `verifyStatus`, `verifyImages`, `gameId`, `nickName`, `avatarUrl`, `totalEarned`, `balance`, `orderCount`, `rating`, `createTime` |
| `orders` | 订单 | `_openid`(老板), `playerOpenid`(打手), `status`, `serviceType`, `map`, `price`, `bossConfirm`, `playerConfirm` |
| `reviews` | 评价 | `orderId`, `fromOpenid`, `toOpenid`, `rating`, `content` |
| `withdrawals` | 提现 | `playerOpenid`, `amount`, `status`(pending/success/failed), `createTime` |
| `messages` | 消息 | `orderId`, `fromOpenid`, `toOpenid`, `content`, `type`(text/image), `isRead` |

**建议索引：**
- `orders`: `status` + `createTime` 复合索引、`_openid` + `status`、`playerOpenid` + `status`
- `messages`: `orderId` + `createTime`
- `withdrawals`: `playerOpenid` + `createTime`

**数据库权限：**
- `users`/`orders`/`reviews`: 所有用户可读，仅创建者可写
- `withdrawals`/`messages`: 仅创建者可读写

---

## 云函数清单

| # | 云函数 | 核心能力 |
|---|--------|----------|
| 1 | `login` | openid 注册/登录、用户信息更新、角色切换、认证提交 |
| 2 | `publishOrder` | 校验参数 → 写入 orders 集合 |
| 3 | `acceptOrder` | 检查订单状态 / 是否自接 / 打手认证 → 写入 playerOpenid |
| 4 | `updateOrderStatus` | **状态流转机**：检查 STATE_TRANSITIONS 规则表 + 权限校验 → 更新状态 |
| 5 | `confirmOrder` | 双方确认后 `balance += amount×0.95`、`totalEarned += amount×0.95`、`orderCount += 1` |
| 6 | `uploadImage` | `wx-server-sdk.uploadFile` → 云存储 |
| 7 | `getOrderList` | 多条件组合筛选、分页查询、详情获取含打手信息 |
| 8 | `withdrawApply` | 余额校验 → 扣减 → 写入记录 |
| 9 | `sendMessage` | 发送方校验 → 确定接收方 → 写入 messages |
| 10 | `getMessages` | 按 orderId + 双向过滤 → 排序返回 |
| 11 | `initDatabase` | 一键创建所有数据库集合及安全规则 |
| 12 | `setAdmin` | 将指定用户设为 admin 角色 |

---

## 环境配置

`config/env.js` 集中管理所有敏感配置和可调参数，**修改任何配置只需改这一个文件**。

```js
// ===== 基础配置 =====
CLOUD_ENV_ID: 'xxxxxxxxx'   // ← 替换为你的云环境 ID
PLATFORM_FEE_RATE: 0.05                         // 平台抽成比例（5%）
PAGE_SIZE: 10                                   // 订单列表每页条数

// ===== 状态/类型映射 =====
ORDER_STATUS: { pending, accepted, ongoing, completed, settled, cancelled }
SERVICE_TYPE: { run: '跑刀', escort: '护航', farm: '代肝' }
MAP_LIST: ['零号大坝（普通）', '机密大坝', ...]   // 8 张地图
VERIFY_STATUS: { pending, approved, rejected }

// ===== 提现配置 =====
WITHDRAW: {
  MIN_AMOUNT: 10,       // 最低提现金额（元）
  MAX_RECORDS: 20,      // 提现记录查询条数
  FEE_RATE: 0           // 提现手续费率（0=免手续费）
}

// ===== 聊天配置 =====
CHAT: {
  POLL_INTERVAL: 5000,  // 消息轮询间隔（毫秒）
  PAGE_SIZE: 20,        // 消息列表每页条数
  POLL_SIZE: 5,         // 轮询时拉取最新消息条数
  SCROLL_DELAY: 100     // 滚动到底部延迟（毫秒）
}

// ===== 首页数据配置 =====
INDEX: {
  HOT_PLAYERS_LIMIT: 6,     // 推荐打手显示数量
  RECENT_ORDERS_LIMIT: 5    // 最新订单显示数量
}

// ===== 管理员配置 =====
ADMIN: {
  PENDING_LIMIT: 50,              // 待审核用户查询条数
  PASSWORD: 'your_admin_password_here'  // 管理员激活密码（请修改为强密码）
}
```

> **注意：** 云函数中引用 `env.js` 需使用 `const env = require('../../config/env.js')`，因为云函数部署后目录结构与本地不同。

---

## TabBar 图标

需在 `images/` 目录下准备以下 6 个图标（建议 81×81px PNG）：

| 文件名 | 用途 |
|--------|------|
| `tab-home.png` / `tab-home-active.png` | 首页 |
| `tab-order.png` / `tab-order-active.png` | 订单大厅 |
| `tab-profile.png` / `tab-profile-active.png` | 我的 |

---

## UI 设计规范

| 用途 | 色值 | CSS 变量 |
|------|------|----------|
| 页面背景 | `#0A0E17` | `--bg-primary` |
| 卡片背景 | `#151E2C` | `--bg-card` |
| 卡悬停 | `#1A2435` | `--bg-card-hover` |
| 强调色（金色） | `#F5A623` | `--accent` |
| 成功 | `#2ECC71` | `--success` |
| 危险 | `#E74C3C` | `--danger` |
| 信息 | `#3498DB` | `--info` |
| 主文字 | `#FFFFFF` | `--text-primary` |
| 次文字 | `#A0B0C0` | `--text-secondary` |
| 弱文字 | `#5A6A7A` | `--text-muted` |
| 边框 | `rgba(255,255,255,0.08)` | `--border-color` |
| 圆角 | `16rpx` / `8rpx` | `--border-radius` / `--border-radius-sm` |

---

## 开发注意事项

- ⚠️ **不存 openid 在前端**，openid 由云函数 `cloud.getWXContext()` 获取
- ⚠️ **不诱导分享**，所有分享功能由微信原生按钮提供
- ⚠️ **状态机在云函数端强制校验**，前端仅作 UI 判断，不可绕过
- ⚠️ **所有可调参数集中在 `config/env.js`**，禁止在业务代码中硬编码数字（费率、分页大小、轮询间隔、提现限额等）
- 所有异步操作需有 loading 状态和 catch 错误处理
- 远程图片使用 `wx.cloud.getTempFileURL` 换取临时链接后再展示（不直接使用云存储 fileID）
- 云函数引用 `env.js` 路径为 `require('../../config/env.js')`，部署时需确保 `config/` 随云函数一起上传

---

## 开源协议

本项目基于 MIT 协议开源。详情请参阅 [LICENSE](LICENSE) 文件。

```
MIT License

Copyright (c) 2024 跑刀鼠

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
