// src/screens/ActiveJobScreen.js
import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Modal, StatusBar, Alert, Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { WebView } from 'react-native-webview';
import usePartnerStore, {
  selectActiveJob, selectJobStatus, selectCheckInTime,
  selectMarkArrived, selectStartWork, selectCompleteJob, selectResetActiveJob,
} from '../store/usePartnerStore';
import StatusCard from '../components/StatusCard';
import { colors } from '../theme/colors';

const GRAD_START = { x: 0, y: 0 };
const GRAD_END   = { x: 1, y: 0 };

// ── Map with WebView + Navigate button ───────────────────────────────────────
const MapPlaceholder = React.memo(({ onNavigate, address, latitude, longitude }) => {
  const hasCoords = latitude && longitude;

  const leafletHTML = hasCoords ? `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body, #map { width: 100%; height: 100%; }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        const map = L.map('map', { zoomControl: false, attributionControl: false })
          .setView([${latitude}, ${longitude}], 16);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

        const icon = L.divIcon({
          html: '<div style="background:#F0A500;width:18px;height:18px;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.4);"></div>',
          iconSize: [18, 18],
          iconAnchor: [9, 9],
          className: '',
        });

        L.marker([${latitude}, ${longitude}], { icon }).addTo(map);
      </script>
    </body>
    </html>
  ` : null;

  return (
    <View style={styles.mapPlaceholder}>
      {leafletHTML ? (
        <WebView
          source={{ html: leafletHTML }}
          style={styles.webview}
          scrollEnabled={false}
          pointerEvents="none"
          javaScriptEnabled
          domStorageEnabled
          originWhitelist={['*']}
        />
      ) : (
        <View style={styles.mapFallback}>
          <Text style={{ fontSize: 32 }}>🗺️</Text>
          <Text style={styles.mapFallbackText}>No location data</Text>
        </View>
      )}

      <TouchableOpacity style={styles.navigateBtn} onPress={onNavigate} activeOpacity={0.85}>
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientEnd]}
          start={GRAD_START} end={GRAD_END}
          style={styles.navigateBtnInner}
        >
          <Text style={styles.navigateBtnText}>🗺️  Navigate</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
});

// ── CompletionModal ───────────────────────────────────────────────────────────
const CompletionModal = React.memo(({ visible, amount, onFinished }) => {
  const [showQR, setShowQR]           = useState(false);
  const [paymentDone, setPaymentDone] = useState(false);
  const [paymentType, setPaymentType] = useState('cash'); // 'cash' | 'online'

  const handleCash = useCallback(() => {
    setPaymentType('cash');
    setShowQR(false);
    setPaymentDone(true);
    setTimeout(() => {
      setPaymentDone(false);
      onFinished('cash');
    }, 1800);
  }, [onFinished]);

  const handleQRDone = useCallback(() => {
    setPaymentType('online');
    setPaymentDone(true);
    setTimeout(() => {
      setPaymentDone(false);
      onFinished('online');
    }, 1800);
  }, [onFinished]);

  const handleShowQR = useCallback(() => setShowQR(true),  []);
  const handleBackQR = useCallback(() => setShowQR(false), []);

  const qrDots = useMemo(() =>
    Array.from({ length: 81 }, (_, i) => (
      <View key={i} style={[styles.qrDot, { opacity: Math.sin(i * 37 + amount) > 0 ? 1 : 0 }]} />
    )), [amount]);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          {paymentDone ? (
            <>
              <Text style={styles.modalEmoji}>🎉</Text>
              <Text style={styles.modalTitle}>Money Received!</Text>
              <Text style={styles.modalAmount}>+₹{amount}</Text>
              <Text style={styles.modalSub}>
                {paymentType === 'online' ? '📱 Online · Added to Online Earned' : '💵 Cash · Commission due to Conza'}
              </Text>
            </>
          ) : !showQR ? (
            <>
              <Text style={styles.modalEmoji}>💰</Text>
              <Text style={styles.modalTitle}>Collect Payment</Text>
              <Text style={styles.modalAmount}>₹{amount}</Text>
              <Text style={styles.modalSub}>How did the customer pay?</Text>
              <TouchableOpacity onPress={handleCash} activeOpacity={0.85} style={styles.fullWidth}>
                <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} start={GRAD_START} end={GRAD_END} style={styles.modalBtn}>
                  <Text style={styles.modalBtnText}>💵  Cash Received</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleShowQR} activeOpacity={0.8} style={styles.qrBtn}>
                <Text style={styles.qrBtnText}>📲  Show QR Code</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.modalTitle}>Scan to Pay</Text>
              <Text style={styles.modalAmount}>₹{amount}</Text>
              <View style={styles.qrBox}>
                <View style={styles.qrInner}>
                  <View style={[styles.qrCorner, styles.qrTL]} />
                  <View style={[styles.qrCorner, styles.qrTR]} />
                  <View style={[styles.qrCorner, styles.qrBL]} />
                  <View style={[styles.qrCorner, styles.qrBR]} />
                  <View style={styles.qrGrid}>{qrDots}</View>
                  <Text style={styles.qrLabel}>conza://pay/{amount}</Text>
                </View>
              </View>
              <Text style={styles.qrHint}>Ask customer to scan this code</Text>
              <TouchableOpacity onPress={handleQRDone} activeOpacity={0.85} style={styles.fullWidth}>
                <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} start={GRAD_START} end={GRAD_END} style={styles.modalBtn}>
                  <Text style={styles.modalBtnText}>✓  Payment Done</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleBackQR} style={styles.backLink}>
                <Text style={styles.backLinkText}>← Back</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
});

