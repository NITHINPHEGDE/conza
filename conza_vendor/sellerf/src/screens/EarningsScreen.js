import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import useModeStore   from '../store/useModeStore';
import useVendorStore from '../store/useVendorStore';
import ModeToggle     from '../components/ModeToggle';
import SalesChart     from '../components/SalesChart';
import { colors }     from '../theme/colors';

const StatRow = ({ label, value, color }) => (
  <View style={styles.statRow}>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={[styles.statValue, { color }]}>{value}</Text>
  </View>
);

const EarningsScreen = () => {
  const insets  = useSafeAreaInsets();
  const { mode } = useModeStore();
  const { vendor, chartData } = useVendorStore();

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
  <Text style={styles.headerTitle}>Earnings</Text>
  <ModeToggle />
</View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Total earnings hero */}
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientEnd]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={styles.heroCard}
        >
          <Text style={styles.heroLabel}>{mode === 'materials' ? 'Material Revenue' : 'Rental Revenue'} · This Month</Text>
          <Text style={styles.heroAmount}>₹{vendor.monthEarnings.toLocaleString('en-IN')}</Text>
          <Text style={styles.heroGrowth}>{vendor.growth} from last month</Text>
        </LinearGradient>

        {/* Breakdown */}
        <View style={styles.breakdownCard}>
          <Text style={styles.sectionTitle}>Breakdown</Text>
          <StatRow label="Total Orders"      value="47"      color={colors.indigo}  />
          <StatRow label="Avg Order Value"   value="₹1,451"  color={colors.green}   />
          <StatRow label="Pending Payouts"   value="₹8,200"  color={colors.orange}  />
          <StatRow label="Refunds Issued"    value="₹1,100"  color={colors.red}     />
          <StatRow label="Platform Fee"      value="₹2,340"  color={colors.textMuted} />
          <StatRow label="Net Earnings"      value="₹64,560" color={colors.textPrimary} />
        </View>

        {/* Chart */}
        <Text style={styles.chartLabel}>Revenue Trend</Text>
        <SalesChart chartData={chartData} />

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen:        { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerTitle:   { fontSize: 20, fontWeight: '800', color: colors.textPrimary },
  scroll:        { paddingBottom: 40 },
  heroCard:      { margin: 20, borderRadius: 20, padding: 24 },
  heroLabel:     { fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: '600', marginBottom: 6 },
  heroAmount:    { fontSize: 34, fontWeight: '900', color: '#FFF', marginBottom: 4 },
  heroGrowth:    { fontSize: 12, color: 'rgba(255,255,255,0.75)', fontWeight: '600' },
  breakdownCard: { marginHorizontal: 20, marginBottom: 20, backgroundColor: colors.surface, borderRadius: 18, padding: 16, elevation: 2, shadowColor: colors.cardShadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 6 },
  sectionTitle:  { fontSize: 15, fontWeight: '800', color: colors.textPrimary, marginBottom: 14 },
  statRow:       { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  statLabel:     { fontSize: 13, color: colors.textSecondary, fontWeight: '500' },
  statValue:     { fontSize: 14, fontWeight: '800' },
  chartLabel:    { fontSize: 15, fontWeight: '800', color: colors.textPrimary, marginHorizontal: 20, marginBottom: 10 },
});

export default EarningsScreen;