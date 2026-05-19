'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const API = 'https://ai-powered-end-to-end-recruitment-platform-production.up.railway.app'

export default function FeedbackPage() {
  const router = useRouter()
  const [jobs, setJobs] = useState<any[]>([])
  const [jobId, setJobId] = useState('')
  const [candidates, setCandidates] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState<string | null>(null)
  const [feedbackMap, setFeedbackMap] = useState<Record<string, { rating: number; comment: string; decision: string }>>({})
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetch(`${API}/api/jobs/public`)
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setJobs(data) })
  }, [])

  const loadCandidates = async () => {
    if (!jobId) return
    setLoading(true)
    const token = localStorage.getItem('token') || ''
    const res = await fetch(`${API}/api/applications/job/${jobId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const data = await res.json()
    setCandidates(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  useEffect(() => { if (jobId) loadCandidates() }, [jobId])

  const submitFeedback = async (candidateId: string) => {
    const fb = feedbackMap[candidateId]
    if (!fb?.rating || !fb?.decision) return
    setSubmitting(candidateId)
    const token = localStorage.getItem('token') || ''
    await fetch(`${API}/api/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ jobId, candidateId, ...fb })
    })
    setSuccess('Feedback submitted!')
    setTimeout(() => setSuccess(''), 3000)
    setSubmitting(null)
  }

  const updateFeedback = (id: string, field: string, value: any) => {
    setFeedbackMap(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }))
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
        <button onClick={() => router.push('/dashboard')} style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, border: 'none', background: 'none', cursor: 'pointer' }}>â† Back to Dashboard</button>
      </nav>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 32 }}>
          <div style={{ width: 52, height: 52, background: 'linear-gradient(135deg, #667eea, #764ba2)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>ðŸ’¬</div>
          <div>
            <h2 style={{ color: 'white', fontSize: 24, fontWeight: 800, margin: 0 }}>Hiring Manager Feedback</h2>
            <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: 13, margin: '4px 0 0' }}>Override AI decisions and provide feedback at every stage</p>
          </div>
        </div>

        {success && (
          <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#34d399', fontSize: 13, padding: '12px 18px', borderRadius: 12, marginBottom: 20 }}>âœ… {success}</div>
        )}

        <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '24px 28px', marginBottom: 24 }}>
          <label style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.06em', display: 'block', marginBottom: 10 }}>Select Job</label>
          <select value={jobId} onChange={e => setJobId(e.target.value)}
            style={{ width: '100%', background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '12px 16px', color: 'white', fontSize: 14, outline: 'none' }}>
            <option value="">-- Select a Job --</option>
            {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
          </select>
        </div>

        {loading && <p style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: '40px 0' }}>Loading candidates...</p>}

        {candidates.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {candidates.map((app, i) => {
              const fb = feedbackMap[app.candidateId] || { rating: 0, comment: '', decision: '' }
              return (
                <div key={app.id} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: '24px 28px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <div>
                      <h3 style={{ color: 'white', fontSize: 16, fontWeight: 700, margin: 0 }}>Candidate #{i + 1}</h3>
                      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: '4px 0 0' }}>{app.candidateId}</p>
                    </div>
                    {app.resumeScore && (
                      <span style={{ background: 'rgba(102,126,234,0.15)', color: '#a78bfa', border: '1px solid rgba(102,126,234,0.25)', fontSize: 13, fontWeight: 700, padding: '5px 14px', borderRadius: 50 }}>
                        AI Score: {app.resumeScore.overallScore}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                    <div>
                      <label style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, display: 'block', marginBottom: 8 }}>Your Rating</label>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {[1,2,3,4,5].map(star => (
                          <span key={star} onClick={() => updateFeedback(app.candidateId, 'rating', star)}
                            style={{ fontSize: 24, cursor: 'pointer', color: star <= fb.rating ? '#f59e0b' : 'rgba(255,255,255,0.2)' }}>â˜…</span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, display: 'block', marginBottom: 8 }}>Decision Override</label>
                      <select value={fb.decision} onChange={e => updateFeedback(app.candidateId, 'decision', e.target.value)}
                        style={{ width: '100%', background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '9px 12px', color: 'white', fontSize: 13, outline: 'none' }}>
                        <option value="">-- Select --</option>
                        <option value="SHORTLIST">âœ… Shortlist</option>
                        <option value="REJECT">âŒ Reject</option>
                        <option value="HOLD">â¸ Hold</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <label style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, display: 'block', marginBottom: 8 }}>Comments</label>
                    <textarea value={fb.comment} onChange={e => updateFeedback(app.candidateId, 'comment', e.target.value)}
                      placeholder="Add your feedback notes..."
                      style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 14px', color: 'white', fontSize: 13, outline: 'none', resize: 'none', minHeight: 80, fontFamily: 'Segoe UI, sans-serif', boxSizing: 'border-box' as const }} />
                  </div>

                  <button onClick={() => submitFeedback(app.candidateId)} disabled={submitting === app.candidateId}
                    style={{ background: submitting === app.candidateId ? 'rgba(255,255,255,0.07)' : 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', padding: '10px 24px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
                    {submitting === app.candidateId ? 'Submitting...' : 'Submit Feedback'}
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {!loading && candidates.length === 0 && jobId && (
          <div style={{ textAlign: 'center', padding: '60px 0', background: 'rgba(255,255,255,0.03)', borderRadius: 20, border: '1px solid rgba(255,255,255,0.07)' }}>
            <p style={{ fontSize: 40 }}>ðŸ“­</p>
            <p style={{ color: 'rgba(255,255,255,0.4)' }}>No candidates found for this job.</p>
          </div>
        )}
      </div>
    </div>
  )
}