// ── AwaitingConfirmationModal ────────────────────────────────────────────────
const AwaitingConfirmationModal = React.memo(({ visible }) => (
  <Modal visible={visible} transparent animationType="fade">
    <View style={styles.modalOverlay}>
      <View style={styles.modalCard}>
        <Text style={styles.modalEmoji}>⏳</Text>
        <Text style={styles.modalTitle}>Waiting for Customer</Text>
        <Text style={styles.modalSub}>
          Please wait while the customer confirms that the work has been completed.
        </Text>
      </View>
    </View>
  </Modal>
));

// ── No-job placeholder ────────────────────────────────────────────────────────
const NoJobView = () => (
  <View style={[styles.screen, styles.noJobState]}>
    <Text style={{ fontSize: 48 }}>🏠</Text>
    <Text style={styles.noJobText}>No active job</Text>
  </View>
);

// ── Main screen ───────────────────────────────────────────────────────────────
const ActiveJobScreen = ({ navigation }) => {
  const insets         = useSafeAreaInsets();
  const activeJob      = usePartnerStore(selectActiveJob);
  const jobStatus      = usePartnerStore(selectJobStatus);
  const markArrived    = usePartnerStore(selectMarkArrived);
  const startWork      = usePartnerStore(selectStartWork);
  const completeJob    = usePartnerStore(selectCompleteJob);
  const resetActiveJob = usePartnerStore(selectResetActiveJob);
  const [showModal, setShowModal] = useState(false);

  const stepStatuses = useMemo(() => {
    const order = ['pending', 'accepted', 'arrived', 'in_progress', 'awaiting_customer_confirmation', 'completed'];
    const currentIdx = order.indexOf(jobStatus);
    
    // step 1: arrived (idx 2)
    // step 2: in_progress (idx 3)
    // step 3: awaiting_customer_confirmation (idx 4) or completed (idx 5)
    
    return [0, 1, 2].map((i) => {
      // mapping our 3 steps to the status index
      // Step 1 (idx 0) -> 'accepted' (1) active, 'arrived' (2+) done
      // Step 2 (idx 1) -> 'arrived' (2) active, 'in_progress' (3+) done
      // Step 3 (idx 2) -> 'in_progress' (3) active, 'awaiting_customer_confirmation' (4) active, 'completed' (5) done
      
      if (i === 0) return currentIdx >= 2 ? 'done' : currentIdx === 1 ? 'active' : 'pending';
      if (i === 1) return currentIdx >= 3 ? 'done' : currentIdx === 2 ? 'active' : 'pending';
      if (i === 2) return currentIdx >= 5 ? 'done' : currentIdx >= 3 ? 'active' : 'pending';
      return 'pending';
    });
  }, [jobStatus]);

  const handleWorkDone = useCallback(async () => {
    // Instead of showing modal directly, ask customer for confirmation
    await usePartnerStore.getState().updateRequestStatus(activeJob.id, 'awaiting_customer_confirmation');
    // Store updates status, which will trigger the AwaitingConfirmationModal (jobStatus === 'awaiting_customer_confirmation')
  }, [activeJob]);

  const handleFinished = useCallback(async (paymentType) => {
    setShowModal(false);
    await completeJob(paymentType === 'online' ? 'upi' : 'cod');
    resetActiveJob();
    navigation.navigate('Tabs', { screen: 'Home' });
  }, [completeJob, resetActiveJob, navigation]);

  // ── Navigate button — opens Google Maps ──────────────────────────────────
  const handleNavigate = useCallback(() => {
    if (!activeJob) return;

    const { latitude, longitude, address } = activeJob;

    let url;
    if (latitude && longitude) {
      // Coords available — most accurate
      url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`;
    } else if (address) {
      // Fall back to address string
      url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}&travelmode=driving`;
    } else {
      Alert.alert('No Location', 'No address or coordinates available for this job.');
      return;
    }

    Linking.canOpenURL(url).then((supported) => {
      if (supported) {
        Linking.openURL(url);
      } else {
        // Fallback to browser maps
        Linking.openURL(
          `https://maps.google.com/?q=${latitude && longitude
            ? `${latitude},${longitude}`
            : encodeURIComponent(address)}`
        );
      }
    });
  }, [activeJob]);

  const handleBack = useCallback(() => navigation.goBack(), [navigation]);

  const handleCancelJob = useCallback(() => {
    Alert.alert(
      'Cancel Job',
      'Are you sure you want to cancel this job? This may affect your rating.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            await usePartnerStore.getState().updateRequestStatus(activeJob.id, 'cancelled');
            navigation.navigate('Tabs', { screen: 'Home' });
          },
        },
      ]
    );
  }, [activeJob, navigation]);

  const containerStyle = useMemo(
    () => [styles.screen, { paddingTop: insets.top }],
    [insets.top],
  );

  if (!activeJob) return <NoJobView />;

  return (
    <View style={containerStyle}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <View style={styles.navHeader}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle}>Active Job</Text>
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        <MapPlaceholder
          onNavigate={handleNavigate}
          address={activeJob.address}
          latitude={activeJob.latitude}
          longitude={activeJob.longitude}
        />

        <View style={styles.jobInfoCard}>
          <View style={styles.jobInfoRow}>
            <View style={styles.customerAvatar}>
              <Text style={styles.customerAvatarText}>{activeJob.userName.charAt(0)}</Text>
            </View>
            <View style={styles.jobInfoFlex}>
              <Text style={styles.customerName}>{activeJob.userName}</Text>
              <Text style={styles.customerService}>{activeJob.service} · {activeJob.subService}</Text>
            </View>
            <View style={styles.earningBadge}>
              <Text style={styles.earningText}>₹{activeJob.estimatedAmount}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <Text style={styles.jobAddress}>📍 {activeJob.address}</Text>
          <Text style={styles.jobDesc} numberOfLines={2}>{activeJob.description}</Text>
        </View>

        <Text style={styles.workflowTitle}>Job Progress</Text>

            <StatusCard
              step={1} title="Waiting for Arrival"
              description="You've accepted the job. Head to the customer's location."
              status={jobStatus === 'accepted' ? 'active' : 'done'} buttonLabel="Mark as Arrived"
              onPress={markArrived}
            />
            <StatusCard
              step={2} title="At Location"
              description="You've reached the site. Click below to start the work timer."
              status={jobStatus === 'arrived' ? 'active' : (['in_progress', 'completed'].includes(jobStatus) ? 'done' : 'pending')} buttonLabel="Start Work ▶"
              onPress={startWork}
            />
            <StatusCard
              step={3} title="Work in Progress"
              description="Finish the work and collect payment from the customer."
              status={jobStatus === 'in_progress' ? 'active' : (['awaiting_customer_confirmation', 'completed'].includes(jobStatus) ? 'done' : 'pending')} buttonLabel="Work Completed ✓"
              onPress={handleWorkDone} isLast
            />

            {(!['awaiting_customer_confirmation', 'completed'].includes(jobStatus)) && (
              <TouchableOpacity style={styles.cancelBtn} onPress={handleCancelJob}>
                <Text style={styles.cancelBtnText}>Cancel Job</Text>
              </TouchableOpacity>
            )}

      </ScrollView>

      <CompletionModal
        visible={jobStatus === 'completed' && showModal === false} // Only show if completed via customer confirmation
        amount={activeJob.estimatedAmount}
        onFinished={handleFinished}
      />
      
      <AwaitingConfirmationModal 
        visible={jobStatus === 'awaiting_customer_confirmation'} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen:           { flex: 1, backgroundColor: colors.background },
  noJobState:       { alignItems: 'center', justifyContent: 'center', gap: 16 },
  noJobText:        { fontSize: 16, color: colors.textMuted, fontWeight: '600' },
  navHeader:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.surface },
  backBtn:          { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backIcon:         { fontSize: 28, color: colors.textPrimary, fontWeight: '300', lineHeight: 32 },
  navTitle:         { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  liveBadge:        { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(224,59,59,0.12)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, gap: 5, borderWidth: 1, borderColor: 'rgba(224,59,59,0.3)' },
  liveDot:          { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.danger },
  liveText:         { fontSize: 10, fontWeight: '800', color: colors.danger, letterSpacing: 0.8 },
  content:          { paddingBottom: 40 },
  mapPlaceholder:   { height: 200, backgroundColor: '#E8EDF5', margin: 20, borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: colors.border, position: 'relative' },
  webview:          { width: '100%', height: 200 },
  mapFallback:      { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  mapFallbackText:  { fontSize: 13, color: colors.textMuted, fontWeight: '500' },
  navigateBtn:      { position: 'absolute', bottom: 14, right: 14 },
  navigateBtnInner: { borderRadius: 12, paddingHorizontal: 16, paddingVertical: 9 },
  navigateBtnText:  { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  jobInfoCard:      { marginHorizontal: 20, marginBottom: 24, backgroundColor: colors.surface, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: colors.border },
  jobInfoRow:       { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 12 },
  jobInfoFlex:      { flex: 1 },
  customerAvatar:   { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.accentYellowSoft, borderWidth: 1.5, borderColor: colors.accentYellow, alignItems: 'center', justifyContent: 'center' },
  customerAvatarText: { fontSize: 18, fontWeight: '800', color: colors.accentAmber },
  customerName:     { fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginBottom: 2 },
  customerService:  { fontSize: 12, color: colors.textSecondary, fontWeight: '500' },
  earningBadge:     { backgroundColor: colors.accentAmberSoft, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: 'rgba(240,165,0,0.25)' },
  earningText:      { fontSize: 15, fontWeight: '800', color: colors.accentAmber },
  divider:          { height: 1, backgroundColor: colors.border, marginBottom: 10 },
  jobAddress:       { fontSize: 12, color: colors.textSecondary, marginBottom: 6, fontWeight: '500' },
  jobDesc:          { fontSize: 12, color: colors.textMuted, lineHeight: 17 },
  workflowTitle:    { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginHorizontal: 20, marginBottom: 16, letterSpacing: 0.2 },
  fullWidth:        { width: '100%' },
  modalOverlay:     { flex: 1, backgroundColor: colors.overlay, alignItems: 'center', justifyContent: 'center' },
  modalCard:        { width: '80%', backgroundColor: colors.surface, borderRadius: 24, padding: 32, alignItems: 'center', gap: 4 },
  modalEmoji:       { fontSize: 52, marginBottom: 12 },
  modalTitle:       { fontSize: 22, fontWeight: '800', color: colors.textPrimary },
  modalAmount:      { fontSize: 36, fontWeight: '900', color: colors.statusGreen },
  modalSub:         { fontSize: 13, color: colors.textMuted, marginBottom: 20, fontWeight: '500', textAlign: 'center' },
  modalBtn:         { borderRadius: 14, paddingHorizontal: 40, paddingVertical: 14, alignItems: 'center' },
  modalBtnText:     { fontSize: 15, fontWeight: '800', color: colors.textPrimary, letterSpacing: 0.3 },
  qrBtn:            { width: '100%', marginTop: 10, paddingVertical: 14, borderRadius: 14, alignItems: 'center', borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.surfaceElevated },
  qrBtnText:        { fontSize: 15, fontWeight: '700', color: colors.textSecondary, letterSpacing: 0.3 },
  qrBox:            { width: 200, height: 200, marginVertical: 16, borderRadius: 16, backgroundColor: colors.white, padding: 10, borderWidth: 1, borderColor: colors.border },
  qrInner:          { flex: 1, position: 'relative', alignItems: 'center', justifyContent: 'center' },
  qrCorner:         { position: 'absolute', width: 22, height: 22, borderWidth: 3, borderColor: colors.textPrimary },
  qrTL:             { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  qrTR:             { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  qrBL:             { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  qrBR:             { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
  qrGrid:           { flexDirection: 'row', flexWrap: 'wrap', width: 126, height: 126, marginBottom: 6 },
  qrDot:            { width: 14, height: 14, backgroundColor: colors.textPrimary },
  qrLabel:          { fontSize: 9, color: colors.textMuted, fontWeight: '500', letterSpacing: 0.3 },
  qrHint:           { fontSize: 12, color: colors.textMuted, marginBottom: 14, fontWeight: '500', textAlign: 'center' },
  backLink:         { marginTop: 12, paddingVertical: 6 },
  backLinkText:     { fontSize: 13, color: colors.textMuted, fontWeight: '600' },
  cancelBtn:        { marginTop: 20, padding: 15, alignItems: 'center' },
  cancelBtnText:    { color: colors.danger, fontWeight: '700', fontSize: 14 },
  waitingCard: {
    marginHorizontal: 20,
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 24,
    alignItems: 'center',
  },
  waitingEmoji: { fontSize: 40, marginBottom: 12 },
  waitingTitle: { fontSize: 16, fontWeight: '800', color: colors.textPrimary, marginBottom: 8, textAlign: 'center' },
  waitingText: { fontSize: 13, color: colors.textMuted, lineHeight: 19, textAlign: 'center' },
});

export default ActiveJobScreen;