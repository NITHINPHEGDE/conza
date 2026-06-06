import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert, Modal } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import useAppStore from '../store/useAppStore';
import { BookingTrackingSkeleton } from '../components/Skeleton';

const BookingTrackingScreen = ({ navigation }) => {
  const { activeBooking, activeBookingId, fetchActiveBooking, cancelActiveBooking, clearActiveBooking } = useAppStore();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (activeBookingId) {
      fetchActiveBooking(activeBookingId);
    }
  }, [activeBookingId]);

  const handleCancel = () => {
    console.log('=== CANCEL PRESSED, showing modal ===');
    setShowCancelModal(true);
  };

  const confirmCancel = async () => {
    console.log('=== CONFIRM CANCEL TAPPED ===');
    setCancelling(true);
    try {
      await cancelActiveBooking();
      console.log('=== CANCEL SUCCESS ===');
      setShowCancelModal(false);
    } catch (err) {
      console.log('=== CANCEL ERROR ===', err.message);
      setShowCancelModal(false);
      Alert.alert('Error', err.message || 'Could not cancel booking.');
    } finally {
      setCancelling(false);
    }
  };

  const handleOK = async () => {
    await clearActiveBooking();
    navigation.navigate('StatusList'); // goes back to the list
  };

  // ── No active booking ────────────────────────────────────────────────────
  if (!activeBookingId) {
    return (
      <View style={styles.center}>
        <Text style={{ fontSize: 48 }}>📋</Text>
        <Text style={styles.noBookingTitle}>No Active Booking</Text>
        <Text style={styles.noBookingSub}>Book a service to track it here</Text>
      </View>
    );
  }

  // ── Loading ──────────────────────────────────────────────────────────────
  if (!activeBooking) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={{ width: 24 }} />
          <Text style={styles.headerTitle}>Booking Status</Text>
          <View style={{ width: 24 }} />
        </View>
        <BookingTrackingSkeleton />
      </View>
    );
  }

  const getStatusDisplay = (status) => {
    switch (status) {
      case 'pending':     return { text: 'Waiting for response', color: '#F59E0B', icon: 'clock-outline' };
      case 'accepted':    return { text: 'Waiting for arrival',  color: '#3B82F6', icon: 'car-side' };
      case 'arrived':     return { text: 'Worker Arrived',       color: '#10B981', icon: 'account-check' };
      case 'in_progress': return { text: 'Work in Progress',     color: '#6366F1', icon: 'hammer-wrench' };
      case 'completed':   return { text: 'Work Completed',       color: '#6366F1', icon: 'check-circle' };
      case 'cancelled':   return { text: 'Cancelled',            color: '#EF4444', icon: 'close-circle' };
      default:            return { text: status,                 color: '#6B7280', icon: 'help-circle' };
    }
  };

  const status = getStatusDisplay(activeBooking.status);
  const worker = activeBooking.workers?.[0];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{ width: 24 }} />
        <Text style={styles.headerTitle}>Booking Status</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>

        {/* Status Card */}
        <View style={[styles.statusCard, { borderColor: status.color }]}>
          <MaterialCommunityIcons name={status.icon} size={48} color={status.color} />
          <Text style={[styles.statusText, { color: status.color }]}>{status.text}</Text>
          <Text style={styles.bookingId}>ID: {activeBooking._id.slice(-8).toUpperCase()}</Text>
        </View>

        {/* Worker Info */}
        {worker && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Worker Information</Text>
            <View style={styles.workerCard}>
              <Image
                source={{ uri: worker.profileImage || 'https://via.placeholder.com/100' }}
                style={styles.workerImage}
              />
              <View style={styles.workerDetails}>
                <Text style={styles.workerName}>{worker.fullName}</Text>
                <Text style={styles.workerCategory}>{worker.category}</Text>
                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={16} color="#FBBF24" />
                  <Text style={styles.ratingText}>{worker.rating || '5.0'}</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.callButton}>
                <Ionicons name="call" size={20} color="#6366F1" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Booking Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Booking Details</Text>
          <View style={styles.detailsCard}>
            <DetailRow label="Service"      value={activeBooking.category} />
            <DetailRow label="Location"     value={`${activeBooking.area}, ${activeBooking.city}`} />
            <DetailRow label="Address"      value={activeBooking.address || 'N/A'} />
            <DetailRow label="Total Amount" value={`₹${activeBooking.total}`} />
            <DetailRow label="Payment"      value={activeBooking.paymentMethod.toUpperCase()} />
          </View>
        </View>

        {/* Terminal — Completed */}
        {activeBooking.status === 'completed' && (
          <View style={styles.terminalCard}>
            <Text style={styles.terminalTitle}>Work Completed!</Text>
            <Text style={styles.terminalSub}>The worker has marked the job as finished.</Text>
            <TouchableOpacity style={styles.okButton} onPress={handleOK}>
              <Text style={styles.okButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Terminal — Worker Cancelled */}
        {activeBooking.workerCancelled && (
          <View style={[styles.terminalCard, { backgroundColor: '#FEF2F2' }]}>
            <Text style={[styles.terminalTitle, { color: '#EF4444' }]}>Worker Cancelled Job</Text>
            <Text style={styles.terminalSub}>We apologize, the worker had to cancel this booking.</Text>
            <TouchableOpacity style={[styles.okButton, { backgroundColor: '#EF4444' }]} onPress={handleOK}>
              <Text style={styles.okButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Terminal — Customer Cancelled */}
        {activeBooking.status === 'cancelled' && !activeBooking.workerCancelled && (
          <View style={[styles.terminalCard, { backgroundColor: '#F3F4F6' }]}>
            <Text style={[styles.terminalTitle, { color: '#6B7280' }]}>Booking Cancelled</Text>
            <Text style={styles.terminalSub}>You have cancelled this booking.</Text>
            <TouchableOpacity style={[styles.okButton, { backgroundColor: '#6B7280' }]} onPress={handleOK}>
              <Text style={styles.okButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Cancel Button — only while pending */}
        {activeBooking.status === 'pending' && (
          <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
            <Text style={styles.cancelBtnText}>Cancel Booking</Text>
          </TouchableOpacity>
        )}

      </ScrollView>

      {/* Cancel Confirmation Modal */}
      <Modal
        visible={showCancelModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCancelModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Cancel Booking?</Text>
            <Text style={styles.modalSub}>Are you sure you want to cancel this booking?</Text>
            <TouchableOpacity
              style={styles.modalConfirmBtn}
              onPress={confirmCancel}
              disabled={cancelling}
            >
              {cancelling
                ? <ActivityIndicator color="#FFF" />
                : <Text style={styles.modalConfirmText}>Yes, Cancel</Text>
              }
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalDismissBtn}
              onPress={() => setShowCancelModal(false)}
              disabled={cancelling}
            >
              <Text style={styles.modalDismissText}>No, Keep It</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
};

const DetailRow = ({ label, value }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

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
  },
  headerTitle:    { fontSize: 18, fontWeight: '700', color: '#1E293B' },
  scrollContent:  { padding: 20 },
  center:         { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
  loadingText:    { marginTop: 10, color: '#64748B' },
  noBookingTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B', marginTop: 12 },
  noBookingSub:   { fontSize: 14, color: '#94A3B8', marginTop: 6 },
  statusCard: {
    backgroundColor: '#FFF',
    padding:         30,
    borderRadius:    20,
    alignItems:      'center',
    borderWidth:     2,
    marginBottom:    20,
  },
  statusText:     { fontSize: 22, fontWeight: '800', marginTop: 10 },
  bookingId:      { fontSize: 12, color: '#94A3B8', marginTop: 5 },
  section:        { marginBottom: 25 },
  sectionTitle:   { fontSize: 16, fontWeight: '700', color: '#1E293B', marginBottom: 12 },
  workerCard: {
    flexDirection:   'row',
    alignItems:      'center',
    backgroundColor: '#FFF',
    padding:         15,
    borderRadius:    16,
    elevation:       2,
    shadowColor:     '#000',
    shadowOffset:    { width: 0, height: 2 },
    shadowOpacity:   0.1,
    shadowRadius:    4,
  },
  workerImage:    { width: 60, height: 60, borderRadius: 30, backgroundColor: '#E2E8F0' },
  workerDetails:  { flex: 1, marginLeft: 15 },
  workerName:     { fontSize: 16, fontWeight: '700', color: '#1E293B' },
  workerCategory: { fontSize: 14, color: '#64748B' },
  ratingRow:      { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  ratingText:     { fontSize: 14, fontWeight: '600', color: '#F59E0B', marginLeft: 4 },
  callButton: {
    width:           40,
    height:          40,
    borderRadius:    20,
    backgroundColor: '#EEF2FF',
    justifyContent:  'center',
    alignItems:      'center',
  },
  detailsCard: {
    backgroundColor: '#FFF',
    padding:         15,
    borderRadius:    16,
    elevation:       2,
    shadowColor:     '#000',
    shadowOffset:    { width: 0, height: 2 },
    shadowOpacity:   0.1,
    shadowRadius:    4,
  },
  detailRow: {
    flexDirection:     'row',
    justifyContent:    'space-between',
    paddingVertical:   10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  detailLabel:  { fontSize: 14, color: '#64748B' },
  detailValue:  { fontSize: 14, fontWeight: '600', color: '#1E293B', flex: 1, textAlign: 'right', marginLeft: 20 },
  terminalCard: {
    padding:         20,
    borderRadius:    16,
    alignItems:      'center',
    backgroundColor: '#EEF2FF',
    marginBottom:    20,
  },
  terminalTitle: { fontSize: 18, fontWeight: '800', color: '#6366F1', marginBottom: 5 },
  terminalSub:   { fontSize: 14, color: '#64748B', textAlign: 'center', marginBottom: 15 },
  okButton: {
    backgroundColor:  '#6366F1',
    paddingHorizontal: 40,
    paddingVertical:   12,
    borderRadius:      12,
  },
  okButtonText:  { color: '#FFF', fontWeight: '700', fontSize: 16 },
  cancelBtn:     { padding: 15, alignItems: 'center', marginTop: 10, borderWidth: 2, borderColor: '#EF4444', borderRadius: 12 },
  cancelBtnText: { color: '#EF4444', fontWeight: '700', fontSize: 16 },

  // Modal
  modalOverlay: {
    flex:            1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent:  'center',
    alignItems:      'center',
    padding:         30,
  },
  modalBox: {
    backgroundColor: '#FFF',
    borderRadius:    20,
    padding:         24,
    width:           '100%',
    alignItems:      'center',
  },
  modalTitle:       { fontSize: 18, fontWeight: '800', color: '#1E293B', marginBottom: 8 },
  modalSub:         { fontSize: 14, color: '#64748B', textAlign: 'center', marginBottom: 24 },
  modalConfirmBtn: {
    backgroundColor: '#EF4444',
    width:           '100%',
    paddingVertical: 14,
    borderRadius:    12,
    alignItems:      'center',
    marginBottom:    10,
  },
  modalConfirmText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
  modalDismissBtn:  { width: '100%', paddingVertical: 12, alignItems: 'center' },
  modalDismissText: { color: '#64748B', fontWeight: '600', fontSize: 15 },
});

export default BookingTrackingScreen;