import { api } from '../utils/api.js'
import { esc, fmtDate, today, showAlert, startQR, pasteToField } from '../utils/ui.js'
import { canWrite } from '../utils/state.js'

let dupOk = true
let confirmStatus = 'pending'

export function renderExpressIn(container) {
  container.innerHTML = `
    <div class="card">
      <div class="card-header">📥 扫码收快递</div>
      <div class="card-body">
        <div id="ei-alert"></div>
        <div class="form-group">
          <label class="form-label">快递单号 <span class="req">*</span></label>
          <div class="input-row">
            <input class="form-input" id="ei-tracking" placeholder="扫码或手动输入">
            <button class="paste-btn" id="ei-qr-btn">📷</button>
          </div>
          <div class="dup-warn" id="ei-dup">⚠️ 该快递单号已经存在</div>
        </div>
        <div class="form-group">
          <label class="form-label">发货日期 <span class="req">*</span></label>
          <input class="form-input" id="ei-ship" type="date" value="${today()}">
        </div>
        <div class="form-group">
          <label class="form-label">到货日期 <span class="req">*</span></label>
          <input class="form-input" id="ei-arrive" type="date" value="${today()}">
        </div>
        <div class="form-group">
          <label class="form-label" style="display:flex;align-items:center;justify-content:space-between">
            <span>货品名称说明 <span class="req">*</span></span>
            <button class="btn btn-ghost btn-xs" id="ei-goods-clear" type="button"
              style="font-size:11px;padding:3px 8px;height:auto">🗑 清除</button>
          </label>
          <input class="form-input" id="ei-goods" placeholder="快递内货品简述">
        </div>
        <button class="btn btn-primary" id="ei-submit">✅ 确认登记</button>
      </div>
    </div>

    <div class="card">
      <div class="card-header">📋 收快递记录</div>
      <div class="card-body" style="padding:12px 16px 8px">
        <div class="tabs">
          <div class="tab active" data-status="pending">未完成确认</div>
          <div class="tab" data-status="confirmed">已完成确认</div>
          <div class="tab" data-status="all">全部</div>
        </div>
      </div>
      <div class="card-body" style="padding:0">
        <div class="table-wrap">
          <table>
            <thead><tr><th>快递单号</th><th>到货日期</th><th>货品</th><th>登记人</th><th></th></tr></thead>
            <tbody id="ei-tbody"></tbody>
          </table>
        </div>
      </div>
    </div>
  `

  // tab switching
  container.querySelectorAll('.tab[data-status]').forEach(t => {
    t.addEventListener('click', () => {
      container.querySelectorAll('.tab[data-status]').forEach(x => x.classList.remove('active'))
      t.classList.add('active')
      confirmStatus = t.dataset.status
      loadList()
    })
  })

  // QR
  document.getElementById('ei-qr-btn').addEventListener('click', () => {
    startQR(val => {
      document.getElementById('ei-tracking').value = val
      checkDup(val)
    })
  })

  // dup check on input
  document.getElementById('ei-tracking').addEventListener('input', e => checkDup(e.target.value))

  // clear goods button
  document.getElementById('ei-goods-clear').addEventListener('click', () => {
    document.getElementById('ei-goods').value = ''
    document.getElementById('ei-goods').focus()
  })

  // submit
  document.getElementById('ei-submit').addEventListener('click', submit)

  loadList()
}

async function checkDup(val) {
  const warn = document.getElementById('ei-dup')
  if (!val) { warn.style.display = 'none'; dupOk = true; return }
  const { data } = await api.expressCheck(val)
  dupOk = !data.exists
  warn.style.display = data.exists ? 'block' : 'none'
}

async function submit() {
  if (!dupOk) { showAlert('ei-alert', '该快递单号已经存在'); return }
  const tracking = document.getElementById('ei-tracking').value.trim()
  const ship     = document.getElementById('ei-ship').value
  const arrive   = document.getElementById('ei-arrive').value
  const goods    = document.getElementById('ei-goods').value.trim()
  if (!tracking || !ship || !arrive || !goods) {
    showAlert('ei-alert', '请填写所有必填字段'); return
  }
  const { ok, data } = await api.expressCreate({ tracking_no: tracking, ship_date: ship, arrive_date: arrive, goods_desc: goods })
  if (ok) {
    showAlert('ei-alert', '登记成功 ✅', 'ok')
    document.getElementById('ei-tracking').value = ''
    // 货品名称保留，方便连续录入同类快递
    document.getElementById('ei-dup').style.display = 'none'
    dupOk = true
    loadList()
  } else {
    showAlert('ei-alert', data.error || '保存失败')
  }
}

async function loadList() {
  const { data } = await api.expressList({ confirm_status: confirmStatus })
  const write = canWrite('express_in')
  const tbody = document.getElementById('ei-tbody')
  if (!tbody) return
  tbody.innerHTML = data.length ? data.map(r => `
    <tr>
      <td style="max-width:90px;font-size:12px">${esc(r.tracking_no)}</td>
      <td style="white-space:nowrap">${fmtDate(r.arrive_date)}</td>
      <td>${esc(r.goods_desc)}</td>
      <td>${esc(r.creator_name)}</td>
      <td>${write ? `<button class="btn btn-danger btn-xs" data-id="${r.id}">删除</button>` : ''}</td>
    </tr>`).join('')
    : '<tr><td colspan="5" class="empty">暂无记录</td></tr>'

  if (write) {
    tbody.querySelectorAll('[data-id]').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('确认删除此收快递记录？')) return
        const { ok, data: d } = await api.expressDelete(btn.dataset.id)
        ok ? loadList() : alert(d.error || '删除失败')
      })
    })
  }
}
