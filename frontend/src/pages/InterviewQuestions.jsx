import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  HelpCircle,
  UserCheck,
  Code,
  FileText,
  Briefcase,
  Sparkles,
} from 'lucide-react'
import { useSelection } from '../hooks/useSelection'
import { generateAPI } from '../services/api'

const CATEGORIES = [
  {
    key: 'hr_questions',
    label: 'HR & Behavioral',
    icon: UserCheck,
    color: 'text-indigo-600 bg-indigo-50 border-indigo-200 dark:text-indigo-400 dark:bg-indigo-500/10 dark:border-indigo-500/20',
  },
  {
    key: 'technical_questions',
    label: 'Technical Core',
    icon: Code,
    color: 'text-violet-600 bg-violet-50 border-violet-200 dark:text-violet-400 dark:bg-violet-500/10 dark:border-violet-500/20',
  },
  {
    key: 'resume_based_questions',
    label: 'Resume Deep-Dive',
    icon: FileText,
    color: 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-500/10 dark:border-emerald-500/20',
  },
  {
    key: 'project_based_questions',
    label: 'Project Scenarios',
    icon: Briefcase,
    color: 'text-amber-600 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-500/10 dark:border-amber-500/20',
  },
]

export default function InterviewQuestions() {
  const { resumeId, jdId, loading } = useSelection()
  const [result, setResult] = useState(null)
  const [generating, setGenerating] = useState(false)

  const generate = async () => {
    setGenerating(true)
    try {
      const { data } = await generateAPI.interviewQuestions({
        resume_id: parseInt(resumeId),
        jd_id: jdId ? parseInt(jdId) : null,
        count_per_category: 5,
      })
      setResult(data)
    } finally {
      setGenerating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 text-slate-400">
        <Sparkles className="h-8 w-8 animate-spin text-indigo-600 dark:text-indigo-400" />
        <p className="text-sm font-medium">Loading workspace context...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Control Card */}
      <div className="card flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <span>AI Interview Question Generator</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Generates 20 customized questions across 4 categories based on your resume background & JD requirements.
          </p>
        </div>

        <button
          onClick={generate}
          disabled={!resumeId || generating}
          className="btn-primary py-2.5 px-6 shrink-0"
        >
          {generating ? (
            <>
              <Sparkles className="h-4 w-4 animate-spin" />
              <span>Generating Questions...</span>
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              <span>Generate Question Deck</span>
            </>
          )}
        </button>
      </div>

      {/* Category Questions Grid */}
      {result && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="grid gap-6 md:grid-cols-2">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon
            const questions = result[cat.key] || []
            return (
              <div key={cat.key} className="card space-y-4">
                <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800/80 pb-3.5">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-xl border ${cat.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">{cat.label}</h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{questions.length} Questions Prepared</p>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {questions.map((q, i) => (
                    <div key={i} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs leading-relaxed text-slate-800 dark:border-slate-800/60 dark:bg-slate-950/40 dark:text-slate-200">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-lg bg-slate-200 text-[10px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-400">
                        {i + 1}
                      </span>
                      <span>{q}</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </motion.div>
      )}
    </div>
  )
}


