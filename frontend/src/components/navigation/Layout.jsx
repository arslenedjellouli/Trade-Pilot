import { Outlet, useNavigate } from 'react-router-dom'
import { useAppStore } from '../../store/useAppStore'
import Sidebar from './Sidebar'

export default function Layout() {
  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <Sidebar />

      <div className="flex flex-1 flex-col overflow-hidden">
        <main className="min-h-0 flex-1 overflow-hidden p-4 sm:p-6 lg:p-8">
          <div className="h-full overflow-y-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
