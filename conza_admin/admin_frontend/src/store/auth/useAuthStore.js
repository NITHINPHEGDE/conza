import { create } from 'zustand'

const TOKEN_KEY = 'adminToken'

const getStoredUser = () => {
  try {
    const u = localStorage.getItem('adminUser')
    return u ? JSON.parse(u) : null
  } catch {
    return null
  }
}

const useAuthStore = create((set, get) => ({
  isAuthenticated: !!localStorage.getItem(TOKEN_KEY),
  user: getStoredUser(),
  token: localStorage.getItem(TOKEN_KEY) || null,

  login: (user, token) => {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    if (user) localStorage.setItem('adminUser', JSON.stringify(user))
    set({ isAuthenticated: true, user, token })
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem('adminUser')
    set({ isAuthenticated: false, user: null, token: null })
  },

  updateUser: (data) => set((state) => {
    const updated = { ...state.user, ...data }
    localStorage.setItem('adminUser', JSON.stringify(updated))
    return { user: updated }
  }),

  // Refresh permissions from /auth/me — call after role updates or token refresh
  refreshPermissions: async () => {
    try {
      const token = localStorage.getItem(TOKEN_KEY)
      if (!token) return
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/me`,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          credentials: 'include',
        }
      )
      const data = await res.json()
      if (data.success && data.admin) {
        const updated = { ...get().user, ...data.admin }
        localStorage.setItem('adminUser', JSON.stringify(updated))
        set({ user: updated })
      }
    } catch {
      // silently fail — permissions will refresh on next login
    }
  },
}))

export default useAuthStore
