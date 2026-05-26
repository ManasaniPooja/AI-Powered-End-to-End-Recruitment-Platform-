﻿'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

const PIPELINE_STAGES = [
  { key: 'APPLIED',     label: 'Applied',     color: '#6366f1', icon: '📥' },
  { key: 'SCREENING',   label: 'Screening',   color: '#06b6d4', icon: '🔍' },
  { key: 'SHORTLISTED', label: 'Shortlisted', color: '#a78bfa', icon: '⭐' },
  { key: 'INTERVIEWED', label: 'Interviewed', color: '#f59e0b', icon: '🎥' },
  { key: 'OFFERED',     label: 'Offered',     color: '#10b981', icon: '🎊' },
  { key: 'REJECTED',    label: 'Rejected',    color: '#ef4444', icon: '❌' },
]

export default function DashboardPage() {
  const router = useRouter()
  const [jobs, setJobs] = useState<any[]>([])
  const [applications, setApplications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [appsLoading, setAppsLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'pipeline' | 'jobs'>('overview')

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    if (!token) { router.push('/login'); return }
    if (userData) setUser(JSON.parse(userData))

    // Fetch jobs
    fetch(`${API}/api/jobs/public`)
      .then(r => r.json())
      .then(data => { setJobs(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))

    // Fetch all applications across jobs
    fetch(`${API}/api/applications/all`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then(data => { setApplications(Array.isArray(data) ? data : []); setAppsLoading(false) })
      .catch(() => setAppsLoading(false))
  }, [])

  const isAdmin = user?.role === 'HR_ADMIN' || user?.role === 'ADMIN'
  const isManager = user?.role === 'HIRING_MANAGER'
  const roleLabel = user?.role === 'ADMIN' ? 'Admin' : isAdmin ? 'HR Admin' : isManager ? 'Hiring Manager' : 'User'
  const roleColor = isAdmin ? '#10b981' : '#6366f1'

  // Pipeline counts
  const pipelineCounts = PIPELINE_STAGES.map(s => ({
    ...s,
    count: applications.filter(a => a.status === s.key).length,
  }))
  const totalApps = applications.length
  const maxCount = Math.max(...pipelineCounts.map(s => s.count), 1)

  // Per-job application counts
  const jobAppCounts = jobs.map(j => ({
    ...j,
    appCount: applications.filter(a => a.jobId === j.id).length,
  })).sort((a, b) => b.appCount - a.appCount)

  // Recent applications (last 7 days)
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  const recentApps = applications.filter(a => new Date(a.createdAt).getTime() > weekAgo).length

  // Conversion rate
  const conversionRate = totalApps > 0
    ? Math.round((pipelineCounts.find(s => s.key === 'OFFERED')?.count || 0) / totalApps * 100)
    : 0

  const allFeatures = [
    { icon: '✨', title: 'Create New Job',      desc: 'AI-powered job description generator',      color: '#6366f1', path: '/dashboard/jobs/create',  roles: ['HR_ADMIN', 'HIRING_MANAGER', 'ADMIN'] },
    { icon: '💼', title: 'Job Management',       desc: 'View and manage all job postings',           color: '#764ba2', path: '/dashboard/jobs',          roles: ['HR_ADMIN', 'HIRING_MANAGER', 'ADMIN'] },
    { icon: '📡', title: 'Post to Channels',     desc: 'Post jobs to LinkedIn, Indeed, Naukri',     color: '#06b6d4', path: '/dashboard/post',          roles: ['HR_ADMIN', 'HIRING_MANAGER', 'ADMIN'] },
    { icon: '📋', title: 'Resume Screening',     desc: 'Ranked candidates with AI scores',           color: '#10b981', path: '/dashboard/candidates',    roles: ['HR_ADMIN', 'HIRING_MANAGER', 'ADMIN'] },
    { icon: '📊', title: 'Candidate Evaluation', desc: 'Video scores, transcripts and analysis',    color: '#f59e0b', path: '/dashboard/evaluation',    roles: ['HR_ADMIN', 'HIRING_MANAGER', 'ADMIN'] },
    { icon: '⚖️', title: 'Shortlist Comparison', desc: 'Compare top candidates side-by-side',       color: '#a78bfa', path: '/dashboard/shortlist',     roles: ['HR_ADMIN', 'HIRING_MANAGER', 'ADMIN'] },
    { icon: '🔍', title: 'Bias Audit Panel',     desc: 'Pipeline fairness and anomaly detection',   color: '#f97316', path: '/dashboard/bias',          roles: ['HR_ADMIN', 'ADMIN'] },
    { icon: '💬', title: 'Manager Feedback',     desc: 'Override AI decisions and rate candidates', color: '#ec4899', path: '/dashboard/feedback',      roles: ['HR_ADMIN', 'HIRING_MANAGER', 'ADMIN'] },
    { icon: '🎥', title: 'Video Evaluation',     desc: 'AI-powered video interview analysis',       color: '#8b5cf6', path: '/dashboard/video',         roles: ['HR_ADMIN', 'HIRING_MANAGER', 'ADMIN'] },
    { icon: '🗂️', title: 'Audit Log',            desc: 'Complete AI decision trail',                color: '#06b6d4', path: '/dashboard/audit',         roles: ['HR_ADMIN', 'ADMIN'] },
    { icon: '📨', title: 'Offer Letters',        desc: 'Generate and send offer letters',           color: '#10b981', path: '/dashboard/offer',         roles: ['HR_ADMIN', 'HIRING_MANAGER', 'ADMIN'] },
  ]
  const features = user ? allFeatures.filter(f => f.roles.includes(user.role)) : allFeatures

  const tabStyle = (tab: string) => ({
    padding: '8px 20px',
    borderRadius: 8,
    border: 'none',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 600,
    transition: 'all 0.2s',
    background: activeTab === tab ? 'rgba(99,102,241,0.2)' : 'transparent',
    color: activeTab === tab ? '#818cf8' : 'rgba(255,255,255,0.4)',
    borderBottom: activeTab === tab ? '2px solid #6366f1' : '2px solid transparent',
  })

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f0c29, #1a1a2e, #16213e)', fontFamily: 'Segoe UI, sans-serif' }}>
      {/* Navbar */}
      <nav style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '14px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, background: 'linear-gradient(135deg, #6366f1, #764ba2)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'white', fontWeight: 'bold', fontSize: 18 }}>R</span>
          </div>
          <div>
            <h1 style={{ fontSize: 15, fontWeight: 700, color: 'white', margin: 0 }}>Recruitment Using AI</h1>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: 0 }}>{roleLabel} Dashboard</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {user && (
            <div style={{ background: `${roleColor}22`, border: `1px solid ${roleColor}44`, borderRadius: 20, padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: roleColor, fontSize: 12, fontWeight: 700 }}>{roleLabel}</span>
            </div>
          )}
          {user && <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>{user.email}</span>}
          <button onClick={() => router.push('/')} style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', padding: '7px 16px', borderRadius: 8, cursor: 'pointer' }}>
            Public Jobs
          </button>
          <button onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('user'); router.push('/login') }} style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, border: 'none', background: 'none', cursor: 'pointer' }}>
            Logout
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '40px 24px' }}>
        {/* Header */}
        <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h2 style={{ color: 'white', fontSize: 28, fontWeight: 800, margin: 0 }}>Welcome back 👋</h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 15, marginTop: 6, margin: '6px 0 0 0' }}>
              {isAdmin ? 'Full access — HR Admin Dashboard' : 'Hiring Manager Dashboard'}
            </p>
          </div>
          <button onClick={() => router.push('/dashboard/jobs/create')}
            style={{ background: 'linear-gradient(135deg, #6366f1, #764ba2)', color: 'white', border: 'none', borderRadius: 10, padding: '10px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            + Create Job
          </button>
        </div>

        {/* KPI Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 32 }}>
          {[
            { label: 'Total Applications', value: appsLoading ? '...' : totalApps,        icon: '📥', color: '#6366f1', sub: `${recentApps} this week` },
            { label: 'Active Jobs',         value: loading ? '...' : jobs.filter(j => j.status === 'PUBLISHED').length, icon: '💼', color: '#06b6d4', sub: `${jobs.length} total` },
            { label: 'Shortlisted',         value: appsLoading ? '...' : pipelineCounts.find(s => s.key === 'SHORTLISTED')?.count ?? 0, icon: '⭐', color: '#a78bfa', sub: 'candidates' },
            { label: 'Interviewed',         value: appsLoading ? '...' : pipelineCounts.find(s => s.key === 'INTERVIEWED')?.count ?? 0, icon: '🎥', color: '#f59e0b', sub: 'completed' },
            { label: 'Offer Rate',          value: appsLoading ? '...' : `${conversionRate}%`, icon: '🎊', color: '#10b981', sub: `${pipelineCounts.find(s => s.key === 'OFFERED')?.count ?? 0} offers sent` },
          ].map((stat, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '20px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: -10, right: -10, fontSize: 48, opacity: 0.07 }}>{stat.icon}</div>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', margin: '0 0 8px 0' }}>{stat.label}</p>
              <p style={{ color: stat.color, fontSize: 30, fontWeight: 800, margin: '0 0 4px 0' }}>{stat.value}</p>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, margin: 0 }}>{stat.sub}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 28, borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 0 }}>
          <button style={tabStyle('overview')} onClick={() => setActiveTab('overview')}>Overview</button>
          <button style={tabStyle('pipeline')} onClick={() => setActiveTab('pipeline')}>Pipeline Funnel</button>
          <button style={tabStyle('jobs')} onClick={() => setActiveTab('jobs')}>Jobs & Applications</button>
        </div>

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <>
            {/* Pipeline mini bar chart */}
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '24px', marginBottom: 24 }}>
              <h3 style={{ color: 'white', fontSize: 14, fontWeight: 700, margin: '0 0 20px 0' }}>Application Pipeline</h3>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 120 }}>
                {pipelineCounts.filter(s => s.key !== 'REJECTED').map((stage) => {
                  const pct = maxCount > 0 ? (stage.count / maxCount) * 100 : 0
                  return (
                    <div key={stage.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                      <span style={{ color: stage.color, fontSize: 12, fontWeight: 700 }}>{appsLoading ? '-' : stage.count}</span>
                      <div style={{ width: '100%', height: 80, background: 'rgba(255,255,255,0.06)', borderRadius: 8, display: 'flex', alignItems: 'flex-end', overflow: 'hidden' }}>
                        <div style={{ width: '100%', height: `${pct}%`, background: `${stage.color}99`, borderRadius: 8, transition: 'height 0.6s ease', minHeight: stage.count > 0 ? 4 : 0 }} />
                      </div>
                      <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, textAlign: 'center' }}>{stage.label}</span>
                    </div>
                  )
                })}
                {/* Rejected separate */}
                {(() => {
                  const rejected = pipelineCounts.find(s => s.key === 'REJECTED')!
                  const pct = maxCount > 0 ? (rejected.count / maxCount) * 100 : 0
                  return (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, opacity: 0.6 }}>
                      <span style={{ color: rejected.color, fontSize: 12, fontWeight: 700 }}>{appsLoading ? '-' : rejected.count}</span>
                      <div style={{ width: '100%', height: 80, background: 'rgba(255,255,255,0.06)', borderRadius: 8, display: 'flex', alignItems: 'flex-end', overflow: 'hidden' }}>
                        <div style={{ width: '100%', height: `${pct}%`, background: `${rejected.color}99`, borderRadius: 8, transition: 'height 0.6s ease', minHeight: rejected.count > 0 ? 4 : 0 }} />
                      </div>
                      <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, textAlign: 'center' }}>{rejected.label}</span>
                    </div>
                  )
                })()}
              </div>
            </div>

            {/* Quick Actions — FIX: removed .slice(0, 8) so all features render */}
            <h3 style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>Quick Actions</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 36 }}>
              {features.map((f, i) => (
                <div key={i} onClick={() => router.push(f.path)}
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '18px', cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.08)'; (e.currentTarget as HTMLDivElement).style.borderColor = `${f.color}44` }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.04)'; (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.08)' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: `${f.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                    <span style={{ fontSize: 20 }}>{f.icon}</span>
                  </div>
                  <h4 style={{ color: 'white', fontSize: 13, fontWeight: 700, margin: '0 0 4px 0' }}>{f.title}</h4>
                  <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, margin: '0 0 10px 0' }}>{f.desc}</p>
                  <span style={{ color: f.color, fontSize: 11, fontWeight: 600 }}>Open →</span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* PIPELINE FUNNEL TAB */}
        {activeTab === 'pipeline' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, margin: '0 0 16px 0' }}>
              Candidate flow across all active jobs — {appsLoading ? 'loading...' : `${totalApps} total applications`}
            </p>
            {pipelineCounts.map((stage, i) => {
              const pct = totalApps > 0 ? Math.round((stage.count / totalApps) * 100) : 0
              const width = totalApps > 0 ? Math.max((stage.count / totalApps) * 100, stage.count > 0 ? 4 : 0) : 0
              return (
                <div key={stage.key} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '18px 24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 20 }}>{stage.icon}</span>
                      <span style={{ color: 'white', fontSize: 14, fontWeight: 700 }}>{stage.label}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                      <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>{pct}%</span>
                      <span style={{ color: stage.color, fontSize: 18, fontWeight: 800, minWidth: 32, textAlign: 'right' }}>
                        {appsLoading ? '...' : stage.count}
                      </span>
                    </div>
                  </div>
                  <div style={{ height: 8, background: 'rgba(255,255,255,0.07)', borderRadius: 8, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${width}%`, background: stage.color, borderRadius: 8, transition: 'width 0.8s ease' }} />
                  </div>
                </div>
              )
            })}

            {/* Summary cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginTop: 24 }}>
              <div style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 14, padding: '20px' }}>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: '0 0 6px 0' }}>Active in Pipeline</p>
                <p style={{ color: '#818cf8', fontSize: 28, fontWeight: 800, margin: 0 }}>
                  {appsLoading ? '...' : applications.filter(a => !['REJECTED'].includes(a.status)).length}
                </p>
              </div>
              <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 14, padding: '20px' }}>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: '0 0 6px 0' }}>Offer Conversion</p>
                <p style={{ color: '#10b981', fontSize: 28, fontWeight: 800, margin: 0 }}>{conversionRate}%</p>
              </div>
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 14, padding: '20px' }}>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: '0 0 6px 0' }}>Rejected</p>
                <p style={{ color: '#ef4444', fontSize: 28, fontWeight: 800, margin: 0 }}>
                  {appsLoading ? '...' : pipelineCounts.find(s => s.key === 'REJECTED')?.count ?? 0}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* JOBS & APPLICATIONS TAB */}
        {activeTab === 'jobs' && (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {loading ? (
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>Loading jobs...</p>
              ) : jobs.length === 0 ? (
                <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '40px', textAlign: 'center' }}>
                  <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14, margin: 0 }}>No jobs yet. Create your first job posting!</p>
                </div>
              ) : (
                jobAppCounts.map((job, i) => (
                  <div key={i} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', transition: 'background 0.2s' }}
                    onClick={() => router.push(`/dashboard/candidates?jobId=${job.id}`)}
                    onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.07)'}
                    onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.04)'}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                        <p style={{ color: 'white', fontSize: 14, fontWeight: 700, margin: 0 }}>{job.title}</p>
                        <span style={{
                          padding: '2px 10px', borderRadius: 20, fontSize: 10, fontWeight: 600,
                          background: job.status === 'PUBLISHED' ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)',
                          color: job.status === 'PUBLISHED' ? '#10b981' : '#f59e0b',
                        }}>{job.status}</span>
                      </div>
                      <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, margin: 0 }}>
                        Created {new Date(job.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>

                    {/* Mini pipeline for this job */}
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginRight: 24 }}>
                      {PIPELINE_STAGES.slice(0, 5).map(s => {
                        const cnt = applications.filter(a => a.jobId === job.id && a.status === s.key).length
                        return cnt > 0 ? (
                          <div key={s.key} style={{ background: `${s.color}22`, border: `1px solid ${s.color}44`, borderRadius: 6, padding: '2px 8px', fontSize: 11, color: s.color, fontWeight: 600 }}>
                            {s.icon} {cnt}
                          </div>
                        ) : null
                      })}
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <p style={{ color: '#6366f1', fontSize: 22, fontWeight: 800, margin: '0 0 2px 0' }}>{job.appCount}</p>
                      <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, margin: 0 }}>applicants</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Recent applications list */}
            {applications.length > 0 && (
              <>
                <h3 style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '32px 0 16px 0' }}>Recent Applications</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {applications
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .slice(0, 8)
                    .map((app, i) => {
                      const stage = PIPELINE_STAGES.find(s => s.key === app.status) || PIPELINE_STAGES[0]
                      const job = jobs.find(j => j.id === app.jobId)
                      return (
                        <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '12px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <p style={{ color: 'white', fontSize: 13, fontWeight: 600, margin: '0 0 2px 0' }}>{app.candidateName || app.candidateId?.split('|')[0] || 'Candidate'}</p>
                            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, margin: 0 }}>{job?.title || 'Unknown Job'}</p>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            {app.aiScore != null && (
                              <span style={{ color: '#f59e0b', fontSize: 12, fontWeight: 700 }}>⭐ {app.aiScore}</span>
                            )}
                            <span style={{
                              padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700,
                              background: `${stage.color}22`, color: stage.color, border: `1px solid ${stage.color}44`
                            }}>{stage.icon} {stage.label}</span>
                            <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11 }}>
                              {new Date(app.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}