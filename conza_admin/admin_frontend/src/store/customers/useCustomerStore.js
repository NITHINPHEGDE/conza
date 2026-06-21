import { create } from 'zustand'
import { mockCustomers } from '../../mock/customers'

const useCustomerStore = create((set, get) => ({
  customers: mockCustomers,
  selectedCustomer: null,
  loading: false,
  filters: { status: 'all', search: '' },
  setFilters: (filters) => set({ filters }),
  selectCustomer: (id) => set({ selectedCustomer: mockCustomers.find((c) => c.id === id) }),
  updateCustomerStatus: (id, status) => set((state) => ({
    customers: state.customers.map((c) => c.id === id ? { ...c, status } : c)
  })),
  deleteCustomer: (id) => set((state) => ({
    customers: state.customers.filter((c) => c.id !== id)
  })),
  getFilteredCustomers: () => {
    const { customers, filters } = get()
    return customers.filter((c) => {
      if (filters.status !== 'all' && c.status !== filters.status) return false
      if (filters.search && !c.fullName.toLowerCase().includes(filters.search.toLowerCase()) && !c.phone.includes(filters.search)) return false
      return true
    })
  }
}))

export default useCustomerStore
