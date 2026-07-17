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

  const cardStyle = useMemo(() => [
    styles.card,
    Number(quantity) > 0 && styles.cardActive,
  ], [quantity]);

  const stockBadgeStyle = useMemo(() => [
    styles.stockBadge,
    { backgroundColor: inStock ? 'rgba(46,139,87,0.12)' : 'rgba(224,59,59,0.12)' }
  ], [inStock]);

  const stockDotStyle = useMemo(() => [
    styles.stockDot, 
    { backgroundColor: inStock ? colors.success : colors.danger }
  ], [inStock]);

  const stockTextStyle = useMemo(() => [
    styles.stockText, 
    { color: inStock ? colors.success : colors.danger }
  ], [inStock]);
  
  const handleImagePress = useCallback(() => {
    // Pass the full product payload through to the detail screen —
    // previously this stripped everything down to a single `image` field,
    // so the detail screen's image carousel only ever had one photo to
    // show even when the vendor had uploaded several during listing.
    onImagePress && onImagePress({
      id, name, seller, price, unit, distance,
      image, images,
      rating, inStock, quantity,
      category, brand, description,
      sellerId, sellerPhone, sellerCity,
      returnable, replaceable, returnPolicy, replacementPolicy,
    });
  }, [
    onImagePress, id, name, seller, price, unit, distance,
    image, images, rating, inStock, quantity,
    category, brand, description, sellerId, sellerPhone, sellerCity,
    returnable, replaceable, returnPolicy, replacementPolicy,
  ]);

  const handleMinus = useCallback(() => {
    onUpdate(id, Math.max(0, (Number(quantity) || 0) - 1));
  }, [onUpdate, id, quantity]);

  const handlePlus = useCallback(() => {
    onUpdate(id, (Number(quantity) || 0) + 1);
  }, [onUpdate, id, quantity]);

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
    <View style={cardStyle}>
      <TouchableOpacity style={styles.imageWrapper} onPress={handleImagePress} activeOpacity={0.9}>
        <Image source={imageSource} style={styles.image} />
        <LinearGradient
          colors={['rgba(0,0,0,0.28)', 'transparent']}
          style={styles.imageTopFade}
          pointerEvents="none"
        />
        <View style={stockBadgeStyle}>
          <View style={stockDotStyle} />
          <Text style={stockTextStyle}>
            {inStock ? 'In Stock' : 'Out'}
          </Text>
        </View>
        <View style={styles.ratingBadge}>
          <MaterialCommunityIcons name="star" size={11} color={colors.accentAmber} />
          <Text style={styles.ratingText}>{rating}</Text>
        </View>
      </TouchableOpacity>

      <View style={styles.details}>
        <Text style={styles.name} numberOfLines={1}>{name}</Text>
        <Text style={styles.seller} numberOfLines={1}>by {seller}</Text>
        
        <View style={styles.distanceRow}>
          <MaterialCommunityIcons name="map-marker" size={12} color={colors.textMuted} />
          <Text style={styles.distanceText}>{distance}</Text>
        </View>

        <View style={styles.priceRow}>
          <View style={styles.priceCol}>
            <Text style={styles.price} numberOfLines={1}>
              ₹{((Number(price) || 0) * (Number(quantity) > 0 ? Number(quantity) : 1)).toLocaleString('en-IN')}
            </Text>
            <Text style={styles.unit} numberOfLines={1}>
              {Number(quantity) > 0 ? `${quantity} ${unit.replace('per ', '')}` : unit}
            </Text>
          </View>

          {(Number(quantity) || 0) > 0 ? (
            <View style={styles.qtyControl}>
              <TouchableOpacity
                style={styles.qtyBtnMinus}
                onPress={handleMinus}
                activeOpacity={0.8}
              >
                <Text style={styles.qtyBtnText}>−</Text>
              </TouchableOpacity>
              <TextInput
                style={styles.qtyInput}
                value={String(quantity)}
                onChangeText={handleTextChange}
                keyboardType="numeric"
                maxLength={5}
                selectTextOnFocus
              />
              <TouchableOpacity
                style={styles.qtyBtnPlus}
                onPress={handlePlus}
                activeOpacity={0.8}
              >
                <Text style={styles.qtyBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.addBtn, !inStock && styles.addBtnDisabled]}
              onPress={handleAdd}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="plus" size={18} color={inStock ? colors.textPrimary : colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          onPress={handleAddToCart}
          activeOpacity={0.85}
          disabled={!inStock}
        >
          {inStock ? (
            <LinearGradient
              colors={cartAdded ? [colors.success, colors.success] : [colors.gradientStart, colors.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.addCartBtn}
            >
              <MaterialCommunityIcons
                name={cartAdded ? 'check-circle' : 'cart-plus'}
                size={14}
                color={colors.textPrimary}
              />
              <Text style={styles.addCartBtnText}>
                {cartAdded ? 'Added to Cart' : 'Add to Cart'}
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
    </View>
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
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardActive: {
    borderColor: colors.accentYellow,
    shadowColor: colors.accentAmber,
    shadowOpacity: 0.18,
  },
  imageWrapper: { width: '100%', height: 122, position: 'relative', backgroundColor: colors.surfaceElevated },
  image: { width: '100%', height: '100%' },
  imageTopFade: { position: 'absolute', top: 0, left: 0, right: 0, height: 40 },
  stockBadge: { position: 'absolute', top: 8, left: 8, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, gap: 4 },
  stockDot: { width: 5, height: 5, borderRadius: 3 },
  stockText: { fontSize: 10, fontWeight: '700' },
  ratingBadge: { position: 'absolute', top: 8, right: 8, flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(255,255,255,0.95)', paddingHorizontal: 7, paddingVertical: 4, borderRadius: 20 },
  ratingText: { fontSize: 10, fontWeight: '800', color: colors.textPrimary },
  details: { padding: 12 },
  name: { fontSize: 13, fontWeight: '800', color: colors.textPrimary, marginBottom: 2 },
  seller: { fontSize: 11, color: colors.textMuted, marginBottom: 5, fontWeight: '500' },
  distanceRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 10 },
  distanceText: { fontSize: 11, color: colors.textSecondary, fontWeight: '600' },
  priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, gap: 6 },
  priceCol: { flex: 1, minWidth: 0, flexShrink: 1 },
  price: { fontSize: 15, fontWeight: '800', color: colors.textPrimary },
  unit: { fontSize: 10, color: colors.textMuted, fontWeight: '500' },
  addBtn: { width: 30, height: 30, borderRadius: 10, backgroundColor: colors.accentYellowSoft, borderWidth: 1, borderColor: 'rgba(245,200,66,0.35)', alignItems: 'center', justifyContent: 'center' },
  addBtnDisabled: { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight },
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
  qtyControl: { flexDirection: 'row', alignItems: 'center', borderRadius: 10, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceElevated, overflow: 'hidden', alignSelf: 'center', flexGrow: 0, flexShrink: 0 },
  qtyBtnMinus: { width: 26, height: 30, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accentYellowSoft, flexGrow: 0, flexShrink: 0 },
  qtyBtnPlus: { width: 26, height: 30, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accentYellowSoft, flexGrow: 0, flexShrink: 0 },
  qtyBtnText: { fontSize: 15, fontWeight: '800', color: colors.textPrimary },
  qtyInput: { fontSize: 13, fontWeight: '800', color: colors.textPrimary, backgroundColor: colors.surface, paddingHorizontal: 4, paddingVertical: 0, width: 42, flexGrow: 0, flexShrink: 0, textAlign: 'center', height: 30, textAlignVertical: 'center', includeFontPadding: false },
});

export default MaterialCard;