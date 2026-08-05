import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, Send, Bot, User, Sparkles, HelpCircle } from 'lucide-react'
import { useSelection } from '../hooks/useSelection'
import { chatAPI, formatApiError } from '../services/api'

const SUGGESTIONS = [
  'Am I suitable for this target role?',
  'What technical skills are missing from my resume?',
  'How can I rephrase my project experience for higher ATS score?',
  'What backend / cloud technologies should I highlight?',
]

export default function AIChatbot() {
  const { resumeId, jdId, loading } = useSelection()
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        'Hello! I am your RAG-powered AI Career Assistant. I have indexed your uploaded resume in vector memory. Ask me anything about your qualifications, role suitability, or resume optimization!',
    },
  ])
  const [input, setInput] = useState('')
  const [sessionId, setSessionId] = useState(null)
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)

  const send = async (question) => {
    if (!question.trim() || !resumeId) return
    setMessages((m) => [...m, { role: 'user', content: question }])
    setInput('')
    setSending(true)
    try {
      const { data } = await chatAPI.query({
        resume_id: parseInt(resumeId),
        jd_id: jdId ? parseInt(jdId) : null,
        question,
        session_id: sessionId,
      })
      setSessionId(data.session_id)
      setMessages((m) => [...m, { role: 'assistant', content: data.answer }])
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    } catch (err) {
      setMessages((m) => [...m, { role: 'assistant', content: formatApiError(err) }])
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 text-slate-400">
        <Sparkles className="h-8 w-8 animate-spin text-indigo-400" />
        <p className="text-sm font-medium">Loading RAG vector memory...</p>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col space-y-4">
      {/* Quick Prompts Suggestions */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <div className="flex items-center gap-1 text-xs font-semibold text-slate-400 shrink-0 pr-2">
          <HelpCircle className="h-3.5 w-3.5 text-indigo-400" />
          <span>Quick Prompts:</span>
        </div>
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => send(s)}
            disabled={sending}
            className="badge badge-slate cursor-pointer whitespace-nowrap text-[11px] hover:border-indigo-500/50 hover:bg-indigo-500/10 hover:text-indigo-300 py-1.5 px-3 transition-all"
          >
            {s}
          </button>
        ))}
      </div>

      {/* Main Chat Box Container */}
      <div className="card flex flex-1 flex-col overflow-hidden p-0">
        {/* Messages Stream */}
        <div className="flex-1 space-y-4 overflow-y-auto p-6">
          <AnimatePresence initial={false}>
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/20 mt-0.5">
                    <Bot className="h-4 w-4" />
                  </div>
                )}

                <div
                  className={`max-w-[78%] rounded-2xl p-4 text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-500/20 dark:from-indigo-600 dark:to-violet-600 dark:shadow-indigo-500/20'
                      : 'border border-slate-200 bg-slate-50 text-slate-800 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-950/60 dark:text-slate-200'
                  }`}
                >
                  {msg.content}
                </div>

                {msg.role === 'user' && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 border border-slate-200 mt-0.5 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700/80">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {sending && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3 items-center text-xs text-indigo-600 dark:text-indigo-400">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20">
                <Sparkles className="h-4 w-4 animate-spin" />
              </div>
              <span className="animate-pulse">Retrieving RAG vector context & generating response...</span>
            </motion.div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input Bar */}
        <div className="border-t border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800/80 dark:bg-slate-950/40">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              send(input)
            }}
            className="flex gap-3"
          >
            <input
              className="input-field flex-1 text-xs"
              placeholder="Ask a question about your resume or job description..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={sending}
            />
            <button type="submit" disabled={sending || !input.trim()} className="btn-primary py-2.5 px-5 shrink-0">
              <Send className="h-4 w-4" />
              <span className="hidden sm:inline">Send</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}


