import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  StatusBar,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

const PLATFORM_FEE_RATE = 0.05;
const DELIVERY_FEE = 99;

const PAYMENT_METHODS = [
  { id: 'cod',  label: 'Cash on Delivery',    sub: 'Pay on delivery',              icon: '💵' },
  { id: 'upi',  label: 'UPI / Digital Wallet', sub: 'PhonePe, Google Pay, Paytm',  icon: '📲' },
  { id: 'card', label: 'Credit / Debit Card',  sub: 'All major cards accepted',     icon: '💳' },
];

// ─── Material Item Row ────────────────────────────────────────────────────────
const MaterialItemRow = ({ item, quantity }) => (
  <View style={styles.itemRow}>
    <Image source={{ uri: item.image }} style={styles.itemImage} resizeMode="cover" />
    <View style={styles.itemInfo}>
      <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
      <Text style={styles.itemSeller}>by {item.seller}</Text>
      <Text style={styles.itemUnit}>{item.unit}</Text>
    </View>
    <View style={styles.itemRight}>
      <Text style={styles.itemQty}>×{quantity}</Text>
      <Text style={styles.itemPrice}>₹{item.price * quantity}</Text>
    </View>
  </View>
);

// ─── Payment Option ───────────────────────────────────────────────────────────
const PaymentOption = ({ method, selected, onSelect }) => (
  <TouchableOpacity
    style={[styles.paymentOption, selected && styles.paymentOptionSelected]}
    onPress={() => onSelect(method.id)}
    activeOpacity={0.75}
  >
    <View style={[styles.paymentRadio, selected && styles.paymentRadioSelected]}>
      {selected && <View style={styles.paymentRadioDot} />}
    </View>
    <View style={styles.paymentIconBox}>
      <Text style={{ fontSize: 18 }}>{method.icon}</Text>
    </View>
    <View style={{ flex: 1 }}>
      <Text style={styles.paymentLabel}>{method.label}</Text>
      <Text style={styles.paymentSub}>{method.sub}</Text>
    </View>
  </TouchableOpacity>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────
const MaterialCheckoutScreen = ({ route, navigation }) => {
  const { cartItems = [], cart = {} } = route.params || {};

  const [address, setAddress]       = useState('');
  const [city, setCity]             = useState('');
  const [pincode, setPincode]       = useState('');
  const [paymentMethod, setPayment] = useState('cod');

  const subtotal    = cartItems.reduce((sum, item) => sum + item.price * cart[item.id], 0);
  const platformFee = Math.round(subtotal * PLATFORM_FEE_RATE);
  const total       = subtotal + platformFee + DELIVERY_FEE;
  const totalItems  = cartItems.reduce((sum, item) => sum + cart[item.id], 0);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Material Checkout</Text>
        <View style={{ width: 38 }} />
      </View>

      <View style={styles.divider} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Order Summary
            <Text style={styles.sectionCount}> ({totalItems} items)</Text>
          </Text>
          {cartItems.map((item) => (
            <MaterialItemRow
              key={item.id}
              item={item}
              quantity={cart[item.id]}
            />
          ))}
        </View>

        {/* Delivery Address */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🚚  Delivery Address</Text>

          {/* Auto fetch button */}
          <TouchableOpacity style={styles.fetchLocationBtn} activeOpacity={0.8}>
            <MaterialIcons name="my-location" size={22} color={colors.accentAmber} />
            <View style={{ flex: 1 }}>
              <Text style={styles.fetchLocationText}>Auto Fetch My Location</Text>
              <Text style={styles.fetchLocationSub}>Uses your current GPS location</Text>
            </View>
            <Text style={styles.fetchLocationArrow}>→</Text>
          </TouchableOpacity>

          <Text style={styles.inputLabel}>Street Address</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter delivery address"
            placeholderTextColor={colors.textMuted}
            value={address}
            onChangeText={setAddress}
          />

          <View style={styles.inputRow}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={styles.inputLabel}>City</Text>
              <TextInput
                style={styles.input}
                placeholder="City"
                placeholderTextColor={colors.textMuted}
                value={city}
                onChangeText={setCity}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>Pincode</Text>
              <TextInput
                style={styles.input}
                placeholder="000000"
                placeholderTextColor={colors.textMuted}
                value={pincode}
                onChangeText={setPincode}
                keyboardType="numeric"
                maxLength={6}
              />
            </View>
          </View>
        </View>

        {/* Payment Method */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          {PAYMENT_METHODS.map((method) => (
            <PaymentOption
              key={method.id}
              method={method}
              selected={paymentMethod === method.id}
              onSelect={setPayment}
            />
          ))}
        </View>

        {/* Bill Summary */}
        <View style={styles.billSection}>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Subtotal ({totalItems} items)</Text>
            <Text style={styles.billValue}>₹{subtotal.toLocaleString()}</Text>
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Delivery Fee</Text>
            <Text style={styles.billValue}>₹{DELIVERY_FEE}</Text>
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Platform Fee (5%)</Text>
            <Text style={styles.billValue}>₹{platformFee}</Text>
          </View>
          <View style={styles.billDivider} />
          <View style={styles.billRow}>
            <Text style={styles.billTotalLabel}>Total Amount</Text>
            <Text style={styles.billTotalValue}>₹{total.toLocaleString()}</Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Confirm Button */}
      <View style={styles.confirmWrapper}>
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.confirmBtn}
        >
          <TouchableOpacity
            style={styles.confirmTouch}
            activeOpacity={0.85}
            onPress={() => {
              // TODO: submit order
            }}
          >
            <Text style={styles.confirmText}>Place Order →</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 14,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  backArrow: { fontSize: 18, color: colors.textPrimary, fontWeight: '600' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: colors.textPrimary },
  divider: { height: 1, backgroundColor: colors.borderLight },
  scroll: { paddingTop: 20, paddingHorizontal: 20 },

  // Section
  section: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  sectionCount: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMuted,
  },

  // Material item row
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  itemImage: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: colors.surfaceElevated,
    flexShrink: 0,
  },
  itemInfo: { flex: 1 },
  itemName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 3,
    lineHeight: 18,
  },
  itemSeller: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '500',
    marginBottom: 2,
  },
  itemUnit: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '500',
  },
  itemRight: {
    alignItems: 'flex-end',
    flexShrink: 0,
  },
  itemQty: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },

  // Fetch location
  fetchLocationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accentYellowSoft,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: colors.accentYellow,
    gap: 12,
  },
  fetchLocationText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  fetchLocationSub: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  fetchLocationArrow: {
    fontSize: 16,
    color: colors.accentAmber,
    fontWeight: '700',
  },

  // Inputs
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 6,
    marginTop: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: colors.inputBg,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },

  // Payment
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginBottom: 10,
    gap: 12,
    backgroundColor: colors.background,
  },
  paymentOptionSelected: {
    borderColor: colors.accentYellow,
    backgroundColor: '#FFFDF0',
  },
  paymentRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  paymentRadioSelected: { borderColor: colors.accentAmber },
  paymentRadioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.accentAmber,
  },
  paymentIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  paymentLabel: { fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginBottom: 2 },
  paymentSub: { fontSize: 12, color: colors.textMuted, fontWeight: '500' },

  // Bill
  billSection: {
    backgroundColor: colors.accentYellowSoft,
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(245,200,66,0.25)',
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  billLabel: { fontSize: 13, color: colors.textSecondary, fontWeight: '500' },
  billValue: { fontSize: 13, color: colors.textPrimary, fontWeight: '700' },
  billDivider: {
    height: 1,
    backgroundColor: 'rgba(245,200,66,0.35)',
    marginVertical: 8,
  },
  billTotalLabel: { fontSize: 15, fontWeight: '800', color: colors.textPrimary },
  billTotalValue: { fontSize: 18, fontWeight: '800', color: colors.accentAmber },

  // Confirm
  confirmWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 28,
    paddingTop: 14,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 10,
  },
  confirmBtn: { borderRadius: 16, overflow: 'hidden' },
  confirmTouch: { paddingVertical: 17, alignItems: 'center' },
  confirmText: { fontSize: 16, fontWeight: '800', color: colors.textPrimary, letterSpacing: 0.3 },
});

export default MaterialCheckoutScreen;