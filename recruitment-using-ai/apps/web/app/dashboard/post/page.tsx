'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const API = 'http://localhost:5000'

const CHANNELS = [
  { id: 'linkedin',    name: 'LinkedIn',        icon: '💼', color: '#0077b5', desc: 'Reach 900M+ professionals' },
  { id: 'indeed',      name: 'Indeed',          icon: '🔍', color: '#2164f3', desc: "World's #1 job site" },
  { id: 'naukri',      name: 'Naukri',          icon: '🇮🇳', color: '#ef4444', desc: "India's top job portal" },
  { id: 'glassdoor',   name: 'Glassdoor',       icon: '🪟', color: '#0caa41', desc: 'Jobs + company reviews' },
  { id: 'internshala', name: 'Internshala',     icon: '🎓', color: '#f97316', desc: 'Top platform for freshers' },
  { id: 'company',     name: 'Company Website', icon: '🌐', color: '#8b5cf6', desc: 'Your careers page' },
]

export default function PostJobPage() {
  const router = useRouter()
  const [jobs, setJobs] = useState<any[]>([])
  const [selectedJob, setSelectedJob] = useState<any>(null)
  const [selectedChannels, setSelectedChannels] = useState<string[]>(['linkedin', 'company'])
  const [posting, setPosting] = useState(false)
  const [posted, setPosted] = useState<string[]>([])
  const [progress, setProgress] = useState<Record<string, string>>({})

  useEffect(() => {
    const token = localStorage.getItem('token') || ''
    fetch(`${API}/api/jobs`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => setJobs(Array.isArray(data) ? data : []))
      .catch(() => {})
  }, [])

  const toggleChannel = (id: string) => {
    setSelectedChannels(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    )
  }

  const postToChannels = async () => {
    if (!selectedJob || selectedChannels.length === 0) return
    setPosting(true); setPosted([])
    const init: Record<string, string> = {}
    selectedChannels.forEach(c => { init[c] = 'idle' })
    setProgress(init)
    for (const channelId of selectedChannels) {
      setProgress(prev => ({ ...prev, [channelId]: 'posting' }))
      await new Promise(r => setTimeout(r, 1200))
      const success = Math.random() > 0.1
      setProgress(prev => ({ ...prev, [channelId]: success ? 'done' : 'failed' }))
      if (success) setPosted(prev => [...prev, channelId])
    }
    setPosting(false)
  }

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
          Back to Dashboard
        </button>
      </nav>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '36px 24px' }}>
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ color: 'white', fontSize: 26, fontWeight: 800, margin: 0 }}>Job Posting Management</h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, marginTop: 6 }}>Post to multiple channels from one interface</p>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 24, marginBottom: 20 }}>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 14px' }}>Step 1 — Select Job</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {jobs.length === 0 && <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>No jobs found. Create a job first.</p>}
            {jobs.map(job => (
              <div key={job.id} onClick={() => { setSelectedJob(job); setPosted([]); setProgress({}) }}
                style={{ background: selectedJob?.id === job.id ? 'rgba(102,126,234,0.15)' : 'rgba(255,255,255,0.03)', border: selectedJob?.id === job.id ? '1px solid rgba(102,126,234,0.5)' : '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '14px 18px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ color: 'white', fontWeight: 600, fontSize: 14, margin: 0 }}>{job.title}</p>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: '3px 0 0' }}>{(job.description as any)?.jobType} • {(job.description as any)?.location || 'Remote'}</p>
                </div>
                <span style={{ fontSize: 11, padding: '4px 12px', borderRadius: 50, fontWeight: 600, background: job.status === 'PUBLISHED' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)', color: job.status === 'PUBLISHED' ? '#10b981' : '#f59e0b' }}>{job.status}</span>
              </div>
            ))}
          </div>
        </div>

        {selectedJob && (
          <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 24, marginBottom: 20 }}>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 14px' }}>Step 2 — Select Channels ({selectedChannels.length} selected)</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {CHANNELS.map(ch => {
                const isSelected = selectedChannels.includes(ch.id)
                const status = progress[ch.id]
                return (
                  <div key={ch.id} onClick={() => !posting && toggleChannel(ch.id)}
                    style={{ background: isSelected ? `${ch.color}15` : 'rgba(255,255,255,0.03)', border: isSelected ? `1px solid ${ch.color}50` : '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: 16, cursor: posting ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: 28 }}>{ch.icon}</span>
                      {status === 'posting' && <span style={{ fontSize: 16 }}>⏳</span>}
                      {status === 'done' && <span style={{ fontSize: 16 }}>✅</span>}
                      {status === 'failed' && <span style={{ fontSize: 16 }}>❌</span>}
                      {!status && isSelected && <span style={{ fontSize: 14, color: ch.color }}>✓</span>}
                    </div>
                    <p style={{ color: 'white', fontWeight: 700, fontSize: 14, margin: '10px 0 3px' }}>{ch.name}</p>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: 0 }}>{ch.desc}</p>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {selectedJob && selectedChannels.length > 0 && (
          <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 24 }}>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 14px' }}>Step 3 — Post Job</p>
            {posted.length > 0 && !posting && (
              <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 12, padding: '16px 20px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 24 }}>🎉</span>
                <div>
                  <p style={{ color: '#10b981', fontWeight: 700, fontSize: 14, margin: 0 }}>Successfully posted to {posted.length} channels!</p>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: '3px 0 0' }}>{CHANNELS.filter(c => posted.includes(c.id)).map(c => c.name).join(', ')}</p>
                </div>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ color: 'white', fontSize: 15, fontWeight: 600, margin: 0 }}>{selectedJob.title}</p>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, margin: '3px 0 0' }}>Posting to: {selectedChannels.map(id => CHANNELS.find(c => c.id === id)?.name).join(', ')}</p>
              </div>
              <button onClick={postToChannels} disabled={posting}
                style={{ background: posting ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', padding: '12px 28px', borderRadius: 12, border: 'none', cursor: posting ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 700, opacity: posting ? 0.7 : 1 }}>
                {posting ? 'Posting...' : 'Post to All Channels'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}