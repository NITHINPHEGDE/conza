export const ROUTES = {
  DASHBOARD: '/',
  LOGIN: '/login',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  
  CUSTOMERS: '/customers',
  CUSTOMER_DETAILS: '/customers/:id',
  CUSTOMER_BOOKINGS: '/customers/:id/bookings',
  CUSTOMER_PAYMENTS: '/customers/:id/payments',
  CUSTOMER_COMPLAINTS: '/customers/:id/complaints',
  
  WORKERS: '/workers',
  WORKER_DETAILS: '/workers/:id',
  WORKER_VERIFICATION: '/workers/verification',
  WORKER_RATINGS: '/workers/ratings',
  WORKER_EARNINGS: '/workers/earnings',
  WORKER_TRACKING: '/workers/tracking',
  
  VENDORS: '/vendors',
  VENDOR_DETAILS: '/vendors/:id',
  VENDOR_VERIFICATION: '/vendors/verification',
  VENDOR_ORDERS: '/vendors/:id/orders',
  VENDOR_EARNINGS: '/vendors/:id/earnings',
  VENDOR_REVIEWS: '/vendors/:id/reviews',
  
  MATERIALS: '/materials',
  MATERIAL_DETAILS: '/materials/:id',
  MATERIAL_CATEGORIES: '/materials/categories',
  FEATURED_PRODUCTS: '/materials/featured',
  
  RENTALS: '/rentals',
  RENTAL_DETAILS: '/rentals/:id',
  RENTAL_CATEGORIES: '/rentals/categories',
  FEATURED_RENTALS: '/rentals/featured',
  
  INVENTORY: '/inventory',
  LOW_STOCK: '/inventory/low-stock',
  OUT_OF_STOCK: '/inventory/out-of-stock',
  INVENTORY_ANALYTICS: '/inventory/analytics',
  
  BUSINESS_PARTNERS: '/business-partners',
  BP_DETAILS: '/business-partners/:id',
  BP_REFERRALS: '/business-partners/:id/referrals',
  BP_COMMISSIONS: '/business-partners/:id/commissions',
  BP_TERRITORIES: '/business-partners/territories',
  
  BOOKINGS: '/bookings',
  BOOKING_DETAILS: '/bookings/:id',
  BOOKING_TIMELINE: '/bookings/:id/timeline',
  BOOKING_DISPUTES: '/bookings/disputes',

  BOOKINGS_LABOUR: '/bookings/labour',
  BOOKINGS_MATERIALS: '/bookings/materials',
  BOOKINGS_RENTALS: '/bookings/rentals',
  BOOKING_LABOUR_DETAILS: '/bookings/labour/:id',
  BOOKING_MATERIALS_DETAILS: '/bookings/materials/:id',
  BOOKING_RENTALS_DETAILS: '/bookings/rentals/:id',
  
  ORDERS: '/orders',
  ORDER_DETAILS: '/orders/:id',
  ORDER_TRACKING: '/orders/tracking',
  ORDER_DISPUTES: '/orders/disputes',
  
  SERVICES: '/services',
  ADD_CATEGORY: '/services/add',
  EDIT_CATEGORY: '/services/edit/:id',
  
  FINANCE_REVENUE: '/finance/revenue',
  FINANCE_TRANSACTIONS: '/finance/transactions',
  FINANCE_PAYOUTS: '/finance/payouts',
  FINANCE_REPORTS: '/finance/reports',
  FINANCE_COMMISSIONS: '/finance/commissions',
  
  WALLETS_CUSTOMERS: '/wallets/customers',
  WALLETS_WORKERS: '/wallets/workers',
  WALLETS_VENDORS: '/wallets/vendors',
  WALLETS_BP: '/wallets/business-partners',
  
  PAYMENTS_RAZORPAY: '/payments/razorpay',
  PAYMENTS_FAILED: '/payments/failed',
  PAYMENTS_REFUNDS: '/payments/refunds',
  PAYMENTS_CASH: '/payments/cash',
  PAYMENTS_UPI: '/payments/upi',
  
  MAPS_LIVE: '/maps/live-tracking',
  
  NOTIFICATIONS_PUSH: '/notifications/push',
  NOTIFICATIONS_SMS: '/notifications/sms',
  NOTIFICATIONS_EMAIL: '/notifications/email',
  NOTIFICATIONS_HISTORY: '/notifications/history',
  
  COMPLAINTS_TICKETS: '/complaints/tickets',
  COMPLAINTS: '/complaints',
  COMPLAINTS_ESCALATIONS: '/complaints/escalations',
  COMPLAINTS_REFUNDS: '/complaints/refunds',
  
  REVIEWS_WORKERS: '/reviews/workers',
  REVIEWS_VENDORS: '/reviews/vendors',
  REVIEWS_PRODUCTS: '/reviews/products',
  REVIEWS_ANALYTICS: '/reviews/analytics',
  
  PROMOTIONS_COUPONS: '/promotions/coupons',
  PROMOTIONS_CASHBACK: '/promotions/cashback',
  PROMOTIONS_REFERRALS: '/promotions/referrals',
  PROMOTIONS_SEASONAL: '/promotions/seasonal',
  
  CONTENT_FAQS: '/content/faqs',
  CONTENT_TERMS: '/content/terms',
  CONTENT_PRIVACY: '/content/privacy',
  CONTENT_ABOUT: '/content/about',
  CONTENT_HELP: '/content/help',
  CONTENT_BANNERS: '/content/banners',
  
  ANALYTICS_USERS: '/analytics/users',
  ANALYTICS_REVENUE: '/analytics/revenue',
  ANALYTICS_BOOKINGS: '/analytics/bookings',
  ANALYTICS_VENDORS: '/analytics/vendors',
  ANALYTICS_CONVERSION: '/analytics/conversion',
  
  ROLES: '/roles',
  PERMISSIONS: '/roles/permissions',
  
  AUDIT_LOGS: '/audit-logs',
  LOGIN_HISTORY: '/audit-logs/login-history',
  ADMIN_ACTIONS: '/audit-logs/admin-actions',
  
  ADMIN_MANAGEMENT: '/admin-management',
  PRICING_MANAGEMENT: '/pricing-management'
}
