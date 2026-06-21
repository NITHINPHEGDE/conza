import { Navigate, Outlet } from 'react-router-dom'
import useAuthStore from '../store/auth/useAuthStore'

export default function RoleRoute({ allowedRoles }) {
  const { isAuthenticated, user } = useAuthStore((s) => ({ isAuthenticated: s.isAuthenticated, user: s.user }))
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (!allowedRoles.includes(user?.role)) return <Navigate to="/" replace />
  return <Outlet />
}
