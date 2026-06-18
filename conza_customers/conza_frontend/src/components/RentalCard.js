import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
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
      activeOpacity={0.8}
    >
      <View style={styles.imageWrapper}>
        <Image source={imageSource} style={styles.image} resizeMode="cover" />
        <View style={styles.availBadge}>
          <View style={availDotStyle} />
          <Text style={availTextStyle}>
            {item.available ? 'Available' : 'Booked'}
          </Text>
        </View>
        <View style={styles.ratingBadge}>
          <Text style={styles.ratingText}>⭐ {item.rating}</Text>
        </View>
      </View>

      <View style={styles.details}>
        <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.seller} numberOfLines={1}>by {item.seller}</Text>
        
        <View style={styles.distanceRow}>
          <Text style={styles.distanceText}>📍 {item.distance}</Text>
        </View>

        <View style={styles.priceRow}>
          <Text style={styles.price}>₹{item.pricePerDay}</Text>
          <Text style={styles.unit}>/day</Text>
        </View>

        <TouchableOpacity
          style={[styles.addCartBtn, !item.available && styles.addCartBtnDisabled]}
          onPress={handleAddToCart}
          activeOpacity={0.8}
        >
          <Text style={styles.addCartBtnText}>
            {added ? '✓ Added' : '🛒 Add to Cart'}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
});


const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.14,
    shadowRadius: 8,
    elevation: 4,
  },
  imageWrapper: {
    width: '100%',
    height: 110,
    backgroundColor: colors.surfaceElevated,
    position: 'relative',
  },
  image: { width: '100%', height: '100%' },
  availBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.93)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 20,
    gap: 4,
    elevation: 2,
  },
  availDot: { width: 5, height: 5, borderRadius: 3 },
  availText: { fontSize: 10, fontWeight: '700' },
  ratingBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255,255,255,0.93)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 20,
    elevation: 2,
  },
  ratingText: { fontSize: 10, fontWeight: '700', color: colors.textPrimary },
  details: { padding: 11 },
  name: { fontSize: 13, fontWeight: '700', color: colors.textPrimary, marginBottom: 2 },
  seller: { fontSize: 11, color: colors.textMuted, marginBottom: 4, fontWeight: '500' },
  distanceRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  distanceText: { fontSize: 11, color: colors.textSecondary, fontWeight: '600' },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 2, marginBottom: 8 },
  price: { fontSize: 15, fontWeight: '800', color: colors.textPrimary },
  unit: { fontSize: 10, color: colors.textMuted, fontWeight: '500' },
  addCartBtn: {
    backgroundColor: colors.accentYellow,
    borderRadius: 10,
    paddingVertical: 7,
    alignItems: 'center',
  },
  addCartBtnDisabled: { backgroundColor: colors.surfaceElevated },
  addCartBtnText: { fontSize: 12, fontWeight: '800', color: '#111' },
});

export default RentalCard;