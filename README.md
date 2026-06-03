# 快递管理系统

公司内部快递收发管理系统，包含 Web 管理后台、Android 扫码客户端和离线录入工具。

## 项目结构

```
express-system/
├── web/                    # Web 系统（Flask API + Vite 前端）
│   ├── backend/            # Python Flask API
│   └── frontend/           # Vite 前端源码
├── android/                # Android 扫码客户端（Kotlin）
├── .github/workflows/      # GitHub Actions 自动构建 APK
├── offline_purchase.html   # 离线购物记录录入工具（单文件 HTML）
└── README.md
```

## 模块说明

### Web 系统 (`web/`)

功能模块：收快递登记、购物记录管理、匹配报表、货物认领、订单确认、用户权限管理。

**部署（Armbian / Ubuntu / Termux）：**
```bash
cd web
chmod +x deploy.sh && ./deploy.sh
# 访问 http://[设备IP]:5050
# 默认账号 admin / admin123
```

**生产更新（从 GitHub 拉取，不覆盖数据和配置）：**
```bash
cd web
bash update.sh
```
更新脚本会保留 `backend/instance/` 下的 SQLite 数据库，并优先使用 `backend/runtime/static/` 作为运行时前端文件目录，避免 `git pull` 影响存量数据。

**开发模式：**
```bash
# 终端1 - 后端
cd web/backend && python3 app.py

# 终端2 - 前端热更新
cd web/frontend && npm run dev
# 访问 http://localhost:5173
```

### Android 客户端 (`android/`)

收快递扫码登记 App，配合 Web 后端使用。

**通过 GitHub Actions 构建 APK：**
1. Push 代码到 GitHub
2. 进入 `Actions` → `Build Android APK` → `Run workflow`
3. 构建完成后下载 Artifact 中的 APK

> 当前 workflow 只构建可直接安装的 `debug APK`。如果后续需要发布签名 `release APK`，还要补充 keystore 和签名配置。

**本地构建：**
```bash
cd android
chmod +x gradlew
./gradlew assembleDebug
# APK: android/app/build/outputs/apk/debug/app-debug.apk
```

**首次使用：**
- 服务器地址：`http://[服务器IP]:5050`
- 用户名/密码：与 Web 端账号相同

### 离线录入工具 (`offline_purchase.html`)

单文件 HTML，无需服务器，数据存储在浏览器 localStorage。
用于离线录入购物记录，导出后可批量导入到 Web 系统。

## 快递单号唯一性说明

- **收快递模块**：快递单号在 `express_records` 表内唯一
- **购物记录模块**：快递单号在 `purchase_tracking` 表内唯一
- 两个模块之间**相互独立**，同一单号可同时存在于两个模块，通过单号匹配关联

## 技术栈

| 层 | 技术 |
|---|---|
| 后端 API | Python 3 + Flask + SQLite |
| Web 前端 | Vite + 原生 JS（无框架） |
| Android | Kotlin + CameraX + ML Kit + OkHttp |
| 部署 | 单进程 Flask（静态文件 + API） / Gunicorn |
| CI/CD | GitHub Actions |
