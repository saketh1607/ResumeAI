import { motion } from 'framer-motion'

export default function ScoreGauge({ score, label, size = 140 }) {
  const radius = (size - 16) / 2
  const circumference = 2 * Math.PI * radius
  const normalizedScore = Math.min(100, Math.max(0, score || 0))
  const offset = circumference - (normalizedScore / 100) * circumference

  // Color scheme based on score
  const isHigh = normalizedScore >= 80
  const isMed = normalizedScore >= 60
  const strokeGradientId = `score-gradient-${Math.floor(Math.random() * 10000)}`

  return (
    <div className="flex flex-col items-center">
      <div className="relative flex items-center justify-center">
        <svg width={size} height={size} className="-rotate-90 transform overflow-visible">
          <defs>
            <linearGradient id={strokeGradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              {isHigh ? (
                <>
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </>
              ) : isMed ? (
                <>
                  <stop offset="0%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#f97316" />
                </>
              ) : (
                <>
                  <stop offset="0%" stopColor="#f43f5e" />
                  <stop offset="100%" stopColor="#e11d48" />
                </>
              )}
            </linearGradient>
          </defs>
          
          {/* Track Circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="10"
            className="text-slate-200 dark:text-slate-800/80"
          />

          {/* Progress Circle */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={`url(#${strokeGradientId})`}
            strokeWidth="10"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            strokeLinecap="round"
            style={{
              filter: isHigh
                ? 'drop-shadow(0 0 8px rgba(16, 185, 129, 0.4))'
                : isMed
                ? 'drop-shadow(0 0 8px rgba(245, 158, 11, 0.4))'
                : 'drop-shadow(0 0 8px rgba(244, 63, 94, 0.4))',
            }}
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
          <motion.span
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className={`text-3xl font-extrabold tracking-tight ${
              isHigh
                ? 'text-emerald-600 dark:text-emerald-400'
                : isMed
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {Math.round(normalizedScore)}%
          </motion.span>
        </div>
      </div>
      {label && <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</p>}

    </div>
  )
}

