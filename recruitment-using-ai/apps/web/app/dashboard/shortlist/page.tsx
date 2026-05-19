'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const API = 'https://ai-powered-end-to-end-recruitment-platform-production.up.railway.app'

const DIMENSIONS = [
  { key: 'overallScore', label: 'Overall Score', icon: 'ðŸŽ¯' },
  { key: 'skillMatch', label: 'Skill Match', icon: 'ðŸ› ï¸' },
  { key: 'experienceMatch', label: 'Experience', icon: 'ðŸ“‹' },
  { key: 'educationMatch', label: 'Education', icon: 'ðŸŽ“' },
  { key: 'communicationScore', label: 'Communication', icon: 'ðŸ’¬' },
]

function ScoreBar({ value }: { value: number }) {
  const pct = Math.min(100, Math.max(0, value))
  const color = pct >= 75 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444'
  return (
    <div style={{ width: '100%', background: 'rgba(255,255,255,0.08)', borderRadius: 99, height: 8, marginTop: 4 }}>
      <div style={{ width: `${pct}%`, background: color, height: 8, borderRadius: 99, transition: 'width 0.6s ease' }} />
    </div>
  )
}

function Badge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    SHORTLISTED: { bg: 'rgba(16,185,129,0.12)', color: '#34d399', label: 'âœ… Shortlisted' },
    REJECTED:    { bg: 'rgba(239,68,68,0.12)',  color: '#f87171', label: 'âŒ Rejected' },
    PENDING:     { bg: 'rgba(245,158,11,0.12)', color: '#fbbf24', label: 'â³ Pending' },
    HIRED:       { bg: 'rgba(99,102,241,0.12)', color: '#a78bfa', label: 'ðŸŽ‰ Hired' },
  }
  const s = map[status] || { bg: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', label: status }
  return (
    <span style={{ background: s.bg, color: s.color, border: `1px solid ${s.color}33`, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 50 }}>
      {s.label}
    </span>
  )
}

