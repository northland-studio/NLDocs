# NLDocs Android App

NLDocs Android 应用，基于 Capacitor 将 Vue 3 + Vite 前端打包为 Android 原生应用。

## 前置要求

- **Node.js** 18+
- **Android Studio**（含 Android SDK）
- **JDK** 17+

## 安装与初始化

```bash
# 安装依赖
npm install

# 生成 Android 原生工程（首次运行，需要 Android SDK）
npx cap add android
```

> 注意：`android/` 原生工程目录由 `npx cap add android` 生成，已被 `.gitignore` 忽略。

## 构建流程

### 1. 构建前端

```bash
npm run build:web
```

构建 `../../frontend` 下的 Vue 3 应用，输出到 `../../frontend/dist`。

### 2. 同步到 Android 工程

```bash
npm run sync
```

将 Web 资源同步到 Android 原生工程，并更新原生插件。

### 3. 一键构建并复制

```bash
npm run copy
```

等价于 `npm run build:web` + `npx cap copy android`。

### 4. 在 Android Studio 中打开

```bash
npm run open
```

### 5. 构建 APK

```bash
npm run build:apk
```

执行完整的 Web 构建 + 同步，然后在 `android/` 目录运行 `./gradlew assembleDebug` 生成 Debug APK。

生成的 APK 位于 `android/app/build/outputs/apk/debug/app-debug.apk`。

## API URL 配置

应用需要连接到后端服务器，请修改 `src/api-config.js`：

```javascript
export const API_BASE_URL = 'http://localhost:3000';  // 改为你的后端地址
export const OAUTH_REDIRECT_URI = 'nldocs://callback';
```

### 注意事项

- **真机调试**：`localhost` 指向模拟器自身，无法访问宿主机后端。请使用宿主机 IP（如 `http://192.168.1.100:3000`）。
- **HTTPS 后端**：若后端使用 HTTPS，请确保证书有效，或在 `capacitor.config.json` 中配置相应选项。
- **混合内容**：已在 `capacitor.config.json` 中启用 `allowMixedContent: true`，允许 HTTPS 应用访问 HTTP 后端。
- **OAuth 回调**：默认使用 `nldocs://callback` 作为重定向 URI，需在 Android 工程的 `AndroidManifest.xml` 中注册对应 scheme。

## 目录结构

```
app/Android/
├── package.json              # 依赖与脚本
├── capacitor.config.json     # Capacitor 配置
├── README.md                 # 本文档
├── .gitignore
└── src/
    ├── api-config.js         # API URL 配置
    └── main.js               # 入口说明文档
```

`android/` 目录在运行 `npx cap add android` 后生成，包含原生 Android 工程。

## 常用 Capacitor 命令

```bash
npx cap sync android          # 同步 Web 资源和插件
npx cap copy android          # 仅复制 Web 资源
npx cap open android          # 在 Android Studio 中打开
npx cap add android           # 添加 Android 平台（仅首次）
```

## 故障排查

- **Gradle 构建失败**：检查 JDK 版本是否为 17+，可在 Android Studio 中配置。
- **白屏**：确认 `npm run build:web` 已成功，`frontend/dist` 目录存在且包含 `index.html`。
- **网络请求失败**：检查 `api-config.js` 中的 `API_BASE_URL`，确保真机可访问。
- **插件不生效**：运行 `npm run sync` 重新同步原生插件。
