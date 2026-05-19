'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const API = 'http://localhost:5000'

export default function OfferPage() {
  const router = useRouter()
  const [form, setForm] = useState({ candidateName: '', candidateEmail: '', jobTitle: '', salary: '', startDate: '', companyName: 'Recruitment Using AI' })
  const [generating, setGenerating] = useState(false)
  const [offerLetter, setOfferLetter] = useState('')
  const [error, setError] = useState('')
  const [emailSent, setEmailSent] = useState(false)

  const generate = async () => {
    const { candidateName, candidateEmail, jobTitle, salary, startDate, companyName } = form
    if (!candidateName || !candidateEmail || !jobTitle || !salary || !startDate || !companyName) return setError('All fields are required')
    setGenerating(true); setError(''); setOfferLetter(''); setEmailSent(false)
    const token = localStorage.getItem('token') || ''
    try {
      const res = await fetch(`${API}/api/offers/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form)
      })
      const data = await res.json()
      if (res.ok) {
        setOfferLetter(data.offerLetter)
        setEmailSent(true)
      } else setError(data.message || 'Failed to generate')
    } catch { setError('Network error') }
    setGenerating(false)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })

  const inputStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 10,
    padding: '12px 16px',
    color: 'white',
    fontSize: 14,
    width: '100%',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'Segoe UI, sans-serif',
    colorScheme: 'dark',
  }

  const labelStyle: React.CSSProperties = {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 11,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.07em',
    marginBottom: 8,
    display: 'block',
  }

  const renderOfferBody = (text: string) => {
    const lines = text.split('\n')
    return lines.map((line, i) => {
      const trimmed = line.trim()
      if (!trimmed) return <div key={i} style={{ height: 14 }} />
      const isHeading = trimmed === trimmed.toUpperCase() && trimmed.length > 3 && !trimmed.startsWith('-') && !trimmed.startsWith('•')
      if (isHeading) return (
        <div key={i} style={{ marginTop: 24, marginBottom: 8 }}>
          <span style={{ color: '#a78bfa', fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{trimmed}</span>
          <div style={{ height: 1, background: 'rgba(167,139,250,0.2)', marginTop: 6 }} />
        </div>
      )
      if (trimmed.startsWith('-') || trimmed.startsWith('•')) return (
        <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 6, paddingLeft: 4 }}>
          <span style={{ color: '#667eea', marginTop: 2, flexShrink: 0 }}>▸</span>
          <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, lineHeight: 1.7 }}>{trimmed.replace(/^[-•]\s*/, '')}</span>
        </div>
      )
      return <p key={i} style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, lineHeight: 1.85, margin: '0 0 6px', fontFamily: 'Georgia, serif' }}>{trimmed}</p>
    })
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

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px' }}>

        {!offerLetter ? (
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 22, overflow: 'hidden' }}>
            <div style={{ padding: '30px 36px', borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(102,126,234,0.07)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 52, height: 52, background: 'linear-gradient(135deg, #667eea, #764ba2)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, boxShadow: '0 8px 24px rgba(102,126,234,0.35)' }}>
                  📄
                </div>
                <div>
                  <h2 style={{ color: 'white', fontSize: 22, fontWeight: 800, margin: 0 }}>Offer Letter Generator</h2>
                  <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: 13, margin: '5px 0 0' }}>AI-powered professional offer letter — auto emailed to candidate</p>
                </div>
              </div>
            </div>

            <div style={{ padding: '32px 36px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22, marginBottom: 22 }}>
                {[
                  { label: 'Candidate Name', name: 'candidateName', placeholder: 'e.g. Pooja Sharma', type: 'text' },
                  { label: 'Candidate Email', name: 'candidateEmail', placeholder: 'e.g. pooja@gmail.com', type: 'email' },
                  { label: 'Job Title', name: 'jobTitle', placeholder: 'e.g. Data Science Intern', type: 'text' },
                  { label: 'Annual Salary / CTC', name: 'salary', placeholder: 'e.g. 12,00,000 INR', type: 'text' },
                  { label: 'Start Date', name: 'startDate', placeholder: '', type: 'date' },
                ].map(f => (
                  <div key={f.name}>
                    <label style={labelStyle}>{f.label}</label>
                    <input name={f.name} type={f.type} value={(form as any)[f.name]} onChange={handleChange} placeholder={f.placeholder} style={inputStyle} />
                  </div>
                ))}
                <div>
                  <label style={labelStyle}>Company Name</label>
                  <input name="companyName" value={form.companyName} onChange={handleChange} style={inputStyle} />
                </div>
              </div>

              {error && (
                <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', fontSize: 13, padding: '12px 16px', borderRadius: 10, marginBottom: 22 }}>
                  {error}
                </div>
              )}

              {/* Email info box */}
              <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 12, padding: '14px 18px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 18 }}>📧</span>
                <p style={{ color: '#6ee7b7', fontSize: 13, margin: 0 }}>Offer letter will be <strong>automatically emailed</strong> to the candidate after generation</p>
              </div>

              <button onClick={generate} disabled={generating}
                style={{ background: generating ? 'rgba(255,255,255,0.07)' : 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', padding: '14px 36px', borderRadius: 12, border: 'none', cursor: generating ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 700, boxShadow: generating ? 'none' : '0 8px 24px rgba(102,126,234,0.35)', transition: 'all 0.2s' }}>
                {generating ? '⏳ Generating & Sending...' : '✨ Generate & Email Offer Letter'}
              </button>
            </div>
          </div>

        ) : (
          <div>
            {/* Email sent banner */}
            {emailSent && (
              <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 14, padding: '16px 24px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 22 }}>✅</span>
                <div>
                  <p style={{ color: '#34d399', fontWeight: 700, margin: 0, fontSize: 14 }}>Offer Letter Emailed Successfully!</p>
                  <p style={{ color: 'rgba(255,255,255,0.4)', margin: '4px 0 0', fontSize: 12 }}>Sent to: {form.candidateEmail}</p>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
              <div>
                <h2 style={{ color: 'white', fontSize: 22, fontWeight: 800, margin: 0 }}>Offer Letter Ready</h2>
                <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: 13, margin: '5px 0 0' }}>Review and download or print</p>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => { setOfferLetter(''); setEmailSent(false) }}
                  style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.65)', border: '1px solid rgba(255,255,255,0.1)', padding: '10px 22px', borderRadius: 10, fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>
                  Regenerate
                </button>
                <button onClick={() => window.print()}
                  style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', border: 'none', padding: '10px 24px', borderRadius: 10, fontSize: 13, cursor: 'pointer', fontWeight: 700, boxShadow: '0 6px 20px rgba(16,185,129,0.3)' }}>
                  Print / Download PDF
                </button>
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 22, overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.5)' }}>
              <div style={{ background: 'linear-gradient(135deg, #1a1040, #16213e)', padding: '36px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 52, height: 52, background: 'linear-gradient(135deg, #667eea, #764ba2)', borderRadius: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(102,126,234,0.4)' }}>
                    <span style={{ color: 'white', fontWeight: 900, fontSize: 22 }}>R</span>
                  </div>
                  <div>
                    <h1 style={{ color: 'white', fontSize: 20, fontWeight: 800, margin: 0 }}>{form.companyName}</h1>
                    <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: 12, margin: '4px 0 0' }}>Human Resources Department</p>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>Issued On</p>
                  <p style={{ color: 'white', fontSize: 15, fontWeight: 700, margin: '5px 0 0' }}>{today}</p>
                  <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, margin: '4px 0 0' }}>Confidential</p>
                </div>
              </div>

              <div style={{ height: 3, background: 'linear-gradient(90deg, #667eea, #764ba2, #ec4899, #f59e0b)' }} />

              <div style={{ padding: '28px 48px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(102,126,234,0.12)', border: '1px solid rgba(102,126,234,0.25)', padding: '7px 16px', borderRadius: 50 }}>
                  <span style={{ width: 7, height: 7, background: '#667eea', borderRadius: '50%', display: 'inline-block' }} />
                  <span style={{ color: '#a78bfa', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Offer of Employment</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Prepared for</p>
                  <p style={{ color: 'white', fontSize: 16, fontWeight: 700, margin: '4px 0 0' }}>{form.candidateName}</p>
                  <p style={{ color: '#a78bfa', fontSize: 13, margin: '3px 0 0' }}>{form.jobTitle}</p>
                  <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, margin: '3px 0 0' }}>{form.candidateEmail}</p>
                </div>
              </div>

              <div style={{ margin: '24px 48px', height: 1, background: 'rgba(255,255,255,0.06)' }} />

              <div style={{ padding: '0 48px 40px' }}>
                {renderOfferBody(offerLetter)}
              </div>

              <div style={{ margin: '0 48px', paddingBottom: 40, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
                {[
                  { label: 'Authorized Signatory', sub: form.companyName, icon: '🏢' },
                  { label: 'Candidate Acceptance', sub: form.candidateName, icon: '✍️' },
                ].map(s => (
                  <div key={s.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '20px 24px' }}>
                    <div style={{ height: 40, marginBottom: 16, borderBottom: '1px dashed rgba(255,255,255,0.12)' }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 16 }}>{s.icon}</span>
                      <div>
                        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 700, margin: 0 }}>{s.label}</p>
                        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, margin: '3px 0 0' }}>{s.sub}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '16px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.15)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 20, height: 20, background: 'linear-gradient(135deg, #667eea, #764ba2)', borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>R</span>
                  </div>
                  <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11, margin: 0 }}>{form.companyName} • HR Department</p>
                </div>
                <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11, margin: 0 }}>This document is confidential and intended solely for the addressee</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}