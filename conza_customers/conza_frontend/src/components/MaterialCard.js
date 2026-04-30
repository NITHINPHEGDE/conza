import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

const MaterialCard = ({ item, onPress }) => (
  <TouchableOpacity
    style={styles.card}
    onPress={() => onPress && onPress(item)}
    activeOpacity={0.82}
  >
    {/* Full-width image top half */}
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

    {/* Details bottom half */}
    <View style={styles.details}>
      <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
      <Text style={styles.seller} numberOfLines={1}>by {item.seller}</Text>
      <View style={styles.priceRow}>
        <Text style={styles.price}>₹{item.price}</Text>
        <Text style={styles.unit}> / {item.unit}</Text>
        <View style={styles.addBtn}>
          <Text style={styles.addBtnText}>+</Text>
        </View>
      </View>
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    width: 170,
    marginRight: 14,
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
  image: {
    width: '100%',
    height: '100%',
  },
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  stockDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  stockText: {
    fontSize: 10,
    fontWeight: '700',
  },
  ratingBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255,255,255,0.93)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  ratingText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  details: {
    padding: 11,
  },
  name: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
    letterSpacing: 0.1,
  },
  seller: {
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: 9,
    fontWeight: '500',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  price: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  unit: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '500',
    flex: 1,
  },
  addBtn: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: colors.accentYellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
    lineHeight: 22,
  },
});

export default MaterialCard;