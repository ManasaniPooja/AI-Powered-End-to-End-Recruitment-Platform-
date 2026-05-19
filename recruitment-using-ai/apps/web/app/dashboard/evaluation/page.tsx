'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const API = 'https://ai-powered-end-to-end-recruitment-platform-production.up.railway.app'

export default function EvaluationPage() {
  const router = useRouter()
  const [jobs, setJobs] = useState<any[]>([])
  const [jobId, setJobId] = useState('')
  const [candidates, setCandidates] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [evaluating, setEvaluating] = useState(false)

  useEffect(() => {
    fetch(`${API}/api/jobs/public`)
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setJobs(data) })
  }, [])

  useEffect(() => { if (jobId) fetchCandidates() }, [jobId])

  const fetchCandidates = async () => {
    setLoading(true)
    const token = localStorage.getItem('token') || ''
    const res = await fetch(`${API}/api/applications/job/${jobId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const data = await res.json()
    setCandidates(Array.isArray(data) ? data : [])
    setSelected(null)
    setLoading(false)
  }

  const evaluateNow = async (interviewId: string) => {
    setEvaluating(true)
    const token = localStorage.getItem('token') || ''
    try {
      const res = await fetch(`${API}/api/interviews/${interviewId}/evaluate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        await fetchCandidates()
        alert('âœ… Evaluation complete!')
      } else {
        const data = await res.json()
        alert(`âŒ ${data.message || 'Evaluation failed'}`)
      }
    } catch {
      alert('âŒ Network error')
    }
    setEvaluating(false)
  }

  const scoreColor = (s: number) => s >= 70 ? '#10b981' : s >= 50 ? '#f59e0b' : '#ef4444'
  const scoreBg = (s: number) => s >= 70 ? 'rgba(16,185,129,0.1)' : s >= 50 ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)'

  const ScoreBar = ({ label, value }: { label: string; value: number }) => (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 600 }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: scoreColor(value) }}>{value}/100</span>
      </div>
      <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${value}%`, background: `linear-gradient(90deg, #7c3aed, ${scoreColor(value)})`, borderRadius: 10, transition: 'width 0.5s ease' }} />
      </div>
    </div>
  )

  const iv = selected?.interview
  const vs = iv?.videoScore

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f0c29, #1a1a2e, #16213e)', fontFamily: 'Segoe UI, sans-serif' }}>
      <nav style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '14px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg, #667eea, #764ba2)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>R</span>
          </div>
          <span style={{ color: 'white', fontWeight: 700, fontSize: 15 }}>Recruitment Using AI</span>
        </div>
        <button onClick={() => router.push('/dashboard')} style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, border: 'none', background: 'none', cursor: 'pointer' }}>Back to Dashboard</button>
      </nav>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 32 }}>
          <div style={{ width: 52, height: 52, background: 'linear-gradient(135deg, #667eea, #764ba2)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>ðŸ“Š</div>
          <div>
            <h2 style={{ color: 'white', fontSize: 24, fontWeight: 800, margin: 0 }}>Candidate Evaluation</h2>
            <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: 13, margin: '4px 0 0' }}>AI-powered resume & video interview analysis</p>
          </div>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '24px 28px', marginBottom: 28 }}>
          <label style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 10 }}>Select Job</label>
          <select value={jobId} onChange={e => setJobId(e.target.value)}
            style={{ width: '100%', background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '12px 16px', color: 'white', fontSize: 14, outline: 'none' }}>
            <option value="">-- Select a Job --</option>
            {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
          </select>
        </div>

        {loading && <div style={{ textAlign: 'center', padding: '40px 0' }}><p style={{ color: 'rgba(255,255,255,0.4)' }}>Loading...</p></div>}

        {candidates.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 20 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {candidates.map((app: any, i: number) => {
                const score = app.resumeScore?.overallScore ?? 0
                const hasInterview = !!app.interview
                const hasScore = !!app.interview?.videoScore
                return (
                  <div key={app.id} onClick={() => setSelected(app)}
                    style={{ background: selected?.id === app.id ? 'rgba(102,126,234,0.15)' : 'rgba(255,255,255,0.04)', border: selected?.id === app.id ? '1px solid rgba(102,126,234,0.4)' : '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '16px 18px', cursor: 'pointer' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <p style={{ color: 'white', fontSize: 13, fontWeight: 600, margin: '0 0 4px' }}>Candidate #{i + 1}</p>
                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, margin: '0 0 6px' }}>{app.candidateId}</p>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <span style={{ background: 'rgba(102,126,234,0.15)', color: '#a78bfa', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>Resume</span>
                          {hasInterview && <span style={{ background: hasScore ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)', color: hasScore ? '#34d399' : '#fbbf24', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>{hasScore ? 'Evaluated âœ“' : 'Interview âœ“'}</span>}
                        </div>
                      </div>
                      <div style={{ textAlign: 'center', background: scoreBg(score), border: `1px solid ${scoreColor(score)}44`, borderRadius: 10, padding: '8px 12px' }}>
                        <p style={{ color: scoreColor(score), fontSize: 20, fontWeight: 900, margin: 0 }}>{score}</p>
                        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, margin: '2px 0 0', textTransform: 'uppercase' }}>Resume</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div>
              {!selected && (
                <div style={{ textAlign: 'center', padding: '80px 0', background: 'rgba(255,255,255,0.03)', borderRadius: 20, border: '1px solid rgba(255,255,255,0.07)' }}>
                  <p style={{ fontSize: 36, marginBottom: 12 }}>ðŸ‘ˆ</p>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 15 }}>Select a candidate to view evaluation</p>
                </div>
              )}

              {selected && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '24px 28px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                      <div>
                        <h3 style={{ color: 'white', fontSize: 18, fontWeight: 700, margin: '0 0 4px' }}>{selected.candidateId}</h3>
                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: 0 }}>Applied: {new Date(selected.appliedAt).toLocaleDateString()}</p>
                      </div>
                      <div style={{ textAlign: 'center', background: scoreBg(selected.resumeScore?.overallScore ?? 0), border: `1px solid ${scoreColor(selected.resumeScore?.overallScore ?? 0)}44`, borderRadius: 14, padding: '12px 18px' }}>
                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', margin: '0 0 4px' }}>Resume Score</p>
                        <p style={{ color: scoreColor(selected.resumeScore?.overallScore ?? 0), fontSize: 28, fontWeight: 900, margin: 0 }}>{selected.resumeScore?.overallScore ?? 'N/A'}</p>
                      </div>
                    </div>
                    <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 14px' }}>Resume Analysis</p>
                    {selected.resumeScore && (
                      <>
                        <ScoreBar label="Skills Match" value={selected.resumeScore.skillsScore ?? 0} />
                        <ScoreBar label="Experience" value={selected.resumeScore.experienceScore ?? 0} />
                        <ScoreBar label="Education" value={selected.resumeScore.educationScore ?? 0} />
                        {selected.resumeScore.explanation && (
                          <div style={{ marginTop: 16, background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '14px 16px', borderLeft: '3px solid #764ba2' }}>
                            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 600, margin: '0 0 6px', textTransform: 'uppercase' }}>AI Analysis</p>
                            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, lineHeight: 1.7, margin: 0 }}>{selected.resumeScore.explanation}</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {iv ? (
                    <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '24px 28px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                        <span style={{ fontSize: 22 }}>ðŸŽ¥</span>
                        <div>
                          <p style={{ color: 'white', fontSize: 16, fontWeight: 700, margin: 0 }}>Video Interview Evaluation</p>
                          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: '2px 0 0' }}>AI-evaluated interview performance</p>
                        </div>
                        {vs && (
                          <div style={{ marginLeft: 'auto', textAlign: 'center', background: scoreBg(vs.relevanceScore ?? 0), border: `1px solid ${scoreColor(vs.relevanceScore ?? 0)}44`, borderRadius: 14, padding: '12px 18px' }}>
                            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', margin: '0 0 4px' }}>Interview Score</p>
                            <p style={{ color: scoreColor(vs.relevanceScore ?? 0), fontSize: 28, fontWeight: 900, margin: 0 }}>{vs.relevanceScore}</p>
                          </div>
                        )}
                      </div>

                      {vs && (
                        <>
                          <ScoreBar label="Relevance" value={vs.relevanceScore ?? 0} />
                          <ScoreBar label="Communication" value={vs.communicationScore ?? 0} />
                          <ScoreBar label="Behavioral" value={vs.behavioralScore ?? 0} />
                        </>
                      )}

                      {iv.transcript && (
                        <div style={{ marginTop: 16, background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '14px 16px', borderLeft: '3px solid #764ba2' }}>
                          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 600, margin: '0 0 6px', textTransform: 'uppercase' }}>Transcript</p>
                          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap' }}>{iv.transcript}</p>
                        </div>
                      )}

                      {!vs && (
                        <div style={{ textAlign: 'center', padding: '20px', background: 'rgba(245,158,11,0.08)', borderRadius: 12, border: '1px solid rgba(245,158,11,0.2)' }}>
                          <p style={{ color: '#fbbf24', fontSize: 13, fontWeight: 600, margin: '0 0 14px' }}>â³ Interview submitted â€” AI evaluation pending</p>
                          <button
                            onClick={() => evaluateNow(iv.id)}
                            disabled={evaluating}
                            style={{ background: evaluating ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #f59e0b, #b45309)', color: 'white', border: 'none', padding: '10px 28px', borderRadius: 10, fontSize: 13, cursor: evaluating ? 'not-allowed' : 'pointer', fontWeight: 700 }}>
                            {evaluating ? 'â³ Evaluating...' : 'ðŸ¤– Evaluate Now'}
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '32px', background: 'rgba(255,255,255,0.03)', borderRadius: 20, border: '1px solid rgba(255,255,255,0.07)' }}>
                      <p style={{ fontSize: 32, marginBottom: 10 }}>ðŸ“­</p>
                      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, margin: 0 }}>No video interview submitted yet</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
