import { create } from 'zustand'
import { mockVendors } from '../../mock/vendors'

const useVendorStore = create((set, get) => ({
  vendors: mockVendors,
  selectedVendor: null,
  loading: false,
  filters: { status: 'all', type: 'all', search: '' },
  setFilters: (filters) => set({ filters }),
  selectVendor: (id) => set({ selectedVendor: mockVendors.find((v) => v.id === id) }),
  updateVendorStatus: (id, status) => set((state) => ({
    vendors: state.vendors.map((v) => v.id === id ? { ...v, status } : v)
  })),
  deleteVendor: (id) => {
    set((state) => ({
      vendors: state.vendors.filter((v) => v.id !== id),
    }))
  },
  verifyVendor: (id) => {
    set((state) => ({
      vendors: state.vendors.map((v) =>
        v.id === id ? { ...v, isVerified: true, status: v.status === 'pending_verification' ? 'active' : v.status } : v
      ),
    }))
  },
  getFilteredVendors: () => {
    const { vendors, filters } = get()
    return vendors.filter((v) => {
      if (filters.status !== 'all' && v.status !== filters.status) return false
      if (filters.type !== 'all' && v.sellerType !== filters.type) return false
      if (filters.search && !v.name.toLowerCase().includes(filters.search.toLowerCase()) && !v.shopName.toLowerCase().includes(filters.search.toLowerCase())) return false
      return true
    })
  }
}))

export default useVendorStore
