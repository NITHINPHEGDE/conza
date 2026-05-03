import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  TextInput,
} from 'react-native';
import { colors } from '../theme/colors';

const MaterialCard = ({ item, quantity, onAdd, onRemove, onImagePress }) => {
  const [inputValue, setInputValue] = useState(String(quantity));

  useEffect(() => {
    setInputValue(String(quantity));
  }, [quantity]);

  return (
    <View style={styles.card}>
      <TouchableOpacity style={styles.imageWrapper} onPress={onImagePress} activeOpacity={0.9}>
        <Image source={{ uri: item.image }} style={styles.image} />
        <View style={styles.stockBadge}>
          <View style={[styles.stockDot, { backgroundColor: item.inStock ? colors.success : colors.danger }]} />
          <Text style={[styles.stockText, { color: item.inStock ? colors.success : colors.danger }]}>
            {item.inStock ? 'In Stock' : 'Out'}
          </Text>
        </View>
        <View style={styles.ratingBadge}>
          <Text style={styles.ratingText}>⭐ {item.rating}</Text>
        </View>
      </TouchableOpacity>

      <View style={styles.details}>
        <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.seller} numberOfLines={1}>by {item.seller}</Text>

        <View style={styles.priceRow}>
          <Text style={styles.price}>₹{item.price}</Text>
          <Text style={styles.unit}>{item.unit}</Text>

          {quantity > 0 ? (
            <View style={styles.qtyWrapper}>
              <View style={styles.qtyControl}>
                <TouchableOpacity style={styles.qtyBtnMinus} onPress={() => onRemove(item)}>
                  <Text style={styles.qtyBtnText}>−</Text>
                </TouchableOpacity>
                <TextInput
                  style={styles.qtyInput}
                  value={inputValue}
                  onChangeText={(t) => {
                    if (t === '') { setInputValue(''); onAdd(item, 0); return; }
                    if (/^\d+$/.test(t)) {
                      setInputValue(t);
                      const num = parseInt(t);
                      if (!isNaN(num) && num > 0) onAdd(item, num);
                    }
                  }}
                  onBlur={() => {
                    const num = parseInt(inputValue);
                    if (isNaN(num) || num <= 0 || inputValue === '') { onAdd(item, 0); setInputValue('0'); }
                    else { onAdd(item, num); setInputValue(String(num)); }
                  }}
                  onSubmitEditing={() => {
                    const num = parseInt(inputValue);
                    if (isNaN(num) || num <= 0 || inputValue === '') { onAdd(item, 0); setInputValue('0'); }
                    else { onAdd(item, num); setInputValue(String(num)); }
                  }}
                  keyboardType="numeric"
                  maxLength={5}
                  selectTextOnFocus
                />
                <TouchableOpacity style={styles.qtyBtnPlus} onPress={() => onAdd(item)}>
                  <Text style={styles.qtyBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.addBtn, !item.inStock && styles.addBtnDisabled]}
              onPress={() => item.inStock && onAdd(item)}
            >
              <Text style={styles.addBtnText}>+</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

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
  name: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  seller: { fontSize: 11, color: colors.textMuted, marginBottom: 9 },
  priceRow: { flexDirection: 'column', alignItems: 'flex-start', marginTop: 6, gap: 6 },
  price: { fontSize: 15, fontWeight: '800' },
  unit: { fontSize: 10, color: colors.textMuted },
  addBtn: { width: 28, height: 28, borderRadius: 9, backgroundColor: colors.accentYellow, alignItems: 'center', justifyContent: 'center' },
  addBtnDisabled: { backgroundColor: colors.surfaceElevated },
  addBtnText: { fontSize: 18, fontWeight: '700' },
  qtyWrapper: { alignItems: 'flex-end' },
  qtyControl: { flexDirection: 'row', alignItems: 'center', borderRadius: 9, borderWidth: 1, borderColor: colors.border },
  qtyBtnMinus: { width: 24, height: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accentYellow, borderTopLeftRadius: 7, borderBottomLeftRadius: 7 },
  qtyBtnPlus: { width: 24, height: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accentYellow, borderTopRightRadius: 7, borderBottomRightRadius: 7 },
  qtyBtnText: { fontSize: 14, fontWeight: '800' },
  qtyInput: { fontSize: 13, fontWeight: '800', color: '#111111', backgroundColor: '#FFFFFF', paddingHorizontal: 4, paddingVertical: 0, minWidth: 58, textAlign: 'center', height: 28, textAlignVertical: 'center', includeFontPadding: false },
});

export default MaterialCard;