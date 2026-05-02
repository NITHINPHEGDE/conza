import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

const MaterialCard = ({ item, quantity, onAdd, onRemove }) => (
  <TouchableOpacity style={styles.card} activeOpacity={0.8}>
    <View style={styles.imageWrapper}>
      <Image source={{ uri: item.image }} style={styles.image} resizeMode="cover" />
      <View style={styles.stockBadge}>
        <View style={[styles.stockDot, { backgroundColor: item.inStock ? colors.success : colors.danger }]} />
        <Text style={[styles.stockText, { color: item.inStock ? colors.success : colors.danger }]}>
          {item.inStock ? 'In Stock' : 'Out'}
        </Text>
      </View>
      <View style={styles.ratingBadge}>
        <Text style={styles.ratingText}>⭐ {item.rating}</Text>
      </View>
    </View>

    <View style={styles.details}>
      <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
      <Text style={styles.seller} numberOfLines={1}>by {item.seller}</Text>
      <View style={styles.priceRow}>
        <View>
          <Text style={styles.price}>₹{item.price}</Text>
          <Text style={styles.unit}>{item.unit}</Text>
        </View>

        {/* Quantity control */}
        {quantity > 0 ? (
          <View style={styles.qtyControl}>
            <TouchableOpacity style={styles.qtyBtn} onPress={() => onRemove(item)} activeOpacity={0.75}>
              <Text style={styles.qtyBtnText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.qtyValue}>{quantity}</Text>
            <TouchableOpacity style={styles.qtyBtn} onPress={() => onAdd(item)} activeOpacity={0.75}>
              <Text style={styles.qtyBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.addBtn, !item.inStock && styles.addBtnDisabled]}
            onPress={() => item.inStock && onAdd(item)}
            activeOpacity={0.75}
          >
            <Text style={styles.addBtnText}>+</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  </TouchableOpacity>
);

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
    height: 120,
    position: 'relative',
    backgroundColor: colors.surfaceElevated,
  },
  image: { width: '100%', height: '100%' },
  stockBadge: {
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
  stockDot: { width: 5, height: 5, borderRadius: 3 },
  stockText: { fontSize: 10, fontWeight: '700' },
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
  seller: { fontSize: 11, color: colors.textMuted, marginBottom: 9, fontWeight: '500' },
  priceRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  price: { fontSize: 15, fontWeight: '800', color: colors.textPrimary },
  unit: { fontSize: 10, color: colors.textMuted, fontWeight: '500', marginTop: 1 },

  // Add button (when qty is 0)
  addBtn: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: colors.accentYellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnDisabled: {
    backgroundColor: colors.surfaceElevated,
  },
  addBtnText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    lineHeight: 22,
  },

  // Quantity control (when qty > 0)
  qtyControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  qtyBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentYellow,
  },
  qtyBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    lineHeight: 20,
  },
  qtyValue: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary,
    paddingHorizontal: 10,
    minWidth: 32,
    textAlign: 'center',
  },
});

export default MaterialCard;