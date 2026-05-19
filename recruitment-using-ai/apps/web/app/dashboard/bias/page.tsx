'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const API = 'https://ai-powered-end-to-end-recruitment-platform-production.up.railway.app'

export default function BiasPage() {
  const router = useRouter()
  const [jobs, setJobs] = useState<any[]>([])
  const [jobId, setJobId] = useState('')
  const [report, setReport] = useState<any>(null)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`${API}/api/jobs/public`)
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setJobs(data) })
  }, [])

  const generateReport = async () => {
    if (!jobId) return setError('Please select a job')
    setGenerating(true); setError(''); setReport(null)
    const token = localStorage.getItem('token') || ''
    try {
     const res = await fetch(`${API}/api/bias/report/${jobId}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (res.ok) setReport(data)
      else setError(data.message || 'Failed to generate report')
    } catch { setError('Network error') }
    setGenerating(false)
  }

  const pipeline = report?.demographicData?.pipeline || []
  const anomalies = report?.anomalyFlags?.anomalies || []
  const scoreDistribution = report?.demographicData?.scoreDistribution || {}

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f0c29, #1a1a2e, #16213e)', fontFamily: 'Segoe UI, sans-serif' }}>
      <nav style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '14px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg, #667eea, #764ba2)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>R</span>
          </div>
          <span style={{ color: 'white', fontWeight: 700, fontSize: 15 }}>Recruitment Using AI</span>
        </div>
        <button onClick={() => router.push('/dashboard')} style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, border: 'none', background: 'none', cursor: 'pointer' }}>
          â† Back to Dashboard
        </button>
      </nav>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 32 }}>
          <div style={{ width: 52, height: 52, background: 'linear-gradient(135deg, #f97316, #ef4444)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>ðŸ”</div>
          <div>
            <h2 style={{ color: 'white', fontSize: 24, fontWeight: 800, margin: 0 }}>Bias Audit Panel</h2>
            <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: 13, margin: '4px 0 0' }}>Monitor pipeline fairness and detect statistical anomalies</p>
          </div>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '24px 28px', marginBottom: 24 }}>
          <label style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 10 }}>Select Job</label>
          <div style={{ display: 'flex', gap: 12 }}>
            <select value={jobId} onChange={e => setJobId(e.target.value)}
              style={{ flex: 1, background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '12px 16px', color: 'white', fontSize: 14, outline: 'none' }}>
              <option value="">-- Select a Job --</option>
              {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
            </select>
            <button onClick={generateReport} disabled={generating}
              style={{ background: generating ? 'rgba(255,255,255,0.07)' : 'linear-gradient(135deg, #f97316, #ef4444)', color: 'white', padding: '12px 24px', borderRadius: 12, border: 'none', cursor: generating ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 700, whiteSpace: 'nowrap' }}>
              {generating ? 'Generating...' : 'Generate Report'}
            </button>
          </div>
          {error && <p style={{ color: '#f87171', fontSize: 13, margin: '10px 0 0' }}>{error}</p>}
        </div>

        {report && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Pipeline funnel */}
            <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '24px 28px' }}>
              <h3 style={{ color: 'white', fontSize: 16, fontWeight: 700, margin: '0 0 20px' }}>Pipeline Funnel</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {pipeline.map((stage: any, i: number) => (
                  <div key={stage.stage}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 600 }}>{stage.stage}</span>
                      <span style={{ color: 'white', fontSize: 13, fontWeight: 700 }}>{stage.count} <span style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 400 }}>({stage.percentage}%)</span></span>
                    </div>
                    <div style={{ height: 8, background: 'rgba(255,255,255,0.08)', borderRadius: 50, overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: 50, width: `${stage.percentage}%`, background: i === 0 ? '#667eea' : i === 1 ? '#10b981' : i === 2 ? '#f59e0b' : '#ec4899' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Score distribution */}
            {Object.keys(scoreDistribution).length > 0 && (
              <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '24px 28px' }}>
                <h3 style={{ color: 'white', fontSize: 16, fontWeight: 700, margin: '0 0 20px' }}>Score Distribution</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                  {[
                    { label: 'High (75+)', key: 'high', color: '#10b981' },
                    { label: 'Medium (50-74)', key: 'medium', color: '#f59e0b' },
                    { label: 'Low (<50)', key: 'low', color: '#ef4444' },
                  ].map(s => (
                    <div key={s.key} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '20px', textAlign: 'center' }}>
                      <p style={{ color: s.color, fontSize: 36, fontWeight: 900, margin: 0 }}>{scoreDistribution[s.key] || 0}</p>
                      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, margin: '6px 0 0' }}>{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Anomalies */}
            <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '24px 28px' }}>
              <h3 style={{ color: 'white', fontSize: 16, fontWeight: 700, margin: '0 0 16px' }}>Anomaly Flags</h3>
              {anomalies.length === 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 10, padding: '14px 18px' }}>
                  <span style={{ fontSize: 20 }}>âœ…</span>
                  <p style={{ color: '#34d399', fontSize: 14, margin: 0, fontWeight: 600 }}>No anomalies detected â€” pipeline looks fair!</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {anomalies.map((a: string, i: number) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '12px 16px' }}>
                      <span style={{ fontSize: 16, flexShrink: 0 }}>âš ï¸</span>
                      <p style={{ color: '#fca5a5', fontSize: 13, margin: 0, lineHeight: 1.6 }}>{a}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
