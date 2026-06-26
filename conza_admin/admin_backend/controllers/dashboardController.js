const Customer = require('../models/Customer')
const Worker = require('../models/Worker')
const Vendor = require('../models/Vendor')
const Booking = require('../models/Booking')
const Order = require('../models/Order')
const Material = require('../models/Material')
const Rental = require('../models/Rental')
const BusinessPartner = require('../models/BusinessPartner')
const Transaction = require('../models/Transaction')
const Complaint = require('../models/Complaint')
const { sendSuccess } = require('../utils/response')
const { mockDashboardStats, mockRecentRegistrations, mockRecentComplaints, mockRecentOrders, mockRecentBookings, mockTopWorkers, mockTopVendors, mockLowStockAlerts, mockPendingVerifications, mockRevenueData, mockBookingData, mockUserGrowthData, mockVendorGrowthData, mockServiceData } = require('../utils/mockData')

exports.getStats = async (req, res, next) => {
  try {
    const [
      totalCustomers, totalWorkers, totalVendors, totalBusinessPartners,
      activeVendors, suspendedVendors, activeWorkers,
      totalMaterials, totalRentals,
    ] = await Promise.all([
      Customer.countDocuments(),
      Worker.countDocuments(),
      Vendor.countDocuments(),
      BusinessPartner.countDocuments(),
      Vendor.countDocuments({ status: 'active' }),
      Vendor.countDocuments({ status: 'suspended' }),
      Worker.countDocuments({ status: 'active', isOnline: true }),
      Material.countDocuments(),
      Rental.countDocuments(),
    ])

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [bookingsToday, ordersToday, completedJobs, pendingJobs] = await Promise.all([
      Booking.countDocuments({ createdAt: { $gte: today } }),
      Order.countDocuments({ createdAt: { $gte: today } }),
      Booking.countDocuments({ status: 'completed', createdAt: { $gte: today } }),
      Booking.countDocuments({ status: 'pending' }),
    ])

    const todayRevResult = await Transaction.aggregate([
      { $match: { status: 'success', createdAt: { $gte: today } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ])
    const revenueToday = todayRevResult[0]?.total || 0

    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - 7)
    const weekRevResult = await Transaction.aggregate([
      { $match: { status: 'success', createdAt: { $gte: weekStart } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ])
    const revenueThisWeek = weekRevResult[0]?.total || 0

    const monthStart = new Date()
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)
    const monthRevResult = await Transaction.aggregate([
      { $match: { status: 'success', createdAt: { $gte: monthStart } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ])
    const revenueThisMonth = monthRevResult[0]?.total || 0

    const stats = {
      totalUsers: totalCustomers + totalWorkers + totalVendors,
      totalCustomers,
      totalWorkers,
      activeWorkersOnline: activeWorkers,
      totalVendors,
      activeVendors,
      suspendedVendors,
      totalBusinessPartners,
      totalBookingsToday: bookingsToday,
      completedJobs,
      pendingJobs,
      ordersToday,
      totalMaterialListings: totalMaterials,
      totalRentalListings: totalRentals,
      revenueToday,
      revenueThisWeek,
      revenueThisMonth,
      platformCommissionEarned: Math.round(revenueThisMonth * 0.1),
    }

    // Fallback to mock if DB is empty
    const finalStats = totalCustomers === 0 ? mockDashboardStats : stats

    sendSuccess(res, 200, 'Dashboard stats fetched', { stats: finalStats })
  } catch (err) {
    next(err)
  }
}

exports.getRecentData = async (req, res, next) => {
  try {
    const [customers, workers, vendors] = await Promise.all([
      Customer.find().sort({ createdAt: -1 }).limit(3).select('fullName phone status createdAt'),
      Worker.find().sort({ createdAt: -1 }).limit(2).select('fullName phone status createdAt'),
      Vendor.find().sort({ createdAt: -1 }).limit(2).select('name phone status createdAt'),
    ])

    const recentRegistrations = [
      ...customers.map(c => ({ id: c._id, type: 'customer', name: c.fullName, phone: c.phone, date: c.createdAt, status: c.status })),
      ...workers.map(w => ({ id: w._id, type: 'worker', name: w.fullName, phone: w.phone, date: w.createdAt, status: w.status })),
      ...vendors.map(v => ({ id: v._id, type: 'vendor', name: v.name, phone: v.phone, date: v.createdAt, status: v.status })),
    ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5)

    const recentComplaints = await Complaint.find().sort({ createdAt: -1 }).limit(5)
    const recentOrders = await Order.find().sort({ createdAt: -1 }).limit(5)
    const recentBookings = await Booking.find().sort({ createdAt: -1 }).limit(5)
    const topWorkers = await Worker.find({ status: 'active' }).sort({ totalJobs: -1 }).limit(5).select('fullName category rating totalJobs earnings')
    const topVendors = await Vendor.find({ status: 'active' }).sort({ totalRevenue: -1 }).limit(5).select('name totalOrders totalRevenue rating')
    const lowStockAlerts = await Material.find({ $expr: { $lte: ['$stock', '$threshold'] } }).limit(4).populate('vendor', 'name')
    const pendingVerifications = [
      ...await Worker.find({ status: 'pending_verification' }).limit(3).select('fullName category createdAt'),
      ...await Vendor.find({ status: 'pending_verification' }).limit(2).select('name shopName createdAt'),
    ].map(item => ({
      id: item._id,
      type: item.category ? 'worker' : 'vendor',
      name: item.fullName || item.name,
      category: item.category,
      shopName: item.shopName,
      submittedAt: item.createdAt,
    }))

    const hasData = recentRegistrations.length > 0

    sendSuccess(res, 200, 'Recent data fetched', {
      recentRegistrations: hasData ? recentRegistrations : mockRecentRegistrations,
      recentComplaints: recentComplaints.length > 0 ? recentComplaints : mockRecentComplaints,
      recentOrders: recentOrders.length > 0 ? recentOrders : mockRecentOrders,
      recentBookings: recentBookings.length > 0 ? recentBookings : mockRecentBookings,
      topWorkers: topWorkers.length > 0 ? topWorkers.map(w => ({ id: w._id, name: w.fullName, category: w.category, rating: w.rating, jobs: w.totalJobs, earnings: w.earnings?.total || 0 })) : mockTopWorkers,
      topVendors: topVendors.length > 0 ? topVendors.map(v => ({ id: v._id, name: v.name, orders: v.totalOrders, revenue: v.totalRevenue, rating: v.rating })) : mockTopVendors,
      lowStockAlerts: lowStockAlerts.length > 0 ? lowStockAlerts : mockLowStockAlerts,
      pendingVerifications: pendingVerifications.length > 0 ? pendingVerifications : mockPendingVerifications,
    })
  } catch (err) {
    next(err)
  }
}

exports.getChartData = async (req, res, next) => {
  try {
    sendSuccess(res, 200, 'Chart data fetched', {
      revenueData: mockRevenueData,
      bookingData: mockBookingData,
      userGrowthData: mockUserGrowthData,
      vendorGrowthData: mockVendorGrowthData,
      serviceData: mockServiceData,
    })
  } catch (err) {
    next(err)
  }
}