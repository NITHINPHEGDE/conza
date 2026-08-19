import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

export default function UserGrowthChart({ data = [] }) {
  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E8E6DF" />
          <XAxis dataKey="month" stroke="#ABA89E" fontSize={12} />
          <YAxis stroke="#ABA89E" fontSize={12} />
          <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #E8E6DF', borderRadius: '8px' }} />
          <Legend />
          <Line type="monotone" dataKey="customers" stroke="#3B82F6" strokeWidth={2} dot={false} name="Customers" />
          <Line type="monotone" dataKey="workers" stroke="#F5C842" strokeWidth={2} dot={false} name="Workers" />
          <Line type="monotone" dataKey="vendors" stroke="#2E8B57" strokeWidth={2} dot={false} name="Vendors" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
