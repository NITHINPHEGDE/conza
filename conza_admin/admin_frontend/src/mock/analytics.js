export const mockUserAnalytics = {
  newUsersDaily: [45, 52, 38, 61, 55, 48, 42],
  activeUsersDaily: [1200, 1350, 1280, 1420, 1380, 1450, 1400],
  retentionRate: 68,
  churnRate: 12,
  topCities: [
    { city: 'Bangalore', users: 5200 },
    { city: 'Hyderabad', users: 2100 },
    { city: 'Chennai', users: 1800 },
    { city: 'Mumbai', users: 1500 },
    { city: 'Pune', users: 1200 },
  ],
}

export const mockRevenueAnalytics = {
  dailyRevenue: [180000, 220000, 195000, 245000, 280000, 310000, 268000],
  weeklyRevenue: [1250000, 1380000, 1420000, 1560000, 1720000],
  monthlyRevenue: [5200000, 5800000, 6200000, 6900000, 7380000],
  revenueByCategory: [
    { category: 'Labour', revenue: 3690000 },
    { category: 'Materials', revenue: 2214000 },
    { category: 'Rentals', revenue: 738000 },
    { category: 'Platform Fee', revenue: 738000 },
  ],
}

export const mockBookingAnalytics = {
  totalBookings: 1256,
  completionRate: 78,
  cancellationRate: 8,
  avgResponseTime: 4.2,
  bookingsByCategory: [
    { category: 'Plumber', count: 342 },
    { category: 'Electrician', count: 298 },
    { category: 'Carpenter', count: 245 },
    { category: 'Mason', count: 198 },
    { category: 'Painter', count: 156 },
    { category: 'Builder', count: 17 },
  ],
  bookingsByHour: Array.from({ length: 24 }, (_, i) => ({
    hour: `${i}:00`,
    count: Math.floor(Math.random() * 50) + 5,
  })),
}

export const mockVendorAnalytics = {
  totalVendors: 1370,
  activeVendors: 1124,
  avgOrderValue: 3200,
  topCategories: [
    { category: 'Cement', orders: 450 },
    { category: 'Steel', orders: 380 },
    { category: 'Blocks', orders: 290 },
    { category: 'Sand', orders: 210 },
    { category: 'Paint', orders: 180 },
  ],
  vendorGrowth: [
    { month: 'Jan', count: 120 },
    { month: 'Feb', count: 145 },
    { month: 'Mar', count: 180 },
    { month: 'Apr', count: 210 },
    { month: 'May', count: 250 },
    { month: 'Jun', count: 290 },
  ],
}

export const mockConversionAnalytics = {
  visitorToSignup: 23,
  signupToBooking: 45,
  bookingToCompletion: 78,
  cartToOrder: 62,
  funnel: [
    { stage: 'Visitors', count: 50000 },
    { stage: 'Signups', count: 11500 },
    { stage: 'Bookings', count: 5175 },
    { stage: 'Completed', count: 4037 },
  ],
}
