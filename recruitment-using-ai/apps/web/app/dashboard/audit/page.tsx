'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const API = 'http://localhost:5000'

type LogEntry = {
  id: string
  timestamp: string
  type: 'RESUME_SCORE' | 'VIDEO_EVAL' | 'SHORTLIST' | 'OFFER' | 'BIAS_CHECK' | 'FEEDBACK'
  action: string
  candidate: string
  job: string
  score?: number
  decision?: string
  aiModel?: string
}

const TYPE_CONFIG: Record<string, { color: string; icon: string; label: string }> = {
  RESUME_SCORE: { color: '#10b981', icon: '📋', label: 'Resume Scoring' },
  VIDEO_EVAL:   { color: '#667eea', icon: '🎥', label: 'Video Evaluation' },
  SHORTLIST:    { color: '#a78bfa', icon: '⚖️', label: 'Shortlisted' },
  OFFER:        { color: '#f59e0b', icon: '📝', label: 'Offer Generated' },
  BIAS_CHECK:   { color: '#f97316', icon: '🔍', label: 'Bias Audit' },
  FEEDBACK:     { color: '#ec4899', icon: '💬', label: 'Manager Feedback' },
}

export default function AuditLogPage() {
  const router = useRouter()
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('ALL')
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : ''

  useEffect(() => { fetchAuditData() }, [])

  const fetchAuditData = async () => {
    setLoading(true)
    try {
      const entries: LogEntry[] = []

      const jobsRes = await fetch(`${API}/api/jobs/public`)
      const jobs = jobsRes.ok ? await jobsRes.json() : []

      if (Array.isArray(jobs)) {
        for (const job of jobs) {
          const appsRes = await fetch(`${API}/api/applications/job/${job.id}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          if (!appsRes.ok) continue
          const apps = await appsRes.json()

          if (Array.isArray(apps)) {
            apps.forEach((a: any) => {
              if (a.resumeScore) {
                entries.push({
                  id: `resume-${a.id}`,
                  timestamp: a.createdAt || a.updatedAt || new Date().toISOString(),
                  type: 'RESUME_SCORE',
                  action: 'AI scored resume',
                  candidate: a.candidateId || a.candidateEmail || a.candidateName || 'Unknown',
                  job: job.title || 'Unknown Job',
                  score: a.resumeScore?.overallScore,
                  decision: a.resumeScore?.overallScore >= 70 ? 'RECOMMENDED' : 'REVIEW',
                  aiModel: 'claude-sonnet-4',
                })
              }
              if (a.status === 'SHORTLISTED') {
                entries.push({
                  id: `shortlist-${a.id}`,
                  timestamp: a.updatedAt || a.createdAt || new Date().toISOString(),
                  type: 'SHORTLIST',
                  action: 'Candidate shortlisted',
                  candidate: a.candidateId || a.candidateEmail || a.candidateName || 'Unknown',
                  job: job.title || 'Unknown Job',
                  decision: 'SHORTLISTED',
                  aiModel: 'claude-sonnet-4',
                })
              }
              if (a.interview?.videoScore) {
                entries.push({
                  id: `video-${a.id}`,
                  timestamp: a.interview.updatedAt || a.interview.createdAt || new Date().toISOString(),
                  type: 'VIDEO_EVAL',
                  action: 'AI evaluated video response',
                  candidate: a.candidateId || a.candidateEmail || a.candidateName || 'Unknown',
                  job: job.title || 'Unknown Job',
                  score: a.interview.videoScore?.relevanceScore,
                  decision: a.interview.videoScore?.relevanceScore >= 70 ? 'STRONG' : 'AVERAGE',
                  aiModel: 'claude-sonnet-4',
                })
              }
            })
          }
        }
      }

      const feedbackRes = await fetch(`${API}/api/feedback/history`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (feedbackRes.ok) {
        const feedbacks = await feedbackRes.json()
        if (Array.isArray(feedbacks)) {
          feedbacks.forEach((f: any) => {
            entries.push({
              id: `feedback-${f.id}`,
              timestamp: f.createdAt || new Date().toISOString(),
              type: 'FEEDBACK',
              action: `Manager ${f.decision || 'reviewed'} candidate`,
              candidate: f.application?.candidateEmail || f.application?.candidateName || 'Unknown',
              job: f.application?.job?.title || 'Unknown Job',
              decision: f.decision,
              aiModel: 'Human Override',
            })
          })
        }
      }

      entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      setLogs(entries)
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  const filtered = filter === 'ALL' ? logs : logs.filter(l => l.type === filter)

  const stats = {
    total: logs.length,
    resume: logs.filter(l => l.type === 'RESUME_SCORE').length,
    video: logs.filter(l => l.type === 'VIDEO_EVAL').length,
    shortlist: logs.filter(l => l.type === 'SHORTLIST').length,
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
        <button onClick={() => router.push('/dashboard')} style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, border: 'none', background: 'none', cursor: 'pointer' }}>← Back to Dashboard</button>
      </nav>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 32 }}>
          <div style={{ width: 52, height: 52, background: 'linear-gradient(135deg, #667eea, #764ba2)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>🗂️</div>
          <div>
            <h2 style={{ color: 'white', fontSize: 24, fontWeight: 800, margin: 0 }}>AI Decision Audit Log</h2>
            <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: 13, margin: '4px 0 0' }}>Complete trail of every AI decision in the pipeline</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
          {[
            { label: 'Total Decisions', value: stats.total,     icon: '🗂️', color: '#667eea' },
            { label: 'Resume Scores',   value: stats.resume,    icon: '📋', color: '#10b981' },
            { label: 'Video Evals',     value: stats.video,     icon: '🎥', color: '#a78bfa' },
            { label: 'Shortlisted',     value: stats.shortlist, icon: '⚖️', color: '#f59e0b' },
          ].map(s => (
            <div key={s.label} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '18px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: 0 }}>{s.label}</p>
                  <p style={{ color: 'white', fontSize: 28, fontWeight: 800, margin: '4px 0 0' }}>{loading ? '...' : s.value}</p>
                </div>
                <span style={{ fontSize: 28 }}>{s.icon}</span>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' as const }}>
          {['ALL', 'RESUME_SCORE', 'VIDEO_EVAL', 'SHORTLIST', 'OFFER', 'FEEDBACK'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding: '7px 16px', borderRadius: 50, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: '1px solid', transition: 'all 0.2s',
                background: filter === f ? 'linear-gradient(135deg, #667eea, #764ba2)' : 'rgba(255,255,255,0.05)',
                borderColor: filter === f ? 'transparent' : 'rgba(255,255,255,0.1)',
                color: filter === f ? 'white' : 'rgba(255,255,255,0.5)' }}>
              {f === 'ALL' ? 'All Decisions' : TYPE_CONFIG[f]?.label || f}
            </button>
          ))}
        </div>

        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr 1fr 1fr 80px 120px', gap: 16, padding: '12px 24px', background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            {['Timestamp', 'Action', 'Candidate', 'Job', 'Score', 'Decision'].map(h => (
              <span key={h} style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>{h}</span>
            ))}
          </div>

          {loading ? (
            <p style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '60px 0' }}>Loading audit log...</p>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <p style={{ fontSize: 36 }}>📭</p>
              <p style={{ color: 'rgba(255,255,255,0.4)' }}>No decisions logged yet</p>
            </div>
          ) : filtered.map((log, i) => {
            const cfg = TYPE_CONFIG[log.type]
            return (
              <div key={log.id} style={{ display: 'grid', gridTemplateColumns: '160px 1fr 1fr 1fr 80px 120px', gap: 16, padding: '16px 24px', borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', alignItems: 'center' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <div>
                  <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, margin: 0 }}>{new Date(log.timestamp).toLocaleDateString()}</p>
                  <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, margin: '2px 0 0' }}>{new Date(log.timestamp).toLocaleTimeString()}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ background: `${cfg.color}22`, border: `1px solid ${cfg.color}44`, borderRadius: 8, padding: '4px 8px', fontSize: 16 }}>{cfg.icon}</span>
                  <div>
                    <p style={{ color: 'white', fontSize: 13, fontWeight: 600, margin: 0 }}>{log.action}</p>
                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, margin: '2px 0 0' }}>{log.aiModel}</p>
                  </div>
                </div>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{log.candidate}</p>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{log.job}</p>
                <p style={{ color: log.score !== undefined ? (log.score >= 70 ? '#10b981' : log.score >= 50 ? '#f59e0b' : '#ef4444') : 'rgba(255,255,255,0.3)', fontSize: 14, fontWeight: 700, margin: 0 }}>
                  {log.score !== undefined ? log.score : '—'}
                </p>
                <span style={{ background: log.decision === 'RECOMMENDED' || log.decision === 'STRONG' || log.decision === 'SHORTLISTED' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
                  color: log.decision === 'RECOMMENDED' || log.decision === 'STRONG' || log.decision === 'SHORTLISTED' ? '#10b981' : '#f59e0b',
                  fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 50, whiteSpace: 'nowrap' as const }}>
                  {log.decision || '—'}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}