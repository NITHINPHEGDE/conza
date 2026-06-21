import { useState } from 'react'
import PageWrapper from '../../components/layout/PageWrapper/PageWrapper'
import VendorGrowthChart from '../../components/charts/VendorGrowthChart/VendorGrowthChart'
import Table from '../../components/common/Table/Table'
import Select from '../../components/common/Select/Select'

const vendorStats = {
  totalVendors: 1240,
  activeVendors: 980,
  newVendors: 45,
  avgOrderValue: 1850,
  totalOrders: 12400,
  avgRating: 4.3,
  retention: 78
}

const topVendors = [
  { name: 'BuildMart Supplies', orders: 2400, revenue: 480000, rating: 4.8 },
  { name: 'ToolHub Pro', orders: 1800, revenue: 360000, rating: 4.6 },
  { name: 'PaintWorld', orders: 1600, revenue: 320000, rating: 4.5 },
  { name: 'ElectroMax', orders: 1400, revenue: 280000, rating: 4.7 },
  { name: 'PlumbMaster', orders: 1200, revenue: 240000, rating: 4.4 }
]

const categoryPerformance = [
  { category: 'Materials', vendors: 520, orders: 8400, revenue: 1680000 },
  { category: 'Rentals', vendors: 180, orders: 2400, revenue: 480000 },
  { category: 'Tools', vendors: 340, orders: 1600, revenue: 320000 },
  { category: 'Safety Gear', vendors: 200, orders: 1200, revenue: 240000 }
]

export default function VendorAnalytics() {
  const [period, setPeriod] = useState('30d')

  const vendorColumns = [
    { key: 'name', label: 'Vendor' },
    { key: 'orders', label: 'Orders' },
    { key: 'revenue', label: 'Revenue', render: (row) => `₹${row.revenue.toLocaleString()}` },
    { key: 'rating', label: 'Rating', render: (row) => `${row.rating} ⭐` }
  ]

  const categoryColumns = [
    { key: 'category', label: 'Category' },
    { key: 'vendors', label: 'Vendors' },
    { key: 'orders', label: 'Orders' },
    { key: 'revenue', label: 'Revenue', render: (row) => `₹${row.revenue.toLocaleString()}` }
  ]

  return (
    <PageWrapper title="Vendor Analytics" subtitle="Vendor performance and growth">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Select value={period} onChange={(e) => setPeriod(e.target.value)} options={[
            { value: '7d', label: 'Last 7 Days' },
            { value: '30d', label: 'Last 30 Days' },
            { value: '90d', label: 'Last 90 Days' },
            { value: '1y', label: 'Last Year' }
          ]} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Vendors', value: vendorStats.totalVendors.toLocaleString(), change: '+4.2%' },
            { label: 'Active Vendors', value: vendorStats.activeVendors.toLocaleString(), change: '+6.1%' },
            { label: 'Avg Rating', value: vendorStats.avgRating, change: '+0.2' },
            { label: 'Retention', value: `${vendorStats.retention}%`, change: '+3.5%' }
          ].map((stat, i) => (
            <div key={i} className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
              <p className="text-sm text-green-600 mt-1">{stat.change}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-700 mb-4">Vendor Growth</h3>
          <VendorGrowthChart />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-700 mb-4">Top Vendors</h3>
            <Table columns={vendorColumns} data={topVendors} />
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-700 mb-4">Category Performance</h3>
            <Table columns={categoryColumns} data={categoryPerformance} />
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}
