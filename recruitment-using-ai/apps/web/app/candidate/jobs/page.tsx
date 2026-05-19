'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const API = 'https://ai-powered-end-to-end-recruitment-platform-production.up.railway.app'

export default function CandidateJobsPage() {
  const router = useRouter()
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [candidateName, setCandidateName] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('candidate_token')
    const name = localStorage.getItem('candidate_name')
    if (!token) { router.push('/candidate/login'); return }
    setCandidateName(name || 'Candidate')
    fetch(API + '/api/jobs/public')
      .then(r => r.json())
      .then(data => { setJobs(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const logout = () => {
    localStorage.removeItem('candidate_token')
    localStorage.removeItem('candidate_name')
    localStorage.removeItem('candidate_email')
    router.push('/candidate/login')
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f0c29, #1a1a2e, #16213e)', fontFamily: 'Segoe UI, sans-serif' }}>
      <nav style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '14px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 38, height: 38, background: 'linear-gradient(135deg, #667eea, #764ba2)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'white', fontWeight: 'bold', fontSize: 17 }}>R</span>
          </div>
          <div>
            <span style={{ color: 'white', fontWeight: 700, fontSize: 15 }}>Recruitment Using AI</span>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, margin: 0 }}>Candidate Portal</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>ðŸ‘‹ {candidateName}</span>
          <button onClick={logout} style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', padding: '7px 16px', borderRadius: 8, cursor: 'pointer' }}>
            Logout
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ color: 'white', fontSize: 26, fontWeight: 800, margin: 0 }}>Open Positions</h2>
          <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: 14, margin: '6px 0 0' }}>Find your next opportunity â€” AI-powered matching</p>
        </div>

        {loading ? (
          <p style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '60px 0' }}>Loading...</p>
        ) : jobs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', background: 'rgba(255,255,255,0.03)', borderRadius: 20, border: '1px solid rgba(255,255,255,0.07)' }}>
            <p style={{ fontSize: 40, marginBottom: 12 }}>ðŸ“­</p>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 15 }}>No open positions right now. Check back soon!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {jobs.map(job => {
              const desc = job.description as any
              return (
                <div key={job.id} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: '24px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <h3 style={{ color: 'white', fontSize: 18, fontWeight: 700, margin: 0 }}>{job.title}</h3>
                      <span style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.25)', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 50 }}>Open</span>
                    </div>
                    <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, margin: '0 0 12px', lineHeight: 1.6 }}>
                      {(desc?.summary || '').slice(0, 120)}...
                    </p>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {[desc?.jobType, desc?.location, desc?.experienceLevel].filter(Boolean).map((tag: string) => (
                        <span key={tag} style={{ background: 'rgba(102,126,234,0.1)', border: '1px solid rgba(102,126,234,0.2)', color: '#a78bfa', fontSize: 12, padding: '4px 12px', borderRadius: 50 }}>{tag}</span>
                      ))}
                    </div>
                  </div>
                  <button onClick={() => router.push('/jobs/' + job.id + '/apply')}
                    style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', padding: '12px 24px', borderRadius: 12, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0, boxShadow: '0 6px 20px rgba(102,126,234,0.3)' }}>
                    Apply Now
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
