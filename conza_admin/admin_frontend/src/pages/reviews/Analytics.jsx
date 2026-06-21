import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import Breadcrumb from '../../components/layout/Breadcrumb/Breadcrumb'

const ratingDistribution = [
  { rating: '5 Star', count: 450 },
  { rating: '4 Star', count: 320 },
  { rating: '3 Star', count: 180 },
  { rating: '2 Star', count: 85 },
  { rating: '1 Star', count: 45 },
]

const categoryRatings = [
  { name: 'Plumber', rating: 4.8 },
  { name: 'Electrician', rating: 4.7 },
  { name: 'Carpenter', rating: 4.6 },
  { name: 'Mason', rating: 4.5 },
  { name: 'Painter', rating: 4.4 },
  { name: 'Builder', rating: 4.3 },
]

const COLORS = ['#F5C842', '#F0A500', '#2E8B57', '#3B82F6', '#E03B3B']

export default function Analytics() {
  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Reviews' }, { label: 'Analytics' }]} />
      <h1 className="text-2xl font-bold text-textPrimary">Review Analytics</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface rounded-xl border border-border p-6">
          <h3 className="text-lg font-semibold text-textPrimary mb-4">Rating Distribution</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ratingDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8E6DF" />
                <XAxis dataKey="rating" stroke="#ABA89E" fontSize={12} />
                <YAxis stroke="#ABA89E" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #E8E6DF', borderRadius: '8px' }} />
                <Bar dataKey="count" fill="#F5C842" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-surface rounded-xl border border-border p-6">
          <h3 className="text-lg font-semibold text-textPrimary mb-4">Category Ratings</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryRatings} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#E8E6DF" />
                <XAxis type="number" domain={[0, 5]} stroke="#ABA89E" fontSize={12} />
                <YAxis dataKey="name" type="category" stroke="#ABA89E" fontSize={12} width={80} />
                <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #E8E6DF', borderRadius: '8px' }} />
                <Bar dataKey="rating" fill="#2E8B57" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
