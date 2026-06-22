import { Routes, Route } from 'react-router-dom'
import AdminLayout from '../layouts/AdminLayout'
import AuthLayout from '../layouts/AuthLayout'
import ProtectedRoute from './ProtectedRoute'
import RoleRoute from './RoleRoute'

import Login from '../pages/auth/Login'
import ForgotPassword from '../pages/auth/ForgotPassword'
import ResetPassword from '../pages/auth/ResetPassword'

import Dashboard from '../pages/dashboard/Dashboard'

import CustomerList from '../pages/customers/CustomerList'
import CustomerDetails from '../pages/customers/CustomerDetails'
import CustomerBookings from '../pages/customers/CustomerBookings'
import CustomerPayments from '../pages/customers/CustomerPayments'
import CustomerComplaints from '../pages/customers/CustomerComplaints'

import WorkerList from '../pages/workers/WorkerList'
import WorkerDetails from '../pages/workers/WorkerDetails'
import WorkerVerification from '../pages/workers/WorkerVerification'
import WorkerRatings from '../pages/workers/WorkerRatings'
import WorkerEarnings from '../pages/workers/WorkerEarnings'
import WorkerTracking from '../pages/workers/WorkerTracking'

import VendorList from '../pages/vendors/VendorList'
import VendorDetails from '../pages/vendors/VendorDetails'
import VendorVerification from '../pages/vendors/VendorVerification'
import VendorOrders from '../pages/vendors/VendorOrders'
import VendorEarnings from '../pages/vendors/VendorEarnings'
import VendorReviews from '../pages/vendors/VendorReviews'

import MaterialList from '../pages/materials/MaterialList'
import MaterialDetails from '../pages/materials/MaterialDetails'
import MaterialCategories from '../pages/materials/MaterialCategories'
import FeaturedProducts from '../pages/materials/FeaturedProducts'

import RentalList from '../pages/rentals/RentalList'
import RentalDetails from '../pages/rentals/RentalDetails'
import RentalCategories from '../pages/rentals/RentalCategories'
import FeaturedRentals from '../pages/rentals/FeaturedRentals'

import InventoryOverview from '../pages/inventory/InventoryOverview'
import LowStock from '../pages/inventory/LowStock'
import OutOfStock from '../pages/inventory/OutOfStock'
import InventoryAnalytics from '../pages/inventory/InventoryAnalytics'

import BPList from '../pages/businessPartners/BPList'
import BPDetails from '../pages/businessPartners/BPDetails'
import BPReferrals from '../pages/businessPartners/BPReferrals'
import BPCommissions from '../pages/businessPartners/BPCommissions'
import BPTerritories from '../pages/businessPartners/BPTerritories'

import BookingList from '../pages/bookings/BookingList'
import BookingDetails from '../pages/bookings/BookingDetails'
import BookingTimeline from '../pages/bookings/BookingTimeline'
import Disputes from '../pages/bookings/Disputes'
import LabourBookings from '../pages/bookings/LabourBookings'
import MaterialBookings from '../pages/bookings/MaterialBookings'
import RentalBookings from '../pages/bookings/RentalBookings'

import OrderList from '../pages/orders/OrderList'
import OrderDetails from '../pages/orders/OrderDetails'
import OrderTracking from '../pages/orders/OrderTracking'
import OrderDisputes from '../pages/orders/OrderDisputes'

import Categories from '../pages/services/Categories'
import AddCategory from '../pages/services/AddCategory'
import EditCategory from '../pages/services/EditCategory'

import Revenue from '../pages/finance/Revenue'
import Transactions from '../pages/finance/Transactions'
import Payouts from '../pages/finance/Payouts'
import Reports from '../pages/finance/Reports'
import Commissions from '../pages/finance/Commissions'

import CustomerWallets from '../pages/wallets/CustomerWallets'
import WorkerWallets from '../pages/wallets/WorkerWallets'
import VendorWallets from '../pages/wallets/VendorWallets'
import BPWallets from '../pages/wallets/BPWallets'

import RazorpayPayments from '../pages/payments/RazorpayPayments'
import FailedPayments from '../pages/payments/FailedPayments'
import RefundRequests from '../pages/payments/RefundRequests'
import CashPayments from '../pages/payments/CashPayments'
import UPIPayments from '../pages/payments/UPIPayments'

import LiveTracking from '../pages/maps/LiveTracking'

