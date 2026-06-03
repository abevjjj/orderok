from flask import Flask, g, session, jsonify, request
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
import sqlite3, os, json
from datetime import datetime, timedelta
from functools import wraps

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'express-mgmt-secret-2024-change-me')
app.permanent_session_lifetime = timedelta(days=30)

# ─── CORS ─────────────────────────────────────────────────────────────────────
# 开发时允许 Vite dev server (localhost:5173)；生产时前端由 Flask 托管则不需要
CORS(app,
     supports_credentials=True,
     origins=os.environ.get('CORS_ORIGINS', 'http://localhost:5173').split(','))

BASE_DIR = os.path.dirname(__file__)
DATABASE = os.environ.get('EXPRESS_DB_PATH', os.path.join(BASE_DIR, 'instance', 'express.db'))
SCHEMA_PATH = os.path.join(BASE_DIR, 'schema.sql')
DEFAULT_ADMIN_PASSWORD = 'admin123'
DEFAULT_ADMIN_HASH = 'pbkdf2:sha256:260000$placeholder'

# ─── DB ───────────────────────────────────────────────────────────────────────
def get_db():
    if 'db' not in g:
        g.db = sqlite3.connect(DATABASE, detect_types=sqlite3.PARSE_DECLTYPES)
        g.db.row_factory = sqlite3.Row
        g.db.execute("PRAGMA journal_mode=WAL")
        g.db.execute("PRAGMA foreign_keys=ON")
    return g.db

@app.teardown_appcontext
def close_db(e=None):
    db = g.pop('db', None)
    if db: db.close()

def init_db():
    os.makedirs(os.path.dirname(DATABASE), exist_ok=True)
    db = sqlite3.connect(DATABASE)
    db.row_factory = sqlite3.Row
    with open(SCHEMA_PATH) as f:
        db.executescript(f.read())

    admin = db.execute(
        "SELECT id, password_hash FROM users WHERE username='admin' LIMIT 1"
    ).fetchone()
    if admin is None:
        admin_id = db.execute(
            "INSERT INTO users(username,password_hash,display_name,is_admin) VALUES(?,?,?,1)",
            ('admin', generate_password_hash(DEFAULT_ADMIN_PASSWORD), '管理员')
        ).lastrowid
    else:
        admin_id = admin['id']
        if admin['password_hash'] == DEFAULT_ADMIN_HASH:
            db.execute(
                "UPDATE users SET password_hash=? WHERE id=?",
                (generate_password_hash(DEFAULT_ADMIN_PASSWORD), admin_id)
            )

    modules = ['express_in', 'purchase', 'match', 'claim', 'confirm', 'admin']
    for m in modules:
        db.execute(
            "INSERT OR IGNORE INTO user_permissions(user_id,module,can_read,can_write) VALUES(?,?,1,1)",
            (admin_id, m)
        )
    db.commit()
    db.close()

def query(sql, args=(), one=False):
    cur = get_db().execute(sql, args)
    rv = cur.fetchall()
    return (rv[0] if rv else None) if one else rv

def execute(sql, args=()):
    db = get_db()
    cur = db.execute(sql, args)
    db.commit()
    return cur.lastrowid

# ─── AUTH HELPERS ─────────────────────────────────────────────────────────────
def log_action(module, action, target_id=None, detail=None):
    uid = session.get('user_id')
    execute(
        "INSERT INTO audit_logs(user_id,module,action,target_id,detail) VALUES(?,?,?,?,?)",
        (uid, module, action, target_id, detail))

def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'error': 'unauthorized'}), 401
        return f(*args, **kwargs)
    return decorated

def perm_required(module, write=False):
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            if 'user_id' not in session:
                return jsonify({'error': 'unauthorized'}), 401
            u = query("SELECT is_admin FROM users WHERE id=?", (session['user_id'],), one=True)
            if u and u['is_admin']:
                return f(*args, **kwargs)
            p = query(
                "SELECT * FROM user_permissions WHERE user_id=? AND module=?",
                (session['user_id'], module), one=True)
            if not p or not p['can_read']:
                return jsonify({'error': 'forbidden'}), 403
            if write and not p['can_write']:
                return jsonify({'error': 'forbidden', 'msg': '无写入权限'}), 403
            return f(*args, **kwargs)
        return decorated
    return decorator

