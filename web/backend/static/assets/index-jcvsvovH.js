(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const d of document.querySelectorAll('link[rel="modulepreload"]'))a(d);new MutationObserver(d=>{for(const s of d)if(s.type==="childList")for(const o of s.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&a(o)}).observe(document,{childList:!0,subtree:!0});function n(d){const s={};return d.integrity&&(s.integrity=d.integrity),d.referrerPolicy&&(s.referrerPolicy=d.referrerPolicy),d.crossOrigin==="use-credentials"?s.credentials="include":d.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function a(d){if(d.ep)return;d.ep=!0;const s=n(d);fetch(d.href,s)}})();const Z="";async function l(e,t,n){const a={method:e,credentials:"include",headers:{}};n!==void 0&&(a.headers["Content-Type"]="application/json",a.body=JSON.stringify(n));const d=await fetch(Z+t,a),s=await d.json().catch(()=>({}));return{ok:d.ok,status:d.status,data:s}}const c={get:e=>l("GET",e),post:(e,t)=>l("POST",e,t),put:(e,t)=>l("PUT",e,t),delete:e=>l("DELETE",e),login:(e,t)=>l("POST","/api/login",{username:e,password:t}),logout:()=>l("POST","/api/logout",{}),me:()=>l("GET","/api/me"),users:()=>l("GET","/api/users"),userCreate:e=>l("POST","/api/users",e),userUpdate:(e,t)=>l("PUT",`/api/users/${e}`,t),userDelete:e=>l("DELETE",`/api/users/${e}`),expressList:e=>l("GET","/api/express?"+new URLSearchParams(e)),expressCreate:e=>l("POST","/api/express",e),expressCheck:e=>l("GET",`/api/express/check/${encodeURIComponent(e)}`),expressDelete:e=>l("DELETE",`/api/express/${e}`),purchaseList:e=>l("GET","/api/purchase?"+new URLSearchParams(e)),purchaseCreate:e=>l("POST","/api/purchase",e),purchaseCheck:e=>l("GET",`/api/purchase/check/${encodeURIComponent(e)}`),purchaseAddTracking:(e,t)=>l("POST",`/api/purchase/${e}/tracking`,{tracking_no:t}),purchaseBulk:e=>l("POST","/api/purchase/bulk",{lines:e}),purchaseDelete:e=>l("DELETE",`/api/purchase/${e}`),match:()=>l("GET","/api/match"),claimAvailable:()=>l("GET","/api/claim/available"),claimCreate:e=>l("POST","/api/claim",e),confirmList:e=>l("GET",`/api/confirm?status=${e}`),confirmUpdate:e=>l("PUT",`/api/confirm/${e}`,{}),logs:()=>l("GET","/api/logs")};function i(e){return String(e??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function v(e){return e?String(e).slice(0,10):"-"}function B(){return new Date().toISOString().slice(0,10)}function u(e,t,n="err",a=4e3){const d=document.getElementById(e);d&&(d.innerHTML=`<div class="alert alert-${n}">${t}</div>`,a&&setTimeout(()=>{d.innerHTML=""},a))}function O(e){var t;(t=document.getElementById(e))==null||t.classList.add("open")}function h(e){var t;(t=document.getElementById(e))==null||t.classList.remove("open")}async function T(e){try{const t=await navigator.clipboard.readText(),n=document.getElementById(e);n&&(n.value=t.trim(),n.dispatchEvent(new Event("input")))}catch{alert("无法读取剪贴板，请手动粘贴")}}function ee(e,t=400){let n;return(...a)=>{clearTimeout(n),n=setTimeout(()=>e(...a),t)}}let I=null,q=null;function H(e){const t=document.getElementById("qr-overlay");t.classList.add("open"),navigator.mediaDevices.getUserMedia({video:{facingMode:"environment"}}).then(n=>{I=n;const a=document.getElementById("qr-video");if(a.srcObject=n,a.play(),!("BarcodeDetector"in window)){M();const s=prompt("请输入快递单号：");s&&e(s.trim());return}const d=new BarcodeDetector({formats:["code_128","code_39","ean_13","qr_code","data_matrix","pdf417"]});q=setInterval(async()=>{if(!I){clearInterval(q);return}try{const s=await d.detect(a);s.length&&(M(),e(s[0].rawValue))}catch{}},300)}).catch(n=>{t.classList.remove("open"),alert("无法访问摄像头："+n.message)})}function M(){var e;clearInterval(q),I&&(I.getTracks().forEach(t=>t.stop()),I=null),(e=document.getElementById("qr-overlay"))==null||e.classList.remove("open")}const m={me:null,users:[]};function te(e){var t,n,a,d;return((t=m.me)==null?void 0:t.is_admin)||((d=(a=(n=m.me)==null?void 0:n.perms)==null?void 0:a[e])==null?void 0:d.read)}function D(e){var t,n,a,d;return((t=m.me)==null?void 0:t.is_admin)||((d=(a=(n=m.me)==null?void 0:n.perms)==null?void 0:a[e])==null?void 0:d.write)}let w=!0,F="pending";function ae(e){e.innerHTML=`
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
          <input class="form-input" id="ei-ship" type="date" value="${B()}">
        </div>
        <div class="form-group">
          <label class="form-label">到货日期 <span class="req">*</span></label>
          <input class="form-input" id="ei-arrive" type="date" value="${B()}">
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
  `,e.querySelectorAll(".tab[data-status]").forEach(t=>{t.addEventListener("click",()=>{e.querySelectorAll(".tab[data-status]").forEach(n=>n.classList.remove("active")),t.classList.add("active"),F=t.dataset.status,L()})}),document.getElementById("ei-qr-btn").addEventListener("click",()=>{H(t=>{document.getElementById("ei-tracking").value=t,U(t)})}),document.getElementById("ei-tracking").addEventListener("input",t=>U(t.target.value)),document.getElementById("ei-goods-clear").addEventListener("click",()=>{document.getElementById("ei-goods").value="",document.getElementById("ei-goods").focus()}),document.getElementById("ei-submit").addEventListener("click",ne),L()}async function U(e){const t=document.getElementById("ei-dup");if(!e){t.style.display="none",w=!0;return}const{data:n}=await c.expressCheck(e);w=!n.exists,t.style.display=n.exists?"block":"none"}async function ne(){if(!w){u("ei-alert","该快递单号已经存在");return}const e=document.getElementById("ei-tracking").value.trim(),t=document.getElementById("ei-ship").value,n=document.getElementById("ei-arrive").value,a=document.getElementById("ei-goods").value.trim();if(!e||!t||!n||!a){u("ei-alert","请填写所有必填字段");return}const{ok:d,data:s}=await c.expressCreate({tracking_no:e,ship_date:t,arrive_date:n,goods_desc:a});d?(u("ei-alert","登记成功 ✅","ok"),document.getElementById("ei-tracking").value="",document.getElementById("ei-dup").style.display="none",w=!0,L()):u("ei-alert",s.error||"保存失败")}async function L(){const{data:e}=await c.expressList({confirm_status:F}),t=D("express_in"),n=document.getElementById("ei-tbody");n&&(n.innerHTML=e.length?e.map(a=>`
    <tr>
      <td style="max-width:90px;font-size:12px">${i(a.tracking_no)}</td>
      <td style="white-space:nowrap">${v(a.arrive_date)}</td>
      <td>${i(a.goods_desc)}</td>
      <td>${i(a.creator_name)}</td>
      <td>${t?`<button class="btn btn-danger btn-xs" data-id="${a.id}">删除</button>`:""}</td>
    </tr>`).join(""):'<tr><td colspan="5" class="empty">暂无记录</td></tr>',t&&n.querySelectorAll("[data-id]").forEach(a=>{a.addEventListener("click",async()=>{if(!confirm("确认删除此收快递记录？"))return;const{ok:d,data:s}=await c.expressDelete(a.dataset.id);d?L():alert(s.error||"删除失败")})}))}let S=0;function de(e){e.innerHTML=`
    <!-- ADD FORM -->
    <div class="card">
      <div class="card-header">🛒 新增购物记录</div>
      <div class="card-body">
        <div id="pu-alert"></div>
        <div class="form-group">
          <label class="form-label">购买日期 <span class="req">*</span></label>
          <input class="form-input" id="pu-date" type="date" value="${B()}">
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
  `,se(),document.getElementById("pu-goods-paste").addEventListener("click",()=>T("pu-goods")),document.getElementById("pu-add-tracking").addEventListener("click",()=>C()),document.getElementById("pu-submit").addEventListener("click",ie),C();const t=ee(b);document.getElementById("pu-search").addEventListener("input",t),document.getElementById("pu-buyer").addEventListener("change",b),document.getElementById("pu-has-tracking").addEventListener("change",b),document.getElementById("pu-confirm").addEventListener("change",b),document.getElementById("bulk-submit").addEventListener("click",re),document.getElementById("at-cancel").addEventListener("click",()=>h("modal-add-tracking")),document.getElementById("at-paste").addEventListener("click",()=>T("at-tracking")),document.getElementById("at-qr").addEventListener("click",()=>H(a=>{document.getElementById("at-tracking").value=a,z(a)})),document.getElementById("at-tracking").addEventListener("input",a=>z(a.target.value)),document.getElementById("at-confirm").addEventListener("click",ce);const n=document.getElementById("pu-buyer");m.users.filter(a=>a.is_active).forEach(a=>{const d=document.createElement("option");d.value=a.id,d.textContent=a.display_name,n.appendChild(d)}),b()}function se(){const e=document.getElementById("pu-receiver");e&&m.users.filter(t=>t.is_active).forEach(t=>{const n=document.createElement("option");n.value=t.id,n.textContent=t.display_name,e.appendChild(n)})}function C(e=""){S++;const t=S,n=document.getElementById("pu-trackings"),a=document.createElement("div");a.className="tracking-row",a.id=`tr-row-${t}`,a.innerHTML=`
    <input class="form-input" id="tr-${t}" placeholder="快递单号（选填）" value="${i(e)}">
    <button class="paste-btn" title="粘贴" data-paste="tr-${t}">📋</button>
    <button class="paste-btn" title="扫码" data-qr="tr-${t}">📷</button>
    <button class="rm-btn" data-rm="${t}">×</button>
    <div class="dup-warn" id="tr-warn-${t}">⚠️ 该快递单号已经存在</div>
  `,n.appendChild(a),a.querySelector("[data-paste]").addEventListener("click",()=>T(`tr-${t}`)),a.querySelector("[data-qr]").addEventListener("click",()=>H(d=>{document.getElementById(`tr-${t}`).value=d,j(t)})),a.querySelector("[data-rm]").addEventListener("click",()=>a.remove()),document.getElementById(`tr-${t}`).addEventListener("input",()=>j(t))}async function j(e){const t=document.getElementById(`tr-${e}`),n=document.getElementById(`tr-warn-${e}`);if(!t||!n)return;if(!t.value.trim()){n.style.display="none";return}const{data:a}=await c.purchaseCheck(t.value.trim());n.style.display=a.exists?"block":"none"}async function ie(){const e=document.getElementById("pu-date").value,t=document.getElementById("pu-goods").value.trim(),n=document.getElementById("pu-company").value.trim(),a=document.getElementById("pu-receiver").value;if(!e||!t||!a){u("pu-alert","请填写购买日期、货品名称和指定收货人");return}const d=[];document.querySelectorAll("#pu-trackings .tracking-row .form-input").forEach(p=>{d.push({tracking_no:p.value.trim()})});const{ok:s,data:o}=await c.purchaseCreate({purchase_date:e,goods_name:t,express_company:n,receiver_id:a,trackings:d});s?(u("pu-alert","保存成功 ✅","ok"),document.getElementById("pu-goods").value="",document.getElementById("pu-company").value="",document.getElementById("pu-receiver").value="",document.getElementById("pu-trackings").innerHTML="",S=0,C(),b()):u("pu-alert",o.error||"保存失败")}async function b(){var p,f,E,x;const e={search:((p=document.getElementById("pu-search"))==null?void 0:p.value)||"",buyer:((f=document.getElementById("pu-buyer"))==null?void 0:f.value)||"",has_tracking:((E=document.getElementById("pu-has-tracking"))==null?void 0:E.value)||"",confirm_status:((x=document.getElementById("pu-confirm"))==null?void 0:x.value)||""},{data:t}=await c.purchaseList(e),n=D("purchase"),a=document.getElementById("pu-list");if(!a)return;if(!t.length){a.innerHTML='<div class="empty">暂无购物记录</div>';return}const d=[];t.forEach(r=>{const g=r.trackings||[];g.length===0?d.push({r,t:null}):g.forEach(k=>d.push({r,t:k}))}),a.innerHTML=`
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>购买日期</th>
            <th>货品名称</th>
            <th>快递公司</th>
            <th>快递单号</th>
            <th>收货人</th>
            ${n?"<th></th>":""}
          </tr>
        </thead>
        <tbody id="pu-tbody"></tbody>
      </table>
    </div>
  `;const s=document.getElementById("pu-tbody");let o=null;d.forEach(({r,t:g})=>{const k=r.id!==o;o=r.id;const $=document.createElement("tr");k&&d.indexOf(d.find(X=>X.r.id===r.id))>0&&($.style.borderTop="2px solid var(--border2)");let _="";!g||!g.tracking_no?_=`<span class="badge badge-orange">⏳ 待填</span>
        ${n?`<button class="btn btn-ghost btn-xs" style="margin-left:4px" data-add-tracking="${r.id}">补充</button>`:""}`:_=`<span style="font-size:12px;word-break:break-all">${i(g.tracking_no)}</span>`,$.innerHTML=`
      <td style="white-space:nowrap">${v(r.purchase_date)}</td>
      <td style="max-width:120px">${i(r.goods_name)}</td>
      <td>${i(r.express_company||"-")}</td>
      <td style="max-width:100px">${_}</td>
      <td>${i(r.receiver_name||"-")}</td>
      ${n?`<td><button class="btn btn-danger btn-xs" data-del="${r.id}" title="删除">🗑</button></td>`:""}
    `,s.appendChild($)}),s.querySelectorAll("[data-add-tracking]").forEach(r=>{r.addEventListener("click",()=>le(r.dataset.addTracking))}),s.querySelectorAll("[data-del]").forEach(r=>{r.addEventListener("click",async()=>{if(!confirm("确认删除此购物记录？相关快递单号关联也会删除"))return;const{ok:g,data:k}=await c.purchaseDelete(r.dataset.del);g?b():alert(k.error||"删除失败")})})}function le(e){document.getElementById("at-pid").value=e,document.getElementById("at-tracking").value="",document.getElementById("at-dup").style.display="none",O("modal-add-tracking")}async function z(e){const t=document.getElementById("at-dup");if(!e){t.style.display="none";return}const{data:n}=await c.purchaseCheck(e);t.style.display=n.exists?"block":"none"}async function ce(){const e=document.getElementById("at-pid").value,t=document.getElementById("at-tracking").value.trim();if(!t){u("at-alert","请输入快递单号");return}const{ok:n,data:a}=await c.purchaseAddTracking(e,t);n?(h("modal-add-tracking"),b()):u("at-alert",a.error||"保存失败")}async function re(){var s,o;const e=document.getElementById("bulk-text").value.trim();if(!e){u("bulk-alert","请粘贴数据");return}const t=e.split(`
`).map(p=>p.trim()).filter(Boolean),{ok:n,data:a}=await c.purchaseBulk(t);if(!n||a.total===void 0){u("bulk-alert","导入请求失败，请重试");return}let d=`共 ${a.total} 条，成功导入 ${a.success} 条`;(s=a.errors)!=null&&s.length&&(d+="<br>⚠️ "+a.errors.slice(0,5).join("<br>")),u("bulk-alert",d,(o=a.errors)!=null&&o.length&&a.success===0?"err":"ok"),a.success>0&&(document.getElementById("bulk-text").value="",b())}async function oe(e){e.innerHTML=`
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
  `,ue()}async function ue(){var t,n,a;const{data:e}=await c.match();document.getElementById("match-matched").innerHTML=(t=e.matched)!=null&&t.length?e.matched.map(d=>`
        <tr>
          <td>${v(d.purchase_date)}</td>
          <td>${i(d.goods_name)}</td>
          <td style="max-width:90px;font-size:12px">${i(d.tracking_no)}</td>
          <td>${v(d.arrive_date)}</td>
          <td>${i(d.reg_goods_name)}</td>
          <td>${i(d.receiver_name||"-")}</td>
          <td>${i(d.registrar)}</td>
        </tr>`).join(""):'<tr><td colspan="7" class="empty">暂无</td></tr>',document.getElementById("match-purchase").innerHTML=(n=e.unmatched_purchase)!=null&&n.length?e.unmatched_purchase.map(d=>`
        <tr>
          <td>${v(d.purchase_date)}</td>
          <td>${i(d.goods_name)}</td>
          <td>${d.tracking_no?i(d.tracking_no):'<span class="badge badge-orange">待填</span>'}</td>
        </tr>`).join(""):'<tr><td colspan="3" class="empty">暂无</td></tr>',document.getElementById("match-express").innerHTML=(a=e.unmatched_express)!=null&&a.length?e.unmatched_express.map(d=>`
        <tr>
          <td style="max-width:90px;font-size:12px">${i(d.tracking_no)}</td>
          <td>${v(d.arrive_date)}</td>
          <td>${i(d.goods_desc)}</td>
          <td>${i(d.registrar)}</td>
        </tr>`).join(""):'<tr><td colspan="4" class="empty">暂无</td></tr>'}async function me(e){e.innerHTML=`
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
          <input class="form-input" id="cl-date" type="date" value="${B()}">
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
  `,document.getElementById("cl-cancel").addEventListener("click",()=>h("modal-claim")),document.getElementById("cl-confirm").addEventListener("click",pe),Q()}async function Q(e){const{data:t}=await c.claimAvailable(),n=document.getElementById("claim-list");n&&(n.innerHTML=t.length?t.map(a=>`
    <div class="card mb-8">
      <div class="card-body" style="padding:14px">
        <div class="flex justify-between items-center mb-8">
          <span class="badge badge-blue">📦 ${i(a.tracking_no)}</span>
          <span class="text-xs text-muted">到货：${v(a.arrive_date)}</span>
        </div>
        <div class="text-xs text-muted mb-8">购买日期：${v(a.purchase_date)}</div>
        <button class="btn btn-success btn-sm"
          data-pt="${a.pt_id}" data-pid="${a.purchase_id}" data-tn="${i(a.tracking_no)}">
          ✅ 认领此快递
        </button>
      </div>
    </div>
  `).join(""):'<div class="empty">🎉 暂无待认领快递</div>',n.querySelectorAll("[data-pt]").forEach(a=>{a.addEventListener("click",()=>{document.getElementById("cl-pt-id").value=a.dataset.pt,document.getElementById("cl-p-id").value=a.dataset.pid,document.getElementById("cl-tracking-info").textContent="快递单号："+a.dataset.tn,document.getElementById("cl-spec").value="",document.getElementById("cl-qty").value="",document.getElementById("cl-date").value=B(),O("modal-claim")})}))}async function pe(){const e=document.getElementById("cl-pt-id").value,t=document.getElementById("cl-p-id").value,n=document.getElementById("cl-date").value,a=document.getElementById("cl-spec").value.trim(),d=document.getElementById("cl-qty").value.trim();if(!n||!a||!d){u("cl-alert","请填写所有必填字段");return}const{ok:s,data:o}=await c.claimCreate({purchase_tracking_id:e,purchase_id:t,claim_date:n,goods_spec:a,quantity:d});s?(h("modal-claim"),document.getElementById("claim-list").innerHTML="",Q()):u("cl-alert",o.error||"操作失败")}let y="pending";function ve(e){e.innerHTML=`
    <div class="tabs">
      <div class="tab active" data-status="pending">⏳ 待确认</div>
      <div class="tab" data-status="confirmed">✅ 已确认</div>
    </div>
    <div id="confirm-list"></div>
  `,e.querySelectorAll(".tab[data-status]").forEach(t=>{t.addEventListener("click",()=>{e.querySelectorAll(".tab[data-status]").forEach(n=>n.classList.remove("active")),t.classList.add("active"),y=t.dataset.status,A()})}),A()}async function A(){const{data:e}=await c.confirmList(y),t=D("confirm"),n=document.getElementById("confirm-list");n&&(n.innerHTML=e.length?e.map(a=>`
    <div class="card mb-8">
      <div class="card-body" style="padding:14px">
        <div class="flex justify-between items-center mb-8">
          <span class="badge ${y==="pending"?"badge-orange":"badge-green"}">
            ${y==="pending"?"⏳ 待确认":"✅ 已确认"}
          </span>
          <span class="text-xs text-muted">${v(a.claim_date)}</span>
        </div>
        <div class="text-sm mb-8"><b>商品名称和规格：</b>${i(a.goods_spec)}</div>
        <div class="text-sm mb-8"><b>数量：</b>${i(a.quantity)}</div>
        <div class="text-sm mb-8"><b>快递单号：</b>${i(a.tracking_no)}</div>
        <div class="text-sm mb-8"><b>收货人：</b>${i(a.receiver_name||"-")}</div>
        ${y==="confirmed"?`<div class="text-xs text-muted">确认人：${i(a.confirmed_by_name||"-")} ${v(a.confirmed_at)}</div>`:""}
        ${y==="pending"&&t?`<button class="btn btn-success btn-sm mt-8" data-id="${a.id}">✅ 确认完成</button>`:""}
      </div>
    </div>
  `).join(""):`<div class="empty">${y==="pending"?"🎉 暂无待确认记录":"暂无已确认记录"}</div>`,n.querySelectorAll("[data-id]").forEach(a=>{a.addEventListener("click",async()=>{if(!confirm("确认完成此订单？"))return;const{ok:d}=await c.confirmUpdate(a.dataset.id);d&&A()})}))}const V=["express_in","purchase","match","claim","confirm","admin"],be={express_in:"收快递",purchase:"购物记录",match:"匹配报表",claim:"货物认领",confirm:"订单确认",admin:"管理员"};function ge(e){e.innerHTML=`
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
  `,e.querySelectorAll(".tab[data-tab]").forEach(t=>{t.addEventListener("click",()=>{e.querySelectorAll(".tab[data-tab]").forEach(n=>n.classList.remove("active")),t.classList.add("active"),document.getElementById("admin-users").style.display=t.dataset.tab==="users"?"":"none",document.getElementById("admin-logs").style.display=t.dataset.tab==="logs"?"":"none",t.dataset.tab==="logs"&&he()})}),document.getElementById("um-cancel").addEventListener("click",()=>h("modal-user")),document.getElementById("um-save").addEventListener("click",fe),P()}async function P(){const{data:e}=await c.users();m.users=e;const t=document.getElementById("admin-users");t&&(t.innerHTML=`
    <button class="btn btn-primary mb-8" id="btn-new-user">＋ 新增用户</button>
    ${e.map(n=>{var a;return`
      <div class="card mb-8" style="margin-bottom:10px">
        <div class="card-body" style="padding:12px">
          <div class="flex justify-between items-center">
            <div>
              <span style="font-weight:600">${i(n.display_name)}</span>
              <span class="text-xs text-muted"> @${i(n.username)}</span>
              ${n.is_admin?'<span class="badge badge-purple" style="margin-left:4px">管理员</span>':""}
              ${n.is_active?"":'<span class="badge badge-red">已禁用</span>'}
            </div>
            <div class="flex gap-8">
              <button class="btn btn-ghost btn-xs" data-edit="${n.id}">编辑</button>
              ${n.id!==((a=m.me)==null?void 0:a.user_id)?`<button class="btn btn-danger btn-xs" data-disable="${n.id}">禁用</button>`:""}
            </div>
          </div>
        </div>
      </div>
    `}).join("")}
  `,document.getElementById("btn-new-user").addEventListener("click",()=>R(null)),t.querySelectorAll("[data-edit]").forEach(n=>n.addEventListener("click",()=>R(Number(n.dataset.edit)))),t.querySelectorAll("[data-disable]").forEach(n=>n.addEventListener("click",async()=>{confirm("确认禁用该用户？")&&(await c.userDelete(n.dataset.disable),P())})))}function ye(e={}){return V.map(t=>{var n,a;return`
    <div class="perm-item">
      <div class="perm-name">${be[t]}</div>
      <label><input type="checkbox" id="pm-r-${t}" ${(n=e[t])!=null&&n.read?"checked":""}> 查看</label>
      <label><input type="checkbox" id="pm-w-${t}" ${(a=e[t])!=null&&a.write?"checked":""}> 操作</label>
    </div>
  `}).join("")}function R(e){if(document.getElementById("um-title").textContent=e?"编辑用户":"新增用户",document.getElementById("um-pw-hint").textContent=e?"（留空则不修改）":"",document.getElementById("um-id").value=e||"",document.getElementById("um-username").value="",document.getElementById("um-password").value="",document.getElementById("um-display").value="",document.getElementById("um-admin").checked=!1,document.getElementById("um-alert").innerHTML="",e){const t=m.users.find(n=>n.id===e);t&&(document.getElementById("um-username").value=t.username,document.getElementById("um-display").value=t.display_name,document.getElementById("um-admin").checked=!!t.is_admin)}document.getElementById("um-perms").innerHTML=ye(),O("modal-user")}async function fe(){const e=document.getElementById("um-id").value,t=document.getElementById("um-username").value.trim(),n=document.getElementById("um-display").value.trim(),a=document.getElementById("um-password").value,d=document.getElementById("um-admin").checked?1:0;if(!n){u("um-alert","请填写显示名称");return}if(!e&&(!t||!a)){u("um-alert","新增用户需填写用户名和密码");return}const s={};V.forEach(f=>{var E,x;s[f]={read:(E=document.getElementById(`pm-r-${f}`))!=null&&E.checked?1:0,write:(x=document.getElementById(`pm-w-${f}`))!=null&&x.checked?1:0}});const o={display_name:n,is_admin:d,is_active:1,perms:s};a&&(o.password=a);let p;e?p=await c.userUpdate(e,o):(o.username=t,p=await c.userCreate(o)),p.ok?(h("modal-user"),P()):u("um-alert",p.data.error||"操作失败")}async function he(){const{data:e}=await c.logs(),t=document.getElementById("admin-logs");t&&(t.innerHTML=`
    <div class="table-wrap">
      <table>
        <thead><tr><th>时间</th><th>用户</th><th>模块</th><th>操作</th><th>详情</th></tr></thead>
        <tbody>
          ${e.map(n=>`<tr>
            <td style="white-space:nowrap;font-size:12px">${v(n.created_at)}</td>
            <td>${i(n.display_name||"-")}</td>
            <td>${i(n.module)}</td>
            <td>${i(n.action)}</td>
            <td style="max-width:120px;font-size:12px">${i(n.detail||"")}</td>
          </tr>`).join("")}
        </tbody>
      </table>
    </div>
  `)}const K=[{id:"express_in",label:"收快递",icon:"📥",render:ae},{id:"purchase",label:"购物记录",icon:"🛒",render:de},{id:"match",label:"匹配报表",icon:"🔗",render:oe},{id:"claim",label:"货物认领",icon:"🎁",render:me},{id:"confirm",label:"订单确认",icon:"✅",render:ve},{id:"admin",label:"管理员",icon:"⚙️",render:ge}];let G=null;function J(){document.getElementById("app").innerHTML=`
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
  `,document.getElementById("btn-logout").addEventListener("click",async()=>{await c.logout(),Y()}),document.getElementById("qr-cancel-btn").addEventListener("click",M)}function W(){const e=document.getElementById("main-nav");e.innerHTML="";const t=K.filter(n=>te(n.id));t.forEach(n=>{const a=document.createElement("button");a.className="nav-item",a.id=`nav-${n.id}`,a.innerHTML=`<span class="icon">${n.icon}</span><span class="label">${n.label}</span>`,a.addEventListener("click",()=>N(n.id)),e.appendChild(a)}),t.length&&N(t[0].id)}async function N(e){var a;if(G===e)return;G=e,document.querySelectorAll(".nav-item").forEach(d=>d.classList.remove("active")),(a=document.getElementById(`nav-${e}`))==null||a.classList.add("active");const t=document.getElementById("content");if(t.innerHTML="",!m.users.length){const{data:d}=await c.users();m.users=d}const n=K.find(d=>d.id===e);n&&n.render(t)}function Y(){document.getElementById("app").innerHTML=`
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
  `;const e=async()=>{const t=document.getElementById("l-btn"),n=document.getElementById("l-err");t.disabled=!0,t.textContent="登录中…",n.style.display="none";const{ok:a,data:d}=await c.login(document.getElementById("l-user").value.trim(),document.getElementById("l-pass").value);if(a){m.me={...d,user_id:d.user_id??null};const s=await c.me();m.me=s.data,J(),W()}else n.textContent=d.error||"登录失败",n.style.display="block",t.disabled=!1,t.textContent="登 录"};document.getElementById("l-btn").addEventListener("click",e),document.getElementById("l-pass").addEventListener("keydown",t=>{t.key==="Enter"&&e()})}async function Ee(){const{ok:e,data:t}=await c.me();e?(m.me=t,document.getElementById("app").innerHTML="",J(),document.getElementById("top-user").textContent=m.me.display_name,W()):Y()}Ee();
