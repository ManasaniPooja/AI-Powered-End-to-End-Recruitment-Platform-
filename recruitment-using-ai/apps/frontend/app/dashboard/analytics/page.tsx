'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

type Stats = {
  totalJobs: number
  totalApplications: number
  shortlisted: number
  rejected: number
  offered: number
  avgResumeScore: number
  topJob: string
  conversionRate: number
}

export default function AnalyticsPage() {
  const router = useRouter()
  const [stats, setStats] = useState<Stats>({
    totalJobs: 0, totalApplications: 0, shortlisted: 0,
    rejected: 0, offered: 0, avgResumeScore: 0, topJob: '—', conversionRate: 0
  })
  const [jobBreakdown, setJobBreakdown] = useState<{ title: string; count: number; avg: number }[]>([])
  const [loading, setLoading] = useState(true)
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : ''

  useEffect(() => { fetchAnalytics() }, [])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const jobsRes = await fetch(`${API}/api/jobs/public`)
      const jobs = jobsRes.ok ? await jobsRes.json() : []
      let totalApps = 0, shortlisted = 0, rejected = 0, offered = 0
      let scoreSum = 0, scoreCount = 0
      const breakdown: { title: string; count: number; avg: number }[] = []

      if (Array.isArray(jobs)) {
        for (const job of jobs) {
          const appsRes = await fetch(`${API}/api/applications/job/${job.id}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          if (!appsRes.ok) continue
          const apps = await appsRes.json()
          if (!Array.isArray(apps)) continue

          totalApps += apps.length
          let jobScoreSum = 0
          apps.forEach((a: any) => {
            const score = a.resumeScore?.overallScore || 0
            scoreSum += score; scoreCount++
            jobScoreSum += score
            if (a.status === 'SHORTLISTED') shortlisted++
            if (a.status === 'REJECTED') rejected++
            if (a.status === 'OFFERED' || a.status === 'ACCEPTED') offered++
          })
          breakdown.push({
            title: job.title || 'Unknown',
            count: apps.length,
            avg: apps.length ? Math.round(jobScoreSum / apps.length) : 0
          })
        }
      }

      breakdown.sort((a, b) => b.count - a.count)
      setJobBreakdown(breakdown.slice(0, 6))
      setStats({
        totalJobs: Array.isArray(jobs) ? jobs.length : 0,
        totalApplications: totalApps,
        shortlisted, rejected, offered,
        avgResumeScore: scoreCount ? Math.round(scoreSum / scoreCount) : 0,
        topJob: breakdown[0]?.title || '—',
        conversionRate: totalApps ? Math.round((shortlisted / totalApps) * 100) : 0,
      })
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const scoreColor = (s: number) => s >= 70 ? '#10b981' : s >= 50 ? '#f59e0b' : '#ef4444'

  const cards = [
    { label: 'Total Jobs',         value: stats.totalJobs,           icon: '&#128188;', color: '#667eea' },
    { label: 'Total Applications', value: stats.totalApplications,   icon: '&#128196;', color: '#a78bfa' },
    { label: 'Shortlisted',        value: stats.shortlisted,         icon: '&#11088;',  color: '#f59e0b' },
    { label: 'Offers Sent',        value: stats.offered,             icon: '&#128140;', color: '#10b981' },
    { label: 'Rejected',           value: stats.rejected,            icon: '&#10060;',  color: '#ef4444' },
    { label: 'Avg Resume Score',   value: stats.avgResumeScore,      icon: '&#128200;', color: '#10b981' },
    { label: 'Conversion Rate',    value: `${stats.conversionRate}%`,icon: '&#128257;', color: '#f59e0b' },
    { label: 'Top Job',            value: stats.topJob,              icon: '&#127942;', color: '#667eea' },
  ]

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
          &#8592; Back to Dashboard
        </button>
      </nav>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ color: 'white', fontSize: 24, fontWeight: 800, margin: 0 }}>&#128200; Analytics Overview</h2>
          <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: 13, margin: '4px 0 0' }}>Recruitment pipeline insights and performance metrics</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 32 }}>
          {cards.map(s => (
            <div key={s.label} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '18px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ minWidth: 0 }}>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: 0 }}>{s.label}</p>
                  <p style={{ color: 'white', fontSize: typeof s.value === 'string' && s.value.length > 6 ? 16 : 28, fontWeight: 800, margin: '4px 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {loading ? '...' : s.value}
                  </p>
                </div>
                <span style={{ fontSize: 26, flexShrink: 0 }} dangerouslySetInnerHTML={{ __html: s.icon }} />
              </div>
            </div>
          ))}
        </div>

        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: '24px 28px' }}>
          <h3 style={{ color: 'white', fontSize: 16, fontWeight: 700, margin: '0 0 20px' }}>&#128188; Applications by Job</h3>
          {loading ? (
            <p style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '40px 0' }}>Loading...</p>
          ) : jobBreakdown.length === 0 ? (
            <p style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '40px 0' }}>No data available</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {jobBreakdown.map(job => {
                const maxCount = jobBreakdown[0].count || 1
                const pct = Math.round((job.count / maxCount) * 100)
                return (
                  <div key={job.title}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 600 }}>{job.title}</span>
                      <div style={{ display: 'flex', gap: 16 }}>
                        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>{job.count} applicants</span>
                        <span style={{ color: scoreColor(job.avg), fontSize: 12, fontWeight: 700 }}>Avg {job.avg}</span>
                      </div>
                    </div>
                    <div style={{ height: 8, background: 'rgba(255,255,255,0.07)', borderRadius: 99 }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, #667eea, #764ba2)', borderRadius: 99, transition: 'width 0.6s ease' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}