def get_user_perms(user_id):
    u = query("SELECT is_admin FROM users WHERE id=?", (user_id,), one=True)
    if u and u['is_admin']:
        modules = ['express_in', 'purchase', 'match', 'claim', 'confirm', 'admin']
        return {m: {'read': 1, 'write': 1} for m in modules}
    rows = query(
        "SELECT module,can_read,can_write FROM user_permissions WHERE user_id=?", (user_id,))
    return {r['module']: {'read': r['can_read'], 'write': r['can_write']} for r in rows}

# ─── AUTH ─────────────────────────────────────────────────────────────────────
@app.route('/api/login', methods=['POST'])
def api_login():
    data = request.json
    u = query("SELECT * FROM users WHERE username=? AND is_active=1",
              (data.get('username', ''),), one=True)
    if not u or not check_password_hash(u['password_hash'], data.get('password', '')):
        return jsonify({'error': '用户名或密码错误'}), 401
    session.permanent = True
    session['user_id'] = u['id']
    session['username'] = u['username']
    session['display_name'] = u['display_name']
    session['is_admin'] = u['is_admin']
    log_action('auth', 'login')
    return jsonify({
        'ok': True,
        'display_name': u['display_name'],
        'is_admin': u['is_admin'],
        'perms': get_user_perms(u['id'])
    })

@app.route('/api/logout', methods=['POST'])
def api_logout():
    log_action('auth', 'logout')
    session.clear()
    return jsonify({'ok': True})

@app.route('/api/me')
@login_required
def api_me():
    return jsonify({
        'user_id': session['user_id'],
        'display_name': session['display_name'],
        'is_admin': session.get('is_admin', 0),
        'perms': get_user_perms(session['user_id'])
    })

# ─── USERS ────────────────────────────────────────────────────────────────────
@app.route('/api/users')
@login_required
def api_users():
    rows = query("SELECT id,username,display_name,is_admin,is_active FROM users ORDER BY id")
    return jsonify([dict(r) for r in rows])

@app.route('/api/users', methods=['POST'])
@login_required
@perm_required('admin', write=True)
def api_user_create():
    d = request.json
    if not d.get('username') or not d.get('password') or not d.get('display_name'):
        return jsonify({'error': '缺少必填字段'}), 400
    if query("SELECT id FROM users WHERE username=?", (d['username'],), one=True):
        return jsonify({'error': '用户名已存在'}), 400
    pw = generate_password_hash(d['password'])
    uid = execute(
        "INSERT INTO users(username,password_hash,display_name,is_admin) VALUES(?,?,?,?)",
        (d['username'], pw, d['display_name'], d.get('is_admin', 0)))
    modules = ['express_in', 'purchase', 'match', 'claim', 'confirm', 'admin']
    for m in modules:
        r = d.get('perms', {}).get(m, {})
        execute(
            "INSERT OR REPLACE INTO user_permissions(user_id,module,can_read,can_write) VALUES(?,?,?,?)",
            (uid, m, r.get('read', 0), r.get('write', 0)))
    log_action('admin', 'create_user', uid, d['username'])
    return jsonify({'ok': True, 'id': uid})

@app.route('/api/users/<int:uid>', methods=['PUT'])
@login_required
@perm_required('admin', write=True)
def api_user_update(uid):
    d = request.json
    if d.get('display_name'):
        execute(
            "UPDATE users SET display_name=?,is_admin=?,is_active=? WHERE id=?",
            (d['display_name'], d.get('is_admin', 0), d.get('is_active', 1), uid))
    if d.get('password'):
        execute("UPDATE users SET password_hash=? WHERE id=?",
                (generate_password_hash(d['password']), uid))
    if 'perms' in d:
        for m in ['express_in', 'purchase', 'match', 'claim', 'confirm', 'admin']:
            r = d['perms'].get(m, {})
            execute(
                "INSERT OR REPLACE INTO user_permissions(user_id,module,can_read,can_write) VALUES(?,?,?,?)",
                (uid, m, r.get('read', 0), r.get('write', 0)))
    log_action('admin', 'update_user', uid, str(d))
    return jsonify({'ok': True})

