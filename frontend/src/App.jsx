import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import ATSAnalysis from './pages/ATSAnalysis'
import AIChatbot from './pages/AIChatbot'
import Dashboard from './pages/Dashboard'
import Home from './pages/Home'
import InterviewQuestions from './pages/InterviewQuestions'
import JDUpload from './pages/JDUpload'
import Login from './pages/Login'
import MatchReport from './pages/MatchReport'
import Register from './pages/Register'
import ResumeUpload from './pages/ResumeUpload'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/resume" element={<ResumeUpload />} />
        <Route path="/jd" element={<JDUpload />} />
        <Route path="/ats" element={<ATSAnalysis />} />
        <Route path="/match" element={<MatchReport />} />
        <Route path="/chat" element={<AIChatbot />} />
        <Route path="/interview" element={<InterviewQuestions />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
