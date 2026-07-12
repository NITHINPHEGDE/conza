import { create } from 'zustand'
import dashboardService from '../../services/dashboardService'
import {
  mockDashboardStats, mockRecentRegistrations, mockRecentComplaints, mockRecentOrders,
  mockRecentBookings, mockTopWorkers, mockTopVendors, mockLowStockAlerts, mockPendingVerifications,
  mockRevenueData, mockBookingData, mockUserGrowthData, mockVendorGrowthData, mockServiceData,
} from '../../mock/dashboard'

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
  revenueData: mockRevenueData,
  bookingData: mockBookingData,
  userGrowthData: mockUserGrowthData,
  vendorGrowthData: mockVendorGrowthData,
  serviceData: mockServiceData,
  loading: false,
  error: null,
  lastUpdated: null,

  setStats: (stats) => set({ stats }),

  fetchDashboard: async () => {
    set({ loading: true, error: null })
    try {
      const [statsRes, recentRes, chartsRes] = await Promise.all([
        dashboardService.getStats(),
        dashboardService.getRecent(),
        dashboardService.getCharts(),
      ])

      const next = { loading: false, lastUpdated: new Date().toISOString() }

      if (statsRes.success) next.stats = statsRes.stats

      if (recentRes.success) {
        next.recentRegistrations  = recentRes.recentRegistrations
        next.recentComplaints     = recentRes.recentComplaints
        next.recentOrders         = recentRes.recentOrders
        next.recentBookings       = recentRes.recentBookings
        next.topWorkers           = recentRes.topWorkers
        next.topVendors           = recentRes.topVendors
        next.lowStockAlerts       = recentRes.lowStockAlerts
        next.pendingVerifications = recentRes.pendingVerifications
      }

      if (chartsRes.success) {
        next.revenueData      = chartsRes.revenueData
        next.bookingData      = chartsRes.bookingData
        next.userGrowthData   = chartsRes.userGrowthData
        next.vendorGrowthData = chartsRes.vendorGrowthData
        next.serviceData      = chartsRes.serviceData
      }

      if (!statsRes.success && !recentRes.success && !chartsRes.success) {
        next.error = 'Failed to load dashboard data'
      }

      set(next)
    } catch (err) {
      set({ loading: false, error: 'Failed to load dashboard data' })
    }
  },
}))

export default useDashboardStore
