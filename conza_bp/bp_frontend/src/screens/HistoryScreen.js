// src/screens/HistoryScreen.js
import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import usePartnerStore, { selectHistory, selectFetchHistory } from '../store/usePartnerStore';
import { colors } from '../theme/colors';
import { RefreshControl } from 'react-native';
import { SkeletonList, HistoryCardSkeleton } from '../components/Skeleton';

const TABS = ['Completed'];

// ── HistoryCard ───────────────────────────────────────────────────────────────
const HistoryCard = React.memo(({ item }) => (
  <View style={styles.card}>
    <View style={styles.cardHeader}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{(item.userName || 'C').charAt(0)}</Text>
      </View>
      <View style={styles.headerInfo}>
        <Text style={styles.userName}>{item.userName}</Text>
        <Text style={styles.subService}>{item.service} · {item.subService}</Text>
      </View>
      <View style={styles.completedBadge}>
        <Text style={styles.completedText}>✓ Completed</Text>
      </View>
    </View>

    <View style={styles.metaRow}>
      <Text style={styles.metaItem}>🆔 {String(item.id || item._id || '').slice(-8).toUpperCase()}</Text>
      <Text style={styles.metaDot}>·</Text>
      <Text style={styles.metaItem}>📅 {item.date}</Text>
      {item.totalDays > 1 && (
        <>
          <Text style={styles.metaDot}>·</Text>
          <Text style={styles.metaItem}>🗓️ {item.totalDays} days</Text>
        </>
      )}
    </View>

    {!!item.address && (
      <View style={styles.addressRow}>
        <Text style={styles.metaItem}>📍 {item.address || item.location}</Text>
      </View>
    )}

    <View style={styles.divider} />

    <View style={styles.cardFooter}>
      <View style={styles.footerGroup}>
        <Text style={styles.footerLabel}>Booked</Text>
        <Text style={styles.footerValue}>{item.date}</Text>
      </View>
      <View style={styles.footerDivider} />
      <View style={styles.footerGroup}>
        <Text style={styles.footerLabel}>Completed</Text>
        <Text style={styles.footerValue}>{item.checkOut ?? '—'}</Text>
      </View>
      <View style={styles.footerDivider} />
      <View style={styles.footerGroupRight}>
        <Text style={styles.footerLabel}>Earned</Text>
        <Text style={styles.earningAmount}>+₹{item.amount}</Text>
      </View>
    </View>
  </View>
));

// ── Static empty component ────────────────────────────────────────────────────
const ListEmpty = React.memo(() => (
  <View style={styles.empty}>
    <Text style={styles.emptyIcon}>📋</Text>
    <Text style={styles.emptyTitle}>No Completed Jobs</Text>
    <Text style={styles.emptySubtitle}>Your completed job history will appear here once you finish your first job.</Text>
  </View>
));

// ── Main screen ───────────────────────────────────────────────────────────────
const HistoryScreen = () => {
  const insets    = useSafeAreaInsets();
  const history   = usePartnerStore(selectHistory);
  const fetchHistory = usePartnerStore(selectFetchHistory);
  const [activeTab, setActiveTab] = useState('Completed');
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  React.useEffect(() => {
    fetchHistory().finally(() => setInitialLoading(false));
  }, [fetchHistory]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchHistory();
    setRefreshing(false);
  }, [fetchHistory]);

  const filtered = useMemo(() => {
    const completed = history
      .filter((h) => h.status === 'completed')
      .sort((a, b) => new Date(b.updatedAt || b.date) - new Date(a.updatedAt || a.date));
    return completed;
  }, [history]);

  const keyExtractor = useCallback((item) => item.id, []);
  const renderItem   = useCallback(({ item }) => <HistoryCard item={item} />, []);

  const ListEmptyComponent = useMemo(() => <ListEmpty />, []);

  const containerStyle = useMemo(
    () => [styles.screen, { paddingTop: insets.top + 10 }],
    [insets.top],
  );

  if (initialLoading) {
    return (
      <View style={containerStyle}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>History</Text>
        </View>
        <View style={{ paddingTop: 8 }}>
          <SkeletonList component={HistoryCardSkeleton} count={4} />
        </View>
      </View>
    );
  }

  return (
    <View style={containerStyle}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>History</Text>
      </View>

      <View style={styles.pageSubHeader}>
        <Text style={styles.pageSubTitle}>Completed Jobs</Text>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListEmptyComponent={ListEmptyComponent}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.accentAmber]} tintColor={colors.accentAmber} />
        }
        removeClippedSubviews
        maxToRenderPerBatch={8}
        windowSize={10}
        initialNumToRender={6}
      />
    </View>
  );
};

