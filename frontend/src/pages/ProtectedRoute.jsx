import { Navigate, Outlet } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'

export default function ProtectedRoute() {
  const token = useAppStore((state) => state.auth.token)
  if (!token) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
