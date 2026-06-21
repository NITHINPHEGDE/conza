import { useParams } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import Breadcrumb from '../../components/layout/Breadcrumb/Breadcrumb'

const mockData = [
  { month: 'Jan', amount: 85000 },
  { month: 'Feb', amount: 92000 },
  { month: 'Mar', amount: 78000 },
  { month: 'Apr', amount: 105000 },
  { month: 'May', amount: 98000 },
  { month: 'Jun', amount: 112000 },
]

export default function VendorEarnings() {
  const { id } = useParams()

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Vendors', path: '/vendors' }, { label: 'Earnings' }]} />
      <h1 className="text-2xl font-bold text-textPrimary">Vendor Earnings</h1>
      <div className="bg-surface rounded-xl border border-border p-6">
        <h3 className="text-lg font-semibold text-textPrimary mb-4">Monthly Revenue</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={mockData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8E6DF" />
              <XAxis dataKey="month" stroke="#ABA89E" fontSize={12} />
              <YAxis stroke="#ABA89E" fontSize={12} tickFormatter={(v) => `₹${v/1000}k`} />
              <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #E8E6DF', borderRadius: '8px' }} formatter={(v) => [`₹${v.toLocaleString()}`, 'Revenue']} />
              <Bar dataKey="amount" fill="#2E8B57" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
