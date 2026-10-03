export const STATUSES = ['Applied', 'Interview', 'Offer', 'Rejected']
export const COLORS = { Applied: '#6366f1', Interview: '#f59e0b', Offer: '#10b981', Rejected: '#ef4444' }
export const today = () => new Date().toISOString().slice(0, 10)
export const EMPTY = { company: '', position: '', status: 'Applied', location: '', salary: '', appliedDate: today(), interviewDate: '', notes: '' }
export const fmt = (d) => (d ? new Date(d + 'T00:00').toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '-')
export const fmtDT = (d) => (d ? new Date(d).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : '-')
export const hue = (s) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7)
export const Badge = ({ s }) => <span className={`badge ${s.toLowerCase()}`}>{s}</span>
export const Avatar = ({ name, size = '' }) => (
  <div className={`avatar ${size}`} style={{ background: `hsl(${hue(name)} 70% 55%)` }}>{name[0]}</div>
)
