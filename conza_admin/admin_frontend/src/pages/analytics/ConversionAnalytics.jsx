import { useState } from 'react'
import PageWrapper from '../../components/layout/PageWrapper/PageWrapper'
import ServiceChart from '../../components/charts/ServiceChart/ServiceChart'
import Table from '../../components/common/Table/Table'
import Select from '../../components/common/Select/Select'

const conversionStats = {
  visitorToSignup: 24.5,
  signupToBooking: 42.0,
  bookingToComplete: 84.0,
  overallConversion: 8.6,
  cartAbandonment: 35.2,
  bounceRate: 42.0
}

const funnelStages = [
  { stage: 'Visitors', count: 100000, dropOff: 0 },
  { stage: 'Signups', count: 24500, dropOff: 75.5 },
  { stage: 'Active Users', count: 18400, dropOff: 24.9 },
  { stage: 'Bookings', count: 10290, dropOff: 44.1 },
  { stage: 'Completed', count: 8640, dropOff: 16.0 }
]

const channelPerformance = [
  { channel: 'Organic Search', visitors: 35000, conversions: 3150, rate: 9.0 },
  { channel: 'Social Media', visitors: 28000, conversions: 1960, rate: 7.0 },
  { channel: 'Referral', visitors: 15000, conversions: 1800, rate: 12.0 },
  { channel: 'Paid Ads', visitors: 12000, conversions: 960, rate: 8.0 },
  { channel: 'Direct', visitors: 10000, conversions: 730, rate: 7.3 }
]

export default function ConversionAnalytics() {
  const [period, setPeriod] = useState('30d')

  const funnelColumns = [
    { key: 'stage', label: 'Stage' },
    { key: 'count', label: 'Users', render: (row) => row.count.toLocaleString() },
    { key: 'dropOff', label: 'Drop-off', render: (row) => row.dropOff > 0 ? `${row.dropOff}%` : '-' }
  ]

  const channelColumns = [
    { key: 'channel', label: 'Channel' },
    { key: 'visitors', label: 'Visitors', render: (row) => row.visitors.toLocaleString() },
    { key: 'conversions', label: 'Conversions', render: (row) => row.conversions.toLocaleString() },
    { key: 'rate', label: 'Rate', render: (row) => `${row.rate}%` }
  ]

  return (
    <PageWrapper title="Conversion Analytics" subtitle="Funnel analysis and conversion rates">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Select value={period} onChange={(e) => setPeriod(e.target.value)} options={[
            { value: '7d', label: 'Last 7 Days' },
            { value: '30d', label: 'Last 30 Days' },
            { value: '90d', label: 'Last 90 Days' },
            { value: '1y', label: 'Last Year' }
          ]} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { label: 'Visitor → Signup', value: `${conversionStats.visitorToSignup}%` },
            { label: 'Signup → Booking', value: `${conversionStats.signupToBooking}%` },
            { label: 'Booking → Complete', value: `${conversionStats.bookingToComplete}%` },
            { label: 'Overall Conversion', value: `${conversionStats.overallConversion}%` },
            { label: 'Cart Abandonment', value: `${conversionStats.cartAbandonment}%`, negative: true },
            { label: 'Bounce Rate', value: `${conversionStats.bounceRate}%`, negative: true }
          ].map((stat, i) => (
            <div key={i} className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-700 mb-4">Service Demand</h3>
          <ServiceChart />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-700 mb-4">Conversion Funnel</h3>
            <div className="space-y-4 mb-4">
              {funnelStages.map((stage, i) => (
                <div key={stage.stage} className="relative">
                  <div className="flex justify-between mb-1">
                    <span className="font-medium">{stage.stage}</span>
                    <span>{stage.count.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-8">
                    <div className="bg-blue-600 h-8 rounded-full flex items-center justify-end pr-2 text-white text-sm" style={{ width: `${(stage.count / 100000) * 100}%` }}>
                      {((stage.count / 100000) * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Table columns={funnelColumns} data={funnelStages} />
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-700 mb-4">Channel Performance</h3>
            <Table columns={channelColumns} data={channelPerformance} />
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}
