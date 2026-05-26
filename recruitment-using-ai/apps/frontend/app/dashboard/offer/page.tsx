'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

type Offer = {
  id: string
  candidateName: string
  candidateEmail: string
  jobTitle: string
  salary: string
  status: string
  sentAt: string
  expiresAt: string
}

export default function OfferPage() {
  const router = useRouter()
  const [offers, setOffers] = useState<Offer[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('ALL')
  const [showModal, setShowModal] = useState(false)
  const [selectedApp, setSelectedApp] = useState<any>(null)
  const [shortlisted, setShortlisted] = useState<any[]>([])
  const [form, setForm] = useState({ salary: '', expiresAt: '', notes: '' })
  const [sending, setSending] = useState(false)
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : ''

  useEffect(() => { fetchOffers(); fetchShortlisted() }, [])

  const fetchOffers = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API}/api/offers`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data)) {
          const mapped: Offer[] = data.map((o: any) => ({
            id: o.id,
            candidateName: o.application?.candidateName || o.application?.candidateEmail || 'Unknown',
            candidateEmail: o.application?.candidateEmail || '',
            jobTitle: o.application?.job?.title || 'Unknown Job',
            salary: o.salary || o.salaryOffered || 'N/A',
            status: o.status || 'SENT',
            sentAt: o.createdAt || new Date().toISOString(),
            expiresAt: o.expiresAt || '',
          }))
          mapped.sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime())
          setOffers(mapped)
        }
      }
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const fetchShortlisted = async () => {
    try {
      const jobsRes = await fetch(`${API}/api/jobs/public`)
      const jobs = jobsRes.ok ? await jobsRes.json() : []
      const all: any[] = []
      if (Array.isArray(jobs)) {
        for (const job of jobs) {
          const appsRes = await fetch(`${API}/api/applications/job/${job.id}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          if (!appsRes.ok) continue
          const apps = await appsRes.json()
          if (Array.isArray(apps)) {
            apps.filter((a: any) => a.status === 'SHORTLISTED').forEach((a: any) => {
              all.push({ ...a, jobTitle: job.title })
            })
          }
        }
      }
      setShortlisted(all)
    } catch (e) { console.error(e) }
  }

  const sendOffer = async () => {
    if (!selectedApp) return
    setSending(true)
    try {
      const res = await fetch(`${API}/api/offers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          applicationId: selectedApp.id,
          salary: form.salary,
          expiresAt: form.expiresAt,
          notes: form.notes,
        })
      })
      if (res.ok) {
        setShowModal(false)
        setForm({ salary: '', expiresAt: '', notes: '' })
        setSelectedApp(null)
        fetchOffers()
      }
    } catch (e) { console.error(e) }
    setSending(false)
  }

  const filtered = filter === 'ALL' ? offers : offers.filter(o => o.status === filter)

  const stats = {
    total: offers.length,
    sent: offers.filter(o => o.status === 'SENT').length,
    accepted: offers.filter(o => o.status === 'ACCEPTED').length,
    declined: offers.filter(o => o.status === 'DECLINED').length,
  }

  const statusStyle = (s: string) =>
    s === 'ACCEPTED' ? { bg: 'rgba(16,185,129,0.15)', color: '#10b981' }
    : s === 'DECLINED' ? { bg: 'rgba(239,68,68,0.15)', color: '#ef4444' }
    : s === 'EXPIRED' ? { bg: 'rgba(107,114,128,0.15)', color: '#9ca3af' }
    : { bg: 'rgba(102,126,234,0.15)', color: '#a78bfa' }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f0c29, #1a1a2e, #16213e)', fontFamily: 'Segoe UI, sans-serif' }}>
      <nav style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '14px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 38, height: 38, background: 'linear-gradient(135deg, #667eea, #764ba2)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'white', fontWeight: 'bold', fontSize: 17 }}>R</span>
          </div>
          <span style={{ color: 'white', fontWeight: 700, fontSize: 15 }}>Recruitment Using AI</span>
        </div>
        <button onClick={() => router.push('/dashboard')} style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, border: 'none', background: 'none', cursor: 'pointer' }}>
          &#8592; Back to Dashboard
        </button>
      </nav>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <div>
            <h2 style={{ color: 'white', fontSize: 24, fontWeight: 800, margin: 0 }}>&#128196; Offer Management</h2>
            <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: 13, margin: '4px 0 0' }}>Send and track job offers for shortlisted candidates</p>
          </div>
          <button onClick={() => setShowModal(true)}
            style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', padding: '11px 22px', borderRadius: 12, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700, boxShadow: '0 6px 20px rgba(102,126,234,0.3)' }}>
            &#43; Send Offer
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
          {[
            { label: 'Total Offers', value: stats.total,    icon: '&#128196;', color: '#667eea' },
            { label: 'Sent',         value: stats.sent,     icon: '&#128140;', color: '#a78bfa' },
            { label: 'Accepted',     value: stats.accepted, icon: '&#9989;',   color: '#10b981' },
            { label: 'Declined',     value: stats.declined, icon: '&#10060;',  color: '#ef4444' },
          ].map(s => (
            <div key={s.label} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '18px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: 0 }}>{s.label}</p>
                  <p style={{ color: 'white', fontSize: 28, fontWeight: 800, margin: '4px 0 0' }}>{loading ? '...' : s.value}</p>
                </div>
                <span style={{ fontSize: 26 }} dangerouslySetInnerHTML={{ __html: s.icon }} />
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {['ALL', 'SENT', 'ACCEPTED', 'DECLINED', 'EXPIRED'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding: '7px 16px', borderRadius: 50, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: '1px solid',
                background: filter === f ? 'linear-gradient(135deg, #667eea, #764ba2)' : 'rgba(255,255,255,0.05)',
                borderColor: filter === f ? 'transparent' : 'rgba(255,255,255,0.1)',
                color: filter === f ? 'white' : 'rgba(255,255,255,0.5)' }}>
              {f === 'ALL' ? 'All Offers' : f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 120px 140px 120px', gap: 16, padding: '12px 24px', background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            {['Candidate', 'Job', 'Salary', 'Sent', 'Status'].map(h => (
              <span key={h} style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</span>
            ))}
          </div>

          {loading ? (
            <p style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '60px 0' }}>Loading offers...</p>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <p style={{ fontSize: 36 }}>&#128196;</p>
              <p style={{ color: 'rgba(255,255,255,0.4)' }}>No offers found. Send your first offer!</p>
            </div>
          ) : filtered.map((offer, i) => {
            const ss = statusStyle(offer.status)
            return (
              <div key={offer.id}
                style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 120px 140px 120px', gap: 16, padding: '16px 24px', borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', alignItems: 'center' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <div>
                  <p style={{ color: 'white', fontSize: 13, fontWeight: 600, margin: 0 }}>{offer.candidateName}</p>
                  <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, margin: '2px 0 0' }}>{offer.candidateEmail}</p>
                </div>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, margin: 0 }}>{offer.jobTitle}</p>
                <p style={{ color: '#10b981', fontSize: 13, fontWeight: 700, margin: 0 }}>{offer.salary}</p>
                <div>
                  <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, margin: 0 }}>{new Date(offer.sentAt).toLocaleDateString()}</p>
                  {offer.expiresAt && (
                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, margin: '2px 0 0' }}>Expires: {new Date(offer.expiresAt).toLocaleDateString()}</p>
                  )}
                </div>
                <span style={{ background: ss.bg, color: ss.color, fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 50, whiteSpace: 'nowrap' }}>
                  {offer.status}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 24 }}>
          <div style={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: 32, width: '100%', maxWidth: 480 }}>
            <h3 style={{ color: 'white', fontSize: 18, fontWeight: 700, margin: '0 0 20px' }}>&#128196; Send Job Offer</h3>

            <div style={{ marginBottom: 16 }}>
              <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6 }}>SELECT CANDIDATE</label>
              <select value={selectedApp?.id || ''} onChange={e => setSelectedApp(shortlisted.find(a => a.id === e.target.value) || null)}
                style={{ width: '100%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: 'white', padding: '10px 14px', fontSize: 13 }}>
                <option value=''>-- Choose shortlisted candidate --</option>
                {shortlisted.map(a => (
                  <option key={a.id} value={a.id} style={{ background: '#1a1a2e' }}>
                    {a.candidateName || a.candidateEmail} — {a.jobTitle}
                  </option>
                ))}
              </select>
            </div>

            {[
              { label: 'SALARY OFFERED', key: 'salary', placeholder: 'e.g. $85,000/year', type: 'text' },
              { label: 'OFFER EXPIRY DATE', key: 'expiresAt', placeholder: '', type: 'date' },
            ].map(field => (
              <div key={field.key} style={{ marginBottom: 16 }}>
                <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6 }}>{field.label}</label>
                <input type={field.type} placeholder={field.placeholder}
                  value={(form as any)[field.key]}
                  onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: 'white', padding: '10px 14px', fontSize: 13, boxSizing: 'border-box' }} />
              </div>
            ))}

            <div style={{ marginBottom: 24 }}>
              <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6 }}>NOTES (OPTIONAL)</label>
              <textarea rows={3} placeholder='Any additional notes for the candidate...'
                value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                style={{ width: '100%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: 'white', padding: '10px 14px', fontSize: 13, resize: 'none', boxSizing: 'border-box' }} />
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => { setShowModal(false); setSelectedApp(null); setForm({ salary: '', expiresAt: '', notes: '' }) }}
                style={{ flex: 1, padding: '11px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 14 }}>
                Cancel
              </button>
              <button onClick={sendOffer} disabled={sending || !selectedApp || !form.salary}
                style={{ flex: 1, padding: '11px', borderRadius: 10, border: 'none', background: sending || !selectedApp || !form.salary ? 'rgba(102,126,234,0.3)' : 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', cursor: sending || !selectedApp || !form.salary ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 700 }}>
                {sending ? 'Sending...' : '&#128140; Send Offer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}