import { create } from 'zustand'

const useAuthStore = create((set) => ({
  isAuthenticated: true,
  user: {
    id: '1',
    name: 'Super Admin',
    email: 'admin@conza.in',
    role: 'super_admin',
    avatar: null,
  },
  login: (user) => set({ isAuthenticated: true, user }),
  logout: () => set({ isAuthenticated: false, user: null }),
  updateUser: (data) => set((state) => ({ user: { ...state.user, ...data } })),
}))

export default useAuthStore
