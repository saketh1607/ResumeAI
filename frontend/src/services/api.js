import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 120000,
})

export function formatApiError(err) {
  if (!err.response) {
    return `Cannot reach backend at ${API_URL}. Is the server running on port 8000?`
  }
  const detail = err.response.data?.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) return detail.map((d) => d.msg || JSON.stringify(d)).join(', ')
  return err.message || 'Request failed'
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  },
)

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (email, password) => {
    const form = new URLSearchParams()
    form.append('username', email)
    form.append('password', password)
    return api.post('/auth/login', form, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
  },
  me: () => api.get('/auth/me'),
}

export const resumeAPI = {
  upload: (file) => {
    const form = new FormData()
    form.append('file', file)
    return api.post('/resume/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  list: () => api.get('/resume/list'),
  get: (id) => api.get(`/resume/${id}`),
}

export const jdAPI = {
  uploadText: (data) => api.post('/jd/text', data),
  upload: (formData) =>
    api.post('/jd/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  list: () => api.get('/jd/list'),
}

export const analyzeAPI = {
  atsScore: (data) => api.post('/analyze/ats-score', data),
  match: (data) => api.post('/analyze/match', data),
  suggestions: (data) => api.post('/analyze/suggestions', data),
}

export const chatAPI = {
  query: (data) => api.post('/chat/query', data),
}

export const generateAPI = {
  interviewQuestions: (data) => api.post('/generate/interview-questions', data),
}

export const dashboardAPI = {
  stats: () => api.get('/dashboard/stats'),
}

export default api
