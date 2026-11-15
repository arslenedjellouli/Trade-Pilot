import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import Badge from '../components/ui/Badge'

const StatIcon = ({ path }) => (
  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={path} />
  </svg>
)

export default function Dashboard() {
  const { products, loading, fetchProducts } = useAppStore()

  useEffect(() => { fetchProducts() }, [])

  const pdfCount  = products.filter(p => p.imagePath).length
  const langCount = [...new Set(products.map(p => p.lang))].length || (products.length ? 1 : 0)
  const avgScore  = 92

  const stats = [
    {
      label: 'Products',
      value: products.length,
      icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    },
    {
      label: 'Catalogs',
      value: pdfCount,
      icon: 'M12 4v16m8-8H4',
    },
    {
      label: 'Active Jobs',
      value: langCount,
      icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
    },
    {
      label: 'Compliance Score',
      value: `${avgScore}%`,
      icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="app-panel overflow-hidden">
        <div className="grid gap-6 px-6 py-6 lg:grid-cols-[1.5fr_0.9fr] lg:px-8 lg:py-8">
          <div className="space-y-4">
            <p className="app-heading">Dashboard</p>
            <h1 className="app-page-title">Your export workspace at a glance</h1>
            <p className="app-page-subtitle max-w-2xl">
              Review products, track AI-generated sheets, and jump straight into compliance chat or product creation.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link to="/products/new" className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(15,23,42,0.18)] transition hover:-translate-y-0.5 hover:bg-slate-800">
                Create product
              </Link>
              <Link to="/chat" className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:text-slate-900">
                Open compliance chat
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {stats.map(({ label, value, icon }) => (
              <div key={label} className="rounded-3xl border border-slate-200/70 bg-white/85 p-4 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">{label}</p>
                    <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{value}</p>
                  </div>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-50 ring-1 ring-inset ring-slate-200/70">
                    <StatIcon path={icon} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_0.8fr]">
        <div className="min-w-0 space-y-6">
          <div className="app-panel overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200/70 px-6 py-4">
              <div>
                <h2 className="text-base font-semibold tracking-tight text-slate-900">Products</h2>
                <p className="mt-1 text-sm text-slate-500">{products.length} total products</p>
              </div>
              <Badge color={products.length ? 'green' : 'gray'}>{products.length ? 'active catalog' : 'empty workspace'}</Badge>
            </div>

            {loading ? (
              <p className="px-6 py-12 text-center text-sm text-slate-400">Loading…</p>
            ) : products.length === 0 ? (
              <div className="px-6 py-14 text-center">
                <p className="text-sm text-slate-500">No products yet.</p>
                <Link to="/products/new" className="mt-3 inline-flex items-center rounded-full bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800">
                  Create your first product
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200/70 text-left">
                      <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Product Name</th>
                      <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">SKU</th>
                      <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Category</th>
                      <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {products.map(p => (
                      <tr key={p.id} className="transition hover:bg-slate-50/70">
                        <td className="px-6 py-4">
                          <Link to={`/products/${p.id}`} className="font-semibold text-slate-900 hover:text-slate-700">
                            {p.name || 'Untitled'}
                          </Link>
                        </td>
                        <td className="px-6 py-4 text-slate-500">{p.productData?.reference || '-'}</td>
                        <td className="px-6 py-4 text-slate-500">{p.productData?.category || p.productData?.product_type || '-'}</td>
                        <td className="px-6 py-4">
                          <Badge color={p.imagePath ? 'green' : 'gray'}>
                            {p.imagePath ? 'ready' : 'draft'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="app-panel overflow-hidden">
            <div className="border-b border-slate-200/70 px-6 py-4">
              <h2 className="text-base font-semibold tracking-tight text-slate-900">Recent jobs</h2>
              <p className="mt-1 text-sm text-slate-500">Latest AI tasks</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200/70 text-left">
                    <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Task</th>
                    <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Type</th>
                    <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Status</th>
                    <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.slice(0, 3).map((p, i) => {
                    const statuses = ['completed', 'processing', 'pending']
                    const colors   = ['green', 'purple', 'yellow']
                    const tasks    = ['Generate catalog', 'AI product sheet', 'Compliance review']
                    const times    = ['2m ago', 'just now', '1m ago']
                    return (
                      <tr key={p.id} className="transition hover:bg-slate-50/70">
                        <td className="px-6 py-4 font-semibold text-slate-700">{tasks[i % 3]}</td>
                        <td className="px-6 py-4 text-slate-500">{p.productData?.category || '—'}</td>
                        <td className="px-6 py-4"><Badge color={colors[i % 3]}>{statuses[i % 3]}</Badge></td>
                        <td className="px-6 py-4 text-slate-400">{times[i % 3]}</td>
                      </tr>
                    )
                  })}
                  {products.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-10 text-center text-sm text-slate-400">No jobs yet</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6 xl:sticky xl:top-0 xl:self-start">
          <div className="app-panel space-y-4 p-6">
            <h3 className="text-sm font-semibold tracking-tight text-slate-900">Quick actions</h3>
            <div className="space-y-2">
              <Link to="/products/new" className="flex w-full items-center justify-center rounded-full bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(15,23,42,0.18)] transition hover:-translate-y-0.5 hover:bg-slate-800">
                New product
              </Link>
              <button className="flex w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:text-slate-900">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                New catalog
              </button>
            </div>
          </div>

          <div className="app-panel p-6">
            <h3 className="text-sm font-semibold tracking-tight text-slate-900">Compliance score</h3>
            <p className="mt-3 text-4xl font-bold tracking-tight text-blue-600">{avgScore}%</p>
            <p className="mt-1 text-xs uppercase tracking-[0.22em] text-slate-400">Average</p>
            <div className="mt-4 h-2 w-full rounded-full bg-slate-100">
              <div className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-sky-500 transition-all" style={{ width: `${avgScore}%` }} />
            </div>
            <p className="mt-3 text-sm text-slate-500">No critical warnings</p>
          </div>

          <div className="app-panel p-6">
            <h3 className="text-sm font-semibold tracking-tight text-slate-900">Getting started?</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Create your first product and generate an export-ready catalog in minutes with AI assistance.
            </p>
            <Link
              to="/products/new"
              className="mt-4 flex w-full items-center justify-center rounded-full bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(15,23,42,0.18)] transition hover:-translate-y-0.5 hover:bg-slate-800"
            >
              Start tutorial
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
