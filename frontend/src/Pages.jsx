import { useState } from 'react'
import { api } from './api'
import { STATUSES, COLORS, Avatar, fmtDT } from './shared.jsx'

/* ---------- Kanban board (drag & drop; dropdown fallback for touch) ---------- */
export function Board({ apps, onMove, onEdit }) {
  const [over, setOver] = useState(null)
  return (
    <div className="board">
      {STATUSES.map((s) => {
        const list = apps.filter((a) => a.status === s)
        return (
          <div key={s} className={`col ${over === s ? 'over' : ''}`} style={{ '--c': COLORS[s] }}
            onDragOver={(e) => { e.preventDefault(); setOver(s) }} onDragLeave={() => setOver(null)}
            onDrop={(e) => {
              e.preventDefault(); setOver(null)
              const a = apps.find((x) => x.id === Number(e.dataTransfer.getData('text')))
              if (a && a.status !== s) onMove(a, s)
            }}>
            <div className="col-h">{s}<b>{list.length}</b></div>
            {list.map((a) => (
              <div key={a.id} className="kcard" draggable onClick={() => onEdit(a)}
                onDragStart={(e) => e.dataTransfer.setData('text', String(a.id))}>
                <div className="row"><Avatar name={a.company} size="sm" />
                  <div className="grow"><b>{a.position}</b><div className="muted">{a.company}</div></div></div>
                <div className="chips"><span>📍 {a.location || 'N/A'}</span><span>💰 {a.salary || 'N/A'}</span>
                  {a.interviewDate && <span>🎤 {fmtDT(a.interviewDate)}</span>}</div>
                <select value={a.status} onClick={(e) => e.stopPropagation()} onChange={(e) => onMove(a, e.target.value)}>
                  {STATUSES.map((x) => <option key={x}>{x}</option>)}</select>
              </div>))}
            {list.length === 0 && <div className="muted center" style={{ padding: 24 }}>Drop here</div>}
          </div>
        )
      })}
    </div>
  )
}

/* ---------- Interviews ---------- */
export function Interviews({ apps, onEdit }) {
  const now = new Date()
  const dated = apps.filter((a) => a.interviewDate).map((a) => ({ ...a, d: new Date(a.interviewDate) })).sort((x, y) => x.d - y.d)
  const upcoming = dated.filter((a) => a.d >= now)
  const past = dated.filter((a) => a.d < now).reverse()
  const pending = apps.filter((a) => a.status === 'Interview' && !a.interviewDate)
  const days = [...Array(7)].map((_, i) => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + i); return d })
  const rel = (d) => { const h = Math.round((d - now) / 36e5); return h < 1 ? 'Starting soon' : h < 24 ? `in ${h}h` : `in ${Math.round(h / 24)}d` }
  const Row = ({ a, old }) => (
    <div className={`card iv ${old ? 'old' : ''}`}>
      <div className="date"><b>{a.d.getDate()}</b><span>{a.d.toLocaleString(undefined, { month: 'short' })}</span></div>
      <div className="grow"><b>{a.position}</b>
        <div className="muted">{a.company} · {a.d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}</div>
        {a.notes && <div className="note">📝 {a.notes}</div>}</div>
      {!old && <span className="badge interview">{rel(a.d)}</span>}
      <button className="btn ghost" onClick={() => onEdit(a)}>Edit</button>
    </div>
  )
  return (
    <>
      <div className="card"><h3>Next 7 days</h3>
        <div className="strip">{days.map((d) => {
          const n = upcoming.filter((a) => a.d.toDateString() === d.toDateString()).length
          return (<div key={+d} className={`day ${n ? 'has' : ''}`}><span>{d.toLocaleDateString(undefined, { weekday: 'short' })}</span>
            <b>{d.getDate()}</b><i>{n ? `${n} 🎤` : '·'}</i></div>)
        })}</div></div>
      <h3 className="sec">Upcoming ({upcoming.length})</h3>
      {upcoming.length === 0 && <div className="card empty">No interviews scheduled. Edit an application and set an interview date &amp; time.</div>}
      {upcoming.map((a) => <Row key={a.id} a={a} />)}
      {pending.length > 0 && <>
        <h3 className="sec">Needs a date ({pending.length})</h3>
        {pending.map((a) => (
          <div key={a.id} className="card iv"><Avatar name={a.company} size="sm" />
            <div className="grow"><b>{a.position}</b><div className="muted">{a.company}</div></div>
            <button className="btn primary" onClick={() => onEdit(a)}>Schedule</button></div>))}
      </>}
      {past.length > 0 && <><h3 className="sec">Past</h3>{past.map((a) => <Row key={a.id} a={a} old />)}</>}
    </>
  )
}

