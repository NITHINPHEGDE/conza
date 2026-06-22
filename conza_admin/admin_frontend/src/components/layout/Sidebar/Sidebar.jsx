import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Users, HardHat, Store, Package, Truck, Boxes,
  Handshake, CalendarCheck, ShoppingCart, Wrench, Wallet, CreditCard,
  Map, Bell, TicketCheck, Star, Gift, FileText, BarChart3, ShieldCheck,
  ScrollText, ChevronDown, ChevronRight, Menu, X, DollarSign
} from 'lucide-react'
import useAuthStore from '../../../store/auth/useAuthStore'

const menuGroups = [
  {
    title: 'Main',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    ]
  },
  {
    title: 'Users',
    items: [
      { icon: Users, label: 'Customers', path: '/customers' },
      { icon: HardHat, label: 'Workers', path: '/workers' },
      { icon: Store, label: 'Vendors', path: '/vendors' },
      { icon: Handshake, label: 'Business Partners', path: '/business-partners' },
    ]
  },
  {
    title: 'Operations',
    items: [
      { icon: CalendarCheck, label: 'Bookings', path: '/bookings', children: [
        { label: 'Labour', path: '/bookings/labour' },
        { label: 'Materials', path: '/bookings/materials' },
        { label: 'Rentals', path: '/bookings/rentals' },
      ]},
      { icon: ShoppingCart, label: 'Orders', path: '/orders' },
      { icon: Map, label: 'Live Tracking', path: '/maps/live-tracking' },
    ]
  },
  {
    title: 'Catalog',
    items: [
      { icon: Package, label: 'Materials', path: '/materials' },
      { icon: Truck, label: 'Rentals', path: '/rentals' },
      { icon: Boxes, label: 'Inventory', path: '/inventory' },
      { icon: Wrench, label: 'Services', path: '/services' },
    ]
  },
  {
    title: 'Finance',
    items: [
      { icon: BarChart3, label: 'Revenue', path: '/finance/revenue' },
      { icon: CreditCard, label: 'Transactions', path: '/finance/transactions' },
      { icon: Wallet, label: 'Payouts', path: '/finance/payouts' },
      { icon: ScrollText, label: 'Reports', path: '/finance/reports' },
      { icon: Gift, label: 'Commissions', path: '/finance/commissions' },
      { icon: DollarSign, label: 'Pricing', path: '/pricing-management' },
    ]
  },
  {
    title: 'Payments',
    items: [
      { icon: CreditCard, label: 'Razorpay', path: '/payments/razorpay' },
      { icon: CreditCard, label: 'UPI', path: '/payments/upi' },
      { icon: CreditCard, label: 'Failed', path: '/payments/failed' },
      { icon: CreditCard, label: 'Refunds', path: '/payments/refunds' },
      { icon: CreditCard, label: 'Cash', path: '/payments/cash' },
    ]
  },
  {
    title: 'Wallets',
    items: [
      { icon: Wallet, label: 'Customers', path: '/wallets/customers' },
      { icon: Wallet, label: 'Workers', path: '/wallets/workers' },
      { icon: Wallet, label: 'Vendors', path: '/wallets/vendors' },
      { icon: Wallet, label: 'BP Wallets', path: '/wallets/business-partners' },
    ]
  },
  {
    title: 'Engagement',
    items: [
      { icon: Bell, label: 'Notifications', path: '/notifications/push' },
      { icon: TicketCheck, label: 'Complaints', path: '/complaints' },
      { icon: Star, label: 'Reviews', path: '/reviews/workers' },
      { icon: Gift, label: 'Promotions', path: '/promotions/coupons' },
    ]
  },
  {
    title: 'Content',
    items: [
      { icon: FileText, label: 'FAQs', path: '/content/faqs' },
      { icon: FileText, label: 'Terms', path: '/content/terms' },
      { icon: FileText, label: 'Privacy', path: '/content/privacy' },
      { icon: FileText, label: 'About Us', path: '/content/about' },
      { icon: FileText, label: 'Help Center', path: '/content/help' },
      { icon: FileText, label: 'Banners', path: '/content/banners' },
    ]
  },
  {
    title: 'Analytics',
    items: [
      { icon: BarChart3, label: 'Users', path: '/analytics/users' },
      { icon: BarChart3, label: 'Revenue', path: '/analytics/revenue' },
      { icon: BarChart3, label: 'Bookings', path: '/analytics/bookings' },
      { icon: BarChart3, label: 'Vendors', path: '/analytics/vendors' },
      { icon: BarChart3, label: 'Conversion', path: '/analytics/conversion' },
    ]
  },
  {
    title: 'Administration',
    items: [
      { icon: ShieldCheck, label: 'Roles', path: '/roles' },
      { icon: Users, label: 'Admin Management', path: '/admin-management' },
      { icon: ScrollText, label: 'Audit Logs', path: '/audit-logs' },
    ]
  },
]

