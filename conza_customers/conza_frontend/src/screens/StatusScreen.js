import React, { useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import useAppStore from '../store/useAppStore';

const getStatusDisplay = (status) => {
  switch (status) {
    case 'pending':     return { text: 'Waiting for response', color: '#F59E0B', icon: 'clock-outline' };
    case 'accepted':    return { text: 'Worker on the way',    color: '#3B82F6', icon: 'car-side' };
    case 'arrived':     return { text: 'Worker Arrived',       color: '#10B981', icon: 'account-check' };
    case 'in_progress': return { text: 'Work in Progress',     color: '#6366F1', icon: 'hammer-wrench' };
    default:            return { text: status,                 color: '#6B7280', icon: 'help-circle' };
  }
};

const BookingCard = ({ booking, onPress }) => {
  const s = getStatusDisplay(booking.status);
  const worker = booking.workers?.[0];

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      {/* Color bar on left */}
      <View style={[styles.cardAccent, { backgroundColor: s.color }]} />

      <View style={styles.cardBody}>
        {/* Top row */}
        <View style={styles.cardTop}>
          <View style={styles.statusPill}>
            <MaterialCommunityIcons name={s.icon} size={14} color={s.color} />
            <Text style={[styles.statusPillText, { color: s.color }]}>{s.text}</Text>
          </View>
          <Text style={styles.bookingIdText}>#{booking._id.slice(-6).toUpperCase()}</Text>
        </View>

        {/* Service + worker */}
        <Text style={styles.serviceName}>{booking.category || 'Booking'}</Text>
        {worker && (
          <Text style={styles.workerName}>👷 {worker.fullName}</Text>
        )}

        {/* Location */}
        <Text style={styles.locationText} numberOfLines={1}>
          📍 {booking.area ? `${booking.area}, ` : ''}{booking.city}
        </Text>

        {/* Bottom row */}
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

const StatusScreen = ({ navigation }) => {
  const {
    activeBookings,
    activeBookingsLoading,
    fetchActiveBookings,
    setActiveBookingId,
  } = useAppStore();

  useEffect(() => {
    fetchActiveBookings();
  }, []);

  const handleViewBooking = async (booking) => {
    await setActiveBookingId(booking._id);
    navigation.navigate('BookingDetail');
  };

  if (activeBookingsLoading && activeBookings.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={styles.loadingText}>Loading bookings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Active Bookings</Text>
        <Text style={styles.headerCount}>
          {activeBookings.length} active
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={activeBookingsLoading}
            onRefresh={fetchActiveBookings}
            colors={['#6366F1']}
          />
        }
      >
        {activeBookings.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📋</Text>
            <Text style={styles.emptyTitle}>No Active Bookings</Text>
            <Text style={styles.emptySub}>Your booked services will appear here</Text>
          </View>
        ) : (
          activeBookings.map((booking) => (
            <BookingCard
              key={booking._id}
              booking={booking}
              onPress={() => handleViewBooking(booking)}
            />
          ))
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

  // Card
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
    flexDirection:   'row',
    alignItems:      'center',
    gap:             4,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical:   4,
    borderRadius:    20,
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

  // Empty
  emptyState:     { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 100 },
  emptyEmoji:     { fontSize: 52, marginBottom: 16 },
  emptyTitle:     { fontSize: 18, fontWeight: '700', color: '#1E293B', marginBottom: 6 },
  emptySub:       { fontSize: 14, color: '#94A3B8' },
});

export default StatusScreen;