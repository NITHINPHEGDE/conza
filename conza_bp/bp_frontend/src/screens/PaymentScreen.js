import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  Modal,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';

const COMMISSION_RATE = 0.03;

const PAYMENT_HISTORY = [
  {
    id: 'p1',
    type: 'by_conza',
    label: 'Payment by Conza',
    amount: 850,
    commission: 25.5,
    date: 'Today',
    time: '12:45 PM',
    customer: 'Priya K',
    service: 'Water Tank Repair',
    method: 'Online',
  },
  {
    id: 'p2',
    type: 'to_conza',
    label: 'Commission to Conza',
    amount: 700,
    commission: 21,
    date: 'Yesterday',
    time: '09:50 AM',
    customer: 'Rahul D',
    service: 'Pipe Fitting',
    method: 'Cash',
  },
  {
    id: 'p3',
    type: 'by_conza',
    label: 'Payment by Conza',
    amount: 1100,
    commission: 33,
    date: '5 days ago',
    time: '05:35 PM',
    customer: 'Ajay V',
    service: 'Full Bathroom Fix',
    method: 'Online',
  },
  {
    id: 'p4',
    type: 'to_conza',
    label: 'Commission to Conza',
    amount: 600,
    commission: 18,
    date: '6 days ago',
    time: '03:10 PM',
    customer: 'Suresh M',
    service: 'Leak Repair',
    method: 'Cash',
  },
];

const PAYMENT_OPTIONS = ['UPI', 'Net Banking', 'Debit Card', 'Wallet'];

// ── Detail Modal ──────────────────────────────────────────────────────────────
const DetailModal = ({ visible, item, onClose }) => {
  if (!item) return null;
  const isByConza = item.type === 'by_conza';
  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.detailCard}>
          <View style={[styles.detailBadge, isByConza ? styles.detailBadgeGreen : styles.detailBadgeRed]}>
            <Text style={styles.detailBadgeText}>{isByConza ? '📥 Received' : '📤 Paid'}</Text>
          </View>
          <Text style={styles.detailCustomer}>{item.customer}</Text>
          <Text style={styles.detailService}>{item.service} · {item.method}</Text>
          <Text style={styles.detailDate}>{item.date} · {item.time}</Text>

          <View style={styles.detailDivider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailRowLabel}>Payment</Text>
            <Text style={styles.detailRowValue}>₹{item.amount}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailRowLabel}>Commission (3%)</Text>
            <Text style={[styles.detailRowValue, { color: colors.danger }]}>-₹{item.commission}</Text>
          </View>
          <View style={[styles.detailDivider, { marginVertical: 8 }]} />
          <View style={styles.detailRow}>
            <Text style={[styles.detailRowLabel, { fontWeight: '800', color: colors.textPrimary }]}>Total</Text>
            <Text style={[styles.detailRowValue, {
              color: isByConza ? colors.statusGreen : colors.danger,
              fontSize: 18,
            }]}>
              {isByConza ? '+' : '-'}₹{(item.amount - item.commission).toFixed(0)}
            </Text>
          </View>

          <TouchableOpacity onPress={onClose} style={styles.detailClose}>
            <Text style={styles.detailCloseText}>Close</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

