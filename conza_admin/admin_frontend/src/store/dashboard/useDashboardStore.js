import { create } from 'zustand'
import { mockDashboardStats, mockRecentRegistrations, mockRecentComplaints, mockRecentOrders, mockRecentBookings, mockTopWorkers, mockTopVendors, mockLowStockAlerts, mockPendingVerifications } from '../../mock/dashboard'

const useDashboardStore = create((set) => ({
  stats: mockDashboardStats,
  recentRegistrations: mockRecentRegistrations,
  recentComplaints: mockRecentComplaints,
  recentOrders: mockRecentOrders,
  recentBookings: mockRecentBookings,
  topWorkers: mockTopWorkers,
  topVendors: mockTopVendors,
  lowStockAlerts: mockLowStockAlerts,
  pendingVerifications: mockPendingVerifications,
  loading: false,
  setStats: (stats) => set({ stats }),
}))

export default useDashboardStore
