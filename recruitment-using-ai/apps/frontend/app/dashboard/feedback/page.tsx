'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

type FeedbackEntry = {
  id: string
  candidateName: string
  candidateEmail: string
  jobTitle: string
  decision: string
  rating: number
  notes: string
  createdAt: string
  managerName: string
}

const getToken = () => (typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '')

export default function FeedbackPage() {
  const router = useRouter()
  const [feedbacks, setFeedbacks] = useState<FeedbackEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('ALL')

  useEffect(() => { fetchFeedback() }, [])

  const fetchFeedback = async () => {
    setLoading(true)
    const token = getToken()
    try {
      const res = await fetch(`${API}/api/feedback/history`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) { setLoading(false); return }
      const data = await res.json()

      if (Array.isArray(data)) {
        // Backend returns auditLog rows — inputData holds rating/comment/overrideDecision
        const mapped: FeedbackEntry[] = data.map((log: any) => {
          const input = log.inputData || {}
          const decision = input.overrideDecision || 'PENDING'
          return {
            id: log.id,
            // auditLog has no joined candidate — show entityId as fallback
            candidateName: log.candidateName || log.entityId || 'Candidate',
            candidateEmail: log.candidateEmail || '',
            jobTitle: log.jobTitle || '',
            decision: decision.toUpperCase(),
            rating: input.rating || 0,
            notes: input.comment || '',
            createdAt: log.createdAt || new Date().toISOString(),
            managerName: log.actorName || log.actorId || 'HR Manager',
          }
        })
        mapped.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        setFeedbacks(mapped)
      }
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const filtered = filter === 'ALL' ? feedbacks : feedbacks.filter(f => f.decision === filter)

  const stats = {
    total: feedbacks.length,
    approved: feedbacks.filter(f => f.decision === 'APPROVED').length,
    rejected: feedbacks.filter(f => f.decision === 'REJECTED').length,
    pending: feedbacks.filter(f => f.decision === 'PENDING' || !f.decision).length,
  }

  const decisionColor = (d: string) =>
    d === 'APPROVED' ? { bg: 'rgba(16,185,129,0.15)', color: '#10b981' }
    : d === 'REJECTED' ? { bg: 'rgba(239,68,68,0.15)', color: '#ef4444' }
    : { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b' }

  const renderStars = (rating: number) =>
    [1, 2, 3, 4, 5].map(n => (
      <span key={n} style={{ color: n <= rating ? '#f59e0b' : 'rgba(255,255,255,0.15)', fontSize: 14 }}>★</span>
    ))

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
          <h2 style={{ color: 'white', fontSize: 24, fontWeight: 800, margin: 0 }}>💬 Manager Feedback</h2>
          <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: 13, margin: '4px 0 0' }}>Human override decisions and manager notes on candidates</p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
          {[
            { label: 'Total Feedback', value: stats.total,    icon: '💬', color: '#667eea' },
            { label: 'Approved',       value: stats.approved, icon: '✅', color: '#10b981' },
            { label: 'Rejected',       value: stats.rejected, icon: '❌', color: '#ef4444' },
            { label: 'Pending',        value: stats.pending,  icon: '⏳', color: '#f59e0b' },
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

        {/* Filter buttons */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {['ALL', 'APPROVED', 'REJECTED', 'PENDING'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{
                padding: '7px 16px', borderRadius: 50, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: '1px solid',
                background: filter === f ? 'linear-gradient(135deg, #667eea, #764ba2)' : 'rgba(255,255,255,0.05)',
                borderColor: filter === f ? 'transparent' : 'rgba(255,255,255,0.1)',
                color: filter === f ? 'white' : 'rgba(255,255,255,0.5)'
              }}>
              {f === 'ALL' ? 'All Feedback' : f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          ))}
          <button onClick={fetchFeedback}
            style={{ padding: '7px 16px', borderRadius: 50, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', marginLeft: 'auto' }}>
            🔄 Refresh
          </button>
        </div>

        {/* Feedback list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {loading ? (
            <p style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '60px 0' }}>Loading feedback...</p>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', background: 'rgba(255,255,255,0.03)', borderRadius: 20, border: '1px solid rgba(255,255,255,0.07)' }}>
              <p style={{ fontSize: 36 }}>💬</p>
              <p style={{ color: 'rgba(255,255,255,0.4)', margin: 0 }}>No feedback submitted yet</p>
              <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12, margin: '8px 0 0' }}>
                Go to Resume Screening, open a candidate, and click 💬 to submit feedback
              </p>
            </div>
          ) : filtered.map(fb => {
            const dc = decisionColor(fb.decision)
            return (
              <div key={fb.id}
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '20px 24px' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <p style={{ color: 'white', fontSize: 15, fontWeight: 700, margin: 0 }}>{fb.candidateName}</p>
                    {fb.candidateEmail && (
                      <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, margin: '3px 0 0' }}>
                        {fb.candidateEmail}{fb.jobTitle ? ` · ${fb.jobTitle}` : ''}
                      </p>
                    )}
                    {fb.rating > 0 && (
                      <div style={{ display: 'flex', gap: 2, marginTop: 6 }}>
                        {renderStars(fb.rating)}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ background: dc.bg, color: dc.color, fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 50 }}>
                      {fb.decision}
                    </span>
                    <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11 }}>
                      {new Date(fb.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                {fb.notes && (
                  <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '12px 16px', borderLeft: '3px solid rgba(102,126,234,0.5)' }}>
                    <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, margin: 0, lineHeight: 1.6 }}>💬 {fb.notes}</p>
                  </div>
                )}
                <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11, margin: '10px 0 0' }}>
                  Reviewed by {fb.managerName}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}