@app.route('/api/users/<int:uid>', methods=['DELETE'])
@login_required
@perm_required('admin', write=True)
def api_user_delete(uid):
    if uid == session['user_id']:
        return jsonify({'error': '不能删除自己'}), 400
    execute("UPDATE users SET is_active=0 WHERE id=?", (uid,))
    log_action('admin', 'delete_user', uid)
    return jsonify({'ok': True})

# ─── EXPRESS IN ───────────────────────────────────────────────────────────────
@app.route('/api/express')
@login_required
@perm_required('express_in')
def api_express_list():
    confirm_status = request.args.get('confirm_status', 'pending')
    sql = """SELECT e.*, u.display_name as creator_name
             FROM express_records e JOIN users u ON e.created_by=u.id
             WHERE 1=1"""
    args = []
    if confirm_status == 'pending':
        sql += """ AND NOT EXISTS(
            SELECT 1 FROM purchase_tracking pt
            JOIN claim_records cr ON cr.purchase_tracking_id=pt.id
            JOIN confirm_records cf ON cf.claim_id=cr.id
            WHERE pt.tracking_no=e.tracking_no AND cf.status='confirmed')"""
    elif confirm_status == 'confirmed':
        sql += """ AND EXISTS(
            SELECT 1 FROM purchase_tracking pt
            JOIN claim_records cr ON cr.purchase_tracking_id=pt.id
            JOIN confirm_records cf ON cf.claim_id=cr.id
            WHERE pt.tracking_no=e.tracking_no AND cf.status='confirmed')"""
    sql += " ORDER BY e.arrive_date DESC, e.id DESC"
    return jsonify([dict(r) for r in query(sql, args)])

@app.route('/api/express', methods=['POST'])
@login_required
@perm_required('express_in', write=True)
def api_express_create():
    d = request.json
    if query("SELECT id FROM express_records WHERE tracking_no=?", (d.get('tracking_no', ''),), one=True):
        return jsonify({'error': '该快递单号已经存在'}), 400
    eid = execute(
        "INSERT INTO express_records(tracking_no,ship_date,arrive_date,goods_desc,created_by) VALUES(?,?,?,?,?)",
        (d['tracking_no'], d['ship_date'], d['arrive_date'], d['goods_desc'], session['user_id']))
    log_action('express_in', 'create', eid, d['tracking_no'])
    return jsonify({'ok': True, 'id': eid})

@app.route('/api/express/check/<tracking_no>')
@login_required
def api_express_check(tracking_no):
    e = query("SELECT id FROM express_records WHERE tracking_no=?", (tracking_no,), one=True)
    return jsonify({'exists': bool(e)})

@app.route('/api/express/<int:eid>', methods=['DELETE'])
@login_required
@perm_required('express_in', write=True)
def api_express_delete(eid):
    row = query("SELECT tracking_no FROM express_records WHERE id=?", (eid,), one=True)
    if not row:
        return jsonify({'error': '记录不存在'}), 404
    execute("DELETE FROM express_records WHERE id=?", (eid,))
    log_action('express_in', 'delete', eid, row['tracking_no'])
    return jsonify({'ok': True})

