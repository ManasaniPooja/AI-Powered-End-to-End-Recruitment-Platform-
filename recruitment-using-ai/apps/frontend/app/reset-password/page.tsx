'use client'
import { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')

  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const handleSubmit = async () => {
    setError(''); setMessage('')
    if (!token) return setError('Invalid or missing reset token. Please request a new link.')
    if (newPassword.length < 6) return setError('Password must be at least 6 characters.')
    if (newPassword !== confirm) return setError('Passwords do not match.')

    setLoading(true)
    try {
      const res = await fetch(`${API}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      })
      const data = await res.json()
      if (!res.ok) return setError(data.message || 'Something went wrong.')
      setMessage(data.message)
      setDone(true)
      setTimeout(() => router.push('/login'), 3000)
    } catch {
      setError('Connection failed. Is the API running?')
    } finally {
      setLoading(false)
    }
  }

  const strength = newPassword.length === 0 ? 0
    : newPassword.length < 6 ? 1
    : newPassword.length < 10 ? 2
    : /[A-Z]/.test(newPassword) && /[0-9]/.test(newPassword) && /[^A-Za-z0-9]/.test(newPassword) ? 4
    : 3

  const strengthLabel = ['', 'Too short', 'Weak', 'Good', 'Strong']
  const strengthColor = ['', '#ef4444', '#f97316', '#eab308', '#22c55e']

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }

        .rp-root {
          min-height: 100vh;
          background: #050818;
          font-family: 'Sora', sans-serif;
          display: flex; align-items: center; justify-content: center;
          padding: 40px 20px;
          position: relative; overflow: hidden;
        }

        .bg-mesh { position: fixed; inset: 0; pointer-events: none; z-index: 0; }
        .bg-orb {
          position: absolute; border-radius: 50%;
          filter: blur(80px); opacity: 0.15;
          animation: drift 12s ease-in-out infinite;
        }
        .bg-orb-1 { width: 500px; height: 500px; background: #3b4fd8; top: -150px; left: -100px; }
        .bg-orb-2 { width: 400px; height: 400px; background: #7c3aed; bottom: -100px; right: -80px; animation-delay: -5s; }
        .bg-dots {
          position: fixed; inset: 0;
          background-image: radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px);
          background-size: 28px 28px; pointer-events: none; z-index: 0;
        }
        @keyframes drift {
          0%, 100% { transform: translate(0,0) scale(1); }
          50% { transform: translate(20px, -15px) scale(1.04); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes checkPop {
          0%   { transform: scale(0) rotate(-10deg); opacity: 0; }
          60%  { transform: scale(1.2) rotate(3deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }

        .rp-card {
          position: relative; z-index: 10;
          width: 100%; max-width: 420px;
          background: rgba(255,255,255,0.035);
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 24px; padding: 40px 36px;
          backdrop-filter: blur(20px);
          box-shadow: 0 32px 80px rgba(0,0,0,0.5);
          animation: fadeUp 0.6s ease forwards;
        }

        .rp-icon {
          width: 60px; height: 60px; border-radius: 18px;
          background: linear-gradient(135deg, #3b82f6, #6366f1);
          box-shadow: 0 8px 28px rgba(99,102,241,0.45);
          display: flex; align-items: center; justify-content: center;
          font-size: 26px; margin-bottom: 22px;
        }
        .rp-title { font-size: 22px; font-weight: 800; color: #f1f5f9; margin-bottom: 6px; letter-spacing: -0.02em; }
        .rp-sub { font-size: 13px; color: #64748b; margin-bottom: 28px; line-height: 1.5; }

        .field { margin-bottom: 16px; }
        .field-label {
          display: block; font-size: 11px; font-weight: 600; color: #475569;
          margin-bottom: 7px; letter-spacing: 0.06em; text-transform: uppercase;
          font-family: 'JetBrains Mono', monospace;
        }

        .pw-wrap {
          display: flex; align-items: center;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 11px; overflow: hidden;
          transition: border-color 0.2s, background 0.2s;
        }
        .pw-wrap:focus-within {
          border-color: rgba(99,102,241,0.6);
          background: rgba(255,255,255,0.07);
          box-shadow: 0 0 0 3px rgba(99,102,241,0.08);
        }
        .pw-input {
          flex: 1; background: transparent; border: none;
          padding: 12px 14px; font-size: 13px; color: #e2e8f0;
          outline: none; font-family: 'Sora', sans-serif; min-width: 0;
        }
        .pw-input::placeholder { color: #334155; }
        .pw-toggle {
          padding: 0 13px; cursor: pointer; background: transparent;
          border: none; display: flex; align-items: center;
          transition: opacity 0.2s; flex-shrink: 0;
        }
        .pw-toggle:hover { opacity: 0.7; }

        /* Strength bar */
        .strength-bar-wrap { margin-top: 8px; }
        .strength-bars { display: flex; gap: 4px; margin-bottom: 4px; }
        .strength-bar {
          flex: 1; height: 3px; border-radius: 2px;
          background: rgba(255,255,255,0.08);
          transition: background 0.3s;
        }
        .strength-label { font-size: 11px; font-family: 'JetBrains Mono', monospace; }

        .error-box {
          display: flex; align-items: center; gap: 8px;
          background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2);
          color: #f87171; font-size: 12px; padding: 10px 13px;
          border-radius: 10px; margin-bottom: 16px;
        }

        /* Success state */
        .success-card {
          text-align: center; padding: 12px 0;
        }
        .success-icon {
          width: 72px; height: 72px; border-radius: 50%;
          background: linear-gradient(135deg, #10b981, #059669);
          box-shadow: 0 8px 32px rgba(16,185,129,0.45);
          display: flex; align-items: center; justify-content: center;
          font-size: 32px; margin: 0 auto 20px;
          animation: checkPop 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards;
        }
        .success-title { font-size: 20px; font-weight: 800; color: #f1f5f9; margin-bottom: 8px; }
        .success-sub { font-size: 13px; color: #64748b; line-height: 1.6; margin-bottom: 20px; }
        .redirect-bar-wrap {
          height: 3px; background: rgba(255,255,255,0.07);
          border-radius: 2px; overflow: hidden; margin-bottom: 16px;
        }
        .redirect-bar {
          height: 100%; width: 100%;
          background: linear-gradient(90deg, #10b981, #059669);
          border-radius: 2px;
          animation: shrink 3s linear forwards;
        }
        @keyframes shrink {
          from { width: 100%; }
          to   { width: 0%; }
        }
        .redirect-note { font-size: 11px; color: #475569; font-family: 'JetBrains Mono', monospace; }

        .btn-reset {
          width: 100%; padding: 14px;
          background: linear-gradient(135deg, #3b82f6, #6366f1);
          color: white; border: none; border-radius: 11px;
          font-size: 14px; font-weight: 700; cursor: pointer;
          font-family: 'Sora', sans-serif;
          box-shadow: 0 4px 20px rgba(99,102,241,0.4);
          transition: all 0.2s; margin-top: 4px;
        }
        .btn-reset:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 28px rgba(99,102,241,0.5); }
        .btn-reset:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

        .back-link {
          display: block; text-align: center; margin-top: 18px;
          font-size: 12px; color: #475569; cursor: pointer;
        }
        .back-link span { color: #818cf8; font-weight: 700; }
        .back-link span:hover { color: #a5b4fc; }

        /* Invalid token state */
        .invalid-card { text-align: center; padding: 8px 0; }
        .invalid-icon {
          width: 64px; height: 64px; border-radius: 50%;
          background: rgba(239,68,68,0.15); border: 2px solid rgba(239,68,68,0.3);
          display: flex; align-items: center; justify-content: center;
          font-size: 28px; margin: 0 auto 20px;
        }
        .invalid-title { font-size: 18px; font-weight: 700; color: #f1f5f9; margin-bottom: 8px; }
        .invalid-sub { font-size: 13px; color: #64748b; margin-bottom: 24px; line-height: 1.5; }
        .btn-back {
          display: inline-block; padding: 12px 28px;
          background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);
          color: #94a3b8; border-radius: 10px; font-size: 13px;
          font-weight: 600; cursor: pointer; font-family: 'Sora', sans-serif;
          transition: all 0.2s;
        }
        .btn-back:hover { background: rgba(255,255,255,0.1); color: #e2e8f0; }
      `}</style>

      <div className="rp-root">
        <div className="bg-mesh">
          <div className="bg-orb bg-orb-1" />
          <div className="bg-orb bg-orb-2" />
        </div>
        <div className="bg-dots" />

        <div className="rp-card">

          {/* ── No token ── */}
          {!token ? (
            <div className="invalid-card">
              <div className="invalid-icon">⛔</div>
              <h2 className="invalid-title">Invalid Reset Link</h2>
              <p className="invalid-sub">
                This password reset link is invalid or has already been used.<br />
                Please request a new one from the login page.
              </p>
              <button className="btn-back" onClick={() => router.push('/login')}>
                ← Back to Login
              </button>
            </div>

          /* ── Success ── */
          ) : done ? (
            <div className="success-card">
              <div className="success-icon">✓</div>
              <h2 className="success-title">Password Reset!</h2>
              <p className="success-sub">
                Your password has been updated successfully.<br />
                Redirecting you to the login page…
              </p>
              <div className="redirect-bar-wrap">
                <div className="redirect-bar" />
              </div>
              <p className="redirect-note">Redirecting in 3 seconds…</p>
            </div>

          /* ── Form ── */
          ) : (
            <>
              <div className="rp-icon">🔐</div>
              <h1 className="rp-title">Set New Password</h1>
              <p className="rp-sub">Choose a strong password for your account. It must be at least 6 characters.</p>

              {error && <div className="error-box"><span>⚠</span> {error}</div>}

              {/* New password */}
              <div className="field">
                <label className="field-label">New Password</label>
                <div className="pw-wrap">
                  <input className="pw-input"
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    autoFocus />
                  <button className="pw-toggle" onClick={() => setShowNew(!showNew)} type="button" tabIndex={-1}>
                    <span style={{ fontSize: 16 }}>{showNew ? '🙈' : '👁️'}</span>
                  </button>
                </div>

                {/* Strength indicator */}
                {newPassword.length > 0 && (
                  <div className="strength-bar-wrap">
                    <div className="strength-bars">
                      {[1,2,3,4].map(i => (
                        <div key={i} className="strength-bar"
                          style={{ background: i <= strength ? strengthColor[strength] : undefined }} />
                      ))}
                    </div>
                    <span className="strength-label" style={{ color: strengthColor[strength] }}>
                      {strengthLabel[strength]}
                    </span>
                  </div>
                )}
              </div>

              {/* Confirm password */}
              <div className="field">
                <label className="field-label">Confirm Password</label>
                <div className="pw-wrap" style={{
                  borderColor: confirm && confirm !== newPassword ? 'rgba(239,68,68,0.5)' : undefined
                }}>
                  <input className="pw-input"
                    type={showConfirm ? 'text' : 'password'}
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                    placeholder="Confirm new password" />
                  <button className="pw-toggle" onClick={() => setShowConfirm(!showConfirm)} type="button" tabIndex={-1}>
                    <span style={{ fontSize: 16 }}>{showConfirm ? '🙈' : '👁️'}</span>
                  </button>
                </div>
                {confirm && confirm !== newPassword && (
                  <p style={{ fontSize: 11, color: '#f87171', marginTop: 5, fontFamily: 'JetBrains Mono, monospace' }}>
                    Passwords do not match
                  </p>
                )}
                {confirm && confirm === newPassword && newPassword.length >= 6 && (
                  <p style={{ fontSize: 11, color: '#22c55e', marginTop: 5, fontFamily: 'JetBrains Mono, monospace' }}>
                    ✓ Passwords match
                  </p>
                )}
              </div>

              <button className="btn-reset" onClick={handleSubmit} disabled={loading}>
                {loading ? 'Resetting...' : '→  Reset Password'}
              </button>

              <p className="back-link" onClick={() => router.push('/login')}>
                Remembered it? <span>Back to Login</span>
              </p>
            </>
          )}
        </div>
      </div>
    </>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight:'100vh', background:'#050818', display:'flex',
        alignItems:'center', justifyContent:'center', color:'#64748b',
        fontFamily:'sans-serif', fontSize:14 }}>
        Loading…
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  )
}