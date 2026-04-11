import { useEffect } from 'react'
import { useAppStore } from '../store/useAppStore'
import Card from '../components/ui/Card'

function statusStyle(status) {
  if (status === 'completed') return 'bg-emerald-100 text-emerald-700'
  if (status === 'processing') return 'bg-sky-100 text-sky-700'
  return 'bg-amber-100 text-amber-700'
}

export default function JobStatus() {
  const jobs = useAppStore((state) => state.jobs)
  const updateJobStatus = useAppStore((state) => state.updateJobStatus)

  useEffect(() => {
    const interval = setInterval(() => {
      jobs.forEach((job) => {
        if (job.status === 'pending') updateJobStatus(job.id, 'processing')
        if (job.status === 'processing') updateJobStatus(job.id, 'completed')
      })
    }, 8000)

    return () => clearInterval(interval)
  }, [jobs, updateJobStatus])

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-6 sm:p-8">
        <p className="text-sm uppercase tracking-[0.32em] text-slate-500">Job status</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-900">Track AI and export jobs</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-600">
          Status updates refresh automatically so you can monitor pending exports and AI content generation.
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {jobs.map((job) => (
          <Card key={job.id} className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-900">{job.label}</p>
                <p className="mt-2 text-sm text-slate-600">Last updated {job.updatedAt}</p>
              </div>
              <span className={`rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.24em] ${statusStyle(job.status)}`}>
                {job.status}
              </span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