# ─── PURCHASE ─────────────────────────────────────────────────────────────────
@app.route('/api/purchase')
@login_required
@perm_required('purchase')
def api_purchase_list():
    buyer          = request.args.get('buyer', '')
    has_tracking   = request.args.get('has_tracking', '')
    confirm_status = request.args.get('confirm_status', '')
    search         = request.args.get('search', '').strip()
    sql = """SELECT p.*, u.display_name as creator_name, r.display_name as receiver_name
             FROM purchase_records p
             LEFT JOIN users u ON p.created_by=u.id
             LEFT JOIN users r ON p.receiver_id=r.id
             WHERE 1=1"""
    args = []
    if buyer:
        sql += " AND p.created_by=?"; args.append(buyer)
    if has_tracking == 'yes':
        sql += """ AND EXISTS(SELECT 1 FROM purchase_tracking pt
                              WHERE pt.purchase_id=p.id AND pt.tracking_no IS NOT NULL AND pt.tracking_no!='')"""
    elif has_tracking == 'no':
        sql += """ AND NOT EXISTS(SELECT 1 FROM purchase_tracking pt
                                  WHERE pt.purchase_id=p.id AND pt.tracking_no IS NOT NULL AND pt.tracking_no!='')"""
    if confirm_status == 'confirmed':
        sql += """ AND EXISTS(
            SELECT 1 FROM purchase_tracking pt2
            JOIN claim_records cr ON cr.purchase_tracking_id=pt2.id
            JOIN confirm_records cf ON cf.claim_id=cr.id
            WHERE pt2.purchase_id=p.id AND cf.status='confirmed')"""
    elif confirm_status == 'pending':
        sql += """ AND NOT EXISTS(
            SELECT 1 FROM purchase_tracking pt2
            JOIN claim_records cr ON cr.purchase_tracking_id=pt2.id
            JOIN confirm_records cf ON cf.claim_id=cr.id
            WHERE pt2.purchase_id=p.id AND cf.status='confirmed')"""
    if search:
        sql += """ AND (p.goods_name LIKE ? OR p.express_company LIKE ? OR r.display_name LIKE ?
                        OR EXISTS(SELECT 1 FROM purchase_tracking pts
                                  WHERE pts.purchase_id=p.id AND pts.tracking_no LIKE ?))"""
        like = f'%{search}%'
        args += [like, like, like, like]
    sql += " ORDER BY p.purchase_date DESC, p.id DESC"
    rows = query(sql, args)
    result = []
    for r in rows:
        rec = dict(r)
        trackings = query("SELECT * FROM purchase_tracking WHERE purchase_id=?", (r['id'],))
        rec['trackings'] = [dict(t) for t in trackings]
        result.append(rec)
    return jsonify(result)

@app.route('/api/purchase', methods=['POST'])
@login_required
@perm_required('purchase', write=True)
def api_purchase_create():
    d = request.json
    trackings = d.get('trackings', [])
    for t in trackings:
        tn = t.get('tracking_no', '').strip()
        if tn and query("SELECT id FROM purchase_tracking WHERE tracking_no=?", (tn,), one=True):
            return jsonify({'error': f'该快递单号已经存在：{tn}'}), 400
    pid = execute(
        "INSERT INTO purchase_records(purchase_date,goods_name,express_company,receiver_id,created_by) VALUES(?,?,?,?,?)",
        (d['purchase_date'], d['goods_name'], d.get('express_company'), d.get('receiver_id'), session['user_id']))
    for t in trackings:
        tn = t.get('tracking_no', '').strip() or None
        execute("INSERT INTO purchase_tracking(purchase_id,tracking_no) VALUES(?,?)", (pid, tn))
    if not trackings:
        execute("INSERT INTO purchase_tracking(purchase_id,tracking_no) VALUES(?,NULL)", (pid,))
    log_action('purchase', 'create', pid, d['goods_name'])
    return jsonify({'ok': True, 'id': pid})

@app.route('/api/purchase/check/<tracking_no>')
@login_required
def api_purchase_check(tracking_no):
    p = query("SELECT id FROM purchase_tracking WHERE tracking_no=?", (tracking_no,), one=True)
    return jsonify({'exists': bool(p)})

@app.route('/api/purchase/<int:pid>/tracking', methods=['POST'])
@login_required
@perm_required('purchase', write=True)
def api_purchase_add_tracking(pid):
    d = request.json
    tn = d.get('tracking_no', '').strip()
    if not tn:
        return jsonify({'error': '请输入快递单号'}), 400
    if query("SELECT id FROM purchase_tracking WHERE tracking_no=?", (tn,), one=True):
        return jsonify({'error': '该快递单号已经存在'}), 400
    empty = query(
        "SELECT id FROM purchase_tracking WHERE purchase_id=? AND (tracking_no IS NULL OR tracking_no='')",
        (pid,), one=True)
    if empty:
        execute("UPDATE purchase_tracking SET tracking_no=? WHERE id=?", (tn, empty['id']))
        tid = empty['id']
    else:
        tid = execute("INSERT INTO purchase_tracking(purchase_id,tracking_no) VALUES(?,?)", (pid, tn))
    log_action('purchase', 'add_tracking', tid, tn)
    return jsonify({'ok': True})

