export const mockDashboardStats = {
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

export const mockRevenueData = [
  { name: 'Mon', value: 180000 },
  { name: 'Tue', value: 220000 },
  { name: 'Wed', value: 195000 },
  { name: 'Thu', value: 245000 },
  { name: 'Fri', value: 280000 },
  { name: 'Sat', value: 310000 },
  { name: 'Sun', value: 268000 },
]

export const mockBookingData = [
  { name: 'Plumber', completed: 45, pending: 12, cancelled: 3 },
  { name: 'Electrician', completed: 38, pending: 8, cancelled: 2 },
  { name: 'Carpenter', completed: 28, pending: 15, cancelled: 1 },
  { name: 'Mason', completed: 52, pending: 6, cancelled: 4 },
  { name: 'Painter', completed: 33, pending: 10, cancelled: 2 },
  { name: 'Builder', completed: 22, pending: 5, cancelled: 1 },
]

export const mockUserGrowthData = [
  { month: 'Jan', customers: 1200, workers: 300, vendors: 150 },
  { month: 'Feb', customers: 1450, workers: 350, vendors: 180 },
  { month: 'Mar', customers: 1800, workers: 420, vendors: 220 },
  { month: 'Apr', customers: 2100, workers: 480, vendors: 260 },
  { month: 'May', customers: 2500, workers: 550, vendors: 310 },
  { month: 'Jun', customers: 2900, workers: 620, vendors: 360 },
]

export const mockVendorGrowthData = [
  { month: 'Jan', count: 120 },
  { month: 'Feb', count: 145 },
  { month: 'Mar', count: 180 },
  { month: 'Apr', count: 210 },
  { month: 'May', count: 250 },
  { month: 'Jun', count: 290 },
]

export const mockServiceData = [
  { name: 'Plumber', value: 450 },
  { name: 'Electrician', value: 380 },
  { name: 'Carpenter', value: 320 },
  { name: 'Mason', value: 290 },
  { name: 'Painter', value: 210 },
  { name: 'Builder', value: 150 },
]

export const mockRecentRegistrations = [
  { id: '1', type: 'customer', name: 'Rahul Sharma', phone: '+91 9876543210', date: '2024-06-20T10:30:00Z', status: 'active' },
  { id: '2', type: 'worker', name: 'Suresh Kumar', phone: '+91 9876543211', date: '2024-06-20T09:15:00Z', status: 'pending_verification' },
  { id: '3', type: 'vendor', name: 'BuildMart Pro', phone: '+91 9876543212', date: '2024-06-20T08:45:00Z', status: 'pending_verification' },
  { id: '4', type: 'customer', name: 'Priya Patel', phone: '+91 9876543213', date: '2024-06-19T18:20:00Z', status: 'active' },
  { id: '5', type: 'worker', name: 'Amit Singh', phone: '+91 9876543214', date: '2024-06-19T16:00:00Z', status: 'active' },
]

export const mockRecentComplaints = [
  { id: 'C001', user: 'Rahul Sharma', type: 'booking', subject: 'Worker did not arrive', status: 'open', priority: 'high', date: '2024-06-20T11:00:00Z' },
  { id: 'C002', user: 'BuildMart Pro', type: 'payment', subject: 'Payout delayed', status: 'in_progress', priority: 'medium', date: '2024-06-20T10:00:00Z' },
  { id: 'C003', user: 'Priya Patel', type: 'order', subject: 'Wrong item delivered', status: 'open', priority: 'high', date: '2024-06-19T20:00:00Z' },
  { id: 'C004', user: 'Suresh Kumar', type: 'app', subject: 'App crashing', status: 'resolved', priority: 'low', date: '2024-06-19T14:00:00Z' },
]

export const mockRecentOrders = [
  { id: 'ORD001', customer: 'Rahul Sharma', vendor: 'BuildMart Pro', total: 4560, status: 'delivered', date: '2024-06-20T12:00:00Z' },
  { id: 'ORD002', customer: 'Priya Patel', vendor: 'SteelWorld India', total: 3200, status: 'out_for_delivery', date: '2024-06-20T11:30:00Z' },
  { id: 'ORD003', customer: 'Ananya R', vendor: 'QuickBuild Supply', total: 1800, status: 'packed', date: '2024-06-20T10:00:00Z' },
  { id: 'ORD004', customer: 'Nithin S', vendor: 'NatureMats Co.', total: 2400, status: 'confirmed', date: '2024-06-19T16:00:00Z' },
]

export const mockRecentBookings = [
  { id: 'BK001', customer: 'Rahul Sharma', worker: 'Suresh Kumar', category: 'Plumber', total: 750, status: 'completed', date: '2024-06-20T14:00:00Z' },
  { id: 'BK002', customer: 'Priya Patel', worker: 'Amit Singh', category: 'Electrician', total: 1200, status: 'in_progress', date: '2024-06-20T13:00:00Z' },
  { id: 'BK003', customer: 'Ananya R', worker: 'Ravi Kumar', category: 'Carpenter', total: 900, status: 'accepted', date: '2024-06-20T11:00:00Z' },
  { id: 'BK004', customer: 'Nithin S', worker: 'Mahesh P', category: 'Mason', total: 1500, status: 'pending', date: '2024-06-20T10:00:00Z' },
]

export const mockTopWorkers = [
  { id: '1', name: 'Suresh Kumar', category: 'Plumber', rating: 4.9, jobs: 142, earnings: 285000 },
  { id: '2', name: 'Amit Singh', category: 'Electrician', rating: 4.8, jobs: 128, earnings: 256000 },
  { id: '3', name: 'Ravi Kumar', category: 'Carpenter', rating: 4.7, jobs: 115, earnings: 230000 },
  { id: '4', name: 'Mahesh P', category: 'Mason', rating: 4.6, jobs: 98, earnings: 196000 },
  { id: '5', name: 'Deepak R', category: 'Painter', rating: 4.5, jobs: 87, earnings: 174000 },
]

export const mockTopVendors = [
  { id: '1', name: 'BuildMart Pro', orders: 342, revenue: 1250000, rating: 4.8 },
  { id: '2', name: 'SteelWorld India', orders: 298, revenue: 980000, rating: 4.7 },
  { id: '3', name: 'QuickBuild Supply', orders: 245, revenue: 720000, rating: 4.6 },
  { id: '4', name: 'NatureMats Co.', orders: 198, revenue: 540000, rating: 4.5 },
  { id: '5', name: 'CementKing', orders: 156, revenue: 420000, rating: 4.4 },
]

export const mockLowStockAlerts = [
  { id: '1', product: 'Portland Cement 50kg', vendor: 'BuildMart Pro', stock: 3, threshold: 5 },
  { id: '2', product: 'TMT Steel Bars 12mm', vendor: 'SteelWorld India', stock: 2, threshold: 10 },
  { id: '3', product: 'AAC Blocks 600×200×150', vendor: 'QuickBuild Supply', stock: 0, threshold: 5 },
  { id: '4', product: 'River Sand (Fine)', vendor: 'NatureMats Co.', stock: 1, threshold: 5 },
]

export const mockPendingVerifications = [
  { id: '1', type: 'worker', name: 'Suresh Kumar', category: 'Plumber', submittedAt: '2024-06-20T09:00:00Z' },
  { id: '2', type: 'vendor', name: 'BuildMart Pro', shopName: 'BuildMart Pro', submittedAt: '2024-06-20T08:30:00Z' },
  { id: '3', type: 'worker', name: 'Ramesh G', category: 'Electrician', submittedAt: '2024-06-19T16:00:00Z' },
  { id: '4', type: 'business_partner', name: 'Vijay Enterprises', territory: 'Bangalore North', submittedAt: '2024-06-19T14:00:00Z' },
]

export const mockTransactions = [
  { id: 'TXN001', type: 'booking', user: 'Rahul Sharma', amount: 750, method: 'upi', status: 'success', date: '2024-06-20T14:00:00Z' },
  { id: 'TXN002', type: 'order', user: 'Priya Patel', amount: 3200, method: 'card', status: 'success', date: '2024-06-20T13:00:00Z' },
  { id: 'TXN003', type: 'booking', user: 'Ananya R', amount: 900, method: 'cod', status: 'pending', date: '2024-06-20T12:00:00Z' },
  { id: 'TXN004', type: 'order', user: 'Nithin S', amount: 2400, method: 'upi', status: 'failed', date: '2024-06-20T11:00:00Z' },
  { id: 'TXN005', type: 'booking', user: 'Meena T', amount: 1200, method: 'card', status: 'success', date: '2024-06-20T10:00:00Z' },
]

export const mockPayouts = [
  { id: 'PAY001', recipient: 'Suresh Kumar', type: 'worker', amount: 15000, status: 'pending', requestedAt: '2024-06-20T10:00:00Z' },
  { id: 'PAY002', recipient: 'BuildMart Pro', type: 'vendor', amount: 45000, status: 'processing', requestedAt: '2024-06-20T09:00:00Z' },
  { id: 'PAY003', recipient: 'Amit Singh', type: 'worker', amount: 12000, status: 'completed', requestedAt: '2024-06-19T16:00:00Z' },
  { id: 'PAY004', recipient: 'SteelWorld India', type: 'vendor', amount: 38000, status: 'pending', requestedAt: '2024-06-19T14:00:00Z' },
]

export const mockCommissions = [
  { id: 'COM001', source: 'Booking #BK001', amount: 75, type: 'booking', date: '2024-06-20T14:00:00Z' },
  { id: 'COM002', source: 'Order #ORD001', amount: 456, type: 'order', date: '2024-06-20T12:00:00Z' },
  { id: 'COM003', source: 'Booking #BK002', amount: 120, type: 'booking', date: '2024-06-20T13:00:00Z' },
  { id: 'COM004', source: 'Order #ORD002', amount: 320, type: 'order', date: '2024-06-20T11:30:00Z' },
]

export const mockRevenueSummary = {
  totalRevenue: 7380000,
  vendorRevenue: 2952000,
  workerRevenue: 3690000,
  platformRevenue: 738000,
  daily: [180000, 220000, 195000, 245000, 280000, 310000, 268000],
  weekly: [1250000, 1380000, 1420000, 1560000, 1720000],
  monthly: [5200000, 5800000, 6200000, 6900000, 7380000],
  yearly: [42000000, 52000000, 62000000, 73800000],
}
