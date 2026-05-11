// src/screens/LabourHomeScreen.js
import React, { useCallback, useMemo } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import usePartnerStore, {
  selectProfile, selectIsOnline, selectToggleOnline,
  selectTodaysJobs, selectTodaysEarnings, selectRating,
  selectRequests,
} from '../store/usePartnerStore';
import StatsCard    from '../components/StatsCard';
import SectionHeader from '../components/SectionHeader';
import RequestCard  from '../components/RequestCard';
import { colors }  from '../theme/colors';

// ── Static empty component — defined outside, never recreated ─────────────────
const ListEmpty = () => (
  <View style={styles.emptyState}>
    <Text style={styles.emptyIcon}>📭</Text>
    <Text style={styles.emptyTitle}>No New Requests</Text>
    <Text style={styles.emptySubtitle}>New job requests will appear here</Text>
  </View>
);

const LabourHomeScreen = ({ navigation }) => {
  const insets         = useSafeAreaInsets();
  const profile        = usePartnerStore(selectProfile);
  const isOnline       = usePartnerStore(selectIsOnline);
  const toggleOnline   = usePartnerStore(selectToggleOnline);
  const todaysJobs     = usePartnerStore(selectTodaysJobs);
  const todaysEarnings = usePartnerStore(selectTodaysEarnings);
  const rating         = usePartnerStore(selectRating);
  const requests       = usePartnerStore(selectRequests);

  const handleViewDetails = useCallback((request) => {
    navigation.navigate('RequestDetails', { request });
  }, [navigation]);

  // Memoize header so FlatList doesn't remount it on every render
  const ListHeader = useMemo(() => (
    <>
      <View style={styles.greetingRow}>
        <View>
          <Text style={styles.greeting}>
            Hello, {(profile.fullName || profile.name || 'Partner').split(' ')[0]} 👋
          </Text>
          <Text style={styles.greetingSub}>
            {profile.category || ''} · {profile.locationText || profile.location || ''}
          </Text>
        </View>
        <TouchableOpacity
          onPress={toggleOnline}
          activeOpacity={0.8}
          style={isOnline ? styles.onlineBadge : styles.offlineBadge}
        >
          <View style={isOnline ? styles.onlineDot : styles.offlineDot} />
          <Text style={isOnline ? styles.onlineText : styles.offlineText}>
            {isOnline ? 'Online' : 'Offline'}
          </Text>
        </TouchableOpacity>
      </View>

      {!isOnline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineBannerIcon}>🔕</Text>
          <View>
            <Text style={styles.offlineBannerTitle}>You're Offline</Text>
            <Text style={styles.offlineBannerSub}>
              New requests are paused. Tap Online to resume.
            </Text>
          </View>
        </View>
      )}

      <View style={styles.statsRow}>
        <StatsCard emoji="🏠" value={String(todaysJobs)}     label="Today's Jobs" />
        <View style={styles.statSpacer} />
        <StatsCard emoji="💰" value={`₹${todaysEarnings}`}  label="Today's Earn" />
        <View style={styles.statSpacer} />
        <StatsCard emoji="⭐" value={String(rating)}         label="Rating" />
      </View>

      <SectionHeader
        title={isOnline ? `New Requests (${requests.length})` : 'New Requests (paused)'}
      />
    </>
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ), [isOnline, todaysJobs, todaysEarnings, rating, requests.length,
      profile.name, profile.category, profile.location, toggleOnline]);

  const renderItem = useCallback(({ item }) => (
    <RequestCard request={item} onViewDetails={handleViewDetails} />
  ), [handleViewDetails]);

  const keyExtractor = useCallback((item) => item.id, []);

  const listData = isOnline ? requests : EMPTY_ARRAY;

  const screenStyle = useMemo(() => [
    styles.screen,
    !isOnline && styles.screenOffline,
    { paddingTop: insets.top + 10 },
  ], [isOnline, insets.top]);

  return (
    <View style={screenStyle}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <FlatList
        data={listData}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={ListEmpty}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        removeClippedSubviews
        maxToRenderPerBatch={5}
        windowSize={7}
        initialNumToRender={4}
      />
    </View>
  );
};

// Stable empty array reference — avoids new array allocation each render
const EMPTY_ARRAY = [];

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  screenOffline: {
    backgroundColor: '#F5F5F2',
  },
  list: {
    paddingBottom: 100,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 22,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: 0.2,
    marginBottom: 4,
  },
  greetingSub: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.statusGreenSoft,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
    borderWidth: 1,
    borderColor: colors.statusGreen,
  },
  offlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(156,163,175,0.15)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
    borderWidth: 1,
    borderColor: colors.statusGray,
  },
  onlineDot: {
    width: 7, height: 7, borderRadius: 4,
    backgroundColor: colors.statusGreen,
  },
  offlineDot: {
    width: 7, height: 7, borderRadius: 4,
    backgroundColor: colors.statusGray,
  },
  onlineText: {
    fontSize: 12, fontWeight: '700', color: colors.statusGreen,
  },
  offlineText: {
    fontSize: 12, fontWeight: '700', color: colors.statusGray,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 26,
  },
  statSpacer: { width: 10 },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 40,
  },
  emptyIcon:     { fontSize: 48, marginBottom: 16 },
  emptyTitle:    { fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginBottom: 8 },
  emptySubtitle: { fontSize: 13, color: colors.textMuted, textAlign: 'center', lineHeight: 19 },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: 'rgba(156,163,175,0.12)',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(156,163,175,0.3)',
  },
  offlineBannerIcon:  { fontSize: 26 },
  offlineBannerTitle: { fontSize: 13, fontWeight: '700', color: colors.textSecondary, marginBottom: 2 },
  offlineBannerSub:   { fontSize: 11, color: colors.textMuted, fontWeight: '400', lineHeight: 16 },
});

export default LabourHomeScreen;