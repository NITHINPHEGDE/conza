// src/components/Skeleton.js
import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Easing } from 'react-native';

// Single shimmer wave shared across all skeleton instances on screen
const useShimmer = () => {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.timing(anim, {
        toValue: 1,
        duration: 1100,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      })
    ).start();
  }, []);
  const opacity = anim.interpolate({
    inputRange:  [0, 0.5, 1],
    outputRange: [0.35, 0.7, 0.35],
  });
  return opacity;
};

// Base bone — every shape uses this
export const Bone = ({ width, height, radius = 8, style }) => {
  const opacity = useShimmer();
  return (
    <Animated.View
      style={[
        { width, height, borderRadius: radius, backgroundColor: '#E0DDD6', opacity },
        style,
      ]}
    />
  );
};

// ── Skeletons matched to each real card ──────────────────────────────────────

// Matches: SkillWorkerCard (worker selection card in BookingScreen)
export const WorkerCardSkeleton = () => (
  <View style={s.workerCard}>
    <View style={s.workerTop}>
      <Bone width={44} height={44} radius={14} />
      <View style={{ flex: 1, gap: 8 }}>
        <Bone width="60%" height={13} />
        <Bone width="40%" height={11} />
      </View>
      <Bone width={52} height={22} radius={10} />
    </View>
    <View style={s.workerBottom}>
      <Bone width="35%" height={11} />
      <Bone width="25%" height={11} />
      <Bone width="28%" height={11} />
    </View>
  </View>
);

// Matches: LabourCategoryCard (category pills)
export const CategoryCardSkeleton = () => (
  <View style={s.categoryCard}>
    <Bone width={38} height={38} radius={19} />
    <Bone width={54} height={11} style={{ marginTop: 8 }} />
    <Bone width={38} height={10} style={{ marginTop: 5 }} />
  </View>
);

// Matches: MaterialCard (material product card)
export const MaterialCardSkeleton = () => (
  <View style={s.materialCard}>
    <Bone width="100%" height={130} radius={12} style={{ marginBottom: 10 }} />
    <Bone width="70%" height={13} style={{ marginBottom: 6 }} />
    <Bone width="45%" height={11} style={{ marginBottom: 10 }} />
    <View style={s.materialFooter}>
      <Bone width={60} height={22} radius={8} />
      <Bone width={72} height={32} radius={10} />
    </View>
  </View>
);

// Matches: RentalCard
export const RentalCardSkeleton = () => (
  <View style={s.rentalCard}>
    <Bone width="100%" height={120} radius={12} style={{ marginBottom: 10 }} />
    <Bone width="65%" height={13} style={{ marginBottom: 6 }} />
    <Bone width="40%" height={11} style={{ marginBottom: 8 }} />
    <View style={s.materialFooter}>
      <Bone width={64} height={22} radius={8} />
      <Bone width={68} height={30} radius={10} />
    </View>
  </View>
);

// Matches: ProjectCard (My Projects screen)
export const ProjectCardSkeleton = () => (
  <View style={s.projectCard}>
    <View style={s.projectTop}>
      <View style={{ flex: 1, gap: 8 }}>
        <Bone width="55%" height={14} />
        <Bone width="35%" height={11} />
      </View>
      <Bone width={72} height={24} radius={10} />
    </View>
    <Bone width="100%" height={6} radius={3} style={{ marginVertical: 12 }} />
    <View style={s.projectBottom}>
      <Bone width="30%" height={11} />
      <Bone width="25%" height={11} />
      <Bone width="28%" height={11} />
    </View>
  </View>
);

// Matches: BookingCard / SellerOrderCard (Status screen)
export const BookingCardSkeleton = () => (
  <View style={s.bookingCard}>
    <View style={s.bookingTop}>
      <Bone width={42} height={42} radius={12} />
      <View style={{ flex: 1, gap: 8 }}>
        <Bone width="50%" height={13} />
        <Bone width="65%" height={11} />
      </View>
      <Bone width={54} height={22} radius={8} />
    </View>
    <View style={s.bookingBottom}>
      <Bone width="40%" height={11} />
      <Bone width="25%" height={11} />
    </View>
  </View>
);

// Matches: RequestCard (BP Home screen)
export const RequestCardSkeleton = () => (
  <View style={s.requestCard}>
    <View style={s.bookingTop}>
      <Bone width={42} height={42} radius={14} />
      <View style={{ flex: 1, gap: 8 }}>
        <Bone width="50%" height={13} />
        <Bone width="40%" height={11} />
      </View>
      <Bone width={52} height={26} radius={10} />
    </View>
    <View style={s.requestMeta}>
      <Bone width="32%" height={11} />
      <Bone width="22%" height={11} />
      <Bone width="28%" height={11} />
    </View>
    <Bone width="100%" height={38} radius={10} style={{ marginTop: 12 }} />
  </View>
);

