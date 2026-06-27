import { usePermission } from '../../../hooks/usePermission'

/**
 * Renders children only when the current admin has the required permission.
 * The component is NOT rendered at all (not just hidden) when access is denied.
 *
 * Props:
 *   permission  — string, required permission key (e.g. 'customers')
 *   fallback    — optional ReactNode to render when access is denied (default: null)
 *   children    — content to protect
 *
 * Example:
 *   <PermissionGate permission="customers">
 *     <DeleteButton />
 *   </PermissionGate>
 */
export default function PermissionGate({ permission, fallback = null, children }) {
  const can = usePermission()
  if (!can(permission)) return fallback
  return children
}