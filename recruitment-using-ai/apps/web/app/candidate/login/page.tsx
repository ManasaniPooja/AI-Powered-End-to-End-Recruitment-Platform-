'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const API = 'http://localhost:5000'

export default function CandidateLoginPage() {
  const router = useRouter()
  const [tab, setTab] = useState<'login' | 'register'>('login')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async () => {
    setError(''); setLoading(true)
    try {
      const endpoint = tab === 'login' ? '/api/auth/login' : '/api/auth/register'
      const body = tab === 'login'
        ? { email: form.email, password: form.password }
        : { name: form.name, email: form.email, password: form.password, role: 'CANDIDATE' }

      const res = await fetch(`${API}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const data = await res.json()
      if (res.ok) {
        localStorage.setItem('candidate_token', data.token)
        localStorage.setItem('candidate_name', data.user?.name || form.name)
        localStorage.setItem('candidate_email', data.user?.email || form.email)
        router.push('/candidate/jobs')
      } else {
        setError(data.message || 'Something went wrong')
      }
    } catch { setError('Network error') }
    setLoading(false)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10,
    padding: '12px 16px', color: 'white', fontSize: 14,
    outline: 'none', fontFamily: 'Segoe UI, sans-serif',
    boxSizing: 'border-box',
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f0c29, #1a1a2e, #16213e)', fontFamily: 'Segoe UI, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 440 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 56, height: 56, background: 'linear-gradient(135deg, #667eea, #764ba2)', borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', boxShadow: '0 8px 28px rgba(102,126,234,0.4)' }}>
            <span style={{ color: 'white', fontWeight: 900, fontSize: 24 }}>R</span>
          </div>
          <h1 style={{ color: 'white', fontSize: 22, fontWeight: 800, margin: 0 }}>Candidate Portal</h1>
          <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: 13, margin: '6px 0 0' }}>Find and apply for jobs powered by AI</p>
        </div>

        {/* Card */}
        <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 20, overflow: 'hidden' }}>

          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            {(['login', 'register'] as const).map(t => (
              <button key={t} onClick={() => { setTab(t); setError('') }}
                style={{ flex: 1, padding: '16px', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700, transition: 'all 0.2s',
                  background: tab === t ? 'rgba(102,126,234,0.1)' : 'transparent',
                  color: tab === t ? '#a78bfa' : 'rgba(255,255,255,0.35)',
                  borderBottom: tab === t ? '2px solid #667eea' : '2px solid transparent',
                }}>
                {t === 'login' ? 'Sign In' : 'Register'}
              </button>
            ))}
          </div>

          {/* Form */}
          <div style={{ padding: '28px 28px 24px' }}>
            {tab === 'register' && (
              <div style={{ marginBottom: 16 }}>
                <label style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 7 }}>Full Name</label>
                <input name="name" value={form.name} onChange={handleChange} placeholder="e.g. Pooja Sharma" style={inputStyle} />
              </div>
            )}

            <div style={{ marginBottom: 16 }}>
              <label style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 7 }}>Email Address</label>
              <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@example.com" style={inputStyle} />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 7 }}>Password</label>
              <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="••••••••" style={inputStyle} />
            </div>

            {error && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', fontSize: 13, padding: '10px 14px', borderRadius: 10, marginBottom: 18 }}>
                {error}
              </div>
            )}

            <button onClick={handleSubmit} disabled={loading}
              style={{ width: '100%', background: loading ? 'rgba(255,255,255,0.07)' : 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', padding: '14px', borderRadius: 12, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontSize: 15, fontWeight: 700, boxShadow: loading ? 'none' : '0 6px 20px rgba(102,126,234,0.35)' }}>
              {loading ? 'Please wait...' : tab === 'login' ? 'Sign In' : 'Create Account'}
            </button>

            <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12, textAlign: 'center', margin: '16px 0 0' }}>
              {tab === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <span onClick={() => { setTab(tab === 'login' ? 'register' : 'login'); setError('') }}
                style={{ color: '#a78bfa', cursor: 'pointer', fontWeight: 600 }}>
                {tab === 'login' ? 'Register here' : 'Sign in'}
              </span>
            </p>
          </div>
        </div>

        <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12, textAlign: 'center', marginTop: 20 }}>
          Are you a hiring manager?{' '}
          <span onClick={() => router.push('/login')} style={{ color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}>Login here</span>
        </p>
      </div>
    </div>
  )
}