import PushNotifications from '../pages/notifications/PushNotifications'
import SMSNotifications from '../pages/notifications/SMSNotifications'
import EmailNotifications from '../pages/notifications/EmailNotifications'
import NotificationHistory from '../pages/notifications/NotificationHistory'

import Tickets from '../pages/complaints/Tickets'
import Complaints from '../pages/complaints/Complaints'
import Escalations from '../pages/complaints/Escalations'
import RefundCases from '../pages/complaints/RefundCases'

import WorkerReviews from '../pages/reviews/WorkerReviews'
import VendorReviewsPage from '../pages/reviews/VendorReviews'
import ProductReviews from '../pages/reviews/ProductReviews'
import Analytics from '../pages/reviews/Analytics'

import Coupons from '../pages/promotions/Coupons'
import Cashback from '../pages/promotions/Cashback'
import Referrals from '../pages/promotions/Referrals'
import SeasonalOffers from '../pages/promotions/SeasonalOffers'

import FAQs from '../pages/content/FAQs'
import Terms from '../pages/content/Terms'
import Privacy from '../pages/content/Privacy'
import AboutUs from '../pages/content/AboutUs'
import HelpCenter from '../pages/content/HelpCenter'
import Banners from '../pages/content/Banners'

import UserAnalytics from '../pages/analytics/UserAnalytics'
import RevenueAnalytics from '../pages/analytics/RevenueAnalytics'
import BookingAnalytics from '../pages/analytics/BookingAnalytics'
import VendorAnalytics from '../pages/analytics/VendorAnalytics'
import ConversionAnalytics from '../pages/analytics/ConversionAnalytics'

import RoleManagement from '../pages/roles/RoleManagement'
import Permissions from '../pages/roles/Permissions'
import AdminManagement from '../pages/admin/AdminManagement'
import PricingManagement from '../pages/pricing/PricingManagement'

