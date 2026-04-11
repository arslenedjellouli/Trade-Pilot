import { NavLink } from 'react-router-dom'
import { LayoutDashboard, PackageSearch, FileText, ClipboardList, Clock3 } from 'lucide-react'

const navItems = [
  { label: 'Dashboard', to: '/', icon: LayoutDashboard },
  { label: 'New Product', to: '/products/new', icon: PackageSearch },
  { label: 'Catalogs', to: '/catalogs', icon: FileText },
  { label: 'Jobs', to: '/jobs', icon: Clock3 },
]

export default function Sidebar() {
  return (
    <aside className="hidden w-[280px] shrink-0 flex-col gap-4 lg:flex">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <p className="mb-3 text-xs uppercase tracking-[0.32em] text-slate-500">Workspace</p>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                    isActive ? 'bg-slate-900 text-white shadow-soft' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`
                }
              >
                <Icon className="h-5 w-5 shrink-0" />
                {item.label}
              </NavLink>
            )
          })}
        </nav>
      </div>
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <p className="mb-3 text-xs uppercase tracking-[0.32em] text-slate-500">Quick actions</p>
        <button className="w-full rounded-2xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-700">
          Recommend product update
        </button>
      </div>
    </aside>
  )
}
