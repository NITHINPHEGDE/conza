import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { mockRevenueData } from '../../../mock/dashboard'

export default function RevenueChart() {
  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={mockRevenueData}>
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#F5C842" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#F5C842" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E8E6DF" />
          <XAxis dataKey="name" stroke="#ABA89E" fontSize={12} />
          <YAxis stroke="#ABA89E" fontSize={12} tickFormatter={(v) => `₹${v/1000}k`} />
          <Tooltip
            contentStyle={{ backgroundColor: '#fff', border: '1px solid #E8E6DF', borderRadius: '8px' }}
            formatter={(v) => [`₹${v.toLocaleString()}`, 'Revenue']}
          />
          <Area type="monotone" dataKey="value" stroke="#F5C842" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
