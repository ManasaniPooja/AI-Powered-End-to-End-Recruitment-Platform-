'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const API = 'https://ai-powered-end-to-end-recruitment-platform-production.up.railway.app'

export default function Register() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'HIRING_MANAGER' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleRegister = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      const data = await res.json()
      if (!res.ok) { setError(data.message || 'Registration failed'); setLoading(false); return }
      router.push('/login')
    } catch {
      setError('Server not reachable. Backend running à°—à°¾ à°‰à°‚à°¦à°¾?')
      setLoading(false)
    }
  }

  const bgStyle: any = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 30%, #0f3460 60%, #533483 100%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24
  }

  return (
    <div style={bgStyle}>
      <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: 24, padding: 40, width: '100%', maxWidth: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 56, height: 56, background: 'linear-gradient(135deg, #667eea, #764ba2)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', boxShadow: '0 8px 24px rgba(102,126,234,0.4)' }}>
            <span style={{ color: 'white', fontWeight: 'bold', fontSize: 24 }}>R</span>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1e293b', margin: 0 }}>Create Account</h1>
          <p style={{ fontSize: 14, color: '#94a3b8', margin: '6px 0 0' }}>Recruitment Using AI Platform</p>
        </div>

        {/* Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 6 }}>Full Name</label>
            <input
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Pooja Manasani"
              style={{ width: '100%', border: '1.5px solid #e2e8f0', borderRadius: 12, padding: '11px 14px', fontSize: 14, color: '#334155', outline: 'none', background: '#f8fafc', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 6 }}>Email</label>
            <input
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder="pooja@example.com"
              type="email"
              style={{ width: '100%', border: '1.5px solid #e2e8f0', borderRadius: 12, padding: '11px 14px', fontSize: 14, color: '#334155', outline: 'none', background: '#f8fafc', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 6 }}>Password</label>
            <input
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              placeholder="Min 6 characters"
              type="password"
              style={{ width: '100%', border: '1.5px solid #e2e8f0', borderRadius: 12, padding: '11px 14px', fontSize: 14, color: '#334155', outline: 'none', background: '#f8fafc', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 6 }}>Role</label>
            <select
              value={form.role}
              onChange={e => setForm({ ...form, role: e.target.value })}
              style={{ width: '100%', border: '1.5px solid #e2e8f0', borderRadius: 12, padding: '11px 14px', fontSize: 14, color: '#334155', outline: 'none', background: '#f8fafc', boxSizing: 'border-box' }}
            >
              <option value="HIRING_MANAGER">Hiring Manager</option>
              <option value="RECRUITER">Recruiter</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>

          {error && (
            <div style={{ background: '#fee2e2', border: '1.5px solid #fecaca', borderRadius: 10, padding: '10px 14px' }}>
              <p style={{ color: '#991b1b', fontSize: 13, margin: 0 }}>âŒ {error}</p>
            </div>
          )}

          <button
            onClick={handleRegister}
            disabled={loading || !form.name || !form.email || !form.password}
            style={{ background: loading || !form.name || !form.email || !form.password ? '#94a3b8' : 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', padding: '13px', borderRadius: 12, fontSize: 15, fontWeight: 700, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 4px 15px rgba(102,126,234,0.35)', marginTop: 4 }}
          >
            {loading ? 'âŸ³ Creating Account...' : 'ðŸš€ Create Account'}
          </button>

          <p style={{ textAlign: 'center', fontSize: 14, color: '#64748b', margin: 0 }}>
            Already have an account?{' '}
            <span onClick={() => router.push('/login')} style={{ color: '#667eea', fontWeight: 600, cursor: 'pointer' }}>Sign In</span>
          </p>
        </div>
      </div>
    </div>
  )
}
