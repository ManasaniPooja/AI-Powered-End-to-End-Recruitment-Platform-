﻿'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

const API = 'http://localhost:5000'

export default function ApplyPage() {
  const router = useRouter()
  const params = useParams()
  const jobId = params.id as string
  const [job, setJob] = useState<any>(null)
  const [form, setForm] = useState({ candidateName: '', email: '', phone: '' })
  const [resume, setResume] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`${API}/api/jobs/public`)
      .then(r => r.json())
      .then(data => {
        const found = Array.isArray(data) ? data.find((j: any) => j.id === jobId) : null
        setJob(found || null)
      })
  }, [jobId])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async () => {
    if (!form.candidateName || !form.email || !resume) return setError('Name, email and resume are required')
    setSubmitting(true); setError('')
    try {
      const formData = new FormData()
      formData.append('candidateName', form.candidateName)
      formData.append('email', form.email)
      formData.append('phone', form.phone)
      formData.append('jobId', jobId)
      formData.append('resume', resume)
      const res = await fetch(`${API}/api/applications/apply`, { method: 'POST', body: formData })
      const data = await res.json()
      if (res.ok) setSuccess(true)
      else setError(data.message || 'Failed to submit')
    } catch { setError('Network error') }
    setSubmitting(false)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10,
    padding: '12px 16px', color: 'white', fontSize: 14,
    outline: 'none', fontFamily: 'Segoe UI, sans-serif', boxSizing: 'border-box',
  }
  const labelStyle: React.CSSProperties = {
    color: 'rgba(255,255,255,0.45)', fontSize: 11, fontWeight: 700,
    textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 7,
  }

  if (success) return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f0c29, #1a1a2e, #16213e)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Segoe UI, sans-serif' }}>
      <div style={{ textAlign: 'center', padding: 40 }}>
        <h2 style={{ color: 'white', fontSize: 26, fontWeight: 800, margin: '0 0 12px' }}>Application Submitted!</h2>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 15, margin: '0 0 28px' }}>We will review your resume and get back to you soon.</p>
        <button onClick={() => router.push('/candidate/jobs')} style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', padding: '13px 32px', borderRadius: 12, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>Browse More Jobs</button>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f0c29, #1a1a2e, #16213e)', fontFamily: 'Segoe UI, sans-serif' }}>
      <nav style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '14px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 38, height: 38, background: 'linear-gradient(135deg, #667eea, #764ba2)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'white', fontWeight: 'bold', fontSize: 17 }}>R</span>
          </div>
          <span style={{ color: 'white', fontWeight: 700, fontSize: 15 }}>Recruitment Using AI</span>
        </div>
        <button onClick={() => router.push('/candidate/jobs')} style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, border: 'none', background: 'none', cursor: 'pointer' }}>Back to Jobs</button>
      </nav>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '40px 24px' }}>
        {job && (
          <div style={{ background: 'rgba(102,126,234,0.08)', border: '1px solid rgba(102,126,234,0.2)', borderRadius: 16, padding: '20px 24px', marginBottom: 28 }}>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 6px' }}>Applying for</p>
            <h2 style={{ color: 'white', fontSize: 20, fontWeight: 800, margin: 0 }}>{job.title}</h2>
          </div>
        )}

        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, overflow: 'hidden' }}>
          <div style={{ padding: '24px 28px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <h3 style={{ color: 'white', fontSize: 18, fontWeight: 700, margin: 0 }}>Your Application</h3>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, margin: '4px 0 0' }}>Fill in your details and upload your resume</p>
          </div>
          <div style={{ padding: '28px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 18 }}>
              <div>
                <label style={labelStyle}>Full Name</label>
                <input name="candidateName" value={form.candidateName} onChange={handleChange} placeholder="e.g. Pooja Sharma" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Email Address</label>
                <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@example.com" style={inputStyle} />
              </div>
            </div>
            <div style={{ marginBottom: 18 }}>
              <label style={labelStyle}>Phone Number</label>
              <input name="phone" value={form.phone} onChange={handleChange} placeholder="e.g. +91 9876543210" style={inputStyle} />
            </div>
            <div style={{ marginBottom: 26 }}>
              <label style={labelStyle}>Resume (PDF)</label>
              <div style={{ border: '1px dashed rgba(255,255,255,0.15)', borderRadius: 12, padding: '20px', textAlign: 'center', cursor: 'pointer', background: 'rgba(255,255,255,0.03)' }}
                onClick={() => document.getElementById('resume-input')?.click()}>
                {resume ? (
                  <div>
                    <p style={{ color: '#34d399', fontSize: 14, fontWeight: 600, margin: 0 }}>{resume.name}</p>
                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, margin: '4px 0 0' }}>{(resume.size / 1024).toFixed(1)} KB</p>
                  </div>
                ) : (
                  <div>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, margin: 0 }}>Click to upload resume</p>
                    <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12, margin: '4px 0 0' }}>PDF format preferred</p>
                  </div>
                )}
              </div>
              <input id="resume-input" type="file" accept=".pdf,.doc,.docx" style={{ display: 'none' }}
                onChange={e => setResume(e.target.files?.[0] || null)} />
            </div>
            {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', fontSize: 13, padding: '11px 16px', borderRadius: 10, marginBottom: 18 }}>{error}</div>}
            <button onClick={handleSubmit} disabled={submitting}
              style={{ width: '100%', background: submitting ? 'rgba(255,255,255,0.07)' : 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', padding: '14px', borderRadius: 12, border: 'none', cursor: submitting ? 'not-allowed' : 'pointer', fontSize: 15, fontWeight: 700 }}>
              {submitting ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
