// conzavf/src/store/useVendorStore.js
import { create }       from 'zustand';
import AsyncStorage     from '@react-native-async-storage/async-storage';
import { api }          from '../services/apiClient';
import { socket, connectSocket } from '../utils/socket';

const useVendorStore = create((set, get) => ({
  // ── Auth ─────────────────────────────────────────────────────────────────
  seller:      null,
  authLoading: false,
  authError:   null,

  setSeller: (seller) => {
    set({ seller });
    if (seller) connectSocket(seller._id);
  },

  clearSeller: () => {
    set({ seller: null });
    socket.disconnect();
  },

  // ── Vendor alias (kept for backwards-compat with existing UI) ────────────
  get vendor() {
    const s = get().seller;
    return {
      name:          s?.name          || '',
      shopName:      s?.shopName      || '',
      walletBalance: s?.walletBalance || 0,
      monthEarnings: get().dashData?.vendor?.monthEarnings || 0,
      growth:        get().dashData?.vendor?.growth        || '+0%',
    };
  },

  // ── Dashboard ────────────────────────────────────────────────────────────
  dashData:    null,
  dashLoading: false,

  kpi: {
    newOrders:       0,
    pendingDelivery: 0,
    activeListings:  0,
    lowStockItems:   0,
  },

  chartData: { day: [0,0,0,0,0,0,0], week: [0,0,0,0,0,0,0], month: [0,0,0,0,0,0,0] },

  fetchDashboard: async () => {
    set({ dashLoading: true });
    try {
      const data = await api.get('/dashboard');
      const chart = data.chartData || [];

      // Build a 7-slot array from the returned chart data
      const dayTotals = Array(7).fill(0);
      chart.forEach((entry, i) => {
        if (i < 7) {
          dayTotals[i] = (entry && typeof entry === 'object' && 'total' in entry) ? entry.total : (entry || 0);
        }
      });

      set({
        dashData: data,
        kpi: {
          newOrders:       data.kpi?.newOrders      || 0,
          pendingDelivery: data.kpi?.activeRentals  || 0,
          activeListings:  data.kpi?.totalProducts  || 0,
          lowStockItems:   data.kpi?.lowStockItems  || 0,
        },
        chartData: { day: dayTotals, week: dayTotals, month: dayTotals },
      });
    } catch (err) {
      console.warn('[Dashboard] fetch error:', err.message);
    } finally {
      set({ dashLoading: false });
    }
  },

  // ── Orders ───────────────────────────────────────────────────────────────
  materialOrders: [],
  rentalOrders:   [],
  ordersLoading:  false,
  ordersError:    null,

  fetchOrders: async (mode) => {
    const type = mode === 'materials' ? 'material' : 'rental';
    set({ ordersLoading: true, ordersError: null });
    try {
      const data = await api.get(`/orders?type=${type}&limit=50`);
      const normalized = (data.orders || []).map(normalizeOrder);
      if (type === 'material') set({ materialOrders: normalized });
      else                     set({ rentalOrders:   normalized });
    } catch (err) {
      set({ ordersError: err.message });
    } finally {
      set({ ordersLoading: false });
    }
  },

  updateOrderStatus: async (orderId, status) => {
    try {
      const data = await api.patch(`/orders/${orderId}/status`, { status });
      const updated = normalizeOrder(data.order);
      set((state) => ({
        materialOrders: state.materialOrders.map((o) => o.id === orderId ? updated : o),
        rentalOrders:   state.rentalOrders.map((o)   => o.id === orderId ? updated : o),
      }));
    } catch (err) {
      throw err;
    }
  },

  getFilteredOrders: (mode) => {
    return mode === 'materials' ? get().materialOrders : get().rentalOrders;
  },

  // ── Inventory ─────────────────────────────────────────────────────────────
  inventory:        [],
  inventoryLoading: false,
  inventoryError:   null,
  inventoryPage:    1,
  inventoryPages:   1,

  fetchInventory: async (mode, page = 1) => {
    const type = mode === 'materials' ? 'material' : 'rental';
    set({ inventoryLoading: true, inventoryError: null });
    try {
      const data = await api.get(`/products?type=${type}&page=${page}&limit=20`);
      const normalized = (data.products || []).map(normalizeProduct);
      set({
        inventory:        page === 1 ? normalized : [...get().inventory, ...normalized],
        inventoryPage:    data.page,
        inventoryPages:   data.pages,
      });
    } catch (err) {
      set({ inventoryError: err.message });
    } finally {
      set({ inventoryLoading: false });
    }
  },

  addProduct: async (payload) => {
    const data = await api.post('/products', payload);
    const product = normalizeProduct(data.product);
    set((s) => ({ inventory: [product, ...s.inventory] }));
    return product;
  },

  updateProduct: async (productId, payload) => {
    const data = await api.put(`/products/${productId}`, payload);
    const updated = normalizeProduct(data.product);
    set((s) => ({
      inventory: s.inventory.map((p) => (p.id === productId ? updated : p)),
    }));
    return updated;
  },

  deleteProduct: async (productId) => {
    const originalInventory = get().inventory;
    // Optimistically update the state instantly
    set((s) => ({ inventory: s.inventory.filter((p) => p.id !== productId) }));

    try {
      await api.delete(`/products/${productId}`);
    } catch (err) {
      // Rollback to original state if API call fails
      set({ inventory: originalInventory });
      throw err;
    }
  },

  toggleProductAvailability: async (productId) => {
    // Optimistic update — flip immediately so UI responds instantly
    set((s) => ({
      inventory: s.inventory.map((p) =>
        p.id === productId ? { ...p, active: !p.active } : p
      ),
    }));
    try {
      const data = await api.patch(`/products/${productId}/availability`, {});
      // Sync with server truth in case it differs
      set((s) => ({
        inventory: s.inventory.map((p) =>
          p.id === productId ? { ...p, active: data.isAvailable } : p
        ),
      }));
    } catch (err) {
      // Rollback on failure
      set((s) => ({
        inventory: s.inventory.map((p) =>
          p.id === productId ? { ...p, active: !p.active } : p
        ),
      }));
      throw err;
    }
  },

  getFilteredInventory: (mode) => {
    const type = mode === 'materials' ? 'material' : 'rental';
    return get().inventory.filter((i) => i.type === type);
  },

  // ── Socket listeners ──────────────────────────────────────────────────────
  // ── Socket listeners ──────────────────────────────────────────────────────
  initSocketListeners: () => {
    socket.off('new_order');
    socket.off('order_updated');
    socket.off('order_change');
    socket.off('product_change');

    const refreshOrders = () => {
      get().fetchOrders('materials');
      get().fetchOrders('rental');
    };

    const refreshAll = () => {
      refreshOrders();
      get().fetchDashboard();
    };

    socket.on('new_order', ({ orderId, orderType }) => {
      const mode = orderType === 'material' ? 'materials' : 'rental';
      get().fetchOrders(mode);
      get().fetchDashboard();
    });

    socket.on('order_updated', () => {
      refreshAll();
    });

    socket.on('order_change', () => {
      refreshAll();
    });

    socket.on('product_change', () => {
      get().fetchInventory('materials');
      get().fetchInventory('rental');
    });
  },

  // ── Earnings filter ──────────────────────────────────────────────────────
  earningsFilter:    'week',
  setEarningsFilter: (filter) => set({ earningsFilter: filter }),
}));

