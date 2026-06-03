import { api } from '../utils/api.js'
import { esc, fmtDate, today, showAlert, openModal, closeModal, debounce, pasteToField, startQR } from '../utils/ui.js'
import { state, canWrite } from '../utils/state.js'

let trCount = 0

export function renderPurchase(container) {
  container.innerHTML = `
    <!-- ADD FORM -->
    <div class="card">
      <div class="card-header">🛒 新增购物记录</div>
      <div class="card-body">
        <div id="pu-alert"></div>
        <div class="form-group">
          <label class="form-label">购买日期 <span class="req">*</span></label>
          <input class="form-input" id="pu-date" type="date" value="${today()}">
        </div>
        <div class="form-group">
          <label class="form-label">货品名称 <span class="req">*</span></label>
          <div class="input-row">
            <input class="form-input" id="pu-goods" placeholder="请输入货品名称">
            <button class="paste-btn" id="pu-goods-paste">📋</button>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">快递公司</label>
          <input class="form-input" id="pu-company" placeholder="选填">
        </div>
        <div class="form-group">
          <label class="form-label">快递单号（可多条）</label>
          <div id="pu-trackings"></div>
          <button class="btn btn-ghost btn-sm mt-8" id="pu-add-tracking">＋ 添加快递单号</button>
        </div>
        <div class="form-group">
          <label class="form-label">指定收货人 <span class="req">*</span></label>
          <select class="form-select" id="pu-receiver">
            <option value="">请选择收货人</option>
          </select>
        </div>
        <button class="btn btn-primary mt-12" id="pu-submit">✅ 保存购物记录</button>
      </div>
    </div>

    <!-- LIST -->
    <div class="card">
      <div class="card-header">📋 购物记录</div>
      <div class="card-body" style="padding:12px 16px 8px">
        <div class="filter-bar">
          <input class="form-input" id="pu-search" placeholder="🔍 全字段搜索…" style="flex:1 1 100%">
          <select class="form-select" id="pu-buyer">
            <option value="">全部购买人</option>
          </select>
          <select class="form-select" id="pu-has-tracking">
            <option value="">快递单号状态</option>
            <option value="yes">已有单号</option>
            <option value="no">未填单号</option>
          </select>
          <select class="form-select" id="pu-confirm">
            <option value="">确认状态</option>
            <option value="pending">未确认完成</option>
            <option value="confirmed">已确认完成</option>
          </select>
        </div>
      </div>
      <div id="pu-list" style="padding:0"></div>
    </div>

    <!-- BULK IMPORT -->
    <div class="card">
      <div class="card-header">📥 批量导入购物记录</div>
      <div class="card-body">
        <div id="bulk-alert"></div>
        <p class="text-sm text-muted mb-8">
          每行一条，字段用英文逗号分隔：<br>
          <code style="font-size:12px;color:var(--orange)">录入日期,购买日期,货品名称,快递公司,快递单号(多个用;),收货人</code>
        </p>
        <textarea class="form-textarea" id="bulk-text" rows="6"
          placeholder="粘贴数据到这里…" style="font-family:monospace;font-size:13px"></textarea>
        <button class="btn btn-primary mt-8" id="bulk-submit">📥 批量导入</button>
      </div>
    </div>

    <!-- MODAL: 补充快递单号 -->
    <div class="modal-overlay" id="modal-add-tracking">
      <div class="modal">
        <div class="modal-handle"></div>
        <div class="modal-title">📝 补充快递单号</div>
        <input type="hidden" id="at-pid">
        <div class="form-group">
          <label class="form-label">快递单号 <span class="req">*</span></label>
          <div class="input-row">
            <input class="form-input" id="at-tracking" placeholder="扫码或手动输入">
            <button class="paste-btn" id="at-paste">📋</button>
            <button class="paste-btn" id="at-qr">📷</button>
          </div>
          <div class="dup-warn" id="at-dup">⚠️ 该快递单号已经存在</div>
        </div>
        <div id="at-alert"></div>
        <div class="flex gap-8 mt-12">
          <button class="btn btn-ghost w-full" id="at-cancel">取消</button>
          <button class="btn btn-primary w-full" id="at-confirm">保存</button>
        </div>
      </div>
    </div>
  `

  // populate receiver select
  populateReceivers()

  // form events
  document.getElementById('pu-goods-paste').addEventListener('click', () => pasteToField('pu-goods'))
  document.getElementById('pu-add-tracking').addEventListener('click', () => addTrackingRow())
  document.getElementById('pu-submit').addEventListener('click', submitPurchase)
  addTrackingRow()  // initial empty row

  // filter / search
  const doSearch = debounce(loadPurchases)
  document.getElementById('pu-search').addEventListener('input', doSearch)
  document.getElementById('pu-buyer').addEventListener('change', loadPurchases)
  document.getElementById('pu-has-tracking').addEventListener('change', loadPurchases)
  document.getElementById('pu-confirm').addEventListener('change', loadPurchases)

  // bulk import
  document.getElementById('bulk-submit').addEventListener('click', bulkImport)

  // add-tracking modal
  document.getElementById('at-cancel').addEventListener('click', () => closeModal('modal-add-tracking'))
  document.getElementById('at-paste').addEventListener('click', () => pasteToField('at-tracking'))
  document.getElementById('at-qr').addEventListener('click', () => startQR(v => {
    document.getElementById('at-tracking').value = v
    checkAtDup(v)
  }))
  document.getElementById('at-tracking').addEventListener('input', e => checkAtDup(e.target.value))
  document.getElementById('at-confirm').addEventListener('click', submitAddTracking)

  // populate buyer filter
  const buyerSel = document.getElementById('pu-buyer')
  state.users.filter(u => u.is_active).forEach(u => {
    const opt = document.createElement('option')
    opt.value = u.id; opt.textContent = u.display_name
    buyerSel.appendChild(opt)
  })

  loadPurchases()
}

