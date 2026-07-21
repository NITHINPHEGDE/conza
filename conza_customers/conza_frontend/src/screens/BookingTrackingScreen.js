import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert, Modal, TextInput } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import useAppStore from '../store/useAppStore';
import { bookingAPI } from '../api/bookingAPI';
import { BookingTrackingSkeleton } from '../components/Skeleton';
import { socket } from '../utils/socket';
import AutoBookPopup from '../components/AutoBookPopup';

const getStatusDisplay = (status) => {
  switch (status) {
    case 'pending':                        return { text: 'Waiting for response',    color: '#F59E0B', icon: 'clock-outline'   };
    case 'accepted':                       return { text: 'Waiting for arrival',     color: '#3B82F6', icon: 'car-side'        };
    case 'arrived':                        return { text: 'Worker Arrived',          color: '#10B981', icon: 'account-check'   };
    case 'in_progress':                    return { text: 'Work in Progress',        color: '#6366F1', icon: 'hammer-wrench'   };
    case 'awaiting_customer_confirmation': return { text: 'Confirm Work Completion', color: '#F97316', icon: 'clipboard-check' };
    case 'completed':                      return { text: 'Work Completed',          color: '#6366F1', icon: 'check-circle'    };
    case 'cancelled':                      return { text: 'Cancelled',               color: '#EF4444', icon: 'close-circle'    };
    default:                               return { text: status,                    color: '#6B7280', icon: 'help-circle'     };
  }
};

const DetailRow = React.memo(({ label, value }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
));

// ── Work Timeline helpers ─────────────────────────────────────────────────────
const fmtTime = (iso) => {
  if (!iso) return null;
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
};

const TimelineRow = React.memo(({ icon, color, label, time, done }) => (
  <View style={styles.tlRow}>
    <View style={[styles.tlDot, done ? { backgroundColor: color } : styles.tlDotPending]}>
      <MaterialCommunityIcons name={icon} size={14} color={done ? '#FFF' : '#94A3B8'} />
    </View>
    <View style={styles.tlContent}>
      <Text style={[styles.tlLabel, done && { color: '#1E293B' }]}>{label}</Text>
      <Text style={[styles.tlTime, done && { color: color }]}>
        {done ? fmtTime(time) : 'Pending'}
      </Text>
    </View>
  </View>
));

const TimelineLine = React.memo(({ done }) => (
  <View style={[styles.tlLine, done && styles.tlLineDone]} />
));

