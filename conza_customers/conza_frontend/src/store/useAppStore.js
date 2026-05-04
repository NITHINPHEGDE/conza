import { create } from 'zustand';
import {
  labourCategories    as dummyLabourCategories,
  workersByCategory   as dummyWorkersByCategory,
  allWorkers          as dummyAllWorkers,
  materials           as dummyMaterials,
  rentalItems         as dummyRentalItems,
  rentalCategories    as dummyRentalCategories,
  userProfile         as dummyUserProfile,
  projects            as dummyProjects,
} from '../data/dummyData';

// ─── When backend is ready, import API calls here ─────────────────────────────
// import { labourAPI }    from '../api/labour';
// import { materialsAPI } from '../api/materials';
// import { rentalAPI }    from '../api/rental';
// import { authAPI }      from '../api/auth';

const useAppStore = create((set, get) => ({

  // ── App init ─────────────────────────────────────────────────────────────────
  initialized: false,
  initApp: async () => {
    await Promise.all([
      get().fetchLabourData(),
      get().fetchMaterials(),
      get().fetchRentalData(),
      get().fetchUserProfile(),
      get().fetchProjects(),
    ]);
    set({ initialized: true });
  },

  // ── Labour ───────────────────────────────────────────────────────────────────
  labourCategories: [],
  workersByCategory: {},
  allWorkers: [],
  labourLoading: false,
  labourError: null,

  fetchLabourData: async () => {
    try {
      set({ labourLoading: true, labourError: null });

      // ── DUMMY ──
      set({
        labourCategories:  dummyLabourCategories,
        workersByCategory: dummyWorkersByCategory,
        allWorkers:        dummyAllWorkers,
      });

      // ── REAL API (uncomment when ready) ──
      // const [cats, workers] = await Promise.all([
      //   labourAPI.getCategories(),
      //   labourAPI.getAllWorkers(),
      // ]);
      // set({
      //   labourCategories:  cats.categories,
      //   workersByCategory: workers.byCategory,
      //   allWorkers:        workers.all,
      // });

    } catch (err) {
      set({ labourError: err.message });
    } finally {
      set({ labourLoading: false });
    }
  },

  // Workers filtered by category — derived, no extra fetch needed
  getWorkersByCategory: (category) => {
    return get().workersByCategory[category] || [];
  },

  // Skill search — derived from allWorkers, no extra fetch needed
  searchWorkers: (query) => {
    if (!query || query.trim() === '') return [];
    const q = query.toLowerCase();
    return get().allWorkers.filter((w) =>
      w.skills.some((s) => s.toLowerCase().includes(q)) ||
      w.category.toLowerCase().includes(q) ||
      w.name.toLowerCase().includes(q)
    );
  },

  // ── Materials ─────────────────────────────────────────────────────────────────
  materials: [],
  materialsLoading: false,
  materialsError: null,

  fetchMaterials: async () => {
    try {
      set({ materialsLoading: true, materialsError: null });

      // ── DUMMY ──
      set({ materials: dummyMaterials });

      // ── REAL API ──
      // const res = await materialsAPI.getMaterials();
      // set({ materials: res.materials });

    } catch (err) {
      set({ materialsError: err.message });
    } finally {
      set({ materialsLoading: false });
    }
  },

  // Search materials — derived, no extra fetch
  searchMaterials: (query) => {
    if (!query || query.trim() === '') return get().materials;
    const q = query.toLowerCase();
    return get().materials.filter((m) =>
      m.name.toLowerCase().includes(q) ||
      m.seller.toLowerCase().includes(q)
    );
  },

  // ── Rental ────────────────────────────────────────────────────────────────────
  rentalItems: [],
  rentalCategories: [],
  rentalLoading: false,
  rentalError: null,

  fetchRentalData: async () => {
    try {
      set({ rentalLoading: true, rentalError: null });

      // ── DUMMY ──
      set({
        rentalItems:      dummyRentalItems,
        rentalCategories: dummyRentalCategories,
      });

      // ── REAL API ──
      // const [items, cats] = await Promise.all([
      //   rentalAPI.getRentalItems(),
      //   rentalAPI.getRentalCategories(),
      // ]);
      // set({ rentalItems: items.items, rentalCategories: cats.categories });

    } catch (err) {
      set({ rentalError: err.message });
    } finally {
      set({ rentalLoading: false });
    }
  },

  // Filter rental items — derived, no extra fetch
  filterRentalItems: (category = 'all', query = '') => {
    return get().rentalItems.filter((item) => {
      const matchCat   = category === 'all' || item.category === category;
      const matchQuery = query.trim() === '' ||
        item.name.toLowerCase().includes(query.toLowerCase()) ||
        item.seller.toLowerCase().includes(query.toLowerCase());
      return matchCat && matchQuery;
    });
  },

  // ── User Profile ──────────────────────────────────────────────────────────────
  userProfile: null,
  profileLoading: false,

  fetchUserProfile: async () => {
    try {
      set({ profileLoading: true });

      // ── DUMMY ──
      set({ userProfile: dummyUserProfile });

      // ── REAL API ──
      // const res = await authAPI.getProfile();
      // set({ userProfile: res.user });

    } catch (err) {
      console.error('Profile fetch failed:', err.message);
    } finally {
      set({ profileLoading: false });
    }
  },

  // ── Projects ──────────────────────────────────────────────────────────────────
  projects: [],
  projectsLoading: false,

  fetchProjects: async () => {
    try {
      set({ projectsLoading: true });

      // ── DUMMY ──
      const { projects: dummyProjects } = require('../data/dummyData');
      set({ projects: dummyProjects });

      // ── REAL API ──
      // const res = await bookingAPI.getMyBookings();
      // set({ projects: res.projects });

    } catch (err) {
      console.error('Projects fetch failed:', err.message);
    } finally {
      set({ projectsLoading: false });
    }
  },

  // ── Cart (materials) ──────────────────────────────────────────────────────────
  cart: {},

  addToCart: (item) => {
    if (item._setQty !== undefined) {
      set((state) => ({ cart: { ...state.cart, [item.id]: item._setQty } }));
    } else {
      set((state) => ({
        cart: { ...state.cart, [item.id]: (state.cart[item.id] || 0) + 1 },
      }));
    }
  },

  removeFromCart: (item) => {
    set((state) => {
      const current = state.cart[item.id] || 0;
      if (current <= 1) {
        const updated = { ...state.cart };
        delete updated[item.id];
        return { cart: updated };
      }
      return { cart: { ...state.cart, [item.id]: current - 1 } };
    });
  },

  clearCart: () => set({ cart: {} }),

  getCartItems: () => {
    const { cart, materials } = get();
    return materials.filter((m) => cart[m.id] > 0);
  },

  getCartTotal: () => {
    const { cart, materials } = get();
    return materials
      .filter((m) => cart[m.id] > 0)
      .reduce((sum, m) => sum + m.price * cart[m.id], 0);
  },

  getCartItemCount: () => {
    return Object.values(get().cart).reduce((a, b) => a + b, 0);
  },

}));

export default useAppStore;