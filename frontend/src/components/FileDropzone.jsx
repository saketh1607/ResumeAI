import { useCallback, useState } from 'react'
import { motion } from 'framer-motion'
import { UploadCloud, FileText, CheckCircle2 } from 'lucide-react'

export default function FileDropzone({ onFile, accept = '.pdf', label = 'Drop PDF here or click to browse' }) {
  const [dragging, setDragging] = useState(false)
  const [fileName, setFileName] = useState('')

  const handleFile = useCallback(
    (file) => {
      if (!file) return
      setFileName(file.name)
      onFile(file)
    },
    [onFile],
  )

  const onDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    if (e.dataTransfer.files?.[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  return (
    <motion.div
      whileHover={{ scale: 1.005 }}
      whileTap={{ scale: 0.995 }}
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className={`relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 transition-all duration-300 ${
        dragging
          ? 'border-indigo-500 bg-indigo-500/10 shadow-glow-primary'
          : fileName
          ? 'border-emerald-500/50 bg-emerald-500/5'
          : 'border-slate-300 bg-white/50 hover:border-indigo-400 hover:bg-slate-50 dark:border-slate-700/80 dark:bg-slate-800/40 dark:hover:border-slate-600 dark:hover:bg-slate-800/60'
      }`}
    >
      <input
        type="file"
        accept={accept}
        className="hidden"
        id="file-upload"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
      <label htmlFor="file-upload" className="flex cursor-pointer flex-col items-center text-center">
        <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl transition-all duration-300 ${
          fileName
            ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400'
            : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400'
        }`}>
          {fileName ? <CheckCircle2 className="h-7 w-7" /> : <UploadCloud className="h-7 w-7" />}
        </div>
        
        <p className="text-base font-semibold text-slate-800 dark:text-slate-200">{label}</p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">PDF files up to 10MB supported</p>
        
        {fileName && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 text-xs font-medium dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20">
            <FileText className="h-4 w-4" />
            <span>Selected: {fileName}</span>
          </div>
        )}
      </label>

    </motion.div>
  )
}

