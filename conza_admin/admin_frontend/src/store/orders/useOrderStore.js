import { create } from 'zustand'
import orderService from '../../services/orderService'

const normalizeOrder = (doc) => ({
  ...doc,
  id: doc._id,
  customer: doc.customer?.fullName || doc.customerName || 'N/A',
  vendor: doc.seller?.shopName || doc.seller?.name || 'N/A',
  type: doc.orderType,
  date: doc.createdAt,
})

const useOrderStore = create((set, get) => ({
  orders: [],
  loading: false,
  error: null,
  filters: { status: 'all', type: 'all', search: '' },
  setFilters: (filters) => set({ filters }),
  fetchOrders: async () => {
    set({ loading: true, error: null })
    try {
      const res = await orderService.getAll({})
      const orders = (res.data || []).map(normalizeOrder)
      set({ orders, loading: false })
    } catch (err) {
      set({ error: err.message || 'Failed to fetch orders', loading: false })
    }
  },
  updateOrderStatus: async (id, status) => {
    await orderService.updateStatus(id, status)
    set((state) => ({
      orders: state.orders.map((o) => o.id === id ? { ...o, status } : o)
    }))
  },
  getFilteredOrders: () => {
    const { orders, filters } = get()
    return orders.filter((o) => {
      if (filters.status !== 'all' && o.status !== filters.status) return false
      if (filters.type !== 'all' && o.type !== filters.type) return false
      if (filters.search && !o.id.toLowerCase().includes(filters.search.toLowerCase())) return false
      return true
    })
  },
}))

export default useOrderStore
