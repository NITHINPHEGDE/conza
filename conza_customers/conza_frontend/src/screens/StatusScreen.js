import React, { useEffect, useCallback, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import useAppStore from '../store/useAppStore';
import { SkeletonList, BookingCardSkeleton } from '../components/Skeleton';

const getStatusDisplay = (status) => {
  switch (status) {
    case 'pending':                        return { text: 'Waiting for response',       color: '#F59E0B', icon: 'clock-outline'   };
    case 'accepted':                       return { text: 'Worker on the way',          color: '#3B82F6', icon: 'car-side'        };
    case 'arrived':                        return { text: 'Worker Arrived',             color: '#10B981', icon: 'account-check'   };
    case 'in_progress':                    return { text: 'Work in Progress',           color: '#6366F1', icon: 'hammer-wrench'   };
    case 'awaiting_customer_confirmation': return { text: 'Confirm Work Completion',    color: '#F97316', icon: 'clipboard-check' };
    case 'completed':                      return { text: 'Completed',                  color: '#10B981', icon: 'check-decagram'  };
    case 'cancelled':                      return { text: 'Cancelled',                  color: '#EF4444', icon: 'close-circle'    };
    default:                               return { text: status,                       color: '#6B7280', icon: 'help-circle'     };
  }
};

// Which filter bucket a labour booking status falls into
const getLabourBucket = (status) => {
  if (status === 'completed') return 'completed';
  if (status === 'cancelled') return 'cancelled';
  return 'active';
};

const BookingCard = React.memo(({ booking, onPress }) => {
  const s      = getStatusDisplay(booking.status);
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
        {worker && <Text style={styles.workerName}>👷 {worker.fullName}</Text>}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 10 }}>
          <MaterialCommunityIcons name="map-marker" size={13} color="#64748B" />
          <Text style={[styles.locationText, { marginBottom: 0 }]} numberOfLines={1}>
            {booking.area ? `${booking.area}, ` : ''}{booking.city}
          </Text>
        </View>
        <View style={styles.cardBottom}>
          <Text style={styles.amountText}>₹{booking.total}</Text>
          <View style={styles.viewBtn}>
            <Text style={styles.viewBtnText}>View Details →</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
});

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

// Which filter bucket a material order status falls into
const getMaterialBucket = (status) => {
  if (status === 'delivered') return 'completed';
  if (status === 'cancelled') return 'cancelled';
  return 'active';
};

const MaterialCard = React.memo(({ order }) => {
  const s         = getMaterialStatus(order.status);
  const itemNames = useMemo(() =>
    (order.items || []).map((i) => i.title || i.name).filter(Boolean).join(', '),
    [order.items]
  );
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
        <Text style={styles.serviceName} numberOfLines={1}>{itemNames || 'Material Order'}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 10 }}>
          <MaterialCommunityIcons name="map-marker" size={13} color="#64748B" />
          <Text style={[styles.locationText, { marginBottom: 0 }]}>{order.city}</Text>
        </View>
        <View style={styles.cardBottom}>
          <Text style={styles.amountText}>₹{order.total}</Text>
          <Text style={styles.bookingIdText}>#{(order._id || '').slice(-6).toUpperCase()}</Text>
        </View>
      </View>
    </View>
  );
});

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

// Which filter bucket a rental order status falls into
const getRentalBucket = (status) => {
  if (status === 'returned') return 'completed';
  if (status === 'cancelled') return 'cancelled';
  return 'active';
};

const RentalCard = React.memo(({ order }) => {
  const s         = getRentalStatus(order.status);
  const itemNames = useMemo(() =>
    (order.items || []).map((i) => i.title || i.name).filter(Boolean).join(', '),
    [order.items]
  );
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
        <Text style={styles.serviceName} numberOfLines={1}>{itemNames || 'Equipment Rental'}</Text>
        <Text style={styles.locationText}>📍 {order.city}</Text>
        <View style={styles.cardBottom}>
          <Text style={styles.amountText}>₹{order.total}</Text>
          <Text style={styles.bookingIdText}>#{(order._id || '').slice(-6).toUpperCase()}</Text>
        </View>
      </View>
    </View>
  );
});

const TABS = [
  { key: 'labour', label: 'Labour Bookings', icon: 'account-hard-hat' },
  { key: 'order',  label: 'Order Bookings',  icon: 'package-variant'  },
  { key: 'rental', label: 'Rental Bookings', icon: 'hammer-wrench'    },
];

