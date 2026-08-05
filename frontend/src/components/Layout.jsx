import { Outlet, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Sidebar from './Sidebar'
import { Sparkles, Bell, Sun, Moon } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

const pageTitles = {
  '/dashboard': { title: 'Overview Dashboard', subtitle: 'Real-time analytics and resume performance metrics' },
  '/resume': { title: 'Resume Workspace', subtitle: 'Upload and inspect structured resume extractions' },
  '/jd': { title: 'Job Description Workspace', subtitle: 'Manage role descriptions for ATS and matching' },
  '/ats': { title: 'ATS Score Analyzer', subtitle: 'Detailed breakdown of keyword, skill & format compatibility' },
  '/match': { title: 'Resume vs JD Matcher', subtitle: 'Identify skill gaps and direct improvements' },
  '/chat': { title: 'AI Assistant (RAG)', subtitle: 'Conversational Q&A powered by Google Gemini AI' },
  '/interview': { title: 'Interview Preparation', subtitle: 'Tailored HR, Technical, and Project question deck' },
}

export default function Layout() {
  const location = useLocation()
  const { dark, toggle } = useTheme()
  const currentMeta = pageTitles[location.pathname] || { title: 'Workspace', subtitle: 'AI Resume Analyzer' }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-300">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header Bar */}
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 backdrop-blur-xl px-8 dark:border-slate-800/80 dark:bg-slate-900/60">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">{currentMeta.title}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">{currentMeta.subtitle}</p>
          </div>

          <div className="flex items-center gap-3">
            <span className="badge badge-indigo flex items-center gap-1.5 py-1 px-3">
              <Sparkles className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Gemini RAG Engine Active</span>
            </span>

            <button
              onClick={toggle}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800"
              title="Toggle Theme"
            >
              {dark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </header>

        {/* Page Content with Animations */}
        <main className="flex-1 overflow-y-auto p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="mx-auto max-w-7xl"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}


