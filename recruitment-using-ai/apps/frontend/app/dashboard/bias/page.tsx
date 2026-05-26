'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

type BiasEntry = {
  id: string
  candidateName: string
  candidateEmail: string
  jobTitle: string
  resumeScore: number
  flags: string[]
  recommendation: string
  createdAt: string
}

export default function BiasAuditPage() {
  const router = useRouter()
  const [entries, setEntries] = useState<BiasEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('ALL')
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : ''

  useEffect(() => { fetchBiasData() }, [])

  const fetchBiasData = async () => {
    setLoading(true)
    try {
      const jobsRes = await fetch(`${API}/api/jobs/public`)
      const jobs = jobsRes.ok ? await jobsRes.json() : []
      const all: BiasEntry[] = []

      if (Array.isArray(jobs)) {
        for (const job of jobs) {
          const appsRes = await fetch(`${API}/api/applications/job/${job.id}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          if (!appsRes.ok) continue
          const apps = await appsRes.json()
          if (Array.isArray(apps)) {
            apps.forEach((a: any) => {
              if (!a.resumeScore) return
              const flags: string[] = []
              const score = a.resumeScore?.overallScore || 0
              if (a.resumeScore?.breakdown?.education > 90) flags.push('Education Bias Risk')
              if (a.resumeScore?.breakdown?.experience > 90) flags.push('Experience Overweight')
              if (score < 40) flags.push('Low Score — Manual Review Needed')
              all.push({
                id: a.id,
                candidateName: a.candidateName || a.candidateEmail || 'Unknown',
                candidateEmail: a.candidateEmail || '',
                jobTitle: job.title || 'Unknown Job',
                resumeScore: score,
                flags,
                recommendation: score >= 70 ? 'RECOMMENDED' : score >= 50 ? 'REVIEW' : 'REJECTED',
                createdAt: a.createdAt || new Date().toISOString(),
              })
            })
          }
        }
      }

      all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      setEntries(all)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const filtered = filter === 'ALL' ? entries
    : filter === 'FLAGGED' ? entries.filter(e => e.flags.length > 0)
    : entries.filter(e => e.recommendation === filter)

  const stats = {
    total: entries.length,
    flagged: entries.filter(e => e.flags.length > 0).length,
    recommended: entries.filter(e => e.recommendation === 'RECOMMENDED').length,
    review: entries.filter(e => e.recommendation === 'REVIEW').length,
  }

  // ✅ NEW: Navigate to candidates page with jobTitle as query param
  const handleReviewClick = (entry: BiasEntry) => {
    router.push(`/dashboard/candidates?jobTitle=${encodeURIComponent(entry.jobTitle)}`)
  }

  const decisionColor = (rec: string) => {
    if (rec === 'RECOMMENDED') return { bg: 'rgba(16,185,129,0.15)', color: '#10b981', border: 'rgba(16,185,129,0.4)' }
    if (rec === 'REVIEW')       return { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: 'rgba(245,158,11,0.4)' }
    return                             { bg: 'rgba(239,68,68,0.15)',  color: '#ef4444', border: 'rgba(239,68,68,0.4)' }
  }

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
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ color: 'white', fontSize: 24, fontWeight: 800, margin: 0 }}>&#9878;&#65039; Bias Audit Report</h2>
          <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: 13, margin: '4px 0 0' }}>Review AI scoring decisions for fairness and potential bias</p>
        </div>

        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
          {[
            { label: 'Total Reviewed',  value: stats.total,       icon: '&#128202;' },
            { label: 'Flagged Entries', value: stats.flagged,     icon: '&#9888;&#65039;' },
            { label: 'Recommended',     value: stats.recommended, icon: '&#9989;' },
            { label: 'Needs Review',    value: stats.review,      icon: '&#128270;' },
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

        {/* Filter Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {['ALL', 'FLAGGED', 'RECOMMENDED', 'REVIEW', 'REJECTED'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding: '7px 16px', borderRadius: 50, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: '1px solid',
                background: filter === f ? 'linear-gradient(135deg, #667eea, #764ba2)' : 'rgba(255,255,255,0.05)',
                borderColor: filter === f ? 'transparent' : 'rgba(255,255,255,0.1)',
                color: filter === f ? 'white' : 'rgba(255,255,255,0.5)' }}>
              {f === 'ALL' ? 'All Candidates' : f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {/* Table */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px 1fr 130px', gap: 16, padding: '12px 24px', background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            {['Candidate', 'Job', 'Score', 'Bias Flags', 'Decision'].map(h => (
              <span key={h} style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</span>
            ))}
          </div>

          {loading ? (
            <p style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '60px 0' }}>Loading bias report...</p>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <p style={{ fontSize: 36 }}>&#9878;&#65039;</p>
              <p style={{ color: 'rgba(255,255,255,0.4)' }}>No entries found</p>
            </div>
          ) : filtered.map((entry, i) => {
            const dc = decisionColor(entry.recommendation)
            return (
              <div key={entry.id}
                style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px 1fr 130px', gap: 16, padding: '16px 24px', borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', alignItems: 'center' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>

                {/* Candidate */}
                <div>
                  <p style={{ color: 'white', fontSize: 13, fontWeight: 600, margin: 0 }}>{entry.candidateName}</p>
                  <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, margin: '2px 0 0' }}>{entry.candidateEmail}</p>
                </div>

                {/* Job */}
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, margin: 0 }}>{entry.jobTitle}</p>

                {/* Score */}
                <p style={{ color: entry.resumeScore >= 70 ? '#10b981' : entry.resumeScore >= 50 ? '#f59e0b' : '#ef4444', fontSize: 16, fontWeight: 800, margin: 0 }}>
                  {entry.resumeScore}
                </p>

                {/* Bias Flags */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {entry.flags.length === 0
                    ? <span style={{ color: '#10b981', fontSize: 12 }}>&#10003; No flags</span>
                    : entry.flags.map(flag => (
                      <span key={flag} style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)', fontSize: 11, padding: '2px 8px', borderRadius: 50 }}>
                        &#9888; {flag}
                      </span>
                    ))}
                </div>

                {/* ✅ FIXED: Clickable Decision Button */}
                <button
                  onClick={() => handleReviewClick(entry)}
                  onMouseEnter={e => {
                    e.currentTarget.style.opacity = '0.75'
                    e.currentTarget.style.transform = 'scale(1.04)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.opacity = '1'
                    e.currentTarget.style.transform = 'scale(1)'
                  }}
                  style={{
                    background: dc.bg,
                    color: dc.color,
                    border: `1px solid ${dc.border}`,
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '5px 12px',
                    borderRadius: 50,
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                    transition: 'opacity 0.2s, transform 0.15s',
                    width: 'fit-content',
                  }}>
                  {entry.recommendation}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}