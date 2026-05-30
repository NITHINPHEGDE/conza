import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import useModeStore   from '../store/useModeStore';
import useVendorStore from '../store/useVendorStore';
import ModeToggle     from '../components/ModeToggle';
import SalesChart     from '../components/SalesChart';
import { colors }     from '../theme/colors';

const StatRow = ({ label, value, color, last }) => (
  <View style={[styles.statRow, last && { borderBottomWidth: 0 }]}>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={[styles.statValue, { color }]}>{value}</Text>
  </View>
);

const HistoryRow = ({ order }) => {
  const date = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';
  const itemName = (order.items && order.items[0]?.title) || 'Order';
  const isRental = order.orderType === 'rental';
  return (
    <View style={styles.historyRow}>
      <View style={[styles.historyThumb, { backgroundColor: isRental ? colors.indigoSoft : colors.accentAmberSoft }]}>
        <Text style={styles.historyThumbIcon}>{isRental ? '🏗️' : '🧱'}</Text>
      </View>
      <View style={styles.historyBody}>
        <Text style={styles.historyName} numberOfLines={1}>{itemName}</Text>
        <Text style={styles.historyDate}>{date} · {order.customerName || ''}</Text>
      </View>
      <Text style={styles.historyAmount}>₹{(order.total || 0).toLocaleString('en-IN')}</Text>
    </View>
  );
};

