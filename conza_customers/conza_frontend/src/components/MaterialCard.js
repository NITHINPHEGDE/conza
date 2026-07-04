import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  TextInput,
} from 'react-native';
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
  rating, 
  inStock, 
  quantity = 0, 
  onUpdate, 
  onImagePress,
  onAddToCart,
}) => {
  const [cartAdded, setCartAdded] = React.useState(false);
  const imageSource = useMemo(() => ({ uri: image }), [image]);
  
  const stockDotStyle = useMemo(() => [
    styles.stockDot, 
    { backgroundColor: inStock ? colors.success : colors.danger }
  ], [inStock]);

  const stockTextStyle = useMemo(() => [
    styles.stockText, 
    { color: inStock ? colors.success : colors.danger }
  ], [inStock]);
  
  const handleImagePress = useCallback(() => {
    onImagePress && onImagePress({ id, name, seller, price, unit, distance, image, rating, inStock, quantity });
  }, [onImagePress, id, name, seller, price, unit, distance, image, rating, inStock, quantity]);

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
    <View style={styles.card}>
      <TouchableOpacity style={styles.imageWrapper} onPress={handleImagePress} activeOpacity={0.9}>
        <Image source={imageSource} style={styles.image} />
        <View style={styles.stockBadge}>
          <View style={stockDotStyle} />
          <Text style={stockTextStyle}>
            {inStock ? 'In Stock' : 'Out'}
          </Text>
        </View>
        <View style={styles.ratingBadge}>
          <Text style={styles.ratingText}>⭐ {rating}</Text>
        </View>
      </TouchableOpacity>

      <View style={styles.details}>
        <Text style={styles.name} numberOfLines={1}>{name}</Text>
        <Text style={styles.seller} numberOfLines={1}>by {seller}</Text>
        
        <View style={styles.distanceRow}>
          <MaterialCommunityIcons name="map-marker" size={12} color={colors.textSecondary} />
          <Text style={styles.distanceText}>{distance}</Text>
        </View>

        <View style={styles.priceRow}>
          <Text style={styles.price}>
            ₹{((Number(price) || 0) * (Number(quantity) > 0 ? Number(quantity) : 1)).toLocaleString('en-IN')}
          </Text>
          <Text style={styles.unit}>
            {Number(quantity) > 0 ? `${quantity} ${unit.replace('per ', '')}` : unit}
          </Text>

          {(Number(quantity) || 0) > 0 ? (
            <View style={styles.qtyWrapper}>
              <View style={styles.qtyControl}>
                <TouchableOpacity
                  style={styles.qtyBtnMinus}
                  onPress={handleMinus}
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
                >
                  <Text style={styles.qtyBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.addBtn, !inStock && styles.addBtnDisabled]}
              onPress={handleAdd}
            >
              <Text style={styles.addBtnText}>+</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={[styles.addCartBtn, !inStock && styles.addCartBtnDisabled]}
          onPress={handleAddToCart}
          activeOpacity={0.8}
        >
          <Text style={styles.addCartBtnText}>
            {cartAdded ? '✓ Added to Cart' : '🛒 Add to Cart'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: { flex: 1, backgroundColor: colors.surface, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: colors.border, elevation: 4 },
  imageWrapper: { width: '100%', height: 120, position: 'relative', backgroundColor: colors.surfaceElevated },
  image: { width: '100%', height: '100%' },
  stockBadge: { position: 'absolute', top: 8, left: 8, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.93)', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 20 },
  stockDot: { width: 5, height: 5, borderRadius: 3 },
  stockText: { fontSize: 10, fontWeight: '700' },
  ratingBadge: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(255,255,255,0.93)', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 20 },
  ratingText: { fontSize: 10, fontWeight: '700', color: colors.textPrimary },
  details: { padding: 11 },
  name: { fontSize: 13, fontWeight: '700', color: colors.textPrimary, marginBottom: 2 },
  seller: { fontSize: 11, color: colors.textMuted, marginBottom: 4 },
  distanceRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 4 },
  distanceText: { fontSize: 11, color: colors.textSecondary, fontWeight: '600' },
  priceRow: { flexDirection: 'column', alignItems: 'flex-start', marginTop: 6, gap: 6 },
  price: { fontSize: 15, fontWeight: '800' },
  unit: { fontSize: 10, color: colors.textMuted },
  addBtn: { width: 28, height: 28, borderRadius: 9, backgroundColor: colors.accentYellow, alignItems: 'center', justifyContent: 'center' },
  addBtnDisabled: { backgroundColor: colors.surfaceElevated },
  addBtnText: { fontSize: 18, fontWeight: '700' },
  addCartBtn: {
    marginTop: 8,
    backgroundColor: colors.accentYellow,
    borderRadius: 10,
    paddingVertical: 7,
    alignItems: 'center',
  },
  addCartBtnDisabled: { backgroundColor: colors.surfaceElevated },
  addCartBtnText: { fontSize: 12, fontWeight: '800', color: '#111' },
  qtyWrapper: { alignItems: 'flex-end' },
  qtyControl: { flexDirection: 'row', alignItems: 'center', borderRadius: 9, borderWidth: 1, borderColor: colors.border },
  qtyBtnMinus: { width: 24, height: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accentYellow, borderTopLeftRadius: 7, borderBottomLeftRadius: 7 },
  qtyBtnPlus: { width: 24, height: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accentYellow, borderTopRightRadius: 7, borderBottomRightRadius: 7 },
  qtyBtnText: { fontSize: 14, fontWeight: '800' },
  qtyInput: { fontSize: 13, fontWeight: '800', color: '#111111', backgroundColor: '#FFFFFF', paddingHorizontal: 4, paddingVertical: 0, minWidth: 58, textAlign: 'center', height: 28, textAlignVertical: 'center', includeFontPadding: false },
});

export default MaterialCard;