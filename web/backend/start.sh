#!/bin/bash
cd "$(dirname "$0")"
PYTHON=$(command -v python3 || command -v python)
echo "安装依赖..."
$PYTHON -m pip install -r requirements.txt --break-system-packages 2>/dev/null || \
$PYTHON -m pip install -r requirements.txt
echo "初始化数据库..."
$PYTHON -c "from app import init_db; init_db()"
echo "启动后端 API (端口 5050)..."
echo "默认账号: admin / admin123"
$PYTHON app.py
