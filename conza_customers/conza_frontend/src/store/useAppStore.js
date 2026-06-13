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
import api from '../api/axiosInstance';

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

    // Guarantee join_customer after both socket and profile are ready
    const userId = get().userProfile?._id;
    if (userId) {
      socket.emit('join_customer', userId.toString());
    }

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
    // Join the customer-specific socket room so the backend can target
    // booking_updated events directly to this user (customer_{userId})
    if (user?._id) {
      socket.emit('join_customer', user._id.toString());
    }
  },

  fetchUserProfile: async () => {
    try {
      set({ profileLoading: true });
      const data = await authAPI.getMe();
      get().setUserProfile(data.user);  // routes through setUserProfile so join_customer fires
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
  labourLoading:     true,  // true by default so skeleton shows immediately on first render
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
      const res  = await api.get('/products/public?type=material&limit=100');
      const data = res.data;

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
      const res  = await api.get('/products/public?type=rental&limit=100');
const data = res.data;
      

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
        progress:  b.status === 'completed' ? 100 : b.status === 'awaiting_customer_confirmation' ? 90 : b.status === 'in_progress' ? 60 : b.status === 'accepted' ? 40 : b.status === 'arrived' ? 70 : 10,
        location:  `${b.city}`,
        startDate: new Date(b.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        eta:       '—',
        workers:   b.workers?.length || 0,
        statusColor:
  b.status === 'completed'   ? '#6366F1' :
  b.status === 'awaiting_customer_confirmation' ? '#F59E0B' :
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

  cancelActiveBooking: async () => {
    const id = get().activeBookingId;
    if (!id) return;
    try {
      await bookingAPI.cancelBooking(id);
      await get().fetchActiveBooking(id);
    } catch (err) {
      throw new Error(err.message);
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
    // Remove all existing listeners before re-registering to prevent duplicates
    socket.off('booking_updated');
    socket.off('booking_status_changed');
    socket.off('work_completion_requested');
    socket.off('worker_updated');
    socket.off('worker_availability_changed');
    socket.off('worker_went_offline');
    socket.off('connect');

    // ── Worker availability: real-time add/remove from list ────────────────
    socket.on('worker_availability_changed', (data) => {
      const { workerId, isOnline, isAvailable, category, worker } = data;

      // Only act if availability is meaningful (worker is visible or just hid)
      if (!category) return;

      set((state) => {
        const current = state.workersByCategory[category] || EMPTY_ARRAY;

        if (isOnline && isAvailable !== false && worker) {
          // Worker came online — add to list if not already present
          const alreadyPresent = current.some(
            (w) => w._id?.toString() === workerId || w.id?.toString() === workerId
          );
          if (alreadyPresent) {
            // Update existing entry (e.g. profile image changed)
            return {
              workersByCategory: {
                ...state.workersByCategory,
                [category]: current.map((w) =>
                  w._id?.toString() === workerId || w.id?.toString() === workerId
                    ? { ...w, ...worker, available: true, isOnline: true }
                    : w
                ),
              },
            };
          }
          // Append to list; distance is unknown from server without location —
          // the entry still shows with the locationText placeholder from the payload.
          return {
            workersByCategory: {
              ...state.workersByCategory,
              [category]: [...current, { ...worker, available: true, isOnline: true }],
            },
          };
        } else {
          // Worker went offline or became unavailable — remove from list
          return {
            workersByCategory: {
              ...state.workersByCategory,
              [category]: current.filter(
                (w) => w._id?.toString() !== workerId && w.id?.toString() !== workerId
              ),
            },
          };
        }
      });

      // Also refresh category counts (the bubble numbers on the home screen)
      get().fetchLabourData();
    });

    // Explicit offline event — immediate removal without waiting for field check
    socket.on('worker_went_offline', ({ workerId, category }) => {
      if (!category) return;
      set((state) => {
        const current = state.workersByCategory[category] || EMPTY_ARRAY;
        return {
          workersByCategory: {
            ...state.workersByCategory,
            [category]: current.filter(
              (w) => w._id?.toString() !== workerId && w.id?.toString() !== workerId
            ),
          },
        };
      });
    });

    // ── Legacy worker_updated (kept for backwards compatibility) ────────────
    socket.on('worker_updated', (data) => {
      // Only used as a fallback; precise updates are handled by
      // worker_availability_changed and worker_went_offline above.
      // Refresh category counts in case a worker's profile changed.
      get().fetchLabourData();
    });

    socket.on('booking_updated', (data) => {
      // Optimistically update status in the activeBookings list for instant UI
      if (data.bookingId && data.status) {
        set((s) => ({
          activeBookings: s.activeBookings.map((b) =>
            b._id?.toString() === data.bookingId?.toString()
              ? { ...b, status: data.status }
              : b
          ),
        }));
      }
      get().fetchProjects();
      get().fetchActiveBookings();
      if (get().activeBookingId === data.bookingId) {
        get().fetchActiveBooking(data.bookingId);
      }
    });

    socket.on('booking_status_changed', (data) => {
      // Optimistically update status in the activeBookings list for instant UI
      if (data.bookingId && data.status) {
        set((s) => ({
          activeBookings: s.activeBookings.map((b) =>
            b._id?.toString() === data.bookingId?.toString()
              ? { ...b, status: data.status }
              : b
          ),
          // Also update activeBooking detail if it matches
          activeBooking:
            s.activeBooking?._id?.toString() === data.bookingId?.toString()
              ? { ...s.activeBooking, status: data.status }
              : s.activeBooking,
        }));
      }
      if (get().activeBookingId === data.bookingId) {
        get().fetchActiveBooking(data.bookingId);
      }
    });

    // BP backend emits this when worker marks work done (awaiting_customer_confirmation)
    socket.on('work_completion_requested', (data) => {
      if (data.bookingId && get().activeBookingId === data.bookingId) {
        get().fetchActiveBooking(data.bookingId);
      }
      // Also update list optimistically
      if (data.bookingId) {
        set((s) => ({
          activeBookings: s.activeBookings.map((b) =>
            b._id?.toString() === data.bookingId?.toString()
              ? { ...b, status: 'awaiting_customer_confirmation' }
              : b
          ),
        }));
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

    // Re-join workers_watch_room after reconnect so change-stream events keep flowing
    socket.on('connect', () => {
      socket.emit('join_workers_watch');
      // Re-join customer room on reconnect to restore targeted booking events
      const userId = get().userProfile?._id;
      if (userId) {
        socket.emit('join_customer', userId.toString());
      }
      // Re-join active booking room on reconnect
      const activeBookingId = get().activeBookingId;
      if (activeBookingId) {
        socket.emit('join_booking', activeBookingId);
      }
    });

    // Join on initial connect as well (in case connect fired before handlers were set)
    if (socket.connected) {
      socket.emit('join_workers_watch');
      const userId = get().userProfile?._id;
      if (userId) {
        socket.emit('join_customer', userId.toString());
      }
      const activeBookingId = get().activeBookingId;
      if (activeBookingId) {
        socket.emit('join_booking', activeBookingId);
      }
    }
  },
}));

export default useAppStore;