// Matches: HistoryCard (BP History screen)
export const HistoryCardSkeleton = () => (
  <View style={s.historyCard}>
    <View style={s.bookingTop}>
      <Bone width={40} height={40} radius={12} />
      <View style={{ flex: 1, gap: 8 }}>
        <Bone width="48%" height={13} />
        <Bone width="38%" height={11} />
      </View>
      <Bone width={60} height={22} radius={8} />
    </View>
    <View style={s.requestMeta}>
      <Bone width="30%" height={11} />
      <Bone width="20%" height={11} />
      <Bone width="25%" height={11} />
    </View>
    <View style={s.historyFooter}>
      <Bone width="28%" height={28} radius={8} />
      <Bone width="28%" height={28} radius={8} />
      <Bone width="28%" height={28} radius={8} />
    </View>
  </View>
);

// Matches: BookingTrackingScreen (full screen loading)
export const BookingTrackingSkeleton = () => (
  <View style={s.trackingWrap}>
    <Bone width="60%" height={16} radius={8} style={{ alignSelf: 'center', marginBottom: 24 }} />
    <View style={s.trackingStatus}>
      <Bone width={72} height={72} radius={36} style={{ marginBottom: 12 }} />
      <Bone width="50%" height={18} radius={8} style={{ marginBottom: 8 }} />
      <Bone width="35%" height={13} radius={6} />
    </View>
    <View style={s.trackingCard}>
      <View style={s.bookingTop}>
        <Bone width={48} height={48} radius={14} />
        <View style={{ flex: 1, gap: 9 }}>
          <Bone width="55%" height={14} />
          <Bone width="40%" height={12} />
        </View>
      </View>
      <Bone width="100%" height={1} radius={1} style={{ marginVertical: 14 }} />
      <Bone width="70%" height={12} style={{ marginBottom: 8 }} />
      <Bone width="55%" height={12} />
    </View>
  </View>
);

// ── Helper: render N skeletons in a list ──────────────────────────────────────
export const SkeletonList = ({ component: Comp, count = 3 }) =>
  Array.from({ length: count }).map((_, i) => <Comp key={i} />);

const s = StyleSheet.create({
  workerCard:     { backgroundColor: '#fff', borderRadius: 16, padding: 14, marginHorizontal: 20, marginBottom: 12, borderWidth: 1, borderColor: '#E8E6DF', gap: 12 },
  workerTop:      { flexDirection: 'row', alignItems: 'center', gap: 12 },
  workerBottom:   { flexDirection: 'row', gap: 12, marginTop: 4 },
  categoryCard:   { width: 90, alignItems: 'center', marginRight: 10, backgroundColor: '#fff', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: '#E8E6DF' },
  materialCard:   { width: 170, backgroundColor: '#fff', borderRadius: 16, padding: 12, marginRight: 14, borderWidth: 1, borderColor: '#E8E6DF' },
  materialFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rentalCard:     { width: 190, backgroundColor: '#fff', borderRadius: 16, padding: 12, marginRight: 14, borderWidth: 1, borderColor: '#E8E6DF' },
  projectCard:    { backgroundColor: '#fff', borderRadius: 18, padding: 16, marginHorizontal: 20, marginBottom: 14, borderWidth: 1, borderColor: '#E8E6DF' },
  projectTop:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  projectBottom:  { flexDirection: 'row', gap: 14 },
  bookingCard:    { backgroundColor: '#fff', borderRadius: 16, padding: 14, marginHorizontal: 20, marginBottom: 12, borderWidth: 1, borderColor: '#E8E6DF', gap: 12 },
  bookingTop:     { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bookingBottom:  { flexDirection: 'row', gap: 14, marginTop: 2 },
  requestCard:    { backgroundColor: '#fff', borderRadius: 16, padding: 14, marginHorizontal: 20, marginBottom: 12, borderWidth: 1, borderColor: '#E8E6DF', gap: 10 },
  requestMeta:    { flexDirection: 'row', gap: 12, marginTop: 4 },
  historyCard:    { backgroundColor: '#fff', borderRadius: 16, padding: 14, marginHorizontal: 20, marginBottom: 12, borderWidth: 1, borderColor: '#E8E6DF', gap: 10 },
  historyFooter:  { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#E8E6DF' },
  trackingWrap:   { flex: 1, padding: 20 },
  trackingStatus: { alignItems: 'center', marginBottom: 24 },
  trackingCard:   { backgroundColor: '#fff', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: '#E8E6DF' },
});