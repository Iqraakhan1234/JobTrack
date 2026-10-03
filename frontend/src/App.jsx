import { useCallback, useEffect, useState } from 'react'
import { api, BASE } from './api'
import { Board, Interviews, Analytics, Profile } from './Pages.jsx'
import { STATUSES, COLORS, EMPTY, fmt, fmtDT, hue, Badge } from './shared.jsx'
import './styles.css'


function Auth({ onAuth }) {
  const [mode, setMode] = useState('login')
  const [f, setF] = useState({ name: '', email: 'demo@jobtrack.com', password: 'demo123' })
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setErr('')
    try {
      const u = mode === 'login' ? await api.login(f) : await api.register(f)
      onAuth(u)
    } catch (x) { setErr(x.message === 'Failed to fetch' ? `Cannot reach backend at ${BASE}` : x.message) }
    setBusy(false)
  }
  return (
    <div className="auth">
      <div className="auth-hero">
        <div className="logo big"><span>J</span>obTrack</div>
        <h1>Track your job search.<br />Build your future.</h1>
        <p>One organized dashboard for every application, interview and offer.</p>
        <ul><li>Live dashboard statistics</li><li>Search, filter &amp; sort</li><li>Edit status in one click</li></ul>
      </div>
      <form className="auth-card" onSubmit={submit}>
        <h2>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h2>
        <p className="muted">{mode === 'login' ? 'Demo credentials are pre-filled.' : 'It takes less than a minute.'}</p>
        {mode === 'register' && <label>Full name<input value={f.name} onChange={set('name')} required /></label>}
        <label>Email<input type="email" value={f.email} onChange={set('email')} required /></label>
        <label>Password<input type="password" value={f.password} onChange={set('password')} required minLength={6} /></label>
        {err && <div className="alert">{err}</div>}
        <button className="btn primary wide" disabled={busy}>{busy ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Sign up'}</button>
        <p className="muted center">
          {mode === 'login' ? 'New here? ' : 'Have an account? '}
          <a href="#" onClick={(e) => { e.preventDefault(); setErr(''); setMode(mode === 'login' ? 'register' : 'login') }}>
            {mode === 'login' ? 'Create account' : 'Sign in'}
          </a>
        </p>
      </form>
    </div>
  )
}

function Donut({ stats }) {
  const r = 54, C = 2 * Math.PI * r
  let off = 0
  return (
    <svg viewBox="0 0 140 140" className="donut">
      <circle cx="70" cy="70" r={r} fill="none" stroke="var(--line)" strokeWidth="16" />
      {stats.total > 0 && STATUSES.map((s) => {
        const len = (stats[s.toLowerCase()] / stats.total) * C
        const el = <circle key={s} cx="70" cy="70" r={r} fill="none" stroke={COLORS[s]} strokeWidth="16"
          strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-off} transform="rotate(-90 70 70)" />
        off += len
        return el
      })}
      <text x="70" y="70" textAnchor="middle" className="dn">{stats.total}</text>
      <text x="70" y="88" textAnchor="middle" className="dl">applications</text>
    </svg>
  )
}

function Dashboard({ stats, apps, go }) {
  if (!stats) return <div className="empty">Loading...</div>
  const max = Math.max(1, ...stats.monthly.map((m) => m.count))
  const cards = [
    ['Total Applications', stats.total, '#6366f1', '📄'], ['Interviews', stats.interview, '#f59e0b', '🎤'],
    ['Offers', stats.offer, '#10b981', '🏆'], ['Rejected', stats.rejected, '#ef4444', '✖'],
  ]
  return (
    <>
      <div className="grid4">
        {cards.map(([l, v, c, i]) => (
          <div className="card stat" key={l} style={{ '--c': c }}>
            <div className="ico">{i}</div><div><div className="num">{v}</div><div className="muted">{l}</div></div>
          </div>
        ))}
      </div>
      <div className="grid2">
        <div className="card"><h3>Status breakdown</h3>
          <div className="donut-wrap"><Donut stats={stats} />
            <ul className="legend">{STATUSES.map((s) => (
              <li key={s}><i style={{ background: COLORS[s] }} />{s}<b>{stats[s.toLowerCase()]}</b></li>))}
              <li className="rate">Offer rate <b>{stats.offerRate}%</b></li></ul>
          </div>
        </div>
        <div className="card"><h3>Applications per month</h3>
          <div className="bars">{stats.monthly.map((m) => (
            <div key={m.label} className="bar"><span className="v">{m.count}</span>
              <div className="fill" style={{ height: `${(m.count / max) * 100}%` }} /><span className="l">{m.label}</span></div>))}
          </div>
        </div>
      </div>
      <div className="card"><div className="row"><h3>Recent applications</h3>
        <a href="#" onClick={(e) => { e.preventDefault(); go('applications') }}>View all →</a></div>
        {apps.length === 0 && <div className="empty">No applications yet. Click “Add application”.</div>}
        {apps.slice(0, 5).map((a) => (
          <div className="recent" key={a.id}>
            <div className="avatar sm" style={{ background: `hsl(${hue(a.company)} 70% 55%)` }}>{a.company[0]}</div>
            <div className="grow"><b>{a.position}</b><div className="muted">{a.company} · {a.location || 'N/A'}</div></div>
            <span className="muted">{fmt(a.appliedDate)}</span><Badge s={a.status} />
          </div>))}
      </div>
    </>
  )
}

