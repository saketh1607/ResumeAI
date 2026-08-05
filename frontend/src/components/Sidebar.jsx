import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  FileText,
  Briefcase,
  Target,
  GitCompare,
  MessageSquare,
  HelpCircle,
  LogOut,
  Sparkles,
  UserCheck,
  Sun,
  Moon,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/resume', label: 'Resume Upload', icon: FileText },
  { to: '/jd', label: 'Job Description', icon: Briefcase },
  { to: '/ats', label: 'ATS Analysis', icon: Target },
  { to: '/match', label: 'Match Report', icon: GitCompare },
  { to: '/chat', label: 'AI Chatbot (RAG)', icon: MessageSquare },
  { to: '/interview', label: 'Interview Qs', icon: HelpCircle },
]

export default function Sidebar() {
  const { logout, user } = useAuth()
  const { dark, toggle } = useTheme()

  return (
    <aside className="relative flex h-screen w-64 flex-col border-r border-slate-200 bg-white/90 backdrop-blur-xl transition-all dark:border-slate-800/80 dark:bg-slate-900/90">
      {/* Brand Header */}
      <div className="flex items-center gap-3 border-b border-slate-200 p-6 dark:border-slate-800/80">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-500/20 dark:from-indigo-600 dark:to-violet-600 dark:shadow-indigo-500/30">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-base font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
            Resume<span className="text-indigo-600 dark:text-indigo-400">AI</span>
          </h1>
          <p className="text-[11px] font-medium text-indigo-600/80 dark:text-indigo-400/80">RAG + Gemini Engine</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1.5 p-4 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Main Workspace
        </div>
        {links.map((link) => {
          const Icon = link.icon
          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-500/20 dark:from-indigo-600/90 dark:to-violet-600/90'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={`h-4 w-4 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'}`} />
                  <span className="flex-1">{link.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="activePill"
                      className="absolute right-2 h-1.5 w-1.5 rounded-full bg-white shadow-glow-primary"
                    />
                  )}
                </>
              )}
            </NavLink>
          )
        })}
      </nav>

      {/* User & Actions Footer */}
      <div className="border-t border-slate-200 p-4 space-y-3 bg-slate-50/60 dark:border-slate-800/80 dark:bg-slate-950/40">
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-2.5 dark:border-slate-800/60 dark:bg-slate-900/60">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20">
            <UserCheck className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-xs font-semibold text-slate-800 dark:text-slate-200">{user?.full_name || 'User Profile'}</p>
            <p className="truncate text-[11px] text-slate-500">{user?.email || 'user@example.com'}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggle}
            className="btn-secondary flex-1 text-xs py-2 justify-center"
          >
            {dark ? <Sun className="h-3.5 w-3.5 text-amber-400" /> : <Moon className="h-3.5 w-3.5 text-slate-600" />}
            <span>{dark ? 'Light Mode' : 'Dark Mode'}</span>
          </button>

          <button
            onClick={logout}
            className="btn-danger text-xs py-2 px-3"
            title="Sign Out"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  )
}


