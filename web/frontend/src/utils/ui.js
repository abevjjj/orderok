// ── DOM shortcuts ──────────────────────────────────────────────────────────
export const $ = (sel, ctx = document) => ctx.querySelector(sel)
export const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)]
export const el = (tag, attrs = {}, ...children) => {
  const e = document.createElement(tag)
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') e.className = v
    else if (k.startsWith('on')) e.addEventListener(k.slice(2).toLowerCase(), v)
    else e.setAttribute(k, v)
  }
  children.forEach(c => e.append(typeof c === 'string' ? c : c))
  return e
}

// ── Escape HTML ────────────────────────────────────────────────────────────
export function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

// ── Date formatting ─────────────────────────────────────────────────────────
export function fmtDate(s) { return s ? String(s).slice(0, 10) : '-' }

export function today() { return new Date().toISOString().slice(0, 10) }

// ── Alert banners ──────────────────────────────────────────────────────────
export function showAlert(containerId, msg, type = 'err', ttl = 4000) {
  const el = document.getElementById(containerId)
  if (!el) return
  el.innerHTML = `<div class="alert alert-${type}">${msg}</div>`
  if (ttl) setTimeout(() => { el.innerHTML = '' }, ttl)
}

// ── Modals ─────────────────────────────────────────────────────────────────
export function openModal(id)  { document.getElementById(id)?.classList.add('open') }
export function closeModal(id) { document.getElementById(id)?.classList.remove('open') }

// ── Clipboard paste ────────────────────────────────────────────────────────
export async function pasteToField(fieldId) {
  try {
    const text = await navigator.clipboard.readText()
    const el = document.getElementById(fieldId)
    if (el) { el.value = text.trim(); el.dispatchEvent(new Event('input')) }
  } catch {
    alert('无法读取剪贴板，请手动粘贴')
  }
}

// ── Debounce ───────────────────────────────────────────────────────────────
export function debounce(fn, ms = 400) {
  let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms) }
}

// ── QR Scanner ─────────────────────────────────────────────────────────────
let _qrStream = null
let _qrInterval = null
let _qrCallback = null

export function startQR(onResult) {
  _qrCallback = onResult
  const overlay = document.getElementById('qr-overlay')
  overlay.classList.add('open')

  navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
    .then(stream => {
      _qrStream = stream
      const video = document.getElementById('qr-video')
      video.srcObject = stream
      video.play()

      if (!('BarcodeDetector' in window)) {
        stopQR()
        const val = prompt('请输入快递单号：')
        if (val) onResult(val.trim())
        return
      }
      const detector = new BarcodeDetector({
        formats: ['code_128', 'code_39', 'ean_13', 'qr_code', 'data_matrix', 'pdf417']
      })
      _qrInterval = setInterval(async () => {
        if (!_qrStream) { clearInterval(_qrInterval); return }
        try {
          const codes = await detector.detect(video)
          if (codes.length) { stopQR(); onResult(codes[0].rawValue) }
        } catch { /* ignore */ }
      }, 300)
    })
    .catch(e => {
      overlay.classList.remove('open')
      alert('无法访问摄像头：' + e.message)
    })
}

export function stopQR() {
  clearInterval(_qrInterval)
  if (_qrStream) { _qrStream.getTracks().forEach(t => t.stop()); _qrStream = null }
  document.getElementById('qr-overlay')?.classList.remove('open')
}
