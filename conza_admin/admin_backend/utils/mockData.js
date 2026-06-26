exports.mockDashboardStats = {
  totalUsers: 12458,
  totalCustomers: 8932,
  totalWorkers: 2156,
  activeWorkersOnline: 342,
  totalVendors: 1370,
  activeVendors: 1124,
  suspendedVendors: 46,
  totalBusinessPartners: 89,
  totalBookingsToday: 156,
  completedJobs: 98,
  pendingJobs: 42,
  ordersToday: 203,
  totalMaterialListings: 4567,
  totalRentalListings: 1234,
  revenueToday: 245800,
  revenueThisWeek: 1720600,
  revenueThisMonth: 7380000,
  platformCommissionEarned: 738000,
}

exports.mockRecentRegistrations = [
  { id: '1', type: 'customer', name: 'Rahul Sharma', phone: '+91 9876543210', date: '2024-06-20T10:30:00Z', status: 'active' },
  { id: '2', type: 'worker', name: 'Suresh Kumar', phone: '+91 9876543211', date: '2024-06-20T09:15:00Z', status: 'pending_verification' },
  { id: '3', type: 'vendor', name: 'BuildMart Pro', phone: '+91 9876543212', date: '2024-06-20T08:45:00Z', status: 'pending_verification' },
  { id: '4', type: 'customer', name: 'Priya Patel', phone: '+91 9876543213', date: '2024-06-19T18:20:00Z', status: 'active' },
  { id: '5', type: 'worker', name: 'Amit Singh', phone: '+91 9876543214', date: '2024-06-19T16:00:00Z', status: 'active' },
]

exports.mockRecentComplaints = [
  { id: 'C001', user: 'Rahul Sharma', type: 'booking', subject: 'Worker did not arrive', status: 'open', priority: 'high', date: '2024-06-20T11:00:00Z' },
  { id: 'C002', user: 'BuildMart Pro', type: 'payment', subject: 'Payout delayed', status: 'in_progress', priority: 'medium', date: '2024-06-20T10:00:00Z' },
  { id: 'C003', user: 'Priya Patel', type: 'order', subject: 'Wrong item delivered', status: 'open', priority: 'high', date: '2024-06-19T20:00:00Z' },
  { id: 'C004', user: 'Suresh Kumar', type: 'app', subject: 'App crashing', status: 'resolved', priority: 'low', date: '2024-06-19T14:00:00Z' },
]

exports.mockRecentOrders = [
  { id: 'ORD001', customer: 'Rahul Sharma', vendor: 'BuildMart Pro', total: 4560, status: 'delivered', date: '2024-06-20T12:00:00Z' },
  { id: 'ORD002', customer: 'Priya Patel', vendor: 'SteelWorld India', total: 3200, status: 'out_for_delivery', date: '2024-06-20T11:30:00Z' },
  { id: 'ORD003', customer: 'Ananya R', vendor: 'QuickBuild Supply', total: 1800, status: 'packed', date: '2024-06-20T10:00:00Z' },
  { id: 'ORD004', customer: 'Nithin S', vendor: 'NatureMats Co.', total: 2400, status: 'confirmed', date: '2024-06-19T16:00:00Z' },
]

exports.mockRecentBookings = [
  { id: 'BK001', customer: 'Rahul Sharma', worker: 'Suresh Kumar', category: 'Plumber', total: 750, status: 'completed', date: '2024-06-20T14:00:00Z' },
  { id: 'BK002', customer: 'Priya Patel', worker: 'Amit Singh', category: 'Electrician', total: 1200, status: 'in_progress', date: '2024-06-20T13:00:00Z' },
  { id: 'BK003', customer: 'Ananya R', worker: 'Ravi Kumar', category: 'Carpenter', total: 900, status: 'accepted', date: '2024-06-20T11:00:00Z' },
  { id: 'BK004', customer: 'Nithin S', worker: 'Mahesh P', category: 'Mason', total: 1500, status: 'pending', date: '2024-06-20T10:00:00Z' },
]

exports.mockTopWorkers = [
  { id: '1', name: 'Suresh Kumar', category: 'Plumber', rating: 4.9, jobs: 142, earnings: 285000 },
  { id: '2', name: 'Amit Singh', category: 'Electrician', rating: 4.8, jobs: 128, earnings: 256000 },
  { id: '3', name: 'Ravi Kumar', category: 'Carpenter', rating: 4.7, jobs: 115, earnings: 230000 },
  { id: '4', name: 'Mahesh P', category: 'Mason', rating: 4.6, jobs: 98, earnings: 196000 },
  { id: '5', name: 'Deepak R', category: 'Painter', rating: 4.5, jobs: 87, earnings: 174000 },
]

exports.mockTopVendors = [
  { id: '1', name: 'BuildMart Pro', orders: 342, revenue: 1250000, rating: 4.8 },
  { id: '2', name: 'SteelWorld India', orders: 298, revenue: 980000, rating: 4.7 },
  { id: '3', name: 'QuickBuild Supply', orders: 245, revenue: 720000, rating: 4.6 },
  { id: '4', name: 'NatureMats Co.', orders: 198, revenue: 540000, rating: 4.5 },
  { id: '5', name: 'CementKing', orders: 156, revenue: 420000, rating: 4.4 },
]

exports.mockLowStockAlerts = [
  { id: '1', product: 'Portland Cement 50kg', vendor: 'BuildMart Pro', stock: 3, threshold: 5 },
  { id: '2', product: 'TMT Steel Bars 12mm', vendor: 'SteelWorld India', stock: 2, threshold: 10 },
  { id: '3', product: 'AAC Blocks 600×200×150', vendor: 'QuickBuild Supply', stock: 0, threshold: 5 },
  { id: '4', product: 'River Sand (Fine)', vendor: 'NatureMats Co.', stock: 1, threshold: 5 },
]

