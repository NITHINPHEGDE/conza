import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import Breadcrumb from '../../components/layout/Breadcrumb/Breadcrumb'

const turnoverData = [
  { category: 'Cement', turnover: 85 },
  { category: 'Steel', turnover: 72 },
  { category: 'Blocks', turnover: 65 },
  { category: 'Sand', turnover: 58 },
  { category: 'Paint', turnover: 45 },
  { category: 'Tiles', turnover: 38 },
]

const categoryData = [
  { name: 'Cement', value: 1200 },
  { name: 'Steel', value: 980 },
  { name: 'Blocks', value: 750 },
  { name: 'Sand', value: 520 },
  { name: 'Paint', value: 480 },
  { name: 'Others', value: 637 },
]

const COLORS = ['#F5C842', '#F0A500', '#2E8B57', '#3B82F6', '#E03B3B', '#6366F1']

export default function InventoryAnalytics() {
  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Inventory', path: '/inventory' }, { label: 'Analytics' }]} />
      <h1 className="text-2xl font-bold text-textPrimary">Inventory Analytics</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface rounded-xl border border-border p-6">
          <h3 className="text-lg font-semibold text-textPrimary mb-4">Turnover by Category</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={turnoverData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8E6DF" />
                <XAxis dataKey="category" stroke="#ABA89E" fontSize={12} />
                <YAxis stroke="#ABA89E" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #E8E6DF', borderRadius: '8px' }} />
                <Bar dataKey="turnover" fill="#F5C842" radius={[4, 4, 0, 0]} name="Turnover %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-surface rounded-xl border border-border p-6">
          <h3 className="text-lg font-semibold text-textPrimary mb-4">Stock Distribution</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label>
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #E8E6DF', borderRadius: '8px' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