@app.route('/api/purchase/bulk', methods=['POST'])
@login_required
@perm_required('purchase', write=True)
def api_purchase_bulk():
    lines  = request.json.get('lines', [])
    total, success, errors = len(lines), 0, []
    for i, line in enumerate(lines):
        parts = [p.strip() for p in line.split(',')]
        if len(parts) < 3:
            errors.append(f'第{i+1}行格式错误'); continue
        created_at_str  = parts[0]
        purchase_date   = parts[1]
        goods_name      = parts[2]
        express_company = parts[3] if len(parts) > 3 else ''
        tracking_str    = parts[4] if len(parts) > 4 else ''
        receiver_name   = parts[5] if len(parts) > 5 else ''
        if not purchase_date or not goods_name:
            errors.append(f'第{i+1}行缺少购买日期或货品名称'); continue
        receiver_id = None
        if receiver_name:
            ru = query("SELECT id FROM users WHERE display_name=?", (receiver_name.strip(),), one=True)
            if ru: receiver_id = ru['id']
        tracking_nos = [t.strip() for t in tracking_str.replace('；', ';').split(';') if t.strip()]
        dup = False
        for tn in tracking_nos:
            if query("SELECT id FROM purchase_tracking WHERE tracking_no=?", (tn,), one=True):
                errors.append(f'第{i+1}行快递单号已存在：{tn}'); dup = True; break
        if dup: continue
        pid = execute(
            "INSERT INTO purchase_records(purchase_date,goods_name,express_company,receiver_id,created_by,created_at) VALUES(?,?,?,?,?,?)",
            (purchase_date, goods_name, express_company or None, receiver_id, session['user_id'],
             created_at_str or datetime.now().strftime('%Y-%m-%d %H:%M:%S')))
        if tracking_nos:
            for tn in tracking_nos:
                execute("INSERT INTO purchase_tracking(purchase_id,tracking_no) VALUES(?,?)", (pid, tn))
        else:
            execute("INSERT INTO purchase_tracking(purchase_id,tracking_no) VALUES(?,NULL)", (pid,))
        success += 1
    log_action('purchase', 'bulk_import', None, f'total={total},success={success}')
    return jsonify({'total': total, 'success': success, 'errors': errors})

@app.route('/api/purchase/<int:pid>', methods=['DELETE'])
@login_required
@perm_required('purchase', write=True)
def api_purchase_delete(pid):
    row = query("SELECT goods_name FROM purchase_records WHERE id=?", (pid,), one=True)
    if not row: return jsonify({'error': '记录不存在'}), 404
    execute("DELETE FROM purchase_tracking WHERE purchase_id=?", (pid,))
    execute("DELETE FROM purchase_records WHERE id=?", (pid,))
    log_action('purchase', 'delete', pid, row['goods_name'])
    return jsonify({'ok': True})

# ─── MATCH ────────────────────────────────────────────────────────────────────
@app.route('/api/match')
@login_required
@perm_required('match')
def api_match():
    # 已匹配：新增 er.goods_desc as 收货登记名称，receiver_name as 指定收货人
    matched = query("""
        SELECT pt.tracking_no,
               pr.purchase_date, pr.goods_name,
               er.arrive_date, er.goods_desc as reg_goods_name,
               u_reg.display_name as registrar,
               u_recv.display_name as receiver_name
        FROM purchase_tracking pt
        JOIN purchase_records pr ON pt.purchase_id=pr.id
        JOIN express_records er ON pt.tracking_no=er.tracking_no
        LEFT JOIN users u_reg  ON er.created_by=u_reg.id
        LEFT JOIN users u_recv ON pr.receiver_id=u_recv.id
        WHERE pt.tracking_no IS NOT NULL AND pt.tracking_no!=''
        ORDER BY er.arrive_date DESC
    """)
    unmatched_purchase = query("""
        SELECT pr.purchase_date, pr.goods_name, pt.tracking_no, pt.id as pt_id
        FROM purchase_tracking pt
        JOIN purchase_records pr ON pt.purchase_id=pr.id
        WHERE (pt.tracking_no IS NULL OR pt.tracking_no=''
               OR NOT EXISTS(SELECT 1 FROM express_records er WHERE er.tracking_no=pt.tracking_no))
        ORDER BY pr.purchase_date DESC
    """)
    unmatched_express = query("""
        SELECT er.tracking_no, er.arrive_date, er.goods_desc, u.display_name as registrar
        FROM express_records er
        LEFT JOIN users u ON er.created_by=u.id
        WHERE NOT EXISTS(SELECT 1 FROM purchase_tracking pt WHERE pt.tracking_no=er.tracking_no)
        ORDER BY er.arrive_date DESC
    """)
    return jsonify({
        'matched':            [dict(r) for r in matched],
        'unmatched_purchase': [dict(r) for r in unmatched_purchase],
        'unmatched_express':  [dict(r) for r in unmatched_express],
    })