const BookingTrackingScreen = ({ navigation }) => {
  const activeBooking        = useAppStore((s) => s.activeBooking);
  const activeBookingId      = useAppStore((s) => s.activeBookingId);
  const fetchActiveBooking   = useAppStore((s) => s.fetchActiveBooking);
  const cancelActiveBooking  = useAppStore((s) => s.cancelActiveBooking);
  const clearActiveBooking   = useAppStore((s) => s.clearActiveBooking);
  const clearPendingWorkCompletion = useAppStore((s) => s.clearPendingWorkCompletion);

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling]           = useState(false);
  const [confirming, setConfirming]           = useState(false);
  const [reportingIssue, setReportingIssue]   = useState(false);
  const [issueComment, setIssueComment]       = useState('');
  const [partialData, setPartialData]         = useState(null); // { acceptedCount, required, category }

  // Clear the work-completion popup when this screen is already visible,
  // since the in-screen confirmation modal handles it here.
  useEffect(() => {
    clearPendingWorkCompletion();
  }, []);

  // Join the booking-specific socket room so booking_status_changed events
  // are received. Re-join on reconnect to handle network interruptions.
  useEffect(() => {
    if (!activeBookingId) return;

    socket.emit('join_booking', activeBookingId);

    const handleReconnect = () => {
      socket.emit('join_booking', activeBookingId);
    };
    socket.on('connect', handleReconnect);

    return () => {
      socket.off('connect', handleReconnect);
    };
  }, [activeBookingId]);

  // Quick Auto Book — refetch on worker progress updates
  useEffect(() => {
    if (!activeBookingId) return;
    const handleProgress = (data) => {
      if (data?.bookingId === activeBookingId) fetchActiveBooking(activeBookingId);
    };
    socket.on('autobook_progress', handleProgress);
    return () => { socket.off('autobook_progress', handleProgress); };
  }, [activeBookingId, fetchActiveBooking]);

  // Handle edge case: all workers responded but quota not met
  useEffect(() => {
    if (!activeBookingId) return;

    const handleFailed = (data) => {
      if (data?.bookingId !== activeBookingId) return;
      // 0 workers accepted — auto-cancelled
      fetchActiveBooking(activeBookingId);
      Alert.alert(
        'No Workers Available ☹️',
        data.message || `No workers were available nearby. Your booking has been cancelled automatically.`,
        [{ text: 'OK' }]
      );
    };

    const handlePartial = (data) => {
      if (data?.bookingId !== activeBookingId) return;
      // Some workers accepted, customer must decide
      fetchActiveBooking(activeBookingId);
      setPartialData({
        acceptedCount: data.acceptedCount,
        required:      data.required,
        category:      data.category,
      });
    };

    socket.on('autobook_failed',  handleFailed);
    socket.on('autobook_partial', handlePartial);
    return () => {
      socket.off('autobook_failed',  handleFailed);
      socket.off('autobook_partial', handlePartial);
    };
  }, [activeBookingId, fetchActiveBooking]);

  // Fallback polling at 30s — socket handles real-time; this catches any missed
  // events (e.g. app was in background, network blip). This is existing architecture.
  useEffect(() => {
    let intervalId;
    if (activeBookingId && activeBooking?.status !== 'completed' && activeBooking?.status !== 'cancelled') {
      intervalId = setInterval(() => {
        fetchActiveBooking(activeBookingId);
      }, 30000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [activeBookingId, activeBooking?.status]);

  useEffect(() => {
    if (activeBookingId) fetchActiveBooking(activeBookingId);
  }, [activeBookingId]);

  const handleCancel = useCallback(() => {
    setShowCancelModal(true);
  }, []);

  const handleDismissModal = useCallback(() => {
    setShowCancelModal(false);
  }, []);

  const confirmCancel = useCallback(async () => {
    setCancelling(true);
    try {
      await cancelActiveBooking();
      setShowCancelModal(false);
    } catch (err) {
      setShowCancelModal(false);
      Alert.alert('Error', err.message || 'Could not cancel booking.');
    } finally {
      setCancelling(false);
    }
  }, [cancelActiveBooking]);

  const handleConfirmCompletion = useCallback(async () => {
    if (!activeBookingId) return;
    setConfirming(true);
    try {
      await bookingAPI.confirmCompletion(activeBookingId);
      await fetchActiveBooking(activeBookingId);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || err.message || 'Could not confirm completion.');
    } finally {
      setConfirming(false);
    }
  }, [activeBookingId, fetchActiveBooking]);

  const handleReportIssue = useCallback(async () => {
    if (!activeBookingId) return;
    setReportingIssue(true);
    try {
      await bookingAPI.reportIssue(activeBookingId, issueComment);
      await fetchActiveBooking(activeBookingId);
      Alert.alert('Issue Reported', 'We have notified the worker. Support will review your booking.');
      setIssueComment('');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || err.message || 'Could not report issue.');
    } finally {
      setReportingIssue(false);
    }
  }, [activeBookingId, issueComment, fetchActiveBooking]);

  const handlePartialProceed = useCallback(async () => {
    if (!activeBookingId) return;
    try {
      await bookingAPI.confirmPartialAutoBook(activeBookingId);
      setPartialData(null);
      await fetchActiveBooking(activeBookingId);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || err.message || 'Something went wrong.');
    }
  }, [activeBookingId, fetchActiveBooking]);

  const handlePartialCancel = useCallback(async () => {
    if (!activeBookingId) return;
    try {
      await bookingAPI.cancelPartialAutoBook(activeBookingId);
      setPartialData(null);
      await fetchActiveBooking(activeBookingId);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || err.message || 'Something went wrong.');
    }
  }, [activeBookingId, fetchActiveBooking]);

  const handleOK = useCallback(async () => {
    await clearActiveBooking();
    navigation.navigate('StatusList');
  }, [clearActiveBooking, navigation]);

  const status = useMemo(() =>
    activeBooking ? getStatusDisplay(activeBooking.status) : null,
    [activeBooking?.status]
  );

  const worker = (!activeBooking?.isAutoBook || activeBooking?.autoBookStatus === 'fulfilled')
    ? activeBooking?.workers?.[0]
    : null;

  const statusCardStyle = useMemo(() =>
    status ? [styles.statusCard, { borderColor: status.color }] : styles.statusCard,
    [status?.color]
  );

  if (!activeBookingId) {
    return (
      <View style={styles.center}>
        <Text style={{ fontSize: 48 }}>📋</Text>
        <Text style={styles.noBookingTitle}>No Active Booking</Text>
        <Text style={styles.noBookingSub}>Book a service to track it here</Text>
      </View>
    );
  }

  if (!activeBooking || !status) {
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

  return (
    <View style={styles.container}>
      <AutoBookPopup />
      <View style={styles.header}>
        <View style={{ width: 24 }} />
        <Text style={styles.headerTitle}>Booking Status</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>

        <View style={statusCardStyle}>
          <MaterialCommunityIcons name={status.icon} size={48} color={status.color} />
          <Text style={[styles.statusText, { color: status.color }]}>{status.text}</Text>
          <Text style={styles.bookingId}>ID: {activeBooking._id.slice(-8).toUpperCase()}</Text>
        </View>

        {/* Partial match decision card — shown when some workers accepted but quota not met */}
        {partialData && (
          <View style={styles.partialCard}>
            <Text style={styles.partialEmoji}>⚠️</Text>
            <Text style={styles.partialTitle}>Partial Match</Text>
            <Text style={styles.partialSub}>
              Only {partialData.acceptedCount} of {partialData.required} {partialData.category}s accepted your request.{`\n`}
              Would you like to proceed with {partialData.acceptedCount} worker{partialData.acceptedCount > 1 ? 's' : ''}, or cancel?
            </Text>
            <TouchableOpacity style={styles.partialProceedBtn} onPress={handlePartialProceed} activeOpacity={0.85}>
              <Text style={styles.partialProceedText}>✓ Proceed with {partialData.acceptedCount} Worker{partialData.acceptedCount > 1 ? 's' : ''}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.partialCancelBtn} onPress={handlePartialCancel} activeOpacity={0.75}>
              <Text style={styles.partialCancelText}>✕ Cancel Booking</Text>
            </TouchableOpacity>
          </View>
        )}
        {activeBooking.isAutoBook && activeBooking.status === 'pending' && (
          <View style={styles.autoBookProgressCard}>
            <MaterialCommunityIcons name="account-multiple" size={20} color="#F59E0B" />
            <Text style={styles.autoBookProgressText}>
              {(activeBooking.workers || []).length} of {activeBooking.requiredWorkers || 1} worker{(activeBooking.requiredWorkers || 1) > 1 ? 's' : ''} accepted
            </Text>
            <Text style={styles.autoBookProgressSub}>
              Broadcasting to nearby {activeBooking.category}s — each worker starts independently
            </Text>
          </View>
        )}

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

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Booking Details</Text>
          <View style={styles.detailsCard}>
            <DetailRow label="Service"      value={activeBooking.category} />
            <DetailRow label="Location"     value={`${activeBooking.area}, ${activeBooking.city}`} />
            <DetailRow label="Address"      value={activeBooking.address || 'N/A'} />
            {activeBooking.baseFeeApplied ? (
              <DetailRow label="Billing"        value="Base fee (< 1 hr)" />
            ) : !!activeBooking.hoursWorked && (
              <DetailRow label="Hours Worked"   value={`${activeBooking.hoursWorked} hr${activeBooking.hoursWorked === 1 ? '' : 's'}`} />
            )}

            {/* Auto-book: show per-worker breakdown */}
            {activeBooking.isAutoBook && (activeBooking.workers || []).length > 0 ? (
              <>
                <View style={styles.detailDivider} />
                <Text style={styles.workerBreakdownTitle}>
                  ⚡ {(activeBooking.workers || []).length} Worker{(activeBooking.workers || []).length > 1 ? 's' : ''} Assigned
                </Text>
                {(activeBooking.workers || []).map((w, i) => {
                  const snap = (activeBooking.workerSnapshot || [])[i];
                  const name = w.fullName || snap?.name || `Worker ${i + 1}`;
                  const rate = snap?.pricePerDay || snap?.minCharge || 0;
                  return (
                    <View key={w._id || i} style={styles.workerBreakdownRow}>
                      <Text style={styles.workerBreakdownName}>👷 {name}</Text>
                      {rate > 0 && <Text style={styles.workerBreakdownRate}>₹{rate}/hr</Text>}
                    </View>
                  );
                })}
                <View style={styles.detailDivider} />
                <DetailRow label="Estimated Total" value={`₹${activeBooking.total}`} />
                <DetailRow label="Note" value="Final bill calculated per actual hours worked" />
              </>
            ) : (
              <DetailRow label="Total Amount" value={`₹${activeBooking.total}`} />
            )}

            <DetailRow label="Payment" value={(activeBooking.paymentMethod || 'pending').toUpperCase()} />
          </View>
        </View>

        {/* Work Timeline — arrival, start, finish times */}
        {activeBooking.bookingType === 'labour' && (
          activeBooking.checkInTime || activeBooking.workStartTime || activeBooking.checkOutTime
        ) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Work Timeline</Text>
            <View style={styles.timelineCard}>
              <TimelineRow
                icon="map-marker-check"
                color="#10B981"
                label="Worker Arrived"
                time={activeBooking.checkInTime}
                done={!!activeBooking.checkInTime}
              />
              <TimelineLine done={!!activeBooking.workStartTime} />
              <TimelineRow
                icon="play-circle"
                color="#6366F1"
                label="Work Started"
                time={activeBooking.workStartTime}
                done={!!activeBooking.workStartTime}
              />
              <TimelineLine done={!!activeBooking.checkOutTime} />
              <TimelineRow
                icon="check-circle"
                color="#F59E0B"
                label="Work Finished"
                time={activeBooking.checkOutTime}
                done={!!activeBooking.checkOutTime}
              />
            </View>
          </View>
        )}

        {activeBooking.status === 'completed' && (
          <View style={styles.terminalCard}>
            <Text style={styles.terminalTitle}>Work Completed!</Text>
            <Text style={styles.terminalSub}>The worker has marked the job as finished.</Text>
            <TouchableOpacity style={styles.okButton} onPress={handleOK}>
              <Text style={styles.okButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        )}

        {activeBooking.workerCancelled && (
          <View style={[styles.terminalCard, { backgroundColor: '#FEF2F2' }]}>
            <Text style={[styles.terminalTitle, { color: '#EF4444' }]}>Worker Cancelled Job</Text>
            <Text style={styles.terminalSub}>We apologize, the worker had to cancel this booking.</Text>
            <TouchableOpacity style={[styles.okButton, { backgroundColor: '#EF4444' }]} onPress={handleOK}>
              <Text style={styles.okButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        )}

        {activeBooking.status === 'cancelled' && !activeBooking.workerCancelled && (
          <View style={[styles.terminalCard, { backgroundColor: '#F3F4F6' }]}>
            <Text style={[styles.terminalTitle, { color: '#6B7280' }]}>Booking Cancelled</Text>
            <Text style={styles.terminalSub}>You have cancelled this booking.</Text>
            <TouchableOpacity style={[styles.okButton, { backgroundColor: '#6B7280' }]} onPress={handleOK}>
              <Text style={styles.okButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        )}

        {activeBooking.status === 'pending' && (
          <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
            <Text style={styles.cancelBtnText}>Cancel Booking</Text>
          </TouchableOpacity>
        )}

      </ScrollView>

      <Modal
        visible={showCancelModal}
        transparent
        animationType="fade"
        onRequestClose={handleDismissModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Cancel Booking?</Text>
            <Text style={styles.modalSub}>Are you sure you want to cancel this booking?</Text>
            <TouchableOpacity style={styles.modalConfirmBtn} onPress={confirmCancel} disabled={cancelling}>
              {cancelling
                ? <ActivityIndicator color="#FFF" />
                : <Text style={styles.modalConfirmText}>Yes, Cancel</Text>
              }
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalDismissBtn} onPress={handleDismissModal} disabled={cancelling}>
              <Text style={styles.modalDismissText}>No, Keep It</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={activeBooking.status === 'awaiting_customer_confirmation'}
        transparent
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={[styles.modalTitle, { fontSize: 20, marginBottom: 12 }]}>Confirm Work Completion</Text>
            <Text style={styles.modalSub}>
              The worker has marked the job as completed. Please confirm if you are satisfied with the work.
            </Text>
            
            <TouchableOpacity 
              style={[styles.modalConfirmBtn, { backgroundColor: '#10B981', marginBottom: 16 }]} 
              onPress={handleConfirmCompletion} 
              disabled={confirming || reportingIssue}
            >
              {confirming
                ? <ActivityIndicator color="#FFF" />
                : <Text style={styles.modalConfirmText}>✓ Confirm Work Completed</Text>
              }
            </TouchableOpacity>

            <View style={{ width: '100%', height: 1, backgroundColor: '#E2E8F0', marginBottom: 16 }} />
            
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#64748B', alignSelf: 'flex-start', marginBottom: 8 }}>
              Not satisfied? Report an issue:
            </Text>
            
            <TextInput
              style={{ width: '100%', backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, padding: 12, minHeight: 60, marginBottom: 12, textAlignVertical: 'top' }}
              placeholder="Describe the issue (optional)"
              value={issueComment}
              onChangeText={setIssueComment}
              multiline
            />
            
            <TouchableOpacity 
              style={[styles.modalConfirmBtn, { backgroundColor: '#EF4444', marginBottom: 0 }]} 
              onPress={handleReportIssue} 
              disabled={confirming || reportingIssue}
            >
              {reportingIssue
                ? <ActivityIndicator color="#FFF" />
                : <Text style={styles.modalConfirmText}>Report Issue</Text>
              }
            </TouchableOpacity>

          </View>
        </View>
      </Modal>
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
  },
  headerTitle:    { fontSize: 18, fontWeight: '700', color: '#1E293B' },
  scrollContent:  { padding: 20 },
  center:         { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
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
  autoBookProgressCard: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  autoBookProgressText: { fontSize: 15, fontWeight: '800', color: '#92400E', marginTop: 6 },
  autoBookProgressSub:  { fontSize: 12, color: '#B45309', marginTop: 4, textAlign: 'center' },
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
    backgroundColor:   '#6366F1',
    paddingHorizontal: 40,
    paddingVertical:   12,
    borderRadius:      12,
  },
  okButtonText:  { color: '#FFF', fontWeight: '700', fontSize: 16 },
  cancelBtn:     { padding: 15, alignItems: 'center', marginTop: 10, borderWidth: 2, borderColor: '#EF4444', borderRadius: 12 },
  cancelBtnText: { color: '#EF4444', fontWeight: '700', fontSize: 16 },
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

  // Auto-book per-worker breakdown
  detailDivider: { height: 1, backgroundColor: '#E2E8F0', marginVertical: 10 },
  workerBreakdownTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F59E0B',
    marginBottom: 8,
  },
  workerBreakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
  },
  workerBreakdownName: { fontSize: 13, fontWeight: '600', color: '#1E293B' },
  workerBreakdownRate: { fontSize: 13, fontWeight: '700', color: '#6366F1' },

  // Partial auto-book decision card
  partialCard: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
    marginBottom: 18,
  },
  partialEmoji:       { fontSize: 32, marginBottom: 8 },
  partialTitle:       { fontSize: 17, fontWeight: '800', color: '#92400E', marginBottom: 6 },
  partialSub:         { fontSize: 13, color: '#78350F', textAlign: 'center', lineHeight: 20, marginBottom: 18 },
  partialProceedBtn: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 24,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  partialProceedText: { color: '#FFF', fontWeight: '800', fontSize: 15 },
  partialCancelBtn: {
    borderWidth: 1.5,
    borderColor: '#EF4444',
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 24,
    width: '100%',
    alignItems: 'center',
  },
  partialCancelText: { color: '#EF4444', fontWeight: '700', fontSize: 14 },

  // Work Timeline
  timelineCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
  },
  tlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  tlDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tlDotPending: {
    backgroundColor: '#E2E8F0',
  },
  tlContent: { flex: 1 },
  tlLabel: { fontSize: 13, fontWeight: '600', color: '#94A3B8' },
  tlTime:  { fontSize: 14, fontWeight: '800', marginTop: 1 },
  tlLine: {
    width: 2,
    height: 20,
    backgroundColor: '#E2E8F0',
    marginLeft: 15,
    marginVertical: 2,
  },
  tlLineDone: { backgroundColor: '#10B981' },
});

export default BookingTrackingScreen;