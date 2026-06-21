import { useState } from 'react'
import { TrendingUp, Wallet, Users, Store } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import useFinanceStore from '../../store/finance/useFinanceStore'
import Breadcrumb from '../../components/layout/Breadcrumb/Breadcrumb'

const mockRevenueByPeriod = {
  daily: [
    { label: 'Mon', total: 180000, vendor: 72000, worker: 90000, platform: 18000 },
    { label: 'Tue', total: 220000, vendor: 88000, worker: 110000, platform: 22000 },
    { label: 'Wed', total: 195000, vendor: 78000, worker: 97500, platform: 19500 },
    { label: 'Thu', total: 245000, vendor: 98000, worker: 122500, platform: 24500 },
    { label: 'Fri', total: 280000, vendor: 112000, worker: 140000, platform: 28000 },
    { label: 'Sat', total: 310000, vendor: 124000, worker: 155000, platform: 31000 },
    { label: 'Sun', total: 268000, vendor: 107200, worker: 134000, platform: 26800 },
  ],
  weekly: [
    { label: 'Week 1', total: 1250000, vendor: 500000, worker: 625000, platform: 125000 },
    { label: 'Week 2', total: 1380000, vendor: 552000, worker: 690000, platform: 138000 },
    { label: 'Week 3', total: 1420000, vendor: 568000, worker: 710000, platform: 142000 },
    { label: 'Week 4', total: 1560000, vendor: 624000, worker: 780000, platform: 156000 },
    { label: 'Week 5', total: 1720000, vendor: 688000, worker: 860000, platform: 172000 },
  ],
  monthly: [
    { label: 'Jan', total: 5200000, vendor: 2080000, worker: 2600000, platform: 520000 },
    { label: 'Feb', total: 5800000, vendor: 2320000, worker: 2900000, platform: 580000 },
    { label: 'Mar', total: 6200000, vendor: 2480000, worker: 3100000, platform: 620000 },
    { label: 'Apr', total: 6900000, vendor: 2760000, worker: 3450000, platform: 690000 },
    { label: 'May', total: 7380000, vendor: 2952000, worker: 3690000, platform: 738000 },
  ],
  yearly: [
    { label: '2021', total: 42000000, vendor: 16800000, worker: 21000000, platform: 4200000 },
    { label: '2022', total: 52000000, vendor: 20800000, worker: 26000000, platform: 5200000 },
    { label: '2023', total: 62000000, vendor: 24800000, worker: 31000000, platform: 6200000 },
    { label: '2024', total: 73800000, vendor: 29520000, worker: 36900000, platform: 7380000 },
  ],
}

export default function Revenue() {
  const { period, setPeriod } = useFinanceStore()
  const data = mockRevenueByPeriod[period] || mockRevenueByPeriod.monthly

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Finance', path: '/finance/revenue' }, { label: 'Revenue' }]} />
      <h1 className="text-2xl font-bold text-textPrimary">Revenue</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-surface rounded-xl border border-border p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-textMuted">Total Revenue</p>
              <p className="text-2xl font-bold text-textPrimary">₹73.8L</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-accentYellow flex items-center justify-center">
              <TrendingUp size={20} className="text-white" />
            </div>
          </div>
        </div>
        <div className="bg-surface rounded-xl border border-border p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-textMuted">Vendor Revenue</p>
              <p className="text-2xl font-bold text-textPrimary">₹29.5L</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center">
              <Store size={20} className="text-white" />
            </div>
          </div>
        </div>
        <div className="bg-surface rounded-xl border border-border p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-textMuted">Worker Revenue</p>
              <p className="text-2xl font-bold text-textPrimary">₹36.9L</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
              <Users size={20} className="text-white" />
            </div>
          </div>
        </div>
        <div className="bg-surface rounded-xl border border-border p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-textMuted">Platform Commission</p>
              <p className="text-2xl font-bold text-textPrimary">₹7.4L</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-purple-500 flex items-center justify-center">
              <Wallet size={20} className="text-white" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-surface rounded-xl border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-textPrimary">Revenue Breakdown</h3>
          <div className="flex gap-2">
            {['daily', 'weekly', 'monthly', 'yearly'].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${period === p ? 'bg-accentYellow text-white' : 'bg-surfaceElevated text-textSecondary hover:bg-border'}`}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8E6DF" />
              <XAxis dataKey="label" stroke="#ABA89E" fontSize={12} />
              <YAxis stroke="#ABA89E" fontSize={12} tickFormatter={(v) => `₹${v/1000}k`} />
              <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #E8E6DF', borderRadius: '8px' }} />
              <Bar dataKey="vendor" fill="#2E8B57" radius={[4, 4, 0, 0]} name="Vendor" />
              <Bar dataKey="worker" fill="#F5C842" radius={[4, 4, 0, 0]} name="Worker" />
              <Bar dataKey="platform" fill="#6366F1" radius={[4, 4, 0, 0]} name="Platform" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
