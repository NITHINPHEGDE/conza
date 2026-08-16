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

  const hasDiscount = Number(item.mrp) > Number(item.pricePerDay);
  const locationLabel = item.sellerCity || item.distance;

  return (
    <TouchableOpacity style={styles.card} onPress={handlePress} activeOpacity={0.9}>

      {/* ── Image ── */}
      <View style={styles.imageWrapper}>
       <Image source={imageSource} style={styles.image} resizeMode="contain" />>
        {/* Availability badge — top right */}
        <View style={[styles.availBadge, {
          backgroundColor: item.available ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
        }]}>
          <View style={[styles.availDot, {
            backgroundColor: item.available ? '#22c55e' : '#ef4444',
          }]} />
          <Text style={[styles.availText, {
            color: item.available ? '#22c55e' : '#ef4444',
          }]}>
            {item.available ? 'Available' : 'Booked'}
          </Text>
        </View>
        {/* Rating badge — top left */}
        <View style={styles.ratingBadge}>
          <MaterialCommunityIcons name="star" size={10} color={colors.accentAmber} />
          <Text style={styles.ratingText}>{item.rating}</Text>
        </View>
      </View>

      {/* ── Price block ── */}
      <View style={styles.priceBlock}>
        <View style={styles.priceRow}>
          {hasDiscount ? (
            <Text style={styles.mrpStrike}>₹{item.mrp}</Text>
          ) : null}
          <Text style={styles.price}>₹{item.pricePerDay}</Text>
          <Text style={styles.unitLabel}>/ day</Text>
        </View>
        {hasDiscount ? (
          <View style={styles.discountPill}>
            <Text style={styles.discountText}>{item.discountPercent}% off</Text>
          </View>
        ) : null}
      </View>

      {/* ── Divider ── */}
      <View style={styles.divider} />

      {/* ── Meta row: name/seller left | distance right ── */}
      <View style={styles.metaRow}>
        <View style={styles.metaLeft}>
          <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
          {item.seller ? (
            <Text style={styles.seller} numberOfLines={1}>by {item.seller}</Text>
          ) : null}
        </View>
        {locationLabel ? (
          <View style={styles.distanceWrap}>
            <MaterialCommunityIcons name="map-marker" size={13} color={colors.textMuted} />
            <Text style={styles.distanceText} numberOfLines={1}>{locationLabel}</Text>
          </View>
        ) : null}
      </View>

      {/* ── Add to Cart pill ── */}
      <View style={styles.cartRow}>
        {item.available ? (
          <TouchableOpacity
            onPress={handleAddToCart}
            activeOpacity={0.85}
            style={styles.cartPillWrap}
          >
            <LinearGradient
              colors={added ? ['#22c55e', '#16a34a'] : [colors.gradientStart, colors.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.cartPill}
            >
              <MaterialCommunityIcons
                name={added ? 'check-circle' : 'cart'}
                size={18}
                color={colors.textPrimary}
              />
              <Text style={styles.cartPillText}>
                {added ? 'Added to Cart' : 'Add to Cart'}
              </Text>
              <View style={styles.qtyCircle}>
                <MaterialCommunityIcons name="plus" size={16} color={colors.textPrimary} />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <View style={[styles.cartPill, styles.cartPillDisabled]}>
            <MaterialCommunityIcons name="cart-off" size={16} color={colors.textMuted} />
            <Text style={styles.cartPillTextDisabled}>Unavailable</Text>
          </View>
        )}
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
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },

  // Image
  imageWrapper: { width: '100%', height: 130, position: 'relative', backgroundColor: colors.surfaceElevated },
  image: { width: '100%', height: '100%' },

  // Availability badge (top-right)
  availBadge: {
    position: 'absolute', top: 8, right: 8,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20,
  },
  availDot: { width: 5, height: 5, borderRadius: 3 },
  availText: { fontSize: 10, fontWeight: '700' },

  // Rating badge (top-left)
  ratingBadge: {
    position: 'absolute', top: 8, left: 8,
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 6, paddingVertical: 3, borderRadius: 20,
  },
  ratingText: { fontSize: 10, fontWeight: '800', color: colors.textPrimary },

  // Price block
  priceBlock: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4, flexShrink: 1 },
  mrpStrike: { fontSize: 12, color: colors.textMuted, fontWeight: '600', textDecorationLine: 'line-through' },
  price: { fontSize: 20, fontWeight: '900', color: colors.textPrimary },
  unitLabel: { fontSize: 11, color: colors.textMuted, fontWeight: '600' },
  discountPill: {
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderRadius: 20,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  discountText: { fontSize: 10, fontWeight: '800', color: '#ef4444' },

  // Divider
  divider: { height: 1, backgroundColor: colors.borderLight, marginHorizontal: 12 },

  // Meta row
  metaRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  metaLeft: { flex: 1, minWidth: 0 },
  name: { fontSize: 13, fontWeight: '800', color: colors.textPrimary, marginBottom: 1 },
  seller: { fontSize: 11, color: colors.textMuted, fontWeight: '500' },
  distanceWrap: { flexDirection: 'row', alignItems: 'center', gap: 2, flexShrink: 0 },
  distanceText: { fontSize: 11, color: colors.textMuted, fontWeight: '600', maxWidth: 80 },

  // Cart pill
  cartRow: { paddingHorizontal: 12, paddingBottom: 12 },
  cartPillWrap: { borderRadius: 50, overflow: 'hidden' },
  cartPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
    paddingRight: 6,
    paddingVertical: 11,
    borderRadius: 50,
  },
  cartPillDisabled: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.borderLight,
    justifyContent: 'center',
    paddingRight: 16,
    gap: 8,
  },
  cartPillText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: 0.4,
  },
  cartPillTextDisabled: { fontSize: 12, fontWeight: '700', color: colors.textMuted },
  qtyCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
});

export default RentalCard;