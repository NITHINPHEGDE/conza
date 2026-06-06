import React, { useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  StatusBar, Animated, Easing,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import usePartnerStore, {
  selectProfile, selectIsOnline, selectToggleOnline,
  selectIsTogglingOnline, selectToggleDirection,
  selectTodaysJobs, selectTodaysEarnings, selectRating,
  selectRequests,
} from '../store/usePartnerStore';
import StatsCard     from '../components/StatsCard';
import SectionHeader from '../components/SectionHeader';
import RequestCard   from '../components/RequestCard';
import { colors }   from '../theme/colors';

// ─────────────────────────────────────────────────────────────────────────────
// OnlineToggle — animated pill with spinner, pulse ring, and slide transition
// ─────────────────────────────────────────────────────────────────────────────
const OnlineToggle = ({ isOnline, isToggling, toggleDirection, onPress }) => {
  const spinAnim     = useRef(new Animated.Value(0)).current;
  const pulseScale   = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    if (isToggling) {
      Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1, duration: 700, easing: Easing.linear, useNativeDriver: true,
        })
      ).start();
    } else {
      spinAnim.stopAnimation();
      spinAnim.setValue(0);
    }
  }, [isToggling]);

  useEffect(() => {
    let loop;
    if (isOnline && !isToggling) {
      loop = Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(pulseScale,   { toValue: 1.9, duration: 900, useNativeDriver: true }),
            Animated.timing(pulseOpacity, { toValue: 0,   duration: 900, useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.timing(pulseScale,   { toValue: 1,   duration: 0,   useNativeDriver: true }),
            Animated.timing(pulseOpacity, { toValue: 0.6, duration: 0,   useNativeDriver: true }),
          ]),
        ])
      );
      loop.start();
    } else {
      pulseScale.setValue(1);
      pulseOpacity.setValue(0);
    }
    return () => loop?.stop();
  }, [isOnline, isToggling]);

  const spin = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  // All colors are plain JS — no Animated.Value for colors, avoids mixed-driver crash
  const isGreen     = isOnline && !isToggling;
  const dotColor    = isGreen  ? colors.statusGreen : colors.statusGray;
  const spinColor   = isOnline ? colors.statusGreen : colors.statusGray;
  const badgeBg     = isGreen  ? 'rgba(46,139,87,0.12)'    : 'rgba(156,163,175,0.15)';
  const badgeBorder = isGreen  ? colors.statusGreen         : colors.statusGray;
  const labelColor  = isGreen  ? colors.statusGreen         : colors.statusGray;
  const label       = isToggling
    ? (toggleDirection === 'going_online' ? 'Going online…' : 'Going offline…')
    : (isOnline ? 'Online' : 'Offline');

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      disabled={isToggling}
      style={toggleStyles.hitArea}
    >
      <View style={[toggleStyles.badge, { backgroundColor: badgeBg, borderColor: badgeBorder }]}>
        <View style={toggleStyles.dotWrap}>
          {isToggling ? (
            <Animated.View style={[toggleStyles.spinner, { transform: [{ rotate: spin }] }]}>
              <View style={[toggleStyles.spinnerArc, { borderColor: spinColor }]} />
            </Animated.View>
          ) : (
            <View style={toggleStyles.dotContainer}>
              {isOnline && (
                <Animated.View style={[
                  toggleStyles.pulseRing,
                  { borderColor: dotColor },
                  { transform: [{ scale: pulseScale }], opacity: pulseOpacity },
                ]} />
              )}
              <View style={[toggleStyles.dot, { backgroundColor: dotColor }]} />
            </View>
          )}
        </View>
        <Text style={[toggleStyles.label, { color: labelColor }]}>{label}</Text>
      </View>
    </TouchableOpacity>
  );
};

