import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { mockVendorGrowthData } from '../../../mock/dashboard'

export default function VendorGrowthChart() {
  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={mockVendorGrowthData}>
          <defs>
            <linearGradient id="colorVendors" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2E8B57" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#2E8B57" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E8E6DF" />
          <XAxis dataKey="month" stroke="#ABA89E" fontSize={12} />
          <YAxis stroke="#ABA89E" fontSize={12} />
          <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #E8E6DF', borderRadius: '8px' }} />
          <Area type="monotone" dataKey="count" stroke="#2E8B57" strokeWidth={2} fill="url(#colorVendors)" name="Vendors" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
