import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Briefcase, FileText, CheckCircle2, Sparkles, Plus, Clock, FileCheck } from 'lucide-react'
import FileDropzone from '../components/FileDropzone'
import { jdAPI } from '../services/api'

export default function JDUpload() {
  const [title, setTitle] = useState('Senior Software Engineer')
  const [text, setText] = useState('')
  const [jds, setJds] = useState([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const loadJds = () => jdAPI.list().then((res) => setJds(res.data))
  useEffect(() => { loadJds() }, [])

  const submitText = async () => {
    setLoading(true)
    try {
      await jdAPI.uploadText({ title, text })
      setMessage('Job description successfully saved and parsed.')
      setText('')
      loadJds()
    } catch (err) {
      setMessage(err.response?.data?.detail || 'Failed to save job description')
    } finally {
      setLoading(false)
    }
  }

  const submitPdf = async (file) => {
    setLoading(true)
    const form = new FormData()
    form.append('title', title)
    form.append('file', file)
    try {
      await jdAPI.upload(form)
      setMessage('Job description PDF successfully uploaded.')
      loadJds()
    } catch (err) {
      setMessage(err.response?.data?.detail || 'Failed to upload PDF')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Upload & Create Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Paste Text Card */}
        <div className="card space-y-4">
          <div className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Paste Job Description Text</h2>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 block">
                Target Role Title
              </label>
              <input
                className="input-field"
                placeholder="e.g. Senior Full Stack Engineer"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 block">
                Job Requirements & Responsibilities
              </label>
              <textarea
                className="input-field min-h-[180px] text-xs leading-relaxed"
                placeholder="Paste complete job description requirements here..."
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            </div>

            <button
              onClick={submitText}
              disabled={loading || text.length < 10}
              className="btn-primary w-full justify-center"
            >
              {loading ? (
                <>
                  <Sparkles className="h-4 w-4 animate-spin" />
                  <span>Saving Job Description...</span>
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  <span>Save Job Description</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Upload PDF Card */}
        <div className="card flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Or Upload JD PDF Document</h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Upload job description specification PDFs for automatic parsing.
            </p>
            <FileDropzone onFile={submitPdf} label="Drop Job Description PDF here" />
          </div>

          {message && (
            <div className="flex items-center gap-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-300">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{message}</span>
            </div>
          )}
        </div>
      </div>

      {/* Saved JDs Library */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <FileCheck className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <span>Saved Job Descriptions</span>
          </h3>
          <span className="badge badge-slate">{jds.length} Role(s)</span>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {jds.map((j) => (
            <motion.div
              key={j.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="card card-hover flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600 border border-violet-200 dark:bg-violet-500/10 dark:text-violet-400 dark:border-violet-500/20">
                  <Briefcase className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">{j.title}</h4>
                  <p className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    <Clock className="h-3 w-3" />
                    <span>ID #{j.id}</span>
                  </p>
                </div>
              </div>
              <span className="badge badge-indigo text-[10px] uppercase">{j.source_type || 'Text'}</span>
            </motion.div>
          ))}

          {!jds.length && (
            <div className="col-span-3 card flex h-32 flex-col items-center justify-center text-center text-slate-500">
              <Briefcase className="h-7 w-7 text-slate-400 dark:text-slate-700 mb-2" />
              <p className="text-xs">No job descriptions added yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


