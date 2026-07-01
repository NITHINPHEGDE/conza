import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, User, Store, Package, DollarSign, Truck, Calendar } from 'lucide-react'
import orderService from '../../services/orderService'
import Button from '../../components/common/Button/Button'
import StatusBadge from '../../components/common/StatusBadge/StatusBadge'
import Breadcrumb from '../../components/layout/Breadcrumb/Breadcrumb'

export default function OrderDetails() {
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    orderService.getById(id).then((res) => {
      const doc = res.order
      if (doc) {
        setOrder({
          ...doc,
          id: doc._id,
          customer: doc.customer?.fullName || doc.customerName || 'N/A',
          vendor: doc.seller?.shopName || doc.seller?.name || 'N/A',
          type: doc.orderType,
          date: doc.createdAt,
          address: doc.customerAddress,
          items: Array.isArray(doc.items) ? doc.items : [],
        })
      }
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [id])

  const updateStatus = (status) => {
    orderService.updateStatus(id, status).then(() => setOrder({ ...order, status }))
  }

  if (loading) return <div className="text-center py-12 text-textMuted">Loading order...</div>
  if (!order) return <div className="text-center py-12 text-textMuted">Order not found</div>

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Orders', path: '/orders' }, { label: order.id }]} />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/orders"><Button variant="ghost" size="sm"><ArrowLeft size={18} /></Button></Link>
          <h1 className="text-2xl font-bold text-textPrimary">Order {order.id}</h1>
          <StatusBadge status={order.status} />
        </div>
        <div className="flex gap-2">
          {order.status === 'new' && <Button onClick={() => updateStatus('accepted')}>Accept</Button>}
          {order.status === 'accepted' && <Button onClick={() => updateStatus('out_for_delivery')}>Out for Delivery</Button>}
          {order.status === 'out_for_delivery' && <Button onClick={() => updateStatus('delivered')}>Mark Delivered</Button>}
          <Button variant="outline" onClick={() => updateStatus('cancelled')}>Cancel</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface rounded-xl border border-border p-6">
            <h3 className="text-lg font-semibold text-textPrimary mb-4">Order Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <User size={18} className="text-textMuted" />
                <div><p className="text-xs text-textMuted">Customer</p><p className="text-sm font-medium text-textPrimary">{order.customer}</p></div>
              </div>
              <div className="flex items-center gap-3">
                <Store size={18} className="text-textMuted" />
                <div><p className="text-xs text-textMuted">Vendor</p><p className="text-sm font-medium text-textPrimary">{order.vendor}</p></div>
              </div>
              <div className="flex items-center gap-3">
                <Truck size={18} className="text-textMuted" />
                <div><p className="text-xs text-textMuted">Type</p><p className="text-sm font-medium text-textPrimary capitalize">{order.type}</p></div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar size={18} className="text-textMuted" />
                <div><p className="text-xs text-textMuted">Date</p><p className="text-sm font-medium text-textPrimary">{new Date(order.date).toLocaleDateString()}</p></div>
              </div>
            </div>
          </div>

          <div className="bg-surface rounded-xl border border-border p-6">
            <h3 className="text-lg font-semibold text-textPrimary mb-4">Items</h3>
            <div className="space-y-3">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-surfaceElevated">
                  <div className="flex items-center gap-3">
                    <Package size={16} className="text-accentAmber" />
                    <div>
                      <p className="text-sm font-medium text-textPrimary">{item.title}</p>
                      <p className="text-xs text-textMuted">Qty: {item.qty}</p>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-textPrimary">₹{item.price * item.qty}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-surface rounded-xl border border-border p-6">
            <h3 className="text-lg font-semibold text-textPrimary mb-4">Order Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-textSecondary">Subtotal</span>
                <span className="font-medium text-textPrimary">₹{order.subtotal}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-textSecondary">Delivery</span>
                <span className="font-medium text-textPrimary">₹{order.deliveryCharge}</span>
              </div>
              <div className="border-t border-border pt-3 flex justify-between text-sm font-semibold">
                <span className="text-textPrimary">Total</span>
                <span className="text-textPrimary">₹{order.total}</span>
              </div>
            </div>
          </div>

          <div className="bg-surface rounded-xl border border-border p-6">
            <h3 className="text-lg font-semibold text-textPrimary mb-4">Actions</h3>
            <div className="space-y-2">
              <Link to={`/orders/tracking`}><Button variant="outline" className="w-full justify-start">Track Order</Button></Link>
              <Button variant="outline" className="w-full justify-start text-danger">Resolve Dispute</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
