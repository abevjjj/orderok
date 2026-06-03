-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    display_name TEXT NOT NULL,
    is_admin INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now','localtime'))
);

-- 用户权限表
CREATE TABLE IF NOT EXISTS user_permissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    module TEXT NOT NULL,  -- express_in, purchase, match, claim, confirm, admin
    can_read INTEGER DEFAULT 1,
    can_write INTEGER DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(user_id, module)
);

-- 收快递表
CREATE TABLE IF NOT EXISTS express_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tracking_no TEXT NOT NULL UNIQUE,
    ship_date TEXT NOT NULL,
    arrive_date TEXT NOT NULL,
    goods_desc TEXT NOT NULL,
    created_by INTEGER NOT NULL,
    created_at TEXT DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- 购物记录主表
CREATE TABLE IF NOT EXISTS purchase_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    purchase_date TEXT NOT NULL,
    goods_name TEXT NOT NULL,
    express_company TEXT,
    receiver_id INTEGER,
    created_by INTEGER NOT NULL,
    created_at TEXT DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (receiver_id) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- 购物记录-快递单号关联表（一对多）
CREATE TABLE IF NOT EXISTS purchase_tracking (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    purchase_id INTEGER NOT NULL,
    tracking_no TEXT,
    FOREIGN KEY (purchase_id) REFERENCES purchase_records(id)
);

-- 货物认领表
CREATE TABLE IF NOT EXISTS claim_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    purchase_tracking_id INTEGER NOT NULL,
    purchase_id INTEGER NOT NULL,
    claimed_by INTEGER NOT NULL,
    claim_date TEXT NOT NULL,
    goods_spec TEXT NOT NULL,
    quantity TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (purchase_tracking_id) REFERENCES purchase_tracking(id),
    FOREIGN KEY (purchase_id) REFERENCES purchase_records(id),
    FOREIGN KEY (claimed_by) REFERENCES users(id)
);

-- 订单确认表
CREATE TABLE IF NOT EXISTS confirm_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    claim_id INTEGER NOT NULL UNIQUE,
    confirmed_by INTEGER,
    confirmed_at TEXT,
    status TEXT DEFAULT 'pending',  -- pending, confirmed
    FOREIGN KEY (claim_id) REFERENCES claim_records(id),
    FOREIGN KEY (confirmed_by) REFERENCES users(id)
);

-- 操作日志表
CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    module TEXT NOT NULL,
    action TEXT NOT NULL,  -- create, update, delete, login, logout
    target_id INTEGER,
    detail TEXT,
    created_at TEXT DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 默认管理员 (密码: admin123)
INSERT OR IGNORE INTO users (username, password_hash, display_name, is_admin, is_active)
VALUES ('admin', 'pbkdf2:sha256:260000$placeholder', '管理员', 1, 1);
