import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  FileText,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Clock,
  User,
  Mail,
  Award,
} from 'lucide-react'
import FileDropzone from '../components/FileDropzone'
import { resumeAPI } from '../services/api'

export default function ResumeUpload() {
  const [resumes, setResumes] = useState([])
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const loadResumes = () => resumeAPI.list().then((res) => setResumes(res.data))

  useEffect(() => { loadResumes() }, [])

  const handleUpload = async (file) => {
    setUploading(true)
    setError('')
    setMessage('')
    try {
      const { data } = await resumeAPI.upload(file)
      setMessage(`Successfully uploaded and indexed: ${data.filename}`)
      loadResumes()
    } catch (err) {
      setError(err.response?.data?.detail || 'Resume upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Upload Header Card */}
      <div className="card space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <UploadCloud className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <span>Upload New Resume</span>
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Upload PDF resumes. Text will be automatically parsed, structured, and indexed in FAISS vector memory for RAG queries.
          </p>
        </div>

        <FileDropzone onFile={handleUpload} label="Drop PDF resume here or click to browse" />

        {uploading && (
          <div className="flex items-center gap-3 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs dark:bg-indigo-500/10 dark:border-indigo-500/20 dark:text-indigo-300">
            <Sparkles className="h-4 w-4 animate-spin text-indigo-600 dark:text-indigo-400" />
            <span>Extracting text, analyzing skills & building FAISS RAG index...</span>
          </div>
        )}

        {message && (
          <div className="flex items-center gap-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-300">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-300">
            <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Resumes Library Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <FileText className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <span>Uploaded Resumes Library</span>
          </h3>
          <span className="badge badge-slate">{resumes.length} Document(s)</span>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {resumes.map((r) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="card card-hover space-y-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">{r.filename}</h4>
                    <p className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      <Clock className="h-3 w-3" />
                      <span>ID #{r.id} · {new Date(r.created_at).toLocaleDateString()}</span>
                    </p>
                  </div>
                </div>
                <span className="badge badge-emerald">RAG Indexed</span>
              </div>

              {r.parsed_data && (
                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 space-y-3 text-xs dark:border-slate-800 dark:bg-slate-950/40">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                      <User className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                      <span className="truncate">{r.parsed_data.name || 'Name extracted'}</span>
                    </div>
                    {r.parsed_data.email && (
                      <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                        <Mail className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
                        <span className="truncate">{r.parsed_data.email}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1">
                      <Award className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                      <span>Detected Skills</span>
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {(r.parsed_data.skills || []).slice(0, 10).map((s) => (
                        <span key={s} className="badge badge-indigo text-[10px] py-0.5 px-2">
                          {s}
                        </span>
                      ))}
                      {(r.parsed_data.skills || []).length > 10 && (
                        <span className="text-[10px] text-slate-500 py-0.5">
                          +{(r.parsed_data.skills || []).length - 10} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          ))}

          {!resumes.length && (
            <div className="col-span-2 card flex h-40 flex-col items-center justify-center text-center text-slate-500">
              <FileText className="h-8 w-8 text-slate-400 dark:text-slate-700 mb-2" />
              <p className="text-xs">No resumes uploaded yet. Upload your first PDF above to get started.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


