import { useEffect, useState } from 'react'
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Line, Doughnut } from 'react-chartjs-2'
import {
  FileText,
  Briefcase,
  TrendingUp,
  Target,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  ArrowUpRight,
} from 'lucide-react'
import { dashboardAPI } from '../services/api'
import ScoreGauge from '../components/ScoreGauge'

ChartJS.register(ArcElement, CategoryScale, LinearScale, LineElement, PointElement, Tooltip, Legend, Filler)

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    dashboardAPI.stats().then((res) => setStats(res.data)).finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 text-slate-400">
        <Sparkles className="h-8 w-8 animate-spin text-indigo-400" />
        <p className="text-sm font-medium">Loading analytics workspace...</p>
      </div>
    )
  }
  if (!stats) return <div className="text-slate-400">Failed to load statistics.</div>

  const lineData = {
    labels: stats.ats_history.map((h) => new Date(h.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })),
    datasets: [
      {
        label: 'ATS Score',
        data: stats.ats_history.map((h) => h.score),
        borderColor: '#818cf8',
        backgroundColor: (context) => {
          const ctx = context.chart.ctx
          const gradient = ctx.createLinearGradient(0, 0, 0, 300)
          gradient.addColorStop(0, 'rgba(129, 140, 248, 0.35)')
          gradient.addColorStop(1, 'rgba(129, 140, 248, 0.0)')
          return gradient
        },
        borderWidth: 3,
        pointBackgroundColor: '#6366f1',
        pointBorderColor: '#ffffff',
        pointHoverRadius: 6,
        tension: 0.4,
        fill: true,
      },
    ],
  }

  const cards = [
    { label: 'Total Resumes', value: stats.total_resumes, icon: FileText, color: 'text-indigo-600 bg-indigo-50 border-indigo-200 dark:text-indigo-400 dark:bg-indigo-500/10 dark:border-indigo-500/20' },
    { label: 'Job Descriptions', value: stats.total_jds, icon: Briefcase, color: 'text-violet-600 bg-violet-50 border-violet-200 dark:text-violet-400 dark:bg-violet-500/10 dark:border-violet-500/20' },
    { label: 'Analyses Run', value: stats.total_analyses, icon: TrendingUp, color: 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-500/10 dark:border-emerald-500/20' },
    {
      label: 'Latest ATS Score',
      value: stats.latest_ats_score ? `${Math.round(stats.latest_ats_score)}%` : 'N/A',
      icon: Target,
      color: 'text-amber-600 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-500/10 dark:border-amber-500/20',
    },
  ]

  return (
    <div className="space-y-8">
      {/* Top Stat Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => {
          const Icon = c.icon
          return (
            <div key={c.label} className="card card-hover flex items-center gap-4">
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${c.color}`}>
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">{c.value}</p>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{c.label}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Main Charts Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Score History Line Chart */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">ATS Score Trajectory</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Historical performance across analysis runs</p>
            </div>
            <span className="badge badge-indigo">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>Progress Tracked</span>
            </span>
          </div>

          {stats.ats_history.length ? (
            <div className="h-64">
              <Line
                data={lineData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false }, tooltip: { backgroundColor: '#1e293b', titleColor: '#fff', bodyColor: '#cbd5e1', cornerRadius: 8 } },
                  scales: {
                    x: { grid: { color: 'rgba(148, 163, 184, 0.1)' }, ticks: { color: '#94a3b8', font: { size: 11 } } },
                    y: { min: 0, max: 100, grid: { color: 'rgba(148, 163, 184, 0.1)' }, ticks: { color: '#94a3b8', font: { size: 11 } } },
                  },
                }}
              />
            </div>
          ) : (
            <div className="flex h-64 flex-col items-center justify-center text-center">
              <Target className="h-10 w-10 text-slate-400 dark:text-slate-600 mb-2" />
              <p className="text-sm text-slate-500 dark:text-slate-400">Run an ATS Analysis to visualize your score progression.</p>
            </div>
          )}
        </div>

        {/* Radial Score Gauge Card */}
        <div className="card flex flex-col items-center justify-center text-center">
          <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight mb-2">Latest ATS Rating</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">Based on most recent analysis</p>
          
          {stats.latest_ats_score ? (
            <ScoreGauge score={stats.latest_ats_score} size={170} />
          ) : (
            <div className="flex h-40 items-center justify-center text-xs text-slate-400">
              No ATS score recorded yet
            </div>
          )}
        </div>
      </div>

      {/* Bottom Insights Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Skills Cloud */}
        <div className="card">
          <div className="flex items-center gap-2.5 mb-4">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Extracted Strengths & Top Skills</h3>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {stats.top_skills.length ? (
              stats.top_skills.map((s) => (
                <span key={s} className="badge badge-emerald py-1.5 px-3.5 text-xs">
                  {s}
                </span>
              ))
            ) : (
              <p className="text-xs text-slate-500">Upload a resume to automatically parse your skills cloud.</p>
            )}
          </div>
        </div>

        {/* Missing Skills & Recommendations */}
        <div className="card space-y-4">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Skill Gap & Improvement Actions</h3>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Frequently Missing Skills</p>
            <div className="flex flex-wrap gap-2">
              {stats.missing_skills?.length ? (
                stats.missing_skills.map((s) => (
                  <span key={s} className="badge badge-rose py-1.5 px-3 text-xs">
                    {s}
                  </span>
                ))
              ) : (
                <p className="text-xs text-slate-500">No skill gaps identified yet.</p>
              )}
            </div>
          </div>

          {stats.recent_suggestions?.length > 0 && (
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">AI Career Advice</p>
              <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                {stats.recent_suggestions.map((s, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <ArrowUpRight className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


