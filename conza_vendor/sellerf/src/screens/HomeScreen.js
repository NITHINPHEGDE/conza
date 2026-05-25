// conzavf/src/screens/HomeScreen.js  (REPLACE)
import React, { useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { LinearGradient }    from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useModeStore          from '../store/useModeStore';
import useVendorStore        from '../store/useVendorStore';
import ModeToggle            from '../components/ModeToggle';
import KPICard               from '../components/KPICard';
import SalesChart            from '../components/SalesChart';
import RecentOrders          from '../components/RecentOrders';
import { colors }            from '../theme/colors';

const GRAD = { start: { x: 0, y: 0 }, end: { x: 1, y: 0 } };

const HomeScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { mode, loadMode } = useModeStore();
  const {
    vendor, kpi, chartData, dashLoading, dashData,
    fetchDashboard, getFilteredOrders, fetchOrders,
  } = useVendorStore();
  const materialOrders = useVendorStore((s) => s.materialOrders);
  const rentalOrders   = useVendorStore((s) => s.rentalOrders);

  const refresh = useCallback(async () => {
    await Promise.all([fetchDashboard(), fetchOrders(mode)]);
  }, [mode]);

  useEffect(() => {
    loadMode();
    fetchDashboard();
    fetchOrders(mode);
  }, []);

  useEffect(() => {
    fetchOrders(mode);
  }, [mode]);

  const orders = useMemo(() => {
    return getFilteredOrders(mode);
  }, [materialOrders, rentalOrders, mode]);

  const kpiConfig = mode === 'materials'
    ? [
        { label: 'New Orders',       value: kpi.newOrders,       icon: '📦', accent: colors.indigo  },
        { label: 'Pending Delivery', value: kpi.pendingDelivery, icon: '🚚', accent: colors.orange  },
        { label: 'Active Listings',  value: kpi.activeListings,  icon: '🏷️', accent: colors.green   },
        { label: 'Low Stock',        value: kpi.lowStockItems,   icon: '⚠️', accent: colors.red     },
      ]
    : [
        { label: 'New Requests',     value: kpi.newOrders,       icon: '📋', accent: colors.indigo  },
        { label: 'Active Rentals',   value: kpi.pendingDelivery, icon: '🔧', accent: colors.orange  },
        { label: 'Equipment Listed', value: kpi.activeListings,  icon: '🏗️', accent: colors.green   },
        { label: 'Returns Due',      value: kpi.lowStockItems,   icon: '📅', accent: colors.red     },
      ];

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>

      {/* ── Top Bar ── */}
      <View style={styles.topBar}>
        <View style={styles.topLeft}>
          <Text style={styles.greeting}>Good Morning 👋</Text>
          <Text style={styles.vendorName} numberOfLines={1}>{vendor.shopName}</Text>
        </View>
        <ModeToggle />
        <View style={styles.topRight}>
          <View style={styles.walletBadge}>
            <Text style={styles.walletLabel}>Wallet</Text>
            <Text style={styles.walletAmount}>₹{(vendor.walletBalance || 0).toLocaleString('en-IN')}</Text>
          </View>
          <TouchableOpacity style={styles.notifBtn}>
            <Text style={styles.notifIcon}>🔔</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={dashLoading} onRefresh={refresh} tintColor={colors.accentAmber} />}
      >
        {/* Earnings Hero */}
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientEnd]}
          start={GRAD.start} end={GRAD.end}
          style={styles.earningsCard}
        >
          <View style={styles.earningsLeft}>
            <Text style={styles.earningsLabel}>
              {mode === 'materials' ? 'Material Sales' : 'Rental Revenue'} · This Month
            </Text>
            <Text style={styles.earningsAmount}>
              ₹{(vendor.monthEarnings || 0).toLocaleString('en-IN')}
            </Text>
          </View>
          <View style={styles.growthBadge}>
            <Text style={styles.growthText}>{vendor.growth || '+0%'}</Text>
            <Text style={styles.growthSub}>vs last month</Text>
          </View>
        </LinearGradient>

        {/* KPI Cards */}
        <View style={styles.kpiRow}>
          {kpiConfig.map((k) => (
            <KPICard
              key={k.label}
              {...k}
              onPress={() => navigation.navigate('Orders')}
            />
          ))}
        </View>

        {/* Sales Chart */}
        <SalesChart chartData={chartData} />

        {/* Recent Orders */}
        {/* Recent Orders */}
        <RecentOrders
          orders={
            mode === 'materials'
              ? (dashData?.recentMaterialOrders || [])
              : (dashData?.recentRentalOrders   || [])
          }
        />

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen:        { flex: 1, backgroundColor: colors.background },
  topBar:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 12, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border, gap: 8 },
  topLeft:       { flex: 1, flexShrink: 1, minWidth: 0 },
  greeting:      { fontSize: 11, color: colors.textMuted, fontWeight: '500' },
  vendorName:    { fontSize: 14, fontWeight: '900', color: colors.textPrimary, marginTop: 1 },
  topRight:      { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 0 },
  walletBadge:   { backgroundColor: colors.accentAmberSoft, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: 'rgba(240,165,0,0.2)' },
  walletLabel:   { fontSize: 9, color: colors.accentAmber, fontWeight: '700', letterSpacing: 0.4 },
  walletAmount:  { fontSize: 13, fontWeight: '900', color: colors.accentAmber },
  notifBtn:      { width: 34, height: 34, borderRadius: 10, backgroundColor: colors.surfaceElevated, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  notifIcon:     { fontSize: 16 },
  scroll:        { paddingBottom: 40 },
  earningsCard:  { marginHorizontal: 16, marginVertical: 14, borderRadius: 20, padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  earningsLeft:  { flex: 1 },
  earningsLabel: { fontSize: 11, color: 'rgba(255,255,255,0.8)', fontWeight: '600', marginBottom: 4 },
  earningsAmount:{ fontSize: 28, fontWeight: '900', color: colors.white },
  growthBadge:   { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 14, padding: 12, alignItems: 'center', minWidth: 80 },
  growthText:    { fontSize: 18, fontWeight: '900', color: colors.white },
  growthSub:     { fontSize: 9, color: 'rgba(255,255,255,0.75)', fontWeight: '600', marginTop: 2, textAlign: 'center' },
  kpiRow:        { flexDirection: 'row', paddingHorizontal: 12, marginBottom: 20, gap: 6 },
});

export default HomeScreen;