exports.mockPendingVerifications = [
  { id: '1', type: 'worker', name: 'Suresh Kumar', category: 'Plumber', submittedAt: '2024-06-20T09:00:00Z' },
  { id: '2', type: 'vendor', name: 'BuildMart Pro', shopName: 'BuildMart Pro', submittedAt: '2024-06-20T08:30:00Z' },
  { id: '3', type: 'worker', name: 'Ramesh G', category: 'Electrician', submittedAt: '2024-06-19T16:00:00Z' },
  { id: '4', type: 'business_partner', name: 'Vijay Enterprises', territory: 'Bangalore North', submittedAt: '2024-06-19T14:00:00Z' },
]

exports.mockRevenueSummary = {
  totalRevenue: 7380000,
  vendorRevenue: 2952000,
  workerRevenue: 3690000,
  platformRevenue: 738000,
  daily: [180000, 220000, 195000, 245000, 280000, 310000, 268000],
  weekly: [1250000, 1380000, 1420000, 1560000, 1720000],
  monthly: [5200000, 5800000, 6200000, 6900000, 7380000],
  yearly: [42000000, 52000000, 62000000, 73800000],
}

exports.mockRevenueData = [
  { name: 'Mon', value: 180000 }, { name: 'Tue', value: 220000 }, { name: 'Wed', value: 195000 },
  { name: 'Thu', value: 245000 }, { name: 'Fri', value: 280000 }, { name: 'Sat', value: 310000 }, { name: 'Sun', value: 268000 },
]

exports.mockBookingData = [
  { name: 'Plumber', completed: 45, pending: 12, cancelled: 3 },
  { name: 'Electrician', completed: 38, pending: 8, cancelled: 2 },
  { name: 'Carpenter', completed: 28, pending: 15, cancelled: 1 },
  { name: 'Mason', completed: 52, pending: 6, cancelled: 4 },
  { name: 'Painter', completed: 33, pending: 10, cancelled: 2 },
]

exports.mockUserGrowthData = [
  { month: 'Jan', customers: 1200, workers: 300, vendors: 150 },
  { month: 'Feb', customers: 1450, workers: 350, vendors: 180 },
  { month: 'Mar', customers: 1800, workers: 420, vendors: 220 },
  { month: 'Apr', customers: 2100, workers: 480, vendors: 260 },
  { month: 'May', customers: 2500, workers: 550, vendors: 310 },
  { month: 'Jun', customers: 2900, workers: 620, vendors: 360 },
]

exports.mockVendorGrowthData = [
  { month: 'Jan', count: 120 }, { month: 'Feb', count: 145 }, { month: 'Mar', count: 180 },
  { month: 'Apr', count: 210 }, { month: 'May', count: 250 }, { month: 'Jun', count: 290 },
]

exports.mockServiceData = [
  { name: 'Plumber', value: 450 }, { name: 'Electrician', value: 380 }, { name: 'Carpenter', value: 320 },
  { name: 'Mason', value: 290 }, { name: 'Painter', value: 210 }, { name: 'Builder', value: 150 },
]

exports.mockUserAnalytics = {
  newUsersDaily: [45, 52, 38, 61, 55, 48, 42],
  activeUsersDaily: [1200, 1350, 1280, 1420, 1380, 1450, 1400],
  retentionRate: 68,
  churnRate: 12,
  topCities: [
    { city: 'Bangalore', users: 5200 }, { city: 'Hyderabad', users: 2100 },
    { city: 'Chennai', users: 1800 }, { city: 'Mumbai', users: 1500 }, { city: 'Pune', users: 1200 },
  ],
}

exports.mockRevenueAnalytics = {
  dailyRevenue: [180000, 220000, 195000, 245000, 280000, 310000, 268000],
  weeklyRevenue: [1250000, 1380000, 1420000, 1560000, 1720000],
  monthlyRevenue: [5200000, 5800000, 6200000, 6900000, 7380000],
  revenueByCategory: [
    { category: 'Labour', revenue: 3690000 }, { category: 'Materials', revenue: 2214000 },
    { category: 'Rentals', revenue: 738000 }, { category: 'Platform Fee', revenue: 738000 },
  ],
}

exports.mockBookingAnalytics = {
  totalBookings: 1256,
  completionRate: 78,
  cancellationRate: 8,
  avgResponseTime: 4.2,
  bookingsByCategory: [
    { category: 'Plumber', count: 342 }, { category: 'Electrician', count: 298 },
    { category: 'Carpenter', count: 245 }, { category: 'Mason', count: 198 },
    { category: 'Painter', count: 156 }, { category: 'Builder', count: 17 },
  ],
}

exports.mockVendorAnalytics = {
  totalVendors: 1370,
  activeVendors: 1124,
  avgOrderValue: 3200,
  topCategories: [
    { category: 'Cement', orders: 450 }, { category: 'Steel', orders: 380 },
    { category: 'Blocks', orders: 290 }, { category: 'Sand', orders: 210 }, { category: 'Paint', orders: 180 },
  ],
  vendorGrowth: [
    { month: 'Jan', count: 120 }, { month: 'Feb', count: 145 }, { month: 'Mar', count: 180 },
    { month: 'Apr', count: 210 }, { month: 'May', count: 250 }, { month: 'Jun', count: 290 },
  ],
}

exports.mockConversionAnalytics = {
  visitorToSignup: 23,
  signupToBooking: 45,
  bookingToCompletion: 78,
  cartToOrder: 62,
  funnel: [
    { stage: 'Visitors', count: 50000 }, { stage: 'Signups', count: 11500 },
    { stage: 'Bookings', count: 5175 }, { stage: 'Completed', count: 4037 },
  ],
}
