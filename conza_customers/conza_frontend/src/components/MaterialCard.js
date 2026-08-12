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
            <MaterialCommunityIcons name="map-marker" size={13} color={colors.textMuted} />
            <Text style={styles.distanceText} numberOfLines={1}>{distance}</Text>
          </View>
        ) : null}
      </View>

      {/* ── Qty stepper (shown only when qty > 0) ── */}
      {qty > 0 ? (
        <View style={styles.stepperRow}>
          <TouchableOpacity style={styles.stepBtn} onPress={handleMinus} activeOpacity={0.8}>
            <Text style={styles.stepBtnText}>−</Text>
          </TouchableOpacity>
          <TextInput
            style={styles.stepInput}
            value={String(qty)}
            onChangeText={handleTextChange}
            keyboardType="numeric"
            maxLength={5}
            selectTextOnFocus
          />
          <TouchableOpacity style={styles.stepBtn} onPress={handlePlus} activeOpacity={0.8}>
            <Text style={styles.stepBtnText}>+</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* ── Add to Cart pill ── */}
      <View style={styles.cartRow}>
        {inStock ? (
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
                size={18}
                color={colors.textPrimary}
              />
              <Text style={styles.cartPillText}>
                {cartAdded ? 'Added to Cart' : 'Add to Cart'}
              </Text>
              {/* + / quantity quick-add circle */}
              <TouchableOpacity
                style={styles.qtyCircle}
                onPress={handleAdd}
                activeOpacity={0.85}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MaterialCommunityIcons name="plus" size={16} color={colors.textPrimary} />
              </TouchableOpacity>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <View style={[styles.cartPill, styles.cartPillDisabled]}>
            <MaterialCommunityIcons name="cart-off" size={16} color={colors.textMuted} />
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

  // Stock badge (top-right of image)
  stockBadge: {
    position: 'absolute', top: 8, right: 8,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20,
  },
  stockDot: { width: 5, height: 5, borderRadius: 3 },
  stockText: { fontSize: 10, fontWeight: '700' },

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

  // Qty stepper
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
    overflow: 'hidden',
  },
  stepBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accentYellowSoft },
  stepBtnText: { fontSize: 16, fontWeight: '800', color: colors.textPrimary },
  stepInput: {
    fontSize: 13, fontWeight: '800', color: colors.textPrimary,
    backgroundColor: colors.surface,
    width: 46, height: 32,
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
    paddingHorizontal: 2, paddingVertical: 0,
  },

  // Cart pill button
  cartRow: { paddingHorizontal: 12, paddingBottom: 12 },
  cartPillWrap: { borderRadius: 50, overflow: 'hidden' },
  cartPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
    paddingRight: 6,
    paddingVertical: 11,
    borderRadius: 50,
    gap: 0,
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

export default MaterialCard;