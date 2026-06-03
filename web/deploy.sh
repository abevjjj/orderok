#!/bin/bash
# 生产部署脚本：构建前端 → 拷贝到后端静态目录 → 启动 Flask
set -e
cd "$(dirname "$0")"
ROOT=$(pwd)

echo "=== 1. 安装后端依赖 ==="
PYTHON=$(command -v python3 || command -v python)
$PYTHON -m pip install -r backend/requirements.txt --break-system-packages 2>/dev/null || \
$PYTHON -m pip install -r backend/requirements.txt

echo "=== 2. 安装前端依赖 ==="
cd frontend
npm ci

echo "=== 3. 构建前端 ==="
npm run build

echo "=== 4. 拷贝构建产物到后端 ==="
cd "$ROOT"
rm -rf backend/runtime/static
mkdir -p backend/runtime
cp -r frontend/dist backend/runtime/static

echo "=== 5. 初始化数据库 ==="
cd backend
$PYTHON -c "from app import init_db; init_db()"

echo "=== 6. 启动服务 ==="
IP=$(hostname -I 2>/dev/null | awk '{print $1}' || echo "localhost")
echo ""
echo "✅ 访问地址: http://${IP}:5050"
echo "✅ 默认账号: admin / admin123"
echo ""
$PYTHON app_prod.py
