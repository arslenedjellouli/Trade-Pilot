import { Navigate, Outlet } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'

export default function ProtectedRoute() {
  const token = useAppStore((s) => s.auth.token)
  return token ? <Outlet /> : <Navigate to="/login" replace />
}
