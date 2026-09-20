import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import useAppStore from '../store/useAppStore';
import { bookingAPI } from '../api/bookingAPI';
import { formatWorkedDuration } from '../utils/bookingPayment';

const fmt = (n) => `₹${Math.round(Number(n) || 0).toLocaleString('en-IN')}`;

const Row = ({ label, value }) => (
  <View style={styles.row}>
    <Text style={styles.rowLabel}>{label}</Text>
    <Text style={styles.rowValue}>{value}</Text>
  </View>
);

// Screens shown instead of the payment form when there is nothing to pay.
const BLOCKED_COPY = {
  cash_collected: {
    icon: 'cash-check',
    color: '#059669',
    bg: '#ECFDF5',
    title: 'Cash Already Collected',
    text: 'Your worker has already collected the cash for this booking. Nothing more to pay.',
  },
  already_paid: {
    icon: 'check-decagram',
    color: '#059669',
    bg: '#ECFDF5',
    title: 'Payment Completed',
    text: 'This booking has already been paid. Nothing more to pay.',
  },
  not_completed: {
    icon: 'clock-outline',
    color: '#D97706',
    bg: '#FEF3C7',
    title: 'Payment Not Available Yet',
    text: 'Payment opens once the work is completed and you have confirmed it.',
  },
  nothing_due: {
    icon: 'information-outline',
    color: '#2563EB',
    bg: '#EFF6FF',
    title: 'Nothing To Pay',
    text: 'There is no outstanding amount for this booking.',
  },
};

