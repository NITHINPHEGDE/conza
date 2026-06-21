import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Users, HardHat, Store, Handshake, CalendarCheck, ShoppingCart,
  Package, Truck, TrendingUp, TrendingDown, AlertTriangle, Clock,
  CheckCircle, XCircle, Star, MapPin, Eye
} from 'lucide-react'
import useDashboardStore from '../../store/dashboard/useDashboardStore'
import RevenueChart from '../../components/charts/RevenueChart/RevenueChart'
import BookingChart from '../../components/charts/BookingChart/BookingChart'
import UserGrowthChart from '../../components/charts/UserGrowthChart/UserGrowthChart'
import WorkerMap from '../../components/maps/WorkerMap/WorkerMap'
import VendorMap from '../../components/maps/VendorMap/VendorMap'
import StatusBadge from '../../components/common/StatusBadge/StatusBadge'
import Button from '../../components/common/Button/Button'

const StatCard = ({ title, value, icon: Icon, trend, trendValue, color }) => (
  <div className="bg-surface rounded-xl border border-border p-5 card-shadow hover:card-shadow-hover transition-shadow">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-textMuted mb-1">{title}</p>
        <p className="text-2xl font-bold text-textPrimary">{typeof value === 'number' ? value.toLocaleString() : value}</p>
        {trend && (
          <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${trend === 'up' ? 'text-success' : 'text-danger'}`}>
            {trend === 'up' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {trendValue}
          </div>
        )}
      </div>
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
    </div>
  </div>
)

export default function Dashboard() {
  const {
    stats, recentRegistrations, recentComplaints, recentOrders,
    recentBookings, topWorkers, topVendors, lowStockAlerts, pendingVerifications
  } = useDashboardStore()

  const [activeTab, setActiveTab] = useState('overview')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-textPrimary">Dashboard</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">Export</Button>
          <Button size="sm">Refresh</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        <StatCard title="Total Users" value={stats.totalUsers} icon={Users} trend="up" trendValue="+12%" color="bg-blue-500" />
        <StatCard title="Total Customers" value={stats.totalCustomers} icon={Users} trend="up" trendValue="+8%" color="bg-blue-400" />
        <StatCard title="Total Workers" value={stats.totalWorkers} icon={HardHat} trend="up" trendValue="+5%" color="bg-accentAmber" />
        <StatCard title="Active Workers" value={stats.activeWorkersOnline} icon={HardHat} trend="down" trendValue="-2%" color="bg-green-500" />
        <StatCard title="Total Vendors" value={stats.totalVendors} icon={Store} trend="up" trendValue="+15%" color="bg-indigo-500" />
        <StatCard title="Active Vendors" value={stats.activeVendors} icon={Store} trend="up" trendValue="+10%" color="bg-indigo-400" />
        <StatCard title="Suspended Vendors" value={stats.suspendedVendors} icon={AlertTriangle} color="bg-red-500" />
        <StatCard title="Business Partners" value={stats.totalBusinessPartners} icon={Handshake} trend="up" trendValue="+3%" color="bg-purple-500" />
        <StatCard title="Bookings Today" value={stats.totalBookingsToday} icon={CalendarCheck} trend="up" trendValue="+18%" color="bg-cyan-500" />
        <StatCard title="Completed Jobs" value={stats.completedJobs} icon={CheckCircle} trend="up" trendValue="+22%" color="bg-green-500" />
        <StatCard title="Pending Jobs" value={stats.pendingJobs} icon={Clock} trend="down" trendValue="-5%" color="bg-orange-500" />
        <StatCard title="Orders Today" value={stats.ordersToday} icon={ShoppingCart} trend="up" trendValue="+25%" color="bg-pink-500" />
        <StatCard title="Material Listings" value={stats.totalMaterialListings} icon={Package} trend="up" trendValue="+7%" color="bg-amber-500" />
        <StatCard title="Rental Listings" value={stats.totalRentalListings} icon={Truck} trend="up" trendValue="+4%" color="bg-teal-500" />
        <StatCard title="Revenue Today" value={`₹${stats.revenueToday.toLocaleString()}`} icon={TrendingUp} trend="up" trendValue="+14%" color="bg-emerald-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface rounded-xl border border-border p-5">
          <h3 className="text-lg font-semibold text-textPrimary mb-4">Revenue Trend</h3>
          <RevenueChart />
        </div>
        <div className="bg-surface rounded-xl border border-border p-5">
          <h3 className="text-lg font-semibold text-textPrimary mb-4">Bookings by Category</h3>
          <BookingChart />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface rounded-xl border border-border p-5">
          <h3 className="text-lg font-semibold text-textPrimary mb-4">Live Worker Map</h3>
          <WorkerMap height="300px" />
        </div>
        <div className="bg-surface rounded-xl border border-border p-5">
          <h3 className="text-lg font-semibold text-textPrimary mb-4">Vendor Locations</h3>
          <VendorMap height="300px" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-surface rounded-xl border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-textPrimary">Recent Registrations</h3>
            <Link to="/customers" className="text-sm text-accentAmber hover:underline">View all</Link>
          </div>
          <div className="space-y-3">
            {recentRegistrations.slice(0, 5).map((reg) => (
              <div key={reg.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-surfaceElevated transition-colors">
                <div className="w-8 h-8 rounded-full bg-surfaceElevated flex items-center justify-center text-xs font-bold text-textMuted">
                  {reg.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-textPrimary truncate">{reg.name}</p>
                  <p className="text-xs text-textMuted">{reg.type} • {reg.phone}</p>
                </div>
                <StatusBadge status={reg.status} />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-surface rounded-xl border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-textPrimary">Recent Complaints</h3>
            <Link to="/complaints" className="text-sm text-accentAmber hover:underline">View all</Link>
          </div>
          <div className="space-y-3">
            {recentComplaints.slice(0, 5).map((comp) => (
              <div key={comp.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-surfaceElevated transition-colors">
                <AlertTriangle size={16} className="text-danger mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-textPrimary truncate">{comp.subject}</p>
                  <p className="text-xs text-textMuted">{comp.user} • {comp.type}</p>
                </div>
                <StatusBadge status={comp.status} />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-surface rounded-xl border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-textPrimary">Pending Verifications</h3>
            <Link to="/workers/verification" className="text-sm text-accentAmber hover:underline">View all</Link>
          </div>
          <div className="space-y-3">
            {pendingVerifications.slice(0, 5).map((ver) => (
              <div key={ver.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-surfaceElevated transition-colors">
                <Clock size={16} className="text-orange-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-textPrimary truncate">{ver.name}</p>
                  <p className="text-xs text-textMuted capitalize">{ver.type.replace('_', ' ')}</p>
                </div>
                <Button variant="ghost" size="sm">
                  <Eye size={14} />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface rounded-xl border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-textPrimary">Top Workers</h3>
            <Link to="/workers" className="text-sm text-accentAmber hover:underline">View all</Link>
          </div>
          <div className="space-y-3">
            {topWorkers.slice(0, 5).map((worker, idx) => (
              <div key={worker.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-surfaceElevated transition-colors">
                <div className="w-6 h-6 rounded-full bg-accentYellowSoft flex items-center justify-center text-xs font-bold text-accentAmber">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-textPrimary">{worker.name}</p>
                  <p className="text-xs text-textMuted">{worker.category} • {worker.jobs} jobs</p>
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <Star size={14} className="text-accentYellow fill-accentYellow" />
                  <span className="font-medium">{worker.rating}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-surface rounded-xl border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-textPrimary">Top Vendors</h3>
            <Link to="/vendors" className="text-sm text-accentAmber hover:underline">View all</Link>
          </div>
          <div className="space-y-3">
            {topVendors.slice(0, 5).map((vendor, idx) => (
              <div key={vendor.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-surfaceElevated transition-colors">
                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-xs font-bold text-green-700">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-textPrimary">{vendor.name}</p>
                  <p className="text-xs text-textMuted">{vendor.orders} orders</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-textPrimary">₹{(vendor.revenue / 100000).toFixed(1)}L</p>
                  <div className="flex items-center gap-1 text-xs">
                    <Star size={12} className="text-accentYellow fill-accentYellow" />
                    <span>{vendor.rating}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-surface rounded-xl border border-border p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-textPrimary">Low Stock Alerts</h3>
          <Link to="/inventory/low-stock" className="text-sm text-accentAmber hover:underline">View all</Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {lowStockAlerts.slice(0, 4).map((alert) => (
            <div key={alert.id} className="p-4 rounded-lg bg-red-50 border border-red-100">
              <p className="text-sm font-medium text-textPrimary">{alert.product}</p>
              <p className="text-xs text-textMuted mt-1">{alert.vendor}</p>
              <div className="flex items-center gap-2 mt-2">
                <AlertTriangle size={14} className="text-danger" />
                <span className="text-xs font-medium text-danger">Stock: {alert.stock} (min: {alert.threshold})</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
