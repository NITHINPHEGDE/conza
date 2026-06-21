import { Truck, Package, CheckCircle, MapPin } from 'lucide-react'
import Breadcrumb from '../../components/layout/Breadcrumb/Breadcrumb'

const trackingSteps = [
  { status: 'confirmed', label: 'Order Confirmed', completed: true, time: '2024-06-20 10:00 AM' },
  { status: 'packed', label: 'Packed', completed: true, time: '2024-06-20 11:30 AM' },
  { status: 'out_for_delivery', label: 'Out for Delivery', completed: true, time: '2024-06-20 02:00 PM' },
  { status: 'delivered', label: 'Delivered', completed: false, time: null },
]

export default function OrderTracking() {
  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Orders', path: '/orders' }, { label: 'Tracking' }]} />
      <h1 className="text-2xl font-bold text-textPrimary">Order Tracking</h1>

      <div className="bg-surface rounded-xl border border-border p-6">
        <div className="relative">
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />
          <div className="space-y-8">
            {trackingSteps.map((step, idx) => (
              <div key={step.status} className="relative flex items-start gap-6">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center z-10 ${step.completed ? 'bg-accentYellow' : 'bg-surfaceElevated border-2 border-border'}`}>
                  {step.status === 'confirmed' && <Package size={20} className={step.completed ? 'text-white' : 'text-textMuted'} />}
                  {step.status === 'packed' && <CheckCircle size={20} className={step.completed ? 'text-white' : 'text-textMuted'} />}
                  {step.status === 'out_for_delivery' && <Truck size={20} className={step.completed ? 'text-white' : 'text-textMuted'} />}
                  {step.status === 'delivered' && <MapPin size={20} className={step.completed ? 'text-white' : 'text-textMuted'} />}
                </div>
                <div className="flex-1 pt-2">
                  <p className={`font-medium ${step.completed ? 'text-textPrimary' : 'text-textMuted'}`}>{step.label}</p>
                  {step.time && <p className="text-xs text-textMuted mt-1">{step.time}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
