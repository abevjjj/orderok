import { api } from '../utils/api.js'
import { esc, fmtDate, today, showAlert, openModal, closeModal } from '../utils/ui.js'

export async function renderClaim(container) {
  container.innerHTML = `
    <div style="font-size:16px;font-weight:700;padding:0 0 12px">🎁 待认领快递</div>
    <div id="claim-list"></div>

    <div class="modal-overlay" id="modal-claim">
      <div class="modal">
        <div class="modal-handle"></div>
        <div class="modal-title">📦 认领货物</div>
        <input type="hidden" id="cl-pt-id">
        <input type="hidden" id="cl-p-id">
        <div class="alert alert-info mb-8" id="cl-tracking-info"></div>
        <div class="form-group">
          <label class="form-label">认领日期 <span class="req">*</span></label>
          <input class="form-input" id="cl-date" type="date" value="${today()}">
        </div>
        <div class="form-group">
          <label class="form-label">商品名称和规格 <span class="req">*</span></label>
          <input class="form-input" id="cl-spec" placeholder="请输入商品名称和规格">
        </div>
        <div class="form-group">
          <label class="form-label">数量 <span class="req">*</span></label>
          <input class="form-input" id="cl-qty" placeholder="如：3件">
        </div>
        <div id="cl-alert"></div>
        <div class="flex gap-8 mt-12">
          <button class="btn btn-ghost w-full" id="cl-cancel">取消</button>
          <button class="btn btn-success w-full" id="cl-confirm">确认认领</button>
        </div>
      </div>
    </div>
  `

  document.getElementById('cl-cancel').addEventListener('click', () => closeModal('modal-claim'))
  document.getElementById('cl-confirm').addEventListener('click', submitClaim)

  loadClaims(container)
}

async function loadClaims(container) {
  const { data } = await api.claimAvailable()
  const list = document.getElementById('claim-list')
  if (!list) return

  list.innerHTML = data.length ? data.map(r => `
    <div class="card mb-8">
      <div class="card-body" style="padding:14px">
        <div class="flex justify-between items-center mb-8">
          <span class="badge badge-blue">📦 ${esc(r.tracking_no)}</span>
          <span class="text-xs text-muted">到货：${fmtDate(r.arrive_date)}</span>
        </div>
        <div class="text-xs text-muted mb-8">购买日期：${fmtDate(r.purchase_date)}</div>
        <button class="btn btn-success btn-sm"
          data-pt="${r.pt_id}" data-pid="${r.purchase_id}" data-tn="${esc(r.tracking_no)}">
          ✅ 认领此快递
        </button>
      </div>
    </div>
  `).join('') : '<div class="empty">🎉 暂无待认领快递</div>'

  list.querySelectorAll('[data-pt]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById('cl-pt-id').value = btn.dataset.pt
      document.getElementById('cl-p-id').value  = btn.dataset.pid
      document.getElementById('cl-tracking-info').textContent = '快递单号：' + btn.dataset.tn
      document.getElementById('cl-spec').value = ''
      document.getElementById('cl-qty').value  = ''
      document.getElementById('cl-date').value = today()
      openModal('modal-claim')
    })
  })
}

async function submitClaim() {
  const ptId = document.getElementById('cl-pt-id').value
  const pId  = document.getElementById('cl-p-id').value
  const date = document.getElementById('cl-date').value
  const spec = document.getElementById('cl-spec').value.trim()
  const qty  = document.getElementById('cl-qty').value.trim()
  if (!date || !spec || !qty) { showAlert('cl-alert', '请填写所有必填字段'); return }
  const { ok, data } = await api.claimCreate({
    purchase_tracking_id: ptId, purchase_id: pId,
    claim_date: date, goods_spec: spec, quantity: qty
  })
  if (ok) {
    closeModal('modal-claim')
    document.getElementById('claim-list').innerHTML = ''
    loadClaims()
  } else {
    showAlert('cl-alert', data.error || '操作失败')
  }
}
