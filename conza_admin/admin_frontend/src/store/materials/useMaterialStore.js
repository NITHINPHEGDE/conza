import { create } from 'zustand'
import materialService from '../../services/materialService'

const mapMaterial = (m) => ({ ...m, id: m._id || m.id })

const useMaterialStore = create((set, get) => ({
  materials: [],
  selectedMaterial: null,
  loading: true,
  error: null,

  featured: [],
  featuredLoading: true,
  featuredError: null,

  // params: { source: 'all' | 'catalogue' | 'custom', search, page, limit }
  fetchMaterials: async (params = {}) => {
    set({ loading: true, error: null })
    try {
      const res = await materialService.getAll({ page: 1, limit: 200, ...params })
      if (res.success) {
        set({ materials: (res.data || []).map(mapMaterial), loading: false })
      } else {
        set({ loading: false, error: res.message || 'Failed to load materials' })
      }
    } catch (err) {
      set({ loading: false, error: 'Failed to load materials' })
    }
  },

  fetchMaterialById: async (id) => {
    set({ loading: true, error: null, selectedMaterial: null })
    try {
      const res = await materialService.getById(id)
      const material = res.material
      if (res.success && material) {
        set({ selectedMaterial: mapMaterial(material), loading: false })
      } else {
        set({ loading: false, error: res.message || 'Material not found' })
      }
    } catch (err) {
      set({ loading: false, error: 'Failed to load material' })
    }
  },

  fetchFeatured: async () => {
    set({ featuredLoading: true, featuredError: null })
    try {
      const res = await materialService.getFeatured()
      if (res.success) {
        set({ featured: (res.materials || []).map(mapMaterial), featuredLoading: false })
      } else {
        set({ featuredLoading: false, featuredError: res.message || 'Failed to load featured products' })
      }
    } catch (err) {
      set({ featuredLoading: false, featuredError: 'Failed to load featured products' })
    }
  },

  updateMaterial: async (id, data) => {
    const res = await materialService.update(id, data)
    if (res.success && res.material) {
      const updated = mapMaterial(res.material)
      set((state) => ({
        materials: state.materials.map((m) => (m.id === id ? updated : m)),
        selectedMaterial: state.selectedMaterial?.id === id ? updated : state.selectedMaterial,
      }))
    }
    return res
  },

  deleteMaterial: async (id) => {
    const res = await materialService.remove(id)
    if (res.success) {
      set((state) => ({
        materials: state.materials.filter((m) => m.id !== id),
        featured: state.featured.filter((m) => m.id !== id),
      }))
    }
    return res
  },

  toggleFeatured: async (id) => {
    const res = await materialService.toggleFeatured(id)
    if (res.success && res.material) {
      const updated = mapMaterial(res.material)
      set((state) => ({
        materials: state.materials.map((m) => (m.id === id ? updated : m)),
        selectedMaterial: state.selectedMaterial?.id === id ? updated : state.selectedMaterial,
        featured: updated.isFeatured
          ? (state.featured.some((f) => f.id === id)
              ? state.featured.map((f) => (f.id === id ? updated : f))
              : [updated, ...state.featured])
          : state.featured.filter((f) => f.id !== id),
      }))
    }
    return res
  },
}))

export default useMaterialStore
