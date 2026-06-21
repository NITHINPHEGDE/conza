import { useState } from 'react'
import PageWrapper from '../../components/layout/PageWrapper/PageWrapper'
import UserGrowthChart from '../../components/charts/UserGrowthChart/UserGrowthChart'
import Table from '../../components/common/Table/Table'
import Select from '../../components/common/Select/Select'

const userStats = {
  totalUsers: 58240,
  newUsersThisMonth: 3240,
  activeUsers: 18400,
  churnRate: 2.4,
  avgSession: '12m 30s',
  retentionDay7: 68,
  retentionDay30: 45
}

const userSegments = [
  { segment: 'Premium', count: 8200, percentage: 14.1, avgSpend: 2400 },
  { segment: 'Regular', count: 28400, percentage: 48.8, avgSpend: 850 },
  { segment: 'Occasional', count: 15600, percentage: 26.8, avgSpend: 320 },
  { segment: 'Inactive', count: 6040, percentage: 10.3, avgSpend: 0 }
]

const topCities = [
  { city: 'Bangalore', users: 12400, growth: 12.5 },
  { city: 'Mumbai', users: 9800, growth: 8.3 },
  { city: 'Delhi', users: 8900, growth: 15.2 },
  { city: 'Hyderabad', users: 6200, growth: 22.1 },
  { city: 'Chennai', users: 5400, growth: 6.7 },
  { city: 'Pune', users: 4100, growth: 18.4 }
]

const deviceData = [
  { device: 'Android', percentage: 72 },
  { device: 'iOS', percentage: 24 },
  { device: 'Web', percentage: 4 }
]

export default function UserAnalytics() {
  const [period, setPeriod] = useState('30d')

  const segmentColumns = [
    { key: 'segment', label: 'Segment' },
    { key: 'count', label: 'Users' },
    { key: 'percentage', label: '% of Total', render: (row) => `${row.percentage}%` },
    { key: 'avgSpend', label: 'Avg Spend', render: (row) => `₹${row.avgSpend}` }
  ]

  const cityColumns = [
    { key: 'city', label: 'City' },
    { key: 'users', label: 'Total Users' },
    { key: 'growth', label: 'Growth', render: (row) => <span className="text-green-600">+{row.growth}%</span> }
  ]

  return (
    <PageWrapper title="User Analytics" subtitle="User growth, segments, and behavior">
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
            { label: 'Total Users', value: userStats.totalUsers.toLocaleString(), change: '+5.2%' },
            { label: 'Active Users', value: userStats.activeUsers.toLocaleString(), change: '+3.8%' },
            { label: 'New This Month', value: userStats.newUsersThisMonth.toLocaleString(), change: '+12.1%' },
            { label: 'Churn Rate', value: `${userStats.churnRate}%`, change: '-0.3%', negative: true }
          ].map((stat, i) => (
            <div key={i} className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
              <p className={`text-sm mt-1 ${stat.negative ? 'text-green-600' : 'text-green-600'}`}>{stat.change}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-700 mb-4">User Growth</h3>
          <UserGrowthChart />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-700 mb-4">User Segments</h3>
            <Table columns={segmentColumns} data={userSegments} />
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-700 mb-4">Top Cities</h3>
            <Table columns={cityColumns} data={topCities} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-700 mb-4">Device Distribution</h3>
          <div className="flex items-center gap-8">
            {deviceData.map(d => (
              <div key={d.device} className="flex-1">
                <div className="flex justify-between mb-2">
                  <span className="font-medium">{d.device}</span>
                  <span>{d.percentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div className="bg-blue-600 h-4 rounded-full" style={{ width: `${d.percentage}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-700 mb-2">Retention</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-600">7-Day Retention</span>
                  <span className="font-medium">{userStats.retentionDay7}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: `${userStats.retentionDay7}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-600">30-Day Retention</span>
                  <span className="font-medium">{userStats.retentionDay30}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${userStats.retentionDay30}%` }} />
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-700 mb-2">Avg Session Duration</h3>
            <p className="text-3xl font-bold text-gray-800">{userStats.avgSession}</p>
            <p className="text-sm text-gray-500 mt-1">+45s from last month</p>
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}
