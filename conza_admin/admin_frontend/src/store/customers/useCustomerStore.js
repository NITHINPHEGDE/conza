import { create } from 'zustand'
import customerService from '../../services/customerService'

const mapCustomer = (c) => ({ ...c, id: c._id || c.id })

const useCustomerStore = create((set, get) => ({
  customers: [],
  selectedCustomer: null,
  loading: false,
  error: null,
  filters: { status: 'all', search: '' },

  setFilters: (filters) => set({ filters }),

  fetchCustomers: async () => {
    set({ loading: true, error: null })
    try {
      const { filters } = get()
      const params = { page: 1, limit: 100 }
      if (filters.status !== 'all') params.status = filters.status
      if (filters.search) params.search = filters.search
      const res = await customerService.getAll(params)
      if (res.success) {
        set({ customers: (res.data || []).map(mapCustomer), loading: false })
      } else {
        set({ loading: false, error: res.message || 'Failed to load customers' })
      }
    } catch (err) {
      set({ loading: false, error: 'Failed to load customers' })
    }
  },

  fetchCustomerById: async (id) => {
    set({ loading: true, error: null, selectedCustomer: null })
    try {
      const res = await customerService.getById(id)
      if (res.success) {
        set({ selectedCustomer: mapCustomer(res.data.customer), loading: false })
      } else {
        set({ loading: false, error: res.message || 'Customer not found' })
      }
    } catch (err) {
      set({ loading: false, error: 'Failed to load customer' })
    }
  },

  selectCustomer: (id) => set((state) => ({
    selectedCustomer: state.customers.find((c) => c.id === id) || null
  })),

  updateCustomerStatus: async (id, status) => {
    const res = await customerService.updateStatus(id, status)
    if (res.success) {
      set((state) => ({
        customers: state.customers.map((c) => c.id === id ? { ...c, status } : c),
        selectedCustomer: state.selectedCustomer && state.selectedCustomer.id === id
          ? { ...state.selectedCustomer, status }
          : state.selectedCustomer,
      }))
    }
  },

  deleteCustomer: async (id) => {
    const res = await customerService.delete(id)
    if (res.success) {
      set((state) => ({
        customers: state.customers.filter((c) => c.id !== id)
      }))
    }
  },

  getFilteredCustomers: () => {
    const { customers } = get()
    return customers
  },
}))

export default useCustomerStore
