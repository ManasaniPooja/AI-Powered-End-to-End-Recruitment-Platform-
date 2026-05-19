'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

const API = 'https://ai-powered-end-to-end-recruitment-platform-production.up.railway.app'

function ScoreBar({ label, value }: { label: string; value: number }) {
  const color = value >= 70 ? '#10b981' : value >= 50 ? '#f59e0b' : '#ef4444'
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12 }}>{label}</span>
        <span style={{ color, fontSize: 12, fontWeight: 700 }}>{value}/100</span>
      </div>
      <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 10 }}>
        <div style={{ height: '100%', width: `${value}%`, background: color, borderRadius: 10, transition: 'width 0.5s ease' }} />
      </div>
    </div>
  )
}

export default function VideoEvaluationPage() {
  const router = useRouter()
  const [responses, setResponses] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [evaluating, setEvaluating] = useState(false)
  const [sending, setSending] = useState(false)
  const [jobs, setJobs] = useState<any[]>([])
  const [jobId, setJobId] = useState('')
  const [candidates, setCandidates] = useState<any[]>([])
  const [inviteCandidate, setInviteCandidate] = useState('')
  const [showInvite, setShowInvite] = useState(false)
  const [msg, setMsg] = useState('')
  const videoRef = useRef<HTMLVideoElement>(null)

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : ''

  useEffect(() => {
    fetchResponses()
    fetch(`${API}/api/jobs/public`)
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setJobs(d) })
  }, [])

  useEffect(() => {
    if (!jobId) return
    fetch(`${API}/api/applications/job/${jobId}`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(r => r.json()).then(d => setCandidates(Array.isArray(d) ? d : []))
  }, [jobId])

  const fetchResponses = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API}/api/interviews/responses`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setResponses(Array.isArray(data) ? data : [])
    } catch { setResponses([]) }
    setLoading(false)
  }

  const evaluate = async (interviewId: string) => {
    setEvaluating(true)
    setMsg('')
    try {
      const res = await fetch(`${API}/api/interviews/${interviewId}/evaluate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (res.ok) {
        setMsg('âœ… Evaluation complete!')
        fetchResponses()
        setSelected((prev: any) => prev ? { ...prev, videoScore: data.videoScore } : prev)
      } else {
        setMsg(`âŒ ${data.error || 'Evaluation failed'}`)
      }
    } catch { setMsg('âŒ Network error') }
    setEvaluating(false)
  }

  const sendInvite = async () => {
    if (!inviteCandidate || !jobId) return
    setSending(true)
    setMsg('')
    try {
      const res = await fetch(`${API}/api/interviews/invite`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId: inviteCandidate })
      })
      const data = await res.json()
      if (res.ok) {
        setMsg('âœ… Invite sent successfully!')
        setShowInvite(false)
     } else {
  setMsg(`âŒ ${data.message || data.error || 'Failed to send invite'}`)
}
    } catch { setMsg('âŒ Network error') }
    setSending(false)
  }

  const statusColor = (s: string) => ({
    INVITED: '#f59e0b', COMPLETED: '#10b981', EVALUATED: '#667eea', PENDING: '#6b7280'
  }[s] || '#6b7280')

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f0c29, #1a1a2e, #16213e)', fontFamily: 'Segoe UI, sans-serif' }}>
      {/* Nav */}
      <nav style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '14px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 38, height: 38, background: 'linear-gradient(135deg, #667eea, #764ba2)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'white', fontWeight: 'bold', fontSize: 17 }}>R</span>
          </div>
          <span style={{ color: 'white', fontWeight: 700, fontSize: 15 }}>Recruitment Using AI</span>
        </div>
        <button onClick={() => router.push('/dashboard')} style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, border: 'none', background: 'none', cursor: 'pointer' }}>â† Back to Dashboard</button>
      </nav>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 52, height: 52, background: 'linear-gradient(135deg, #667eea, #764ba2)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>ðŸŽ¥</div>
            <div>
              <h2 style={{ color: 'white', fontSize: 24, fontWeight: 800, margin: 0 }}>Video Response Evaluation</h2>
              <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: 13, margin: '4px 0 0' }}>AI-powered behavioral interview analysis</p>
            </div>
          </div>
          <button onClick={() => setShowInvite(!showInvite)}
            style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', padding: '10px 20px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
            + Send Interview Invite
          </button>
        </div>

        {/* Invite Panel */}
        {showInvite && (
          <div style={{ background: 'rgba(102,126,234,0.08)', border: '1px solid rgba(102,126,234,0.25)', borderRadius: 16, padding: '24px', marginBottom: 24 }}>
            <h3 style={{ color: 'white', fontSize: 16, fontWeight: 700, margin: '0 0 16px' }}>ðŸ“¨ Send Video Interview Invite</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 12, alignItems: 'end' }}>
              <div>
                <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.06em', display: 'block', marginBottom: 8 }}>Select Job</label>
                <select value={jobId} onChange={e => { setJobId(e.target.value); setInviteCandidate('') }}
                  style={{ width: '100%', background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '11px 14px', color: 'white', fontSize: 13, outline: 'none' }}>
                  <option value="">-- Select Job --</option>
                  {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
                </select>
              </div>
              <div>
                <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.06em', display: 'block', marginBottom: 8 }}>Select Candidate</label>
                <select value={inviteCandidate} onChange={e => setInviteCandidate(e.target.value)}
                  style={{ width: '100%', background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '11px 14px', color: 'white', fontSize: 13, outline: 'none' }}>
                  <option value="">-- Select Candidate --</option>
                  {candidates.map((c, i) => <option key={c.id} value={c.id}>Candidate #{i + 1} â€” Score: {c.resumeScore?.overallScore ?? 'N/A'}</option>)}
                </select>
              </div>
              <button onClick={sendInvite} disabled={sending || !inviteCandidate}
                style={{ background: sending ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #10b981, #059669)', color: 'white', padding: '11px 22px', borderRadius: 10, border: 'none', cursor: sending ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap' as const }}>
                {sending ? 'Sending...' : 'ðŸ“¨ Send Invite'}
              </button>
            </div>
          </div>
        )}

        {msg && (
          <div style={{ background: msg.startsWith('âœ…') ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${msg.startsWith('âœ…') ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`, borderRadius: 10, padding: '12px 16px', marginBottom: 20 }}>
            <p style={{ color: msg.startsWith('âœ…') ? '#34d399' : '#f87171', fontSize: 13, margin: 0, fontWeight: 600 }}>{msg}</p>
          </div>
        )}

        {/* Main Grid */}
        {loading ? (
          <p style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: '60px 0' }}>Loading responses...</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 20 }}>
            {/* Left: Response List */}
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: '0 0 8px' }}>{responses.length} video responses</p>
              {responses.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px 20px', background: 'rgba(255,255,255,0.03)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.07)' }}>
                  <p style={{ fontSize: 32 }}>ðŸ“­</p>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>No video responses yet</p>
                  <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11 }}>Send invites to candidates above</p>
                </div>
              )}
              {responses.map((r: any, i: number) => {
                const sc = r.videoScore?.relevanceScore ?? null
                const isSelected = selected?.id === r.id
                return (
                  <div key={r.id} onClick={() => setSelected(r)}
                    style={{ background: isSelected ? 'rgba(102,126,234,0.15)' : 'rgba(255,255,255,0.04)', border: isSelected ? '1px solid rgba(102,126,234,0.4)' : '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '16px 18px', cursor: 'pointer', transition: 'all 0.2s' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <p style={{ color: 'white', fontSize: 13, fontWeight: 600, margin: '0 0 4px' }}>Response #{i + 1}</p>
                        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, margin: '0 0 8px' }}>{r.applicationId?.slice(0, 20)}...</p>
                        <span style={{ background: `${statusColor(r.status)}22`, color: statusColor(r.status), fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 50, border: `1px solid ${statusColor(r.status)}44` }}>
                          {r.status}
                        </span>
                      </div>
                      {sc !== null && (
                        <span style={{ color: sc >= 70 ? '#10b981' : sc >= 50 ? '#f59e0b' : '#ef4444', fontSize: 22, fontWeight: 800 }}>{sc}</span>
                      )}
                    </div>
                    {r.videoUrl && <p style={{ color: 'rgba(102,126,234,0.7)', fontSize: 11, margin: '8px 0 0' }}>ðŸŽ¥ Video available</p>}
                  </div>
                )
              })}
            </div>

            {/* Right: Detail Panel */}
            <div>
              {!selected ? (
                <div style={{ textAlign: 'center', padding: '80px 0', background: 'rgba(255,255,255,0.03)', borderRadius: 20, border: '1px solid rgba(255,255,255,0.07)' }}>
                  <p style={{ fontSize: 40 }}>ðŸ‘ˆ</p>
                  <p style={{ color: 'rgba(255,255,255,0.4)' }}>Select a response to view details</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 16 }}>
                  {/* Video Player */}
                  {selected.videoUrl && (
                    <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '20px', overflow: 'hidden' }}>
                      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.06em', margin: '0 0 12px' }}>ðŸŽ¥ Video Response</p>
                      <video ref={videoRef} src={selected.videoUrl} controls
                        style={{ width: '100%', borderRadius: 12, background: '#000', maxHeight: 340 }} />
                    </div>
                  )}

                  {/* Transcript */}
                  {selected.transcript && (
                    <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '20px 24px' }}>
                      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.06em', margin: '0 0 12px' }}>ðŸ“ Transcript</p>
                      <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, lineHeight: 1.8, margin: 0, whiteSpace: 'pre-wrap' as const }}>{selected.transcript}</p>
                    </div>
                  )}

                  {/* AI Scores */}
                  {selected.videoScore ? (
                    <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '20px 24px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.06em', margin: 0 }}>ðŸ¤– AI Evaluation</p>
                        <span style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 50, border: '1px solid rgba(16,185,129,0.3)' }}>âœ… Evaluated</span>
                      </div>
                      <ScoreBar label="Relevance Score" value={selected.videoScore.relevanceScore ?? 0} />
                      <ScoreBar label="Communication" value={selected.videoScore.communicationScore ?? 0} />
                      <ScoreBar label="Behavioral Score" value={selected.videoScore.behavioralScore ?? 0} />
                      {selected.videoScore.feedback && (
                        <div style={{ marginTop: 16, background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '14px 16px', borderLeft: '3px solid #764ba2' }}>
                          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 600, margin: '0 0 6px', textTransform: 'uppercase' as const }}>AI Feedback</p>
                          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, lineHeight: 1.7, margin: 0 }}>{selected.videoScore.feedback}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '24px', textAlign: 'center' as const }}>
                      <p style={{ fontSize: 36, margin: '0 0 12px' }}>ðŸ¤–</p>
                      <p style={{ color: 'white', fontSize: 15, fontWeight: 600, margin: '0 0 6px' }}>Ready to Evaluate</p>
                      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, margin: '0 0 20px' }}>
                        {selected.transcript ? 'Transcript available â€” run AI evaluation' : 'Waiting for candidate video submission'}
                      </p>
                      {selected.transcript && (
                        <button onClick={() => evaluate(selected.id)} disabled={evaluating}
                          style={{ background: evaluating ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', padding: '12px 28px', borderRadius: 12, border: 'none', cursor: evaluating ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 700 }}>
                          {evaluating ? 'â³ Evaluating...' : 'ðŸ¤– Run AI Evaluation'}
                        </button>
                      )}
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
