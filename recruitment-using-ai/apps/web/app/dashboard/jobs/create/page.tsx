'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const API = 'https://ai-powered-end-to-end-recruitment-platform-production.up.railway.app'

export default function CreateJobPage() {
  const router = useRouter()
  const [brief, setBrief] = useState('')
  const [generating, setGenerating] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [generatedJD, setGeneratedJD] = useState<any>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const generateJD = async () => {
    if (!brief.trim()) return setError('Please enter a job brief')
    setGenerating(true); setError(''); setGeneratedJD(null)
    const token = localStorage.getItem('token') || ''
    try {
      const res = await fetch(`${API}/api/jobs/generate-jd`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ brief })
      })
      const data = await res.json()
      if (res.ok) setGeneratedJD(data.description)
      else setError(data.message || 'Failed to generate JD')
    } catch { setError('Network error') }
    setGenerating(false)
  }

  const publishJob = async () => {
    if (!generatedJD) return
    setPublishing(true); setError('')
    const token = localStorage.getItem('token') || ''
    try {
      const res = await fetch(`${API}/api/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: generatedJD.title, description: generatedJD })
      })
      const data = await res.json()
      if (res.ok) {
        await fetch(`${API}/api/jobs/${data.job.id}/publish`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}` }
        })
        setSuccess('Job published successfully!')
        setTimeout(() => router.push('/dashboard/jobs'), 2000)
      } else setError(data.message || 'Failed to create job')
    } catch { setError('Network error') }
    setPublishing(false)
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
        <button onClick={() => router.push('/dashboard')} style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, border: 'none', background: 'none', cursor: 'pointer' }}>
          Back to Dashboard
        </button>
      </nav>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 32 }}>
          <div style={{ width: 52, height: 52, background: 'linear-gradient(135deg, #667eea, #764ba2)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
            âœ¨
          </div>
          <div>
            <h2 style={{ color: 'white', fontSize: 24, fontWeight: 800, margin: 0 }}>Job Creation Wizard</h2>
            <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: 13, margin: '4px 0 0' }}>Enter a rough brief â€” AI generates a polished job description</p>
          </div>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, overflow: 'hidden', marginBottom: 20 }}>
          <div style={{ padding: '22px 28px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg, #667eea, #764ba2)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: 'white', fontSize: 14 }}>1</div>
            <div>
              <h3 style={{ color: 'white', fontSize: 16, fontWeight: 700, margin: 0 }}>Enter Job Brief</h3>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, margin: '2px 0 0' }}>Describe the role in your own words</p>
            </div>
          </div>
          <div style={{ padding: '24px 28px' }}>
            <textarea
              value={brief}
              onChange={e => setBrief(e.target.value)}
              placeholder="e.g. We need a Python developer with 2 years experience in Django and REST APIs, remote, full-time..."
              style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '14px 16px', color: 'white', fontSize: 14, outline: 'none', resize: 'none', fontFamily: 'Segoe UI, sans-serif', boxSizing: 'border-box', minHeight: 140, lineHeight: 1.6 }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
              <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12 }}>{brief.length} characters</span>
              <button onClick={generateJD} disabled={generating}
                style={{ background: generating ? 'rgba(255,255,255,0.07)' : 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', padding: '12px 28px', borderRadius: 12, border: 'none', cursor: generating ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 700 }}>
                {generating ? 'Generating...' : 'Generate Job Description'}
              </button>
            </div>
          </div>
        </div>

        {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', fontSize: 13, padding: '12px 18px', borderRadius: 12, marginBottom: 16 }}>{error}</div>}
        {success && <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#34d399', fontSize: 13, padding: '12px 18px', borderRadius: 12, marginBottom: 16 }}>âœ… {success}</div>}

        {generatedJD && (
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, overflow: 'hidden' }}>
            <div style={{ padding: '22px 28px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg, #10b981, #059669)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: 'white', fontSize: 14 }}>2</div>
                <div>
                  <h3 style={{ color: 'white', fontSize: 16, fontWeight: 700, margin: 0 }}>Review Generated JD</h3>
                  <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, margin: '2px 0 0' }}>AI-generated â€” review before publishing</p>
                </div>
              </div>
              <span style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.25)', fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 50 }}>AI Generated</span>
            </div>
            <div style={{ padding: '28px' }}>
              <div style={{ marginBottom: 20 }}>
                <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 8px' }}>Job Title</p>
                <h2 style={{ color: 'white', fontSize: 22, fontWeight: 800, margin: 0 }}>{generatedJD.title}</h2>
              </div>
              {(generatedJD.jobType || generatedJD.location) && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
                  {[generatedJD.jobType, generatedJD.location, generatedJD.experienceLevel].filter(Boolean).map((tag: string) => (
                    <span key={tag} style={{ background: 'rgba(102,126,234,0.12)', border: '1px solid rgba(102,126,234,0.25)', color: '#a78bfa', fontSize: 12, fontWeight: 600, padding: '5px 14px', borderRadius: 50 }}>{tag}</span>
                  ))}
                </div>
              )}
              {generatedJD.summary && (
                <div style={{ marginBottom: 20 }}>
                  <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 8px' }}>Summary</p>
                  <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 14, lineHeight: 1.75, margin: 0 }}>{generatedJD.summary}</p>
                </div>
              )}
              {generatedJD.requirements?.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 10px' }}>Requirements</p>
                  {generatedJD.requirements.map((r: string, i: number) => (
                    <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 6 }}>
                      <span style={{ color: '#667eea', flexShrink: 0 }}>â–¸</span>
                      <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, lineHeight: 1.6 }}>{r}</span>
                    </div>
                  ))}
                </div>
              )}
              {generatedJD.responsibilities?.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 10px' }}>Responsibilities</p>
                  {generatedJD.responsibilities.map((r: string, i: number) => (
                    <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 6 }}>
                      <span style={{ color: '#10b981', flexShrink: 0 }}>â–¸</span>
                      <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, lineHeight: 1.6 }}>{r}</span>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ display: 'flex', gap: 12, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                <button onClick={() => { setGeneratedJD(null); setBrief('') }}
                  style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 24px', borderRadius: 12, fontSize: 14, cursor: 'pointer', fontWeight: 600 }}>
                  Regenerate
                </button>
                <button onClick={publishJob} disabled={publishing}
                  style={{ background: publishing ? 'rgba(255,255,255,0.07)' : 'linear-gradient(135deg, #10b981, #059669)', color: 'white', padding: '12px 28px', borderRadius: 12, border: 'none', cursor: publishing ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 700 }}>
                  {publishing ? 'Publishing...' : 'Publish Job'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
