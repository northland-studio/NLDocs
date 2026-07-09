<div align="center">
  <img src="icon.png" width="200" height="200" alt="NLDocs Logo">
</div>

<div align="center">

# NLDocs - 北域文档

团队文档管理系统

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Vue](https://img.shields.io/badge/Vue-3.5-42b883)
![Express](https://img.shields.io/badge/Express-4.18-000000)
![SQLite](https://img.shields.io/badge/SQLite-sql.js-003B57)
![Platform](https://img.shields.io/badge/platform-Web%20%7C%20Android%20%7C%20Desktop-lightgrey)

</div>

## 项目介绍

NLDocs（北域文档）是一套面向团队的文档管理系统，提供文档管理、审批流程、公告发布、通知系统等核心能力，并集成玄剑公会官网 OAuth 2.0 认证，实现统一的身份与等级权限映射。系统支持 Web、Android、桌面（Windows / macOS / Linux）多端访问，可作为公会、工作室、小型团队的内部知识协作平台。

## 功能特性

- **文档管理**：支持文档创建、编辑、版本控制与分类管理，便于团队知识沉淀。
- **审批流程**：提供多级审批与审批委托机制，覆盖文档发布与变更的审核场景。
- **公告系统**：面向团队发布重要公告，支持编辑与详情查看。
- **通知中心**：未读消息提醒与通知分类管理，确保关键信息不遗漏。
- **用户权限**：基于玄剑公会 OAuth 等级进行权限映射，实现细粒度访问控制。
- **多格式文件预览**：支持 PDF、DOCX、XLSX、PPTX、图片、代码等多种格式的在线预览。
- **亮色 / 暗色主题**：支持主题切换，适配不同使用环境。
- **PWA 支持**：可作为渐进式 Web 应用安装，提供离线与原生般的体验。
- **Android 原生应用**：基于 Capacitor 构建 Android 原生客户端。
- **桌面应用**：基于 Electron 打包 Windows、macOS、Linux 桌面应用。

## 技术栈

### 前端

- [Vue 3](https://vuejs.org/) `^3.5.39` - 渐进式前端框架
- [Vite](https://vitejs.dev/) `^8.1.1` - 下一代前端构建工具
- [Vue Router](https://router.vuejs.org/) `^4.2.5` - 官方路由
- [Axios](https://axios-http.com/) `^1.6.2` - HTTP 请求库
- [Marked](https://marked.js.org/) `^11.1.1` - Markdown 解析
- [PDF.js](https://mozilla.github.io/pdf.js/) `^4.0.379` - PDF 文件预览
- [Mammoth](https://github.com/mwilliamson/mammoth.js) `^1.6.0` - DOCX 文件解析
- [SheetJS (xlsx)](https://sheetjs.com/) `^0.18.5` - Excel 文件解析
- [highlight.js](https://highlightjs.org/) `^11.9.0` - 代码语法高亮

### 后端

- [Node.js](https://nodejs.org/) - JavaScript 运行时
- [Express](https://expressjs.com/) `^4.18.2` - Web 框架
- [sql.js](https://github.com/sql-js/sql.js) `^1.10.3` - SQLite WebAssembly 实现
- [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) `^9.0.2` - JWT 鉴权
- [Multer](https://github.com/expressjs/multer) `^1.4.5-lts.1` - 文件上传中间件
- [Axios](https://axios-http.com/) `^1.6.2` - OAuth 服务端通信
- [dotenv](https://github.com/motdotla/dotenv) `^16.3.1` - 环境变量管理

### 认证

- OAuth 2.0 - 与玄剑公会官网集成，实现统一登录与等级权限映射

### 移动端与桌面端

- [Capacitor](https://capacitorjs.com/) - Android 原生应用容器
- [Electron](https://www.electronjs.org/) - 跨平台桌面应用（Windows / macOS / Linux）

## 项目结构

```text
NLDocs/
├── app/                          # 多端原生应用容器
│   ├── Android/                  # Capacitor Android 原生应用
│   ├── Desktop/                  # Electron 桌面应用
│   └── iOS/                      # iOS 平台
├── backend/                      # 后端服务
│   ├── data/
│   │   ├── nldocs.db             # SQLite 数据库文件
│   │   └── uploads/              # 上传文件存储目录
│   ├── logs/                     # 运行日志
│   ├── middleware/
│   │   ├── auth.js               # JWT 鉴权中间件
│   │   └── requestLogger.js      # 请求日志中间件
│   ├── routes/
│   │   ├── admin.js              # 管理后台接口
│   │   ├── announcements.js      # 公告接口
│   │   ├── approvals.js          # 审批接口
│   │   ├── auth.js               # 认证接口
│   │   ├── categories.js         # 分类接口
│   │   ├── documents.js          # 文档接口
│   │   ├── notifications.js      # 通知接口
│   │   └── upload.js             # 上传接口
│   ├── scripts/
│   │   └── init-db.js            # 数据库初始化脚本
│   ├── tests/                    # 后端单元测试
│   ├── utils/
│   │   ├── logger.js             # 日志工具
│   │   └── notifications.js      # 通知工具
│   ├── .env.example              # 环境变量示例
│   ├── database.js               # 数据库连接与初始化
│   ├── index.js                  # 服务入口
│   └── package.json
├── frontend/                     # 前端应用
│   ├── public/
│   │   ├── icon.png              # 应用图标
│   │   ├── manifest.json         # PWA 清单
│   │   └── sw.js                 # Service Worker
│   ├── src/
│   │   ├── api/                  # 接口请求封装
│   │   │   ├── admin.js
│   │   │   ├── announcements.js
│   │   │   ├── approvals.js
│   │   │   ├── auth.js
│   │   │   ├── document.js
│   │   │   ├── documents.js
│   │   │   └── notifications.js
│   │   ├── assets/
│   │   │   └── icons/            # SVG 图标组件
│   │   ├── components/
│   │   │   └── preview/          # 文件预览组件
│   │   ├── router/
│   │   │   └── index.js          # 路由配置
│   │   ├── styles/               # 全局样式与设计令牌
│   │   ├── tests/                # 前端单元测试
│   │   ├── views/                # 页面视图
│   │   ├── App.vue               # 根组件
│   │   └── main.js               # 应用入口
│   ├── .env                      # 环境变量
│   ├── index.html                # HTML 模板
│   ├── package.json
│   └── vite.config.js            # Vite 构建配置
├── icon.png                      # 项目 Logo
├── docker-compose.yml            # Docker Compose 编排
├── Dockerfile                    # 容器构建文件
├── ecosystem.config.js           # PM2 进程配置
├── LICENSE                       # MIT 许可证
└── package.json                  # 工作区根配置
```

## 安装

### 环境要求

- Node.js >= 18
- npm >= 9

### 前端

```bash
cd frontend
npm install
npm run dev
```

开发服务器默认运行在 `http://localhost:5173`。

### 后端

```bash
cd backend
npm install
npm start
```

后端服务默认运行在 `http://localhost:3000`。

首次启动可执行数据库初始化脚本：

```bash
npm run init-db
```

### 环境变量

在 `backend/` 目录下创建 `.env` 文件（可参考 `.env.example`），配置以下变量：

```env
# 服务端口
PORT=3000

# JWT 密钥
JWT_SECRET=your-secret-key

# OAuth 配置（玄剑公会官网集成）
OAUTH_CLIENT_ID=NLDocs
OAUTH_CLIENT_SECRET=your-client-secret
OAUTH_REDIRECT_URI=http://localhost:5173/callback
OAUTH_AUTH_URL=https://xuanjian.top/api/oauth/authorize
OAUTH_TOKEN_URL=https://xuanjian.top/api/oauth/token
OAUTH_VERIFY_URL=https://xuanjian.top/api/oauth/verify
```

前端可在 `frontend/` 目录下创建 `.env` 文件配置接口地址等参数。

### 一键启动（工作区）

在项目根目录执行：

```bash
npm install
npm run dev
```

该命令会同时启动前后端服务。

## 使用指南

### OAuth 登录流程

1. 用户在登录页点击登录，系统跳转至玄剑公会官网 OAuth 授权页面。
2. 用户在官网完成身份认证并授权 NLDocs 访问。
3. 官网携带授权码回调至 NLDocs 的 `/callback` 路由。
4. 后端使用授权码换取访问令牌，并验证用户身份与等级。
5. 系统签发 JWT 令牌，用户登录完成，权限依据公会等级映射。

### 文档操作

- 在「文档」页面创建新文档，支持富文本与 Markdown 编辑。
- 可对文档进行分类归档、版本管理，随时查看历史版本。
- 支持上传附件，并提供 PDF、DOCX、XLSX、PPTX、图片、代码等多格式在线预览。

### 审批流程

- 文档发布或重要变更前提交审批申请。
- 审批按多级流程流转，审批人可同意、驳回或委托他人处理。
- 审批结果通过通知中心实时反馈给申请人。

## 许可证

本项目基于 [MIT License](LICENSE) 开源。

<div align="center">
  <sub>由 <a href="https://beiyu.xuanjian.top">北域工作室 Northland Studio</a> 维护</sub>
</div>
