'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

type Application = {
  id: string
  candidateName: string
  candidateEmail: string
  jobTitle: string
  resumeScore: number
  videoScore: number | null
  status: string
  createdAt: string
}

export default function EvaluationPage() {
  const router = useRouter()
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('ALL')
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : ''

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const jobsRes = await fetch(`${API}/api/jobs/public`)
      const jobs = jobsRes.ok ? await jobsRes.json() : []
      const all: Application[] = []

      if (Array.isArray(jobs)) {
        for (const job of jobs) {
          const appsRes = await fetch(`${API}/api/applications/job/${job.id}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          if (!appsRes.ok) continue
          const apps = await appsRes.json()
          if (Array.isArray(apps)) {
            apps.forEach((a: any) => {
              all.push({
                id: a.id,
                candidateName: a.candidateName || a.candidateEmail || 'Unknown',
                candidateEmail: a.candidateEmail || '',
                jobTitle: job.title || 'Unknown Job',
                resumeScore: a.resumeScore?.overallScore || 0,
                videoScore: a.interview?.videoScore?.relevanceScore || null,
                status: a.status || 'APPLIED',
                createdAt: a.createdAt || new Date().toISOString(),
              })
            })
          }
        }
      }

      all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      setApplications(all)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const filtered = filter === 'ALL' ? applications : applications.filter(a => a.status === filter)

  const stats = {
    total: applications.length,
    shortlisted: applications.filter(a => a.status === 'SHORTLISTED').length,
    interviewed: applications.filter(a => a.videoScore !== null).length,
    avgScore: applications.length
      ? Math.round(applications.reduce((s, a) => s + a.resumeScore, 0) / applications.length)
      : 0,
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
          &#8592; Back to Dashboard
        </button>
      </nav>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ color: 'white', fontSize: 24, fontWeight: 800, margin: 0 }}>&#128203; Candidate Evaluations</h2>
          <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: 13, margin: '4px 0 0' }}>AI-powered resume and video evaluation results</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
          {[
            { label: 'Total Applications', value: stats.total,       icon: '&#128196;', color: '#667eea' },
            { label: 'Shortlisted',         value: stats.shortlisted, icon: '&#11088;',  color: '#f59e0b' },
            { label: 'Interviewed',          value: stats.interviewed, icon: '&#127909;', color: '#a78bfa' },
            { label: 'Avg Resume Score',     value: stats.avgScore,   icon: '&#128200;', color: '#10b981' },
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
          {['ALL', 'APPLIED', 'SHORTLISTED', 'INTERVIEWED', 'REJECTED'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding: '7px 16px', borderRadius: 50, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: '1px solid',
                background: filter === f ? 'linear-gradient(135deg, #667eea, #764ba2)' : 'rgba(255,255,255,0.05)',
                borderColor: filter === f ? 'transparent' : 'rgba(255,255,255,0.1)',
                color: filter === f ? 'white' : 'rgba(255,255,255,0.5)' }}>
              {f === 'ALL' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 100px 100px 120px', gap: 16, padding: '12px 24px', background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            {['Candidate', 'Job', 'Resume', 'Video', 'Status'].map(h => (
              <span key={h} style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</span>
            ))}
          </div>

          {loading ? (
            <p style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '60px 0' }}>Loading evaluations...</p>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <p style={{ fontSize: 36 }}>&#128203;</p>
              <p style={{ color: 'rgba(255,255,255,0.4)' }}>No evaluations found</p>
            </div>
          ) : filtered.map((app, i) => (
            <div key={app.id}
              style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 100px 100px 120px', gap: 16, padding: '16px 24px', borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', alignItems: 'center' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              <div>
                <p style={{ color: 'white', fontSize: 13, fontWeight: 600, margin: 0 }}>{app.candidateName}</p>
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, margin: '2px 0 0' }}>{app.candidateEmail}</p>
              </div>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, margin: 0 }}>{app.jobTitle}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 99 }}>
                  <div style={{ width: `${app.resumeScore}%`, height: '100%', background: scoreColor(app.resumeScore), borderRadius: 99 }} />
                </div>
                <span style={{ color: scoreColor(app.resumeScore), fontSize: 13, fontWeight: 700, minWidth: 28 }}>{app.resumeScore}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {app.videoScore !== null ? (
                  <>
                    <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 99 }}>
                      <div style={{ width: `${app.videoScore}%`, height: '100%', background: scoreColor(app.videoScore), borderRadius: 99 }} />
                    </div>
                    <span style={{ color: scoreColor(app.videoScore), fontSize: 13, fontWeight: 700, minWidth: 28 }}>{app.videoScore}</span>
                  </>
                ) : (
                  <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12 }}>—</span>
                )}
              </div>
              <span style={{
                background: app.status === 'SHORTLISTED' ? 'rgba(16,185,129,0.15)' : app.status === 'REJECTED' ? 'rgba(239,68,68,0.15)' : 'rgba(102,126,234,0.15)',
                color: app.status === 'SHORTLISTED' ? '#10b981' : app.status === 'REJECTED' ? '#ef4444' : '#a78bfa',
                fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 50, whiteSpace: 'nowrap' }}>
                {app.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}