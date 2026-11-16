import { NavLink } from 'react-router-dom'
import logoCompact from '../../../assets/logo.png'

const links = [
  {
    to: '/',
    label: 'Dashboard',
    icon: (
      <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    to: '/products/new',
    label: 'Products',
    icon: (
      <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
]

export default function Sidebar() {
  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-[rgb(45,105,235)]/15 bg-white shadow-[inset_-1px_0_0_rgba(45,105,235,0.06)] backdrop-blur-xl">
      <div className="border-b border-[rgb(45,105,235)]/10 px-4 py-4">
        <div className="flex items-center gap-3 rounded-2xl bg-[rgb(45,105,235)]/5 px-3 py-2.5">
          <img src={logoCompact} alt="Trade Pilot" className="h-10 w-auto object-contain" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold tracking-tight text-black">Trade Pilot</p>
            <p className="truncate text-xs text-black/60">Workspace</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4">
        <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-[rgb(45,105,235)]">
          Navigation
        </p>
        <div className="space-y-1">
          {links.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold tracking-tight transition-all duration-200 ${
                  isActive
                    ? 'bg-[rgb(45,105,235)] text-white shadow-[0_10px_24px_rgba(45,105,235,0.22)]'
                    : 'text-black hover:bg-[rgb(45,105,235)]/10 hover:text-[rgb(45,105,235)]'
                }`
              }
            >
              <span className="text-current">{icon}</span>
              <span>{label}</span>
            </NavLink>
          ))}
        </div>

        <div className="mt-6 rounded-2xl border border-[rgb(45,105,235)]/10 bg-[rgb(45,105,235)]/5 px-4 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[rgb(45,105,235)]">Quick Access</p>
          <p className="mt-2 text-sm leading-6 text-black/70">
            Create products and review compliance in a focused workspace.
          </p>
        </div>
      </nav>
    </aside>
  )
}
