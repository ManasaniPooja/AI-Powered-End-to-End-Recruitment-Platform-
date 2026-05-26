'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

export default function UnifiedLoginPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  // ── Staff states ──
  const [hmTab, setHmTab] = useState<'login' | 'register'>('login')
  const [hmEmail, setHmEmail] = useState('')
  const [hmPassword, setHmPassword] = useState('')
  const [hmName, setHmName] = useState('')
  const [hmRole, setHmRole] = useState('HIRING_MANAGER')
  const [hmError, setHmError] = useState('')
  const [hmLoading, setHmLoading] = useState(false)
  const [hmShowPassword, setHmShowPassword] = useState(false)

  // ── Staff forgot password states ──
  const [hmShowForgot, setHmShowForgot] = useState(false)
  const [hmForgotEmail, setHmForgotEmail] = useState('')
  const [hmForgotMsg, setHmForgotMsg] = useState('')
  const [hmForgotErr, setHmForgotErr] = useState('')
  const [hmForgotLoading, setHmForgotLoading] = useState(false)

  // ── Candidate states ──
  const [cTab, setCTab] = useState<'login' | 'register'>('login')
  const [cForm, setCForm] = useState({ name: '', email: '', password: '' })
  const [cError, setCError] = useState('')
  const [cLoading, setCLoading] = useState(false)
  const [cShowPassword, setCShowPassword] = useState(false)

  // ── Candidate forgot password states ──
  const [cShowForgot, setCShowForgot] = useState(false)
  const [cForgotEmail, setCForgotEmail] = useState('')
  const [cForgotMsg, setCForgotMsg] = useState('')
  const [cForgotErr, setCForgotErr] = useState('')
  const [cForgotLoading, setCForgotLoading] = useState(false)

  useEffect(() => setMounted(true), [])

  const handleHM = async () => {
    setHmLoading(true); setHmError('')
    try {
      const endpoint = hmTab === 'login' ? '/api/auth/login' : '/api/auth/register'
      const body = hmTab === 'login'
        ? { email: hmEmail, password: hmPassword }
        : { name: hmName, email: hmEmail, password: hmPassword, role: hmRole }
      const res = await fetch(`${API}${endpoint}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const data = await res.json()
      if (res.ok) {
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
        router.push('/dashboard')
      } else setHmError(data.message || 'Something went wrong')
    } catch { setHmError('Connection failed. Is the API running?') }
    setHmLoading(false)
  }

  const handleCandidate = async () => {
    setCError(''); setCLoading(true)
    try {
      const endpoint = cTab === 'login' ? '/api/auth/login' : '/api/auth/register'
      const body = cTab === 'login'
        ? { email: cForm.email, password: cForm.password }
        : { name: cForm.name, email: cForm.email, password: cForm.password, role: 'CANDIDATE' }
      const res = await fetch(`${API}${endpoint}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const data = await res.json()
      if (res.ok) {
        localStorage.setItem('candidate_token', data.token)
        localStorage.setItem('candidate_name', data.user?.name || cForm.name)
        localStorage.setItem('candidate_email', data.user?.email || cForm.email)
        router.push('/candidate/jobs')
      } else setCError(data.message || 'Something went wrong')
    } catch { setCError('Network error') }
    setCLoading(false)
  }

  const handleHmForgot = async () => {
    if (!hmForgotEmail) return setHmForgotErr('Please enter your email')
    setHmForgotLoading(true); setHmForgotErr(''); setHmForgotMsg('')
    try {
      const res = await fetch(`${API}/api/auth/forgot-password`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: hmForgotEmail })
      })
      const data = await res.json()
      if (res.ok) setHmForgotMsg(data.message)
      else setHmForgotErr(data.message || 'Something went wrong')
    } catch { setHmForgotErr('Connection failed. Is the API running?') }
    setHmForgotLoading(false)
  }

  const handleCForgot = async () => {
    if (!cForgotEmail) return setCForgotErr('Please enter your email')
    setCForgotLoading(true); setCForgotErr(''); setCForgotMsg('')
    try {
      const res = await fetch(`${API}/api/auth/forgot-password`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cForgotEmail })
      })
      const data = await res.json()
      if (res.ok) setCForgotMsg(data.message)
      else setCForgotErr(data.message || 'Something went wrong')
    } catch { setCForgotErr('Connection failed. Is the API running?') }
    setCForgotLoading(false)
  }

  const EyeIcon = ({ show }: { show: boolean }) => (
    <span style={{ fontSize: 16, userSelect: 'none' }}>{show ? '🙈' : '👁️'}</span>
  )

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .login-root {
          min-height: 100vh;
          background: #050818;
          font-family: 'Sora', sans-serif;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          position: relative;
          overflow: hidden;
        }

        .bg-mesh { position: fixed; inset: 0; pointer-events: none; z-index: 0; }
        .bg-orb {
          position: absolute; border-radius: 50%;
          filter: blur(80px); opacity: 0.18;
          animation: drift 12s ease-in-out infinite;
        }
        .bg-orb-1 { width: 600px; height: 600px; background: #3b4fd8; top: -200px; left: -100px; animation-delay: 0s; }
        .bg-orb-2 { width: 500px; height: 500px; background: #7c3aed; bottom: -150px; right: -100px; animation-delay: -4s; }
        .bg-orb-3 { width: 400px; height: 400px; background: #0ea5e9; top: 40%; left: 30%; animation-delay: -8s; }
        .bg-dots {
          position: fixed; inset: 0;
          background-image: radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px);
          background-size: 28px 28px; pointer-events: none; z-index: 0;
        }

        @keyframes drift {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -20px) scale(1.05); }
          66% { transform: translate(-20px, 30px) scale(0.95); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.94) translateY(12px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }

        .content {
          position: relative; z-index: 10; width: 100%; max-width: 860px;
          display: flex; flex-direction: column; align-items: center;
          animation: fadeUp 0.7s ease forwards;
        }

        .header { text-align: center; margin-bottom: 44px; }
        .header-badge {
          display: inline-flex; align-items: center; gap: 7px;
          background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);
          color: #94a3b8; font-size: 11px; font-weight: 600;
          letter-spacing: 0.1em; text-transform: uppercase;
          padding: 6px 16px; border-radius: 100px; margin-bottom: 20px;
          font-family: 'JetBrains Mono', monospace;
        }
        .badge-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #22d3ee; box-shadow: 0 0 8px #22d3ee;
          animation: pulse-dot 2s ease infinite;
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }
        .header-title {
          font-size: 36px; font-weight: 800; color: #ffffff;
          line-height: 1.15; letter-spacing: -0.03em; margin-bottom: 6px;
        }
        .header-title span {
          background: linear-gradient(90deg, #60a5fa, #a78bfa, #34d399);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        }
        .header-sub { font-size: 14px; color: #64748b; font-weight: 400; margin-top: 10px; letter-spacing: 0.01em; }

        .stats-strip {
          display: flex; gap: 32px; margin-bottom: 40px;
          padding: 14px 32px;
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07);
          border-radius: 100px; backdrop-filter: blur(10px);
        }
        .stat-item { display: flex; align-items: center; gap: 8px; font-size: 12px; color: #64748b; white-space: nowrap; }
        .stat-val { font-weight: 700; color: #e2e8f0; font-family: 'JetBrains Mono', monospace; font-size: 13px; }
        .stat-dot { width: 1px; height: 16px; background: rgba(255,255,255,0.08); }

        .cards-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; width: 100%; }

        .card {
          background: rgba(255,255,255,0.035); border-radius: 20px;
          border: 1px solid rgba(255,255,255,0.08); padding: 28px 26px;
          backdrop-filter: blur(20px); display: flex; flex-direction: column;
          transition: border-color 0.3s; animation: fadeUp 0.7s ease forwards;
        }
        .card:hover { border-color: rgba(255,255,255,0.14); }
        .card-staff { animation-delay: 0.1s; }
        .card-candidate { animation-delay: 0.2s; }

        .card-header {
          display: flex; align-items: center; gap: 12px;
          padding-bottom: 18px; margin-bottom: 18px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .card-icon {
          width: 44px; height: 44px; border-radius: 13px;
          display: flex; align-items: center; justify-content: center;
          font-size: 19px; flex-shrink: 0;
        }
        .card-icon-staff { background: linear-gradient(135deg, #3b82f6, #6366f1); box-shadow: 0 4px 16px rgba(99,102,241,0.35); }
        .card-icon-candidate { background: linear-gradient(135deg, #10b981, #059669); box-shadow: 0 4px 16px rgba(16,185,129,0.35); }
        .card-title { font-size: 15px; font-weight: 700; color: #f1f5f9; margin: 0; }
        .card-sub { font-size: 11px; color: #475569; margin: 2px 0 0; font-weight: 400; }

        .tabs {
          display: flex; background: rgba(255,255,255,0.04);
          border-radius: 10px; padding: 3px; margin-bottom: 18px;
          border: 1px solid rgba(255,255,255,0.06);
        }
        .tab-btn {
          flex: 1; padding: 8px 0; border: none; cursor: pointer;
          border-radius: 8px; font-size: 12px; font-weight: 600;
          transition: all 0.2s; font-family: 'Sora', sans-serif;
          background: transparent; color: #475569;
        }
        .tab-btn.active-staff { background: linear-gradient(135deg, #3b82f6, #6366f1); color: white; box-shadow: 0 2px 10px rgba(99,102,241,0.3); }
        .tab-btn.active-candidate { background: linear-gradient(135deg, #10b981, #059669); color: white; box-shadow: 0 2px 10px rgba(16,185,129,0.3); }

        .field { margin-bottom: 12px; }
        .field-label {
          display: block; font-size: 11px; font-weight: 600; color: #475569;
          margin-bottom: 6px; letter-spacing: 0.06em; text-transform: uppercase;
          font-family: 'JetBrains Mono', monospace;
        }
        .field-input {
          width: 100%; background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.09); border-radius: 10px;
          padding: 11px 14px; font-size: 13px; color: #e2e8f0;
          outline: none; box-sizing: border-box; font-family: 'Sora', sans-serif;
          transition: border-color 0.2s, background 0.2s;
        }
        .field-input::placeholder { color: #334155; }
        .field-input:focus { background: rgba(255,255,255,0.07); }
        .field-input-staff:focus { border-color: rgba(99,102,241,0.6); box-shadow: 0 0 0 3px rgba(99,102,241,0.08); }
        .field-input-candidate:focus { border-color: rgba(16,185,129,0.6); box-shadow: 0 0 0 3px rgba(16,185,129,0.08); }

        /* Password wrapper */
        .pw-wrap {
          display: flex; align-items: center;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 10px; overflow: hidden;
          transition: border-color 0.2s, background 0.2s;
        }
        .pw-wrap:focus-within { background: rgba(255,255,255,0.07); }
        .pw-wrap-staff:focus-within { border-color: rgba(99,102,241,0.6); box-shadow: 0 0 0 3px rgba(99,102,241,0.08); }
        .pw-wrap-candidate:focus-within { border-color: rgba(16,185,129,0.6); box-shadow: 0 0 0 3px rgba(16,185,129,0.08); }

        /* ── FIX: use Verdana so password bullets render correctly ── */
        .pw-input {
          flex: 1; background: transparent; border: none;
          padding: 11px 14px; font-size: 13px; color: #e2e8f0;
          outline: none;
          font-family: 'Verdana', 'Sora', Arial, sans-serif;
          min-width: 0;
        }
        .pw-input::placeholder {
          color: #334155;
          font-family: 'Sora', sans-serif;
        }
        .pw-toggle {
          padding: 0 12px; cursor: pointer; background: transparent;
          border: none; display: flex; align-items: center; flex-shrink: 0;
          transition: opacity 0.2s;
        }
        .pw-toggle:hover { opacity: 0.7; }

        /* Forgot password link */
        .forgot-link {
          display: block; text-align: right; font-size: 11px;
          font-weight: 600; margin-top: 4px; margin-bottom: 4px;
          cursor: pointer; letter-spacing: 0.02em;
        }
        .forgot-link-staff { color: #818cf8; }
        .forgot-link-staff:hover { color: #a5b4fc; }
        .forgot-link-candidate { color: #34d399; }
        .forgot-link-candidate:hover { color: #6ee7b7; }

        .select-wrap { position: relative; }
        .field-select {
          width: 100%; background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.09); border-radius: 10px;
          padding: 11px 38px 11px 14px; font-size: 13px; color: #e2e8f0;
          outline: none; box-sizing: border-box; font-family: 'Sora', sans-serif;
          appearance: none; -webkit-appearance: none; cursor: pointer; transition: border-color 0.2s;
        }
        .field-select:focus { border-color: rgba(99,102,241,0.6); box-shadow: 0 0 0 3px rgba(99,102,241,0.08); background: rgba(255,255,255,0.07); }
        .select-arrow { position: absolute; right: 13px; top: 50%; transform: translateY(-50%); pointer-events: none; color: #6366f1; font-size: 10px; font-weight: 700; }

        .error-box {
          display: flex; align-items: center; gap: 8px;
          background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2);
          color: #f87171; font-size: 12px; padding: 9px 12px;
          border-radius: 9px; margin-bottom: 14px;
        }
        .success-box {
          display: flex; align-items: center; gap: 8px;
          background: rgba(34,197,94,0.1); border: 1px solid rgba(34,197,94,0.2);
          color: #4ade80; font-size: 12px; padding: 9px 12px;
          border-radius: 9px; margin-bottom: 14px;
        }

        .info-box {
          margin-bottom: 12px; padding: 12px 14px; border-radius: 11px;
          background: rgba(16,185,129,0.06); border: 1px solid rgba(16,185,129,0.15);
          display: flex; align-items: flex-start; gap: 10px;
        }
        .info-box-icon { font-size: 16px; flex-shrink: 0; margin-top: 1px; }
        .info-box-title { font-size: 12px; font-weight: 700; color: #34d399; margin: 0 0 3px; }
        .info-box-text { font-size: 11px; color: #64748b; margin: 0; line-height: 1.6; }

        .spacer { flex: 1; }

        .btn-staff {
          width: 100%; padding: 13px;
          background: linear-gradient(135deg, #3b82f6, #6366f1);
          color: white; border: none; border-radius: 11px;
          font-size: 14px; font-weight: 700; cursor: pointer;
          font-family: 'Sora', sans-serif; box-shadow: 0 4px 20px rgba(99,102,241,0.35);
          transition: all 0.2s; margin-bottom: 14px; letter-spacing: 0.01em;
        }
        .btn-staff:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 24px rgba(99,102,241,0.45); }
        .btn-staff:disabled { background: rgba(99,102,241,0.3); box-shadow: none; cursor: not-allowed; }

        .btn-candidate {
          width: 100%; padding: 13px;
          background: linear-gradient(135deg, #10b981, #059669);
          color: white; border: none; border-radius: 11px;
          font-size: 14px; font-weight: 700; cursor: pointer;
          font-family: 'Sora', sans-serif; box-shadow: 0 4px 20px rgba(16,185,129,0.35);
          transition: all 0.2s; margin-bottom: 14px; letter-spacing: 0.01em;
        }
        .btn-candidate:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 24px rgba(16,185,129,0.45); }
        .btn-candidate:disabled { background: rgba(16,185,129,0.3); box-shadow: none; cursor: not-allowed; }

        .link-text { text-align: center; font-size: 12px; color: #475569; margin: 0; }
        .link-staff { color: #818cf8; cursor: pointer; font-weight: 700; }
        .link-staff:hover { color: #a5b4fc; }
        .link-candidate { color: #34d399; cursor: pointer; font-weight: 700; }
        .link-candidate:hover { color: #6ee7b7; }

        /* ── Modal overlay ── */
        .modal-overlay {
          position: fixed; inset: 0; z-index: 100;
          background: rgba(5,8,24,0.85);
          backdrop-filter: blur(6px);
          display: flex; align-items: center; justify-content: center;
          padding: 20px;
        }
        .modal {
          width: 100%; max-width: 400px;
          background: #0d1526;
          border-radius: 20px;
          border: 1px solid rgba(255,255,255,0.1);
          padding: 32px 28px;
          box-shadow: 0 24px 80px rgba(0,0,0,0.6);
          animation: modalIn 0.25s ease forwards;
        }
        .modal-icon {
          width: 52px; height: 52px; border-radius: 14px;
          display: flex; align-items: center; justify-content: center;
          font-size: 22px; margin-bottom: 18px;
        }
        .modal-icon-staff { background: linear-gradient(135deg, #3b82f6, #6366f1); box-shadow: 0 4px 20px rgba(99,102,241,0.4); }
        .modal-icon-candidate { background: linear-gradient(135deg, #10b981, #059669); box-shadow: 0 4px 20px rgba(16,185,129,0.4); }
        .modal-title { font-size: 18px; font-weight: 700; color: #f1f5f9; margin: 0 0 6px; }
        .modal-sub { font-size: 13px; color: #64748b; margin: 0 0 22px; line-height: 1.5; }
        .modal-actions { display: flex; gap: 10px; margin-top: 20px; }
        .modal-btn-primary {
          flex: 1; padding: 12px; border: none; border-radius: 10px;
          font-size: 13px; font-weight: 700; cursor: pointer;
          font-family: 'Sora', sans-serif; transition: all 0.2s;
        }
        .modal-btn-staff { background: linear-gradient(135deg, #3b82f6, #6366f1); color: white; box-shadow: 0 4px 16px rgba(99,102,241,0.3); }
        .modal-btn-staff:hover:not(:disabled) { transform: translateY(-1px); }
        .modal-btn-candidate { background: linear-gradient(135deg, #10b981, #059669); color: white; box-shadow: 0 4px 16px rgba(16,185,129,0.3); }
        .modal-btn-candidate:hover:not(:disabled) { transform: translateY(-1px); }
        .modal-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
        .modal-btn-cancel {
          flex: 1; padding: 12px; border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px; font-size: 13px; font-weight: 600;
          cursor: pointer; font-family: 'Sora', sans-serif;
          background: rgba(255,255,255,0.04); color: #64748b; transition: all 0.2s;
        }
        .modal-btn-cancel:hover { background: rgba(255,255,255,0.07); color: #94a3b8; }

        .footer { margin-top: 32px; text-align: center; }
        .footer-text { font-size: 11px; color: #1e293b; font-family: 'JetBrains Mono', monospace; letter-spacing: 0.04em; }
        .footer-divider { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
        .footer-line { flex: 1; height: 1px; background: rgba(255,255,255,0.05); }
        .footer-logo { font-size: 10px; color: #1e293b; font-family: 'JetBrains Mono', monospace; letter-spacing: 0.08em; }
      `}</style>

      <div className="login-root">
        <div className="bg-mesh">
          <div className="bg-orb bg-orb-1" />
          <div className="bg-orb bg-orb-2" />
          <div className="bg-orb bg-orb-3" />
        </div>
        <div className="bg-dots" />

        <div className="content">

          {/* ── Header ── */}
          <div className="header">
            <div className="header-badge">
              <span className="badge-dot" />
              Powered by Artificial Intelligence
            </div>
            <h1 className="header-title">
              AI-Based End-to-End<br />
              <span>Recruitment Process</span>
            </h1>
            <p className="header-sub">
              Intelligent hiring from sourcing to onboarding — faster, fairer, and smarter
            </p>
          </div>

          {/* ── Stats Strip ── */}
          <div className="stats-strip">
            <div className="stat-item"><span className="stat-val">98%</span><span>Match Accuracy</span></div>
            <div className="stat-dot" />
            <div className="stat-item"><span className="stat-val">10×</span><span>Faster Screening</span></div>
            <div className="stat-dot" />
            <div className="stat-item"><span className="stat-val">Zero</span><span>Bias Guaranteed</span></div>
            <div className="stat-dot" />
            <div className="stat-item"><span className="stat-val">24/7</span><span>AI Available</span></div>
          </div>

          {/* ── Cards ── */}
          <div className="cards-grid">

            {/* ══ Staff Portal ══ */}
            <div className="card card-staff">
              <div className="card-header">
                <div className="card-icon card-icon-staff">💼</div>
                <div>
                  <p className="card-title">Staff Portal</p>
                  <p className="card-sub">Hiring Manager · Recruiter · Admin</p>
                </div>
              </div>

              <div className="tabs">
                {(['login', 'register'] as const).map(t => (
                  <button key={t}
                    className={`tab-btn ${hmTab === t ? 'active-staff' : ''}`}
                    onClick={() => { setHmTab(t); setHmError('') }}>
                    {t === 'login' ? 'Sign In' : 'Register'}
                  </button>
                ))}
              </div>

              {hmError && <div className="error-box"><span>⚠</span> {hmError}</div>}

              {hmTab === 'register' && (
                <div className="field">
                  <label className="field-label">Full Name</label>
                  <input className="field-input field-input-staff"
                    value={hmName} onChange={e => setHmName(e.target.value)}
                    placeholder="e.g. Pooja Manasani" />
                </div>
              )}

              <div className="field">
                <label className="field-label">Email Address</label>
                <input className="field-input field-input-staff" type="email"
                  value={hmEmail} onChange={e => setHmEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleHM()}
                  placeholder="you@company.com" />
              </div>

              <div className="field">
                <label className="field-label">Password</label>
                <div className="pw-wrap pw-wrap-staff">
                  <input className="pw-input"
                    type={hmShowPassword ? 'text' : 'password'}
                    value={hmPassword} onChange={e => setHmPassword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleHM()}
                    placeholder="••••••••" />
                  <button className="pw-toggle" onClick={() => setHmShowPassword(!hmShowPassword)} type="button" tabIndex={-1}>
                    <EyeIcon show={hmShowPassword} />
                  </button>
                </div>
                {hmTab === 'login' && (
                  <span className="forgot-link forgot-link-staff"
                    onClick={() => { setHmShowForgot(true); setHmForgotEmail(hmEmail); setHmForgotMsg(''); setHmForgotErr('') }}>
                    Forgot password?
                  </span>
                )}
              </div>

              <div className="field" style={{ marginBottom: 20 }}>
                <label className="field-label">Your Role</label>
                <div className="select-wrap">
                  <select className="field-select" value={hmRole} onChange={e => setHmRole(e.target.value)}>
                    <option value="HIRING_MANAGER">💼  Hiring Manager</option>
                    <option value="RECRUITER">🔍  Recruiter</option>
                    <option value="ADMIN">👑  Admin</option>
                    <option value="HR_ADMIN">⚙️  HR Admin</option>
                  </select>
                  <span className="select-arrow">▼</span>
                </div>
              </div>

              <div className="spacer" />

              <button className="btn-staff" onClick={handleHM} disabled={hmLoading}>
                {hmLoading ? 'Please wait...' : hmTab === 'login' ? '→  Sign In' : '→  Create Account'}
              </button>

              <p className="link-text">
                {hmTab === 'login' ? 'New here? ' : 'Have an account? '}
                <span className="link-staff"
                  onClick={() => { setHmTab(hmTab === 'login' ? 'register' : 'login'); setHmError('') }}>
                  {hmTab === 'login' ? 'Create account' : 'Sign in'}
                </span>
              </p>
            </div>

            {/* ══ Candidate Portal ══ */}
            <div className="card card-candidate">
              <div className="card-header">
                <div className="card-icon card-icon-candidate">🎓</div>
                <div>
                  <p className="card-title">Candidate Portal</p>
                  <p className="card-sub">Find &amp; apply for jobs</p>
                </div>
              </div>

              <div className="tabs">
                {(['login', 'register'] as const).map(t => (
                  <button key={t}
                    className={`tab-btn ${cTab === t ? 'active-candidate' : ''}`}
                    onClick={() => { setCTab(t); setCError('') }}>
                    {t === 'login' ? 'Sign In' : 'Register'}
                  </button>
                ))}
              </div>

              {cError && <div className="error-box"><span>⚠</span> {cError}</div>}

              {cTab === 'register' && (
                <div className="field">
                  <label className="field-label">Full Name</label>
                  <input className="field-input field-input-candidate"
                    value={cForm.name} onChange={e => setCForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. Pooja Sharma" />
                </div>
              )}

              <div className="field">
                <label className="field-label">Email Address</label>
                <input className="field-input field-input-candidate" type="email"
                  value={cForm.email} onChange={e => setCForm(p => ({ ...p, email: e.target.value }))}
                  placeholder="you@example.com" />
              </div>

              <div className="field">
                <label className="field-label">Password</label>
                <div className="pw-wrap pw-wrap-candidate">
                  <input className="pw-input"
                    type={cShowPassword ? 'text' : 'password'}
                    value={cForm.password} onChange={e => setCForm(p => ({ ...p, password: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && handleCandidate()}
                    placeholder="••••••••" />
                  <button className="pw-toggle" onClick={() => setCShowPassword(!cShowPassword)} type="button" tabIndex={-1}>
                    <EyeIcon show={cShowPassword} />
                  </button>
                </div>
                {cTab === 'login' && (
                  <span className="forgot-link forgot-link-candidate"
                    onClick={() => { setCShowForgot(true); setCForgotEmail(cForm.email); setCForgotMsg(''); setCForgotErr('') }}>
                    Forgot password?
                  </span>
                )}
              </div>

              <div className="info-box" style={{ marginBottom: 20 }}>
                <span className="info-box-icon">✦</span>
                <div>
                  <p className="info-box-title">Smart Candidate Experience</p>
                  <p className="info-box-text">
                    AI-ranked job matches · Resume scoring · Video interviews · Real-time status tracking
                  </p>
                </div>
              </div>

              <div className="spacer" />

              <button className="btn-candidate" onClick={handleCandidate} disabled={cLoading}>
                {cLoading ? 'Please wait...' : cTab === 'login' ? '→  Sign In' : '→  Create Account'}
              </button>

              <p className="link-text">
                {cTab === 'login' ? "Don't have an account? " : 'Already registered? '}
                <span className="link-candidate"
                  onClick={() => { setCTab(cTab === 'login' ? 'register' : 'login'); setCError('') }}>
                  {cTab === 'login' ? 'Register here' : 'Sign in'}
                </span>
              </p>
            </div>
          </div>

          {/* ── Footer ── */}
          <div className="footer">
            <div className="footer-divider">
              <div className="footer-line" />
              <span className="footer-logo">AI RECRUITMENT · v1.0</span>
              <div className="footer-line" />
            </div>
            <p className="footer-text">© 2026 AI-Based End-to-End Recruitment Process · All rights reserved</p>
          </div>
        </div>
      </div>

      {/* ══ Staff Forgot Password Modal ══ */}
      {hmShowForgot && (
        <div className="modal-overlay" onClick={() => setHmShowForgot(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-icon modal-icon-staff">🔑</div>
            <h2 className="modal-title">Forgot Password?</h2>
            <p className="modal-sub">
              Enter your staff email address and we'll send you a link to reset your password.
            </p>

            <label className="field-label">Email Address</label>
            <div className="pw-wrap pw-wrap-staff" style={{ marginBottom: 12 }}>
              <input className="pw-input" type="email"
                value={hmForgotEmail}
                onChange={e => setHmForgotEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleHmForgot()}
                placeholder="you@company.com"
                autoFocus />
            </div>

            {hmForgotErr && <div className="error-box"><span>⚠</span> {hmForgotErr}</div>}
            {hmForgotMsg && <div className="success-box"><span>✓</span> {hmForgotMsg}</div>}

            <div className="modal-actions">
              <button className="modal-btn-primary modal-btn-staff"
                onClick={handleHmForgot} disabled={hmForgotLoading}>
                {hmForgotLoading ? 'Sending...' : '→ Send Reset Link'}
              </button>
              <button className="modal-btn-cancel"
                onClick={() => { setHmShowForgot(false); setHmForgotMsg(''); setHmForgotErr('') }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ Candidate Forgot Password Modal ══ */}
      {cShowForgot && (
        <div className="modal-overlay" onClick={() => setCShowForgot(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-icon modal-icon-candidate">🔑</div>
            <h2 className="modal-title">Forgot Password?</h2>
            <p className="modal-sub">
              Enter your candidate email address and we'll send you a link to reset your password.
            </p>

            <label className="field-label">Email Address</label>
            <div className="pw-wrap pw-wrap-candidate" style={{ marginBottom: 12 }}>
              <input className="pw-input" type="email"
                value={cForgotEmail}
                onChange={e => setCForgotEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCForgot()}
                placeholder="you@example.com"
                autoFocus />
            </div>

            {cForgotErr && <div className="error-box"><span>⚠</span> {cForgotErr}</div>}
            {cForgotMsg && <div className="success-box"><span>✓</span> {cForgotMsg}</div>}

            <div className="modal-actions">
              <button className="modal-btn-primary modal-btn-candidate"
                onClick={handleCForgot} disabled={cForgotLoading}>
                {cForgotLoading ? 'Sending...' : '→ Send Reset Link'}
              </button>
              <button className="modal-btn-cancel"
                onClick={() => { setCShowForgot(false); setCForgotMsg(''); setCForgotErr('') }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}