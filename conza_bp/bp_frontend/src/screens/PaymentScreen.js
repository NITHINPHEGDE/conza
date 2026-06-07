import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  StatusBar, Modal, TextInput, RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';
import usePartnerStore, { selectHistory, selectFetchHistory } from '../store/usePartnerStore';

const COMMISSION_RATE = 0.03;
const PAYMENT_OPTIONS = ['UPI', 'Net Banking', 'Debit Card', 'Wallet'];

// ── Detail Modal ──────────────────────────────────────────────────────────────
const DetailModal = React.memo(({ visible, item, onClose }) => {
  if (!item) return null;
  const commission = parseFloat((item.amount * COMMISSION_RATE).toFixed(2));
  const net        = parseFloat((item.amount - commission).toFixed(2));
  const isCash     = item.paymentMethod === 'cod';

  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.detailCard}>
          <View style={[styles.detailBadge, isCash ? styles.detailBadgeRed : styles.detailBadgeGreen]}>
            <Text style={styles.detailBadgeText}>{isCash ? '💵 Cash' : '📥 Online'}</Text>
          </View>
          <Text style={styles.detailCustomer}>{item.userName}</Text>
          <Text style={styles.detailService}>{item.service} · {item.paymentMethod?.toUpperCase()}</Text>
          <Text style={styles.detailDate}>{item.date}</Text>

          <View style={styles.detailDivider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailRowLabel}>Job Amount</Text>
            <Text style={styles.detailRowValue}>₹{item.amount}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailRowLabel}>Commission (3%)</Text>
            <Text style={[styles.detailRowValue, { color: colors.danger }]}>-₹{commission}</Text>
          </View>
          <View style={[styles.detailDivider, { marginVertical: 8 }]} />
          <View style={styles.detailRow}>
            <Text style={[styles.detailRowLabel, { fontWeight: '800', color: colors.textPrimary }]}>You Earn</Text>
            <Text style={[styles.detailRowValue, { color: colors.statusGreen, fontSize: 18 }]}>
              +₹{net}
            </Text>
          </View>

          {isCash && (
            <View style={styles.cashNote}>
              <Text style={styles.cashNoteText}>
                💡 Cash job — pay ₹{commission} commission to Conza
              </Text>
            </View>
          )}

          <TouchableOpacity onPress={onClose} style={styles.detailClose}>
            <Text style={styles.detailCloseText}>Close</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
});

// ── Withdraw Modal ────────────────────────────────────────────────────────────
const WithdrawModal = React.memo(({ visible, onClose, availableBalance }) => {
  const [amount, setAmount]   = useState('');
  const [done, setDone]       = useState(false);
  const [error, setError]     = useState('');

  const handleSubmit = useCallback(() => {
    const num = parseFloat(amount);
    if (!amount || isNaN(num) || num <= 0) {
      setError('Enter a valid amount.');
      return;
    }
    if (num > availableBalance) {
      setError(`Max available: ₹${availableBalance.toFixed(0)}`);
      return;
    }
    setError('');
    setDone(true);
    setTimeout(() => {
      setDone(false);
      setAmount('');
      onClose();
    }, 2000);
  }, [amount, availableBalance, onClose]);

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
              <Text style={styles.actionSub}>Available balance: ₹{availableBalance.toFixed(0)}</Text>

              <TextInput
                style={[styles.input, error ? styles.inputError : null]}
                placeholder="Enter amount (₹)"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                value={amount}
                onChangeText={(t) => { setAmount(t); setError(''); }}
              />
              {!!error && <Text style={styles.errorText}>{error}</Text>}

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
});