function Applications({ apps, filters, setFilters, onEdit, onDelete, onQuick, onAdd }) {
  const set = (k) => (e) => setFilters({ ...filters, [k]: e.target.value })
  return (
    <>
      <div className="toolbar">
        <input className="search" placeholder="🔍  Search company, role or location" value={filters.q} onChange={set('q')} />
        <select value={filters.status} onChange={set('status')}>
          <option value="">All statuses</option>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select>
        <select value={filters.sort} onChange={set('sort')}>
          <option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="company">Company A-Z</option></select>
      </div>
      {apps.length === 0 ? (
        <div className="card empty"><p>No applications match.</p><button className="btn primary" onClick={onAdd}>+ Add application</button></div>
      ) : (
        <div className="cards">{apps.map((a) => (
          <div className="card app" key={a.id} style={{ '--c': COLORS[a.status] }}>
            <div className="row">
              <div className="avatar" style={{ background: `hsl(${hue(a.company)} 70% 55%)` }}>{a.company[0]}</div>
              <div className="grow"><h4>{a.position}</h4><div className="muted">{a.company}</div></div><Badge s={a.status} />
            </div>
            <div className="chips"><span>📍 {a.location || 'N/A'}</span><span>💰 {a.salary || 'N/A'}</span><span>📅 {fmt(a.appliedDate)}</span>{a.interviewDate && <span>🎤 {fmtDT(a.interviewDate)}</span>}</div>
            <div className="row actions">
              <select value={a.status} onChange={(e) => onQuick(a, e.target.value)}>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select>
              <button className="btn ghost" onClick={() => onEdit(a)}>Edit</button>
              <button className="btn danger" onClick={() => onDelete(a)}>Delete</button>
            </div>
          </div>))}
        </div>
      )}
    </>
  )
}

function Modal({ data, onClose, onSave }) {
  const [f, setF] = useState(data)
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const submit = async (e) => { e.preventDefault(); setBusy(true); await onSave(f); setBusy(false) }
  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form className="modal" onSubmit={submit}>
        <h3>{f.id ? 'Edit application' : 'Add application'}</h3>
        <div className="two">
          <label>Company *<input value={f.company} onChange={set('company')} required autoFocus /></label>
          <label>Position *<input value={f.position} onChange={set('position')} required /></label>
          <label>Status<select value={f.status} onChange={set('status')}>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select></label>
          <label>Applied date<input type="date" value={f.appliedDate || ''} onChange={set('appliedDate')} /></label>
          <label>Location<input value={f.location || ''} onChange={set('location')} placeholder="e.g. Mumbai / Remote" /></label>
          <label>Salary<input value={f.salary || ''} onChange={set('salary')} placeholder="e.g. 20 LPA" /></label>
          <label className="full">Interview date &amp; time<input type="datetime-local" value={f.interviewDate || ''} onChange={set('interviewDate')} /></label>
          <label className="full">Notes<textarea rows="3" value={f.notes || ''} onChange={set('notes')} placeholder="Prep notes, contacts, links..." /></label>
        </div>
        <div className="row end"><button type="button" className="btn ghost" onClick={onClose}>Cancel</button>
          <button className="btn primary" disabled={busy}>{f.id ? 'Save changes' : 'Add application'}</button></div>
      </form>
    </div>
  )
}

const TITLES = {
  board: ['Kanban Board', 'Drag cards between columns to update their status.'],
  applications: ['Applications', 'Search, filter and manage every application.'],
  interviews: ['Interviews', 'Your upcoming schedule and prep notes.'],
  analytics: ['Analytics', 'Insights from your job search data.'],
  profile: ['Profile', 'Account details and preferences.'],
}

