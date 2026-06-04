import React, { useState, useMemo, useCallback } from 'react';
import { reverseGeocodeFullAddress } from '../hooks/useAuth';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Location from 'expo-location';
import { colors } from '../theme/colors';
import { useBooking } from '../hooks/useBooking';

const PLATFORM_FEE_RATE = 0.05;

const PAYMENT_METHODS = [
  {
    id: 'cod',
    label: 'Cash on Delivery',
    sub: 'Pay after work completion',
    icon: '💵',
  },
  {
    id: 'upi',
    label: 'UPI / Digital Wallet',
    sub: 'PhonePe, Google Pay, Paytm',
    icon: '📲',
  },
  {
    id: 'card',
    label: 'Credit / Debit Card',
    sub: 'All major cards accepted',
    icon: '💳',
  },
];

// ─── Selected Worker Row ──────────────────────────────────────────────────────
const WorkerRow = React.memo(({ worker }) => (
  <View style={styles.workerRow}>
    <LinearGradient
      colors={['#D0CDFF', '#A89CFF']}
      style={styles.workerAvatar}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <Text style={styles.workerAvatarText}>{worker.initials}</Text>
    </LinearGradient>
    <View style={styles.workerInfo}>
      <Text style={styles.workerName}>{worker.name}</Text>
      <View style={styles.workerMeta}>
        <Text style={styles.workerMetaText}>⭐ {worker.rating}</Text>
        <View style={styles.workerMetaDot} />
        <Text style={styles.workerMetaText}>📍 {worker.distance}</Text>
      </View>
    </View>
    <Text style={styles.workerPrice}>₹{Number(worker.pricePerDay) || 0}</Text>
  </View>
));

// ─── Payment Method Option ────────────────────────────────────────────────────
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

