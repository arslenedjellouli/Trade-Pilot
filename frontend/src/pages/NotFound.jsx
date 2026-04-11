import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-soft">
      <p className="text-sm uppercase tracking-[0.32em] text-slate-500">Page not found</p>
      <h1 className="text-4xl font-semibold text-slate-900">404 — Lost in the catalog</h1>
      <p className="max-w-xl text-sm text-slate-500">
        The route you tried does not exist yet. Return to the dashboard to continue managing product exports.
      </p>
      <Link to="/" className="rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
        Go home
      </Link>
    </div>
  )
}
