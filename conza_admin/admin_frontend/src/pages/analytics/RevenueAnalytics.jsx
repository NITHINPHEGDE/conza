import { useState } from 'react'
import PageWrapper from '../../components/layout/PageWrapper/PageWrapper'
import RevenueChart from '../../components/charts/RevenueChart/RevenueChart'
import Table from '../../components/common/Table/Table'
import Select from '../../components/common/Select/Select'

const revenueStats = {
  totalRevenue: 2840000,
  platformCommission: 426000,
  workerPayouts: 1980000,
  vendorRevenue: 850000,
  avgOrderValue: 1240,
  transactions: 3420,
  growth: 18.5
}

const revenueByService = [
  { service: 'Plumbing', revenue: 480000, bookings: 1200, avg: 400 },
  { service: 'Electrical', revenue: 360000, bookings: 900, avg: 400 },
  { service: 'Cleaning', revenue: 520000, bookings: 2600, avg: 200 },
  { service: 'AC Repair', revenue: 290000, bookings: 580, avg: 500 },
  { service: 'Carpentry', revenue: 210000, bookings: 700, avg: 300 },
  { service: 'Painting', revenue: 380000, bookings: 760, avg: 500 }
]

const monthlyTrend = [
  { month: 'Jan', revenue: 210000, commission: 31500 },
  { month: 'Feb', revenue: 195000, commission: 29250 },
  { month: 'Mar', revenue: 240000, commission: 36000 },
  { month: 'Apr', revenue: 280000, commission: 42000 },
  { month: 'May', revenue: 310000, commission: 46500 },
  { month: 'Jun', revenue: 340000, commission: 51000 }
]

export default function RevenueAnalytics() {
  const [period, setPeriod] = useState('6m')

  const serviceColumns = [
    { key: 'service', label: 'Service' },
    { key: 'revenue', label: 'Revenue', render: (row) => `₹${row.revenue.toLocaleString()}` },
    { key: 'bookings', label: 'Bookings' },
    { key: 'avg', label: 'Avg Value', render: (row) => `₹${row.avg}` }
  ]

  const trendColumns = [
    { key: 'month', label: 'Month' },
    { key: 'revenue', label: 'Revenue', render: (row) => `₹${row.revenue.toLocaleString()}` },
    { key: 'commission', label: 'Commission', render: (row) => `₹${row.commission.toLocaleString()}` },
    { key: 'margin', label: 'Margin', render: (row) => `${((row.commission / row.revenue) * 100).toFixed(1)}%` }
  ]

  return (
    <PageWrapper title="Revenue Analytics" subtitle="Revenue breakdown and trends">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Select value={period} onChange={(e) => setPeriod(e.target.value)} options={[
            { value: '7d', label: 'Last 7 Days' },
            { value: '30d', label: 'Last 30 Days' },
            { value: '6m', label: 'Last 6 Months' },
            { value: '1y', label: 'Last Year' }
          ]} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Revenue', value: `₹${(revenueStats.totalRevenue / 100000).toFixed(2)}L`, change: `+${revenueStats.growth}%` },
            { label: 'Platform Commission', value: `₹${(revenueStats.platformCommission / 100000).toFixed(2)}L`, change: '+15.2%' },
            { label: 'Worker Payouts', value: `₹${(revenueStats.workerPayouts / 100000).toFixed(2)}L`, change: '+12.8%' },
            { label: 'Avg Order Value', value: `₹${revenueStats.avgOrderValue}`, change: '+5.3%' }
          ].map((stat, i) => (
            <div key={i} className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
              <p className="text-sm text-green-600 mt-1">{stat.change}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-700 mb-4">Revenue Trend</h3>
          <RevenueChart />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-700 mb-4">Revenue by Service</h3>
            <Table columns={serviceColumns} data={revenueByService} />
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-700 mb-4">Monthly Breakdown</h3>
            <Table columns={trendColumns} data={monthlyTrend} />
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}
