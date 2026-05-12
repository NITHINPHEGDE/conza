import { create } from 'zustand';
import {
  materials        as dummyMaterials,
  rentalItems      as dummyRentalItems,
  rentalCategories as dummyRentalCategories,
  projects         as dummyProjects,
} from '../data/dummyData';

import * as Location from 'expo-location';
import { workerAPI  } from '../api/workerAPI';
import { bookingAPI } from '../api/bookingAPI';
import { authAPI    } from '../api/authAPI';

const EMPTY_ARRAY = [];
const EMPTY_OBJ   = {};

const useAppStore = create((set, get) => ({

  // ── App init ────────────────────────────────────────────────────────────────
  initialized: false,

  initApp: async () => {
    // 1. Fetch data that doesn't strictly depend on location first
    await Promise.all([
      get().fetchMaterials(),
      get().fetchRentalData(),
      get().fetchUserProfile(),
    ]);

    // 2. If no location from profile, try to get from device
    const profile = get().userProfile;
    if (!profile?.location?.coordinates) {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          
          let locationText = '';
          try {
            const [place] = await Location.reverseGeocodeAsync({
              latitude: pos.coords.latitude, longitude: pos.coords.longitude,
            });
            locationText = [place.city, place.region].filter(Boolean).join(', ');
          } catch {
            const data = await authAPI.reverseGeocode(pos.coords.latitude, pos.coords.longitude);
            locationText = data.locationText;
          }

          get().setUserLocation({
            latitude:  pos.coords.latitude,
            longitude: pos.coords.longitude,
            locationText,
          });
        }
      } catch (e) {
        console.warn("Could not auto-fetch location:", e.message);
      }
    }

    // 3. Finally fetch labour data (which needs lat/lng)
    await get().fetchLabourData();

    set({ initialized: true });
  },

  // ── User / Auth ─────────────────────────────────────────────────────────────
  userProfile:    null,
  profileLoading: false,

  setUserProfile: (user) => {
    const newState = { userProfile: user };
    if (user?.location?.coordinates) {
      const [lng, lat] = user.location.coordinates;
      newState.userLat = lat;
      newState.userLng = lng;
      newState.userLocationText = user.locationText || '';
    }
    set(newState);
  },

  fetchUserProfile: async () => {
    try {
      set({ profileLoading: true });
      const data = await authAPI.getMe();
      set({ userProfile: data.user });
    } catch {
      // Not logged in — ignore
    } finally {
      set({ profileLoading: false });
    }
  },

  // ── Location ────────────────────────────────────────────────────────────────
  userLat: null,
  userLng: null,
  userLocationText: '',

  setUserLocation: ({ latitude, longitude, locationText }) => {
    set({ userLat: latitude, userLng: longitude, userLocationText: locationText || '' });
  },

  // ── Labour / Workers ────────────────────────────────────────────────────────
  labourCategories:  [],
  workersByCategory: {},
  allWorkers:        [],
  labourLoading:     false,
  labourError:       null,

  fetchLabourData: async () => {
    const { userLat, userLng } = get();
    try {
      set({ labourLoading: true, labourError: null });
      const data = await workerAPI.getCategories({ lat: userLat, lng: userLng });
      set({ labourCategories: data.categories || [] });
    } catch (err) {
      set({ labourError: err.message });
    } finally {
      set({ labourLoading: false });
    }
  },

  fetchWorkersByCategory: async (category) => {
    const { userLat, userLng } = get();
    try {
      set({ labourLoading: true, labourError: null });
      const data = await workerAPI.getNearbyWorkers({
        category,
        lat:    userLat,
        lng:    userLng,
        radius: 5000,
      });
      set((state) => ({
        workersByCategory: { ...state.workersByCategory, [category]: data.workers || [] },
        allWorkers:        [...(get().allWorkers), ...(data.workers || [])],
      }));
    } catch (err) {
      set({ labourError: err.message });
    } finally {
      set({ labourLoading: false });
    }
  },

  getWorkersByCategory: (category) => get().workersByCategory[category] || EMPTY_ARRAY,

  searchWorkers: async (query) => {
    const { userLat, userLng } = get();
    if (!query || query.trim() === '') return [];
    try {
      const data = await workerAPI.searchWorkers({ q: query, lat: userLat, lng: userLng });
      return data.workers || [];
    } catch {
      return EMPTY_ARRAY;
    }
  },

  // ── Materials (still dummy — backend for materials not built yet) ───────────
  materials:       [],
  materialsLoading: false,
  materialsError:  null,

  fetchMaterials: async () => {
    try {
      set({ materialsLoading: true });
      set({ materials: dummyMaterials });
    } catch (err) {
      set({ materialsError: err.message });
    } finally {
      set({ materialsLoading: false });
    }
  },

  searchMaterials: (query) => {
    if (!query || query.trim() === '') return get().materials;
    const q = query.toLowerCase();
    return get().materials.filter(
      (m) => m.name.toLowerCase().includes(q) || m.seller.toLowerCase().includes(q)
    );
  },

  // ── Rental (still dummy) ────────────────────────────────────────────────────
  rentalItems:      [],
  rentalCategories: [],
  rentalLoading:    false,
  rentalError:      null,

  fetchRentalData: async () => {
    try {
      set({ rentalLoading: true });
      set({ rentalItems: dummyRentalItems, rentalCategories: dummyRentalCategories });
    } catch (err) {
      set({ rentalError: err.message });
    } finally {
      set({ rentalLoading: false });
    }
  },

  filterRentalItems: (category = 'all', query = '') => {
    return get().rentalItems.filter((item) => {
      const matchCat   = category === 'all' || item.category === category;
      const matchQuery = query.trim() === '' ||
        item.name.toLowerCase().includes(query.toLowerCase()) ||
        item.seller.toLowerCase().includes(query.toLowerCase());
      return matchCat && matchQuery;
    });
  },

  // ── Projects / Bookings ─────────────────────────────────────────────────────
  projects:        [],
  projectsLoading: false,

  fetchProjects: async () => {
    try {
      set({ projectsLoading: true });
      const data = await bookingAPI.getMyBookings();
      // Map bookings → project shape the ProjectScreen expects
      const projects = (data.bookings || []).map((b) => ({
        id:        b._id,
        name:      b.category
          ? `${b.category} Booking`
          : b.bookingType === 'material' ? 'Material Order'
          : b.bookingType === 'rental'   ? 'Equipment Rental'
          : 'Booking',
        status:    b.status.charAt(0).toUpperCase() + b.status.slice(1).replace('_', ' '),
        progress:  b.status === 'completed' ? 100 : b.status === 'in_progress' ? 60 : b.status === 'confirmed' ? 30 : 10,
        location:  `${b.city}`,
        startDate: new Date(b.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        eta:       '—',
        workers:   b.workers?.length || 0,
        statusColor:
          b.status === 'completed'  ? '#6366F1' :
          b.status === 'in_progress'? '#F97316' :
          b.status === 'confirmed'  ? '#22C55E' : '#94A3B8',
      }));
      set({ projects });
    } catch {
      // Not logged in — fall back to dummy
      set({ projects: dummyProjects });
    } finally {
      set({ projectsLoading: false });
    }
  },

  // ── Cart ────────────────────────────────────────────────────────────────────
  cart: {},

  addToCart: (item) => {
    if (item._setQty !== undefined) {
      set((state) => ({ cart: { ...state.cart, [item.id]: item._setQty } }));
    } else {
      set((state) => ({
        cart: { ...state.cart, [item.id]: (Number(state.cart[item.id]) || 0) + 1 },
      }));
    }
  },

  removeFromCart: (item) => {
    set((state) => {
      const current = Number(state.cart[item.id]) || 0;
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
    return materials.filter((m) => (Number(cart[m.id]) || 0) > 0);
  },

  getCartTotal: () => {
    const { cart, materials } = get();
    return materials
      .filter((m) => (Number(cart[m.id]) || 0) > 0)
      .reduce((sum, m) => sum + (Number(m.price) || 0) * (Number(cart[m.id]) || 0), 0);
  },

  getCartItemCount: () =>
    Object.values(get().cart).reduce((a, b) => (Number(a) || 0) + (Number(b) || 0), 0),
}));

export default useAppStore;