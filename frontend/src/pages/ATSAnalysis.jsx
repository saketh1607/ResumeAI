import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Target,
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ListChecks,
  FileText,
  Briefcase,
  Layers,
} from 'lucide-react'
import ScoreGauge from '../components/ScoreGauge'
import { useSelection } from '../hooks/useSelection'
import { analyzeAPI } from '../services/api'

export default function ATSAnalysis() {
  const { resumes, jds, resumeId, setResumeId, jdId, setJdId, loading } = useSelection()
  const [result, setResult] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)

  const runAnalysis = async () => {
    setAnalyzing(true)
    try {
      const { data } = await analyzeAPI.atsScore({
        resume_id: parseInt(resumeId),
        jd_id: jdId ? parseInt(jdId) : null,
      })
      setResult(data)
    } finally {
      setAnalyzing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 text-slate-400">
        <Sparkles className="h-8 w-8 animate-spin text-indigo-400" />
        <p className="text-sm font-medium">Loading selection data...</p>
      </div>
    )
  }

  const metrics = result
    ? [
        { label: 'Skills Match', value: result.skills_match, color: 'from-indigo-500 to-violet-500' },
        { label: 'Keyword Relevance', value: result.keywords_match, color: 'from-blue-500 to-cyan-500' },
        { label: 'Experience Alignment', value: result.experience_match, color: 'from-emerald-500 to-teal-500' },
        { label: 'Education Verification', value: result.education_match, color: 'from-amber-500 to-orange-500' },
        { label: 'Format & Structure', value: result.formatting_score, color: 'from-purple-500 to-pink-500' },
        { label: 'Project Impact', value: result.project_relevance, color: 'from-rose-500 to-red-500' },
      ]
    : []

  return (
    <div className="space-y-8">
      {/* Top Document Selection Bar */}
      <div className="card flex flex-wrap items-end gap-4">
        <div className="flex-1 min-w-[220px]">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5 text-indigo-400" />
            <span>Select Resume Document</span>
          </label>
          <select className="input-field cursor-pointer" value={resumeId} onChange={(e) => setResumeId(e.target.value)}>
            {resumes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.filename} (ID #{r.id})
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 min-w-[220px]">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
            <Briefcase className="h-3.5 w-3.5 text-violet-400" />
            <span>Select Job Description (Optional)</span>
          </label>
          <select className="input-field cursor-pointer" value={jdId} onChange={(e) => setJdId(e.target.value)}>
            <option value="">General ATS Benchmark (No JD)</option>
            {jds.map((j) => (
              <option key={j.id} value={j.id}>
                {j.title} (ID #{j.id})
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={runAnalysis}
          disabled={!resumeId || analyzing}
          className="btn-primary py-2.5 px-6 shrink-0"
        >
          {analyzing ? (
            <>
              <Sparkles className="h-4 w-4 animate-spin" />
              <span>Analyzing ATS...</span>
            </>
          ) : (
            <>
              <Target className="h-4 w-4" />
              <span>Execute ATS Analysis</span>
            </>
          )}
        </button>
      </div>

      {/* Analysis Results View */}
      {result && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
          {/* Main Score & Sub-metrics Grid */}
          <div className="card grid gap-8 lg:grid-cols-3 items-center">
            <div className="flex flex-col items-center justify-center lg:border-r border-slate-200 dark:border-slate-800/80 lg:pr-6">
              <ScoreGauge score={result.ats_score} label="Overall ATS Compatibility" size={170} />
            </div>

            <div className="lg:col-span-2 grid grid-cols-2 gap-4">
              {metrics.map((m) => (
                <div key={m.label} className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 space-y-2 dark:border-slate-800/80 dark:bg-slate-950/40">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{m.label}</span>
                    <span className="font-bold text-slate-900 dark:text-white">{Math.round(m.value)}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.round(m.value)}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className={`h-full rounded-full bg-gradient-to-r ${m.color}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Breakdown Cards Grid */}
          <div className="grid gap-6 md:grid-cols-3">
            {/* Strengths */}
            <div className="card space-y-3">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-5 w-5" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Core Strengths</h3>
              </div>
              <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                {result.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Weaknesses */}
            <div className="card space-y-3">
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                <XCircle className="h-5 w-5" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Areas of Weakness</h3>
              </div>
              <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                {result.weaknesses.map((s, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <XCircle className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Missing Skills */}
            <div className="card space-y-3">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="h-5 w-5" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Missing Keywords</h3>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {result.missing_skills.map((s) => (
                  <span key={s} className="badge badge-amber text-xs py-1 px-2.5">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Action Recommendations */}
          <div className="card space-y-3">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
              <ListChecks className="h-5 w-5" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Actionable Recommendations</h3>
            </div>
            <ul className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300 divide-y divide-slate-200 dark:divide-slate-800/60">
              {result.recommendations.map((r, i) => (
                <li key={i} className="pt-2.5 first:pt-0 flex items-start gap-2.5">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400 text-[10px] font-bold">
                    {i + 1}
                  </div>
                  <span className="leading-relaxed">{r}</span>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      )}
    </div>
  )
}