const LabourPaymentScreen = ({ route, navigation }) => {
  const bookingId = route.params?.bookingId;

  const walletBalance = useAppStore((s) => s.walletBalance);
  const fetchWalletBalance = useAppStore((s) => s.fetchWalletBalance);
  const fetchActiveBooking = useAppStore((s) => s.fetchActiveBooking);
  const fetchLabourBookings = useAppStore((s) => s.fetchLabourBookings);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [method, setMethod] = useState('upi');
  const [paying, setPaying] = useState(false);
  const [paidInfo, setPaidInfo] = useState(null);
  const payLock = useRef(false);

  const load = useCallback(
    async ({ silent = false } = {}) => {
      if (!bookingId) {
        setError('Booking not found');
        setLoading(false);
        return;
      }
      if (!silent) setLoading(true);
      try {
        const res = await bookingAPI.getBookingPayment(bookingId);
        if (!res || !res.success) throw new Error((res && res.message) || 'Could not load payment details');
        setData(res);
        setError(null);
      } catch (err) {
        if (!silent) setError(err?.message || 'Could not load payment details');
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [bookingId]
  );

  // Fresh on every focus + a light background refresh, so if the worker taps
  // "Cash Collected" while this page is open the pay button disappears.
  useFocusEffect(
    useCallback(() => {
      load();
      fetchWalletBalance();
      const timer = setInterval(() => {
        if (!payLock.current) load({ silent: true });
      }, 15000);
      return () => clearInterval(timer);
    }, [load, fetchWalletBalance])
  );

  const handleBack = useCallback(() => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate('StatusList');
  }, [navigation]);

  const handlePay = useCallback(async () => {
    if (payLock.current) return;
    payLock.current = true;
    setPaying(true);
    try {
      const res = await bookingAPI.payBooking(bookingId, method);
      if (!res || !res.success) throw new Error((res && res.message) || 'Payment failed');
      setPaidInfo({ amount: res.payment?.amount, method });
      fetchWalletBalance();
      fetchActiveBooking(bookingId);
      fetchLabourBookings();
    } catch (err) {
      Alert.alert(
        err?.status === 409 ? 'Already Settled' : 'Payment Failed',
        err?.message || 'Could not complete the payment. Please try again.'
      );
      // Re-sync: if the labour collected cash meanwhile this now shows the
      // "nothing to pay" screen instead of the form.
      await load({ silent: true });
    } finally {
      payLock.current = false;
      setPaying(false);
    }
  }, [bookingId, method, load, fetchWalletBalance, fetchActiveBooking, fetchLabourBookings]);

  // ── Header ────────────────────────────────────────────────────────────────
  const header = (
    <View style={styles.header}>
      <TouchableOpacity style={styles.headerBackBtn} onPress={handleBack} activeOpacity={0.7}>
        <Ionicons name="arrow-back" size={22} color="#0F172A" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Payment</Text>
      <View style={styles.secureBadge}>
        <MaterialCommunityIcons name="shield-check-outline" size={16} color="#64748B" />
        <Text style={styles.secureText}>Secure</Text>
      </View>
    </View>
  );

  // ── Paid just now ────────────────────────────────────────────────────────
  if (paidInfo) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        {header}
        <View style={styles.centerBox}>
          <View style={[styles.stateIcon, { backgroundColor: '#ECFDF5' }]}>
            <MaterialCommunityIcons name="check-decagram" size={44} color="#059669" />
          </View>
          <Text style={styles.stateTitle}>Payment Successful</Text>
          <Text style={styles.stateText}>
            {fmt(paidInfo.amount)} paid via {paidInfo.method === 'upi' ? 'UPI' : paidInfo.method === 'card' ? 'Card' : 'Wallet'}.
          </Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={handleBack} activeOpacity={0.88}>
            <Text style={styles.primaryBtnText}>Back to Booking</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (loading && !data) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        {header}
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#F59E0B" />
          <Text style={[styles.stateText, { marginTop: 12 }]}>Loading your final bill…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !data) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        {header}
        <View style={styles.centerBox}>
          <MaterialCommunityIcons name="alert-circle-outline" size={40} color="#B91C1C" />
          <Text style={[styles.stateText, { marginTop: 10 }]}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => load()} activeOpacity={0.85}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const payment = data?.payment;
  const quote = payment?.quote;

  // ── Nothing to pay (cash collected / already paid / not completed) ───────
  if (!payment?.canPay || !quote) {
    const copy = BLOCKED_COPY[payment?.reason] || BLOCKED_COPY.nothing_due;
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        {header}
        <View style={styles.centerBox}>
          <View style={[styles.stateIcon, { backgroundColor: copy.bg }]}>
            <MaterialCommunityIcons name={copy.icon} size={44} color={copy.color} />
          </View>
          <Text style={styles.stateTitle}>{copy.title}</Text>
          <Text style={styles.stateText}>{copy.text}</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={handleBack} activeOpacity={0.88}>
            <Text style={styles.primaryBtnText}>Back to Booking</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Final bill: ONE section ──────────────────────────────────────────────
  //   • under 1 hour  → the category BASE PRICE is the foundation
  //   • 1 hour or more → the calculated price (base + extra time at the
  //                      hourly rate) is the foundation
  const multi = quote.workerCount > 1;
  const duration = quote.hoursWorked != null ? formatWorkedDuration(quote.hoursWorked) : '';
  const days = quote.totalDays || 1;

  let foundationLabel;
  let subtitle;
  let badge;
  if (!quote.isImmediate) {
    foundationLabel = `Labour charge (${days} day${days > 1 ? 's' : ''}${multi ? `, ${quote.workerCount} workers` : ''})`;
    subtitle = 'Scheduled work — calculated on the per-day charge';
    badge = 'Per day';
  } else if (quote.baseFeeApplied) {
    foundationLabel = multi ? `Base price (${quote.workerCount} workers)` : 'Base price';
    subtitle = `${duration ? `Worked ${duration} — ` : ''}under 1 hour, charged on the base price`;
    badge = 'Base price';
  } else {
    foundationLabel = multi
      ? `Labour charge (${quote.workerCount} workers)`
      : `Labour charge${duration ? ` (${duration})` : ''}`;
    subtitle = `${duration ? `Worked ${duration} — ` : ''}base price + extra time at the hourly rate`;
    badge = 'Calculated';
  }

  const total = quote.total;
  const walletShort = method === 'wallet' && Number(walletBalance) < Number(total);
  const workerLine = (data.booking?.workerNames || []).join(', ');

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      {header}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Final Bill */}
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionTitleWrap}>
            <MaterialCommunityIcons name="currency-inr" size={18} color="#0F172A" />
            <Text style={styles.sectionTitle}>Final Bill</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIconWrap}>
              <MaterialCommunityIcons name={quote.baseFeeApplied ? 'timer-sand' : 'clock-outline'} size={18} color="#B45309" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>
                {data.booking?.category ? `${data.booking.category} Booking` : 'Labour Booking'}
              </Text>
              <Text style={styles.cardSubtitle}>{subtitle}</Text>
              {!!workerLine && <Text style={styles.cardWorker} numberOfLines={1}>{workerLine}</Text>}
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
          </View>

          <Row label={foundationLabel} value={fmt(quote.foundation)} />

          {quote.surgeAmount > 0 && (
            <Row label={`Peak hour surge (×${quote.peakHourMultiplier})`} value={`+${fmt(quote.surgeAmount)}`} />
          )}
          {quote.minChargeAdjustment > 0 && (
            <Row label="Minimum charge adjustment" value={`+${fmt(quote.minChargeAdjustment)}`} />
          )}
          {quote.serviceCharge > 0 && <Row label="Service charge" value={fmt(quote.serviceCharge)} />}
          {quote.costRate > 0 && <Row label={`GST (${quote.costRate}%)`} value={fmt(quote.costRateAmount)} />}
          {quote.platformCommission > 0 && (
            <Row
              label={`Platform commission (${quote.platformCommission}%)`}
              value={fmt(quote.platformCommissionAmount)}
            />
          )}
          {quote.otherCharges > 0 && <Row label="Other charges" value={fmt(quote.otherCharges)} />}

          <View style={styles.totalBox}>
            <Text style={styles.totalLabel}>Amount to Pay</Text>
            <Text style={styles.totalValue}>{fmt(total)}</Text>
          </View>
        </View>

        {/* Payment Method */}
        <View style={[styles.sectionHeaderRow, { marginTop: 22 }]}>
          <View style={styles.sectionTitleWrap}>
            <MaterialCommunityIcons name="credit-card-outline" size={18} color="#0F172A" />
            <Text style={styles.sectionTitle}>Payment Method</Text>
          </View>
        </View>
        <Text style={styles.sectionSubTitle}>Choose how you want to pay</Text>

        {/* UPI */}
        <TouchableOpacity
          style={[styles.methodCard, method === 'upi' && styles.methodCardSelected]}
          activeOpacity={0.8}
          onPress={() => setMethod('upi')}
        >
          <View style={styles.methodTop}>
            <View style={[styles.radioCircle, method === 'upi' && styles.radioCircleSelected]}>
              {method === 'upi' && <View style={styles.radioDot} />}
            </View>
            <View style={styles.upiLogoBox}>
              <Text style={styles.upiLogoText}>UPI</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.methodTitle}>UPI (Recommended)</Text>
              <Text style={styles.methodSub}>GPay, PhonePe, Paytm, BHIM</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Card */}
        <TouchableOpacity
          style={[styles.methodCard, method === 'card' && styles.methodCardSelected]}
          activeOpacity={0.8}
          onPress={() => setMethod('card')}
        >
          <View style={styles.methodTop}>
            <View style={[styles.radioCircle, method === 'card' && styles.radioCircleSelected]}>
              {method === 'card' && <View style={styles.radioDot} />}
            </View>
            <View style={styles.methodIconBox}>
              <MaterialCommunityIcons name="credit-card-outline" size={20} color="#0F172A" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.methodTitle}>Credit / Debit Card</Text>
              <Text style={styles.methodSub}>Visa, Mastercard, RuPay, Maestro</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Wallet */}
        <TouchableOpacity
          style={[styles.methodCard, method === 'wallet' && styles.methodCardSelected]}
          activeOpacity={0.8}
          onPress={() => setMethod('wallet')}
        >
          <View style={styles.methodTop}>
            <View style={[styles.radioCircle, method === 'wallet' && styles.radioCircleSelected]}>
              {method === 'wallet' && <View style={styles.radioDot} />}
            </View>
            <View style={[styles.methodIconBox, { backgroundColor: '#0F172A' }]}>
              <MaterialCommunityIcons name="wallet-outline" size={18} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.methodTitle}>Wallet</Text>
              <Text style={styles.methodSub}>Use your CONZAA wallet</Text>
              <Text style={styles.walletBalanceText}>Available balance: ₹{walletBalance}</Text>
            </View>
            <TouchableOpacity
              style={styles.addMoneyBtn}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('Wallet')}
            >
              <Text style={styles.addMoneyBtnText}>Add Money</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>

        {/* Cash note */}
        <View style={styles.cashNote}>
          <MaterialCommunityIcons name="cash-multiple" size={16} color="#1E40AF" style={{ marginTop: 1 }} />
          <Text style={styles.cashNoteText}>
            Prefer to pay in cash? Just hand it to your worker — once they mark it as collected, this payment is closed and you won't be charged again.
          </Text>
        </View>

        {/* Policies */}
        <View style={[styles.sectionHeaderRow, { marginTop: 22 }]}>
          <View style={styles.sectionTitleWrap}>
            <MaterialCommunityIcons name="shield-check-outline" size={18} color="#0F172A" />
            <Text style={styles.sectionTitle}>Booking Policies</Text>
          </View>
        </View>
        <View style={styles.policiesCard}>
          <View style={styles.policyRow}>
            <MaterialCommunityIcons name="clock-outline" size={18} color="#475569" />
            <Text style={styles.policyText}>You are charged for the actual working time</Text>
          </View>
          <View style={styles.policyRow}>
            <MaterialCommunityIcons name="shield-check-outline" size={18} color="#475569" />
            <Text style={styles.policyText}>A booking can only be paid once</Text>
          </View>
          <View style={styles.policyRow}>
            <MaterialCommunityIcons name="headphones" size={18} color="#475569" />
            <Text style={styles.policyText}>24/7 customer support</Text>
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom action bar */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomPriceCol}>
          <Text style={styles.bottomTotalAmount}>{fmt(total)}</Text>
          <Text style={styles.bottomTotalSub}>Total payable</Text>
        </View>
        <View style={styles.bottomActionCol}>
          <TouchableOpacity
            style={[styles.payBtn, (paying || walletShort) && styles.payBtnDisabled]}
            activeOpacity={0.88}
            onPress={handlePay}
            disabled={paying || walletShort}
          >
            {paying ? (
              <ActivityIndicator color="#0F172A" />
            ) : (
              <Text style={styles.payBtnText}>{walletShort ? 'Insufficient Wallet Balance' : `Pay ${fmt(total)}  →`}</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAFAF7' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerBackBtn: { padding: 6, marginLeft: -6 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#0F172A', letterSpacing: -0.2 },
  secureBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  secureText: { fontSize: 12, fontWeight: '500', color: '#64748B' },

  scrollContent: { paddingHorizontal: 16, paddingTop: 16 },

  // Sections
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitleWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: '#0F172A' },
  sectionSubTitle: { fontSize: 12, color: '#64748B', marginBottom: 10, marginTop: -4 },

  // Final bill card
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  cardIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { fontSize: 14, fontWeight: '600', color: '#0F172A' },
  cardSubtitle: { fontSize: 11, color: '#64748B', marginTop: 1 },
  cardWorker: { fontSize: 11, color: '#475569', marginTop: 2, fontWeight: '500' },
  badge: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: { fontSize: 10, fontWeight: '600', color: '#B45309' },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  rowLabel: { flex: 1, fontSize: 13, color: '#475569', fontWeight: '400', paddingRight: 8 },
  rowValue: { fontSize: 14, color: '#0F172A', fontWeight: '500' },
  totalBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 2,
  },
  totalLabel: { fontSize: 14, fontWeight: '600', color: '#0F172A' },
  totalValue: { fontSize: 17, fontWeight: '600', color: '#0F172A' },

  // Payment methods
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: { borderColor: '#F59E0B' },
  radioDot: { width: 9, height: 9, borderRadius: 4.5, backgroundColor: '#F59E0B' },
  methodCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  methodCardSelected: { borderColor: '#F59E0B', backgroundColor: '#FFFDF0' },
  methodTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  methodIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  upiLogoBox: {
    width: 34,
    height: 22,
    borderRadius: 4,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  upiLogoText: { color: '#FFFFFF', fontSize: 10, fontWeight: '700', fontStyle: 'italic' },
  methodTitle: { fontSize: 14, fontWeight: '600', color: '#0F172A' },
  methodSub: { fontSize: 11, color: '#64748B', marginTop: 2 },
  walletBalanceText: { fontSize: 11, fontWeight: '500', color: '#475569', marginTop: 4 },
  addMoneyBtn: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addMoneyBtnText: { fontSize: 12, fontWeight: '600', color: '#2563EB' },
  cashNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    padding: 10,
    gap: 8,
  },
  cashNoteText: { flex: 1, fontSize: 11, color: '#1E40AF', lineHeight: 16 },

  // Policies
  policiesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  policyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  policyText: { fontSize: 12, color: '#475569', fontWeight: '400' },

  // States
  centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  stateIcon: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  stateTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A', textAlign: 'center', marginBottom: 8 },
  stateText: { fontSize: 13, color: '#64748B', textAlign: 'center', lineHeight: 19 },
  primaryBtn: {
    marginTop: 24,
    backgroundColor: '#F59E0B',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  primaryBtnText: { fontSize: 15, fontWeight: '600', color: '#0F172A' },
  retryBtn: {
    marginTop: 14,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#FEF3C7',
  },
  retryText: { fontSize: 13, fontWeight: '600', color: '#B45309' },

  // Bottom bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 8,
  },
  bottomPriceCol: { justifyContent: 'center' },
  bottomTotalAmount: { fontSize: 18, fontWeight: '600', color: '#0F172A' },
  bottomTotalSub: { fontSize: 11, color: '#64748B', marginTop: 1 },
  bottomActionCol: { alignItems: 'center' },
  payBtn: {
    backgroundColor: '#F59E0B',
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 22,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 170,
  },
  payBtnDisabled: { opacity: 0.55 },
  payBtnText: { fontSize: 15, fontWeight: '600', color: '#0F172A' },
});

export default LabourPaymentScreen;