const toggleStyles = StyleSheet.create({
  hitArea:       { padding: 2 },
  badge:         { flexDirection: 'row', alignItems: 'center', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7, gap: 7, borderWidth: 1.5 },
  dotWrap:       { width: 14, height: 14, alignItems: 'center', justifyContent: 'center' },
  dotContainer:  { width: 14, height: 14, alignItems: 'center', justifyContent: 'center' },
  dot:           { width: 8, height: 8, borderRadius: 4 },
  pulseRing:     { position: 'absolute', width: 14, height: 14, borderRadius: 7, borderWidth: 1.5 },
  spinner:       { width: 13, height: 13 },
  spinnerArc:    { width: 13, height: 13, borderRadius: 7, borderWidth: 2, borderTopColor: 'transparent', borderRightColor: 'transparent' },
  label:         { fontSize: 12, fontWeight: '700', letterSpacing: 0.1 },
});

// ─────────────────────────────────────────────────────────────────────────────
// Static empty component
// ─────────────────────────────────────────────────────────────────────────────
const ListEmpty = () => (
  <View style={styles.emptyState}>
    <Text style={styles.emptyIcon}>📭</Text>
    <Text style={styles.emptyTitle}>No New Requests</Text>
    <Text style={styles.emptySubtitle}>New job requests will appear here</Text>
  </View>
);

// ─────────────────────────────────────────────────────────────────────────────
// Main screen
// ─────────────────────────────────────────────────────────────────────────────
const LabourHomeScreen = ({ navigation }) => {
  const insets           = useSafeAreaInsets();
  const profile          = usePartnerStore(selectProfile);
  const isOnline         = usePartnerStore(selectIsOnline);
  const isToggling       = usePartnerStore(selectIsTogglingOnline);
  const toggleDirection  = usePartnerStore(selectToggleDirection);
  const toggleOnline     = usePartnerStore(selectToggleOnline);
  const todaysJobs       = usePartnerStore(selectTodaysJobs);
  const todaysEarnings   = usePartnerStore(selectTodaysEarnings);
  const rating           = usePartnerStore(selectRating);
  const requests         = usePartnerStore(selectRequests);
  const fetchRequests    = usePartnerStore((s) => s.fetchRequests);

  useEffect(() => {
    fetchRequests();
    let intervalId = null;
    if (isOnline) {
      intervalId = setInterval(fetchRequests, 10000);
    }
    return () => { if (intervalId) clearInterval(intervalId); };
  }, [isOnline, fetchRequests]);

  const handleViewDetails = useCallback((request) => {
    navigation.navigate('RequestDetails', { request });
  }, [navigation]);

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

        <OnlineToggle
          isOnline={isOnline}
          isToggling={isToggling}
          toggleDirection={toggleDirection}
          onPress={toggleOnline}
        />
      </View>

      {!isOnline && !isToggling && (
        <TouchableOpacity
          style={styles.offlineBanner}
          activeOpacity={0.8}
          onPress={toggleOnline}
        >
          <Text style={styles.offlineBannerIcon}>🔕</Text>
          <View>
            <Text style={styles.offlineBannerTitle}>You're Offline</Text>
            <Text style={styles.offlineBannerSub}>
              New requests are paused. Tap Online to resume.
            </Text>
          </View>
        </TouchableOpacity>
      )}

      <View style={styles.statsRow}>
        <StatsCard emoji="🏠" value={String(todaysJobs)}    label="Today's Jobs" />
        <View style={styles.statSpacer} />
        <StatsCard emoji="💰" value={`₹${todaysEarnings}`} label="Today's Earn" />
        <View style={styles.statSpacer} />
        <StatsCard emoji="⭐" value={String(rating)}        label="Rating" />
      </View>

      <SectionHeader
        title={isOnline ? `New Requests (${requests.length})` : 'New Requests (paused)'}
      />
    </>
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ), [isOnline, isToggling, toggleDirection, todaysJobs, todaysEarnings, rating, requests.length,
      profile.name, profile.fullName, profile.category, profile.location, profile.locationText,
      toggleOnline]);

  const renderItem    = useCallback(({ item }) => (
    <RequestCard request={item} onViewDetails={handleViewDetails} />
  ), [handleViewDetails]);

  const keyExtractor  = useCallback((item) => item.id, []);
  const listData      = isOnline ? requests : EMPTY_ARRAY;

  const screenStyle   = useMemo(() => [
    styles.screen,
    !isOnline && !isToggling && styles.screenOffline,
    { paddingTop: insets.top + 10 },
  ], [isOnline, isToggling, insets.top]);

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
