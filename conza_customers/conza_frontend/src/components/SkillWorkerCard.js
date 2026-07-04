import React, { useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

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

  const priceStyle = useMemo(() => [
    styles.price,
    isSelected && styles.priceSelected
  ], [isSelected]);

  return (
    <TouchableOpacity
      style={cardStyle}
      onPress={handleToggle}
      activeOpacity={0.8}
    >
      {/* Checkbox */}
      <View style={checkboxStyle}>
        {isSelected && <Text style={styles.checkmark}>✓</Text>}
      </View>

      {/* Avatar */}
      <LinearGradient
        colors={gradientColors}
        style={styles.avatar}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.avatarText}>{worker.initials}</Text>
      </LinearGradient>

      {/* Info */}
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{worker.name}</Text>
          <View style={styles.ratingChip}>
            <Text style={styles.ratingStar}>⭐</Text>
            <Text style={styles.ratingValue}>{worker.rating}</Text>
          </View>
        </View>

        {/* Category tag */}
        <View style={styles.categoryTag}>
          <Text style={styles.categoryTagText}>{worker.category}</Text>
        </View>

        {/* Matching skills - Replaced FlatList with map for nesting stability */}
        <View style={styles.skillsRow}>
          {(worker.skills || []).map((skill) => (
            <View key={skill} style={styles.skillTag}>
              <Text style={styles.skillText}>{skill}</Text>
            </View>
          ))}
        </View>

        {/* Distance + Price */}
        <View style={styles.metaRow}>
          <View style={styles.distanceRow}>
            <MaterialCommunityIcons name="map-marker" size={12} color={colors.textMuted} />
            <Text style={styles.distance}>{worker.distance}</Text>
          </View>
          <Text style={priceStyle}>
            ₹{Number(worker.pricePerDay) || 0}/day
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
});


const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    gap: 12,
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
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    flexShrink: 0,
  },
  checkboxSelected: {
    backgroundColor: colors.textPrimary,
    borderColor: colors.textPrimary,
  },
  checkmark: {
    fontSize: 13,
    color: colors.white,
    fontWeight: '800',
    lineHeight: 16,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: 0.5,
  },
  info: { flex: 1 },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  name: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
    flex: 1,
  },
  ratingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  ratingStar: { fontSize: 11 },
  ratingValue: { fontSize: 12, fontWeight: '700', color: colors.textPrimary },
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
  categoryTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.accentAmber,
  },
  skillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    marginBottom: 8,
  },
  skillTag: {
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  skillText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  distance: { fontSize: 12, color: colors.textMuted, fontWeight: '500' },
  distanceRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  price: { fontSize: 13, fontWeight: '800', color: colors.textSecondary },
  priceSelected: { color: colors.accentAmber },
});

export default SkillWorkerCard;