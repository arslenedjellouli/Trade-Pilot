import { useMemo } from 'react'
import { Plus, FileText, TrendingUp, ShieldCheck, Clock3 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'

export default function Dashboard() {
  const products = useAppStore((state) => state.products)
  const jobs = useAppStore((state) => state.jobs)

  const overview = useMemo(
    () => [
      { label: 'Products', value: products.length, icon: FileText, tone: 'bg-sky-500/10 text-sky-700' },
      { label: 'Catalogs', value: 2, icon: Plus, tone: 'bg-emerald-500/10 text-emerald-700' },
      { label: 'AI jobs', value: jobs.filter((job) => job.status !== 'completed').length, icon: TrendingUp, tone: 'bg-violet-500/10 text-violet-700' },
      { label: 'Compliance alerts', value: products.filter((product) => product.compliance.warnings.length).length, icon: ShieldCheck, tone: 'bg-amber-500/10 text-amber-700' },
    ],
    [products, jobs],
  )

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1.6fr_0.9fr]">
        <div className="space-y-6">
          <div className="rounded-[2rem] border border-slate-200 bg-slate-950/90 p-8 text-white shadow-soft">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.32em] text-slate-400">Performance overview</p>
                <h2 className="mt-2 text-3xl font-semibold">Build export-ready catalogs faster.</h2>
                <p className="mt-3 max-w-2xl text-sm text-slate-300">
                  Manage product assets, AI generation, and compliance from one central exporter portal.
                </p>
              </div>
              <Button variant="primary" className="whitespace-nowrap" onClick={() => {}}>
                View growth report
              </Button>
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-2">
            {overview.map((item) => (
              <Card key={item.label} className="p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.32em] text-slate-500">{item.label}</p>
                    <p className="mt-3 text-3xl font-semibold text-slate-900">{item.value}</p>
                  </div>
                  <div className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ${item.tone}`}>
                    <item.icon className="h-5 w-5" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
          <Card title="Recent activity" subtitle="Track your latest export and AI tasks">
            <div className="space-y-4">
              {jobs.slice(0, 4).map((job) => (
                <div key={job.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-900">{job.label}</p>
                      <p className="text-sm text-slate-500">{job.updatedAt}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${job.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : job.status === 'processing' ? 'bg-sky-100 text-sky-700' : 'bg-amber-100 text-amber-700'}`}>
                      {job.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
        <div className="space-y-6">
          <Card title="Your products" subtitle="Latest exporter assets">
            <div className="space-y-4">
              {products.slice(0, 3).map((product) => (
                <div key={product.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <h3 className="font-semibold text-slate-900">{product.name}</h3>
                  <p className="mt-1 text-sm text-slate-500">{product.description}</p>
                </div>
              ))}
            </div>
          </Card>
          <Card title="Export readiness" subtitle="Compliance and ESG snapshot">
            <div className="space-y-4">
              <div className="rounded-3xl bg-emerald-50 p-4">
                <p className="text-sm text-emerald-700">Average compliance score</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">92%</p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-4 text-sm text-slate-600">
                <p>Top certification: CE, RoHS, ISO 9001</p>
                <p className="mt-3">The latest product sheet has minimal warnings and export-ready market coverage.</p>
              </div>
            </div>
          </Card>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.32em] text-slate-500">Action</p>
                <h3 className="mt-2 text-xl font-semibold text-slate-900">Create a new product</h3>
                <p className="mt-2 text-sm text-slate-500">Use the AI wizard to generate a polished product sheet in minutes.</p>
              </div>
              <Link to="/products/new" className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
                Start wizard
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
