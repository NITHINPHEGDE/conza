import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { mockBookingData } from '../../../mock/dashboard'

export default function BookingChart() {
  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={mockBookingData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E8E6DF" />
          <XAxis dataKey="name" stroke="#ABA89E" fontSize={12} />
          <YAxis stroke="#ABA89E" fontSize={12} />
          <Tooltip
            contentStyle={{ backgroundColor: '#fff', border: '1px solid #E8E6DF', borderRadius: '8px' }}
          />
          <Bar dataKey="completed" fill="#2E8B57" radius={[4, 4, 0, 0]} name="Completed" />
          <Bar dataKey="pending" fill="#F5C842" radius={[4, 4, 0, 0]} name="Pending" />
          <Bar dataKey="cancelled" fill="#E03B3B" radius={[4, 4, 0, 0]} name="Cancelled" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
