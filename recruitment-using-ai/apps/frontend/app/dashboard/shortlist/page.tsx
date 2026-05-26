'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

type Candidate = {
  id: string
  candidateName: string
  candidateEmail: string
  jobTitle: string
  jobId: string
  resumeScore: number
  status: string
  createdAt: string
}

const parseName = (raw: string): { name: string; email: string } => {
  if (!raw) return { name: 'Unknown', email: '' }
  const sep = raw.includes('|') ? '|' : raw.includes('/') ? '/' : null
  if (sep) {
    const [n, e] = raw.split(sep)
    return { name: n.trim() || e.trim(), email: e.trim() }
  }
  const name = raw.includes('@')
    ? raw.split('@')[0]
        .replace(/[._\-0-9]/g, ' ')
        .trim()
        .replace(/\s+/g, ' ')
        .split(' ')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ')
        .trim() || raw
    : raw
  return { name, email: raw }
}

export default function ShortlistPage() {
  const router = useRouter()
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : ''

  useEffect(() => { fetchShortlisted() }, [])

  const fetchShortlisted = async () => {
    setLoading(true)
    try {
      const jobsRes = await fetch(`${API}/api/jobs/public`)
      const jobs = jobsRes.ok ? await jobsRes.json() : []
      const all: Candidate[] = []

      if (Array.isArray(jobs)) {
        for (const job of jobs) {
          const appsRes = await fetch(`${API}/api/applications/job/${job.id}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          if (!appsRes.ok) continue
          const apps = await appsRes.json()
          if (Array.isArray(apps)) {
            apps.filter((a: any) => a.status === 'SHORTLISTED').forEach((a: any) => {
              // Use backend-enriched fields first, fall back to parsing candidateId
              const rawId = a.candidateId || ''
              const parsed = parseName(rawId)
              const displayName = (a.candidateName && a.candidateName !== a.candidateEmail)
                ? a.candidateName
                : parsed.name
              const displayEmail = a.candidateEmail || parsed.email

              all.push({
                id: a.id,
                candidateName: displayName,
                candidateEmail: displayEmail,
                jobTitle: job.title || 'Unknown Job',
                jobId: job.id,
                resumeScore: a.resumeScore?.overallScore || 0,
                status: a.status,
                createdAt: a.createdAt || new Date().toISOString(),
              })
            })
          }
        }
      }

      all.sort((a, b) => b.resumeScore - a.resumeScore)
      setCandidates(all)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const updateStatus = async (id: string, status: string) => {
    setUpdating(id)
    try {
      const res = await fetch(`${API}/api/applications/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status })
      })
      if (res.ok) fetchShortlisted()
    } catch (e) { console.error(e) }
    setUpdating(null)
  }

  const scoreColor = (s: number) => s >= 70 ? '#10b981' : s >= 50 ? '#f59e0b' : '#ef4444'

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
          ← Back to Dashboard
        </button>
      </nav>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ color: 'white', fontSize: 24, fontWeight: 800, margin: 0 }}>⭐ Shortlisted Candidates</h2>
          <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: 13, margin: '4px 0 0' }}>
            Top candidates selected by AI — move them forward or reject
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 28 }}>
          {[
            { label: 'Total Shortlisted', value: candidates.length, icon: '⭐', color: '#f59e0b' },
            { label: 'Avg Resume Score', value: candidates.length ? Math.round(candidates.reduce((s, c) => s + c.resumeScore, 0) / candidates.length) : 0, icon: '📈', color: '#10b981' },
            { label: 'Jobs Covered', value: new Set(candidates.map(c => c.jobId)).size, icon: '💼', color: '#667eea' },
          ].map(s => (
            <div key={s.label} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '18px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: 0 }}>{s.label}</p>
                  <p style={{ color: 'white', fontSize: 28, fontWeight: 800, margin: '4px 0 0' }}>{loading ? '...' : s.value}</p>
                </div>
                <span style={{ fontSize: 26 }}>{s.icon}</span>
              </div>
            </div>
          ))}
        </div>

        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 90px 200px', gap: 16, padding: '12px 24px', background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            {['Candidate', 'Job', 'Score', 'Actions'].map(h => (
              <span key={h} style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</span>
            ))}
          </div>

          {loading ? (
            <p style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '60px 0' }}>Loading shortlist...</p>
          ) : candidates.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <p style={{ fontSize: 36 }}>⭐</p>
              <p style={{ color: 'rgba(255,255,255,0.4)' }}>No shortlisted candidates yet</p>
            </div>
          ) : candidates.map((c, i) => (
            <div key={c.id}
              style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 90px 200px', gap: 16, padding: '16px 24px', borderBottom: i < candidates.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', alignItems: 'center' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              <div>
                <p style={{ color: 'white', fontSize: 13, fontWeight: 600, margin: 0 }}>{c.candidateName}</p>
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, margin: '2px 0 0' }}>{c.candidateEmail}</p>
              </div>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, margin: 0 }}>{c.jobTitle}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 99 }}>
                  <div style={{ width: `${c.resumeScore}%`, height: '100%', background: scoreColor(c.resumeScore), borderRadius: 99 }} />
                </div>
                <span style={{ color: scoreColor(c.resumeScore), fontSize: 13, fontWeight: 700, minWidth: 28 }}>{c.resumeScore}</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => router.push(`/dashboard/offer?candidate=${c.id}`)}
                  disabled={updating === c.id}
                  style={{ flex: 1, padding: '7px 0', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                  📄 Offer
                </button>
                <button
                  onClick={() => updateStatus(c.id, 'REJECTED')}
                  disabled={updating === c.id}
                  style={{ flex: 1, padding: '7px 0', borderRadius: 8, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.1)', color: '#f87171', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                  {updating === c.id ? '...' : '❌ Reject'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}