# ─── CLAIM ────────────────────────────────────────────────────────────────────
@app.route('/api/claim/available')
@login_required
@perm_required('claim')
def api_claim_available():
    rows = query("""
        SELECT pt.id as pt_id, pt.tracking_no, pr.id as purchase_id,
               pr.purchase_date, er.arrive_date, pr.goods_name
        FROM purchase_tracking pt
        JOIN purchase_records pr ON pt.purchase_id=pr.id
        JOIN express_records er ON pt.tracking_no=er.tracking_no
        WHERE pr.receiver_id=?
          AND pt.tracking_no IS NOT NULL AND pt.tracking_no!=''
          AND NOT EXISTS(SELECT 1 FROM claim_records cr WHERE cr.purchase_tracking_id=pt.id)
        ORDER BY er.arrive_date DESC
    """, (session['user_id'],))
    return jsonify([dict(r) for r in rows])

@app.route('/api/claim', methods=['POST'])
@login_required
@perm_required('claim', write=True)
def api_claim_create():
    d = request.json
    cid = execute(
        "INSERT INTO claim_records(purchase_tracking_id,purchase_id,claimed_by,claim_date,goods_spec,quantity) VALUES(?,?,?,?,?,?)",
        (d['purchase_tracking_id'], d['purchase_id'], session['user_id'],
         d['claim_date'], d['goods_spec'], d['quantity']))
    execute("INSERT INTO confirm_records(claim_id,status) VALUES(?,?)", (cid, 'pending'))
    log_action('claim', 'create', cid)
    return jsonify({'ok': True, 'id': cid})

# ─── CONFIRM ──────────────────────────────────────────────────────────────────
@app.route('/api/confirm')
@login_required
@perm_required('confirm')
def api_confirm_list():
    status = request.args.get('status', 'pending')
    rows = query("""
        SELECT cf.id, cf.status, cf.confirmed_at,
               cu.display_name as confirmed_by_name,
               cr.claim_date, cr.goods_spec, cr.quantity,
               pt.tracking_no,
               pr.goods_name, pr.purchase_date,
               ru.display_name as receiver_name
        FROM confirm_records cf
        JOIN claim_records cr ON cf.claim_id=cr.id
        JOIN purchase_tracking pt ON cr.purchase_tracking_id=pt.id
        JOIN purchase_records pr ON cr.purchase_id=pr.id
        LEFT JOIN users ru ON pr.receiver_id=ru.id
        LEFT JOIN users cu ON cf.confirmed_by=cu.id
        WHERE cf.status=?
        ORDER BY cr.claim_date DESC
    """, (status,))
    return jsonify([dict(r) for r in rows])

@app.route('/api/confirm/<int:cid>', methods=['PUT'])
@login_required
@perm_required('confirm', write=True)
def api_confirm_update(cid):
    execute(
        "UPDATE confirm_records SET status='confirmed',confirmed_by=?,confirmed_at=? WHERE id=?",
        (session['user_id'], datetime.now().strftime('%Y-%m-%d %H:%M:%S'), cid))
    log_action('confirm', 'confirm', cid)
    return jsonify({'ok': True})

# ─── LOGS ─────────────────────────────────────────────────────────────────────
@app.route('/api/logs')
@login_required
@perm_required('admin')
def api_logs():
    rows = query("""SELECT l.*, u.display_name FROM audit_logs l
                    LEFT JOIN users u ON l.user_id=u.id
                    ORDER BY l.id DESC LIMIT 500""")
    return jsonify([dict(r) for r in rows])

# ─── MAIN ─────────────────────────────────────────────────────────────────────
if __name__ == '__main__':
    init_db()
    app.run(host='0.0.0.0', port=5050, debug=False)
