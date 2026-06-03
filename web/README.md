# 快递管理系统 v4

前后端分离架构：Python Flask (API) + Vite (前端)

## 目录结构

```
express_v4/
├── backend/
│   ├── app.py          # Flask API（纯接口，无模板）
│   ├── app_prod.py     # 生产模式入口（托管前端静态文件）
│   ├── schema.sql      # 数据库结构
│   ├── requirements.txt
│   ├── start.sh        # 仅启动后端（开发用）
│   └── instance/       # SQLite 数据库文件（自动创建）
├── runtime/
│   └── static/         # 生产运行时前端文件（部署脚本生成，不进 Git）
├── frontend/
│   ├── src/
│   │   ├── main.js         # 入口，登录/路由
│   │   ├── style.css       # 全局样式
│   │   ├── utils/
│   │   │   ├── api.js      # 所有 API 调用
│   │   │   ├── ui.js       # DOM/弹窗/QR 工具
│   │   │   └── state.js    # 共享状态
│   │   └── pages/
│   │       ├── ExpressIn.js
│   │       ├── Purchase.js
│   │       ├── Match.js
│   │       ├── Claim.js
│   │       ├── Confirm.js
│   │       └── Admin.js
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── deploy.sh           # 一键构建+启动（生产）
├── update.sh           # 从 GitHub 更新代码并保留数据/配置
└── offline_purchase.html  # 离线录入工具（独立 HTML）
```

## 快速部署（Armbian / Ubuntu）

```bash
# 1. 解压
tar -xzf express_mgmt_v4.tar.gz
cd express_v4

# 2. 一键部署（构建前端 + 启动后端）
chmod +x deploy.sh
./deploy.sh
```

访问 `http://[设备IP]:5050`，默认账号 `admin / admin123`

### 生产更新（GitHub 拉取）

```bash
cd web
bash update.sh
```

更新脚本会：
- 先备份 `backend/instance/`、`backend/.env`、根目录 `.env`
- `git pull --ff-only`
- 重建前端并输出到 `backend/runtime/static/`
- 重新执行非破坏性的数据库初始化，避免重置已有数据

## 开发模式（前后端分离调试）

**后端**（终端1）：
```bash
cd backend
pip install -r requirements.txt --break-system-packages
python3 -c "from app import init_db; init_db()"
python3 app.py
# 监听 :5050
```

**前端**（终端2）：
```bash
cd frontend
npm install
npm run dev
# 监听 :5173，/api 请求自动代理到 :5050
```

浏览器访问 `http://localhost:5173`

## Termux 部署

```bash
cd express_v4
# Node.js 安装（如未安装）
pkg install nodejs

# 一键部署
bash deploy.sh
```

## systemd 自动启动（Armbian）

```bash
sudo cp express_v4.service /etc/systemd/system/
sudo systemctl enable --now express_v4
```

express_v4.service 内容：
```ini
[Unit]
Description=快递管理系统 v4
After=network.target

[Service]
Type=simple
WorkingDirectory=/opt/express_v4/backend
ExecStart=/usr/bin/python3 /opt/express_v4/backend/app_prod.py
Restart=on-failure
Environment=PYTHONUNBUFFERED=1

[Install]
WantedBy=multi-user.target
```

## 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `SECRET_KEY` | 内置默认值 | Flask session 密钥，生产环境请修改 |
| `CORS_ORIGINS` | `http://localhost:5173` | 开发时跨域白名单，生产部署无需设置 |
| `EXPRESS_DB_PATH` | `backend/instance/express.db` | SQLite 数据库路径，生产环境可改到仓库外 |
| `EXPRESS_STATIC_DIR` | `backend/runtime/static` | 生产静态文件目录，默认与代码目录分离 |

## 默认账号

| 用户名 | 密码 | 权限 |
|--------|------|------|
| admin | admin123 | 超级管理员（所有模块读写） |

**首次部署后请立即修改管理员密码。**
