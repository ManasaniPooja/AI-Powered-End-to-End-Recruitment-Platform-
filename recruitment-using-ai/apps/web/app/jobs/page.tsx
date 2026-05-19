'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const API = 'https://ai-powered-end-to-end-recruitment-platform-production.up.railway.app'

export default function JobsPage() {
  const router = useRouter()
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API}/api/jobs/public`)
      .then(r => r.json())
      .then(data => { setJobs(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)', fontFamily: "'Segoe UI', sans-serif" }}>
      <nav style={{ background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.1)', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, background: 'linear-gradient(135deg, #667eea, #764ba2)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'white', fontWeight: 'bold', fontSize: 18 }}>R</span>
          </div>
          <div>
            <h1 style={{ fontSize: 16, fontWeight: 700, color: 'white', margin: 0 }}>Recruitment Using AI</h1>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', margin: 0 }}>Open Positions</p>
          </div>
        </div>
        <button onClick={() => router.push('/login')} style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', padding: '8px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer' }}>
          Hiring Manager Login
        </button>
      </nav>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h2 style={{ fontSize: 32, fontWeight: 800, color: 'white', margin: 0 }}>Open Positions</h2>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)', marginTop: 8 }}>Find your dream job and apply today</p>
        </div>

        {loading && <p style={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>Loading jobs...</p>}

        {!loading && jobs.length === 0 && (
          <div style={{ textAlign: 'center', padding: 60, background: 'rgba(255,255,255,0.05)', borderRadius: 20, border: '1px solid rgba(255,255,255,0.1)' }}>
            <p style={{ fontSize: 40, margin: 0 }}>ðŸ’¼</p>
            <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: 12 }}>No open positions right now. Check back soon!</p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {jobs.map(job => {
            const desc = job.description as any
            return (
              <div key={job.id} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 20, padding: 28, backdropFilter: 'blur(10px)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: 20, fontWeight: 700, color: 'white', margin: 0 }}>{job.title}</h3>
                    <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', marginTop: 8, lineHeight: 1.6 }}>{desc?.summary || 'Exciting opportunity to join our team.'}</p>
                    <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' as const }}>
                      {desc?.experience && <span style={{ fontSize: 12, background: 'rgba(102,126,234,0.2)', color: '#a78bfa', padding: '4px 12px', borderRadius: 50, border: '1px solid rgba(102,126,234,0.3)' }}>ðŸ“… {desc.experience}</span>}
                      {desc?.jobType && <span style={{ fontSize: 12, background: 'rgba(16,185,129,0.2)', color: '#6ee7b7', padding: '4px 12px', borderRadius: 50, border: '1px solid rgba(16,185,129,0.3)' }}>ðŸ’¼ {desc.jobType}</span>}
                      {desc?.location && <span style={{ fontSize: 12, background: 'rgba(245,158,11,0.2)', color: '#fcd34d', padding: '4px 12px', borderRadius: 50, border: '1px solid rgba(245,158,11,0.3)' }}>ðŸ“ {desc.location}</span>}
                    </div>
                  </div>
                  <button
                    onClick={() => router.push(`/jobs/${job.id}/apply`)}
                    style={{ marginLeft: 20, background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', padding: '12px 24px', borderRadius: 14, fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' as const }}
                  >
                    Apply Now â†’
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