// Extracted so onPress never causes tab re-renders — receives setActiveTab, not an inline fn
const TabPill = React.memo(({ label, active, onPress }) => {
  const handlePress = useCallback(() => onPress(label), [label, onPress]);
  return (
    <TouchableOpacity
      style={active ? styles.tabActive : styles.tab}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <Text style={active ? styles.tabTextActive : styles.tabText}>{label}</Text>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  pageSubHeader: { paddingHorizontal: 20, marginBottom: 16 },
  pageSubTitle:  { fontSize: 14, fontWeight: '600', color: colors.textMuted },
  addressRow:    { marginBottom: 8 },
  screen:       { flex: 1, backgroundColor: colors.background },
  pageHeader:   { paddingHorizontal: 20, paddingBottom: 16 },
  pageTitle:    { fontSize: 24, fontWeight: '800', color: colors.textPrimary, letterSpacing: 0.2 },
  tabs:         { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 16, gap: 8 },
  tab:          { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  tabActive:    { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.accentYellowSoft, borderWidth: 1, borderColor: colors.accentYellow },
  tabText:      { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  tabTextActive:{ fontSize: 13, fontWeight: '700', color: colors.accentAmber },
  list:         { paddingBottom: 100 },
  card:         { marginHorizontal: 20, marginBottom: 12, backgroundColor: colors.surface, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: colors.border },
  cardHeader:   { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 12 },
  avatar:       { width: 40, height: 40, borderRadius: 13, backgroundColor: colors.accentYellowSoft, borderWidth: 1.5, borderColor: colors.accentYellow, alignItems: 'center', justifyContent: 'center' },
  avatarText:   { fontSize: 16, fontWeight: '800', color: colors.accentAmber },
  headerInfo:   { flex: 1 },
  userName:     { fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginBottom: 2 },
  subService:   { fontSize: 11, color: colors.textSecondary, fontWeight: '500' },
  completedBadge: { borderRadius: 8, paddingHorizontal: 9, paddingVertical: 4, borderWidth: 1, backgroundColor: colors.statusGreenSoft, borderColor: colors.statusGreen },
  cancelledBadge: { borderRadius: 8, paddingHorizontal: 9, paddingVertical: 4, borderWidth: 1, backgroundColor: colors.dangerSoft, borderColor: colors.danger },
  completedText:  { fontSize: 11, fontWeight: '700', color: colors.statusGreen },
  cancelledText:  { fontSize: 11, fontWeight: '700', color: colors.danger },
  metaRow:      { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 12, flexWrap: 'wrap' },
  metaItem:     { fontSize: 11, color: colors.textSecondary, fontWeight: '500' },
  metaDot:      { fontSize: 10, color: colors.textMuted },
  divider:      { height: 1, backgroundColor: colors.border, marginBottom: 12 },
  cardFooter:   { flexDirection: 'row', alignItems: 'center' },
  footerGroup:  { flex: 1, alignItems: 'flex-start' },
  footerGroupRight: { flex: 1, alignItems: 'flex-end' },
  footerDivider:{ width: 1, height: 30, backgroundColor: colors.border, marginHorizontal: 10 },
  footerLabel:  { fontSize: 10, color: colors.textMuted, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 3 },
  footerValue:  { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  footerAmount: { fontSize: 15, fontWeight: '800', color: colors.textPrimary },
  earningAmount:{ fontSize: 15, fontWeight: '800', color: colors.statusGreen },
  empty:        { alignItems: 'center', paddingTop: 60, paddingHorizontal: 40 },
  emptyIcon:    { fontSize: 44, marginBottom: 14 },
  emptyTitle:   { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginBottom: 6 },
  emptySubtitle:{ fontSize: 13, color: colors.textMuted, textAlign: 'center', lineHeight: 19 },
});

export default HistoryScreen;