// ── Normalizers ──────────────────────────────────────────────────────────────
const normalizeOrder = (o) => ({
  id:              o._id?.toString() || o.id,
  customerName:    o.customerName    || '',
  customerPhone:   o.customerPhone   || '',
  customerAddress: o.customerAddress || '',
  city:            o.city            || '',
  pincode:         o.pincode         || '',
  date:   o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '',
  time:   o.createdAt ? new Date(o.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '',
  status:          o.status          || 'new',
  paymentStatus:   o.paymentStatus   || 'pending',
  paymentMethod:   o.paymentMethod?.toUpperCase() || 'COD',
  type:            o.orderType       || 'material',
  subtotal:        o.subtotal        || 0,
  deliveryCharge:  o.deliveryCharge  || 0,
  total:           o.total           || 0,
  depositAmount:   o.depositAmount   || 0,
  depositStatus:   o.depositStatus   || 'pending',
  startDate:       o.startDate       || null,
  endDate:         o.endDate         || null,
  durationDays:    o.durationDays    || null,
  items:  (o.items || []).map((i) => ({
    id:       i._id || i.product,
    name:     i.title,
    qty:      i.qty,
    price:    i.price,
    unit:     i.unit,
    days:     i.days,
    deposit:  i.deposit || 0,
    pricePerDay: i.price,
  })),
});

const normalizeProduct = (p) => ({
  id:          p._id?.toString() || p.id,
  name:        p.title,
  brand:       p.brand          || '',
  image:       p.images?.[0]    || null,
  images:      p.images         || [],
  price:       p.price,
  unit:        p.unit,
  stock:       p.stock,
  sold:        p.sold           || 0,
  sku:         p.sku            || '',
  category:    p.category,
  type:        p.type,
  active:      p.isAvailable,
  lowStock:    p.stock <= (p.lowStockAt || 5),
  description: p.description    || '',
  deposit:     p.deposit        || 0,
  minRentalDays: p.minRentalDays || 1,
  rentalPrice: p.rentalPrice    || p.price,
});

export default useVendorStore;