// ── Withdraw Modal ────────────────────────────────────────────────────────────
const WithdrawModal = ({ visible, onClose }) => {
  const [amount, setAmount] = useState('');
  const [done, setDone] = useState(false);

  const handleSubmit = () => {
    if (!amount) return;
    setDone(true);
    setTimeout(() => {
      setDone(false);
      setAmount('');
      onClose();
    }, 2000);
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.actionCard}>
          {done ? (
            <>
              <Text style={styles.actionEmoji}>✅</Text>
              <Text style={styles.actionTitle}>Request Sent!</Text>
              <Text style={styles.actionSub}>Your withdrawal of ₹{amount} is being processed.</Text>
            </>
          ) : (
            <>
              <Text style={styles.actionEmoji}>💸</Text>
              <Text style={styles.actionTitle}>Withdraw Request</Text>
              <Text style={styles.actionSub}>Enter the amount you want to withdraw</Text>

              <TextInput
                style={styles.input}
                placeholder="Enter amount (₹)"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
              />

              <TouchableOpacity onPress={handleSubmit} activeOpacity={0.85} style={{ width: '100%' }}>
                <LinearGradient
                  colors={[colors.gradientStart, colors.gradientEnd]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={styles.actionBtn}
                >
                  <Text style={styles.actionBtnText}>Submit Request</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

// ── Pay Platform Modal ────────────────────────────────────────────────────────
const PayPlatformModal = ({ visible, onClose, pendingAmount }) => {
  const [selected, setSelected] = useState(null);
  const [done, setDone] = useState(false);

  const handlePay = () => {
    if (!selected) return;
    setDone(true);
    setTimeout(() => {
      setDone(false);
      setSelected(null);
      onClose();
    }, 2000);
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.actionCard}>
          {done ? (
            <>
              <Text style={styles.actionEmoji}>🎉</Text>
              <Text style={styles.actionTitle}>Payment Done!</Text>
              <Text style={styles.actionSub}>₹{pendingAmount} paid to Conza successfully.</Text>
            </>
          ) : (
            <>
              <Text style={styles.actionEmoji}>🏦</Text>
              <Text style={styles.actionTitle}>Pay Pending Amount</Text>
              <Text style={styles.actionSub}>Pending commission due to Conza</Text>

              <View style={styles.pendingBox}>
                <Text style={styles.pendingLabel}>Amount Due</Text>
                <Text style={styles.pendingAmount}>₹{pendingAmount}</Text>
              </View>

              <Text style={styles.optionsLabel}>Choose Payment Method</Text>
              {PAYMENT_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[styles.optionRow, selected === opt && styles.optionRowActive]}
                  onPress={() => setSelected(opt)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.optionRadio, selected === opt && styles.optionRadioActive]}>
                    {selected === opt && <View style={styles.optionRadioDot} />}
                  </View>
                  <Text style={[styles.optionText, selected === opt && styles.optionTextActive]}>{opt}</Text>
                </TouchableOpacity>
              ))}

              <TouchableOpacity
                onPress={handlePay}
                activeOpacity={0.85}
                style={{ width: '100%', marginTop: 16 }}
                disabled={!selected}
              >
                <LinearGradient
                  colors={selected ? [colors.gradientStart, colors.gradientEnd] : [colors.surfaceElevated, colors.border]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={styles.actionBtn}
                >
                  <Text style={[styles.actionBtnText, !selected && { color: colors.textMuted }]}>
                    Pay ₹{pendingAmount}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

// ── Main Screen ───────────────────────────────────────────────────────────────
const PaymentScreen = () => {
  const insets = useSafeAreaInsets();
  const [selectedItem, setSelectedItem] = useState(null);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showPayPlatform, setShowPayPlatform] = useState(false);

  const summary = useMemo(() => {
    let onlinePaid = 0, cashCollected = 0, byConza = 0, toConza = 0;
    PAYMENT_HISTORY.forEach((p) => {
      if (p.method === 'Online') onlinePaid += p.amount;
      if (p.method === 'Cash') cashCollected += p.amount;
      if (p.type === 'by_conza') byConza += (p.amount - p.commission);
      if (p.type === 'to_conza') toConza += p.commission;
    });
    return { onlinePaid, cashCollected, byConza, toConza };
  }, []);

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 10 }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* Scrollable content */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Header */}
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Payments</Text>
          <View style={styles.commissionBadge}>
            <Text style={styles.commissionText}>Conza Commission: 3%</Text>
          </View>
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryGrid}>
          <View style={[styles.summaryCard, styles.summaryCardGreen]}>
            <Text style={styles.summaryIcon}>💳</Text>
            <Text style={styles.summaryValue}>₹{summary.onlinePaid}</Text>
            <Text style={styles.summaryLabel}>Online Paid</Text>
          </View>
          <View style={[styles.summaryCard, styles.summaryCardAmber]}>
            <Text style={styles.summaryIcon}>💵</Text>
            <Text style={styles.summaryValue}>₹{summary.cashCollected}</Text>
            <Text style={styles.summaryLabel}>Cash Collected</Text>
          </View>
        </View>

        <View style={styles.summaryGrid}>
          <View style={[styles.summaryCard, styles.summaryCardBlue]}>
            <Text style={styles.summaryIcon}>📥</Text>
            <Text style={styles.summaryValue}>₹{summary.byConza}</Text>
            <Text style={styles.summaryLabel}>Payment by Conza</Text>
          </View>
          <View style={[styles.summaryCard, styles.summaryCardRed]}>
            <Text style={styles.summaryIcon}>📤</Text>
            <Text style={styles.summaryValue}>₹{summary.toConza}</Text>
            <Text style={styles.summaryLabel}>Payment to Conza</Text>
          </View>
        </View>

        {/* History */}
        <Text style={styles.sectionTitle}>Payment History</Text>

        {PAYMENT_HISTORY.map((item) => {
          const isByConza = item.type === 'by_conza';
          return (
            <TouchableOpacity
              key={item.id}
              style={styles.historyCard}
              onPress={() => setSelectedItem(item)}
              activeOpacity={0.8}
            >
              <View style={[styles.historyIconBox, isByConza ? styles.historyIconGreen : styles.historyIconRed]}>
                <Text style={{ fontSize: 18 }}>{isByConza ? '📥' : '📤'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.historyLabel}>{item.label}</Text>
                <Text style={styles.historySub}>{item.customer} · {item.service}</Text>
                <Text style={styles.historyDate}>{item.date} · {item.time}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.historyAmount, { color: isByConza ? colors.statusGreen : colors.danger }]}>
                  {isByConza ? '+' : '-'}₹{(item.amount - item.commission).toFixed(0)}
                </Text>
                <Text style={styles.historyMethod}>{item.method}</Text>
              </View>
            </TouchableOpacity>
          );
        })}

      </ScrollView>

      {/* Static Bottom Bar — always visible, never scrolls */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity
          style={styles.withdrawBtn}
          onPress={() => setShowWithdraw(true)}
          activeOpacity={0.85}
        >
          <Text style={styles.withdrawIcon}>💸</Text>
          <Text style={styles.withdrawBtnText}>Withdraw Request</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setShowPayPlatform(true)}
          activeOpacity={0.85}
          style={{ flex: 1 }}
        >
          <LinearGradient
            colors={[colors.gradientStart, colors.gradientEnd]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.payBtn}
          >
            <Text style={styles.payIcon}>🏦</Text>
            <Text style={styles.payBtnText}>Pay Platform</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Modals */}
      <DetailModal
        visible={!!selectedItem}
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
      />
      <WithdrawModal visible={showWithdraw} onClose={() => setShowWithdraw(false)} />
      <PayPlatformModal
        visible={showPayPlatform}
        onClose={() => setShowPayPlatform(false)}
        pendingAmount={summary.toConza}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },

  // Extra bottom padding so last card clears the static bar
  scroll: { paddingBottom: 140 },

  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 18,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: 0.2,
  },
  commissionBadge: {
    backgroundColor: colors.accentYellowSoft,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.accentYellow,
  },
  commissionText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.accentAmber,
  },

  summaryGrid: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 12,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 18,
    padding: 16,
    alignItems: 'flex-start',
    borderWidth: 1,
  },
  summaryCardGreen: {
    backgroundColor: colors.statusGreenSoft,
    borderColor: colors.statusGreen,
  },
  summaryCardAmber: {
    backgroundColor: colors.accentAmberSoft,
    borderColor: colors.accentAmber,
  },
  summaryCardBlue: {
    backgroundColor: 'rgba(59,130,246,0.08)',
    borderColor: 'rgba(59,130,246,0.3)',
  },
  summaryCardRed: {
    backgroundColor: colors.dangerSoft,
    borderColor: colors.danger,
  },
  summaryIcon: { fontSize: 22, marginBottom: 8 },
  summaryValue: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 14,
    letterSpacing: 0.2,
  },

  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 20,
    marginBottom: 10,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
  },
  historyIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  historyIconGreen: {
    backgroundColor: colors.statusGreenSoft,
    borderColor: colors.statusGreen,
  },
  historyIconRed: {
    backgroundColor: colors.dangerSoft,
    borderColor: colors.danger,
  },
  historyLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  historySub: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
    marginBottom: 2,
  },
  historyDate: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '400',
  },
  historyAmount: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 3,
  },
  historyMethod: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '500',
  },

  // ── Static bottom bar ──────────────────────────────────────────────
  bottomBar: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 14,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 10,
  },
  withdrawBtn: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.accentYellow,
    backgroundColor: colors.accentYellowSoft,
    gap: 4,
  },
  withdrawIcon: { fontSize: 18 },
  withdrawBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.accentAmber,
  },
  payBtn: {
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  payIcon: { fontSize: 18 },
  payBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: 0.3,
  },

  // ── Modals ─────────────────────────────────────────────────────────
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  detailCard: {
    width: '90%',
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  detailBadge: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 14,
    borderWidth: 1,
  },
  detailBadgeGreen: {
    backgroundColor: colors.statusGreenSoft,
    borderColor: colors.statusGreen,
  },
  detailBadgeRed: {
    backgroundColor: colors.dangerSoft,
    borderColor: colors.danger,
  },
  detailBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  detailCustomer: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  detailService: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
    marginBottom: 2,
  },
  detailDate: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 16,
  },
  detailDivider: {
    width: '100%',
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 6,
  },
  detailRowLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  detailRowValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  detailClose: {
    marginTop: 20,
    paddingVertical: 8,
    paddingHorizontal: 28,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
  },
  detailCloseText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  actionCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
  },
  actionEmoji: { fontSize: 44, marginBottom: 12 },
  actionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  actionSub: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
  },
  input: {
    width: '100%',
    backgroundColor: colors.inputBg,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  actionBtn: {
    width: '100%',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },
  actionBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: 0.3,
  },
  cancelBtn: {
    marginTop: 12,
    paddingVertical: 8,
  },
  cancelBtnText: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '600',
  },
  pendingBox: {
    width: '100%',
    backgroundColor: colors.dangerSoft,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.danger,
    marginBottom: 20,
  },
  pendingLabel: {
    fontSize: 11,
    color: colors.danger,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  pendingAmount: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.danger,
  },
  optionsLabel: {
    alignSelf: 'flex-start',
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
    marginBottom: 8,
    gap: 12,
  },
  optionRowActive: {
    borderColor: colors.accentYellow,
    backgroundColor: colors.accentYellowSoft,
  },
  optionRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionRadioActive: {
    borderColor: colors.accentAmber,
  },
  optionRadioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.accentAmber,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  optionTextActive: {
    color: colors.accentAmber,
    fontWeight: '700',
  },
});

export default PaymentScreen;