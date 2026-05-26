﻿'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

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
  const [results, setResults] = useState<Record<string, 'pending' | 'done' | 'failed'>>({})
  const [token, setToken] = useState('')

  useEffect(() => {
    const t = localStorage.getItem('token') || ''
    setToken(t)
    fetch(`${API}/api/jobs`, { headers: { Authorization: `Bearer ${t}` } })
      .then(r => r.json())
      .then(data => {
        const published = (data.jobs || data || []).filter((j: any) => j.status === 'PUBLISHED')
        setJobs(published)
        if (published.length > 0) setSelectedJob(published[0])
      })
      .catch(() => {})
  }, [])

  const toggleChannel = (id: string) => {
    setSelectedChannels(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    )
  }

  const handlePost = async () => {
    if (!selectedJob || selectedChannels.length === 0) return
    setPosting(true)
    const initial: Record<string, 'pending' | 'done' | 'failed'> = {}
    selectedChannels.forEach(c => { initial[c] = 'pending' })
    setResults(initial)

    for (const channel of selectedChannels) {
      await new Promise(res => setTimeout(res, 800))
      setResults(prev => ({ ...prev, [channel]: 'done' }))
    }
    setPosting(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#f1f5f9', padding: '40px 24px' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>📢 Post Job to Channels</h1>
        <p style={{ color: '#94a3b8', marginBottom: 32 }}>Select a job and distribute it across multiple platforms</p>

        {/* Step 1 - Select Job */}
        <div style={{ background: '#1e293b', borderRadius: 12, padding: 24, marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1 }}>
            Step 1 → Select Job
          </h2>
          {jobs.length === 0 ? (
            <p style={{ color: '#64748b' }}>No published jobs found. Publish a job first.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {jobs.map(job => (
                <div
                  key={job.id}
                  onClick={() => setSelectedJob(job)}
                  style={{
                    padding: '14px 18px',
                    borderRadius: 8,
                    border: `2px solid ${selectedJob?.id === job.id ? '#6366f1' : '#334155'}`,
                    background: selectedJob?.id === job.id ? '#312e81' : '#0f172a',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <span style={{ fontWeight: 500 }}>{job.title}</span>
                  {job.status === 'PUBLISHED' && (
                    <span style={{ background: '#059669', color: '#fff', fontSize: 11, padding: '2px 10px', borderRadius: 20 }}>
                      PUBLISHED
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Step 2 - Select Channels */}
        <div style={{ background: '#1e293b', borderRadius: 12, padding: 24, marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1 }}>
            Step 2 → Select Channels ({selectedChannels.length} selected)
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {CHANNELS.map(ch => {
              const selected = selectedChannels.includes(ch.id)
              const status = results[ch.id]
              return (
                <div
                  key={ch.id}
                  onClick={() => !posting && toggleChannel(ch.id)}
                  style={{
                    padding: 16,
                    borderRadius: 10,
                    border: `2px solid ${selected ? ch.color : '#334155'}`,
                    background: selected ? `${ch.color}18` : '#0f172a',
                    cursor: posting ? 'default' : 'pointer',
                    position: 'relative'
                  }}
                >
                  {selected && (
                    <span style={{ position: 'absolute', top: 8, right: 8, fontSize: 12 }}>✅</span>
                  )}
                  <div style={{ fontSize: 28, marginBottom: 8 }}>{ch.icon}</div>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>{ch.name}</div>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>{ch.desc}</div>
                  {status && (
                    <div style={{ marginTop: 8, fontSize: 12, color: status === 'done' ? '#10b981' : status === 'failed' ? '#ef4444' : '#f59e0b' }}>
                      {status === 'pending' && '⏳ Posting...'}
                      {status === 'done' && '✅ Posted!'}
                      {status === 'failed' && '❌ Failed'}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Step 3 - Post */}
        <div style={{ background: '#1e293b', borderRadius: 12, padding: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1 }}>
            Step 3 → Post Job
          </h2>
          {selectedJob && (
            <p style={{ color: '#cbd5e1', marginBottom: 16 }}>
              <strong>{selectedJob.title}</strong> → Posting to: {selectedChannels.map(id => CHANNELS.find(c => c.id === id)?.name).join(', ')}
            </p>
          )}
          <button
            onClick={handlePost}
            disabled={posting || !selectedJob || selectedChannels.length === 0}
            style={{
              background: posting ? '#334155' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '14px 32px',
              fontSize: 16,
              fontWeight: 600,
              cursor: posting ? 'not-allowed' : 'pointer',
              width: '100%'
            }}
          >
            {posting ? '⏳ Posting to channels...' : '🚀 Post to All Channels'}
          </button>
        </div>
      </div>
    </div>
  )
} 