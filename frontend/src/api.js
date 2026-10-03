export const BASE = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8080`

async function req(path, opts = {}) {
  const res = await fetch(BASE + path, { headers: { 'Content-Type': 'application/json' }, ...opts })
  if (!res.ok) {
    let msg = 'Request failed'
    try { const j = await res.json(); msg = j.message || j.error || msg } catch { /* ignore */ }
    throw new Error(msg)
  }
  return res.status === 204 ? null : res.json()
}

const clean = (a) => ({ ...a, appliedDate: a.appliedDate || null, interviewDate: a.interviewDate || null })

export const api = {
  list: (p) => req('/applications?' + new URLSearchParams(p)),
  stats: () => req('/applications/stats'),
  create: (a) => req('/applications', { method: 'POST', body: JSON.stringify(clean(a)) }),
  update: (id, a) => req(`/applications/${id}`, { method: 'PUT', body: JSON.stringify(clean(a)) }),
  remove: (id) => req(`/applications/${id}`, { method: 'DELETE' }),
  login: (b) => req('/users/login', { method: 'POST', body: JSON.stringify(b) }),
  updateUser: (id, b) => req(`/users/${id}`, { method: 'PUT', body: JSON.stringify(b) }),
  register: (b) => req('/users', { method: 'POST', body: JSON.stringify(b) }),
}
