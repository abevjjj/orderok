import { api } from '../utils/api.js'
import { esc, fmtDate } from '../utils/ui.js'

export async function renderMatch(container) {
  container.innerHTML = `
    <div class="sec-title">✅ 已匹配记录</div>
    <div class="card">
      <div class="card-body" style="padding:0">
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>购买日期</th>
                <th>货品名称</th>
                <th>快递单号</th>
                <th>到货日期</th>
                <th>收货登记名称</th>
                <th>指定收货人</th>
                <th>登记人</th>
              </tr>
            </thead>
            <tbody id="match-matched"></tbody>
          </table>
        </div>
      </div>
    </div>

    <div class="sec-title">⏳ 未匹配购物记录</div>
    <div class="card">
      <div class="card-body" style="padding:0">
        <div class="table-wrap">
          <table>
            <thead><tr><th>购买日期</th><th>货品名称</th><th>快递单号</th></tr></thead>
            <tbody id="match-purchase"></tbody>
          </table>
        </div>
      </div>
    </div>

    <div class="sec-title">📬 未匹配收快递记录</div>
    <div class="card">
      <div class="card-body" style="padding:0">
        <div class="table-wrap">
          <table>
            <thead><tr><th>快递单号</th><th>到货日期</th><th>货品</th><th>登记人</th></tr></thead>
            <tbody id="match-express"></tbody>
          </table>
        </div>
      </div>
    </div>
  `
  loadMatch(container)
}

async function loadMatch() {
  const { data } = await api.match()

  document.getElementById('match-matched').innerHTML =
    data.matched?.length
      ? data.matched.map(r => `
        <tr>
          <td>${fmtDate(r.purchase_date)}</td>
          <td>${esc(r.goods_name)}</td>
          <td style="max-width:90px;font-size:12px">${esc(r.tracking_no)}</td>
          <td>${fmtDate(r.arrive_date)}</td>
          <td>${esc(r.reg_goods_name)}</td>
          <td>${esc(r.receiver_name || '-')}</td>
          <td>${esc(r.registrar)}</td>
        </tr>`).join('')
      : '<tr><td colspan="7" class="empty">暂无</td></tr>'

  document.getElementById('match-purchase').innerHTML =
    data.unmatched_purchase?.length
      ? data.unmatched_purchase.map(r => `
        <tr>
          <td>${fmtDate(r.purchase_date)}</td>
          <td>${esc(r.goods_name)}</td>
          <td>${r.tracking_no
            ? esc(r.tracking_no)
            : '<span class="badge badge-orange">待填</span>'}</td>
        </tr>`).join('')
      : '<tr><td colspan="3" class="empty">暂无</td></tr>'

  document.getElementById('match-express').innerHTML =
    data.unmatched_express?.length
      ? data.unmatched_express.map(r => `
        <tr>
          <td style="max-width:90px;font-size:12px">${esc(r.tracking_no)}</td>
          <td>${fmtDate(r.arrive_date)}</td>
          <td>${esc(r.goods_desc)}</td>
          <td>${esc(r.registrar)}</td>
        </tr>`).join('')
      : '<tr><td colspan="4" class="empty">暂无</td></tr>'
}
