// conzasb/controllers/dashboardController.js
const SellerOrder = require('../models/SellerOrder');
const Product     = require('../models/Product');

// ── GET /api/dashboard ────────────────────────────────────────────────────────
const getDashboard = async (req, res) => {
  try {
    const sellerId = req.seller._id;

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const startOfLastMonth = new Date(startOfMonth);
    startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1);

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalProducts,
      newOrders,
      activeRentals,
      lowStockCount,
      monthRevenueAgg,
      lastMonthRevenueAgg,
      totalRevenueAgg,
      recentOrders,
      chartAgg,
    ] = await Promise.all([

      Product.countDocuments({ seller: sellerId }),

      SellerOrder.countDocuments({ seller: sellerId, status: 'new' }),

      SellerOrder.countDocuments({
        seller: sellerId, orderType: 'rental', status: 'active',
      }),

      Product.countDocuments({
        seller: sellerId,
        $expr:  { $lte: ['$stock', '$lowStockAt'] },
      }),

      // This month revenue
      SellerOrder.aggregate([
        {
          $match: {
            seller:    sellerId,
            status:    { $in: ['delivered', 'returned'] },
            createdAt: { $gte: startOfMonth },
          },
        },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),

      // Last month revenue (for growth %)
      SellerOrder.aggregate([
        {
          $match: {
            seller:    sellerId,
            status:    { $in: ['delivered', 'returned'] },
            createdAt: { $gte: startOfLastMonth, $lt: startOfMonth },
          },
        },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),

      // All-time revenue
      SellerOrder.aggregate([
        {
          $match: {
            seller: sellerId,
            status: { $in: ['delivered', 'returned'] },
          },
        },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),

      // 5 most recent orders
      SellerOrder.find({ seller: sellerId }).sort({ createdAt: -1 }).limit(5),

      // 7-day daily revenue chart
      SellerOrder.aggregate([
        {
          $match: {
            seller:    sellerId,
            status:    { $in: ['delivered', 'returned'] },
            createdAt: { $gte: sevenDaysAgo },
          },
        },
        {
          $group: {
            _id:   { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            total: { $sum: '$total' },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    const monthRevenue = monthRevenueAgg[0]?.total  || 0;
    const lastMonth    = lastMonthRevenueAgg[0]?.total || 0;
    const totalRevenue = totalRevenueAgg[0]?.total   || 0;

    const growth = lastMonth > 0
      ? `${monthRevenue >= lastMonth ? '+' : ''}${Math.round(((monthRevenue - lastMonth) / lastMonth) * 100)}%`
      : '+0%';

    // Build 7-slot chart array (fill missing days with 0)
    const chartMap = {};
    chartAgg.forEach((entry) => { chartMap[entry._id] = entry.total; });
    const chartData = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(sevenDaysAgo);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      return chartMap[key] || 0;
    });

    res.json({
      success: true,
      vendor: {
        name:          req.seller.name,
        shopName:      req.seller.shopName,
        walletBalance: req.seller.walletBalance,
        monthEarnings: monthRevenue,
        totalRevenue,
        growth,
      },
      kpi: {
        newOrders,
        activeRentals,
        totalProducts,
        lowStockItems: lowStockCount,
      },
      recentOrders,
      chartData,   // [n0, n1, n2, n3, n4, n5, n6]  — last 7 days
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getDashboard };