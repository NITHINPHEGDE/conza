import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

import { socket, connectSocket } from '../utils/socket';

export const EMPTY_ARRAY = [];
const EMPTY_OBJ   = {};

const useAppStore = create((set, get) => ({

  // ── App init ────────────────────────────────────────────────────────────────
  initialized: false,

  initApp: async () => {
    // 1. Connect Socket
    connectSocket();
    get().initSocketHandlers();

    // 2. Fetch data that doesn't strictly depend on location first
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

    // 4. Check for active booking in storage
    const activeId = await AsyncStorage.getItem('activeBookingId');
    if (activeId) {
      set({ activeBookingId: activeId });
      get().fetchActiveBooking(activeId);
    }

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
      set({ labourCategories: data.categories || EMPTY_ARRAY });
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
        radius: 50000,
      });
      set((state) => ({
        workersByCategory: { ...state.workersByCategory, [category]: data.workers || EMPTY_ARRAY },
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

  // ── Materials (fetched from vendor backend via customer backend proxy) ─────────
  materials:       [],
  materialsLoading: false,
  materialsError:  null,

  fetchMaterials: async () => {
    try {
      set({ materialsLoading: true, materialsError: null });
      const BASE_URL = 'http://10.239.242.155:5000/api';
      const res = await fetch(`${BASE_URL}/products/public?type=material&limit=100`);
      const data = await res.json();

      if (data.success && data.products?.length) {
        const normalized = data.products.map((p) => ({
          id:          p._id?.toString() || p.id,
          name:        p.title,
          price:       p.price,
          seller:      p.seller?.shopName || p.seller?.name || 'Vendor',
          unit:        `per ${p.unit || 'piece'}`,
          distance:    '—',
          image:       p.images?.[0] || null,
          inStock:     (p.stock > 0) && p.isAvailable,
          rating:      4.5,
          returnable:  false,
          replaceable: false,
          returnPolicy: 'Contact seller for return policy.',
          replacementPolicy: 'Contact seller for replacement policy.',
          // extra fields for cart/checkout
          sellerId:    p.seller?._id?.toString(),
          sellerPhone: p.seller?.phone,
          sellerCity:  p.seller?.city,
          category:    p.category,
          brand:       p.brand || '',
          description: p.description || '',
        }));
        set({ materials: normalized });
      } else {
        // Fall back to dummy data if no real products yet
        set({ materials: dummyMaterials });
      }
    } catch (err) {
      console.warn('[Materials] API error, falling back to dummy:', err.message);
      set({ materials: dummyMaterials, materialsError: null });
    } finally {
      set({ materialsLoading: false });
    }
  },

  searchMaterials: (query) => {
    if (!query || query.trim() === '') return get().materials;
    const q = query.toLowerCase();
    return get().materials.filter(
      (m) =>
        (m.name  || '').toLowerCase().includes(q) ||
        (m.seller|| '').toLowerCase().includes(q) ||
        (m.category || '').toLowerCase().includes(q)
    );
  },

  // ── Rental (fetched from vendor backend via customer backend proxy) ──────────
  rentalItems:      [],
  rentalCategories: [],
  rentalLoading:    false,
  rentalError:      null,

  fetchRentalData: async () => {
    try {
      set({ rentalLoading: true, rentalError: null });
      const BASE_URL = 'http://10.239.242.155:5000/api';
      const res = await fetch(`${BASE_URL}/products/public?type=rental&limit=100`);
      const data = await res.json();

      if (data.success && data.products?.length) {
        const normalized = data.products.map((p) => ({
          id:          p._id?.toString() || p.id,
          name:        p.title,
          category:    (p.category || 'Other').toLowerCase().replace(/\s+/g, '_'),
          emoji:       '🏗️',
          pricePerDay: p.rentalPrice || p.price,
          distance:    '—',
          image:       p.images?.[0] || null,
          available:   p.isAvailable && (p.stock > 0),
          rating:      4.5,
          seller:      p.seller?.shopName || p.seller?.name || 'Vendor',
          sellerId:    p.seller?._id?.toString(),
          sellerPhone: p.seller?.phone,
          sellerCity:  p.seller?.city,
          description: p.description || '',
          deposit:     p.deposit || 0,
          minDays:     p.minRentalDays || 1,
          features:    [],
          specs:       [],
        }));

        // Build dynamic category list from returned products
        const catSet = new Set(normalized.map((i) => i.category));
        const categories = [
          { id: 'all', label: 'All', emoji: '🏗️' },
          ...Array.from(catSet).map((c) => ({
            id:    c,
            label: c.charAt(0).toUpperCase() + c.slice(1).replace(/_/g, ' '),
            emoji: '📦',
          })),
        ];

        set({ rentalItems: normalized, rentalCategories: categories });
      } else {
        // Fall back to dummy data
        set({ rentalItems: dummyRentalItems, rentalCategories: dummyRentalCategories });
      }
    } catch (err) {
      console.warn('[Rentals] API error, falling back to dummy:', err.message);
      set({ rentalItems: dummyRentalItems, rentalCategories: dummyRentalCategories, rentalError: null });
    } finally {
      set({ rentalLoading: false });
    }
  },

  filterRentalItems: (category = 'all', query = '') => {
    return get().rentalItems.filter((item) => {
      const matchCat   = category === 'all' || item.category === category;
      const matchQuery = query.trim() === '' ||
        (item.name   || '').toLowerCase().includes(query.toLowerCase()) ||
        (item.seller || '').toLowerCase().includes(query.toLowerCase());
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
        progress:  b.status === 'completed' ? 100 : b.status === 'in_progress' ? 60 : b.status === 'accepted' ? 40 : b.status === 'arrived' ? 70 : 10,
        location:  `${b.city}`,
        startDate: new Date(b.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        eta:       '—',
        workers:   b.workers?.length || 0,
        statusColor:
  b.status === 'completed'   ? '#6366F1' :
  b.status === 'in_progress' ? '#F97316' :
  b.status === 'arrived'     ? '#3B82F6' :
  b.status === 'accepted'    ? '#22C55E' : '#94A3B8',
      }));
      set({ projects });
    } catch {
      // Not logged in — fall back to dummy
      set({ projects: dummyProjects });
    } finally {
      set({ projectsLoading: false });
    }
  },

  // ── Active Booking Tracking ────────────────────────────────────────────────
  // ── Active Booking Tracking ────────────────────────────────────────────────
  activeBookingId: null,
  activeBooking:   null,

  // ── All Active Bookings (for Status tab list) ──────────────────────────────
  activeBookings:        [],
  activeBookingsLoading: false,

  fetchActiveBookings: async () => {
    try {
      set({ activeBookingsLoading: true });
      const data = await bookingAPI.getMyBookings();
      const active = (data.bookings || []).filter(
        (b) => !['completed', 'cancelled'].includes(b.status)
      );
      set({ activeBookings: active });
    } catch (err) {
      console.error('fetchActiveBookings error:', err.message);
    } finally {
      set({ activeBookingsLoading: false });
    }
  },

  setActiveBookingId: async (id) => {
    if (id) {
      await AsyncStorage.setItem('activeBookingId', id);
    } else {
      await AsyncStorage.removeItem('activeBookingId');
    }
    set({ activeBookingId: id, activeBooking: id ? get().activeBooking : null });
    if (id) get().fetchActiveBooking(id);
  },

  fetchActiveBooking: async (id) => {
    const bookingId = id || get().activeBookingId;
    if (!bookingId) return;

    try {
      const data = await bookingAPI.getBookingById(bookingId);
      if (data.success) {
        set({ activeBooking: data.booking });
        // Join socket room for this booking
        socket.emit('join_booking', bookingId);
      }
    } catch (err) {
      console.error('Failed to fetch active booking:', err.message);
    }
  },

  // Replace cancelActiveBooking in useAppStore.js (store/useAppStore.js):
cancelActiveBooking: async () => {
  const id = get().activeBookingId;
  if (!id) return;
  try {
    await bookingAPI.cancelBooking(id);
    // Await so the UI re-renders with status: 'cancelled' before returning
    await get().fetchActiveBooking(id);
  } catch (err) {
    throw new Error(err.message); // Let the screen show the Alert
  }
},

  clearActiveBooking: async () => {
    await AsyncStorage.removeItem('activeBookingId');
    set({ activeBookingId: null, activeBooking: null });
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

  // ── Seller Orders (material + rental) ───────────────────────────────────
  sellerOrders:        [],
  sellerOrdersLoading: false,

  addSellerOrder: (order) => {
    set((s) => ({ sellerOrders: [order, ...s.sellerOrders] }));
  },

  fetchMySellerOrders: async () => {
    try {
      set({ sellerOrdersLoading: true });
      const data = await bookingAPI.getMySellerOrders();
      set({ sellerOrders: data.orders || [] });
    } catch (err) {
      console.error('fetchMySellerOrders:', err.message);
    } finally {
      set({ sellerOrdersLoading: false });
    }
  },

  initSocketHandlers: () => {
    socket.off('booking_updated');
    socket.off('booking_status_changed');
    socket.off('worker_updated');

    socket.on('booking_updated', (data) => {
      console.log('🔄 Booking update received:', data);
      get().fetchProjects();
      get().fetchActiveBookings();
      if (get().activeBookingId === data.bookingId) {
        get().fetchActiveBooking(data.bookingId);
      }
    });

    socket.on('booking_status_changed', (data) => {
      console.log('🔄 Booking status changed:', data.status);
      if (get().activeBookingId === data.bookingId) {
        get().fetchActiveBooking(data.bookingId);
      }
    });

    socket.on('worker_updated', (data) => {
      console.log('🔄 Worker updated:', data.workerId);
      get().fetchLabourData();
      if (data.fullDocument?.category) {
        get().fetchWorkersByCategory(data.fullDocument.category);
      }
    });
    socket.on('seller_order_status_changed', ({ orderId, status }) => {
      set((s) => ({
        sellerOrders: s.sellerOrders.map((o) =>
          o._id === orderId || o._id?.toString() === orderId
            ? { ...o, status }
            : o
        ),
      }));
    });
  },
}));

export default useAppStore;