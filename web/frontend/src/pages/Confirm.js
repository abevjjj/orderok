import { api } from '../utils/api.js'
import { esc, fmtDate } from '../utils/ui.js'
import { canWrite } from '../utils/state.js'

let currentStatus = 'pending'

export function renderConfirm(container) {
  container.innerHTML = `
    <div class="tabs">
      <div class="tab active" data-status="pending">⏳ 待确认</div>
      <div class="tab" data-status="confirmed">✅ 已确认</div>
    </div>
    <div id="confirm-list"></div>
  `

  container.querySelectorAll('.tab[data-status]').forEach(t => {
    t.addEventListener('click', () => {
      container.querySelectorAll('.tab[data-status]').forEach(x => x.classList.remove('active'))
      t.classList.add('active')
      currentStatus = t.dataset.status
      loadConfirm()
    })
  })

  loadConfirm()
}

async function loadConfirm() {
  const { data } = await api.confirmList(currentStatus)
  const write = canWrite('confirm')
  const list = document.getElementById('confirm-list')
  if (!list) return

  list.innerHTML = data.length ? data.map(r => `
    <div class="card mb-8">
      <div class="card-body" style="padding:14px">
        <div class="flex justify-between items-center mb-8">
          <span class="badge ${currentStatus === 'pending' ? 'badge-orange' : 'badge-green'}">
            ${currentStatus === 'pending' ? '⏳ 待确认' : '✅ 已确认'}
          </span>
          <span class="text-xs text-muted">${fmtDate(r.claim_date)}</span>
        </div>
        <div class="text-sm mb-8"><b>商品名称和规格：</b>${esc(r.goods_spec)}</div>
        <div class="text-sm mb-8"><b>数量：</b>${esc(r.quantity)}</div>
        <div class="text-sm mb-8"><b>快递单号：</b>${esc(r.tracking_no)}</div>
        <div class="text-sm mb-8"><b>收货人：</b>${esc(r.receiver_name || '-')}</div>
        ${currentStatus === 'confirmed'
          ? `<div class="text-xs text-muted">确认人：${esc(r.confirmed_by_name || '-')} ${fmtDate(r.confirmed_at)}</div>`
          : ''}
        ${currentStatus === 'pending' && write
          ? `<button class="btn btn-success btn-sm mt-8" data-id="${r.id}">✅ 确认完成</button>`
          : ''}
      </div>
    </div>
  `).join('')
    : `<div class="empty">${currentStatus === 'pending' ? '🎉 暂无待确认记录' : '暂无已确认记录'}</div>`

  list.querySelectorAll('[data-id]').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('确认完成此订单？')) return
      const { ok } = await api.confirmUpdate(btn.dataset.id)
      if (ok) loadConfirm()
    })
  })
}
