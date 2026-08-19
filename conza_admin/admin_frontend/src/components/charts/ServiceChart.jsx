import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { mockServiceData } from '../../../mock/dashboard'

const COLORS = ['#F5C842', '#F0A500', '#2E8B57', '#3B82F6', '#E03B3B', '#6366F1']

export default function ServiceChart() {
  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={mockServiceData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={5}
            dataKey="value"
          >
            {mockServiceData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #E8E6DF', borderRadius: '8px' }} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
