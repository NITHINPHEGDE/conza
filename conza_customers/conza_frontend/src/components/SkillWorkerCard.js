import React, { useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

const VERIFIED_GREEN = '#16A34A';
const VERIFIED_GREEN_SOFT = 'rgba(22,163,74,0.10)';

const SkillWorkerCard = React.memo(({ worker, isSelected, onToggle }) => {
  const handleToggle = useCallback(() => {
    onToggle(worker);
  }, [onToggle, worker]);

  const gradientColors = useMemo(() =>
    isSelected ? [colors.gradientStart, colors.gradientEnd] : ['#D0CDFF', '#A89CFF'],
    [isSelected]
  );

  const cardStyle = useMemo(() => [
    styles.card,
    isSelected && styles.cardSelected
  ], [isSelected]);

  const checkboxStyle = useMemo(() => [
    styles.checkbox,
    isSelected && styles.checkboxSelected
  ], [isSelected]);

  // Build the pricing segments once — only include the ones the worker
  // actually has, so the footer never shows empty/duplicate slots.
  const priceSegments = useMemo(() => {
    const segs = [{ label: 'Per Hour', value: Number(worker.pricePerDay) || 0, suffix: '/hr' }];
    if (worker.baseCharge) segs.push({ label: 'Base', value: Number(worker.baseCharge) });
    if (worker.perDayCharge) segs.push({ label: 'Per Day', value: Number(worker.perDayCharge), suffix: '/day' });
    return segs;
  }, [worker.pricePerDay, worker.baseCharge, worker.perDayCharge]);

  return (
    <TouchableOpacity
      style={cardStyle}
      onPress={handleToggle}
      activeOpacity={0.85}
    >
      {/* Top row: avatar, name, rating, checkbox */}
      <View style={styles.topRow}>
        <LinearGradient
          colors={gradientColors}
          style={styles.avatar}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.avatarText}>{worker.initials}</Text>
        </LinearGradient>

        <View style={styles.identity}>
          <Text style={styles.name} numberOfLines={1}>{worker.name}</Text>
          <View style={styles.subRow}>
            <View style={styles.ratingChip}>
              <Text style={styles.ratingStar}>⭐</Text>
              <Text style={styles.ratingValue}>{worker.rating}</Text>
            </View>
            <View style={styles.distanceRow}>
              <MaterialCommunityIcons name="map-marker" size={12} color={colors.textMuted} />
              <Text style={styles.distance}>{worker.distance}</Text>
            </View>
          </View>
        </View>

        <View style={checkboxStyle}>
          {isSelected && <Text style={styles.checkmark}>✓</Text>}
        </View>
      </View>

      {/* Verified badge */}
      {worker.isVerified && (
        <View style={styles.verifiedBadge}>
          <MaterialCommunityIcons name="shield-check" size={13} color={VERIFIED_GREEN} />
          <Text style={styles.verifiedText}>Verified</Text>
        </View>
      )}

      {/* Category */}
      <View style={styles.categoryTag}>
        <Text style={styles.categoryTagText}>{worker.category}</Text>
      </View>

      {/* Skills */}
      {(worker.skills || []).length > 0 && (
        <View style={styles.skillsRow}>
          {worker.skills.map((skill) => (
            <View key={skill} style={styles.skillTag}>
              <Text style={styles.skillText}>{skill}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Pricing footer — a single clean row, no overlapping tags */}
      <View style={styles.priceFooter}>
        {priceSegments.map((seg, idx) => (
          <React.Fragment key={seg.label}>
            {idx > 0 && <View style={styles.priceDivider} />}
            <View style={styles.priceSegment}>
              <Text style={styles.priceLabel}>{seg.label.toUpperCase()}</Text>
              <Text style={[styles.priceValue, idx === 0 && isSelected && styles.priceValuePrimarySelected]}>
                ₹{seg.value}{seg.suffix || ''}
              </Text>
            </View>
          </React.Fragment>
        ))}
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  cardSelected: {
    borderColor: colors.accentYellow,
    backgroundColor: '#FFFDF0',
    shadowColor: colors.accentAmber,
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 5,
  },

  topRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: { fontSize: 15, fontWeight: '800', color: colors.white, letterSpacing: 0.5 },

  identity: { flex: 1, minWidth: 0 },
  name: { fontSize: 15, fontWeight: '800', color: colors.textPrimary, marginBottom: 4 },
  subRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ratingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  ratingStar: { fontSize: 10 },
  ratingValue: { fontSize: 11, fontWeight: '700', color: colors.textPrimary },
  distanceRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  distance: { fontSize: 11, color: colors.textMuted, fontWeight: '500' },

  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checkboxSelected: { backgroundColor: colors.textPrimary, borderColor: colors.textPrimary },
  checkmark: { fontSize: 13, color: colors.white, fontWeight: '800', lineHeight: 16 },

  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    backgroundColor: VERIFIED_GREEN_SOFT,
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 4,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(22,163,74,0.2)',
  },
  verifiedText: { fontSize: 10.5, fontWeight: '700', color: VERIFIED_GREEN, letterSpacing: 0.2 },

  categoryTag: {
    alignSelf: 'flex-start',
    backgroundColor: colors.accentYellowSoft,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(245,200,66,0.3)',
  },
  categoryTagText: { fontSize: 11, fontWeight: '700', color: colors.accentAmber },

  skillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginBottom: 12 },
  skillTag: {
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  skillText: { fontSize: 10, fontWeight: '600', color: colors.textSecondary },

  // ── Pricing footer — replaces the old overlapping price + charge tags ──
  priceFooter: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: colors.surfaceElevated,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingVertical: 9,
    paddingHorizontal: 4,
  },
  priceSegment: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  priceDivider: { width: 1, backgroundColor: colors.borderLight, marginVertical: 2 },
  priceLabel: { fontSize: 9, fontWeight: '700', color: colors.textMuted, letterSpacing: 0.4, marginBottom: 2 },
  priceValue: { fontSize: 13, fontWeight: '800', color: colors.textSecondary },
  priceValuePrimarySelected: { color: colors.accentAmber },
});

export default SkillWorkerCard;