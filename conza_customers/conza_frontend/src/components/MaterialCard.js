import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

const MaterialCard = React.memo(({
  id,
  name,
  seller,
  price,
  mrp,
  discountPercent,
  unit,
  distance,
  image,
  images,
  rating,
  inStock,
  quantity = 0,
  category,
  brand,
  description,
  sellerId,
  sellerPhone,
  sellerCity,
  returnable,
  replaceable,
  returnPolicy,
  replacementPolicy,
  onUpdate,
  onImagePress,
  onAddToCart,
}) => {
  const [cartAdded, setCartAdded] = React.useState(false);
  const imageSource = useMemo(() => ({ uri: image }), [image]);

  const hasDiscount = Number(mrp) > Number(price);
  const qty = Number(quantity) || 0;
  const displayPrice = ((Number(price) || 0) * (qty > 0 ? qty : 1)).toLocaleString('en-IN');
  const displayMrp  = ((Number(mrp)   || 0) * (qty > 0 ? qty : 1)).toLocaleString('en-IN');
  const unitLabel   = qty > 0 ? `${qty} ${(unit || '').replace('per ', '')}` : (unit || '');

  const handleImagePress = useCallback(() => {
    onImagePress && onImagePress({
      id, name, seller, price, mrp, discountPercent, unit, distance,
      image, images, rating, inStock, quantity,
      category, brand, description,
      sellerId, sellerPhone, sellerCity,
      returnable, replaceable, returnPolicy, replacementPolicy,
    });
  }, [
    onImagePress, id, name, seller, price, mrp, discountPercent, unit, distance,
    image, images, rating, inStock, quantity,
    category, brand, description, sellerId, sellerPhone, sellerCity,
    returnable, replaceable, returnPolicy, replacementPolicy,
  ]);

  const handleMinus = useCallback(() => {
    onUpdate(id, Math.max(0, qty - 1));
  }, [onUpdate, id, qty]);

  const handlePlus = useCallback(() => {
    onUpdate(id, qty + 1);
  }, [onUpdate, id, qty]);

  const handleTextChange = useCallback((t) => {
    const num = parseInt(t);
    if (!isNaN(num)) onUpdate(id, num);
    else if (t === '') onUpdate(id, 0);
  }, [onUpdate, id]);

  const handleAdd = useCallback(() => {
    if (inStock) onUpdate(id, 1);
  }, [onUpdate, id, inStock]);

  const handleAddToCart = useCallback(() => {
    if (!inStock) return;
    onAddToCart && onAddToCart({ id, name, seller, price, unit, distance, image, rating, inStock });
    setCartAdded(true);
    setTimeout(() => setCartAdded(false), 2000);
  }, [onAddToCart, id, name, seller, price, unit, distance, image, rating, inStock]);

  return (
    <View style={[styles.card, qty > 0 && styles.cardActive]}>

      {/* ── Image ── */}
      <TouchableOpacity style={styles.imageWrapper} onPress={handleImagePress} activeOpacity={0.9}>
        <Image source={imageSource} style={styles.image} resizeMode="cover" />
        {/* Stock badge — top right */}
        <View style={[styles.stockBadge, { backgroundColor: inStock ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)' }]}>
          <View style={[styles.stockDot, { backgroundColor: inStock ? '#22c55e' : '#ef4444' }]} />
          <Text style={[styles.stockText, { color: inStock ? '#22c55e' : '#ef4444' }]}>
            {inStock ? 'In Stock' : 'Out of Stock'}
          </Text>
        </View>
        {/* Rating badge — top left */}
        <View style={styles.ratingBadge}>
          <MaterialCommunityIcons name="star" size={10} color={colors.accentAmber} />
          <Text style={styles.ratingText}>{rating}</Text>
        </View>
      </TouchableOpacity>

      {/* ── Price block ── */}
      <View style={styles.priceBlock}>
        <View style={styles.priceRow}>
          {hasDiscount ? (
            <Text style={styles.mrpStrike}>₹{displayMrp}</Text>
          ) : null}
          <Text style={styles.price}>₹{displayPrice}</Text>
          <Text style={styles.unitLabel}>{unitLabel}</Text>
        </View>
        {hasDiscount ? (
          <View style={styles.discountPill}>
            <Text style={styles.discountText}>{discountPercent}% off</Text>
          </View>
        ) : null}
      </View>

      {/* ── Divider ── */}
      <View style={styles.divider} />

      {/* ── Meta row: name/seller left | distance right ── */}
      <View style={styles.metaRow}>
        <View style={styles.metaLeft}>
          <Text style={styles.name} numberOfLines={1}>{name}</Text>
          <Text style={styles.seller} numberOfLines={1}>by {seller}</Text>
        </View>
        {distance ? (
          <View style={styles.distanceWrap}>
            <MaterialCommunityIcons name="map-marker" size={12} color={colors.textMuted} />
            <Text style={styles.distanceText} numberOfLines={1}>{distance}</Text>
          </View>
        ) : null}
      </View>

      {/* ── Bottom action: pill morphs into stepper when qty > 0 ── */}
      <View style={styles.cartRow}>
        {inStock ? (
          qty > 0 ? (
            /* ── Qty stepper — same pill shape ── */
            <LinearGradient
              colors={[colors.gradientStart, colors.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.stepperPill}
            >
              <TouchableOpacity style={styles.stepBtn} onPress={handleMinus} activeOpacity={0.75}>
                <Text style={styles.stepSymbol}>−</Text>
              </TouchableOpacity>

              <TextInput
                style={styles.stepInput}
                value={String(qty)}
                onChangeText={handleTextChange}
                keyboardType="numeric"
                maxLength={4}
                selectTextOnFocus
              />

              <TouchableOpacity style={styles.stepBtn} onPress={handlePlus} activeOpacity={0.75}>
                <Text style={styles.stepSymbol}>+</Text>
              </TouchableOpacity>
            </LinearGradient>
          ) : (
            /* ── Default add-to-cart pill ── */
            <TouchableOpacity
              onPress={cartAdded ? undefined : handleAddToCart}
              activeOpacity={0.85}
              style={styles.cartPillWrap}
            >
              <LinearGradient
                colors={cartAdded ? ['#22c55e', '#16a34a'] : [colors.gradientStart, colors.gradientEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.cartPill}
              >
                <MaterialCommunityIcons
                  name={cartAdded ? 'check-circle' : 'cart'}
                  size={16}
                  color={colors.textPrimary}
                />
                <Text style={styles.cartPillText}>
                  {cartAdded ? 'Added to Cart' : 'Add to Cart'}
                </Text>
                {/* ⊕ circle — tapping this kicks off qty stepper */}
                <TouchableOpacity
                  style={styles.plusCircle}
                  onPress={handleAdd}
                  activeOpacity={0.8}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <MaterialCommunityIcons name="plus" size={15} color={colors.textPrimary} />
                </TouchableOpacity>
              </LinearGradient>
            </TouchableOpacity>
          )
        ) : (
          <View style={[styles.cartPill, styles.cartPillDisabled]}>
            <MaterialCommunityIcons name="cart-off" size={15} color={colors.textMuted} />
            <Text style={styles.cartPillTextDisabled}>Unavailable</Text>
          </View>
        )}
      </View>

    </View>
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
  cardActive: {
    borderColor: colors.accentYellow,
    shadowColor: colors.accentAmber,
    shadowOpacity: 0.2,
  },

  // Image
  imageWrapper: { width: '100%', height: 130, position: 'relative', backgroundColor: colors.surfaceElevated },
  image: { width: '100%', height: '100%' },

  // Stock badge (top-right)
  stockBadge: {
    position: 'absolute', top: 8, right: 8,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 7, paddingVertical: 3, borderRadius: 20,
  },
  stockDot: { width: 5, height: 5, borderRadius: 3 },
  stockText: { fontSize: 9.5, fontWeight: '700' },

  // Rating badge (top-left)
  ratingBadge: {
    position: 'absolute', top: 8, left: 8,
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 6, paddingVertical: 3, borderRadius: 20,
  },
  ratingText: { fontSize: 9.5, fontWeight: '800', color: colors.textPrimary },

  // Price block
  priceBlock: {
    paddingHorizontal: 12,
    paddingTop: 9,
    paddingBottom: 7,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4, flexShrink: 1 },
  mrpStrike: { fontSize: 11, color: colors.textMuted, fontWeight: '600', textDecorationLine: 'line-through' },
  price: { fontSize: 19, fontWeight: '900', color: colors.textPrimary },
  unitLabel: { fontSize: 10.5, color: colors.textMuted, fontWeight: '600' },
  discountPill: {
    backgroundColor: 'rgba(239,68,68,0.11)',
    borderRadius: 20,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  discountText: { fontSize: 9.5, fontWeight: '800', color: '#ef4444' },

  // Divider
  divider: { height: 1, backgroundColor: colors.borderLight, marginHorizontal: 12 },

  // Meta row
  metaRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 7,
    paddingBottom: 6,
    gap: 8,
  },
  metaLeft: { flex: 1, minWidth: 0 },
  name: { fontSize: 12.5, fontWeight: '800', color: colors.textPrimary, marginBottom: 1 },
  seller: { fontSize: 10.5, color: colors.textMuted, fontWeight: '500' },
  distanceWrap: { flexDirection: 'row', alignItems: 'center', gap: 2, flexShrink: 0 },
  distanceText: { fontSize: 10.5, color: colors.textMuted, fontWeight: '600', maxWidth: 80 },

  // Shared cart row padding
  cartRow: { paddingHorizontal: 10, paddingBottom: 10 },

  // ── Default cart pill ──
  cartPillWrap: { borderRadius: 50, overflow: 'hidden' },
  cartPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 14,
    paddingRight: 5,
    paddingVertical: 8,    // slender
    borderRadius: 50,
  },
  cartPillDisabled: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.borderLight,
    justifyContent: 'center',
    paddingRight: 14,
    gap: 6,
  },
  cartPillText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: 0.3,
  },
  cartPillTextDisabled: { fontSize: 11.5, fontWeight: '700', color: colors.textMuted },
  plusCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  // ── Stepper pill (replaces cart pill when qty > 0) ──
  stepperPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 50,
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  stepBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepSymbol: { fontSize: 18, fontWeight: '800', color: colors.textPrimary, lineHeight: 22 },
  stepInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
    paddingHorizontal: 4,
    paddingVertical: 0,
    height: 34,
  },
});

export default MaterialCard;