import { useParams } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import Breadcrumb from '../../components/layout/Breadcrumb/Breadcrumb'

const mockEarnings = [
  { month: 'Jan', amount: 25000 },
  { month: 'Feb', amount: 28000 },
  { month: 'Mar', amount: 32000 },
  { month: 'Apr', amount: 30000 },
  { month: 'May', amount: 35000 },
  { month: 'Jun', amount: 45000 },
]

export default function WorkerEarnings() {
  const { id } = useParams()

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Workers', path: '/workers' }, { label: 'Earnings' }]} />
      <h1 className="text-2xl font-bold text-textPrimary">Worker Earnings</h1>
      
      <div className="bg-surface rounded-xl border border-border p-6">
        <h3 className="text-lg font-semibold text-textPrimary mb-4">Monthly Earnings</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={mockEarnings}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8E6DF" />
              <XAxis dataKey="month" stroke="#ABA89E" fontSize={12} />
              <YAxis stroke="#ABA89E" fontSize={12} tickFormatter={(v) => `₹${v/1000}k`} />
              <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #E8E6DF', borderRadius: '8px' }} formatter={(v) => [`₹${v.toLocaleString()}`, 'Earnings']} />
              <Bar dataKey="amount" fill="#F5C842" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
