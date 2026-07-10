import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

const RentalCard = React.memo(({ item, onPress, onAddToCart }) => {
  const [added, setAdded] = useState(false);

  const handlePress = useCallback(() => {
    onPress && onPress(item);
  }, [onPress, item]);

  const handleAddToCart = useCallback((e) => {
    e.stopPropagation();
    if (!item.available) return;
    onAddToCart && onAddToCart(item);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }, [onAddToCart, item]);

  const imageSource = useMemo(() => ({ uri: item.image }), [item.image]);

  const availBadgeStyle = useMemo(() => [
    styles.availBadge,
    { backgroundColor: item.available ? 'rgba(46,139,87,0.12)' : 'rgba(224,59,59,0.12)' }
  ], [item.available]);

  const availDotStyle = useMemo(() => [
    styles.availDot,
    { backgroundColor: item.available ? colors.success : colors.danger }
  ], [item.available]);

  const availTextStyle = useMemo(() => [
    styles.availText,
    { color: item.available ? colors.success : colors.danger }
  ], [item.available]);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={handlePress}
      activeOpacity={0.85}
    >
      <View style={styles.imageWrapper}>
        <Image source={imageSource} style={styles.image} resizeMode="cover" />
        <LinearGradient
          colors={['rgba(0,0,0,0.28)', 'transparent']}
          style={styles.imageTopFade}
          pointerEvents="none"
        />
        <View style={availBadgeStyle}>
          <View style={availDotStyle} />
          <Text style={availTextStyle}>
            {item.available ? 'Available' : 'Booked'}
          </Text>
        </View>
        <View style={styles.ratingBadge}>
          <MaterialCommunityIcons name="star" size={11} color={colors.accentAmber} />
          <Text style={styles.ratingText}>{item.rating}</Text>
        </View>
      </View>

      <View style={styles.details}>
        <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.seller} numberOfLines={1}>by {item.seller}</Text>
        
        <View style={styles.distanceRow}>
          <MaterialCommunityIcons name="map-marker" size={12} color={colors.textMuted} />
          <Text style={styles.distanceText}>{item.distance}</Text>
        </View>

        <View style={styles.priceChip}>
          <Text style={styles.price}>₹{item.pricePerDay}</Text>
          <Text style={styles.unit}>/day</Text>
        </View>

        <TouchableOpacity
          onPress={handleAddToCart}
          activeOpacity={0.85}
          disabled={!item.available}
        >
          {item.available ? (
            <LinearGradient
              colors={added ? [colors.success, colors.success] : [colors.gradientStart, colors.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.addCartBtn}
            >
              <MaterialCommunityIcons
                name={added ? 'check-circle' : 'cart-plus'}
                size={14}
                color={colors.textPrimary}
              />
              <Text style={styles.addCartBtnText}>
                {added ? 'Added' : 'Add to Cart'}
              </Text>
            </LinearGradient>
          ) : (
            <View style={[styles.addCartBtn, styles.addCartBtnDisabled]}>
              <MaterialCommunityIcons name="cart-off" size={14} color={colors.textMuted} />
              <Text style={styles.addCartBtnTextDisabled}>Unavailable</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
});


const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  imageWrapper: {
    width: '100%',
    height: 112,
    backgroundColor: colors.surfaceElevated,
    position: 'relative',
  },
  image: { width: '100%', height: '100%' },
  imageTopFade: { position: 'absolute', top: 0, left: 0, right: 0, height: 40 },
  availBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4,
  },
  availDot: { width: 5, height: 5, borderRadius: 3 },
  availText: { fontSize: 10, fontWeight: '700' },
  ratingBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 20,
  },
  ratingText: { fontSize: 10, fontWeight: '800', color: colors.textPrimary },
  details: { padding: 12 },
  name: { fontSize: 13, fontWeight: '800', color: colors.textPrimary, marginBottom: 2 },
  seller: { fontSize: 11, color: colors.textMuted, marginBottom: 5, fontWeight: '500' },
  distanceRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 10 },
  distanceText: { fontSize: 11, color: colors.textSecondary, fontWeight: '600' },
  priceChip: {
    flexDirection: 'row',
    alignItems: 'baseline',
    alignSelf: 'flex-start',
    gap: 2,
    backgroundColor: colors.accentYellowSoft,
    borderWidth: 1,
    borderColor: 'rgba(245,200,66,0.3)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 10,
  },
  price: { fontSize: 15, fontWeight: '800', color: colors.textPrimary },
  unit: { fontSize: 10, color: colors.textSecondary, fontWeight: '600' },
  addCartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 11,
    paddingVertical: 9,
  },
  addCartBtnDisabled: { backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.borderLight },
  addCartBtnText: { fontSize: 12, fontWeight: '800', color: colors.textPrimary },
  addCartBtnTextDisabled: { fontSize: 12, fontWeight: '700', color: colors.textMuted },
});

export default RentalCard;