"""
app_prod.py — 生产模式入口
将 Vite 构建产物（默认 backend/runtime/static/）作为静态文件托管，
同时提供所有 /api/* 接口，无需 Nginx。
"""
import os
from flask import send_from_directory
from app import app, init_db

BASE_DIR = os.path.dirname(__file__)
STATIC_DIR = os.environ.get('EXPRESS_STATIC_DIR', os.path.join(BASE_DIR, 'runtime', 'static'))
LEGACY_STATIC_DIR = os.path.join(BASE_DIR, 'static')


def resolve_static_dir():
    if os.path.exists(os.path.join(STATIC_DIR, 'index.html')):
        return STATIC_DIR
    if os.path.exists(os.path.join(LEGACY_STATIC_DIR, 'index.html')):
        return LEGACY_STATIC_DIR
    return STATIC_DIR


STATIC_ROOT = resolve_static_dir()

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_spa(path):
    """把所有非 /api 请求都转发给 index.html（SPA 路由）"""
    target = os.path.join(STATIC_ROOT, path)
    if path and os.path.exists(target):
        return send_from_directory(STATIC_ROOT, path)
    return send_from_directory(STATIC_ROOT, 'index.html')

if __name__ == '__main__':
    init_db()
    app.run(host='0.0.0.0', port=5050, debug=False)
