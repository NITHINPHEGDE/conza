import React, { useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import useAppStore from '../store/useAppStore';
import { SkeletonList, BookingCardSkeleton } from '../components/Skeleton';

// ── ORIGINAL labour status helper — unchanged ─────────────────────────────────
const getStatusDisplay = (status) => {
  switch (status) {
    case 'pending':     return { text: 'Waiting for response', color: '#F59E0B', icon: 'clock-outline' };
    case 'accepted':    return { text: 'Worker on the way',    color: '#3B82F6', icon: 'car-side' };
    case 'arrived':     return { text: 'Worker Arrived',       color: '#10B981', icon: 'account-check' };
    case 'in_progress': return { text: 'Work in Progress',     color: '#6366F1', icon: 'hammer-wrench' };
    default:            return { text: status,                 color: '#6B7280', icon: 'help-circle' };
  }
};

// ── ORIGINAL BookingCard — completely unchanged ───────────────────────────────
const BookingCard = ({ booking, onPress }) => {
  const s = getStatusDisplay(booking.status);
  const worker = booking.workers?.[0];

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={[styles.cardAccent, { backgroundColor: s.color }]} />
      <View style={styles.cardBody}>
        <View style={styles.cardTop}>
          <View style={styles.statusPill}>
            <MaterialCommunityIcons name={s.icon} size={14} color={s.color} />
            <Text style={[styles.statusPillText, { color: s.color }]}>{s.text}</Text>
          </View>
          <Text style={styles.bookingIdText}>#{booking._id.slice(-6).toUpperCase()}</Text>
        </View>
        <Text style={styles.serviceName}>{booking.category || 'Booking'}</Text>
        {worker && (
          <Text style={styles.workerName}>👷 {worker.fullName}</Text>
        )}
        <Text style={styles.locationText} numberOfLines={1}>
          📍 {booking.area ? `${booking.area}, ` : ''}{booking.city}
        </Text>
        <View style={styles.cardBottom}>
          <Text style={styles.amountText}>₹{booking.total}</Text>
          <View style={styles.viewBtn}>
            <Text style={styles.viewBtnText}>View Details →</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ── NEW: Material status helper ───────────────────────────────────────────────
const getMaterialStatus = (status) => {
  switch (status) {
    case 'new':              return { text: 'Order Placed',     color: '#3B82F6', icon: 'package-variant' };
    case 'accepted':         return { text: 'Accepted',         color: '#10B981', icon: 'check-circle'    };
    case 'out_for_delivery': return { text: 'Out for Delivery', color: '#F97316', icon: 'truck-delivery'  };
    case 'delivered':        return { text: 'Delivered',        color: '#6366F1', icon: 'package-check'   };
    case 'cancelled':        return { text: 'Cancelled',        color: '#EF4444', icon: 'close-circle'    };
    default:                 return { text: status,             color: '#6B7280', icon: 'help-circle'     };
  }
};

// ── NEW: Material booking card ────────────────────────────────────────────────
const MaterialCard = ({ order }) => {
  const s         = getMaterialStatus(order.status);
  const itemNames = (order.items || []).map((i) => i.title || i.name).filter(Boolean).join(', ');
  return (
    <View style={styles.card}>
      <View style={[styles.cardAccent, { backgroundColor: s.color }]} />
      <View style={styles.cardBody}>
        <View style={styles.cardTop}>
          <View style={styles.statusPill}>
            <MaterialCommunityIcons name={s.icon} size={14} color={s.color} />
            <Text style={[styles.statusPillText, { color: s.color }]}>{s.text}</Text>
          </View>
          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeText}>📦 Materials</Text>
          </View>
        </View>
        <Text style={styles.serviceName} numberOfLines={1}>
          {itemNames || 'Material Order'}
        </Text>
        <Text style={styles.locationText}>📍 {order.city}</Text>
        <View style={styles.cardBottom}>
          <Text style={styles.amountText}>₹{order.total}</Text>
          <Text style={styles.bookingIdText}>#{(order._id || '').slice(-6).toUpperCase()}</Text>
        </View>
      </View>
    </View>
  );
};

// ── NEW: Rental status helper ─────────────────────────────────────────────────
const getRentalStatus = (status) => {
  switch (status) {
    case 'new':      return { text: 'Booking Placed',   color: '#3B82F6', icon: 'clock-outline'   };
    case 'accepted': return { text: 'Accepted',         color: '#10B981', icon: 'check-circle'    };
    case 'active':   return { text: 'Equipment Active', color: '#6366F1', icon: 'hammer-wrench'   };
    case 'overdue':  return { text: 'Overdue',          color: '#EF4444', icon: 'alert-circle'    };
    case 'returned': return { text: 'Returned',         color: '#10B981', icon: 'keyboard-return' };
    case 'cancelled':return { text: 'Cancelled',        color: '#EF4444', icon: 'close-circle'    };
    default:         return { text: status,             color: '#6B7280', icon: 'help-circle'     };
  }
};

// ── NEW: Rental booking card ──────────────────────────────────────────────────
const RentalCard = ({ order }) => {
  const s         = getRentalStatus(order.status);
  const itemNames = (order.items || []).map((i) => i.title || i.name).filter(Boolean).join(', ');
  return (
    <View style={styles.card}>
      <View style={[styles.cardAccent, { backgroundColor: s.color }]} />
      <View style={styles.cardBody}>
        <View style={styles.cardTop}>
          <View style={styles.statusPill}>
            <MaterialCommunityIcons name={s.icon} size={14} color={s.color} />
            <Text style={[styles.statusPillText, { color: s.color }]}>{s.text}</Text>
          </View>
          <View style={[styles.typeBadge, { backgroundColor: '#EEF2FF' }]}>
            <Text style={[styles.typeBadgeText, { color: '#4338CA' }]}>🏗️ Rental</Text>
          </View>
        </View>
        <Text style={styles.serviceName} numberOfLines={1}>
          {itemNames || 'Equipment Rental'}
        </Text>
        <Text style={styles.locationText}>📍 {order.city}</Text>
        <View style={styles.cardBottom}>
          <Text style={styles.amountText}>₹{order.total}</Text>
          <Text style={styles.bookingIdText}>#{(order._id || '').slice(-6).toUpperCase()}</Text>
        </View>
      </View>
    </View>
  );
};

// ── Main Screen ───────────────────────────────────────────────────────────────
const StatusScreen = ({ navigation }) => {
  const {
    activeBookings,
    activeBookingsLoading,
    fetchActiveBookings,
    setActiveBookingId,
    sellerOrders,
    sellerOrdersLoading,
    fetchMySellerOrders,
  } = useAppStore();

  useEffect(() => {
    fetchActiveBookings();      // original — fetches labour bookings
    fetchMySellerOrders();      // new — fetches material + rental orders
  }, []);

  // ORIGINAL handler — untouched
  const handleViewBooking = async (booking) => {
    await setActiveBookingId(booking._id);
    navigation.navigate('BookingDetail');
  };

  const onRefresh = () => {
    fetchActiveBookings();
    fetchMySellerOrders();
  };

  const isLoading = activeBookingsLoading || sellerOrdersLoading;

  // Only labour bookings go through BookingCard (original flow)
  const labourBookings = (activeBookings || []).filter(
    (b) => !b.bookingType || b.bookingType === 'labour'
  );

  // Seller orders split by type, hide terminal statuses
  const activeSellerOrders = (sellerOrders || []).filter(
    (o) => !['delivered', 'returned', 'cancelled'].includes(o.status)
  );
  const materialOrders = activeSellerOrders.filter((o) => o.orderType === 'material');
  const rentalOrders   = activeSellerOrders.filter((o) => o.orderType === 'rental');

  const totalActive = labourBookings.length + activeSellerOrders.length;

  if (isLoading && totalActive === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Active Bookings</Text>
        </View>
        <View style={{ paddingTop: 8 }}>
          <SkeletonList component={BookingCardSkeleton} count={3} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Active Bookings</Text>
        <Text style={styles.headerCount}>{totalActive} active</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={onRefresh}
            colors={['#6366F1']}
          />
        }
      >
        {totalActive === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📋</Text>
            <Text style={styles.emptyTitle}>No Active Bookings</Text>
            <Text style={styles.emptySub}>Your booked services will appear here</Text>
          </View>
        ) : (
          <>
            {/* Labour bookings — original BookingCard, original onPress */}
            {labourBookings.map((booking) => (
              <BookingCard
                key={booking._id}
                booking={booking}
                onPress={() => handleViewBooking(booking)}
              />
            ))}

            {/* Material orders — new card, no navigation needed yet */}
            {materialOrders.map((order) => (
              <MaterialCard key={order._id} order={order} />
            ))}

            {/* Rental orders — new card */}
            {rentalOrders.map((order) => (
              <RentalCard key={order._id} order={order} />
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
};

// ── Styles — original styles kept exactly, typeBadge added ───────────────────
const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingTop:        60,
    paddingHorizontal: 20,
    paddingBottom:     20,
    backgroundColor:   '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitle:    { fontSize: 20, fontWeight: '800', color: '#1E293B' },
  headerCount:    { fontSize: 13, fontWeight: '600', color: '#6366F1', backgroundColor: '#EEF2FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  scrollContent:  { padding: 16, paddingBottom: 40 },
  center:         { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
  loadingText:    { marginTop: 10, color: '#64748B' },

  // Card — original
  card: {
    flexDirection:   'row',
    backgroundColor: '#FFF',
    borderRadius:    16,
    marginBottom:    14,
    overflow:        'hidden',
    elevation:       3,
    shadowColor:     '#000',
    shadowOffset:    { width: 0, height: 2 },
    shadowOpacity:   0.08,
    shadowRadius:    8,
  },
  cardAccent:     { width: 5 },
  cardBody:       { flex: 1, padding: 14 },
  cardTop: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    marginBottom:   8,
  },
  statusPill: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               4,
    backgroundColor:   '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical:   4,
    borderRadius:      20,
  },
  statusPillText: { fontSize: 11, fontWeight: '700' },
  bookingIdText:  { fontSize: 11, color: '#94A3B8', fontWeight: '600' },
  serviceName:    { fontSize: 16, fontWeight: '800', color: '#1E293B', marginBottom: 4 },
  workerName:     { fontSize: 13, color: '#475569', fontWeight: '500', marginBottom: 4 },
  locationText:   { fontSize: 12, color: '#64748B', marginBottom: 10 },
  cardBottom: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
  },
  amountText:     { fontSize: 16, fontWeight: '800', color: '#1E293B' },
  viewBtn:        { backgroundColor: '#EEF2FF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  viewBtnText:    { fontSize: 12, fontWeight: '700', color: '#6366F1' },

  // New — type badge for material/rental cards
  typeBadge:      { backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  typeBadgeText:  { fontSize: 10, fontWeight: '700', color: '#92400E' },

  // Empty — original
  emptyState:     { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 100 },
  emptyEmoji:     { fontSize: 52, marginBottom: 16 },
  emptyTitle:     { fontSize: 18, fontWeight: '700', color: '#1E293B', marginBottom: 6 },
  emptySub:       { fontSize: 14, color: '#94A3B8' },
});

export default StatusScreen;