import { useState } from 'react'
import PageWrapper from '../../components/layout/PageWrapper/PageWrapper'
import BookingChart from '../../components/charts/BookingChart/BookingChart'
import Table from '../../components/common/Table/Table'
import Select from '../../components/common/Select/Select'

const bookingStats = {
  totalBookings: 15240,
  completed: 12800,
  cancelled: 840,
  noShow: 420,
  avgResponseTime: '4m 30s',
  completionRate: 84,
  repeatRate: 62
}

const statusBreakdown = [
  { status: 'Completed', count: 12800, percentage: 84.0 },
  { status: 'Cancelled', count: 840, percentage: 5.5 },
  { status: 'No Show', count: 420, percentage: 2.8 },
  { status: 'In Progress', count: 680, percentage: 4.5 },
  { status: 'Pending', count: 500, percentage: 3.2 }
]

const topServices = [
  { service: 'Cleaning', bookings: 4200, completion: 96 },
  { service: 'Plumbing', bookings: 3100, completion: 92 },
  { service: 'Electrical', bookings: 2800, completion: 89 },
  { service: 'AC Repair', bookings: 1900, completion: 94 },
  { service: 'Carpentry', bookings: 1600, completion: 87 },
  { service: 'Painting', bookings: 1640, completion: 91 }
]

const peakHours = [
  { hour: '8-10 AM', bookings: 1200 },
  { hour: '10-12 PM', bookings: 2800 },
  { hour: '12-2 PM', bookings: 2100 },
  { hour: '2-4 PM', bookings: 1800 },
  { hour: '4-6 PM', bookings: 2400 },
  { hour: '6-8 PM', bookings: 3200 },
  { hour: '8-10 PM', bookings: 1940 }
]

export default function BookingAnalytics() {
  const [period, setPeriod] = useState('30d')

  const statusColumns = [
    { key: 'status', label: 'Status' },
    { key: 'count', label: 'Count' },
    { key: 'percentage', label: '%', render: (row) => `${row.percentage}%` }
  ]

  const serviceColumns = [
    { key: 'service', label: 'Service' },
    { key: 'bookings', label: 'Bookings' },
    { key: 'completion', label: 'Completion %', render: (row) => `${row.completion}%` }
  ]

  const hourColumns = [
    { key: 'hour', label: 'Time Slot' },
    { key: 'bookings', label: 'Bookings' }
  ]

  return (
    <PageWrapper title="Booking Analytics" subtitle="Booking trends and performance">
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
            { label: 'Total Bookings', value: bookingStats.totalBookings.toLocaleString(), change: '+8.2%' },
            { label: 'Completion Rate', value: `${bookingStats.completionRate}%`, change: '+2.1%' },
            { label: 'Avg Response', value: bookingStats.avgResponseTime, change: '-30s' },
            { label: 'Repeat Rate', value: `${bookingStats.repeatRate}%`, change: '+4.5%' }
          ].map((stat, i) => (
            <div key={i} className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
              <p className="text-sm text-green-600 mt-1">{stat.change}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-700 mb-4">Booking Trends</h3>
          <BookingChart />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-700 mb-4">Status Breakdown</h3>
            <Table columns={statusColumns} data={statusBreakdown} />
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-700 mb-4">Top Services</h3>
            <Table columns={serviceColumns} data={topServices} />
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-700 mb-4">Peak Hours</h3>
            <Table columns={hourColumns} data={peakHours} />
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}
