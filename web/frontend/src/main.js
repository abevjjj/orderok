import './style.css'
import { api } from './utils/api.js'
import { stopQR } from './utils/ui.js'
import { state, canRead } from './utils/state.js'
import { renderExpressIn } from './pages/ExpressIn.js'
import { renderPurchase }  from './pages/Purchase.js'
import { renderMatch }     from './pages/Match.js'
import { renderClaim }     from './pages/Claim.js'
import { renderConfirm }   from './pages/Confirm.js'
import { renderAdmin }     from './pages/Admin.js'

// ── Module config ──────────────────────────────────────────────────────────
const MODULES = [
  { id: 'express_in', label: '收快递',   icon: '📥', render: renderExpressIn },
  { id: 'purchase',   label: '购物记录', icon: '🛒', render: renderPurchase  },
  { id: 'match',      label: '匹配报表', icon: '🔗', render: renderMatch     },
  { id: 'claim',      label: '货物认领', icon: '🎁', render: renderClaim     },
  { id: 'confirm',    label: '订单确认', icon: '✅', render: renderConfirm   },
  { id: 'admin',      label: '管理员',   icon: '⚙️', render: renderAdmin     },
]

let currentModule = null

// ── App shell HTML ─────────────────────────────────────────────────────────
function buildShell() {
  document.getElementById('app').innerHTML = `
    <!-- TOPBAR -->
    <div class="topbar">
      <span style="font-size:22px">📦</span>
      <span class="topbar-title">快递管理系统</span>
      <span class="topbar-user" id="top-user"></span>
      <button class="logout-btn" id="btn-logout">退出</button>
    </div>

    <!-- QR OVERLAY -->
    <div id="qr-overlay">
      <div id="qr-video-wrap">
        <video id="qr-video" playsinline muted></video>
        <div class="qr-frame"><div class="qr-line"></div></div>
      </div>
      <div class="qr-close">
        <button class="qr-cancel" id="qr-cancel-btn">取消扫码</button>
      </div>
    </div>

    <!-- CONTENT -->
    <div class="content" id="content"></div>

    <!-- BOTTOM NAV -->
    <nav class="nav" id="main-nav"></nav>
  `

  document.getElementById('btn-logout').addEventListener('click', async () => {
    await api.logout()
    renderLogin()
  })
  document.getElementById('qr-cancel-btn').addEventListener('click', stopQR)
}

// ── Navigation ─────────────────────────────────────────────────────────────
function buildNav() {
  const nav = document.getElementById('main-nav')
  nav.innerHTML = ''

  const visible = MODULES.filter(m => canRead(m.id))

  visible.forEach(m => {
    const btn = document.createElement('button')
    btn.className = 'nav-item'
    btn.id = `nav-${m.id}`
    btn.innerHTML = `<span class="icon">${m.icon}</span><span class="label">${m.label}</span>`
    btn.addEventListener('click', () => switchTo(m.id))
    nav.appendChild(btn)
  })

  // activate first
  if (visible.length) switchTo(visible[0].id)
}

async function switchTo(moduleId) {
  if (currentModule === moduleId) return
  currentModule = moduleId

  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'))
  document.getElementById(`nav-${moduleId}`)?.classList.add('active')

  const content = document.getElementById('content')
  content.innerHTML = ''

  // ensure users cache is warm for pages that need it
  if (!state.users.length) {
    const { data } = await api.users()
    state.users = data
  }

  const mod = MODULES.find(m => m.id === moduleId)
  if (mod) mod.render(content)
}

// ── Login page ─────────────────────────────────────────────────────────────
function renderLogin() {
  document.getElementById('app').innerHTML = `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;
                background:linear-gradient(135deg,#1a1a2e,#16213e,#0f3460)">
      <div style="background:rgba(255,255,255,.07);backdrop-filter:blur(20px);
                  border:1px solid rgba(255,255,255,.15);border-radius:20px;
                  padding:40px 32px;width:100%;max-width:360px">
        <div style="text-align:center;margin-bottom:32px">
          <span style="font-size:48px;display:block;margin-bottom:8px">📦</span>
          <h1 style="color:#fff;font-size:20px;font-weight:600;margin-bottom:4px">快递管理系统</h1>
          <p style="color:rgba(255,255,255,.5);font-size:13px">公司内部快递收发管理</p>
        </div>
        <label style="display:block;color:rgba(255,255,255,.7);font-size:13px;margin-bottom:6px">用户名</label>
        <input id="l-user" type="text" class="form-input" placeholder="请输入用户名" autocomplete="username"
               style="margin-bottom:16px">
        <label style="display:block;color:rgba(255,255,255,.7);font-size:13px;margin-bottom:6px">密码</label>
        <input id="l-pass" type="password" class="form-input" placeholder="请输入密码" autocomplete="current-password">
        <div id="l-err" style="display:none;margin-top:12px;padding:10px 14px;
             background:rgba(255,80,80,.15);border:1px solid rgba(255,80,80,.3);
             border-radius:8px;color:#ff8080;font-size:13px;text-align:center"></div>
        <button id="l-btn" style="width:100%;margin-top:24px;padding:14px;
                background:linear-gradient(135deg,#4f8ef7,#7b5ea7);border:none;
                border-radius:12px;color:#fff;font-size:16px;font-weight:600;cursor:pointer">
          登 录
        </button>
      </div>
    </div>
  `

  const doLogin = async () => {
    const btn  = document.getElementById('l-btn')
    const err  = document.getElementById('l-err')
    btn.disabled = true; btn.textContent = '登录中…'; err.style.display = 'none'
    const { ok, data } = await api.login(
      document.getElementById('l-user').value.trim(),
      document.getElementById('l-pass').value
    )
    if (ok) {
      state.me = { ...data, user_id: data.user_id ?? null }
      // me endpoint gives user_id; login returns display_name + perms
      const meRes = await api.me()
      state.me = meRes.data
      buildShell()
      buildNav()
    } else {
      err.textContent = data.error || '登录失败'
      err.style.display = 'block'
      btn.disabled = false; btn.textContent = '登 录'
    }
  }

  document.getElementById('l-btn').addEventListener('click', doLogin)
  document.getElementById('l-pass').addEventListener('keydown', e => { if (e.key === 'Enter') doLogin() })
}

// ── Bootstrap ──────────────────────────────────────────────────────────────
async function boot() {
  const { ok, data } = await api.me()
  if (ok) {
    state.me = data
    document.getElementById('app').innerHTML = ''
    buildShell()
    document.getElementById('top-user').textContent = state.me.display_name
    buildNav()
  } else {
    renderLogin()
  }
}

boot()
