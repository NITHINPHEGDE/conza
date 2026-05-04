import React, { useCallback, useMemo } from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';

const LabourCategoryCard = React.memo(({ item, isSelected, onPress }) => {
  const handlePress = useCallback(() => {
    onPress && onPress(item);
  }, [onPress, item]);

  const gradientColors = useMemo(() => [colors.gradientStart, colors.gradientEnd], []);

  const cardStyle = useMemo(() => [
    styles.card, 
    isSelected && styles.cardSelected
  ], [isSelected]);

  const labelStyle = useMemo(() => [
    styles.label, 
    isSelected && styles.labelSelected
  ], [isSelected]);

  const availableStyle = useMemo(() => [
    styles.available, 
    isSelected && styles.availableSelected
  ], [isSelected]);

  return (
    <TouchableOpacity
      style={cardStyle}
      onPress={handlePress}
      activeOpacity={0.75}
    >
      {isSelected ? (
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.emojiContainerSelected}
        >
          <Text style={styles.emoji}>{item.emoji}</Text>
        </LinearGradient>
      ) : (
        <View style={styles.emojiContainer}>
          <Text style={styles.emoji}>{item.emoji}</Text>
        </View>
      )}

      <Text style={labelStyle}>{item.label}</Text>

      <View style={styles.metaRow}>
        <Text style={styles.rating}>⭐ {item.rating}</Text>
        <View style={styles.dot} />
        <Text style={availableStyle}>
          {item.available} free
        </Text>
      </View>

      {isSelected && (
        <View style={styles.selectedIndicator} />
      )}
    </TouchableOpacity>
  );
});


const styles = StyleSheet.create({
  card: {
    flex: 1,
    margin: 6,
    backgroundColor: colors.surface,
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 10,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
    position: 'relative',
    overflow: 'hidden',
  },
  cardSelected: {
    borderColor: colors.accentYellow,
    backgroundColor: '#FFFDF0',
    shadowColor: colors.accentAmber,
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 6,
  },
  emojiContainer: {
    width: 52,
    height: 52,
    borderRadius: 15,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  emojiContainerSelected: {
    width: 52,
    height: 52,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  emoji: {
    fontSize: 24,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 5,
    letterSpacing: 0.1,
  },
  labelSelected: {
    color: colors.textPrimary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rating: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '500',
  },
  dot: {
    width: 2.5,
    height: 2.5,
    borderRadius: 2,
    backgroundColor: colors.textMuted,
  },
  available: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  availableSelected: {
    color: colors.accentAmber,
  },
  selectedIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: colors.accentYellow,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
});

export default LabourCategoryCard;