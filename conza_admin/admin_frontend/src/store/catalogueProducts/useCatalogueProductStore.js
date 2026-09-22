import { create } from 'zustand'
import catalogueProductService from '../../services/catalogueProductService'

const mapProduct = (p) => ({ ...p, id: p._id || p.id })

const useCatalogueProductStore = create((set, get) => ({
  products: [],
  total: 0,
  page: 1,
  pages: 1,
  loading: true,
  error: null,

  fetchProducts: async (params = {}) => {
    set({ loading: true, error: null })
    try {
      const res = await catalogueProductService.getAll({ page: 1, limit: 100, ...params })
      if (res.success) {
        set({
          products: (res.data || []).map(mapProduct),
          total: res.pagination?.total || 0,
          page: res.pagination?.page || 1,
          pages: res.pagination?.pages || 1,
          loading: false,
        })
      } else {
        set({ loading: false, error: res.message || 'Failed to load catalogue products' })
      }
    } catch (err) {
      set({ loading: false, error: err.message || 'Failed to load catalogue products' })
    }
  },

  createProduct: async (data) => {
    const res = await catalogueProductService.create(data)
    if (res.success && res.product) {
      set((state) => ({ products: [mapProduct(res.product), ...state.products] }))
    }
    return res
  },

  updateProduct: async (id, data) => {
    const res = await catalogueProductService.update(id, data)
    if (res.success && res.product) {
      const updated = mapProduct(res.product)
      set((state) => ({
        products: state.products.map((p) => (p.id === id ? updated : p)),
      }))
    }
    return res
  },

  deleteProduct: async (id) => {
    const res = await catalogueProductService.remove(id)
    if (res.success) {
      set((state) => ({ products: state.products.filter((p) => p.id !== id) }))
    }
    return res
  },
}))

export default useCatalogueProductStore
