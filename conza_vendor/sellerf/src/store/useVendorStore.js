import { create } from 'zustand';

const DUMMY_ORDERS = [
  {
    id: 'ORD001',
    customerName: 'Rajesh Kumar',
    product: 'Portland Cement 50kg',
    amount: 4200,
    quantity: 6,
    status: 'delivered',
    paymentStatus: 'paid',
    type: 'material',
    location: 'Koramangala, Bengaluru',
    date: '16 May, 10:32 AM',
    image: null,
  },
  {
    id: 'ORD002',
    customerName: 'Suresh Nair',
    product: 'Concrete Mixer',
    amount: 1500,
    quantity: 1,
    status: 'pending',
    paymentStatus: 'pending',
    type: 'rental',
    location: 'Whitefield, Bengaluru',
    date: '16 May, 09:15 AM',
    image: null,
  },
  {
    id: 'ORD003',
    customerName: 'Anita Sharma',
    product: 'Steel Rods 12mm',
    amount: 8750,
    quantity: 25,
    status: 'processing',
    paymentStatus: 'paid',
    type: 'material',
    location: 'HSR Layout, Bengaluru',
    date: '15 May, 04:45 PM',
    image: null,
  },
  {
    id: 'ORD004',
    customerName: 'Vijay Reddy',
    product: 'Scaffolding Set',
    amount: 2200,
    quantity: 2,
    status: 'cancelled',
    paymentStatus: 'refunded',
    type: 'rental',
    location: 'Indiranagar, Bengaluru',
    date: '15 May, 01:20 PM',
    image: null,
  },
  {
    id: 'ORD005',
    customerName: 'Meera Pillai',
    product: 'River Sand 1 Ton',
    amount: 3100,
    quantity: 1,
    status: 'processing',
    paymentStatus: 'paid',
    type: 'material',
    location: 'JP Nagar, Bengaluru',
    date: '15 May, 11:05 AM',
    image: null,
  },
];

const DUMMY_INVENTORY = [
  { id: '1', name: 'Portland Cement 50kg', stock: 3, price: 700,  type: 'material', lowStock: true  },
  { id: '2', name: 'Steel Rods 12mm',      stock: 40, price: 350,  type: 'material', lowStock: false },
  { id: '3', name: 'Concrete Mixer',       stock: 2,  price: 1500, type: 'rental',   lowStock: true  },
  { id: '4', name: 'Scaffolding Set',      stock: 5,  price: 2200, type: 'rental',   lowStock: false },
  { id: '5', name: 'River Sand 1 Ton',     stock: 8,  price: 3100, type: 'material', lowStock: false },
];

const DUMMY_CHART = {
  day:   [2, 4, 3, 6, 5, 8, 7],
  week:  [18, 24, 20, 30, 28, 35, 32],
  month: [80, 95, 110, 130, 120, 150, 145],
};

const useVendorStore = create((set, get) => ({
  vendor: {
    name:          'Nithin Hegde',
    shopName:      'Hegde Traders',
    walletBalance: 24500,
    monthEarnings: 68200,
    growth:        '+12%',
  },

  orders:    DUMMY_ORDERS,
  inventory: DUMMY_INVENTORY,
  chartData: DUMMY_CHART,

  kpi: {
    newOrders:       12,
    pendingDelivery:  4,
    activeListings:  18,
    lowStockItems:    3,
  },

  earningsFilter: 'week',
  setEarningsFilter: (filter) => set({ earningsFilter: filter }),

  getFilteredOrders: (mode) => {
    const type = mode === 'materials' ? 'material' : 'rental';
    return get().orders.filter((o) => o.type === type);
  },

  getFilteredInventory: (mode) => {
    const type = mode === 'materials' ? 'material' : 'rental';
    return get().inventory.filter((i) => i.type === type);
  },
}));

export default useVendorStore;