import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import useAppStore from '../store/useAppStore';
import { colors } from '../theme/colors';

const CartScreen = () => {
  const navigation = useNavigation();

  // Material cart
  const cart          = useAppStore((s) => s.cart);
  const materials     = useAppStore((s) => s.materials);
  const addToCart     = useAppStore((s) => s.addToCart);
  const removeFromCart = useAppStore((s) => s.removeFromCart);
  const getCartItems  = useAppStore((s) => s.getCartItems);

  // Rental cart
  const rentalCart         = useAppStore((s) => s.rentalCart);
  const removeFromRentalCart = useAppStore((s) => s.removeFromRentalCart);

  const materialItems = useMemo(() => getCartItems(), [cart, materials]);

  const materialTotal = useMemo(() =>
    materialItems.reduce((sum, m) => sum + (Number(m.price) || 0) * (Number(cart[m.id]) || 0), 0),
    [materialItems, cart]
  );

  const rentalTotal = useMemo(() =>
    rentalCart.reduce((sum, r) => sum + (Number(r.pricePerDay) || 0), 0),
    [rentalCart]
  );

  const grandTotal = materialTotal + rentalTotal;

  const handleMaterialCheckout = useCallback(() => {
    navigation.navigate('Booking', {
      screen: 'MaterialCheckout',
      params: { cartItems: getCartItems(), cart },
    });
  }, [navigation, cart, getCartItems]);

  const handleRentalCheckout = useCallback((item) => {
    navigation.navigate('Booking', {
      screen: 'RentalCheckout',
      params: { item, quantity: 1 },
    });
  }, [navigation]);

  const renderMaterialItem = useCallback(({ item }) => (
    <View style={styles.cartItem}>
      <Image source={{ uri: item.image }} style={styles.itemImage} />
      <View style={styles.itemInfo}>
        <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.itemSub}>by {item.seller}</Text>
        <Text style={styles.itemPrice}>₹{((Number(item.price) || 0) * (Number(cart[item.id]) || 0)).toLocaleString('en-IN')}</Text>
      </View>
      <View style={styles.qtyControl}>
        <TouchableOpacity style={styles.qtyBtn} onPress={() => removeFromCart(item)}>
          <Text style={styles.qtyBtnText}>−</Text>
        </TouchableOpacity>
        <Text style={styles.qtyValue}>{cart[item.id]}</Text>
        <TouchableOpacity style={styles.qtyBtn} onPress={() => addToCart(item)}>
          <Text style={styles.qtyBtnText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  ), [cart, addToCart, removeFromCart]);

  const renderRentalItem = useCallback(({ item }) => (
    <View style={styles.cartItem}>
      <Image source={{ uri: item.image }} style={styles.itemImage} />
      <View style={styles.itemInfo}>
        <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.itemSub}>by {item.seller}</Text>
        <Text style={styles.itemPrice}>₹{item.pricePerDay}/day</Text>
      </View>
      <View style={styles.rentalActions}>
        <TouchableOpacity
          style={styles.checkoutSmallBtn}
          onPress={() => handleRentalCheckout(item)}
          activeOpacity={0.8}
        >
          <Text style={styles.checkoutSmallText}>Book</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.removeBtn}
          onPress={() => removeFromRentalCart(item.id)}
          activeOpacity={0.8}
        >
          <Text style={styles.removeBtnText}>✕</Text>
        </TouchableOpacity>
      </View>
    </View>
  ), [handleRentalCheckout, removeFromRentalCart]);

  const isEmpty = materialItems.length === 0 && rentalCart.length === 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🛒 My Cart</Text>
      </View>

      {isEmpty ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🛒</Text>
          <Text style={styles.emptyTitle}>Cart is Empty</Text>
          <Text style={styles.emptySub}>Add materials or rental equipment to get started</Text>
        </View>
      ) : (
        <>
          <FlatList
            data={[]}
            ListHeaderComponent={
              <View>
                {materialItems.length > 0 && (
                  <View>
                    <Text style={styles.sectionTitle}>🧱 Materials</Text>
                    {materialItems.map((item) => (
                      <View key={item.id}>{renderMaterialItem({ item })}</View>
                    ))}
                    <View style={styles.sectionSummary}>
                      <Text style={styles.sectionTotal}>Subtotal: ₹{materialTotal.toLocaleString('en-IN')}</Text>
                      <LinearGradient
                        colors={[colors.gradientStart, colors.gradientEnd]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.checkoutBtn}
                      >
                        <TouchableOpacity
                          style={styles.checkoutBtnTouch}
                          onPress={handleMaterialCheckout}
                          activeOpacity={0.85}
                        >
                          <Text style={styles.checkoutBtnText}>Proceed to Checkout →</Text>
                        </TouchableOpacity>
                      </LinearGradient>
                    </View>
                  </View>
                )}

                {rentalCart.length > 0 && (
                  <View style={{ marginTop: 16 }}>
                    <Text style={styles.sectionTitle}>🏗️ Rentals</Text>
                    {rentalCart.map((item) => (
                      <View key={item.id}>{renderRentalItem({ item })}</View>
                    ))}
                    <View style={styles.sectionSummary}>
                      <Text style={styles.sectionTotal}>Est. ₹{rentalTotal.toLocaleString('en-IN')}/day</Text>
                    </View>
                  </View>
                )}
              </View>
            }
            renderItem={null}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: colors.textPrimary },
  listContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: colors.textPrimary, marginBottom: 12 },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  itemImage: { width: 60, height: 60, borderRadius: 10, backgroundColor: colors.surfaceElevated },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  itemSub: { fontSize: 11, color: colors.textMuted, marginVertical: 2 },
  itemPrice: { fontSize: 14, fontWeight: '800', color: colors.textPrimary },
  qtyControl: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 9,
    borderWidth: 1,
    borderColor: colors.border,
  },
  qtyBtn: {
    width: 26,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentYellow,
    borderRadius: 8,
  },
  qtyBtnText: { fontSize: 16, fontWeight: '800' },
  qtyValue: { minWidth: 28, textAlign: 'center', fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  rentalActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  checkoutSmallBtn: {
    backgroundColor: colors.accentYellow,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  checkoutSmallText: { fontSize: 12, fontWeight: '800', color: '#111' },
  removeBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtnText: { fontSize: 13, fontWeight: '700', color: colors.textMuted },
  sectionSummary: { marginTop: 8, gap: 10 },
  sectionTotal: { fontSize: 15, fontWeight: '800', color: colors.textPrimary },
  checkoutBtn: { borderRadius: 14, overflow: 'hidden' },
  checkoutBtnTouch: { paddingVertical: 14, alignItems: 'center' },
  checkoutBtnText: { fontSize: 14, fontWeight: '800', color: '#111', letterSpacing: 0.3 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyEmoji: { fontSize: 52, marginBottom: 14 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: colors.textPrimary, marginBottom: 6 },
  emptySub: { fontSize: 14, color: colors.textMuted, textAlign: 'center', paddingHorizontal: 40 },
});

export default CartScreen;