// ── Pay Platform Modal ────────────────────────────────────────────────────────
const PayPlatformModal = React.memo(({ visible, onClose, pendingAmount }) => {
  const [selected, setSelected] = useState(null);
  const [done, setDone]         = useState(false);

  const handlePay = useCallback(() => {
    if (!selected) return;
    setDone(true);
    setTimeout(() => {
      setDone(false);
      setSelected(null);
      onClose();
    }, 2000);
  }, [selected, pendingAmount, onClose]);

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.actionCard}>
          {done ? (
            <>
              <Text style={styles.actionEmoji}>🎉</Text>
              <Text style={styles.actionTitle}>Payment Done!</Text>
              <Text style={styles.actionSub}>₹{pendingAmount.toFixed(0)} paid to Conza successfully.</Text>
            </>
          ) : (
            <>
              <Text style={styles.actionEmoji}>🏦</Text>
              <Text style={styles.actionTitle}>Pay Commission</Text>
              <Text style={styles.actionSub}>Pending commission due to Conza</Text>

              <View style={styles.pendingBox}>
                <Text style={styles.pendingLabel}>Amount Due</Text>
                <Text style={styles.pendingAmount}>₹{pendingAmount.toFixed(0)}</Text>
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
                    Pay ₹{pendingAmount.toFixed(0)}
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
});

// ── Main Screen ───────────────────────────────────────────────────────────────
const PaymentScreen = () => {
  const insets       = useSafeAreaInsets();
  const history      = usePartnerStore(selectHistory);
  const fetchHistory = usePartnerStore(selectFetchHistory);
  const [refreshing, setRefreshing]         = useState(false);
  const [selectedItem, setSelectedItem]     = useState(null);
  const [showWithdraw, setShowWithdraw]     = useState(false);
  const [showPayPlatform, setShowPayPlatform] = useState(false);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchHistory();
    setRefreshing(false);
  }, [fetchHistory]);

  // ── Derive payment entries from completed booking history ──────────────
  const paymentEntries = useMemo(() =>
    history
      .filter(h => h.status === 'completed')
      .map(h => {
        const amount     = h.amount || h.total || 0;
        const commission = parseFloat((amount * COMMISSION_RATE).toFixed(2));
        const net        = parseFloat((amount - commission).toFixed(2));
        const isCash     = h.paymentMethod === 'cod';
        return {
          id:            h.id || h._id,
          userName:      h.userName || 'Client',
          service:       h.service  || 'Service',
          date:          h.date     || '—',
          checkIn:       h.checkIn  || '—',
          checkOut:      h.checkOut || '—',
          amount,
          commission,
          net,
          paymentMethod: h.paymentMethod || 'cod',
          isCash,
        };
      }),
    [history]
  );

  // ── Summary calculations ───────────────────────────────────────────────
  const summary = useMemo(() => {
    let onlineEarned = 0, cashEarned = 0, totalCommission = 0, cashCommissionDue = 0;
    paymentEntries.forEach(p => {
      totalCommission += p.commission;
      if (p.isCash) {
        cashEarned       += p.amount;        // collected full amount in hand
        cashCommissionDue += p.commission;   // must pay this to Conza
      } else {
        onlineEarned += p.net;               // already received net from Conza
      }
    });
    // Balance available to withdraw = online net earnings - commission due
    const availableBalance = onlineEarned - cashCommissionDue;
    return { onlineEarned, cashEarned, totalCommission, cashCommissionDue, availableBalance };
  }, [paymentEntries]);

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 10 }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.accentAmber]} tintColor={colors.accentAmber} />
        }
      >
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
            <Text style={styles.summaryIcon}>📥</Text>
            <Text style={styles.summaryValue}>₹{summary.onlineEarned.toFixed(0)}</Text>
            <Text style={styles.summaryLabel}>Online Earned</Text>
          </View>
          <View style={[styles.summaryCard, styles.summaryCardAmber]}>
            <Text style={styles.summaryIcon}>💵</Text>
            <Text style={styles.summaryValue}>₹{summary.cashEarned.toFixed(0)}</Text>
            <Text style={styles.summaryLabel}>Cash Collected</Text>
          </View>
        </View>

        <View style={styles.summaryGrid}>
          <View style={[styles.summaryCard, styles.summaryCardBlue]}>
            <Text style={styles.summaryIcon}>💰</Text>
            <Text style={styles.summaryValue}>₹{summary.availableBalance.toFixed(0)}</Text>
            <Text style={styles.summaryLabel}>Available Balance (Online Earned - Commission Due)</Text>
          </View>
          <View style={[styles.summaryCard, styles.summaryCardRed]}>
            <Text style={styles.summaryIcon}>📤</Text>
            <Text style={styles.summaryValue}>₹{summary.cashCommissionDue.toFixed(0)}</Text>
            <Text style={styles.summaryLabel}>Commission Due</Text>
          </View>
        </View>

        {/* History */}
        <Text style={styles.sectionTitle}>
          Payment History {paymentEntries.length > 0 ? `(${paymentEntries.length})` : ''}
        </Text>

        {paymentEntries.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>💳</Text>
            <Text style={styles.emptyTitle}>No Payments Yet</Text>
            <Text style={styles.emptySub}>Completed jobs will appear here</Text>
          </View>
        ) : (
          paymentEntries.map(item => (
            <TouchableOpacity
              key={item.id}
              style={styles.historyCard}
              onPress={() => setSelectedItem(item)}
              activeOpacity={0.8}
            >
              <View style={[styles.historyIconBox, item.isCash ? styles.historyIconAmber : styles.historyIconGreen]}>
                <Text style={{ fontSize: 18 }}>{item.isCash ? '💵' : '📱'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.historyLabel}>{item.userName}</Text>
                <Text style={styles.historySub}>{item.service}</Text>
                <Text style={styles.historyDate}>{item.date} · {item.checkIn} → {item.checkOut}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.historyAmount, { color: colors.statusGreen }]}>
                  +₹{item.net.toFixed(0)}
                </Text>
                <Text style={styles.historyCommission}>-₹{item.commission} fee</Text>
                <Text style={styles.historyMethod}>{item.isCash ? 'Cash' : 'Online'}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Bottom Bar */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity
          style={styles.withdrawBtn}
          onPress={() => setShowWithdraw(true)}
          activeOpacity={0.85}
        >
          <Text style={styles.withdrawIcon}>💸</Text>
          <Text style={styles.withdrawBtnText}>Withdraw</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setShowPayPlatform(true)}
          activeOpacity={0.85}
          style={{ flex: 1 }}
          disabled={summary.cashCommissionDue <= 0}
        >
          <LinearGradient
            colors={summary.cashCommissionDue > 0
              ? [colors.gradientStart, colors.gradientEnd]
              : [colors.surfaceElevated, colors.border]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.payBtn}
          >
            <Text style={styles.payIcon}>🏦</Text>
            <Text style={[styles.payBtnText, summary.cashCommissionDue <= 0 && { color: colors.textMuted }]}>
              Pay Commission {summary.cashCommissionDue > 0 ? `₹${summary.cashCommissionDue.toFixed(0)}` : ''}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Modals */}
      <DetailModal
        visible={!!selectedItem}
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
      />
      <WithdrawModal
        visible={showWithdraw}
        onClose={() => setShowWithdraw(false)}
        availableBalance={summary.availableBalance}
      />
      <PayPlatformModal
        visible={showPayPlatform}
        onClose={() => setShowPayPlatform(false)}
        pendingAmount={summary.cashCommissionDue}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen:  { flex: 1, backgroundColor: colors.background },
  scroll:  { paddingBottom: 140 },

  pageHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 18,
  },
  pageTitle: { fontSize: 24, fontWeight: '800', color: colors.textPrimary, letterSpacing: 0.2 },
  commissionBadge: {
    backgroundColor: colors.accentYellowSoft, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: colors.accentYellow,
  },
  commissionText: { fontSize: 11, fontWeight: '700', color: colors.accentAmber },

  summaryGrid: { flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginBottom: 12 },
  summaryCard: { flex: 1, borderRadius: 18, padding: 16, alignItems: 'flex-start', borderWidth: 1 },
  summaryCardGreen: { backgroundColor: colors.statusGreenSoft, borderColor: colors.statusGreen },
  summaryCardAmber: { backgroundColor: colors.accentAmberSoft, borderColor: colors.accentAmber },
  summaryCardBlue:  { backgroundColor: 'rgba(59,130,246,0.08)', borderColor: 'rgba(59,130,246,0.3)' },
  summaryCardRed:   { backgroundColor: colors.dangerSoft, borderColor: colors.danger },
  summaryIcon:  { fontSize: 22, marginBottom: 8 },
  summaryValue: { fontSize: 20, fontWeight: '900', color: colors.textPrimary, marginBottom: 4 },
  summaryLabel: { fontSize: 11, fontWeight: '600', color: colors.textSecondary },

  sectionTitle: {
    fontSize: 17, fontWeight: '700', color: colors.textPrimary,
    paddingHorizontal: 20, marginTop: 8, marginBottom: 14, letterSpacing: 0.2,
  },

  historyCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginHorizontal: 20, marginBottom: 10,
    backgroundColor: colors.surface, borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: colors.border,
    shadowColor: colors.cardShadow, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12, shadowRadius: 6, elevation: 2,
  },
  historyIconBox: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1,
  },
  historyIconGreen: { backgroundColor: colors.statusGreenSoft, borderColor: colors.statusGreen },
  historyIconAmber: { backgroundColor: colors.accentAmberSoft, borderColor: colors.accentAmber },
  historyLabel:      { fontSize: 13, fontWeight: '700', color: colors.textPrimary, marginBottom: 2 },
  historySub:        { fontSize: 11, color: colors.textSecondary, fontWeight: '500', marginBottom: 2 },
  historyDate:       { fontSize: 10, color: colors.textMuted, fontWeight: '400' },
  historyAmount:     { fontSize: 15, fontWeight: '800', marginBottom: 1 },
  historyCommission: { fontSize: 10, color: colors.danger, fontWeight: '600', marginBottom: 2 },
  historyMethod:     { fontSize: 10, color: colors.textMuted, fontWeight: '500' },

  emptyState: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 40 },
  emptyIcon:  { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginBottom: 8 },
  emptySub:   { fontSize: 13, color: colors.textMuted, textAlign: 'center', lineHeight: 19 },

  bottomBar: {
    flexDirection: 'row', gap: 12, paddingHorizontal: 20, paddingTop: 14,
    backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border,
    shadowColor: colors.cardShadow, shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08, shadowRadius: 10, elevation: 10,
  },
  withdrawBtn: {
    flex: 1, borderRadius: 14, paddingVertical: 13,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: colors.accentYellow,
    backgroundColor: colors.accentYellowSoft, gap: 4,
  },
  withdrawIcon:    { fontSize: 18 },
  withdrawBtnText: { fontSize: 12, fontWeight: '700', color: colors.accentAmber },
  payBtn:          { borderRadius: 14, paddingVertical: 13, alignItems: 'center', justifyContent: 'center', gap: 4 },
  payIcon:         { fontSize: 18 },
  payBtnText:      { fontSize: 12, fontWeight: '800', color: colors.textPrimary, letterSpacing: 0.3 },

  overlay:      { flex: 1, backgroundColor: colors.overlay, alignItems: 'center', justifyContent: 'center', padding: 20 },
  detailCard:   { width: '90%', backgroundColor: colors.surface, borderRadius: 24, padding: 24, alignItems: 'center' },
  detailBadge:  { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, marginBottom: 14, borderWidth: 1 },
  detailBadgeGreen: { backgroundColor: colors.statusGreenSoft, borderColor: colors.statusGreen },
  detailBadgeRed:   { backgroundColor: colors.accentAmberSoft, borderColor: colors.accentAmber },
  detailBadgeText:  { fontSize: 12, fontWeight: '700', color: colors.textPrimary },
  detailCustomer:   { fontSize: 18, fontWeight: '800', color: colors.textPrimary, marginBottom: 4 },
  detailService:    { fontSize: 13, color: colors.textSecondary, fontWeight: '500', marginBottom: 2 },
  detailDate:       { fontSize: 12, color: colors.textMuted, marginBottom: 16 },
  detailDivider:    { width: '100%', height: 1, backgroundColor: colors.border, marginVertical: 12 },
  detailRow:        { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 6 },
  detailRowLabel:   { fontSize: 14, color: colors.textSecondary, fontWeight: '500' },
  detailRowValue:   { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  cashNote: {
    width: '100%', backgroundColor: colors.accentYellowSoft, borderRadius: 10,
    padding: 10, marginTop: 8, borderWidth: 1, borderColor: colors.accentYellow,
  },
  cashNoteText: { fontSize: 12, color: colors.accentAmber, fontWeight: '600', textAlign: 'center' },
  detailClose:     { marginTop: 20, paddingVertical: 8, paddingHorizontal: 28, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceElevated },
  detailCloseText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },

  actionCard:  { width: '100%', backgroundColor: colors.surface, borderRadius: 24, padding: 28, alignItems: 'center' },
  actionEmoji: { fontSize: 44, marginBottom: 12 },
  actionTitle: { fontSize: 20, fontWeight: '800', color: colors.textPrimary, marginBottom: 6 },
  actionSub:   { fontSize: 13, color: colors.textMuted, textAlign: 'center', marginBottom: 20, lineHeight: 18 },
  input:       { width: '100%', backgroundColor: colors.inputBg, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, fontWeight: '600', color: colors.textPrimary, borderWidth: 1, borderColor: colors.border, marginBottom: 8 },
  inputError:  { borderColor: colors.danger },
  errorText:   { fontSize: 12, color: colors.danger, fontWeight: '500', alignSelf: 'flex-start', marginBottom: 12 },
  actionBtn:   { width: '100%', borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  actionBtnText: { fontSize: 15, fontWeight: '800', color: colors.textPrimary, letterSpacing: 0.3 },
  cancelBtn:   { marginTop: 12, paddingVertical: 8 },
  cancelBtnText: { fontSize: 13, color: colors.textMuted, fontWeight: '600' },
  pendingBox:  { width: '100%', backgroundColor: colors.dangerSoft, borderRadius: 14, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: colors.danger, marginBottom: 20 },
  pendingLabel:  { fontSize: 11, color: colors.danger, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  pendingAmount: { fontSize: 28, fontWeight: '900', color: colors.danger },
  optionsLabel:  { alignSelf: 'flex-start', fontSize: 12, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  optionRow:     { flexDirection: 'row', alignItems: 'center', width: '100%', paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceElevated, marginBottom: 8, gap: 12 },
  optionRowActive: { borderColor: colors.accentYellow, backgroundColor: colors.accentYellowSoft },
  optionRadio:     { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  optionRadioActive: { borderColor: colors.accentAmber },
  optionRadioDot:  { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.accentAmber },
  optionText:      { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  optionTextActive: { color: colors.accentAmber, fontWeight: '700' },
});

export default PaymentScreen;