const FILTERS = [
  { key: 'active',    label: 'Active'    },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

const TabBar = React.memo(({ activeTab, onChange, counts }) => (
  <View style={styles.tabBar}>
    {TABS.map((tab) => {
      const isActive = activeTab === tab.key;
      return (
        <TouchableOpacity
          key={tab.key}
          style={[styles.tabItem, isActive && styles.tabItemActive]}
          onPress={() => onChange(tab.key)}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name={tab.icon}
            size={16}
            color={isActive ? '#6366F1' : '#94A3B8'}
          />
          <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]} numberOfLines={1}>
            {tab.label}
          </Text>
          {counts[tab.key] > 0 && (
            <View style={[styles.tabBadge, isActive && styles.tabBadgeActive]}>
              <Text style={[styles.tabBadgeText, isActive && styles.tabBadgeTextActive]}>
                {counts[tab.key]}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      );
    })}
  </View>
));

const FilterRow = React.memo(({ activeFilter, onChange }) => (
  <View style={styles.filterRow}>
    {FILTERS.map((f) => {
      const isActive = activeFilter === f.key;
      return (
        <TouchableOpacity
          key={f.key}
          style={[styles.filterChip, isActive && styles.filterChipActive]}
          onPress={() => onChange(f.key)}
          activeOpacity={0.75}
        >
          <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
            {f.label}
          </Text>
        </TouchableOpacity>
      );
    })}
  </View>
));

const EMPTY_COPY = {
  labour: {
    active:    { emoji: '📋', title: 'No Active Labour Bookings',    sub: 'Your ongoing labour bookings will appear here' },
    completed: { emoji: '✅', title: 'No Completed Labour Bookings', sub: 'Finished labour bookings will appear here'     },
    cancelled: { emoji: '🚫', title: 'No Cancelled Labour Bookings', sub: 'Cancelled labour bookings will appear here'    },
  },
  order: {
    active:    { emoji: '📦', title: 'No Active Order Bookings',    sub: 'Your ongoing material orders will appear here' },
    completed: { emoji: '✅', title: 'No Completed Order Bookings', sub: 'Delivered material orders will appear here'    },
    cancelled: { emoji: '🚫', title: 'No Cancelled Order Bookings', sub: 'Cancelled material orders will appear here'    },
  },
  rental: {
    active:    { emoji: '🏗️', title: 'No Active Rental Bookings',    sub: 'Your ongoing equipment rentals will appear here' },
    completed: { emoji: '✅', title: 'No Completed Rental Bookings', sub: 'Returned equipment rentals will appear here'     },
    cancelled: { emoji: '🚫', title: 'No Cancelled Rental Bookings', sub: 'Cancelled equipment rentals will appear here'    },
  },
};

const StatusScreen = ({ navigation }) => {
  const {
    labourBookings,
    labourBookingsLoading,
    fetchLabourBookings,
    setActiveBookingId,
    sellerOrders,
    sellerOrdersLoading,
    fetchMySellerOrders,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState('labour');
  const [filters, setFilters] = useState({ labour: 'active', order: 'active', rental: 'active' });

  useEffect(() => {
    fetchLabourBookings();
    fetchMySellerOrders();
  }, []);

  const handleViewBooking = useCallback(async (booking) => {
    await setActiveBookingId(booking._id);
    navigation.navigate('BookingDetail');
  }, [setActiveBookingId, navigation]);

  const onRefresh = useCallback(() => {
    fetchLabourBookings();
    fetchMySellerOrders();
  }, [fetchLabourBookings, fetchMySellerOrders]);

  const handleTabChange = useCallback((tabKey) => setActiveTab(tabKey), []);

  const handleFilterChange = useCallback((filterKey) => {
    setFilters((prev) => ({ ...prev, [activeTab]: filterKey }));
  }, [activeTab]);

  const isLoading = labourBookingsLoading || sellerOrdersLoading;

  const materialOrders = useMemo(() =>
    (sellerOrders || []).filter((o) => o.orderType === 'material'),
    [sellerOrders]
  );

  const rentalOrders = useMemo(() =>
    (sellerOrders || []).filter((o) => o.orderType === 'rental'),
    [sellerOrders]
  );

  const filteredLabour = useMemo(() =>
    (labourBookings || []).filter((b) => getLabourBucket(b.status) === filters.labour),
    [labourBookings, filters.labour]
  );

  const filteredMaterial = useMemo(() =>
    materialOrders.filter((o) => getMaterialBucket(o.status) === filters.order),
    [materialOrders, filters.order]
  );

  const filteredRental = useMemo(() =>
    rentalOrders.filter((o) => getRentalBucket(o.status) === filters.rental),
    [rentalOrders, filters.rental]
  );

  const counts = useMemo(() => ({
    labour: (labourBookings || []).filter((b) => getLabourBucket(b.status) === 'active').length,
    order:  materialOrders.filter((o) => getMaterialBucket(o.status) === 'active').length,
    rental: rentalOrders.filter((o) => getRentalBucket(o.status) === 'active').length,
  }), [labourBookings, materialOrders, rentalOrders]);

  const currentFilter = filters[activeTab];
  const currentList =
    activeTab === 'labour' ? filteredLabour :
    activeTab === 'order'  ? filteredMaterial :
    filteredRental;

  const emptyCopy = EMPTY_COPY[activeTab][currentFilter];

  if (isLoading && !(labourBookings || []).length && !(sellerOrders || []).length) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Bookings</Text>
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
        <Text style={styles.headerTitle}>My Bookings</Text>
        <Text style={styles.headerCount}>{currentList.length} {currentFilter}</Text>
      </View>

      <TabBar activeTab={activeTab} onChange={handleTabChange} counts={counts} />
      <FilterRow activeFilter={currentFilter} onChange={handleFilterChange} />

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
        {currentList.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>{emptyCopy.emoji}</Text>
            <Text style={styles.emptyTitle}>{emptyCopy.title}</Text>
            <Text style={styles.emptySub}>{emptyCopy.sub}</Text>
          </View>
        ) : (
          <>
            {activeTab === 'labour' && currentList.map((booking) => (
              <BookingCard
                key={booking._id}
                booking={booking}
                onPress={() => handleViewBooking(booking)}
              />
            ))}
            {activeTab === 'order' && currentList.map((order) => (
              <MaterialCard key={order._id} order={order} />
            ))}
            {activeTab === 'rental' && currentList.map((order) => (
              <RentalCard key={order._id} order={order} />
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingTop:        60,
    paddingHorizontal: 20,
    paddingBottom:     16,
    backgroundColor:   '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitle:    { fontSize: 20, fontWeight: '800', color: '#1E293B' },
  headerCount:    { fontSize: 13, fontWeight: '600', color: '#6366F1', backgroundColor: '#EEF2FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, textTransform: 'capitalize' },

  tabBar: {
    flexDirection:     'row',
    backgroundColor:   '#FFF',
    paddingHorizontal: 12,
    paddingTop:        10,
    paddingBottom:     10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap:               8,
  },
  tabItem: {
    flex:              1,
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'center',
    gap:               4,
    paddingVertical:   9,
    paddingHorizontal: 4,
    borderRadius:      12,
    backgroundColor:   '#F8FAFC',
  },
  tabItemActive:  { backgroundColor: '#EEF2FF' },
  tabLabel:       { fontSize: 11, fontWeight: '700', color: '#94A3B8', flexShrink: 1 },
  tabLabelActive: { color: '#6366F1' },
  tabBadge: {
    minWidth:          16,
    height:             16,
    borderRadius:       8,
    paddingHorizontal:  4,
    backgroundColor:    '#E2E8F0',
    alignItems:         'center',
    justifyContent:     'center',
  },
  tabBadgeActive:     { backgroundColor: '#6366F1' },
  tabBadgeText:       { fontSize: 9, fontWeight: '800', color: '#64748B' },
  tabBadgeTextActive: { color: '#FFF' },

  filterRow: {
    flexDirection:     'row',
    backgroundColor:   '#FFF',
    paddingHorizontal: 16,
    paddingBottom:     14,
    gap:               8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical:   7,
    borderRadius:      20,
    backgroundColor:   '#F1F5F9',
  },
  filterChipActive:     { backgroundColor: '#1E293B' },
  filterChipText:       { fontSize: 12, fontWeight: '700', color: '#64748B' },
  filterChipTextActive: { color: '#FFF' },

  scrollContent:  { padding: 16, paddingBottom: 40 },
  center:         { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
  loadingText:    { marginTop: 10, color: '#64748B' },
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
  typeBadge:      { backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  typeBadgeText:  { fontSize: 10, fontWeight: '700', color: '#92400E' },
  emptyState:     { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 100 },
  emptyEmoji:     { fontSize: 52, marginBottom: 16 },
  emptyTitle:     { fontSize: 18, fontWeight: '700', color: '#1E293B', marginBottom: 6 },
  emptySub:       { fontSize: 14, color: '#94A3B8' },
});

export default StatusScreen;