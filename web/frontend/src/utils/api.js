// All API calls go through here.
// Credentials are always included so session cookies are sent cross-origin during dev.

const BASE = ''   // empty = same origin; works both in dev (proxy) and production

async function req(method, path, body) {
  const opts = {
    method,
    credentials: 'include',
    headers: {}
  }
  if (body !== undefined) {
    opts.headers['Content-Type'] = 'application/json'
    opts.body = JSON.stringify(body)
  }
  const res = await fetch(BASE + path, opts)
  const data = await res.json().catch(() => ({}))
  return { ok: res.ok, status: res.status, data }
}

export const api = {
  get:    (path)        => req('GET',    path),
  post:   (path, body)  => req('POST',   path, body),
  put:    (path, body)  => req('PUT',    path, body),
  delete: (path)        => req('DELETE', path),

  // Auth
  login:  (username, password) => req('POST', '/api/login',  { username, password }),
  logout: ()                   => req('POST', '/api/logout', {}),
  me:     ()                   => req('GET',  '/api/me'),

  // Users
  users:        ()        => req('GET',    '/api/users'),
  userCreate:   (d)       => req('POST',   '/api/users', d),
  userUpdate:   (id, d)   => req('PUT',    `/api/users/${id}`, d),
  userDelete:   (id)      => req('DELETE', `/api/users/${id}`),

  // Express
  expressList:   (params) => req('GET', '/api/express?' + new URLSearchParams(params)),
  expressCreate: (d)      => req('POST',   '/api/express', d),
  expressCheck:  (tn)     => req('GET',    `/api/express/check/${encodeURIComponent(tn)}`),
  expressDelete: (id)     => req('DELETE', `/api/express/${id}`),

  // Purchase
  purchaseList:        (params) => req('GET',  '/api/purchase?' + new URLSearchParams(params)),
  purchaseCreate:      (d)      => req('POST',   '/api/purchase', d),
  purchaseCheck:       (tn)     => req('GET',    `/api/purchase/check/${encodeURIComponent(tn)}`),
  purchaseAddTracking: (id, tn) => req('POST',   `/api/purchase/${id}/tracking`, { tracking_no: tn }),
  purchaseBulk:        (lines)  => req('POST',   '/api/purchase/bulk', { lines }),
  purchaseDelete:      (id)     => req('DELETE', `/api/purchase/${id}`),

  // Match
  match: () => req('GET', '/api/match'),

  // Claim
  claimAvailable: () => req('GET',  '/api/claim/available'),
  claimCreate:    (d) => req('POST', '/api/claim', d),

  // Confirm
  confirmList:   (status) => req('GET', `/api/confirm?status=${status}`),
  confirmUpdate: (id)     => req('PUT', `/api/confirm/${id}`, {}),

  // Logs
  logs: () => req('GET', '/api/logs'),
}
