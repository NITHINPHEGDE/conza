import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { colors } from '../theme/colors';
import {
  WorkerCardSkeleton, CategoryCardSkeleton,
  MaterialCardSkeleton, RentalCardSkeleton,
  SkeletonList,
} from './Skeleton';

export const SectionLoader = ({ message = 'Loading...' }) => (
  <View style={styles.center}>
    <Text style={styles.loaderText}>{message}</Text>
  </View>
);

export const ErrorState = ({ message = 'Something went wrong', onRetry }) => (
  <View style={styles.center}>
    <Text style={styles.errorEmoji}>⚠️</Text>
    <Text style={styles.errorTitle}>Oops!</Text>
    <Text style={styles.errorText}>{message}</Text>
    {onRetry && (
      <TouchableOpacity style={styles.retryBtn} onPress={onRetry} activeOpacity={0.7}>
        <Text style={styles.retryBtnText}>Try Again</Text>
      </TouchableOpacity>
    )}
  </View>
);

export const EmptyState = ({ emoji = '📦', title = 'No data found', subtitle }) => (
  <View style={styles.center}>
    <Text style={styles.emptyEmoji}>{emoji}</Text>
    <Text style={styles.emptyTitle}>{title}</Text>
    {subtitle && <Text style={styles.emptySub}>{subtitle}</Text>}
  </View>
);

// Workers list skeleton (replaces SectionLoader on WorkersNearbyScreen + BookingScreen workers tab)
export const WorkerListSkeleton = () => (
  <View style={{ paddingTop: 8 }}>
    <SkeletonList component={WorkerCardSkeleton} count={4} />
  </View>
);

// Category pills skeleton (BookingScreen labour tab)
export const CategoryGridSkeleton = () => (
  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 8, gap: 10 }} scrollEnabled={false}>
    <SkeletonList component={CategoryCardSkeleton} count={5} />
  </ScrollView>
);

// Materials horizontal scroll skeleton
export const MaterialGridSkeleton = () => (
  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 8, gap: 0 }} scrollEnabled={false}>
    <SkeletonList component={MaterialCardSkeleton} count={4} />
  </ScrollView>
);

// Rental horizontal scroll skeleton
export const RentalGridSkeleton = () => (
  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 8 }} scrollEnabled={false}>
    <SkeletonList component={RentalCardSkeleton} count={4} />
  </ScrollView>
);

// Keep SkeletonGrid exported so existing imports don't break — now renders real skeletons
export const SkeletonGrid = MaterialGridSkeleton;

const styles = StyleSheet.create({
  center:       { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30, minHeight: 250 },
  loaderText:   { marginTop: 12, fontSize: 14, color: colors.textSecondary, fontWeight: '600' },
  errorEmoji:   { fontSize: 44, marginBottom: 16 },
  errorTitle:   { fontSize: 18, fontWeight: '800', color: colors.textPrimary, marginBottom: 8 },
  errorText:    { fontSize: 14, color: colors.textMuted, textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  retryBtn:     { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, backgroundColor: colors.accentYellowSoft, borderWidth: 1.5, borderColor: colors.accentYellow },
  retryBtnText: { fontSize: 14, fontWeight: '700', color: colors.accentAmber },
  emptyEmoji:   { fontSize: 48, marginBottom: 16 },
  emptyTitle:   { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginBottom: 6 },
  emptySub:     { fontSize: 13, color: colors.textMuted, textAlign: 'center', paddingHorizontal: 20 },
});