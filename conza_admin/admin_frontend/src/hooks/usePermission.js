import useAuthStore from '../store/auth/useAuthStore'

/**
 * Returns a helper that checks whether the current admin has a given permission.
 * Super admins always return true.
 * Usage:  const can = usePermission()
 *         if (can('customers')) { ... }
 */
export function usePermission() {
  const user = useAuthStore((s) => s.user)

  return (permission) => {
    if (!user) return false
    if (user.role === 'super_admin') return true
    const perms = user.permissions || []
    if (perms.includes('all')) return true
    return perms.includes(permission)
  }
}

/**
 * Returns true if the current admin has ALL of the listed permissions.
 */
export function useHasAllPermissions(...permissions) {
  const user = useAuthStore((s) => s.user)
  if (!user) return false
  if (user.role === 'super_admin') return true
  const perms = user.permissions || []
  if (perms.includes('all')) return true
  return permissions.every((p) => perms.includes(p))
}

/**
 * Returns true if the current admin has ANY of the listed permissions.
 */
export function useHasAnyPermission(...permissions) {
  const user = useAuthStore((s) => s.user)
  if (!user) return false
  if (user.role === 'super_admin') return true
  const perms = user.permissions || []
  if (perms.includes('all')) return true
  return permissions.some((p) => perms.includes(p))
}