export default function ShortlistPage() {
  const router = useRouter()
  const [jobs, setJobs] = useState<any[]>([])
  const [jobId, setJobId] = useState('')
  const [candidates, setCandidates] = useState<any[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [compareMode, setCompareMode] = useState(false)

  useEffect(() => {
    fetch(`${API}/api/jobs/public`)
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setJobs(d) })
  }, [])

  useEffect(() => {
    if (!jobId) return
    setLoading(true)
    setSelected([])
    setCompareMode(false)
    const token = localStorage.getItem('token') || ''
    fetch(`${API}/api/applications/job/${jobId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(d => {
        const arr = Array.isArray(d) ? d : []
        const sorted = arr.sort((a: any, b: any) => {
          const sa = a.resumeScore?.overallScore ?? 0
          const sb = b.resumeScore?.overallScore ?? 0
          return sb - sa
        })
        setCandidates(sorted)
        setLoading(false)
      })
  }, [jobId])

  const toggleSelect = (id: string) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 4 ? [...prev, id] : prev
    )
  }

  const compareCandidates = candidates.filter(c => selected.includes(c.id))

  const getScore = (app: any, key: string) => {
    const rs = app.resumeScore
    if (!rs) return 0
    if (key === 'overallScore') return rs.overallScore ?? 0
    if (key === 'skillMatch') return rs.skillMatch ?? rs.skillScore ?? 0
    if (key === 'experienceMatch') return rs.experienceMatch ?? rs.experienceScore ?? 0
    if (key === 'educationMatch') return rs.educationMatch ?? rs.educationScore ?? 0
    if (key === 'communicationScore') return rs.communicationScore ?? 0
    return 0
  }

  const getBest = (key: string) => {
    if (compareCandidates.length === 0) return null
    return compareCandidates.reduce((best, c) =>
      getScore(c, key) > getScore(best, key) ? c : best
    ).id
  }

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
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 32 }}>
          <div style={{ width: 52, height: 52, background: 'linear-gradient(135deg, #667eea, #764ba2)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>âš–ï¸</div>
          <div>
            <h2 style={{ color: 'white', fontSize: 24, fontWeight: 800, margin: 0 }}>Shortlist Comparison</h2>
            <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: 13, margin: '4px 0 0' }}>Select up to 4 candidates to compare side-by-side</p>
          </div>
        </div>

        {/* Job selector */}
        <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '20px 24px', marginBottom: 24 }}>
          <label style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 10 }}>Select Job</label>
          <select value={jobId} onChange={e => setJobId(e.target.value)}
            style={{ width: '100%', background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '12px 16px', color: 'white', fontSize: 14, outline: 'none' }}>
            <option value="">-- Select a Job --</option>
            {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
          </select>
        </div>

        {loading && <p style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: '40px 0' }}>Loading candidates...</p>}

        {/* Candidate cards grid */}
        {!loading && candidates.length > 0 && !compareMode && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, margin: 0 }}>
                {candidates.length} candidates ranked by AI score Â· {selected.length}/4 selected
              </p>
              {selected.length >= 2 && (
                <button onClick={() => setCompareMode(true)}
                  style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', padding: '10px 24px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
                  Compare {selected.length} Candidates â†’
                </button>
              )}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {candidates.map((app, i) => {
                const score = app.resumeScore?.overallScore ?? 0
                const isSelected = selected.includes(app.id)
                return (
                  <div key={app.id}
                    onClick={() => toggleSelect(app.id)}
                    style={{
                      background: isSelected ? 'rgba(102,126,234,0.15)' : 'rgba(255,255,255,0.04)',
                      border: isSelected ? '2px solid #667eea' : '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 16, padding: '20px 20px', cursor: 'pointer',
                      transition: 'all 0.2s', position: 'relative'
                    }}>
                    {isSelected && (
                      <div style={{ position: 'absolute', top: 12, right: 12, width: 22, height: 22, background: '#667eea', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>âœ“</div>
                    )}
                    {i < 3 && (
                      <div style={{ position: 'absolute', top: 12, left: 12, background: i === 0 ? '#f59e0b' : i === 1 ? '#9ca3af' : '#cd7c2f', color: 'white', fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 50 }}>
                        #{i + 1}
                      </div>
                    )}
                    <div style={{ marginTop: i < 3 ? 24 : 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                        <div>
                          <p style={{ color: 'white', fontSize: 14, fontWeight: 700, margin: 0 }}>Candidate #{i + 1}</p>
                          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, margin: '3px 0 0' }}>{app.candidateId?.slice(0, 16)}...</p>
                        </div>
                        <span style={{ fontSize: 22, fontWeight: 800, color: score >= 75 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444' }}>{score}</span>
                      </div>
                      <Badge status={app.status} />
                      <div style={{ marginTop: 14 }}>
                        <ScoreBar value={score} />
                        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, margin: '6px 0 0' }}>AI Match Score</p>
                      </div>
                      {app.resumeScore?.matchedSkills?.length > 0 && (
                        <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {app.resumeScore.matchedSkills.slice(0, 3).map((sk: string) => (
                            <span key={sk} style={{ background: 'rgba(102,126,234,0.15)', color: '#a78bfa', fontSize: 10, padding: '2px 8px', borderRadius: 50, border: '1px solid rgba(102,126,234,0.25)' }}>{sk}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* Compare mode */}
        {compareMode && compareCandidates.length >= 2 && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h3 style={{ color: 'white', fontSize: 18, fontWeight: 700, margin: 0 }}>Side-by-Side Comparison</h3>
              <button onClick={() => setCompareMode(false)}
                style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, border: '1px solid rgba(255,255,255,0.15)', background: 'none', cursor: 'pointer', padding: '8px 18px', borderRadius: 8 }}>
                â† Back to selection
              </button>
            </div>

            {/* Header row */}
            <div style={{ display: 'grid', gridTemplateColumns: `180px repeat(${compareCandidates.length}, 1fr)`, gap: 12, marginBottom: 12 }}>
              <div />
              {compareCandidates.map((app, i) => {
                const idx = candidates.findIndex(c => c.id === app.id)
                return (
                  <div key={app.id} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: '16px 18px', textAlign: 'center' }}>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, margin: '0 0 4px' }}>Rank #{idx + 1}</p>
                    <p style={{ color: 'white', fontWeight: 700, fontSize: 15, margin: '0 0 8px' }}>Candidate {idx + 1}</p>
                    <Badge status={app.status} />
                  </div>
                )
              })}
            </div>

            {/* Score rows */}
            {DIMENSIONS.map(dim => {
              const bestId = getBest(dim.key)
              return (
                <div key={dim.key} style={{ display: 'grid', gridTemplateColumns: `180px repeat(${compareCandidates.length}, 1fr)`, gap: 12, marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 0' }}>
                    <span style={{ fontSize: 16 }}>{dim.icon}</span>
                    <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>{dim.label}</span>
                  </div>
                  {compareCandidates.map(app => {
                    const score = getScore(app, dim.key)
                    const isBest = app.id === bestId
                    return (
                      <div key={app.id} style={{
                        background: isBest ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.04)',
                        border: isBest ? '1px solid rgba(16,185,129,0.25)' : '1px solid rgba(255,255,255,0.07)',
                        borderRadius: 12, padding: '14px 16px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: isBest ? '#34d399' : 'white', fontWeight: 700, fontSize: 18 }}>{score || 'â€”'}</span>
                          {isBest && <span style={{ fontSize: 10, background: 'rgba(16,185,129,0.15)', color: '#34d399', padding: '2px 7px', borderRadius: 50, border: '1px solid rgba(16,185,129,0.3)' }}>Best</span>}
                        </div>
                        <ScoreBar value={score} />
                      </div>
                    )
                  })}
                </div>
              )
            })}

            {/* Skills row */}
            <div style={{ display: 'grid', gridTemplateColumns: `180px repeat(${compareCandidates.length}, 1fr)`, gap: 12, marginTop: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 0' }}>
                <span style={{ fontSize: 16 }}>ðŸ·ï¸</span>
                <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>Matched Skills</span>
              </div>
              {compareCandidates.map(app => (
                <div key={app.id} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '14px 16px' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {(app.resumeScore?.matchedSkills || []).slice(0, 6).map((sk: string) => (
                      <span key={sk} style={{ background: 'rgba(102,126,234,0.15)', color: '#a78bfa', fontSize: 10, padding: '2px 8px', borderRadius: 50, border: '1px solid rgba(102,126,234,0.25)' }}>{sk}</span>
                    ))}
                    {(!app.resumeScore?.matchedSkills?.length) && <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>No data</span>}
                  </div>
                </div>
              ))}
            </div>
          </>
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
