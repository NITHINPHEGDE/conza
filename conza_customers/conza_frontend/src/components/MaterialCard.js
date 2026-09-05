import React, { useCallback, useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  TextInput,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

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
  inStock = true,
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
  const [cartAdded, setCartAdded] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [localQty, setLocalQty] = useState(quantity > 0 ? String(quantity) : '1');

  useEffect(() => {
    if (quantity > 0) {
      setLocalQty(String(quantity));
    }
  }, [quantity]);

  const imageSource = useMemo(() => ({ uri: image }), [image]);

  const hasDiscount = Number(mrp) > Number(price);
  const computedDiscount = discountPercent || (hasDiscount ? Math.round(((Number(mrp) - Number(price)) / Number(mrp)) * 100) : null);
  const unitShort = (unit || 'piece').replace('per ', '').trim();

  const handleImagePress = useCallback(() => {
    const num = Math.max(1, parseInt(localQty, 10) || 1);
    onImagePress && onImagePress({
      id, name, seller, price, mrp, discountPercent, unit, distance,
      image, images, rating, inStock, quantity: num,
      category, brand, description,
      sellerId, sellerPhone, sellerCity,
      returnable, replaceable, returnPolicy, replacementPolicy,
    });
  }, [
    onImagePress, id, name, seller, price, mrp, discountPercent, unit, distance,
    image, images, rating, inStock, localQty,
    category, brand, description, sellerId, sellerPhone, sellerCity,
    returnable, replaceable, returnPolicy, replacementPolicy,
  ]);

  const handleMinus = useCallback(() => {
    setLocalQty((prev) => {
      const num = parseInt(prev, 10);
      const next = isNaN(num) || num <= 1 ? 1 : num - 1;
      if (onUpdate && quantity > 0) onUpdate(id, next);
      return String(next);
    });
  }, [onUpdate, id, quantity]);

  const handlePlus = useCallback(() => {
    setLocalQty((prev) => {
      const num = parseInt(prev, 10);
      const next = isNaN(num) ? 1 : Math.min(9999, num + 1);
      if (onUpdate && quantity > 0) onUpdate(id, next);
      return String(next);
    });
  }, [onUpdate, id, quantity]);

  const handleTextChange = useCallback((text) => {
    const cleaned = text.replace(/[^0-9]/g, '').slice(0, 4);
    setLocalQty(cleaned);
    const num = parseInt(cleaned, 10);
    if (!isNaN(num) && num > 0 && onUpdate && quantity > 0) {
      onUpdate(id, num);
    }
  }, [onUpdate, id, quantity]);

  const handleBlur = useCallback(() => {
    const num = parseInt(localQty, 10);
    if (isNaN(num) || num < 1) {
      setLocalQty('1');
      if (onUpdate && quantity > 0) onUpdate(id, 1);
    }
  }, [localQty, onUpdate, id, quantity]);

  const handleAddToCart = useCallback(() => {
    if (!inStock) return;
    const finalQty = Math.max(1, parseInt(localQty, 10) || 1);
    if (onAddToCart) {
      onAddToCart({ id, name, seller, price, unit, distance, image, rating, inStock, quantity: finalQty });
    }
    if (onUpdate) {
      onUpdate(id, finalQty);
    }
    setCartAdded(true);
    setTimeout(() => setCartAdded(false), 1800);
  }, [onAddToCart, onUpdate, id, name, seller, price, unit, distance, image, rating, inStock, localQty]);

  return (
    <View style={styles.card}>

      {/* ── Image Container with Badges ── */}
      <TouchableOpacity style={styles.imageWrapper} onPress={handleImagePress} activeOpacity={0.92}>
        <Image source={imageSource} style={styles.image} resizeMode="contain" />

        {/* Stock badge — top-left (lightweight mint pill, clean typography) */}
        <View style={[styles.stockBadge, { backgroundColor: inStock ? '#DCFCE7' : '#FEE2E2' }]}>
          <Text style={[styles.stockText, { color: inStock ? '#16A34A' : '#EF4444' }]}>
            {inStock ? 'In Stock' : 'Out of Stock'}
          </Text>
        </View>

        {/* Rating badge — top-right (lightweight white pill with orange star) */}
        <View style={styles.ratingBadge}>
          <Text style={styles.ratingStar}>★</Text>
          <Text style={styles.ratingText}>{rating || '4.5'}</Text>
        </View>

        {/* Heart button — floating delicate circle at bottom-right of image */}
        <TouchableOpacity
          style={styles.heartBtn}
          onPress={() => setIsFavorite((prev) => !prev)}
          activeOpacity={0.75}
        >
          <MaterialCommunityIcons
            name={isFavorite ? 'heart' : 'heart-outline'}
            size={15}
            color={isFavorite ? '#EF4444' : '#4B5563'}
          />
        </TouchableOpacity>
      </TouchableOpacity>

      {/* ── Content area ── */}
      <View style={styles.content}>

        {/* Product Title — sleek, lightweight typography */}
        <Text style={styles.name} numberOfLines={1}>{name}</Text>

        {/* Seller row with verified blue tick */}
        <View style={styles.sellerRow}>
          <Text style={styles.sellerLabel}>by </Text>
          <Text style={styles.sellerName} numberOfLines={1}>{seller || brand || 'RN Enterprises'}</Text>
          <MaterialCommunityIcons name="check-circle" size={13} color="#2563EB" style={styles.verifiedIcon} />
        </View>

        {/* Price & Discount row */}
        <View style={styles.priceRow}>
          <View style={styles.priceLeft}>
            <Text style={styles.price}>₹{Number(price).toLocaleString('en-IN')}</Text>
            <Text style={styles.unitLabel}> / {unitShort}</Text>
          </View>
          {computedDiscount ? (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>{computedDiscount}% OFF</Text>
            </View>
          ) : null}
        </View>

        {/* ── Bottom row: Lightweight Stepper Pill + Add to Cart Button ── */}
        <View style={styles.actionRow}>
          {inStock ? (
            <>
              {/* Stepper Pill — slender, lightweight warm cream */}
              <View style={styles.stepper}>
                <TouchableOpacity style={styles.stepBtn} onPress={handleMinus} activeOpacity={0.65} hitSlop={{ top: 8, bottom: 8, left: 6, right: 3 }}>
                  <Text style={styles.stepSymbol}>−</Text>
                </TouchableOpacity>
                <TextInput
                  style={styles.stepInput}
                  value={localQty}
                  onChangeText={handleTextChange}
                  onBlur={handleBlur}
                  keyboardType="numeric"
                  maxLength={4}
                  selectTextOnFocus
                  returnKeyType="done"
                />
                <TouchableOpacity style={styles.stepBtn} onPress={handlePlus} activeOpacity={0.65} hitSlop={{ top: 8, bottom: 8, left: 3, right: 6 }}>
                  <Text style={styles.stepSymbol}>+</Text>
                </TouchableOpacity>
              </View>

              {/* Add to Cart button — slender, modern amber */}
              <TouchableOpacity
                style={styles.addCartBtn}
                onPress={handleAddToCart}
                activeOpacity={0.85}
              >
                <MaterialCommunityIcons
                  name={cartAdded ? 'check' : 'cart'}
                  size={12}
                  color="#FFFFFF"
                />
                <Text style={styles.addCartText} numberOfLines={1}>
                  {cartAdded ? 'Added' : 'Add to Cart'}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.unavailableBox}>
              <Text style={styles.unavailableText}>Out of Stock</Text>
            </View>
          )}
        </View>

      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EFF0F3',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 1,
    marginBottom: 2,
  },

  // Image wrapper — clean, soft, lightweight
  imageWrapper: {
    width: '100%',
    height: 136,
    position: 'relative',
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  image: {
    width: '86%',
    height: '86%',
  },

  // In Stock badge — lightweight mint pill
  stockBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
    zIndex: 2,
  },
  stockText: {
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 0.1,
  },

  // Rating badge — clean white pill with orange star
  ratingBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: '#F0F1F3',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
    zIndex: 2,
  },
  ratingStar: {
    fontSize: 10.5,
    color: '#F59E0B',
    lineHeight: 12,
  },
  ratingText: {
    fontSize: 10.5,
    fontWeight: '500',
    color: '#334155',
  },

  // Heart button — lightweight floating circle
  heartBtn: {
    position: 'absolute',
    bottom: 6,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: '#ECEEF1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.07,
    shadowRadius: 3,
    elevation: 2,
    zIndex: 3,
  },

  // Content area
  content: {
    paddingHorizontal: 11,
    paddingTop: 8,
    paddingBottom: 11,
  },

  // Product title — sleek, clean, modern typography
  name: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1E293B',
    lineHeight: 17,
    letterSpacing: -0.1,
    marginBottom: 2.5,
  },

  // Seller row
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 7,
  },
  sellerLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '400',
  },
  sellerName: {
    fontSize: 11,
    color: '#4B5563',
    fontWeight: '500',
  },
  verifiedIcon: {
    marginLeft: 3.5,
  },

  // Price & Discount row
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  priceLeft: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  price: {
    fontSize: 15.5,
    fontWeight: '600',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  unitLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '400',
    marginLeft: 2,
  },
  discountBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 5,
  },
  discountText: {
    fontSize: 9.5,
    fontWeight: '600',
    color: '#EF4444',
    letterSpacing: 0.1,
  },

  // Action Row
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  // Stepper — neutral grey rounded pill
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    height: 32,
    paddingHorizontal: 4,
    minWidth: 54,
  },
  stepBtn: {
    width: 14,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepSymbol: {
    fontSize: 13,
    fontWeight: '500',
    color: '#4B5563',
    lineHeight: 15,
  },
  stepInput: {
    minWidth: 20,
    maxWidth: 26,
    height: 32,
    fontSize: 11,
    fontWeight: '500',
    color: '#1E293B',
    textAlign: 'center',
    textAlignVertical: 'center',
    paddingHorizontal: 0,
    paddingVertical: 0,
    includeFontPadding: false,
  },

  // Add to Cart button — golden amber pill
  addCartBtn: {
    flex: 1,
    height: 32,
    backgroundColor: '#F59E0B',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 6,
  },
  addCartText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#FFFFFF',
    letterSpacing: -0.1,
  },

  unavailableBox: {
    flex: 1,
    height: 32,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unavailableText: {
    fontSize: 11,
    fontWeight: '400',
    color: '#9CA3AF',
  },
});

export default MaterialCard;