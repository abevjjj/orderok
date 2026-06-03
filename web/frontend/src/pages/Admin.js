import { api } from '../utils/api.js'
import { esc, fmtDate, showAlert, openModal, closeModal } from '../utils/ui.js'
import { state } from '../utils/state.js'

const MODULES = ['express_in', 'purchase', 'match', 'claim', 'confirm', 'admin']
const MODULE_LABELS = {
  express_in: '收快递', purchase: '购物记录', match: '匹配报表',
  claim: '货物认领', confirm: '订单确认', admin: '管理员'
}

let editingUid = null

export function renderAdmin(container) {
  container.innerHTML = `
    <div class="tabs">
      <div class="tab active" data-tab="users">用户管理</div>
      <div class="tab" data-tab="logs">操作日志</div>
    </div>
    <div id="admin-users"></div>
    <div id="admin-logs" style="display:none"></div>

    <!-- MODAL: 新增/编辑用户 -->
    <div class="modal-overlay" id="modal-user">
      <div class="modal">
        <div class="modal-handle"></div>
        <div class="modal-title" id="um-title">新增用户</div>
        <input type="hidden" id="um-id">
        <div class="form-group">
          <label class="form-label">用户名 <span class="req">*</span></label>
          <input class="form-input" id="um-username" placeholder="登录用户名">
        </div>
        <div class="form-group">
          <label class="form-label">显示名称 <span class="req">*</span></label>
          <input class="form-input" id="um-display" placeholder="中文姓名">
        </div>
        <div class="form-group">
          <label class="form-label">密码 <span id="um-pw-hint" class="text-xs text-muted"></span></label>
          <input class="form-input" id="um-password" type="password" placeholder="请输入密码">
        </div>
        <div class="form-group">
          <label class="form-label flex items-center gap-8">
            <input type="checkbox" id="um-admin"> 管理员权限
          </label>
        </div>
        <div class="form-group">
          <label class="form-label">模块权限</label>
          <div class="perm-grid" id="um-perms"></div>
        </div>
        <div id="um-alert"></div>
        <div class="flex gap-8 mt-12">
          <button class="btn btn-ghost w-full" id="um-cancel">取消</button>
          <button class="btn btn-primary w-full" id="um-save">保存</button>
        </div>
      </div>
    </div>
  `

  // tab switch
  container.querySelectorAll('.tab[data-tab]').forEach(t => {
    t.addEventListener('click', () => {
      container.querySelectorAll('.tab[data-tab]').forEach(x => x.classList.remove('active'))
      t.classList.add('active')
      document.getElementById('admin-users').style.display = t.dataset.tab === 'users' ? '' : 'none'
      document.getElementById('admin-logs').style.display  = t.dataset.tab === 'logs'  ? '' : 'none'
      if (t.dataset.tab === 'logs') loadLogs()
    })
  })

  document.getElementById('um-cancel').addEventListener('click', () => closeModal('modal-user'))
  document.getElementById('um-save').addEventListener('click', saveUser)

  loadUsers()
}

async function loadUsers() {
  const { data } = await api.users()
  state.users = data
  const wrap = document.getElementById('admin-users')
  if (!wrap) return

  wrap.innerHTML = `
    <button class="btn btn-primary mb-8" id="btn-new-user">＋ 新增用户</button>
    ${data.map(u => `
      <div class="card mb-8" style="margin-bottom:10px">
        <div class="card-body" style="padding:12px">
          <div class="flex justify-between items-center">
            <div>
              <span style="font-weight:600">${esc(u.display_name)}</span>
              <span class="text-xs text-muted"> @${esc(u.username)}</span>
              ${u.is_admin ? '<span class="badge badge-purple" style="margin-left:4px">管理员</span>' : ''}
              ${!u.is_active ? '<span class="badge badge-red">已禁用</span>' : ''}
            </div>
            <div class="flex gap-8">
              <button class="btn btn-ghost btn-xs" data-edit="${u.id}">编辑</button>
              ${u.id !== state.me?.user_id
                ? `<button class="btn btn-danger btn-xs" data-disable="${u.id}">禁用</button>`
                : ''}
            </div>
          </div>
        </div>
      </div>
    `).join('')}
  `

  document.getElementById('btn-new-user').addEventListener('click', () => openUserModal(null))
  wrap.querySelectorAll('[data-edit]').forEach(b => b.addEventListener('click', () => openUserModal(Number(b.dataset.edit))))
  wrap.querySelectorAll('[data-disable]').forEach(b => b.addEventListener('click', async () => {
    if (!confirm('确认禁用该用户？')) return
    await api.userDelete(b.dataset.disable)
    loadUsers()
  }))
}

