import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Sparkles,
  ArrowRight,
  Target,
  GitCompare,
  MessageSquare,
  HelpCircle,
  Cpu,
  Zap,
  ShieldCheck,
  FileCheck,
  Sun,
  Moon,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'


const features = [

  {
    title: 'ATS Scoring Engine',
    desc: 'Deep multi-dimensional analysis evaluating skill density, keywords, format structure, and project alignment.',
    icon: Target,
    color: 'from-blue-500/20 to-indigo-500/20 text-indigo-600 dark:text-indigo-400',
  },
  {
    title: 'Job Description Matcher',
    desc: 'Instantly calculate semantic relevance between your resume and target job requirements.',
    icon: GitCompare,
    color: 'from-violet-500/20 to-purple-500/20 text-violet-600 dark:text-violet-400',
  },
  {
    title: 'RAG Contextual Chatbot',
    desc: 'Conversational AI grounded in FAISS vector embeddings for precise, non-hallucinated career guidance.',
    icon: MessageSquare,
    color: 'from-emerald-500/20 to-teal-500/20 text-emerald-600 dark:text-emerald-400',
  },
  {
    title: 'Tailored Interview Prep',
    desc: 'Auto-generate targeted HR, technical, and project questions tailored to your exact profile.',
    icon: HelpCircle,
    color: 'from-amber-500/20 to-orange-500/20 text-amber-600 dark:text-amber-400',
  },
]

export default function Home() {
  const { isAuthenticated } = useAuth()
  const { dark, toggle } = useTheme()

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-300">
      {/* Glow Orbs Backdrop */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-gradient-to-b from-indigo-500/10 via-violet-500/5 to-transparent blur-3xl dark:from-indigo-600/20 dark:via-violet-600/10" />
      <div className="pointer-events-none absolute top-1/3 -left-40 -z-10 h-[400px] w-[400px] rounded-full bg-indigo-500/10 blur-3xl" />
      <div className="pointer-events-none absolute top-1/2 -right-40 -z-10 h-[400px] w-[400px] rounded-full bg-emerald-500/10 blur-3xl" />

      {/* Navigation Header */}
      <header className="mx-auto flex max-w-7xl items-center justify-between border-b border-slate-200 px-8 py-5 dark:border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-500/20 dark:from-indigo-600 dark:to-violet-600 dark:shadow-indigo-500/30">
            <Sparkles className="h-5 w-5" />
          </div>
          <span className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Resume<span className="text-indigo-600 dark:text-indigo-400">AI</span>
          </span>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={toggle}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
            title="Toggle Theme"
          >
            {dark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-600" />}
          </button>

          {isAuthenticated ? (
            <Link to="/dashboard" className="btn-primary">
              <span>Go to Workspace</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <>
              <Link to="/login" className="btn-secondary">
                Sign In
              </Link>
              <Link to="/register" className="btn-primary">
                <span>Get Started Free</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="mx-auto max-w-5xl px-8 pt-24 pb-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="badge badge-indigo py-1.5 px-4 text-xs font-semibold">
            <Cpu className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>RAG Architecture · FAISS Vector Search · Google Gemini AI</span>
          </span>

          <h1 className="mt-8 text-5xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl leading-tight text-slate-900 dark:text-white">
            Optimize Your Resume with <br />
            <span className="gradient-text">
              Precision RAG Intelligence
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
            Upload your resume and target job descriptions. Get instant ATS scores, missing skill alerts,
            custom interview decks, and interactive context-aware AI answers.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link to={isAuthenticated ? '/dashboard' : '/register'} className="btn-primary px-8 py-3.5 text-base">
              <span>Start Free Analysis</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link to="/login" className="btn-secondary px-8 py-3.5 text-base">
              Explore Demo
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Platform Features Grid */}
      <section className="mx-auto max-w-7xl px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Engineered for Maximum Career Impact</h2>
          <p className="mt-2 text-slate-600 dark:text-slate-400 text-sm">Everything you need to surpass ATS filters and ace your interviews.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {features.map((f, index) => {
            const Icon = f.icon
            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="card card-hover flex flex-col justify-between"
              >
                <div>
                  <div className={`mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${f.color} border border-slate-200/50 dark:border-white/5`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">{f.title}</h3>
                  <p className="mt-2.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{f.desc}</p>
                </div>
              </motion.div>
            )
          })}
        </div>
      </section>

      {/* Highlights Bar */}
      <section className="border-t border-slate-200 bg-white/60 py-12 dark:border-slate-800/80 dark:bg-slate-900/40">
        <div className="mx-auto flex max-w-6xl flex-wrap justify-around gap-8 px-8 text-center">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            <div className="text-left">
              <p className="text-sm font-bold text-slate-900 dark:text-white">100% Private & Secure</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Encrypted document storage</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Zap className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            <div className="text-left">
              <p className="text-sm font-bold text-slate-900 dark:text-white">Sub-Second Vector Search</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">FAISS index retrieval</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <FileCheck className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            <div className="text-left">
              <p className="text-sm font-bold text-slate-900 dark:text-white">Multi-Format PDF Support</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Automatic text extraction</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-8 text-center text-xs text-slate-500 dark:border-slate-800/80">
        <p>AI Resume Analyzer RAG Platform · Powered by Priyanshu Patidar</p>
      </footer>
    </div>
  )
}


