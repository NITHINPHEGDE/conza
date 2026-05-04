import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../theme/colors';

/**
 * Full-screen or Section-level Loader
 */
export const SectionLoader = ({ message = 'Loading...' }) => (
  <View style={styles.center}>
    <ActivityIndicator size="large" color={colors.accentAmber} />
    <Text style={styles.loaderText}>{message}</Text>
  </View>
);

/**
 * Error state with retry option
 */
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

/**
 * Empty state for lists
 */
export const EmptyState = ({ emoji = '📦', title = 'No data found', subtitle }) => (
  <View style={styles.center}>
    <Text style={styles.emptyEmoji}>{emoji}</Text>
    <Text style={styles.emptyTitle}>{title}</Text>
    {subtitle && <Text style={styles.emptySub}>{subtitle}</Text>}
  </View>
);

/**
 * Simple skeleton-like placeholder for grids
 */
export const SkeletonGrid = () => (
  <View style={styles.gridPlaceholder}>
    <ActivityIndicator size="small" color={colors.border} />
    <Text style={styles.placeholderText}>Loading grid items...</Text>
  </View>
);

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    minHeight: 250,
  },
  loaderText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  errorEmoji: { fontSize: 44, marginBottom: 16 },
  errorTitle: { fontSize: 18, fontWeight: '800', color: colors.textPrimary, marginBottom: 8 },
  errorText: { fontSize: 14, color: colors.textMuted, textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  retryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.accentYellowSoft,
    borderWidth: 1.5,
    borderColor: colors.accentYellow,
  },
  retryBtnText: { fontSize: 14, fontWeight: '700', color: colors.accentAmber },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginBottom: 6 },
  emptySub: { fontSize: 13, color: colors.textMuted, textAlign: 'center', paddingHorizontal: 20 },
  gridPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  placeholderText: {
    marginTop: 10,
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '500',
  },
});
