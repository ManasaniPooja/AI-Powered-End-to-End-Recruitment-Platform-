﻿'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

function ScoreBar({ label, value }: { label: string; value: number }) {
  const color = value >= 70 ? '#10b981' : value >= 40 ? '#f59e0b' : '#ef4444'
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 5 }}>
        <span style={{ color: 'rgba(255,255,255,0.7)' }}>{label}</span>
        <span style={{ color, fontWeight: 700 }}>{value}%</span>
      </div>
      <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 6, height: 8 }}>
        <div style={{ width: `${value}%`, background: color, borderRadius: 6, height: 8 }} />
      </div>
    </div>
  )
}

type Candidate = {
  id: string
  candidateName: string
  candidateEmail: string
  resumeScore: number
  status: string
  videoScore?: {
    relevanceScore: number
    communicationScore: number
    behavioralScore: number
    perQuestionScores: Record<string, number>
  }
  interview?: {
    id: string
    status: string
    transcript?: string
    recordingUrl?: string
  }
}

type Job = { id: string; title: string }

export default function VideoEvaluationPage() {
  const router = useRouter()
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(false)
  const [jobId, setJobId] = useState('')
  const [jobs, setJobs] = useState<Job[]>([])
  const [selected, setSelected] = useState<Candidate | null>(null)
  const [evaluating, setEvaluating] = useState(false)
  const [evalMsg, setEvalMsg] = useState('')
  const [showInvite, setShowInvite] = useState(false)
  const [inviteCandidateId, setInviteCandidateId] = useState('')
  const [sending, setSending] = useState(false)
  const [msg, setMsg] = useState('')
  const [token, setToken] = useState('')
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    try {
      const t = localStorage.getItem('token') || ''
      if (!t) { router.push('/login'); return }
      setToken(t)
      fetchJobs()
    } catch (e) {
      console.error('Init error:', e)
    }
  }, [])

  useEffect(() => {
    if (jobId && token) fetchCandidates(jobId)
  }, [jobId, token])

  const fetchJobs = async () => {
    try {
      const res = await fetch(`${API}/api/jobs/public`)
      if (!res.ok) return
      const data = await res.json()
      const list = Array.isArray(data) ? data : (data.jobs || [])
      setJobs(list)
    } catch (e) {
      console.error('fetchJobs error:', e)
    }
  }

  const fetchCandidates = async (jId: string) => {
    setLoading(true)
    setCandidates([])
    try {
      const t = localStorage.getItem('token') || ''
      const res = await fetch(`${API}/api/applications/job/${jId}`, {
        headers: { Authorization: `Bearer ${t}` }
      })
      if (!res.ok) { setLoading(false); return }
      const data = await res.json()
      if (Array.isArray(data)) {
        const mapped: Candidate[] = data.map((a: any) => ({
          id: a.id,
          candidateName: a.candidateName || a.candidateId?.split('|')[0] || 'Unknown',
          candidateEmail: a.candidateEmail || '',
          resumeScore: a.resumeScore?.overallScore || 0,
          // ✅ FIX: normalize status to uppercase for consistent filtering
          status: (a.status || 'APPLIED').toUpperCase(),
          videoScore: a.videoScore || a.interview?.videoScore || undefined,
          interview: a.interview ? {
            id: a.interview.id,
            status: a.interview.status,
            transcript: a.interview.transcript || '',
            recordingUrl: a.interview.recordingUrl || '',
          } : undefined,
        }))
        setCandidates(mapped)
      }
    } catch (e) {
      console.error('fetchCandidates error:', e)
    }
    setLoading(false)
  }

  const sendInvite = async () => {
    if (!inviteCandidateId) return
    setSending(true)
    setMsg('')
    try {
      const t = localStorage.getItem('token') || ''
      const res = await fetch(`${API}/api/applications/${inviteCandidateId}/invite`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
      })
      const data = await res.json()
      if (res.ok) {
        setMsg('✅ Invite sent successfully!')
        setTimeout(() => {
          setShowInvite(false)
          setInviteCandidateId('')
          setMsg('')
        }, 1500)
        if (jobId) fetchCandidates(jobId)
      } else {
        setMsg(`❌ ${data.message || 'Failed to send invite'}`)
      }
    } catch {
      setMsg('❌ Network error')
    }
    setSending(false)
  }

  const evaluateInterview = async (interviewId: string) => {
    setEvaluating(true)
    setEvalMsg('')
    try {
      const t = localStorage.getItem('token') || ''
      const res = await fetch(`${API}/api/interviews/${interviewId}/evaluate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
      })
      const data = await res.json()
      if (res.ok) {
        setEvalMsg('✅ Evaluation complete!')
        if (jobId) fetchCandidates(jobId)
        setTimeout(() => setSelected(null), 1500)
      } else {
        setEvalMsg(`❌ ${data.message || 'Evaluation failed'}`)
      }
    } catch {
      setEvalMsg('❌ Network error')
    }
    setEvaluating(false)
  }

  // ✅ FIX 1: Added 'APPLIED' and 'REJECTED' so ALL candidates appear in invite dropdown
  // Previously only SHORTLISTED/INTERVIEWED/OFFERED were included — APPLIED & REJECTED were invisible
  const invitableCanditates = candidates.filter(c =>
    ['SHORTLISTED', 'INTERVIEWED', 'OFFERED', 'APPLIED', 'REJECTED'].includes(c.status)
  )

  // These are still used for stats cards only
  const shortlistedCount = candidates.filter(c =>
    ['SHORTLISTED', 'INTERVIEWED', 'OFFERED'].includes(c.status)
  )
  const withInterview = candidates.filter(c => c.interview)
  const completed = candidates.filter(c =>
    c.interview?.status === 'COMPLETED' || c.interview?.status === 'EVALUATED'
  )
  const evaluated = candidates.filter(c =>
    c.interview?.status === 'EVALUATED' && c.videoScore
  )

  const statusColor = (s: string) => {
    if (s === 'SHORTLISTED') return { bg: 'rgba(16,185,129,0.15)', color: '#10b981' }
    if (s === 'INTERVIEWED')  return { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b' }
    if (s === 'OFFERED')      return { bg: 'rgba(99,102,241,0.15)',  color: '#818cf8' }
    if (s === 'REJECTED')     return { bg: 'rgba(239,68,68,0.15)',   color: '#ef4444' }
    return { bg: 'rgba(102,126,234,0.15)', color: '#a78bfa' }
  }

  const interviewColor = (s: string) => {
    if (s === 'EVALUATED')   return { bg: 'rgba(16,185,129,0.15)',  color: '#10b981' }
    if (s === 'COMPLETED')   return { bg: 'rgba(245,158,11,0.15)',  color: '#f59e0b' }
    if (s === 'IN_PROGRESS') return { bg: 'rgba(99,102,241,0.15)',  color: '#818cf8' }
    return { bg: 'rgba(167,139,250,0.15)', color: '#a78bfa' }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f0c29, #1a1a2e, #16213e)', fontFamily: 'Segoe UI, sans-serif' }}>

      {/* ── Invite Modal ── */}
      {showInvite && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 24 }}>
          <div style={{ background: 'linear-gradient(135deg, #1a1a2e, #16213e)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: 32, width: 440, maxWidth: '90vw' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h3 style={{ color: 'white', fontSize: 18, fontWeight: 800, margin: 0 }}>📨 Send Interview Invite</h3>
              <button onClick={() => { setShowInvite(false); setMsg('') }}
                style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: 'rgba(255,255,255,0.5)', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: 16 }}>✕</button>
            </div>

            <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', display: 'block', marginBottom: 10 }}>SELECT CANDIDATE</label>

            <select
              value={inviteCandidateId}
              onChange={e => setInviteCandidateId(e.target.value)}
              style={{ width: '100%', marginBottom: 8, padding: '11px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.12)', fontSize: 14, background: 'rgba(255,255,255,0.07)', color: 'white' }}>
              <option value="" style={{ background: '#1a1a2e' }}>-- Choose candidate --</option>
              {/* ✅ FIX 1: Now uses invitableCandidates which includes ALL statuses */}
              {invitableCanditates.map(c => (
                <option key={c.id} value={c.id} style={{ background: '#1a1a2e' }}>
                  {c.candidateName} — {c.candidateEmail} ({c.status})
                </option>
              ))}
            </select>

            {/* ✅ FIX 3: Show helpful message when no candidates exist */}
            {invitableCanditates.length === 0 && (
              <p style={{ color: '#f59e0b', fontSize: 12, margin: '0 0 16px', padding: '8px 12px', background: 'rgba(245,158,11,0.08)', borderRadius: 8, border: '1px solid rgba(245,158,11,0.2)' }}>
                ⚠️ No candidates found for this job position. Make sure candidates have applied before sending invites.
              </p>
            )}

            {msg && (
              <div style={{ background: msg.startsWith('✅') ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${msg.startsWith('✅') ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`, color: msg.startsWith('✅') ? '#10b981' : '#f87171', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13 }}>
                {msg}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button
                onClick={sendInvite}
                disabled={sending || !inviteCandidateId}
                style={{ flex: 2, padding: '12px', borderRadius: 10, border: 'none', background: sending || !inviteCandidateId ? 'rgba(102,126,234,0.3)' : 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', fontSize: 13, fontWeight: 700, cursor: sending || !inviteCandidateId ? 'not-allowed' : 'pointer' }}>
                {sending ? '⏳ Sending…' : '📨 Send Invite'}
              </button>
              <button
                onClick={() => { setShowInvite(false); setMsg('') }}
                style={{ flex: 1, padding: '12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Evaluation Modal ── */}
      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 24 }}>
          <div style={{ background: 'linear-gradient(135deg, #1a1a2e, #16213e)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: 32, width: 560, maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div>
                <h3 style={{ color: 'white', fontSize: 18, fontWeight: 800, margin: 0 }}>
                  {selected.interview?.status === 'EVALUATED' ? '📊 Score Report' : '🔍 Evaluate Interview'}
                </h3>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: '4px 0 0' }}>
                  {selected.candidateName} — {selected.candidateEmail}
                </p>
              </div>
              <button onClick={() => { setSelected(null); setEvalMsg('') }}
                style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: 'rgba(255,255,255,0.5)', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: 16 }}>✕</button>
            </div>

            {selected.interview?.recordingUrl ? (
              <div style={{ marginBottom: 20 }}>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', marginBottom: 8 }}>🎬 RECORDING</p>
                <video ref={videoRef} src={selected.interview.recordingUrl} controls style={{ width: '100%', borderRadius: 10, background: '#000' }} />
              </div>
            ) : null}

            {selected.interview?.transcript ? (
              <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: 16, marginBottom: 20, maxHeight: 140, overflowY: 'auto' }}>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', margin: '0 0 8px' }}>📝 TRANSCRIPT</p>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{selected.interview.transcript}</p>
              </div>
            ) : null}

            {selected.videoScore ? (
              <div>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', marginBottom: 16 }}>SCORES</p>
                <ScoreBar label="Relevance"     value={selected.videoScore.relevanceScore} />
                <ScoreBar label="Communication" value={selected.videoScore.communicationScore} />
                <ScoreBar label="Behavioral"    value={selected.videoScore.behavioralScore} />
                {selected.videoScore.perQuestionScores
                  ? Object.entries(selected.videoScore.perQuestionScores).map(([q, s]) => (
                      <ScoreBar key={q} label={`Q${q}`} value={Number(s)} />
                    ))
                  : null}
              </div>
            ) : (
              <div>
                {evalMsg && (
                  <div style={{ background: evalMsg.startsWith('✅') ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${evalMsg.startsWith('✅') ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`, color: evalMsg.startsWith('✅') ? '#10b981' : '#f87171', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13 }}>
                    {evalMsg}
                  </div>
                )}
                <button
                  onClick={() => { if (selected.interview?.id) evaluateInterview(selected.interview.id) }}
                  disabled={evaluating}
                  style={{ width: '100%', background: evaluating ? 'rgba(139,92,246,0.4)' : 'linear-gradient(135deg, #8b5cf6, #6d28d9)', color: 'white', border: 'none', borderRadius: 10, padding: '13px 0', fontWeight: 700, fontSize: 14, cursor: evaluating ? 'not-allowed' : 'pointer' }}>
                  {evaluating ? '⏳ Evaluating with AI…' : '🚀 Run AI Evaluation'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Nav ── */}
      <nav style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '14px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 38, height: 38, background: 'linear-gradient(135deg, #667eea, #764ba2)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'white', fontWeight: 'bold', fontSize: 17 }}>R</span>
          </div>
          <span style={{ color: 'white', fontWeight: 700, fontSize: 15 }}>Recruitment Using AI</span>
        </div>
        <button onClick={() => router.push('/dashboard')}
          style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, border: 'none', background: 'none', cursor: 'pointer' }}>
          ← Back to Dashboard
        </button>
      </nav>

      {/* ── Main Content ── */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px' }}>

        <div style={{ marginBottom: 28 }}>
          <h2 style={{ color: 'white', fontSize: 24, fontWeight: 800, margin: 0 }}>🎥 Video Response Evaluation</h2>
          <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: 13, margin: '4px 0 0' }}>Send interview invites & evaluate candidate video responses</p>
        </div>

        {/* Job Selector */}
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '20px 24px', marginBottom: 24 }}>
          <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', display: 'block', marginBottom: 10 }}>SELECT JOB POSITION</label>
          <select value={jobId} onChange={e => { setJobId(e.target.value); setSelected(null) }}
            style={{ width: '100%', maxWidth: 420, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, color: 'white', padding: '11px 14px', fontSize: 14 }}>
            <option value="" style={{ background: '#1a1a2e' }}>-- Choose a job --</option>
            {jobs.map(j => <option key={j.id} value={j.id} style={{ background: '#1a1a2e' }}>{j.title}</option>)}
          </select>
        </div>

        {!jobId ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'rgba(255,255,255,0.2)' }}>
            <div style={{ fontSize: 52, marginBottom: 14 }}>🎬</div>
            <p style={{ fontSize: 15 }}>Select a job to manage video interviews</p>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
              {[
                { label: 'Shortlisted', value: shortlistedCount.length, color: '#6366f1', icon: '📋' },
                { label: 'Invited',     value: withInterview.length,    color: '#a78bfa', icon: '📨' },
                { label: 'Completed',   value: completed.length,        color: '#f59e0b', icon: '✅' },
                { label: 'Evaluated',   value: evaluated.length,        color: '#10b981', icon: '🏆' },
              ].map(s => (
                <div key={s.label} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '20px' }}>
                  <div style={{ fontSize: 22, marginBottom: 8 }}>{s.icon}</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* ✅ FIX 2: Button disabled when no job selected or no candidates */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
              <button
                onClick={() => { setShowInvite(true); setMsg(''); setInviteCandidateId('') }}
                disabled={!jobId || candidates.length === 0}
                title={candidates.length === 0 ? 'No candidates found for this position' : 'Send interview invite'}
                style={{
                  background: candidates.length === 0
                    ? 'rgba(102,126,234,0.3)'
                    : 'linear-gradient(135deg, #667eea, #764ba2)',
                  color: 'white', border: 'none', borderRadius: 10,
                  padding: '10px 20px', fontWeight: 700,
                  cursor: candidates.length === 0 ? 'not-allowed' : 'pointer',
                  fontSize: 13, opacity: candidates.length === 0 ? 0.6 : 1
                }}>
                📨 Send Interview Invite
              </button>
            </div>

            {/* Table */}
            {loading ? (
              <div style={{ textAlign: 'center', padding: 60, color: 'rgba(255,255,255,0.3)' }}>Loading candidates…</div>
            ) : candidates.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 60, color: 'rgba(255,255,255,0.2)' }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>🙅</div>
                <p>No candidates found for this job.</p>
              </div>
            ) : (
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, overflow: 'hidden' }}>
                {/* Header */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1.6fr 80px 130px 130px 200px', gap: 12, padding: '12px 24px', background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                  {['Candidate', 'Email', 'Score', 'Status', 'Interview', 'Actions'].map(h => (
                    <span key={h} style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</span>
                  ))}
                </div>

                {candidates.map((c, i) => {
                  const ss = statusColor(c.status)
                  const ic = c.interview ? interviewColor(c.interview.status) : null
                  return (
                    <div key={c.id}
                      style={{ display: 'grid', gridTemplateColumns: '1.4fr 1.6fr 80px 130px 130px 200px', gap: 12, padding: '16px 24px', borderBottom: i < candidates.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', alignItems: 'center' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>

                      <p style={{ color: 'white', fontSize: 13, fontWeight: 600, margin: 0 }}>{c.candidateName}</p>
                      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: 0 }}>{c.candidateEmail}</p>
                      <span style={{ color: c.resumeScore >= 70 ? '#10b981' : c.resumeScore >= 40 ? '#f59e0b' : '#ef4444', fontWeight: 700, fontSize: 14 }}>
                        {c.resumeScore}
                      </span>

                      <span style={{ background: ss.bg, color: ss.color, fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 50, whiteSpace: 'nowrap', display: 'inline-block' }}>
                        {c.status}
                      </span>

                      {c.interview && ic ? (
                        <span style={{ background: ic.bg, color: ic.color, fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 50, whiteSpace: 'nowrap', display: 'inline-block' }}>
                          {c.interview.status}
                        </span>
                      ) : (
                        <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>—</span>
                      )}

                      <div style={{ display: 'flex', gap: 6 }}>
                        {c.interview?.status === 'COMPLETED' && (
                          <button onClick={() => setSelected(c)}
                            style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 7, padding: '5px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                            🔍 Evaluate
                          </button>
                        )}
                        {c.interview?.status === 'EVALUATED' && (
                          <button onClick={() => setSelected(c)}
                            style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 7, padding: '5px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                            📊 View Score
                          </button>
                        )}
                        {/* ✅ FIX: Show Invite button for ALL candidates without an interview, not just shortlisted */}
                        {!c.interview && (
                          <button onClick={() => { setInviteCandidateId(c.id); setShowInvite(true); setMsg('') }}
                            style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', border: 'none', borderRadius: 7, padding: '5px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                            📨 Invite
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}