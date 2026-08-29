import { create } from 'zustand'

let toastId = 0

const useToastStore = create((set, get) => ({
  toasts: [],

  addToast: (message, type = 'info') => {
    const id = ++toastId
    set((state) => ({ toasts: [...state.toasts, { id, message, type }] }))
    setTimeout(() => {
      get().removeToast(id)
    }, 4000)
  },

  removeToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
  },
}))

export { useToastStore }
export default useToastStore
