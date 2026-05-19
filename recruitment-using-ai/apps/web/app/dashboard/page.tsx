'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const API = 'https://ai-powered-end-to-end-recruitment-platform-production.up.railway.app'

export default function DashboardPage() {
  const router = useRouter()
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    if (!token) { router.push('/login'); return }
    if (userData) setUser(JSON.parse(userData))
    fetch(`${API}/api/jobs/public`)
      .then(r => r.json())
      .then(data => { setJobs(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const isAdmin = user?.role === 'HR_ADMIN'
  const isManager = user?.role === 'HIRING_MANAGER'

  const allFeatures = [
    { icon: 'âœ¨', title: 'Create New Job',      desc: 'AI-powered job description generator',      color: '#667eea', path: '/dashboard/jobs/create',  roles: ['HR_ADMIN', 'HIRING_MANAGER'] },
    { icon: 'ðŸ’¼', title: 'Job Management',       desc: 'View and manage all job postings',           color: '#764ba2', path: '/dashboard/jobs',          roles: ['HR_ADMIN', 'HIRING_MANAGER'] },
    { icon: 'ðŸ“¡', title: 'Post to Channels',     desc: 'Post jobs to LinkedIn, Indeed, Naukri',     color: '#06b6d4', path: '/dashboard/post',          roles: ['HR_ADMIN', 'HIRING_MANAGER'] },
    { icon: 'ðŸ“‹', title: 'Resume Screening',     desc: 'Ranked candidates with AI scores',           color: '#10b981', path: '/dashboard/candidates',    roles: ['HR_ADMIN', 'HIRING_MANAGER'] },
    { icon: 'ðŸ“Š', title: 'Candidate Evaluation', desc: 'Video scores, transcripts and analysis',    color: '#f59e0b', path: '/dashboard/evaluation',    roles: ['HR_ADMIN', 'HIRING_MANAGER'] },
    { icon: 'âš–ï¸', title: 'Shortlist Comparison', desc: 'Compare top candidates side-by-side',        color: '#a78bfa', path: '/dashboard/shortlist',     roles: ['HR_ADMIN', 'HIRING_MANAGER'] },
    { icon: 'ðŸ“', title: 'Offer Letters',         desc: 'AI-generated professional offer letters',   color: '#ef4444', path: '/dashboard/offer',         roles: ['HR_ADMIN', 'HIRING_MANAGER'] },
    { icon: 'ðŸ”', title: 'Bias Audit Panel',      desc: 'Pipeline fairness and anomaly detection',   color: '#f97316', path: '/dashboard/bias',          roles: ['HR_ADMIN'] },
    { icon: 'ðŸ’¬', title: 'Manager Feedback',      desc: 'Override AI decisions and rate candidates', color: '#ec4899', path: '/dashboard/feedback',      roles: ['HR_ADMIN', 'HIRING_MANAGER'] },
    { icon: 'ðŸŽ¥', title: 'Video Evaluation',      desc: 'AI-powered video interview analysis',       color: '#8b5cf6', path: '/dashboard/video',         roles: ['HR_ADMIN', 'HIRING_MANAGER'] },
    { icon: 'ðŸ—‚ï¸', title: 'Audit Log',             desc: 'Complete AI decision trail',               color: '#06b6d4', path: '/dashboard/audit',         roles: ['HR_ADMIN'] },
  ]

  const features = user
    ? allFeatures.filter(f => f.roles.includes(user.role))
    : allFeatures

  const roleColor = isAdmin ? '#10b981' : '#667eea'
  const roleLabel = isAdmin ? 'HR Admin' : isManager ? 'Hiring Manager' : 'User'
  const roleIcon = isAdmin ? 'ðŸ‘‘' : 'ðŸ’¼'

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f0c29, #1a1a2e, #16213e)', fontFamily: 'Segoe UI, sans-serif' }}>
      <nav style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '14px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, background: 'linear-gradient(135deg, #667eea, #764ba2)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'white', fontWeight: 'bold', fontSize: 18 }}>R</span>
          </div>
          <div>
            <h1 style={{ fontSize: 15, fontWeight: 700, color: 'white', margin: 0 }}>Recruitment Using AI</h1>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: 0 }}>Hiring Manager Dashboard</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {/* Role Badge */}
          {user && (
            <div style={{ background: `${roleColor}22`, border: `1px solid ${roleColor}44`, borderRadius: 20, padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 14 }}>{roleIcon}</span>
              <span style={{ color: roleColor, fontSize: 12, fontWeight: 700 }}>{roleLabel}</span>
            </div>
          )}
          {/* User email */}
          {user && (
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>{user.email}</span>
          )}
          <button onClick={() => router.push('/')} style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', padding: '7px 16px', borderRadius: 8, cursor: 'pointer' }}>
            Public Jobs
          </button>
          <button onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('user'); router.push('/login') }} style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, border: 'none', background: 'none', cursor: 'pointer' }}>
            Logout
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ marginBottom: 36 }}>
          <h2 style={{ color: 'white', fontSize: 28, fontWeight: 800, margin: 0 }}>Welcome back {roleIcon}</h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 15, marginTop: 6 }}>
            {isAdmin ? 'Full access â€” HR Admin Dashboard' : 'Hiring Manager Dashboard'}
          </p>
        </div>

        {/* Role info banner */}
        {!isAdmin && user && (
          <div style={{ background: 'rgba(102,126,234,0.08)', border: '1px solid rgba(102,126,234,0.2)', borderRadius: 12, padding: '14px 20px', marginBottom: 28, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 18 }}>â„¹ï¸</span>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, margin: 0 }}>
              <strong style={{ color: '#a78bfa' }}>Hiring Manager</strong> access â€” Bias Audit & Audit Log are restricted to HR Admins only
            </p>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 36 }}>
          {[
            { label: 'Active Jobs',  value: jobs.filter(j => j.status === 'PUBLISHED').length, icon: 'ðŸ’¼', color: '#667eea' },
            { label: 'Total Jobs',   value: jobs.length,                                        icon: 'ðŸ“‹', color: '#10b981' },
            { label: 'Draft Jobs',   value: jobs.filter(j => j.status === 'DRAFT').length,     icon: 'ðŸ“', color: '#f59e0b' },
          ].map(s => (
            <div key={s.label} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, margin: 0 }}>{s.label}</p>
                <p style={{ color: 'white', fontSize: 32, fontWeight: 800, margin: '4px 0 0' }}>{loading ? '...' : s.value}</p>
              </div>
              <span style={{ fontSize: 32 }}>{s.icon}</span>
            </div>
          ))}
        </div>

        <h3 style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 16px' }}>Quick Actions</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 40 }}>
          {features.map(f => (
            <div key={f.title} onClick={() => router.push(f.path)}
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '22px 24px', cursor: 'pointer', transition: 'all 0.2s', position: 'relative' as const }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.09)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}>
              {/* Admin only badge */}
              {f.roles.length === 1 && f.roles[0] === 'HR_ADMIN' && (
                <div style={{ position: 'absolute' as const, top: 12, right: 12, background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 20, padding: '2px 8px' }}>
                  <span style={{ color: '#10b981', fontSize: 9, fontWeight: 700 }}>ADMIN ONLY</span>
                </div>
              )}
              <div style={{ width: 44, height: 44, borderRadius: 12, background: `${f.color}22`, border: `1px solid ${f.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14, fontSize: 22 }}>
                {f.icon}
              </div>
              <h4 style={{ color: 'white', fontSize: 15, fontWeight: 700, margin: 0 }}>{f.title}</h4>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, margin: '6px 0 0', lineHeight: 1.5 }}>{f.desc}</p>
              <p style={{ color: f.color, fontSize: 12, fontWeight: 600, margin: '12px 0 0' }}>Open â†’</p>
            </div>
          ))}
        </div>

        <h3 style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 16px' }}>Recent Job Postings</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {loading ? (
            <p style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: 24 }}>Loading...</p>
          ) : jobs.slice(0, 5).map(job => {
            const desc = job.description as any
            return (
              <div key={job.id} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ color: 'white', fontWeight: 600, fontSize: 15, margin: 0 }}>{job.title}</p>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, margin: '4px 0 0' }}>{desc?.jobType} â€¢ {desc?.location || 'Remote'}</p>
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <span style={{ fontSize: 12, padding: '4px 12px', borderRadius: 50, fontWeight: 600, background: job.status === 'PUBLISHED' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)', color: job.status === 'PUBLISHED' ? '#10b981' : '#f59e0b' }}>
                    {job.status}
                  </span>
                  <button onClick={() => router.push('/dashboard/candidates')} style={{ background: 'rgba(102,126,234,0.15)', color: '#a78bfa', border: '1px solid rgba(102,126,234,0.3)', padding: '6px 14px', borderRadius: 8, fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
                    View Candidates
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
