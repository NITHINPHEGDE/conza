import React, { useCallback } from 'react';
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
import StatsCard from '../components/StatsCard';
import SectionHeader from '../components/SectionHeader';
import RequestCard from '../components/RequestCard';
import { colors } from '../theme/colors';

const LabourHomeScreen = ({ navigation }) => {
  const isOnline = usePartnerStore((s) => s.isOnline);
  const toggleOnline = usePartnerStore((s) => s.toggleOnline);
  const insets = useSafeAreaInsets();
  const profile = usePartnerStore((s) => s.profile);
  const todaysJobs = usePartnerStore((s) => s.todaysJobs);
  const todaysEarnings = usePartnerStore((s) => s.todaysEarnings);
  const rating = usePartnerStore((s) => s.rating);
  const requests = usePartnerStore((s) => s.requests);
  const activeJob = usePartnerStore((s) => s.activeJob);

  const handleViewDetails = useCallback((request) => {
    navigation.navigate('RequestDetails', { request });
  }, [navigation]);

  const ListHeader = () => (
    <>
      {/* Greeting */}
      <View style={styles.greetingRow}>
        <View>
          <Text style={styles.greeting}>Hello, {profile.name.split(' ')[0]} 👋</Text>
          <Text style={styles.greetingSub}>{profile.category} · {profile.location}</Text>
        </View>

        {/* Online/Offline Toggle */}
        <TouchableOpacity
          onPress={toggleOnline}
          activeOpacity={0.8}
          style={[styles.onlineBadge, !isOnline && styles.offlineBadge]}
        >
          <View style={[styles.onlineDot, !isOnline && styles.offlineDot]} />
          <Text style={[styles.onlineText, !isOnline && styles.offlineText]}>
            {isOnline ? 'Online' : 'Offline'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Offline Banner */}
      {!isOnline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineBannerIcon}>🔕</Text>
          <View>
            <Text style={styles.offlineBannerTitle}>You're Offline</Text>
            <Text style={styles.offlineBannerSub}>New requests are paused. Tap Online to resume.</Text>
          </View>
        </View>
      )}

      {/* Stats */}
      <View style={styles.statsRow}>
        <StatsCard emoji="🏠" value={String(todaysJobs)} label="Today's Jobs" />
        <View style={{ width: 10 }} />
        <StatsCard emoji="💰" value={`₹${todaysEarnings}`} label="Today's Earn" />
        <View style={{ width: 10 }} />
        <StatsCard emoji="⭐" value={String(rating)} label="Rating" />
      </View>

      {/* Section header */}
      <SectionHeader
        title={isOnline ? `New Requests (${requests.length})` : 'New Requests (paused)'}
      />
    </>
  );

  const ListEmpty = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>📭</Text>
      <Text style={styles.emptyTitle}>No New Requests</Text>
      <Text style={styles.emptySubtitle}>New job requests will appear here</Text>
    </View>
  );

  return (
    <View style={[styles.screen, !isOnline && styles.screenOffline, { paddingTop: insets.top + 10 }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <FlatList
        data={isOnline ? requests : []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <RequestCard request={item} onViewDetails={handleViewDetails} />
        )}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={ListEmpty}
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
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.statusGreen,
  },
  onlineText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.statusGreen,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 26,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 19,
  },
  screenOffline: {
    backgroundColor: '#F5F5F2',
  },
  offlineBadge: {
    backgroundColor: 'rgba(156,163,175,0.15)',
    borderColor: colors.statusGray,
  },
  offlineDot: {
    backgroundColor: colors.statusGray,
  },
  offlineText: {
    color: colors.statusGray,
  },
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
  offlineBannerIcon: {
    fontSize: 26,
  },
  offlineBannerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 2,
  },
  offlineBannerSub: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '400',
    lineHeight: 16,
  },
});

export default LabourHomeScreen;
