import { Navigate, Outlet } from 'react-router-dom'
import { usePermission } from '../hooks/usePermission'

/**
 * Route guard that checks a permission key before rendering its child routes.
 * Redirects to '/' (dashboard) when access is denied.
 *
 * Usage in AppRoutes.jsx:
 *   <Route element={<PermissionRoute permission="customers" />}>
 *     <Route path="/customers" element={<CustomerList />} />
 *   </Route>
 */
export default function PermissionRoute({ permission }) {
  const can = usePermission()
  if (!can(permission)) return <Navigate to="/" replace />
  return <Outlet />
}