const EarningsScreen = () => {
  const insets  = useSafeAreaInsets();
  const { mode } = useModeStore();
  const {
    vendor, chartData, fetchDashboard, dashLoading, dashData,
    materialOrders, rentalOrders, fetchOrders,
  } = useVendorStore();

  useEffect(() => {
    fetchDashboard();
    fetchOrders('materials');
    fetchOrders('rental');
  }, []);

  const earnings = dashData?.earnings || {};
  const completedOrders = useMemo(() => {
    const mat = (materialOrders || []).filter((o) => o.status === 'delivered');
    const ren  = (rentalOrders   || []).filter((o) => o.status === 'returned');
    return mode === 'materials' ? mat : ren;
  }, [materialOrders, rentalOrders, mode]);

  const completedEarnings = useMemo(
    () => completedOrders.reduce((sum, o) => sum + (o.total || 0), 0),
    [completedOrders]
  );

  const allCompletedOrders = useMemo(() => {
    const mat = (materialOrders || []).filter((o) => o.status === 'delivered');
    const ren  = (rentalOrders   || []).filter((o) => o.status === 'returned');
    return [...mat, ...ren].sort((a, b) => {
      const da = a.date ? new Date(a._rawDate || 0) : 0;
      const db = b.date ? new Date(b._rawDate || 0) : 0;
      return db - da;
    });
  }, [materialOrders, rentalOrders]);

  const pendingOrders = useMemo(() => {
    const mat = (materialOrders || []).filter((o) => ['new','accepted','out_for_delivery'].includes(o.status));
    const ren  = (rentalOrders   || []).filter((o) => ['new','active'].includes(o.status));
    return mode === 'materials' ? mat : ren;
  }, [materialOrders, rentalOrders, mode]);

  const pendingPayout = useMemo(
    () => pendingOrders.reduce((sum, o) => sum + (o.total || 0), 0),
    [pendingOrders]
  );

  const avgOrderValue = completedOrders.length > 0
    ? Math.round(completedEarnings / completedOrders.length)
    : 0;

  const totalRevenue = dashData?.vendor?.totalRevenue || 0;

  const recentHistory = useMemo(() => {
    const src = mode === 'materials'
      ? (dashData?.recentMaterialOrders || [])
      : (dashData?.recentRentalOrders   || []);
    return src.slice(0, 10);
  }, [dashData, mode]);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Earnings</Text>
        <ModeToggle />
      </View>

      {dashLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.accentAmber} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* Hero */}
          <LinearGradient
            colors={[colors.gradientStart, colors.gradientEnd]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.heroCard}
          >
            <Text style={styles.heroLabel}>{mode === 'materials' ? 'Material Revenue' : 'Rental Revenue'} · This Month</Text>
            <Text style={styles.heroAmount}>₹{(vendor.monthEarnings || 0).toLocaleString('en-IN')}</Text>
            <Text style={styles.heroGrowth}>{vendor.growth || '+0%'} from last month</Text>
            <View style={styles.heroTotalRow}>
              <Text style={styles.heroTotalLabel}>All-time total</Text>
              <Text style={styles.heroTotalValue}>₹{totalRevenue.toLocaleString('en-IN')}</Text>
            </View>
          </LinearGradient>

          {/* Breakdown */}
          <View style={styles.breakdownCard}>
            <Text style={styles.sectionTitle}>Breakdown</Text>
            <StatRow label="Completed Orders"   value={completedOrders.length}                                       color={colors.indigo}      />
            <StatRow label="Completed Earnings"  value={`₹${completedEarnings.toLocaleString('en-IN')}`}             color={colors.green}       />
            <StatRow label="Avg Order Value"     value={avgOrderValue > 0 ? `₹${avgOrderValue.toLocaleString('en-IN')}` : '—'} color={colors.green} />
            <StatRow label="Pending Payouts"     value={`₹${pendingPayout.toLocaleString('en-IN')}`}                 color={colors.orange}      />
            <StatRow label="Net Earnings (MTD)"  value={`₹${(vendor.monthEarnings || 0).toLocaleString('en-IN')}`}   color={colors.textPrimary} last />
          </View>

          {/* Chart */}
          <Text style={styles.chartLabel}>Revenue Trend · Last 7 Days</Text>
          <SalesChart chartData={chartData} />

          {/* Earnings History */}
          {recentHistory.length > 0 && (
            <View style={styles.historyCard}>
              <Text style={styles.sectionTitle}>Recent Earnings</Text>
              {recentHistory.map((order, idx) => (
                <HistoryRow key={order._id || idx} order={order} />
              ))}
            </View>
          )}

        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  screen:      { flex: 1, backgroundColor: colors.background },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerTitle: { fontSize: 20, fontWeight: '800', color: colors.textPrimary },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll:      { paddingBottom: 40 },

  heroCard:       { margin: 20, borderRadius: 20, padding: 24 },
  heroLabel:      { fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: '600', marginBottom: 6 },
  heroAmount:     { fontSize: 34, fontWeight: '900', color: '#FFF', marginBottom: 4 },
  heroGrowth:     { fontSize: 12, color: 'rgba(255,255,255,0.75)', fontWeight: '600', marginBottom: 14 },
  heroTotalRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: 10 },
  heroTotalLabel: { fontSize: 11, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },
  heroTotalValue: { fontSize: 15, fontWeight: '900', color: '#FFF' },

  breakdownCard: { marginHorizontal: 20, marginBottom: 20, backgroundColor: colors.surface, borderRadius: 18, padding: 16, elevation: 2, shadowColor: colors.cardShadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 6 },
  sectionTitle:  { fontSize: 15, fontWeight: '800', color: colors.textPrimary, marginBottom: 14 },
  statRow:       { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  statLabel:     { fontSize: 13, color: colors.textSecondary, fontWeight: '500' },
  statValue:     { fontSize: 14, fontWeight: '800' },

  chartLabel: { fontSize: 15, fontWeight: '800', color: colors.textPrimary, marginHorizontal: 20, marginBottom: 10 },

  historyCard:    { marginHorizontal: 20, marginTop: 10, marginBottom: 20, backgroundColor: colors.surface, borderRadius: 18, padding: 16, elevation: 2, shadowColor: colors.cardShadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 6 },
  historyRow:     { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.borderLight, gap: 10 },
  historyThumb:   { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  historyThumbIcon:{ fontSize: 18 },
  historyBody:    { flex: 1 },
  historyName:    { fontSize: 13, fontWeight: '700', color: colors.textPrimary, marginBottom: 2 },
  historyDate:    { fontSize: 11, color: colors.textMuted, fontWeight: '500' },
  historyAmount:  { fontSize: 13, fontWeight: '800', color: colors.accentAmber },
});

export default EarningsScreen;