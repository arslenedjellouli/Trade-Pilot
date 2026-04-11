import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Sidebar from './Sidebar'

export default function Layout() {
  return (
    <div className="min-h-screen bg-surface text-slate-900">
      <Navbar />
      <div className="mx-auto flex max-w-[1440px] gap-6 px-4 pb-10 pt-6 sm:px-6 lg:px-8">
        <Sidebar />
        <main className="min-w-0 flex-1 rounded-3xl border border-slate-200 bg-white p-6 shadow-soft sm:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
