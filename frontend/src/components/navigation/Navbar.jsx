import { LogOut, Sparkles, Bell } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import { useNavigate } from 'react-router-dom'

export default function Navbar() {
  const logout = useAppStore((state) => state.logout)
  const user = useAppStore((state) => state.auth.user)
  const navigate = useNavigate()

  return (
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div>
          <p className="text-xs uppercase tracking-[0.32em] text-slate-500">AI Product & Catalog Engine</p>
          <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">Exporter workspace</h1>
        </div>
        <div className="flex items-center gap-3">
          <button className="inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 transition hover:border-slate-300">
            <Sparkles className="h-4 w-4 text-sky-600" /> AI insights
          </button>
          <button className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition hover:border-slate-300">
            <Bell className="h-5 w-5" />
          </button>
          <button
            onClick={() => {
              logout()
              navigate('/login')
            }}
            className="inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-700 transition hover:border-slate-300"
          >
            <LogOut className="h-4 w-4" />
            {user?.name || 'Logout'}
          </button>
        </div>
      </div>
    </header>
  )
}