export default function Sidebar({ open, setOpen }) {
  const [expandedGroups, setExpandedGroups] = useState(() => {
    const initial = {}
    menuGroups.forEach((_, i) => { initial[i] = true })
    return initial
  })
  const location = useLocation()
  const logout = useAuthStore((s) => s.logout)

  const toggleGroup = (idx) => {
    setExpandedGroups((prev) => ({ ...prev, [idx]: !prev[idx] }))
  }

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed top-4 left-4 z-50 p-2 bg-surface rounded-lg shadow-md lg:hidden"
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      <aside className={`fixed top-0 left-0 h-full bg-surface border-r border-border z-40 transition-all duration-300 flex flex-col ${open ? 'w-64' : 'w-16'} ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        {/* Logo - Fixed */}
        <div className="p-4 flex items-center gap-3 border-b border-border flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-accentYellow flex items-center justify-center">
            <span className="text-white font-bold text-sm">CZ</span>
          </div>
          {open && <span className="font-semibold text-textPrimary">Conza Admin</span>}
        </div>

        {/* Nav - Scrollable */}
        <nav className="flex-1 overflow-y-auto p-2 space-y-1 min-h-0">
          {menuGroups.map((group, gIdx) => (
            <div key={group.title}>
              {open && (
                <button
                  onClick={() => toggleGroup(gIdx)}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-textMuted uppercase tracking-wider hover:text-textSecondary transition-colors"
                >
                  <span>{group.title}</span>
                  {expandedGroups[gIdx] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>
              )}
              {(!open || expandedGroups[gIdx]) && (
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/')
                    const hasChildren = item.children && item.children.length > 0
                    const isChildActive = hasChildren && item.children.some(c => location.pathname === c.path || location.pathname.startsWith(c.path + '/'))
                    const [subOpen, setSubOpen] = useState(isChildActive)

                    return (
                      <div key={item.path}>
                        <NavLink
                          to={item.path}
                          className={({ isActive: navActive }) =>
                            `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${navActive || isChildActive ? 'bg-accentYellowSoft text-accentAmber font-medium' : 'text-textSecondary hover:bg-surfaceElevated hover:text-textPrimary'}`
                          }
                          title={!open ? item.label : ''}
                        >
                          <item.icon size={18} className={isActive || isChildActive ? 'text-accentAmber' : 'text-textMuted'} />
                          {open && (
                            <>
                              <span className="flex-1">{item.label}</span>
                              {hasChildren && (
                                <button
                                  onClick={(e) => { e.preventDefault(); setSubOpen(!subOpen) }}
                                  className="p-0.5 hover:bg-surfaceElevated rounded"
                                >
                                  {subOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                </button>
                              )}
                            </>
                          )}
                        </NavLink>
                        {open && hasChildren && subOpen && (
                          <div className="ml-8 mt-1 space-y-0.5">
                            {item.children.map((child) => {
                              const childActive = location.pathname === child.path || location.pathname.startsWith(child.path + '/')
                              return (
                                <NavLink
                                  key={child.path}
                                  to={child.path}
                                  className={({ isActive: navActive }) =>
                                    `block px-3 py-1.5 rounded-md text-sm transition-colors ${navActive ? 'text-accentAmber font-medium bg-accentYellowSoft/50' : 'text-textSecondary hover:text-textPrimary hover:bg-surfaceElevated'}`
                                  }
                                >
                                  {child.label}
                                </NavLink>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Logout - Fixed at bottom */}
        <div className="flex-shrink-0 p-2 border-t border-border bg-surface">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-danger hover:bg-red-50 transition-colors"
            title={!open ? 'Logout' : ''}
          >
            <span className="text-lg">🚪</span>
            {open && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {open && (
        <div
          className="fixed inset-0 bg-black/20 z-30 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}
    </>
  )
}