// ── receiver select ──────────────────────────────────────────────────────────
function populateReceivers() {
  const sel = document.getElementById('pu-receiver')
  if (!sel) return
  state.users.filter(u => u.is_active).forEach(u => {
    const opt = document.createElement('option')
    opt.value = u.id; opt.textContent = u.display_name
    sel.appendChild(opt)
  })
}

// ── tracking rows ────────────────────────────────────────────────────────────
function addTrackingRow(val = '') {
  trCount++
  const idx = trCount
  const wrap = document.getElementById('pu-trackings')
  const row = document.createElement('div')
  row.className = 'tracking-row'
  row.id = `tr-row-${idx}`
  row.innerHTML = `
    <input class="form-input" id="tr-${idx}" placeholder="快递单号（选填）" value="${esc(val)}">
    <button class="paste-btn" title="粘贴" data-paste="tr-${idx}">📋</button>
    <button class="paste-btn" title="扫码" data-qr="tr-${idx}">📷</button>
    <button class="rm-btn" data-rm="${idx}">×</button>
    <div class="dup-warn" id="tr-warn-${idx}">⚠️ 该快递单号已经存在</div>
  `
  wrap.appendChild(row)

  row.querySelector(`[data-paste]`).addEventListener('click', () => pasteToField(`tr-${idx}`))
  row.querySelector(`[data-qr]`).addEventListener('click', () => startQR(v => {
    document.getElementById(`tr-${idx}`).value = v
    checkTrDup(idx)
  }))
  row.querySelector(`[data-rm]`).addEventListener('click', () => row.remove())
  document.getElementById(`tr-${idx}`).addEventListener('input', () => checkTrDup(idx))
}

async function checkTrDup(idx) {
  const inp = document.getElementById(`tr-${idx}`)
  const warn = document.getElementById(`tr-warn-${idx}`)
  if (!inp || !warn) return
  if (!inp.value.trim()) { warn.style.display = 'none'; return }
  const { data } = await api.purchaseCheck(inp.value.trim())
  warn.style.display = data.exists ? 'block' : 'none'
}

// ── submit purchase ──────────────────────────────────────────────────────────
async function submitPurchase() {
  const date     = document.getElementById('pu-date').value
  const goods    = document.getElementById('pu-goods').value.trim()
  const company  = document.getElementById('pu-company').value.trim()
  const receiver = document.getElementById('pu-receiver').value
  if (!date || !goods || !receiver) {
    showAlert('pu-alert', '请填写购买日期、货品名称和指定收货人'); return
  }
  const trackings = []
  document.querySelectorAll('#pu-trackings .tracking-row .form-input').forEach(inp => {
    trackings.push({ tracking_no: inp.value.trim() })
  })
  const { ok, data } = await api.purchaseCreate({
    purchase_date: date, goods_name: goods, express_company: company,
    receiver_id: receiver, trackings
  })
  if (ok) {
    showAlert('pu-alert', '保存成功 ✅', 'ok')
    document.getElementById('pu-goods').value = ''
    document.getElementById('pu-company').value = ''
    document.getElementById('pu-receiver').value = ''
    document.getElementById('pu-trackings').innerHTML = ''
    trCount = 0
    addTrackingRow()
    loadPurchases()
  } else {
    showAlert('pu-alert', data.error || '保存失败')
  }
}

