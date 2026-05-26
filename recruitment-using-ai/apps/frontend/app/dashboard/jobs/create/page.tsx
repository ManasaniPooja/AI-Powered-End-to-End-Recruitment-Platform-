'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

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
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=IBM+Plex+Mono:wght@400;500;600&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .jd-page {
          min-height: 100vh;
          background: #050c1a;
          font-family: 'Plus Jakarta Sans', sans-serif;
          color: white;
          position: relative;
          overflow-x: hidden;
        }

        .bg-grid {
          position: fixed;
          inset: 0;
          background-image:
            linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px);
          background-size: 40px 40px;
          pointer-events: none;
          z-index: 0;
        }

        .bg-glow-1 {
          position: fixed;
          width: 600px; height: 600px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%);
          top: -200px; left: -200px;
          pointer-events: none;
          z-index: 0;
        }

        .bg-glow-2 {
          position: fixed;
          width: 500px; height: 500px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%);
          bottom: -150px; right: -150px;
          pointer-events: none;
          z-index: 0;
        }

        .content { position: relative; z-index: 1; }

        /* NAV */
        .nav {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 40px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          background: rgba(5,12,26,0.8);
          backdrop-filter: blur(20px);
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .nav-brand {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .nav-logo {
          width: 36px; height: 36px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          font-weight: 900; font-size: 16px;
          box-shadow: 0 4px 12px rgba(99,102,241,0.4);
        }

        .nav-title {
          font-size: 15px;
          font-weight: 700;
          color: rgba(255,255,255,0.9);
        }

        .nav-back {
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.5);
          padding: 8px 18px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          font-family: 'Plus Jakarta Sans', sans-serif;
          transition: all 0.2s;
        }

        .nav-back:hover {
          background: rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.8);
        }

        /* MAIN */
        .main {
          max-width: 900px;
          margin: 0 auto;
          padding: 48px 24px 80px;
        }

        /* PAGE HEADER */
        .page-header {
          display: flex;
          align-items: center;
          gap: 18px;
          margin-bottom: 40px;
        }

        .header-icon {
          width: 56px; height: 56px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          border-radius: 16px;
          display: flex; align-items: center; justify-content: center;
          font-size: 26px;
          box-shadow: 0 8px 24px rgba(99,102,241,0.4);
          flex-shrink: 0;
        }

        .page-header h1 {
          font-size: 26px;
          font-weight: 900;
          color: white;
          line-height: 1.2;
          letter-spacing: -0.02em;
        }

        .page-header p {
          color: rgba(255,255,255,0.4);
          font-size: 14px;
          margin-top: 4px;
        }

        /* STEP CARD */
        .step-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px;
          overflow: hidden;
          margin-bottom: 24px;
          transition: border-color 0.3s;
        }

        .step-card:hover {
          border-color: rgba(255,255,255,0.12);
        }

        .step-header {
          padding: 20px 28px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .step-badge {
          width: 34px; height: 34px;
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          font-size: 13px;
          font-weight: 800;
          color: white;
          flex-shrink: 0;
        }

        .step-badge-purple { background: linear-gradient(135deg, #6366f1, #8b5cf6); box-shadow: 0 4px 12px rgba(99,102,241,0.35); }
        .step-badge-green  { background: linear-gradient(135deg, #10b981, #059669); box-shadow: 0 4px 12px rgba(16,185,129,0.35); }

        .step-header h3 { font-size: 16px; font-weight: 800; color: white; }
        .step-header p  { font-size: 12px; color: rgba(255,255,255,0.35); margin-top: 2px; }

        .step-body { padding: 28px; }

        /* TEXTAREA */
        .brief-textarea {
          width: 100%;
          background: rgba(255,255,255,0.05);
          border: 1.5px solid rgba(255,255,255,0.1);
          border-radius: 14px;
          padding: 16px 18px;
          color: white;
          font-size: 14px;
          line-height: 1.7;
          resize: none;
          outline: none;
          min-height: 150px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          transition: border-color 0.2s;
        }

        .brief-textarea::placeholder { color: rgba(255,255,255,0.25); }
        .brief-textarea:focus { border-color: rgba(99,102,241,0.6); }

        .textarea-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 16px;
        }

        .char-count {
          font-size: 12px;
          color: rgba(255,255,255,0.25);
          font-family: 'IBM Plex Mono', monospace;
        }

        /* BUTTONS */
        .btn-generate {
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: white;
          padding: 13px 32px;
          border-radius: 12px;
          border: none;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          font-family: 'Plus Jakarta Sans', sans-serif;
          box-shadow: 0 4px 20px rgba(99,102,241,0.4);
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .btn-generate:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 24px rgba(99,102,241,0.5);
        }

        .btn-generate:disabled {
          background: rgba(255,255,255,0.08);
          box-shadow: none;
          cursor: not-allowed;
        }

        .btn-publish {
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          padding: 13px 32px;
          border-radius: 12px;
          border: none;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          font-family: 'Plus Jakarta Sans', sans-serif;
          box-shadow: 0 4px 20px rgba(16,185,129,0.4);
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .btn-publish:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 24px rgba(16,185,129,0.5);
        }

        .btn-publish:disabled {
          background: rgba(255,255,255,0.08);
          box-shadow: none;
          cursor: not-allowed;
        }

        .btn-regenerate {
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.12);
          color: rgba(255,255,255,0.6);
          padding: 13px 24px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          font-family: 'Plus Jakarta Sans', sans-serif;
          transition: all 0.2s;
        }

        .btn-regenerate:hover {
          background: rgba(255,255,255,0.1);
          color: white;
        }

        /* GENERATING STATE */
        .generating-overlay {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 48px 28px;
          gap: 16px;
        }

        .spinner {
          width: 44px; height: 44px;
          border-radius: 50%;
          border: 3px solid rgba(99,102,241,0.2);
          border-top-color: #6366f1;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        .generating-text {
          font-size: 15px;
          font-weight: 700;
          color: rgba(255,255,255,0.7);
        }

        .generating-sub {
          font-size: 13px;
          color: rgba(255,255,255,0.3);
          text-align: center;
        }

        /* JD DISPLAY */
        .jd-title-section {
          margin-bottom: 24px;
          padding-bottom: 24px;
          border-bottom: 1px solid rgba(255,255,255,0.07);
        }

        .jd-label {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          font-weight: 600;
          color: rgba(255,255,255,0.3);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 8px;
        }

        .jd-title {
          font-size: 28px;
          font-weight: 900;
          color: white;
          letter-spacing: -0.02em;
          line-height: 1.2;
        }

        .jd-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 14px;
        }

        .jd-tag {
          background: rgba(99,102,241,0.12);
          border: 1px solid rgba(99,102,241,0.25);
          color: #a78bfa;
          font-size: 12px;
          font-weight: 600;
          padding: 5px 14px;
          border-radius: 50px;
        }

        /* JD SECTIONS */
        .jd-sections {
          display: flex;
          flex-direction: column;
          gap: 28px;
        }

        .jd-section {}

        .jd-section-title {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          font-weight: 600;
          color: rgba(255,255,255,0.3);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .jd-section-title::after {
          content: '';
          flex: 1;
          height: 1px;
          background: rgba(255,255,255,0.06);
        }

        .jd-summary-text {
          font-size: 15px;
          color: rgba(255,255,255,0.75);
          line-height: 1.85;
          background: rgba(255,255,255,0.03);
          border-left: 3px solid rgba(99,102,241,0.5);
          padding: 16px 20px;
          border-radius: 0 12px 12px 0;
        }

        .jd-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .jd-list-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 12px 16px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 10px;
          transition: background 0.2s, border-color 0.2s;
        }

        .jd-list-item:hover {
          background: rgba(255,255,255,0.05);
          border-color: rgba(255,255,255,0.1);
        }

        .jd-dot-purple {
          width: 7px; height: 7px;
          background: #6366f1;
          border-radius: 50%;
          flex-shrink: 0;
          margin-top: 6px;
        }

        .jd-dot-green {
          width: 7px; height: 7px;
          background: #10b981;
          border-radius: 50%;
          flex-shrink: 0;
          margin-top: 6px;
        }

        .jd-list-text {
          font-size: 14px;
          color: rgba(255,255,255,0.72);
          line-height: 1.65;
        }

        /* JD ACTION ROW */
        .jd-actions {
          display: flex;
          gap: 12px;
          padding-top: 24px;
          border-top: 1px solid rgba(255,255,255,0.07);
          flex-wrap: wrap;
        }

        /* AI BADGE */
        .ai-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(16,185,129,0.1);
          border: 1px solid rgba(16,185,129,0.2);
          color: #34d399;
          font-size: 11px;
          font-weight: 700;
          padding: 5px 12px;
          border-radius: 50px;
          font-family: 'IBM Plex Mono', monospace;
        }

        .ai-dot {
          width: 6px; height: 6px;
          background: #34d399;
          border-radius: 50%;
          animation: pulse-dot 1.5s ease-in-out infinite;
        }

        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.7); }
        }

        /* ALERT BOXES */
        .alert-error {
          background: rgba(239,68,68,0.08);
          border: 1px solid rgba(239,68,68,0.2);
          color: #f87171;
          font-size: 13px;
          padding: 13px 18px;
          border-radius: 12px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .alert-success {
          background: rgba(16,185,129,0.08);
          border: 1px solid rgba(16,185,129,0.2);
          color: #34d399;
          font-size: 13px;
          padding: 13px 18px;
          border-radius: 12px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        /* STEP HEADER ROW — with AI badge on right */
        .step-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
        }

        /* TIPS ROW */
        .tips-row {
          display: flex;
          gap: 12px;
          margin-bottom: 28px;
          flex-wrap: wrap;
        }

        .tip-chip {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 50px;
          padding: 7px 14px;
          font-size: 12px;
          color: rgba(255,255,255,0.4);
          cursor: pointer;
          transition: all 0.2s;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }

        .tip-chip:hover {
          background: rgba(99,102,241,0.1);
          border-color: rgba(99,102,241,0.3);
          color: rgba(255,255,255,0.7);
        }
      `}</style>

      <div className="jd-page">
        <div className="bg-grid" />
        <div className="bg-glow-1" />
        <div className="bg-glow-2" />

        <div className="content">
          {/* NAV */}
          <nav className="nav">
            <div className="nav-brand">
              <div className="nav-logo">R</div>
              <span className="nav-title">Recruitment Using AI</span>
            </div>
            <button className="nav-back" onClick={() => router.push('/dashboard')}>
              ← Back to Dashboard
            </button>
          </nav>

          {/* MAIN */}
          <div className="main">
            {/* Page Header */}
            <div className="page-header">
              <div className="header-icon">✨</div>
              <div>
                <h1>Job Creation Wizard</h1>
                <p>Describe the role in plain words — AI crafts a professional job description instantly</p>
              </div>
            </div>

            {/* Quick tip chips */}
            <div className="tips-row">
              {[
                '💡 Include experience level',
                '📍 Mention location / remote',
                '🛠 List key skills needed',
                '💼 Specify job type (full-time / contract)',
              ].map(tip => (
                <span key={tip} className="tip-chip">{tip}</span>
              ))}
            </div>

            {/* STEP 1 — Brief Input */}
            <div className="step-card">
              <div className="step-header">
                <div className="step-badge step-badge-purple">1</div>
                <div>
                  <h3>Enter Job Brief</h3>
                  <p>Write a rough description — AI handles the rest</p>
                </div>
              </div>
              <div className="step-body">
                <textarea
                  className="brief-textarea"
                  value={brief}
                  onChange={e => setBrief(e.target.value)}
                  placeholder="e.g. We need a Python developer with 2 years experience in Django and REST APIs, remote, full-time, startup environment, competitive salary..."
                  rows={6}
                />
                <div className="textarea-footer">
                  <span className="char-count">{brief.length} chars</span>
                  <button
                    className="btn-generate"
                    onClick={generateJD}
                    disabled={generating}
                  >
                    {generating ? (
                      <>
                        <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                        Generating…
                      </>
                    ) : (
                      <>✨ Generate Job Description</>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Alerts */}
            {error && (
              <div className="alert-error">
                <span>⚠️</span> {error}
              </div>
            )}
            {success && (
              <div className="alert-success">
                <span>✅</span> {success}
              </div>
            )}

            {/* Generating skeleton */}
            {generating && (
              <div className="step-card">
                <div className="generating-overlay">
                  <div className="spinner" />
                  <p className="generating-text">AI is crafting your job description…</p>
                  <p className="generating-sub">Analysing brief · Structuring content · Polishing language</p>
                </div>
              </div>
            )}

            {/* STEP 2 — Generated JD */}
            {generatedJD && !generating && (
              <div className="step-card" style={{ borderColor: 'rgba(16,185,129,0.15)' }}>
                {/* Card Header */}
                <div className="step-header">
                  <div className="step-badge step-badge-green">2</div>
                  <div className="step-header-row">
                    <div>
                      <h3>Review Generated Job Description</h3>
                      <p>AI-crafted — review and publish when ready</p>
                    </div>
                    <div className="ai-badge">
                      <div className="ai-dot" />
                      AI Generated
                    </div>
                  </div>
                </div>

                <div className="step-body">
                  {/* Title + Tags */}
                  <div className="jd-title-section">
                    <div className="jd-label">Position</div>
                    <div className="jd-title">{generatedJD.title}</div>

                    {(generatedJD.jobType || generatedJD.location || generatedJD.experienceLevel) && (
                      <div className="jd-tags">
                        {[generatedJD.jobType, generatedJD.location, generatedJD.experienceLevel]
                          .filter(Boolean)
                          .map((tag: string) => (
                            <span key={tag} className="jd-tag">{tag}</span>
                          ))}
                      </div>
                    )}
                  </div>

                  {/* Sections */}
                  <div className="jd-sections">

                    {/* Summary */}
                    {generatedJD.summary && (
                      <div className="jd-section">
                        <div className="jd-section-title">Overview</div>
                        <div className="jd-summary-text">{generatedJD.summary}</div>
                      </div>
                    )}

                    {/* Requirements */}
                    {generatedJD.requirements?.length > 0 && (
                      <div className="jd-section">
                        <div className="jd-section-title">Requirements</div>
                        <div className="jd-list">
                          {generatedJD.requirements.map((r: string, i: number) => (
                            <div key={i} className="jd-list-item">
                              <div className="jd-dot-purple" />
                              <span className="jd-list-text">{r}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Responsibilities */}
                    {generatedJD.responsibilities?.length > 0 && (
                      <div className="jd-section">
                        <div className="jd-section-title">Responsibilities</div>
                        <div className="jd-list">
                          {generatedJD.responsibilities.map((r: string, i: number) => (
                            <div key={i} className="jd-list-item">
                              <div className="jd-dot-green" />
                              <span className="jd-list-text">{r}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Nice-to-have / skills if present */}
                    {generatedJD.niceToHave?.length > 0 && (
                      <div className="jd-section">
                        <div className="jd-section-title">Nice to Have</div>
                        <div className="jd-list">
                          {generatedJD.niceToHave.map((r: string, i: number) => (
                            <div key={i} className="jd-list-item">
                              <div style={{ width: 7, height: 7, background: '#f59e0b', borderRadius: '50%', flexShrink: 0, marginTop: 6 }} />
                              <span className="jd-list-text">{r}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Benefits if present */}
                    {generatedJD.benefits?.length > 0 && (
                      <div className="jd-section">
                        <div className="jd-section-title">Benefits</div>
                        <div className="jd-list">
                          {generatedJD.benefits.map((r: string, i: number) => (
                            <div key={i} className="jd-list-item">
                              <div style={{ width: 7, height: 7, background: '#06b6d4', borderRadius: '50%', flexShrink: 0, marginTop: 6 }} />
                              <span className="jd-list-text">{r}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>

                  {/* Action Buttons */}
                  <div className="jd-actions">
                    <button
                      className="btn-regenerate"
                      onClick={() => { setGeneratedJD(null); setBrief('') }}
                    >
                      ↺ Start Over
                    </button>
                    <button
                      className="btn-regenerate"
                      onClick={() => { setGeneratedJD(null) }}
                      style={{ marginLeft: 0 }}
                    >
                      ✏️ Edit Brief
                    </button>
                    <button
                      className="btn-publish"
                      onClick={publishJob}
                      disabled={publishing}
                    >
                      {publishing ? (
                        <>
                          <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                          Publishing…
                        </>
                      ) : (
                        <>🚀 Publish Job</>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}