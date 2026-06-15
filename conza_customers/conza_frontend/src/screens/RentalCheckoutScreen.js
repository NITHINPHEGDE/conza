import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  StatusBar,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { colors } from '../theme/colors';
import { useBooking } from '../hooks/useBooking';
import SavedAddressSheet from '../components/SavedAddressSheet';

const PLATFORM_FEE_RATE = 0.05;
const DELIVERY_FEE = 149;

const PAYMENT_METHODS = [
  { id: 'cod',  label: 'Cash on Delivery',    sub: 'Pay on delivery',             icon: '💵' },
  { id: 'upi',  label: 'UPI / Digital Wallet', sub: 'PhonePe, Google Pay, Paytm', icon: '📲' },
  { id: 'card', label: 'Credit / Debit Card',  sub: 'All major cards accepted',    icon: '💳' },
];

const PaymentOption = React.memo(({ method, selected, onSelect }) => {
  const handlePress = useCallback(() => {
    onSelect(method.id);
  }, [onSelect, method.id]);

  return (
    <TouchableOpacity
      style={[styles.paymentOption, selected && styles.paymentOptionSelected]}
      onPress={handlePress}
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
});

const RentalCheckoutScreen = ({ route, navigation }) => {
  const {
    item,
    quantity      = 1,
    scheduledDate = null,
    scheduledTime = null,
  } = route.params || {};

  const [houseNumber, setHouseNumber] = useState('');
  const [houseName,   setHouseName]   = useState('');
  const [street,      setStreet]      = useState('');
  const [area,        setArea]        = useState('');
  const [city,        setCity]        = useState('');
  const [district,    setDistrict]    = useState('');
  const [state,       setState]       = useState('');
  const [pincode,     setPincode]     = useState('');
  const [paymentMethod, setPayment]   = useState('cod');

  const [lat,         setLat]         = useState(null);
  const [lng,         setLng]         = useState(null);
  const [fetching,    setFetching]    = useState(false);
  const [description, setDescription] = useState('');

  const [savedAddressSheetVisible, setSavedAddressSheetVisible] = useState(false);

  const currentAddressDisplay = useMemo(() => {
    return [houseNumber, houseName, street, area, city, state, pincode]
      .filter(Boolean)
      .join(', ') || null;
  }, [houseNumber, houseName, street, area, city, state, pincode]);

  const { submitBooking, loading: submitting, error: submitError } = useBooking('rental');

  const { subtotal, platformFee, total } = useMemo(() => {
    const qty = Number(quantity) || 0;
    const price = Number(item?.pricePerDay) || 0;
    const sub = price * qty;
    const fee = Math.round(sub * PLATFORM_FEE_RATE);
    const tot = sub + fee + DELIVERY_FEE;
    return { subtotal: sub, platformFee: fee, total: tot };
  }, [item, quantity]);

  const isScheduled = !!scheduledDate;

  const handleSelectPayment = useCallback((id) => setPayment(id), []);
  const handleGoBack = useCallback(() => navigation.goBack(), [navigation]);

  const handleAutoFetch = async () => {
    try {
      setFetching(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      const pos = await Location.getCurrentPositionAsync({});
      const { reverseGeocodeFullAddress } = require('../hooks/useAuth');
      const place = await reverseGeocodeFullAddress(pos.coords.latitude, pos.coords.longitude);

      if (place) {
        setHouseNumber(place.houseNumber);
        setHouseName(place.houseName);
        setStreet(place.street);
        setArea(place.area);
        setCity(place.city);
        setDistrict(place.district);
        setState(place.state);
        setPincode(place.pincode);
      }
      setLat(pos.coords.latitude);
      setLng(pos.coords.longitude);
    } catch (err) {
      console.log(err);
    } finally {
      setFetching(false);
    }
  };

  const handleSavedAddressSelect = useCallback((item) => {
    setHouseNumber(item.houseNo   || '');
    setHouseName(item.building    || '');
    setStreet(item.street         || '');
    setArea(item.area             || '');
    setCity(item.city             || '');
    setDistrict(item.district     || '');
    setState(item.state           || '');
    setPincode(item.pincode       || '');
    setLat(item.latitude          ?? null);
    setLng(item.longitude         ?? null);
  }, []);

  const handleConfirmRental = useCallback(async () => {
    const ok = await submitBooking({
      item,
      quantity,
      scheduledDate,
      scheduledTime,
      houseNumber,
      houseName,
      street,
      area,
      city,
      district,
      state,
      pincode,
      paymentMethod,
      description,
      latitude: lat,
      longitude: lng,
    });
    if (ok) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'BookingHome' }],
      });
      navigation.navigate('Status');
    }
  }, [submitBooking, item, quantity, scheduledDate, scheduledTime, houseNumber, houseName, street, area, city, district, state, pincode, paymentMethod, description, lat, lng, navigation]);


  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={handleGoBack}
          activeOpacity={0.7}
        >
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rental Checkout</Text>
        <View style={{ width: 38 }} />
      </View>

      <View style={styles.divider} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <View style={styles.itemRow}>
            <Image source={{ uri: item?.image }} style={styles.itemImage} resizeMode="cover" />
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item?.name}</Text>
              <Text style={styles.itemSeller}>by {item?.seller}</Text>
              <Text style={styles.itemQty}>Quantity: {Number(quantity) || 0}</Text>
              {isScheduled && (
                <View style={styles.scheduledTag}>
                  <Text style={styles.scheduledTagText}>
                    📅 {scheduledDate} · {scheduledTime}
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.itemPrice}>₹{(subtotal).toLocaleString()}</Text>
          </View>
        </View>

        {/* Delivery Address */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📍  Delivery Address</Text>

          {/* Auto Fetch */}
          <TouchableOpacity
            style={styles.fetchLocationBtn}
            onPress={handleAutoFetch}
            disabled={fetching}
            activeOpacity={0.8}
          >
            {fetching ? (
              <ActivityIndicator size="small" color={colors.accentAmber} />
            ) : (
              <>
                <MaterialIcons name="my-location" size={22} color={colors.accentAmber} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.fetchLocationText}>Auto Fetch My Location</Text>
                  <Text style={styles.fetchLocationSub}>Uses your current GPS location</Text>
                </View>
                <Text style={styles.fetchLocationArrow}>→</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Use Saved Address */}
          <TouchableOpacity
            style={styles.savedAddressBtn}
            activeOpacity={0.8}
            onPress={() => setSavedAddressSheetVisible(true)}
          >
            <MaterialIcons name="bookmark-border" size={18} color={colors.textSecondary} />
            <Text style={styles.savedAddressBtnText}>Use Saved Address</Text>
          </TouchableOpacity>

          <View style={styles.inputRow}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={styles.inputLabel}>House No.</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: 12"
                placeholderTextColor={colors.textMuted}
                value={houseNumber}
                onChangeText={setHouseNumber}
              />
            </View>
            <View style={{ flex: 2 }}>
              <Text style={styles.inputLabel}>Building/House Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Shantiniketan"
                placeholderTextColor={colors.textMuted}
                value={houseName}
                onChangeText={setHouseName}
              />
            </View>
          </View>

          <Text style={styles.inputLabel}>Street / Road</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: ITPL Main Road"
            placeholderTextColor={colors.textMuted}
            value={street}
            onChangeText={setStreet}
          />

          <View style={styles.inputRow}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={styles.inputLabel}>Area / Locality</Text>
              <TextInput
                style={styles.input}
                placeholder="Area"
                placeholderTextColor={colors.textMuted}
                value={area}
                onChangeText={setArea}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>City</Text>
              <TextInput
                style={styles.input}
                placeholder="City"
                placeholderTextColor={colors.textMuted}
                value={city}
                onChangeText={setCity}
              />
            </View>
          </View>

          <View style={styles.inputRow}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={styles.inputLabel}>District</Text>
              <TextInput
                style={styles.input}
                placeholder="District"
                placeholderTextColor={colors.textMuted}
                value={district}
                onChangeText={setDistrict}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>State</Text>
              <TextInput
                style={styles.input}
                placeholder="State"
                placeholderTextColor={colors.textMuted}
                value={state}
                onChangeText={setState}
              />
            </View>
          </View>

          <View style={{ width: '50%' }}>
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

          <View style={{ height: 20 }} />
          <Text style={styles.inputLabel}>Rental Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Any special instructions or details..."
            placeholderTextColor={colors.textMuted}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Payment */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          {PAYMENT_METHODS.map((method) => (
            <PaymentOption
              key={method.id}
              method={method}
              selected={paymentMethod === method.id}
              onSelect={handleSelectPayment}
            />
          ))}
        </View>

        {/* Bill */}
        <View style={styles.billSection}>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Rental ({quantity} unit{quantity > 1 ? 's' : ''} × ₹{item?.pricePerDay}/day)</Text>
            <Text style={styles.billValue}>₹{subtotal.toLocaleString()}</Text>
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Delivery Fee</Text>
            <Text style={styles.billValue}>₹{DELIVERY_FEE.toLocaleString()}</Text>
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Platform Fee (5%)</Text>
            <Text style={styles.billValue}>₹{platformFee.toLocaleString()}</Text>
          </View>
          <View style={styles.billDivider} />
          <View style={styles.billRow}>
            <Text style={styles.billTotalLabel}>Total Amount</Text>
            <Text style={styles.billTotalValue}>₹{total.toLocaleString()}</Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Confirm */}
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
            onPress={handleConfirmRental}
          >
            {submitting ? (
              <ActivityIndicator color={colors.textPrimary} />
            ) : (
              <Text style={styles.confirmText}>
                {isScheduled ? 'Confirm Appointment →' : 'Confirm Booking →'}
              </Text>
            )}
          </TouchableOpacity>
        </LinearGradient>
        {submitError && (
          <Text style={styles.submitError}>{submitError}</Text>
        )}
      </View>

      {/* Saved Address Sheet */}
      <SavedAddressSheet
        visible={savedAddressSheetVisible}
        onClose={() => setSavedAddressSheetVisible(false)}
        onSelect={handleSavedAddressSelect}
        currentLat={lat}
        currentLng={lng}
        currentAddress={currentAddressDisplay}
      />
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
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
  sectionTitle: { fontSize: 16, fontWeight: '800', color: colors.textPrimary, marginBottom: 16 },
  itemRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  itemImage: {
    width: 70,
    height: 70,
    borderRadius: 14,
    backgroundColor: colors.surfaceElevated,
    flexShrink: 0,
  },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginBottom: 3 },
  itemSeller: { fontSize: 11, color: colors.textMuted, fontWeight: '500', marginBottom: 3 },
  itemQty: { fontSize: 12, color: colors.textSecondary, fontWeight: '600', marginBottom: 6 },
  itemPrice: { fontSize: 15, fontWeight: '800', color: colors.textPrimary, flexShrink: 0 },
  scheduledTag: {
    backgroundColor: colors.accentYellowSoft,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(245,200,66,0.3)',
  },
  scheduledTagText: { fontSize: 11, fontWeight: '600', color: colors.accentAmber },
  fetchLocationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accentYellowSoft,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: colors.accentYellow,
    gap: 12,
  },
  fetchLocationText: { fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginBottom: 2 },
  fetchLocationSub: { fontSize: 11, color: colors.textSecondary, fontWeight: '500' },
  fetchLocationArrow: { fontSize: 16, color: colors.accentAmber, fontWeight: '700' },

  savedAddressBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
  },
  savedAddressBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.2,
  },

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
  inputRow: { flexDirection: 'row', alignItems: 'flex-end' },
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
  paymentOptionSelected: { borderColor: colors.accentYellow, backgroundColor: '#FFFDF0' },
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
  paymentRadioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.accentAmber },
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
  billDivider: { height: 1, backgroundColor: 'rgba(245,200,66,0.35)', marginVertical: 8 },
  billTotalLabel: { fontSize: 15, fontWeight: '800', color: colors.textPrimary },
  billTotalValue: { fontSize: 18, fontWeight: '800', color: colors.accentAmber },
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
  submitError: {
    fontSize: 13,
    color: colors.danger,
    textAlign: 'center',
    marginTop: 10,
    fontWeight: '500',
  },
  textArea: {
    height: 100,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
});

export default RentalCheckoutScreen;