// ── load list ────────────────────────────────────────────────────────────────
async function loadPurchases() {
  const params = {
    search:         document.getElementById('pu-search')?.value || '',
    buyer:          document.getElementById('pu-buyer')?.value || '',
    has_tracking:   document.getElementById('pu-has-tracking')?.value || '',
    confirm_status: document.getElementById('pu-confirm')?.value || '',
  }
  const { data } = await api.purchaseList(params)
  const write = canWrite('purchase')
  const list = document.getElementById('pu-list')
  if (!list) return

  if (!data.length) {
    list.innerHTML = '<div class="empty">暂无购物记录</div>'
    return
  }

  // Flatten: one row per tracking entry (or one row if no trackings)
  const rows = []
  data.forEach(r => {
    const trackings = r.trackings || []
    if (trackings.length === 0) {
      rows.push({ r, t: null })
    } else {
      trackings.forEach(t => rows.push({ r, t }))
    }
  })

  list.innerHTML = `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>购买日期</th>
            <th>货品名称</th>
            <th>快递公司</th>
            <th>快递单号</th>
            <th>收货人</th>
            ${write ? '<th></th>' : ''}
          </tr>
        </thead>
        <tbody id="pu-tbody"></tbody>
      </table>
    </div>
  `

  const tbody = document.getElementById('pu-tbody')

  // Group rows by purchase id for rowspan
  // Simpler: just render each row, repeat purchase info for multi-tracking
  // Use a visual separator for same purchase (light top border)
  let lastPid = null
  rows.forEach(({ r, t }) => {
    const isNewPurchase = r.id !== lastPid
    lastPid = r.id

    const tr = document.createElement('tr')
    if (isNewPurchase && rows.indexOf(rows.find(x => x.r.id === r.id)) > 0) {
      tr.style.borderTop = '2px solid var(--border2)'
    }

    // Tracking cell content
    let trackingCell = ''
    if (!t || !t.tracking_no) {
      trackingCell = `<span class="badge badge-orange">⏳ 待填</span>
        ${write ? `<button class="btn btn-ghost btn-xs" style="margin-left:4px" data-add-tracking="${r.id}">补充</button>` : ''}`
    } else {
      trackingCell = `<span style="font-size:12px;word-break:break-all">${esc(t.tracking_no)}</span>`
    }

    tr.innerHTML = `
      <td style="white-space:nowrap">${fmtDate(r.purchase_date)}</td>
      <td style="max-width:120px">${esc(r.goods_name)}</td>
      <td>${esc(r.express_company || '-')}</td>
      <td style="max-width:100px">${trackingCell}</td>
      <td>${esc(r.receiver_name || '-')}</td>
      ${write ? `<td><button class="btn btn-danger btn-xs" data-del="${r.id}" title="删除">🗑</button></td>` : ''}
    `
    tbody.appendChild(tr)
  })

  tbody.querySelectorAll('[data-add-tracking]').forEach(btn => {
    btn.addEventListener('click', () => openAddTracking(btn.dataset.addTracking))
  })
  tbody.querySelectorAll('[data-del]').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('确认删除此购物记录？相关快递单号关联也会删除')) return
      const { ok, data: d } = await api.purchaseDelete(btn.dataset.del)
      ok ? loadPurchases() : alert(d.error || '删除失败')
    })
  })
}

// ── add tracking modal ───────────────────────────────────────────────────────
function openAddTracking(pid) {
  document.getElementById('at-pid').value = pid
  document.getElementById('at-tracking').value = ''
  document.getElementById('at-dup').style.display = 'none'
  openModal('modal-add-tracking')
}

async function checkAtDup(val) {
  const warn = document.getElementById('at-dup')
  if (!val) { warn.style.display = 'none'; return }
  const { data } = await api.purchaseCheck(val)
  warn.style.display = data.exists ? 'block' : 'none'
}

async function submitAddTracking() {
  const pid = document.getElementById('at-pid').value
  const tn  = document.getElementById('at-tracking').value.trim()
  if (!tn) { showAlert('at-alert', '请输入快递单号'); return }
  const { ok, data } = await api.purchaseAddTracking(pid, tn)
  if (ok) { closeModal('modal-add-tracking'); loadPurchases() }
  else showAlert('at-alert', data.error || '保存失败')
}

// ── bulk import ──────────────────────────────────────────────────────────────
async function bulkImport() {
  const text = document.getElementById('bulk-text').value.trim()
  if (!text) { showAlert('bulk-alert', '请粘贴数据'); return }
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  const { ok, data } = await api.purchaseBulk(lines)
  if (!ok || data.total === undefined) { showAlert('bulk-alert', '导入请求失败，请重试'); return }
  let msg = `共 ${data.total} 条，成功导入 ${data.success} 条`
  if (data.errors?.length) msg += '<br>⚠️ ' + data.errors.slice(0, 5).join('<br>')
  showAlert('bulk-alert', msg, (data.errors?.length && data.success === 0) ? 'err' : 'ok')
  if (data.success > 0) { document.getElementById('bulk-text').value = ''; loadPurchases() }
}