/* ---------- Analytics ---------- */
export function Analytics({ apps, stats }) {
  const total = apps.length
  const pct = (v) => (total ? Math.round((v / total) * 100) : 0)
  const nowMs = Date.now()
  const age = (a) => nowMs - new Date(a.appliedDate + 'T00:00')
  const responded = apps.filter((a) => a.status !== 'Applied').length
  const staged = apps.filter((a) => a.status === 'Interview' || a.status === 'Offer').length
  const funnel = [['Applied', total], ['Heard back', responded], ['Interview stage', staged], ['Offers', stats.offer]]
  const weeks = Array(8).fill(0)
  apps.forEach((a) => { if (!a.appliedDate) return; const w = Math.floor(age(a) / (7 * 864e5)); if (w >= 0 && w < 8) weeks[7 - w]++ })
  const maxW = Math.max(1, ...weeks)
  const loc = {}
  apps.forEach((a) => { const k = a.location || 'Unspecified'; loc[k] = (loc[k] || 0) + 1 })
  const locs = Object.entries(loc).sort((a, b) => b[1] - a[1]).slice(0, 5)
  const stale = apps.filter((a) => a.status === 'Applied' && a.appliedDate && age(a) > 14 * 864e5).length
  const upcoming = apps.filter((a) => a.interviewDate && new Date(a.interviewDate) > new Date()).length
  const tips = []
  if (stale) tips.push(`⏰ ${stale} application${stale > 1 ? 's have' : ' has'} been waiting 14+ days. Send a polite follow-up.`)
  if (upcoming) tips.push(`🎤 You have ${upcoming} upcoming interview${upcoming > 1 ? 's' : ''}. Review your notes.`)
  if (total && pct(responded) < 30) tips.push('📬 Your response rate is under 30%. Try tailoring your resume to each role.')
  if (locs[0]) tips.push(`📍 Most applications are in ${locs[0][0]} (${locs[0][1]}).`)
  if (!tips.length) tips.push('Add more applications to unlock insights.')
  const kpis = [['Response rate', pct(responded), '#6366f1', '📬'], ['Interview rate', pct(staged), '#f59e0b', '🎤'],
    ['Offer rate', stats.offerRate, '#10b981', '🏆'], ['Rejection rate', pct(stats.rejected), '#ef4444', '✖']]
  return (
    <>
      <div className="grid4">{kpis.map(([l, v, c, i]) => (
        <div className="card stat" key={l} style={{ '--c': c }}><div className="ico">{i}</div>
          <div><div className="num">{v}%</div><div className="muted">{l}</div></div></div>))}</div>
      <div className="grid2">
        <div className="card"><h3>Conversion funnel</h3>
          <div className="funnel">{funnel.map(([l, v]) => (
            <div key={l}><div className="muted">{l}</div>
              <div className="fbar" style={{ width: `${Math.max(pct(v), 12)}%` }}>{v}</div></div>))}</div></div>
        <div className="card"><h3>Weekly activity (last 8 weeks)</h3>
          <div className="bars">{weeks.map((c, i) => (
            <div key={i} className="bar"><span className="v">{c}</span>
              <div className="fill" style={{ height: `${(c / maxW) * 100}%` }} /><span className="l">{i === 7 ? 'Now' : `${7 - i}w`}</span></div>))}</div></div>
      </div>
      <div className="grid2">
        <div className="card"><h3>Top locations</h3>
          {locs.map(([l, c]) => (
            <div key={l} className="hrow"><span>{l}</span><div className="track"><div className="hb" style={{ width: `${(c / locs[0][1]) * 100}%` }} /></div><b>{c}</b></div>))}
          {locs.length === 0 && <div className="muted">No data yet.</div>}</div>
        <div className="card"><h3>Smart insights</h3><div className="tips">{tips.map((t) => <div className="tip" key={t}>{t}</div>)}</div></div>
      </div>
    </>
  )
}

/* ---------- Profile ---------- */
export function Profile({ user, stats, onUpdate, onLogout, dark, setDark, notify }) {
  const [name, setName] = useState(user.name)
  const [cur, setCur] = useState('')
  const [pw, setPw] = useState('')
  const [busy, setBusy] = useState(false)
  const save = async (e) => {
    e.preventDefault(); setBusy(true)
    try {
      const u = await api.updateUser(user.id, { name, currentPassword: cur, newPassword: pw })
      onUpdate(u); setCur(''); setPw(''); notify('Profile updated')
    } catch (x) { notify(x.message, 'err') }
    setBusy(false)
  }
  const exportCsv = async () => {
    try {
      const all = await api.list({ sort: 'newest' })
      const cols = ['company', 'position', 'status', 'location', 'salary', 'appliedDate', 'interviewDate', 'notes']
      const q = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
      const csv = [cols.join(','), ...all.map((a) => cols.map((c) => q(a[c])).join(','))].join('\n')
      const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
      const l = document.createElement('a'); l.href = url; l.download = 'jobtrack-applications.csv'; l.click()
      URL.revokeObjectURL(url); notify('CSV exported')
    } catch (x) { notify(x.message, 'err') }
  }
  return (
    <div className="grid2">
      <div className="card profile">
        <Avatar name={user.name || 'U'} size="xl" />
        <h2>{user.name}</h2><div className="muted">{user.email}</div>
        <div className="mini"><div><b>{stats?.total ?? 0}</b><span>Applications</span></div>
          <div><b>{stats?.interview ?? 0}</b><span>Interviews</span></div><div><b>{stats?.offer ?? 0}</b><span>Offers</span></div></div>
        <button className="btn danger wide" onClick={onLogout}>Log out</button>
      </div>
      <div style={{ display: 'grid', gap: 18 }}>
        <form className="card form" onSubmit={save}><h3>Account settings</h3>
          <label>Full name<input value={name} onChange={(e) => setName(e.target.value)} required /></label>
          <label>Current password<input type="password" value={cur} onChange={(e) => setCur(e.target.value)} placeholder="Only needed to change password" /></label>
          <label>New password<input type="password" value={pw} onChange={(e) => setPw(e.target.value)} minLength={6} placeholder="At least 6 characters" /></label>
          <button className="btn primary" disabled={busy}>Save changes</button></form>
        <div className="card form"><h3>Preferences</h3>
          <div className="row"><div className="grow"><b>Dark mode</b><div className="muted">Easier on the eyes at night</div></div>
            <button className="btn ghost" onClick={() => setDark(!dark)}>{dark ? '☀️ Light' : '🌙 Dark'}</button></div>
          <div className="row"><div className="grow"><b>Export data</b><div className="muted">Download all applications as CSV</div></div>
            <button className="btn ghost" onClick={exportCsv}>⬇ Export CSV</button></div></div>
      </div>
    </div>
  )
}