import AuditLogs from '../pages/auditLogs/AuditLogs'
import LoginHistory from '../pages/auditLogs/LoginHistory'
import AdminActions from '../pages/auditLogs/AdminActions'

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />

          <Route path="/customers" element={<CustomerList />} />
          <Route path="/customers/:id" element={<CustomerDetails />} />
          <Route path="/customers/:id/bookings" element={<CustomerBookings />} />
          <Route path="/customers/:id/payments" element={<CustomerPayments />} />
          <Route path="/customers/:id/complaints" element={<CustomerComplaints />} />

          <Route path="/workers" element={<WorkerList />} />
          <Route path="/workers/:id" element={<WorkerDetails />} />
          <Route path="/workers/verification" element={<WorkerVerification />} />
          <Route path="/workers/ratings" element={<WorkerRatings />} />
          <Route path="/workers/earnings" element={<WorkerEarnings />} />
          <Route path="/workers/tracking" element={<WorkerTracking />} />

          <Route path="/vendors" element={<VendorList />} />
          <Route path="/vendors/:id" element={<VendorDetails />} />
          <Route path="/vendors/verification" element={<VendorVerification />} />
          <Route path="/vendors/:id/orders" element={<VendorOrders />} />
          <Route path="/vendors/:id/earnings" element={<VendorEarnings />} />
          <Route path="/vendors/:id/reviews" element={<VendorReviews />} />

          <Route path="/materials" element={<MaterialList />} />
          <Route path="/materials/:id" element={<MaterialDetails />} />
          <Route path="/materials/categories" element={<MaterialCategories />} />
          <Route path="/materials/featured" element={<FeaturedProducts />} />

          <Route path="/rentals" element={<RentalList />} />
          <Route path="/rentals/:id" element={<RentalDetails />} />
          <Route path="/rentals/categories" element={<RentalCategories />} />
          <Route path="/rentals/featured" element={<FeaturedRentals />} />

          <Route path="/inventory" element={<InventoryOverview />} />
          <Route path="/inventory/low-stock" element={<LowStock />} />
          <Route path="/inventory/out-of-stock" element={<OutOfStock />} />
          <Route path="/inventory/analytics" element={<InventoryAnalytics />} />

          <Route path="/business-partners" element={<BPList />} />
          <Route path="/business-partners/:id" element={<BPDetails />} />
          <Route path="/business-partners/:id/referrals" element={<BPReferrals />} />
          <Route path="/business-partners/:id/commissions" element={<BPCommissions />} />
          <Route path="/business-partners/territories" element={<BPTerritories />} />

          <Route path="/bookings" element={<BookingList />} />
          <Route path="/bookings/:id" element={<BookingDetails />} />
          <Route path="/bookings/:id/timeline" element={<BookingTimeline />} />
          <Route path="/bookings/disputes" element={<Disputes />} />
          <Route path="/bookings/labour" element={<LabourBookings />} />
          <Route path="/bookings/materials" element={<MaterialBookings />} />
          <Route path="/bookings/rentals" element={<RentalBookings />} />

          <Route path="/orders" element={<OrderList />} />
          <Route path="/orders/:id" element={<OrderDetails />} />
          <Route path="/orders/tracking" element={<OrderTracking />} />
          <Route path="/orders/disputes" element={<OrderDisputes />} />

          <Route path="/services" element={<Categories />} />
          <Route path="/services/add" element={<AddCategory />} />
          <Route path="/services/edit/:id" element={<EditCategory />} />

          <Route path="/finance/revenue" element={<Revenue />} />
          <Route path="/finance/transactions" element={<Transactions />} />
          <Route path="/finance/payouts" element={<Payouts />} />
          <Route path="/finance/reports" element={<Reports />} />
          <Route path="/finance/commissions" element={<Commissions />} />

          <Route path="/wallets/customers" element={<CustomerWallets />} />
          <Route path="/wallets/workers" element={<WorkerWallets />} />
          <Route path="/wallets/vendors" element={<VendorWallets />} />
          <Route path="/wallets/business-partners" element={<BPWallets />} />

          <Route path="/payments/razorpay" element={<RazorpayPayments />} />
          <Route path="/payments/failed" element={<FailedPayments />} />
          <Route path="/payments/refunds" element={<RefundRequests />} />
          <Route path="/payments/cash" element={<CashPayments />} />
          <Route path="/payments/upi" element={<UPIPayments />} />

          <Route path="/maps/live-tracking" element={<LiveTracking />} />

          <Route path="/notifications/push" element={<PushNotifications />} />
          <Route path="/notifications/sms" element={<SMSNotifications />} />
          <Route path="/notifications/email" element={<EmailNotifications />} />
          <Route path="/notifications/history" element={<NotificationHistory />} />

          <Route path="/complaints/tickets" element={<Tickets />} />
          <Route path="/complaints" element={<Complaints />} />
          <Route path="/complaints/escalations" element={<Escalations />} />
          <Route path="/complaints/refunds" element={<RefundCases />} />

          <Route path="/reviews/workers" element={<WorkerReviews />} />
          <Route path="/reviews/vendors" element={<VendorReviewsPage />} />
          <Route path="/reviews/products" element={<ProductReviews />} />
          <Route path="/reviews/analytics" element={<Analytics />} />

          <Route path="/promotions/coupons" element={<Coupons />} />
          <Route path="/promotions/cashback" element={<Cashback />} />
          <Route path="/promotions/referrals" element={<Referrals />} />
          <Route path="/promotions/seasonal" element={<SeasonalOffers />} />

          <Route path="/content/faqs" element={<FAQs />} />
          <Route path="/content/terms" element={<Terms />} />
          <Route path="/content/privacy" element={<Privacy />} />
          <Route path="/content/about" element={<AboutUs />} />
          <Route path="/content/help" element={<HelpCenter />} />
          <Route path="/content/banners" element={<Banners />} />

          <Route path="/analytics/users" element={<UserAnalytics />} />
          <Route path="/analytics/revenue" element={<RevenueAnalytics />} />
          <Route path="/analytics/bookings" element={<BookingAnalytics />} />
          <Route path="/analytics/vendors" element={<VendorAnalytics />} />
          <Route path="/analytics/conversion" element={<ConversionAnalytics />} />

          <Route path="/roles" element={<RoleManagement />} />
          <Route path="/roles/permissions" element={<Permissions />} />

          <Route path="/audit-logs" element={<AuditLogs />} />
          <Route path="/admin-management" element={<AdminManagement />} />
          <Route path="/pricing-management" element={<PricingManagement />} />
          <Route path="/audit-logs/login-history" element={<LoginHistory />} />
          <Route path="/audit-logs/admin-actions" element={<AdminActions />} />
        </Route>
      </Route>
    </Routes>
  )
}
