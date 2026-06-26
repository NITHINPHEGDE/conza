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

const useAuthStore = create((set) => ({
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
}))

export default useAuthStore
