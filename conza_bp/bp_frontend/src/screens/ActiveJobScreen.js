import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import usePartnerStore from '../store/usePartnerStore';
import StatusCard from '../components/StatusCard';
import { colors } from '../theme/colors';

const MapPlaceholder = ({ onNavigate }) => (
  <View style={styles.mapPlaceholder}>
    <View style={styles.mapGrid}>
      {Array.from({ length: 30 }).map((_, i) => (
        <View key={i} style={styles.mapCell} />
      ))}
    </View>
    <View style={styles.mapPin}>
      <Text style={{ fontSize: 28 }}>📍</Text>
    </View>
    <TouchableOpacity style={styles.navigateBtn} onPress={onNavigate} activeOpacity={0.85}>
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.navigateBtnInner}
      >
        <Text style={styles.navigateBtnText}>🗺️  Navigate</Text>
      </LinearGradient>
    </TouchableOpacity>
  </View>
);

const CompletionModal = ({ visible, amount, onCash, paymentDone }) => {
  const [showQR, setShowQR] = useState(false);

  const handleCash = () => {
    setShowQR(false);
    onCash();
  };

  const qrValue = `PAY-${amount}-${Date.now()}`;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>

          {paymentDone ? (
            <>
              <Text style={styles.modalEmoji}>🎉</Text>
              <Text style={styles.modalTitle}>Money Received!</Text>
              <Text style={styles.modalAmount}>+₹{amount}</Text>
              <Text style={styles.modalSub}>Added to today's earnings</Text>
            </>
          ) : !showQR ? (
            <>
              <Text style={styles.modalEmoji}>💰</Text>
              <Text style={styles.modalTitle}>Collect Payment</Text>
              <Text style={styles.modalAmount}>₹{amount}</Text>
              <Text style={styles.modalSub}>How did the customer pay?</Text>

              {/* Cash button */}
              <TouchableOpacity onPress={handleCash} activeOpacity={0.85} style={{ width: '100%' }}>
                <LinearGradient
                  colors={[colors.gradientStart, colors.gradientEnd]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.modalBtn}
                >
                  <Text style={styles.modalBtnText}>💵  Cash Received</Text>
                </LinearGradient>
              </TouchableOpacity>

              {/* QR button */}
              <TouchableOpacity
                onPress={() => setShowQR(true)}
                activeOpacity={0.8}
                style={styles.qrBtn}
              >
                <Text style={styles.qrBtnText}>📲  Show QR Code</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.modalTitle}>Scan to Pay</Text>
              <Text style={styles.modalAmount}>₹{amount}</Text>

              {/* QR placeholder */}
              <View style={styles.qrBox}>
                <View style={styles.qrInner}>
                  {/* Top-left corner */}
                  <View style={[styles.qrCorner, { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 }]} />
                  {/* Top-right corner */}
                  <View style={[styles.qrCorner, { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 }]} />
                  {/* Bottom-left corner */}
                  <View style={[styles.qrCorner, { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 }]} />
                  {/* Bottom-right corner */}
                  <View style={[styles.qrCorner, { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 }]} />

                  {/* Grid of dots simulating QR */}
                  <View style={styles.qrGrid}>
                    {Array.from({ length: 81 }).map((_, i) => (
                      <View
                        key={i}
                        style={[
                          styles.qrDot,
                          { opacity: Math.sin(i * 37 + amount) > 0 ? 1 : 0 },
                        ]}
                      />
                    ))}
                  </View>

                  <Text style={styles.qrLabel}>conza://pay/{amount}</Text>
                </View>
              </View>

              <Text style={styles.qrHint}>Ask customer to scan this code</Text>

              <TouchableOpacity onPress={handleCash} activeOpacity={0.85} style={{ width: '100%' }}>
                <LinearGradient
                  colors={[colors.gradientStart, colors.gradientEnd]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.modalBtn}
                >
                  <Text style={styles.modalBtnText}>✓  Payment Done</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setShowQR(false)} style={styles.backLink}>
                <Text style={styles.backLinkText}>← Back</Text>
              </TouchableOpacity>
            </>
          )}

        </View>
      </View>
    </Modal>
  );
};

const ActiveJobScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const activeJob = usePartnerStore((s) => s.activeJob);
  const jobStatus = usePartnerStore((s) => s.jobStatus);
  const markArrived = usePartnerStore((s) => s.markArrived);
  const startWork = usePartnerStore((s) => s.startWork);
  const completeJob = usePartnerStore((s) => s.completeJob);
  const resetActiveJob = usePartnerStore((s) => s.resetActiveJob);
  const [showModal, setShowModal] = useState(false);

  const getStatusForStep = useCallback((step) => {
    const order = ['on_way', 'arrived', 'in_progress', 'completed'];
    const currentIdx = order.indexOf(jobStatus);
    const stepIdx = step - 1;
    if (stepIdx < currentIdx) return 'done';
    if (stepIdx === currentIdx) return 'active';
    return 'pending';
  }, [jobStatus]);

  const handleWorkDone = () => {
    completeJob();
    setShowModal(true);
  };

  const [paymentDone, setPaymentDone] = useState(false);

  const handleCashReceived = () => {
    setPaymentDone(true);
    setTimeout(() => {
      setPaymentDone(false);
      setShowModal(false);
      resetActiveJob();
      navigation.navigate('Home');
    }, 1800);
  };

  if (!activeJob) {
    return (
      <View style={[styles.screen, styles.noJobState]}>
        <Text style={{ fontSize: 48 }}>🏠</Text>
        <Text style={styles.noJobText}>No active job</Text>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* Nav header */}
      <View style={styles.navHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle}>Active Job</Text>
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* Map */}
        <MapPlaceholder onNavigate={() => {}} />

        {/* Job info */}
        <View style={styles.jobInfoCard}>
          <View style={styles.jobInfoRow}>
            <View style={styles.customerAvatar}>
              <Text style={styles.customerAvatarText}>{activeJob.userName.charAt(0)}</Text>
            </View>
            <View style={{ flex: 1 }}>
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

        {/* Status workflow */}
        <Text style={styles.workflowTitle}>Job Progress</Text>

        <StatusCard
          step={1}
          title="On the Way"
          description="Head to the customer's location. Tap when you've arrived."
          status={getStatusForStep(1)}
          buttonLabel="Mark as Arrived"
          onPress={markArrived}
        />

        <StatusCard
          step={2}
          title="Arrived at Location"
          description="You've reached the site. Confirm with the customer and start the job."
          status={getStatusForStep(2)}
          buttonLabel="Start Work"
          onPress={startWork}
        />

        <StatusCard
          step={3}
          title="Work in Progress"
          description="Complete the job carefully. Tap when all work is done."
          status={getStatusForStep(3)}
          buttonLabel="Work Done ✓"
          onPress={handleWorkDone}
          isLast
        />

      </ScrollView>

      <CompletionModal
        visible={showModal}
        amount={activeJob.estimatedAmount}
        onCash={handleCashReceived}
        paymentDone={paymentDone}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  noJobState: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  noJobText: {
    fontSize: 16,
    color: colors.textMuted,
    fontWeight: '600',
  },
  navHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 28,
    color: colors.textPrimary,
    fontWeight: '300',
    lineHeight: 32,
  },
  navTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(224,59,59,0.12)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 5,
    borderWidth: 1,
    borderColor: 'rgba(224,59,59,0.3)',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.danger,
  },
  liveText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.danger,
    letterSpacing: 0.8,
  },
  content: {
    paddingBottom: 40,
  },
  mapPlaceholder: {
    height: 200,
    backgroundColor: '#E8EDF5',
    margin: 20,
    borderRadius: 18,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    position: 'relative',
  },
  mapGrid: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  mapCell: {
    width: '10%',
    height: 40,
    borderWidth: 0.3,
    borderColor: 'rgba(100,120,150,0.15)',
  },
  mapPin: {
    position: 'absolute',
    alignItems: 'center',
  },
  navigateBtn: {
    position: 'absolute',
    bottom: 14,
    right: 14,
  },
  navigateBtnInner: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  navigateBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  jobInfoCard: {
    marginHorizontal: 20,
    marginBottom: 24,
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 6,
    elevation: 2,
  },
  jobInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  customerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.accentYellowSoft,
    borderWidth: 1.5,
    borderColor: colors.accentYellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customerAvatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.accentAmber,
  },
  customerName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  customerService: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  earningBadge: {
    backgroundColor: colors.accentAmberSoft,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(240,165,0,0.25)',
  },
  earningText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.accentAmber,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: 10,
  },
  jobAddress: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 6,
    fontWeight: '500',
  },
  jobDesc: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 17,
  },
  workflowTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginHorizontal: 20,
    marginBottom: 16,
    letterSpacing: 0.2,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCard: {
    width: '80%',
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  modalEmoji: {
    fontSize: 52,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  modalAmount: {
    fontSize: 36,
    fontWeight: '900',
    color: colors.statusGreen,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  modalSub: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 28,
    fontWeight: '500',
    textAlign: 'center',
  },
  modalBtn: {
    borderRadius: 14,
    paddingHorizontal: 40,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: 0.3,
  },
  qrBtn: {
    width: '100%',
    marginTop: 10,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
  },
  qrBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.3,
  },
  qrBox: {
    width: 200,
    height: 200,
    marginVertical: 16,
    borderRadius: 16,
    backgroundColor: colors.white,
    padding: 10,
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  qrInner: {
    flex: 1,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrCorner: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderWidth: 3,
    borderColor: colors.textPrimary,
  },
  qrGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 126,
    height: 126,
    marginBottom: 6,
  },
  qrDot: {
    width: 14,
    height: 14,
    backgroundColor: colors.textPrimary,
    margin: 0,
  },
  qrLabel: {
    fontSize: 9,
    color: colors.textMuted,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  qrHint: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  backLink: {
    marginTop: 12,
    paddingVertical: 6,
  },
  backLinkText: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '600',
  },
});

export default ActiveJobScreen;
