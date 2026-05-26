'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

type Candidate = {
  id: string
  candidateName: string
  candidateEmail: string
  resumeScore: number
  status: string
  createdAt: string
  resumeUrl?: string
}

type Job = { id: string; title: string }

type FeedbackModal = {
  open: boolean
  candidate: Candidate | null
}

const getToken = () => (typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '')

// ✅ Inner component that uses useSearchParams (must be wrapped in Suspense)
function CandidatesContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [jobs, setJobs] = useState<Job[]>([])
  const [selectedJobId, setSelectedJobId] = useState('')
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(false)
  const [inviting, setInviting] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [inviteMsg, setInviteMsg] = useState<{ id: string; ok: boolean; text: string } | null>(null)

  const [feedbackModal, setFeedbackModal] = useState<FeedbackModal>({ open: false, candidate: null })
  const [feedbackDecision, setFeedbackDecision] = useState<'APPROVED' | 'REJECTED' | 'PENDING'>('PENDING')
  const [feedbackRating, setFeedbackRating] = useState(3)
  const [feedbackComment, setFeedbackComment] = useState('')
  const [submittingFeedback, setSubmittingFeedback] = useState(false)
  const [feedbackMsg, setFeedbackMsg] = useState<{ ok: boolean; text: string } | null>(null)

  useEffect(() => { fetchJobs() }, [])

  useEffect(() => {
    if (selectedJobId) fetchCandidates(selectedJobId)
  }, [selectedJobId])

  const fetchJobs = async () => {
    try {
      const res = await fetch(`${API}/api/jobs/public`)
      const data = res.ok ? await res.json() : []
      if (Array.isArray(data)) {
        setJobs(data)

        // Auto-select job based on jobTitle query param from bias page
        const jobTitleParam = searchParams.get('jobTitle')
        if (jobTitleParam && data.length > 0) {
          const matched = data.find((j: Job) =>
            j.title.toLowerCase() === decodeURIComponent(jobTitleParam).toLowerCase()
          )
          setSelectedJobId(matched ? matched.id : data[0].id)
        } else if (data.length > 0) {
          setSelectedJobId(data[0].id)
        }
      }
    } catch (e) { console.error(e) }
  }

  const fetchCandidates = async (jobId: string) => {
    setLoading(true)
    setMessage('')
    setCandidates([])
    const token = getToken()
    try {
      const res = await fetch(`${API}/api/applications/job/${jobId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) {
        const errText = await res.text()
        setMessage(`Error: ${res.status} - ${errText || 'Access denied'}`)
        setLoading(false)
        return
      }
      const data = await res.json()
      if (Array.isArray(data)) {
        const mapped: Candidate[] = data.map((a: any) => ({
          id: a.id,
          candidateName: (a.candidateName && a.candidateName !== a.candidateEmail)
            ? a.candidateName
            : a.candidateEmail
              ? a.candidateEmail.split('@')[0].replace(/[._\-0-9]/g, ' ').trim()
                  .replace(/\s+/g, ' ')
                  .split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ').trim()
              : 'Unknown',
          candidateEmail: a.candidateEmail || '',
          resumeScore: a.resumeScore?.overallScore || 0,
          status: a.status || 'APPLIED',
          createdAt: a.createdAt || new Date().toISOString(),
          resumeUrl: a.resumeUrl || '',
        }))
        mapped.sort((a, b) => b.resumeScore - a.resumeScore)
        setCandidates(mapped)
        if (mapped.length === 0) setMessage('No candidates found for this job.')
      }
    } catch (e) { setMessage('Network error loading candidates.') }
    setLoading(false)
  }

  const updateStatus = async (id: string, status: string) => {
    const token = getToken()
    try {
      await fetch(`${API}/api/applications/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status })
      })
      setCandidates(prev => prev.map(c => c.id === id ? { ...c, status } : c))
    } catch (e) { console.error(e) }
  }

  // ✅ FIXED: Changed URL from /api/interviews/invite to /api/applications/:id/invite
  const sendInvite = async (candidate: Candidate) => {
    setInviting(candidate.id)
    setInviteMsg(null)
    const token = getToken()
    if (!candidate.candidateEmail || !candidate.candidateEmail.includes('@')) {
      setInviteMsg({ id: candidate.id, ok: false, text: 'No valid email found for this candidate.' })
      setInviting(null)
      return
    }
    try {
      const res = await fetch(`${API}/api/applications/${candidate.id}/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await res.json()
      if (res.ok) {
        setCandidates(prev => prev.map(c =>
          c.id === candidate.id ? { ...c, status: 'INTERVIEW_SCHEDULED' } : c
        ))
        setInviteMsg({ id: candidate.id, ok: true, text: `✅ Invite sent to ${candidate.candidateEmail}` })
      } else {
        setInviteMsg({ id: candidate.id, ok: false, text: data.message || 'Failed to send invite' })
      }
    } catch (e) {
      setInviteMsg({ id: candidate.id, ok: false, text: 'Network error sending invite.' })
    }
    setInviting(null)
  }

  const openFeedbackModal = (candidate: Candidate) => {
    setFeedbackModal({ open: true, candidate })
    setFeedbackDecision('PENDING')
    setFeedbackRating(3)
    setFeedbackComment('')
    setFeedbackMsg(null)
  }

  const closeFeedbackModal = () => {
    setFeedbackModal({ open: false, candidate: null })
    setFeedbackMsg(null)
  }

  const submitFeedback = async () => {
    if (!feedbackModal.candidate) return
    setSubmittingFeedback(true)
    setFeedbackMsg(null)
    const token = getToken()
    try {
      const res = await fetch(`${API}/api/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          entityType: 'Application',
          entityId: feedbackModal.candidate.id,
          rating: feedbackRating,
          comment: feedbackComment,
          overrideDecision: feedbackDecision !== 'PENDING' ? feedbackDecision : undefined,
        })
      })
      const data = await res.json()
      if (res.ok) {
        setFeedbackMsg({ ok: true, text: 'Feedback submitted successfully!' })
        if (feedbackDecision !== 'PENDING') {
          const newStatus = feedbackDecision === 'APPROVED' ? 'SHORTLISTED' : 'REJECTED'
          setCandidates(prev => prev.map(c =>
            c.id === feedbackModal.candidate!.id ? { ...c, status: newStatus } : c
          ))
        }
        setTimeout(() => closeFeedbackModal(), 1500)
      } else {
        setFeedbackMsg({ ok: false, text: data.message || 'Failed to submit feedback.' })
      }
    } catch (e) {
      setFeedbackMsg({ ok: false, text: 'Network error submitting feedback.' })
    }
    setSubmittingFeedback(false)
  }

  const scoreColor = (s: number) => s >= 70 ? '#10b981' : s >= 50 ? '#f59e0b' : '#ef4444'
  const statusStyle = (s: string) => {
    if (s === 'SHORTLISTED' || s === 'INTERVIEW_INVITED' || s === 'INTERVIEW_SCHEDULED')
      return { bg: 'rgba(16,185,129,0.15)', color: '#10b981' }
    if (s === 'REJECTED')
      return { bg: 'rgba(239,68,68,0.15)', color: '#ef4444' }
    return { bg: 'rgba(102,126,234,0.15)', color: '#a78bfa' }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f0c29, #1a1a2e, #16213e)', fontFamily: 'Segoe UI, sans-serif' }}>

      {/* Feedback Modal */}
      {feedbackModal.open && feedbackModal.candidate && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: 'linear-gradient(135deg, #1a1a2e, #16213e)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: '32px', width: '100%', maxWidth: 480, boxShadow: '0 24px 80px rgba(0,0,0,0.6)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
              <div>
                <h3 style={{ color: 'white', fontSize: 18, fontWeight: 800, margin: 0 }}>Manager Feedback</h3>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: '4px 0 0' }}>
                  {feedbackModal.candidate.candidateName} — {feedbackModal.candidate.candidateEmail}
                </p>
              </div>
              <button onClick={closeFeedbackModal}
                style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: 'rgba(255,255,255,0.5)', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: 16 }}>
                ✕
              </button>
            </div>

            {/* Decision */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', display: 'block', marginBottom: 10 }}>DECISION</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {(['APPROVED', 'PENDING', 'REJECTED'] as const).map(d => {
                  const colors = {
                    APPROVED: { active: '#10b981', border: 'rgba(16,185,129,0.4)', bg: 'rgba(16,185,129,0.15)' },
                    PENDING:  { active: '#f59e0b', border: 'rgba(245,158,11,0.4)',  bg: 'rgba(245,158,11,0.15)' },
                    REJECTED: { active: '#ef4444', border: 'rgba(239,68,68,0.4)',   bg: 'rgba(239,68,68,0.15)' },
                  }
                  const col = colors[d]
                  const active = feedbackDecision === d
                  return (
                    <button key={d} onClick={() => setFeedbackDecision(d)}
                      style={{ flex: 1, padding: '10px 0', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                        border: `1px solid ${active ? col.border : 'rgba(255,255,255,0.1)'}`,
                        background: active ? col.bg : 'rgba(255,255,255,0.04)',
                        color: active ? col.active : 'rgba(255,255,255,0.4)' }}>
                      {d === 'APPROVED' ? 'Approve' : d === 'REJECTED' ? 'Reject' : 'Pending'}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Rating */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', display: 'block', marginBottom: 10 }}>
                RATING — {feedbackRating}/5
              </label>
              <div style={{ display: 'flex', gap: 6 }}>
                {[1, 2, 3, 4, 5].map(n => (
                  <button key={n} onClick={() => setFeedbackRating(n)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 28, color: n <= feedbackRating ? '#f59e0b' : 'rgba(255,255,255,0.15)', padding: '0 2px' }}>
                    ★
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', display: 'block', marginBottom: 10 }}>NOTES (OPTIONAL)</label>
              <textarea value={feedbackComment} onChange={e => setFeedbackComment(e.target.value)}
                placeholder="Add your notes about this candidate..." rows={3}
                style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: 'white', padding: '12px 14px', fontSize: 13, resize: 'vertical', fontFamily: 'Segoe UI, sans-serif', outline: 'none', boxSizing: 'border-box' }} />
            </div>

            {feedbackMsg && (
              <div style={{ background: feedbackMsg.ok ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${feedbackMsg.ok ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`, color: feedbackMsg.ok ? '#10b981' : '#f87171', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13 }}>
                {feedbackMsg.text}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={closeFeedbackModal}
                style={{ flex: 1, padding: '12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={submitFeedback} disabled={submittingFeedback}
                style={{ flex: 2, padding: '12px', borderRadius: 10, border: 'none', background: submittingFeedback ? 'rgba(102,126,234,0.4)' : 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', fontSize: 13, fontWeight: 700, cursor: submittingFeedback ? 'not-allowed' : 'pointer' }}>
                {submittingFeedback ? 'Submitting...' : 'Submit Feedback'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '14px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 38, height: 38, background: 'linear-gradient(135deg, #667eea, #764ba2)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'white', fontWeight: 'bold', fontSize: 17 }}>R</span>
          </div>
          <span style={{ color: 'white', fontWeight: 700, fontSize: 15 }}>Recruitment Using AI</span>
        </div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <button onClick={() => router.push('/dashboard/bias')}
            style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '6px 14px', cursor: 'pointer' }}>
            ⚖️ Bias Audit
          </button>
          <button onClick={() => router.push('/dashboard')}
            style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, border: 'none', background: 'none', cursor: 'pointer' }}>
            ← Back to Dashboard
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ color: 'white', fontSize: 24, fontWeight: 800, margin: 0 }}>Resume Screening</h2>
          <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: 13, margin: '4px 0 0' }}>AI-powered candidate screening and interview invites</p>
        </div>

        {/* Job Selector */}
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '20px 24px', marginBottom: 24 }}>
          <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', display: 'block', marginBottom: 10 }}>SELECT JOB</label>
          <select value={selectedJobId} onChange={e => setSelectedJobId(e.target.value)}
            style={{ width: '100%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, color: 'white', padding: '11px 14px', fontSize: 14 }}>
            {jobs.map(j => <option key={j.id} value={j.id} style={{ background: '#1a1a2e' }}>{j.title}</option>)}
          </select>
        </div>

        {/* Invite message banner */}
        {inviteMsg && (
          <div style={{ background: inviteMsg.ok ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${inviteMsg.ok ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`, color: inviteMsg.ok ? '#10b981' : '#f87171', borderRadius: 10, padding: '12px 18px', marginBottom: 16, fontSize: 13 }}>
            {inviteMsg.text}
          </div>
        )}

        {/* Candidates Table */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 110px 160px 280px', gap: 16, padding: '12px 24px', background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            {['Candidate', 'Score', 'Status', 'Actions'].map(h => (
              <span key={h} style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</span>
            ))}
          </div>

          {loading ? (
            <p style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '60px 0' }}>Loading candidates...</p>
          ) : message ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <p style={{ color: message.startsWith('Error') ? '#f87171' : 'rgba(255,255,255,0.4)' }}>{message}</p>
            </div>
          ) : candidates.map((c, i) => {
            const ss = statusStyle(c.status)
            const isInvited = c.status === 'INTERVIEW_INVITED' || c.status === 'INTERVIEW_SCHEDULED'
            return (
              <div key={c.id}
                style={{ display: 'grid', gridTemplateColumns: '1fr 110px 160px 280px', gap: 16, padding: '16px 24px', borderBottom: i < candidates.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', alignItems: 'center' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>

                {/* Candidate Info */}
                <div>
                  <p style={{ color: 'white', fontSize: 13, fontWeight: 600, margin: 0 }}>{c.candidateName}</p>
                  <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, margin: '2px 0 0' }}>{c.candidateEmail}</p>
                </div>

                {/* Score Bar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 99 }}>
                    <div style={{ width: `${c.resumeScore}%`, height: '100%', background: scoreColor(c.resumeScore), borderRadius: 99 }} />
                  </div>
                  <span style={{ color: scoreColor(c.resumeScore), fontSize: 13, fontWeight: 700, minWidth: 28 }}>{c.resumeScore}</span>
                </div>

                {/* Status Badge */}
                <span style={{ background: ss.bg, color: ss.color, fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 50, whiteSpace: 'nowrap', display: 'inline-block' }}>
                  {c.status.replace(/_/g, ' ')}
                </span>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {/* Invite — hidden if already invited/rejected */}
                  {!isInvited && c.status !== 'REJECTED' && (
                    <button onClick={() => sendInvite(c)} disabled={inviting === c.id}
                      style={{ padding: '6px 10px', borderRadius: 8, border: 'none', background: inviting === c.id ? 'rgba(102,126,234,0.3)' : 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', fontSize: 11, fontWeight: 700, cursor: inviting === c.id ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}>
                      {inviting === c.id ? '...' : '📨 Invite'}
                    </button>
                  )}
                  {/* Shortlist */}
                  {c.status !== 'SHORTLISTED' && c.status !== 'REJECTED' && (
                    <button onClick={() => updateStatus(c.id, 'SHORTLISTED')}
                      style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.1)', color: '#10b981', fontSize: 11, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                      ✓ Shortlist
                    </button>
                  )}
                  {/* Reject */}
                  {c.status !== 'REJECTED' && (
                    <button onClick={() => updateStatus(c.id, 'REJECTED')}
                      style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.1)', color: '#f87171', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                      ✕ Reject
                    </button>
                  )}
                  {/* Feedback — always visible */}
                  <button onClick={() => openFeedbackModal(c)}
                    style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid rgba(102,126,234,0.3)', background: 'rgba(102,126,234,0.1)', color: '#a78bfa', fontSize: 11, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    💬 Feedback
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

// ✅ Default export wraps in Suspense (required for useSearchParams in Next.js)
export default function CandidatesPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f0c29, #1a1a2e, #16213e)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>Loading...</p>
      </div>
    }>
      <CandidatesContent />
    </Suspense>
  )
}