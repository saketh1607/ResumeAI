import { useEffect, useState } from 'react'
import { jdAPI, resumeAPI } from '../services/api'

export function useSelection() {
  const [resumes, setResumes] = useState([])
  const [jds, setJds] = useState([])
  const [resumeId, setResumeId] = useState('')
  const [jdId, setJdId] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([resumeAPI.list(), jdAPI.list()])
      .then(([r, j]) => {
        setResumes(r.data)
        setJds(j.data)
        if (r.data.length) setResumeId(String(r.data[0].id))
        if (j.data.length) setJdId(String(j.data[0].id))
      })
      .finally(() => setLoading(false))
  }, [])

  return { resumes, jds, resumeId, setResumeId, jdId, setJdId, loading }
}
