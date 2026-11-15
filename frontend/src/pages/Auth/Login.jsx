import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../../store/useAppStore'
import axiosClient from '../../api/axiosClient'

export default function Login() {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState(null)
  const [logoFailed, setLogoFailed] = useState(false)
  const login    = useAppStore((s) => s.login)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await axiosClient.post('/auth/login/', { email, password })
      login(res.data.token, res.data.user)
      navigate('/')
    } catch (err) {
      setError(err?.response?.data?.error || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-[32px] border border-white/70 bg-white/75 shadow-[0_24px_90px_rgba(15,23,42,0.12)] backdrop-blur-xl lg:grid-cols-[1.1fr_0.9fr]">
        <div className="relative hidden overflow-hidden bg-blue-600 px-8 py-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(219,234,254,0.20),transparent_28%)]" />
          <div className="relative">
            <div className="flex items-center gap-3">
              {!logoFailed ? (
                <img
                  src="/logo-compact.jpg"
                  alt="Trade Pilot"
                  className="h-11 w-11 rounded-2xl object-cover ring-1 ring-white/20"
                  onError={() => setLogoFailed(true)}
                />
              ) : (
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 text-lg font-bold text-white ring-1 ring-white/20">
                  E
                </div>
              )}
              <div>
                <p className="text-sm font-semibold tracking-tight text-white/90">Trade Pilot</p>
                <p className="text-xs text-white/70">Modern export workspace</p>
              </div>
            </div>

            <div className="mt-16 max-w-md">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/90">Simple. Fast. Focused.</p>
              <h1 className="mt-4 text-4xl font-bold tracking-tight text-white lg:text-5xl">
                A clean workspace for export compliance and product sheets.
              </h1>
              <p className="mt-5 text-base leading-7 text-white/80">
                Keep the same product workflows, but work inside a modern React interface with a calmer layout and clearer hierarchy.
              </p>
            </div>
          </div>

          <div className="relative grid gap-3 text-sm text-white/80 sm:grid-cols-3">
            {[
              ['Chat', 'Compliance answers with RAG'],
              ['Wizard', 'AI product sheet flow'],
              ['Editor', 'Translate and export PDFs'],
            ].map(([title, text]) => (
              <div key={title} className="rounded-3xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
                <p className="font-semibold text-white">{title}</p>
                <p className="mt-1 text-xs leading-5 text-white/75">{text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-center px-5 py-10 sm:px-8 lg:px-10">
          <div className="w-full max-w-md">
            <div className="mb-8 text-center lg:text-left">
              <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-xl font-bold text-white shadow-lg lg:hidden">
                E
              </div>
              <p className="app-heading">Sign in</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Welcome back</h1>
              <p className="mt-2 text-sm leading-6 text-slate-500">Sign in with the account configured by the administrator.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 rounded-[28px] border border-blue-100/80 bg-white/95 p-5 shadow-sm sm:p-6">
              <label className="block text-sm font-semibold text-slate-700">
                Email
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-2 block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                />
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                Password
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="mt-2 block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                />
              </label>

              {error && <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(37,99,235,0.18)] transition hover:-translate-y-0.5 hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Signing in…' : 'Sign in'}
              </button>
            </form>

          </div>
        </div>
      </div>
    </div>
  )
}