function buildPermGrid(existingPerms = {}) {
  return MODULES.map(m => `
    <div class="perm-item">
      <div class="perm-name">${MODULE_LABELS[m]}</div>
      <label><input type="checkbox" id="pm-r-${m}" ${existingPerms[m]?.read ? 'checked' : ''}> 查看</label>
      <label><input type="checkbox" id="pm-w-${m}" ${existingPerms[m]?.write ? 'checked' : ''}> 操作</label>
    </div>
  `).join('')
}

function openUserModal(uid) {
  editingUid = uid
  document.getElementById('um-title').textContent   = uid ? '编辑用户' : '新增用户'
  document.getElementById('um-pw-hint').textContent = uid ? '（留空则不修改）' : ''
  document.getElementById('um-id').value       = uid || ''
  document.getElementById('um-username').value = ''
  document.getElementById('um-password').value = ''
  document.getElementById('um-display').value  = ''
  document.getElementById('um-admin').checked  = false
  document.getElementById('um-alert').innerHTML = ''

  if (uid) {
    const u = state.users.find(x => x.id === uid)
    if (u) {
      document.getElementById('um-username').value = u.username
      document.getElementById('um-display').value  = u.display_name
      document.getElementById('um-admin').checked  = !!u.is_admin
    }
  }
  document.getElementById('um-perms').innerHTML = buildPermGrid()
  openModal('modal-user')
}

async function saveUser() {
  const uid     = document.getElementById('um-id').value
  const username = document.getElementById('um-username').value.trim()
  const display  = document.getElementById('um-display').value.trim()
  const password = document.getElementById('um-password').value
  const isAdmin  = document.getElementById('um-admin').checked ? 1 : 0
  if (!display) { showAlert('um-alert', '请填写显示名称'); return }
  if (!uid && (!username || !password)) { showAlert('um-alert', '新增用户需填写用户名和密码'); return }

  const perms = {}
  MODULES.forEach(m => {
    perms[m] = {
      read:  document.getElementById(`pm-r-${m}`)?.checked ? 1 : 0,
      write: document.getElementById(`pm-w-${m}`)?.checked ? 1 : 0,
    }
  })
  const body = { display_name: display, is_admin: isAdmin, is_active: 1, perms }
  if (password) body.password = password

  let res
  if (uid) {
    res = await api.userUpdate(uid, body)
  } else {
    body.username = username
    res = await api.userCreate(body)
  }
  if (res.ok) { closeModal('modal-user'); loadUsers() }
  else showAlert('um-alert', res.data.error || '操作失败')
}

async function loadLogs() {
  const { data } = await api.logs()
  const wrap = document.getElementById('admin-logs')
  if (!wrap) return
  wrap.innerHTML = `
    <div class="table-wrap">
      <table>
        <thead><tr><th>时间</th><th>用户</th><th>模块</th><th>操作</th><th>详情</th></tr></thead>
        <tbody>
          ${data.map(r => `<tr>
            <td style="white-space:nowrap;font-size:12px">${fmtDate(r.created_at)}</td>
            <td>${esc(r.display_name || '-')}</td>
            <td>${esc(r.module)}</td>
            <td>${esc(r.action)}</td>
            <td style="max-width:120px;font-size:12px">${esc(r.detail || '')}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
  `
}
