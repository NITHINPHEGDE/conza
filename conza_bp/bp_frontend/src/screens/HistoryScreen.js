import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import usePartnerStore from '../store/usePartnerStore';
import SectionHeader from '../components/SectionHeader';
import { colors } from '../theme/colors';

const TABS = ['All', 'Completed', 'Cancelled'];

const HistoryCard = React.memo(({ item }) => {
  const isCompleted = item.status === 'completed';

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.userName.charAt(0)}</Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.userName}>{item.userName}</Text>
          <Text style={styles.subService}>{item.service} · {item.subService}</Text>
        </View>
        <View style={[styles.statusBadge, isCompleted ? styles.completedBadge : styles.cancelledBadge]}>
          <Text style={[styles.statusText, isCompleted ? styles.completedText : styles.cancelledText]}>
            {isCompleted ? '✓ Paid' : '✗ Cancelled'}
          </Text>
        </View>
      </View>

      {/* Meta */}
      <View style={styles.metaRow}>
        <Text style={styles.metaItem}>📍 {item.location}</Text>
        <Text style={styles.metaDot}>·</Text>
        <Text style={styles.metaItem}>🛣️ {item.distance}</Text>
        <Text style={styles.metaDot}>·</Text>
        <Text style={styles.metaItem}>📅 {item.date}</Text>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Footer row */}
      <View style={styles.cardFooter}>
        <View style={styles.footerGroup}>
          <Text style={styles.footerLabel}>Check-in</Text>
          <Text style={styles.footerValue}>{item.checkIn ?? '—'}</Text>
        </View>
        <View style={styles.footerDivider} />
        <View style={styles.footerGroup}>
          <Text style={styles.footerLabel}>Check-out</Text>
          <Text style={styles.footerValue}>{item.checkOut ?? '—'}</Text>
        </View>
        <View style={styles.footerDivider} />
        <View style={[styles.footerGroup, { alignItems: 'flex-end' }]}>
          <Text style={styles.footerLabel}>{isCompleted ? 'Earned' : 'Est.'}</Text>
          <Text style={[styles.footerAmount, isCompleted && styles.earningAmount]}>
            {isCompleted ? '+' : ''}₹{item.amount}
          </Text>
        </View>
      </View>
    </View>
  );
});

const HistoryScreen = () => {
  const insets = useSafeAreaInsets();
  const history = usePartnerStore((s) => s.history);
  const [activeTab, setActiveTab] = useState('All');

  const filtered = useMemo(() => {
    if (activeTab === 'All') return history;
    return history.filter((h) => h.status === activeTab.toLowerCase());
  }, [history, activeTab]);

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 10 }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* Page title */}
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>History</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <HistoryCard item={item} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>No {activeTab} Jobs</Text>
            <Text style={styles.emptySubtitle}>Your job history will appear here</Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  pageHeader: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: 0.2,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabActive: {
    backgroundColor: colors.accentYellowSoft,
    borderColor: colors.accentYellow,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
  },
  tabTextActive: {
    color: colors.accentAmber,
    fontWeight: '700',
  },
  list: {
    paddingBottom: 100,
  },
  card: {
    marginHorizontal: 20,
    marginBottom: 12,
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: colors.accentYellowSoft,
    borderWidth: 1.5,
    borderColor: colors.accentYellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.accentAmber,
  },
  headerInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  subService: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  statusBadge: {
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderWidth: 1,
  },
  completedBadge: {
    backgroundColor: colors.statusGreenSoft,
    borderColor: colors.statusGreen,
  },
  cancelledBadge: {
    backgroundColor: colors.dangerSoft,
    borderColor: colors.danger,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  completedText: {
    color: colors.statusGreen,
  },
  cancelledText: {
    color: colors.danger,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  metaItem: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  metaDot: {
    fontSize: 10,
    color: colors.textMuted,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerGroup: {
    flex: 1,
    alignItems: 'flex-start',
  },
  footerDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.border,
    marginHorizontal: 10,
  },
  footerLabel: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 3,
  },
  footerValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  footerAmount: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  earningAmount: {
    color: colors.statusGreen,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 44,
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 19,
  },
});

export default HistoryScreen;
