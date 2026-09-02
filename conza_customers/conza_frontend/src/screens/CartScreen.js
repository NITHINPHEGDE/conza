import React, { useCallback, useMemo, useState, useEffect } from 'react';
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

  const hasMaterials = materialItems.length > 0;
  const hasRentals   = rentalCart.length > 0;
  const showTabs      = hasMaterials && hasRentals;

  // Which section is on screen. Only relevant (and only rendered as a
  // switchable tab bar) when BOTH materials and rentals have items —
  // if only one of them has items, that one is shown with no tab bar.
  const [activeTab, setActiveTab] = useState(hasMaterials ? 'materials' : 'rentals');

  // Keep the active tab valid as cart contents change — e.g. the last
  // rental item gets removed while the Rentals tab is open.
  useEffect(() => {
    if (activeTab === 'materials' && !hasMaterials && hasRentals) setActiveTab('rentals');
    if (activeTab === 'rentals' && !hasRentals && hasMaterials) setActiveTab('materials');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMaterials, hasRentals]);

  const activeSection = showTabs ? activeTab : hasMaterials ? 'materials' : 'rentals';

  const handleMaterialCheckout = useCallback(() => {
    navigation.navigate('Booking', {
      screen: 'MaterialCheckout',
      params: { cartItems: getCartItems(), cart },
    });
  }, [navigation, cart, getCartItems]);

  const handleRentalCheckout = useCallback(() => {
    if (rentalCart.length === 0) return;
    // Navigate to RentalCheckout with the first item;
    // the customer books each rental individually from there.
    navigation.navigate('Booking', {
      screen: 'RentalCheckout',
      params: { item: rentalCart[0], quantity: 1 },
    });
  }, [navigation, rentalCart]);

  const handleCheckoutPress = useCallback(() => {
    if (activeSection === 'materials') handleMaterialCheckout();
    else handleRentalCheckout();
  }, [activeSection, handleMaterialCheckout, handleRentalCheckout]);

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
      <TouchableOpacity
        style={styles.removeBtn}
        onPress={() => removeFromRentalCart(item.id)}
        activeOpacity={0.8}
      >
        <Text style={styles.removeBtnText}>✕</Text>
      </TouchableOpacity>
    </View>
  ), [removeFromRentalCart]);

  const isEmpty = !hasMaterials && !hasRentals;

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
          {showTabs && (
            <View style={styles.tabBar}>
              <TouchableOpacity
                style={[styles.tabBtn, activeTab === 'materials' && styles.tabBtnActive]}
                onPress={() => setActiveTab('materials')}
                activeOpacity={0.8}
              >
                <Text style={[styles.tabBtnText, activeTab === 'materials' && styles.tabBtnTextActive]}>
                  🧱 Materials ({materialItems.length})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tabBtn, activeTab === 'rentals' && styles.tabBtnActive]}
                onPress={() => setActiveTab('rentals')}
                activeOpacity={0.8}
              >
                <Text style={[styles.tabBtnText, activeTab === 'rentals' && styles.tabBtnTextActive]}>
                  🏗️ Rentals ({rentalCart.length})
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {activeSection === 'materials' ? (
            <FlatList
              data={materialItems}
              keyExtractor={(item) => item.id}
              renderItem={renderMaterialItem}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <FlatList
              data={rentalCart}
              keyExtractor={(item) => item.id}
              renderItem={renderRentalItem}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          )}

          {/* Proceed to Checkout — static at the bottom of the cart page,
              always acting on whichever section is currently active. */}
          <View style={styles.checkoutBar}>
            <Text style={styles.checkoutBarTotal}>
              {activeSection === 'materials'
                ? `Subtotal: ₹${materialTotal.toLocaleString('en-IN')}`
                : `Est. ₹${rentalTotal.toLocaleString('en-IN')}/day`}
            </Text>
            <LinearGradient
              colors={[colors.gradientStart, colors.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.checkoutBtn}
            >
              <TouchableOpacity
                style={styles.checkoutBtnTouch}
                onPress={handleCheckoutPress}
                activeOpacity={0.85}
              >
                <Text style={styles.checkoutBtnText}>Proceed to Checkout →</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
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
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 2,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 14,
    padding: 4,
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 11,
    alignItems: 'center',
  },
  tabBtnActive: {
    backgroundColor: colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  tabBtnText: { fontSize: 13, fontWeight: '700', color: colors.textMuted },
  tabBtnTextActive: { color: colors.textPrimary },
  listContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 110 },
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
  checkoutBar: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: 20,
    paddingVertical: 14,
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  checkoutBarTotal: { fontSize: 15, fontWeight: '800', color: colors.textPrimary },
  checkoutBtn: { borderRadius: 14, overflow: 'hidden' },
  checkoutBtnTouch: { paddingHorizontal: 22, paddingVertical: 13, alignItems: 'center' },
  checkoutBtnText: { fontSize: 14, fontWeight: '800', color: '#111', letterSpacing: 0.3 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyEmoji: { fontSize: 52, marginBottom: 14 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: colors.textPrimary, marginBottom: 6 },
  emptySub: { fontSize: 14, color: colors.textMuted, textAlign: 'center', paddingHorizontal: 40 },
});

export default CartScreen;