export default function App() {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('jt_user') || 'null'))
  const [page, setPage] = useState('dashboard')
  const [apps, setApps] = useState([])
  const [stats, setStats] = useState(null)
  const [filters, setFilters] = useState({ q: '', status: '', sort: 'newest' })
  const [modal, setModal] = useState(null)
  const [toast, setToast] = useState(null)
  const [error, setError] = useState('')
  const [dark, setDark] = useState(() => localStorage.getItem('jt_dark') === '1')
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light'
    localStorage.setItem('jt_dark', dark ? '1' : '0')
  }, [dark])

  const notify = (m, t = 'ok') => { setToast({ m, t }); setTimeout(() => setToast(null), 2600) }
  const load = useCallback(async () => {
    try {
      const params = page === 'applications' ? filters : { sort: 'newest' }
      const [a, s] = await Promise.all([api.list(params), api.stats()])
      setApps(a); setStats(s); setError('')
    } catch { setError(`Cannot reach the backend at ${BASE}. Is Spring Boot running and MySQL up?`) }
  }, [page, filters])
  useEffect(() => { if (user) load() }, [user, load])

  const auth = (u) => { localStorage.setItem('jt_user', JSON.stringify(u)); setUser(u) }
  const logout = () => { localStorage.removeItem('jt_user'); setUser(null) }
  const save = async (d) => {
    try {
      if (d.id) await api.update(d.id, d); else await api.create(d)
      setModal(null); notify(d.id ? 'Application updated' : 'Application added'); load()
    } catch (e) { notify(e.message, 'err') }
  }
  const del = async (a) => {
    if (!window.confirm(`Delete ${a.position} at ${a.company}?`)) return
    try { await api.remove(a.id); notify('Application deleted'); load() } catch (e) { notify(e.message, 'err') }
  }

  const move = async (a, status) => {
    setApps((p) => p.map((x) => (x.id === a.id ? { ...x, status } : x)))
    try { await api.update(a.id, { ...a, status }); notify(`Moved to ${status}`) } catch (e) { notify(e.message, 'err') }
    load()
  }
  const updateUser = (u) => { localStorage.setItem('jt_user', JSON.stringify(u)); setUser(u) }

  if (!user) return <Auth onAuth={auth} />
  const nav = [['dashboard', '📊', 'Dashboard'], ['board', '🧩', 'Board'], ['applications', '🗂️', 'Applications'],
    ['interviews', '🎤', 'Interviews'], ['analytics', '📈', 'Analytics'], ['profile', '👤', 'Profile']]
  return (
    <div className="shell">
      <aside>
        <div className="logo"><span>J</span>obTrack</div>
        <nav>{nav.map(([k, i, l]) => (
          <button key={k} className={page === k ? 'on' : ''} onClick={() => setPage(k)}><span>{i}</span>{l}</button>))}</nav>
        <div className="me"><div className="avatar sm">{user.name?.[0] || 'U'}</div>
          <div className="grow"><b>{user.name}</b><div>{user.email}</div></div>
          <button title="Log out" onClick={logout}>⎋</button></div>
      </aside>
      <main>
        <header>
          <div><h1>{page === 'dashboard' ? `Hello, ${user.name?.split(' ')[0]} 👋` : TITLES[page][0]}</h1>
            <p className="muted">{page === 'dashboard' ? "Here's how your job search is going." : TITLES[page][1]}</p></div>
          <div className="row">
            <button className="btn ghost" title="Toggle theme" onClick={() => setDark(!dark)}>{dark ? '☀️' : '🌙'}</button>
            {page !== 'profile' && <button className="btn primary" onClick={() => setModal({ ...EMPTY })}>+ Add<span className="hide-sm"> application</span></button>}
          </div>
        </header>
        {error && <div className="alert">{error}</div>}
        {page === 'dashboard' && <Dashboard stats={stats} apps={apps} go={setPage} />}
        {page === 'board' && <Board apps={apps} onMove={move} onEdit={(a) => setModal({ ...a })} />}
        {page === 'applications' && <Applications apps={apps} filters={filters} setFilters={setFilters} onEdit={(a) => setModal({ ...a })}
          onDelete={del} onQuick={(a, status) => move(a, status)} onAdd={() => setModal({ ...EMPTY })} />}
        {page === 'interviews' && <Interviews apps={apps} onEdit={(a) => setModal({ ...a })} />}
        {page === 'analytics' && stats && <Analytics apps={apps} stats={stats} />}
        {page === 'profile' && <Profile user={user} stats={stats} onUpdate={updateUser} onLogout={logout} dark={dark} setDark={setDark} notify={notify} />}
      </main>
      <nav className="tabbar">
        {nav.map(([k, i, l]) => (
          <button key={k} className={page === k ? 'on' : ''} onClick={() => setPage(k)}><span>{i}</span>{l}</button>))}
      </nav>
      {modal && <Modal data={modal} onClose={() => setModal(null)} onSave={save} />}
      {toast && <div className={`toast ${toast.t}`}>{toast.m}</div>}
    </div>
  )
}
