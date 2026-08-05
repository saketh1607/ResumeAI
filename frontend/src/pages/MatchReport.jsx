import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  GitCompare,
  Sparkles,
  CheckCircle2,
  XCircle,
  ArrowRight,
  FileText,
  Briefcase,
  ListChecks,
} from 'lucide-react'
import ScoreGauge from '../components/ScoreGauge'
import { useSelection } from '../hooks/useSelection'
import { analyzeAPI } from '../services/api'

export default function MatchReport() {
  const { resumes, jds, resumeId, setResumeId, jdId, setJdId, loading } = useSelection()
  const [result, setResult] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)

  const runMatch = async () => {
    if (!jdId) return
    setAnalyzing(true)
    try {
      const { data } = await analyzeAPI.match({
        resume_id: parseInt(resumeId),
        jd_id: parseInt(jdId),
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
        <p className="text-sm font-medium">Loading selection workspace...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Selector Bar */}
      <div className="card flex flex-wrap items-end gap-4">
        <div className="flex-1 min-w-[220px]">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Select Resume</span>
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
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
            <Briefcase className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
            <span>Select Target Job Description</span>
          </label>
          <select className="input-field cursor-pointer" value={jdId} onChange={(e) => setJdId(e.target.value)}>
            <option value="">Select a JD...</option>
            {jds.map((j) => (
              <option key={j.id} value={j.id}>
                {j.title} (ID #{j.id})
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={runMatch}
          disabled={!resumeId || !jdId || analyzing}
          className="btn-primary py-2.5 px-6 shrink-0"
        >
          {analyzing ? (
            <>
              <Sparkles className="h-4 w-4 animate-spin" />
              <span>Matching...</span>
            </>
          ) : (
            <>
              <GitCompare className="h-4 w-4" />
              <span>Compare Resume vs JD</span>
            </>
          )}
        </button>
      </div>

      {/* Match Results View */}
      {result && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
          {/* Match Score & Summary Banner */}
          <div className="card flex flex-col items-center gap-6 md:flex-row p-8">
            <ScoreGauge score={result.match_percentage} label="Role Fit Match" size={160} />
            
            <div className="flex-1 space-y-3 text-center md:text-left border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-800/80 pt-6 md:pt-0 md:pl-8">
              <span className="badge badge-indigo">Executive Match Breakdown</span>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Alignment Summary</h3>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{result.summary}</p>
            </div>
          </div>

          {/* Side-by-Side Skills Breakdown */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Matching Skills */}
            <div className="card space-y-4">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-5 w-5" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Matching Skills & Competencies</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {result.matching_skills?.map((s) => (
                  <span key={s} className="badge badge-emerald py-1.5 px-3 text-xs">
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {/* Missing Technologies */}
            <div className="card space-y-4">
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                <XCircle className="h-5 w-5" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Missing Required Technologies</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {result.missing_technologies?.map((s) => (
                  <span key={s} className="badge badge-rose py-1.5 px-3 text-xs">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Recommended Improvements List */}
          <div className="card space-y-4">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
              <ListChecks className="h-5 w-5" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Strategic Improvement Roadmap</h3>
            </div>
            <ul className="space-y-3 text-xs text-slate-700 dark:text-slate-300">
              {result.recommended_improvements?.map((r, i) => (
                <li key={i} className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-slate-50/50 p-3 dark:border-slate-800/80 dark:bg-slate-950/40">
                  <ArrowRight className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
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


