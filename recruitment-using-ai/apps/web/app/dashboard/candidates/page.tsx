'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const API = 'https://ai-powered-end-to-end-recruitment-platform-production.up.railway.app'

export default function CandidatesPage() {
  const router = useRouter()
  const [jobs, setJobs] = useState<any[]>([])
  const [jobId, setJobId] = useState('')
  const [candidates, setCandidates] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [inviting, setInviting] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [invited, setInvited] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetch(`${API}/api/jobs/public`)
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setJobs(data) })
  }, [])

  useEffect(() => { if (jobId) loadCandidates() }, [jobId])

  const getToken = () => localStorage.getItem('token') || localStorage.getItem('candidate_token') || ''

  const loadCandidates = async () => {
    if (!jobId) return
    setLoading(true); setError(''); setCandidates([])
    try {
      const res = await fetch(`${API}/api/applications/job/${jobId}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      })
      const data = await res.json()
      if (res.ok) {
        const apps = Array.isArray(data) ? data : []
        setCandidates(apps)
        const alreadyInvited = new Set<string>(
          apps.filter((a: any) => a.videoInterview).map((a: any) => a.id)
        )
        setInvited(alreadyInvited)
      } else {
        setError(data.message || 'Failed to load')
      }
    } catch { setError('Network error') }
    setLoading(false)
  }

  const sendInvite = async (appId: string, candidateEmail: string) => {
    setInviting(appId)
    try {
      const res = await fetch(`${API}/api/interviews/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({
          applicationId: appId,
          candidateName: candidateEmail,
          candidateEmail: candidateEmail
        })
      })
      const d = await res.json()
      if (res.ok || d.interviewId) {
        setInvited(prev => new Set([...prev, appId]))
      } else {
        console.error('Invite failed:', d.message)
      }
    } catch (e) { console.error('Network error', e) }
    setInviting(null)
  }

  const scoreColor = (s: number) => s >= 75 ? '#34d399' : s >= 50 ? '#fbbf24' : '#f87171'
  const scoreBg = (s: number) => s >= 75 ? 'rgba(52,211,153,0.1)' : s >= 50 ? 'rgba(251,191,36,0.1)' : 'rgba(248,113,113,0.1)'

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f0c29, #1a1a2e, #16213e)', fontFamily: 'Segoe UI, sans-serif' }}>
      <nav style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '14px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 38, height: 38, background: 'linear-gradient(135deg, #667eea, #764ba2)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'white', fontWeight: 'bold', fontSize: 17 }}>R</span>
          </div>
          <span style={{ color: 'white', fontWeight: 700, fontSize: 15 }}>Recruitment Using AI</span>
        </div>
        <button onClick={() => router.push('/dashboard')} style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, border: 'none', background: 'none', cursor: 'pointer' }}>Back to Dashboard</button>
      </nav>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 32 }}>
          <div style={{ width: 52, height: 52, background: 'linear-gradient(135deg, #667eea, #764ba2)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>👥</div>
          <div>
            <h2 style={{ color: 'white', fontSize: 24, fontWeight: 800, margin: 0 }}>Resume Screening Dashboard</h2>
            <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: 13, margin: '4px 0 0' }}>AI-powered candidate screening and interview invites</p>
          </div>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '24px 28px', marginBottom: 28 }}>
          <label style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 10 }}>Select Job</label>
          <select value={jobId} onChange={e => setJobId(e.target.value)}
            style={{ width: '100%', background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '12px 16px', color: 'white', fontSize: 14, outline: 'none' }}>
            <option value="">-- Select a Job --</option>
            {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
          </select>
          {error && <p style={{ color: '#f87171', fontSize: 13, margin: '10px 0 0' }}>{error}</p>}
        </div>

        {loading && <div style={{ textAlign: 'center', padding: '40px 0' }}><p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>Loading candidates...</p></div>}

        {candidates.length > 0 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, margin: 0 }}>{candidates.length} candidate{candidates.length !== 1 ? 's' : ''} found</p>
              <span style={{ background: 'rgba(102,126,234,0.12)', border: '1px solid rgba(102,126,234,0.25)', color: '#a78bfa', fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 50 }}>AI Screened</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {candidates.map((app: any) => {
                const score = app.resumeScore?.overallScore ?? null
                const isInvited = invited.has(app.id)
                return (
                  <div key={app.id} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: '24px 28px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                          <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg, #667eea, #764ba2)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: 'white', fontSize: 15 }}>
                            {(app.candidateId || 'C')[0].toUpperCase()}
                          </div>
                          <div>
                            <h3 style={{ color: 'white', fontSize: 16, fontWeight: 700, margin: 0 }}>{app.candidateId}</h3>
                            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: '2px 0 0' }}>Application ID: {app.id.slice(0, 8)}...</p>
                          </div>
                        </div>
                        {score !== null && (
                          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 14 }}>
                            {[
                              { label: 'Overall', value: score },
                              { label: 'Relevance', value: app.resumeScore?.relevanceScore },
                              { label: 'Skills', value: app.resumeScore?.skillsScore },
                              { label: 'Experience', value: app.resumeScore?.experienceScore },
                            ].filter(s => s.value != null).map(s => (
                              <div key={s.label} style={{ background: scoreBg(s.value), border: `1px solid ${scoreColor(s.value)}33`, borderRadius: 10, padding: '8px 14px', textAlign: 'center' }}>
                                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', margin: '0 0 4px' }}>{s.label}</p>
                                <p style={{ color: scoreColor(s.value), fontSize: 18, fontWeight: 800, margin: 0 }}>{s.value}</p>
                              </div>
                            ))}
                          </div>
                        )}
                        {app.resumeScore?.feedback && (
                          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, margin: '12px 0 0', lineHeight: 1.6 }}>{app.resumeScore.feedback}</p>
                        )}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
                        {score !== null && (
                          <div style={{ textAlign: 'center', background: scoreBg(score), border: `1px solid ${scoreColor(score)}44`, borderRadius: 14, padding: '12px 18px' }}>
                            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', margin: '0 0 4px' }}>Score</p>
                            <p style={{ color: scoreColor(score), fontSize: 28, fontWeight: 900, margin: 0 }}>{score}</p>
                          </div>
                        )}
                        <button
                          onClick={() => sendInvite(app.id, app.candidateId)}
                          disabled={inviting === app.id || isInvited}
                          style={{
                            background: isInvited ? 'rgba(52,211,153,0.1)' : inviting === app.id ? 'rgba(255,255,255,0.07)' : 'linear-gradient(135deg, #10b981, #059669)',
                            color: isInvited ? '#34d399' : 'white',
                            border: isInvited ? '1px solid rgba(52,211,153,0.3)' : 'none',
                            padding: '10px 18px', borderRadius: 10,
                            cursor: isInvited || inviting === app.id ? 'not-allowed' : 'pointer',
                            fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap'
                          }}>
                          {isInvited ? '✓ Invite Sent' : inviting === app.id ? 'Sending...' : 'Send Interview Invite'}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {!loading && candidates.length === 0 && jobId && (
          <div style={{ textAlign: 'center', padding: '60px 0', background: 'rgba(255,255,255,0.03)', borderRadius: 20, border: '1px solid rgba(255,255,255,0.07)' }}>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 15 }}>No candidates found for this job.</p>
          </div>
        )}
      </div>
    </div>
  )
}