// ─── Main Screen ──────────────────────────────────────────────────────────────
const LabourCheckoutScreen = ({ route, navigation }) => {
  const { selectedWorkers = [], category = '' } = route.params || {};

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
  const [bookingType, setBookingType] = useState('immediate'); // 'immediate' or 'scheduled'
  const [scheduledDate, setScheduledDate] = useState(new Date());
  const [scheduledTime, setScheduledTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const { submitBooking, loading: submitting, error: submitError } = useBooking('labour');

  const { subtotal, platformFee, total } = useMemo(() => {
    const sub = selectedWorkers.reduce((sum, w) => sum + (Number(w.pricePerDay) || 0), 0);
    const fee = Math.round(sub * PLATFORM_FEE_RATE);
    const tot = sub + fee;
    return { subtotal: sub, platformFee: fee, total: tot };
  }, [selectedWorkers]);

  const handleSelectPayment = useCallback((id) => setPayment(id), []);
  const handleGoBack = useCallback(() => navigation.goBack(), [navigation]);

  const handleAutoFetch = async () => {
  try {
    setFetching(true);
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Location permission is required to autofill address.');
      return;
    }

    const pos = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    // Use Mappls for accurate Indian address breakdown
    const place = await reverseGeocodeFullAddress(
      pos.coords.latitude,
      pos.coords.longitude,
    );

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
  } catch {
    Alert.alert('Error', 'Could not fetch location. Please enter manually.');
  } finally {
    setFetching(false);
  }
};

  const combinedScheduledDate = useMemo(() => {
    const d = new Date(scheduledDate);
    d.setHours(scheduledTime.getHours());
    d.setMinutes(scheduledTime.getMinutes());
    return d;
  }, [scheduledDate, scheduledTime]);

  const handleConfirmBooking = useCallback(async () => {
    const ok = await submitBooking({
      selectedWorkers,
      category,
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
      isImmediate: bookingType === 'immediate',
      scheduledDate: bookingType === 'scheduled' ? combinedScheduledDate : null,
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
  }, [submitBooking, selectedWorkers, category, houseNumber, houseName, street, area, city, district, state, pincode, paymentMethod, description, bookingType, combinedScheduledDate, lat, lng, navigation]);

  const handleDateChange = (event, date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (date) {
      setScheduledDate(date);
      if (Platform.OS === 'android') setShowDatePicker(false);
    }
  };

  const handleTimeChange = (event, time) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (time) {
      setScheduledTime(time);
      if (Platform.OS === 'android') setShowTimePicker(false);
    }
  };

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
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={{ width: 38 }} />
      </View>

      <View style={styles.divider} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Selected Workers */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Selected Workers</Text>
          {selectedWorkers.map((worker) => (
            <WorkerRow key={worker._id} worker={worker} />
          ))}
        </View>

        {/* Work Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📍  Work Location</Text>
          {showDatePicker && (
            <DateTimePicker
              value={scheduledDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'calendar'}
              onChange={handleDateChange}
              minimumDate={new Date()}
            />
          )}
          {showTimePicker && (
            <DateTimePicker
              value={scheduledTime}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'clock'}
              onChange={handleTimeChange}
            />
          )}

          <TouchableOpacity 
            style={styles.autoFetchBtn} 
            onPress={handleAutoFetch} 
            disabled={fetching}
            activeOpacity={0.8}
          >
            {fetching ? (
              <ActivityIndicator size="small" color={colors.accentGreen} />
            ) : (
              <>
                <MaterialIcons name="my-location" size={20} color={colors.accentGreen} />
                <Text style={styles.autoFetchText}>Autofetch My Location</Text>
              </>
            )}
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
                placeholder="Ex: Prestige Shantiniketan"
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
                placeholder="Ex: Whitefield"
                placeholderTextColor={colors.textMuted}
                value={area}
                onChangeText={setArea}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>City</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Bengaluru"
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

          <View style={{ width: '50%', marginBottom: 20 }}>
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

          <View style={styles.sectionDivider} />

          <Text style={styles.inputLabel}>Booking Schedule</Text>
          <View style={styles.bookingTypeRow}>
            <TouchableOpacity 
              style={[styles.typeBtn, bookingType === 'immediate' && styles.typeBtnActive]}
              onPress={() => setBookingType('immediate')}
            >
              <Text style={[styles.typeBtnText, bookingType === 'immediate' && styles.typeBtnTextActive]}>⚡ Immediate</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.typeBtn, bookingType === 'scheduled' && styles.typeBtnActive]}
              onPress={() => setBookingType('scheduled')}
            >
              <Text style={[styles.typeBtnText, bookingType === 'scheduled' && styles.typeBtnTextActive]}>📅 Schedule</Text>
            </TouchableOpacity>
          </View>

          {bookingType === 'scheduled' && (
            <View style={styles.scheduleRow}>
              <TouchableOpacity style={styles.dateTimeBtn} onPress={() => setShowDatePicker(true)}>
                <Text style={styles.dateTimeLabel}>Date</Text>
                <Text style={styles.dateTimeValue}>{scheduledDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.dateTimeBtn} onPress={() => setShowTimePicker(true)}>
                <Text style={styles.dateTimeLabel}>Time</Text>
                <Text style={styles.dateTimeValue}>{scheduledTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</Text>
              </TouchableOpacity>
            </View>
          )}

          <Text style={styles.inputLabel}>Job Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Tell the worker what needs to be done..."
            placeholderTextColor={colors.textMuted}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Payment Method */}
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

        {/* Bill Summary */}
        <View style={styles.billSection}>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>
              Subtotal ({selectedWorkers.length} worker{selectedWorkers.length > 1 ? 's' : ''})
            </Text>
            <Text style={styles.billValue}>₹{subtotal.toLocaleString()}</Text>
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Platform Fee</Text>
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
            onPress={handleConfirmBooking}
          >
            {submitting ? (
              <ActivityIndicator color={colors.textPrimary} />
            ) : (
              <Text style={styles.confirmText}>Confirm Booking</Text>
            )}
          </TouchableOpacity>
        </LinearGradient>
        {submitError && (
          <Text style={styles.submitError}>{submitError}</Text>
        )}
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

  // Section card
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
    letterSpacing: 0.1,
  },

  // Worker row
  workerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 6,
  },
  workerAvatar: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  workerAvatarText: { fontSize: 14, fontWeight: '800', color: colors.white },
  workerInfo: { flex: 1 },
  workerName: { fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginBottom: 4 },
  workerMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  workerMetaText: { fontSize: 12, color: colors.textMuted, fontWeight: '500' },
  workerMetaDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: colors.textMuted },
  workerPrice: { fontSize: 15, fontWeight: '800', color: colors.accentAmber },

  autoFetchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentGreenSoft,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: colors.accentGreen,
    gap: 10,
  },
  autoFetchText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.accentGreen,
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
  paymentRadioSelected: {
    borderColor: colors.accentAmber,
  },
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
  submitError: {
    fontSize: 13,
    color: colors.danger,
    textAlign: 'center',
    marginTop: 10,
    fontWeight: '500',
  },
  sectionDivider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: 20,
  },
  bookingTypeRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  typeBtnActive: {
    borderColor: colors.accentAmber,
    backgroundColor: colors.accentYellowSoft,
  },
  typeBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textMuted,
  },
  typeBtnTextActive: {
    color: colors.textPrimary,
  },
  scheduleRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  dateTimeBtn: {
    flex: 1,
    backgroundColor: colors.inputBg,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dateTimeLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  dateTimeValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.accentAmber,
  },
  textArea: {
    height: 100,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  webPickerContainer: {
    backgroundColor: colors.surfaceElevated,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  closeWebPicker: {
    marginTop: 10,
    alignItems: 'center',
    padding: 8,
  },
});

export default LabourCheckoutScreen;