import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';
import DateTimePicker from '@react-native-community/datetimepicker';


// ─── Quantity Selector ────────────────────────────────────────────────────────
const QuantitySelector = React.memo(({ quantity, onChange }) => {
  const handleMinus = useCallback(() => onChange(Math.max(1, quantity - 1)), [onChange, quantity]);
  const handlePlus = useCallback(() => onChange(quantity + 1), [onChange, quantity]);
  const handleChangeText = useCallback((t) => {
    const n = parseInt(t);
    if (!isNaN(n) && n > 0) onChange(n);
  }, [onChange]);

  return (
    <View style={styles.qtyRow}>
      <Text style={styles.qtyLabel}>Quantity</Text>
      <View style={styles.qtyControl}>
        <TouchableOpacity
          style={styles.qtyBtn}
          onPress={handleMinus}
          activeOpacity={0.75}
        >
          <Text style={styles.qtyBtnText}>−</Text>
        </TouchableOpacity>
        <TextInput
          style={styles.qtyInput}
          value={String(quantity)}
          onChangeText={handleChangeText}
          keyboardType="numeric"
          maxLength={3}
          selectTextOnFocus
        />
        <TouchableOpacity
          style={styles.qtyBtn}
          onPress={handlePlus}
          activeOpacity={0.75}
        >
          <Text style={styles.qtyBtnText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
});

// ─── Book Now Modal ───────────────────────────────────────────────────────────
const BookNowModal = React.memo(({ visible, item, onClose, onProceed }) => {
  const [quantity, setQuantity] = useState(1);

  const handleProceedLocal = useCallback(() => {
    onProceed({ quantity, scheduledDate: null, scheduledTime: null });
  }, [onProceed, quantity]);

  const totalPrice = useMemo(() => (item?.pricePerDay || 0) * quantity, [item?.pricePerDay, quantity]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity style={styles.modalSheet} activeOpacity={1}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>Book Now</Text>
          <Text style={styles.modalSub}>{item?.name}</Text>

          <QuantitySelector quantity={quantity} onChange={setQuantity} />

          <View style={styles.modalPriceSummary}>
            <Text style={styles.modalPriceLabel}>Total per day</Text>
            <Text style={styles.modalPriceValue}>₹{totalPrice}</Text>
          </View>

          <LinearGradient
            colors={[colors.gradientStart, colors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.modalProceedBtn}
          >
            <TouchableOpacity
              style={styles.modalProceedTouch}
              activeOpacity={0.85}
              onPress={handleProceedLocal}
            >
              <Text style={styles.modalProceedText}>Proceed to Checkout →</Text>
            </TouchableOpacity>
          </LinearGradient>

          <TouchableOpacity onPress={onClose} style={styles.modalCancel} activeOpacity={0.7}>
            <Text style={styles.modalCancelText}>Cancel</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
});

// ─── Schedule Modal ───────────────────────────────────────────────────────────
const ScheduleModal = React.memo(({ visible, item, onClose, onProceed }) => {
  const [quantity,        setQuantity]        = useState(1);
  const [selectedDate,    setSelectedDate]    = useState(new Date());
  const [selectedTime,    setSelectedTime]    = useState(new Date());
  const [showDatePicker,  setShowDatePicker]  = useState(false);
  const [showTimePicker,  setShowTimePicker]  = useState(false);
  const [dateConfirmed,   setDateConfirmed]   = useState(false);
  const [timeConfirmed,   setTimeConfirmed]   = useState(false);

  const formatDate = useCallback((date) => {
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
  }, []);

  const formatTime = useCallback((date) => {
    let hours   = date.getHours();
    const mins  = String(date.getMinutes()).padStart(2, '0');
    const ampm  = hours >= 12 ? 'PM' : 'AM';
    hours       = hours % 12 || 12;
    return `${String(hours).padStart(2, '0')}:${mins} ${ampm}`;
  }, []);

  const isValid = dateConfirmed && timeConfirmed;

  const handleProceedLocal = useCallback(() => {
    if (isValid) {
      onProceed({
        quantity,
        scheduledDate: formatDate(selectedDate),
        scheduledTime: formatTime(selectedTime),
      });
    }
  }, [isValid, onProceed, quantity, selectedDate, selectedTime, formatDate, formatTime]);

  const totalPrice = useMemo(() => (item?.pricePerDay || 0) * quantity, [item?.pricePerDay, quantity]);

  const openDatePicker = useCallback(() => setShowDatePicker(true), []);
  const openTimePicker = useCallback(() => setShowTimePicker(true), []);

  const handleDateChange = useCallback((event, date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (event.type === 'set' && date) {
      setSelectedDate(date);
      setDateConfirmed(true);
      setShowDatePicker(false);
    } else if (event.type === 'dismissed') {
      setShowDatePicker(false);
    }
  }, []);

  const handleTimeChange = useCallback((event, time) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (event.type === 'set' && time) {
      setSelectedTime(time);
      setTimeConfirmed(true);
      setShowTimePicker(false);
    } else if (event.type === 'dismissed') {
      setShowTimePicker(false);
    }
  }, []);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity style={styles.modalSheet} activeOpacity={1}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>Schedule Appointment</Text>
          <Text style={styles.modalSub}>{item?.name}</Text>

          {/* Date Picker */}
          <Text style={styles.fieldLabel}>Preferred Date</Text>
          <TouchableOpacity
            style={styles.dateTimeInput}
            onPress={openDatePicker}
            activeOpacity={0.8}
          >
            <Text style={styles.dateTimeIcon}>📅</Text>
            <Text style={[
              styles.dateTimeText,
              !dateConfirmed && styles.dateTimePlaceholder,
            ]}>
              {dateConfirmed ? formatDate(selectedDate) : 'DD / MM / YYYY'}
            </Text>
            <Text style={styles.dateTimeArrow}>›</Text>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'calendar'}
              minimumDate={new Date()}
              onChange={handleDateChange}
            />
          )}

          {/* Time Picker */}
          <Text style={styles.fieldLabel}>Preferred Time</Text>
          <TouchableOpacity
            style={styles.dateTimeInput}
            onPress={openTimePicker}
            activeOpacity={0.8}
          >
            <Text style={styles.dateTimeIcon}>🕐</Text>
            <Text style={[
              styles.dateTimeText,
              !timeConfirmed && styles.dateTimePlaceholder,
            ]}>
              {timeConfirmed ? formatTime(selectedTime) : 'HH : MM  AM / PM'}
            </Text>
            <Text style={styles.dateTimeArrow}>›</Text>
          </TouchableOpacity>

          {showTimePicker && (
            <DateTimePicker
              value={selectedTime}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'clock'}
              is24Hour={false}
              onChange={handleTimeChange}
            />
          )}

          {/* Selected summary */}
          {(dateConfirmed || timeConfirmed) && (
            <View style={styles.selectionSummary}>
              {dateConfirmed && (
                <View style={styles.summaryChip}>
                  <Text style={styles.summaryChipText}>📅 {formatDate(selectedDate)}</Text>
                </View>
              )}
              {timeConfirmed && (
                <View style={styles.summaryChip}>
                  <Text style={styles.summaryChipText}>🕐 {formatTime(selectedTime)}</Text>
                </View>
              )}
            </View>
          )}

          <QuantitySelector quantity={quantity} onChange={setQuantity} />

          <View style={styles.modalPriceSummary}>
            <Text style={styles.modalPriceLabel}>Total per day</Text>
            <Text style={styles.modalPriceValue}>₹{totalPrice}</Text>
          </View>

          <LinearGradient
            colors={isValid
              ? [colors.gradientStart, colors.gradientEnd]
              : [colors.surfaceElevated, colors.surfaceElevated]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.modalProceedBtn}
          >
            <TouchableOpacity
              style={styles.modalProceedTouch}
              activeOpacity={isValid ? 0.85 : 1}
              onPress={handleProceedLocal}
            >
              <Text style={[styles.modalProceedText, !isValid && { color: colors.textMuted }]}>
                {isValid ? 'Proceed to Checkout →' : 'Select Date & Time'}
              </Text>
            </TouchableOpacity>
          </LinearGradient>

          <TouchableOpacity onPress={onClose} style={styles.modalCancel} activeOpacity={0.7}>
            <Text style={styles.modalCancelText}>Cancel</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
const RentalDetailScreen = ({ route, navigation }) => {
  const { item } = route.params;
  const [showBookNow,  setShowBookNow]  = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);

  const description = useMemo(() => item.description || 'High quality rental equipment for your construction needs.', [item.description]);

  const handleProceed = useCallback((bookingDetails) => {
    setShowBookNow(false);
    setShowSchedule(false);
    navigation.navigate('RentalCheckout', {
      item,
      ...bookingDetails,
    });
  }, [item, navigation]);

  const openBookNow = useCallback(() => setShowBookNow(true), []);
  const closeBookNow = useCallback(() => setShowBookNow(false), []);
  const openSchedule = useCallback(() => setShowSchedule(true), []);
  const closeSchedule = useCallback(() => setShowSchedule(false), []);

  const handleBookNowPress = useCallback(() => {
    if (item.available) openBookNow();
  }, [item.available, openBookNow]);

  const renderedFeatures = useMemo(() => (
    (item.features || []).map((f) => (
      <View key={f.label} style={styles.featureItem}>
        <View style={styles.featureIcon}>
          <Text style={{ fontSize: 20 }}>{f.icon}</Text>
        </View>
        <Text style={styles.featureLabel}>{f.label}</Text>
      </View>
    ))
  ), [item.features]);

  const renderedSpecs = useMemo(() => (
    (item.specs || []).map((s) => (
      <View key={s.label} style={styles.pricingRow}>
        <Text style={styles.pricingLabel}>{s.label}</Text>
        <Text style={styles.pricingValue}>{s.value}</Text>
      </View>
    ))
  ), [item.specs]);

  const renderedPricing = useMemo(() => (
    [
      { label: 'Daily Rate',   value: `₹${item.pricePerDay}` },
      { label: 'Weekly Rate',  value: `₹${item.pricePerDay * 6}` },
      { label: 'Monthly Rate', value: `₹${item.pricePerDay * 24}` },
    ].map((p) => (
      <View key={p.label} style={styles.pricingRow}>
        <Text style={styles.pricingLabel}>{p.label}</Text>
        <Text style={styles.pricingValue}>{p.value}</Text>
      </View>
    ))
  ), [item.pricePerDay]);

  const handleGoBack = useCallback(() => navigation.goBack(), [navigation]);

  const bookNowColors = useMemo(() => 
    item.available ? [colors.gradientStart, colors.gradientEnd] : [colors.surfaceElevated, colors.surfaceElevated],
    [item.available]
  );

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
        <Text style={styles.headerTitle}>Rental Details</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Hero Image */}
        <View style={styles.heroWrapper}>
          <Image source={{ uri: item.image }} style={styles.heroImage} resizeMode="cover" />
          <View style={styles.heroBadge}>
            <View style={[styles.availDot, {
              backgroundColor: item.available ? colors.success : colors.danger
            }]} />
            <Text style={[styles.availText, {
              color: item.available ? colors.success : colors.danger
            }]}>
              {item.available ? 'Available' : 'Currently Booked'}
            </Text>
          </View>
        </View>

        {/* Basic Info */}
        <View style={styles.infoSection}>
          <View style={styles.infoTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemSeller}>by {item.seller}</Text>
            </View>
            <View style={styles.ratingBlock}>
              <Text style={styles.ratingValue}>⭐ {item.rating}</Text>
            </View>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.price}>₹{item.pricePerDay}</Text>
            <Text style={styles.priceUnit}> / day</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What's Included</Text>
          <View style={styles.featuresGrid}>
            {renderedFeatures}
          </View>
        </View>

        <View style={styles.divider} />

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About this Equipment</Text>
          <Text style={styles.description}>{description}</Text>
        </View>

        <View style={styles.divider} />

        {/* Specs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Specifications</Text>
          {renderedSpecs}
        </View>

        <View style={styles.divider} />

        {/* Pricing breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pricing</Text>
          {renderedPricing}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom Buttons */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.scheduleBtn}
          onPress={openSchedule}
          activeOpacity={0.85}
        >
          <Text style={styles.scheduleBtnText}>📅 Schedule</Text>
        </TouchableOpacity>

        <LinearGradient
          colors={bookNowColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.bookNowBtn}
        >
          <TouchableOpacity
            style={styles.bookNowTouch}
            activeOpacity={item.available ? 0.85 : 1}
            onPress={handleBookNowPress}
          >
            <Text style={[styles.bookNowText, !item.available && { color: colors.textMuted }]}>
              {item.available ? '⚡ Book Now' : 'Not Available'}
            </Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>

      <BookNowModal
        visible={showBookNow}
        item={item}
        onClose={closeBookNow}
        onProceed={handleProceed}
      />
      <ScheduleModal
        visible={showSchedule}
        item={item}
        onClose={closeSchedule}
        onProceed={handleProceed}
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
  headerTitle: { fontSize: 18, fontWeight: '800', color: colors.textPrimary },
  scroll: { paddingBottom: 20 },

  // Hero
  heroWrapper: { position: 'relative', marginHorizontal: 20, marginBottom: 16 },
  heroImage: {
    width: '100%',
    height: 220,
    borderRadius: 20,
    backgroundColor: colors.surfaceElevated,
  },
  heroBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  availDot: { width: 7, height: 7, borderRadius: 4 },
  availText: { fontSize: 12, fontWeight: '700' },

  // Info
  infoSection: { paddingHorizontal: 20, marginBottom: 16 },
  infoTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  itemName: { fontSize: 22, fontWeight: '800', color: colors.textPrimary, marginBottom: 4 },
  itemSeller: { fontSize: 13, color: colors.textMuted, fontWeight: '500' },
  ratingBlock: {
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ratingValue: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  priceRow: { flexDirection: 'row', alignItems: 'baseline' },
  price: { fontSize: 28, fontWeight: '800', color: colors.textPrimary },
  priceUnit: { fontSize: 14, color: colors.textMuted, fontWeight: '500' },

  divider: { height: 1, backgroundColor: colors.borderLight, marginHorizontal: 20, marginVertical: 4 },

  // Sections
  section: { paddingHorizontal: 20, paddingVertical: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: colors.textPrimary, marginBottom: 14 },

  // Features
  featuresGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  featureItem: { width: '45%', flexDirection: 'row', alignItems: 'center', gap: 10 },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.accentYellowSoft,
    borderWidth: 1,
    borderColor: 'rgba(245,200,66,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureLabel: { fontSize: 13, fontWeight: '600', color: colors.textPrimary, flex: 1 },

  // Description
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
    fontWeight: '400',
  },

  // Pricing rows
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  pricingLabel: { fontSize: 14, color: colors.textSecondary, fontWeight: '500' },
  pricingValue: { fontSize: 14, fontWeight: '800', color: colors.textPrimary },

  // Bottom bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 28,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 10,
  },
  scheduleBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  scheduleBtnText: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  bookNowBtn: { flex: 1, borderRadius: 16, overflow: 'hidden' },
  bookNowTouch: { paddingVertical: 16, alignItems: 'center' },
  bookNowText: { fontSize: 14, fontWeight: '800', color: colors.textPrimary },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 14,
    paddingBottom: 36,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 4,
  },
  modalSub: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    fontWeight: '500',
    marginBottom: 24,
  },

  // Qty
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  qtyLabel: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  qtyControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  qtyBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentYellow,
  },
  qtyBtnText: { fontSize: 18, fontWeight: '800', color: colors.textPrimary, lineHeight: 22 },
  qtyInput: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
    paddingHorizontal: 12,
    minWidth: 50,
    textAlign: 'center',
    height: 36,
  },

  // Date/Time fields
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 4,
  },
  dateTimeInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBg,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginBottom: 16,
    gap: 10,
  },
  dateTimeIcon: { fontSize: 18 },
  dateTimeText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  dateTimePlaceholder: {
    color: colors.textMuted,
    fontWeight: '400',
  },
  dateTimeArrow: {
    fontSize: 20,
    color: colors.textMuted,
    fontWeight: '300',
  },
  selectionSummary: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  summaryChip: {
    backgroundColor: colors.accentYellowSoft,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.accentYellow,
  },
  summaryChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.accentAmber,
  },

  // Price summary in modal
  modalPriceSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.accentYellowSoft,
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(245,200,66,0.3)',
  },
  modalPriceLabel: { fontSize: 13, color: colors.textSecondary, fontWeight: '600' },
  modalPriceValue: { fontSize: 18, fontWeight: '800', color: colors.accentAmber },

  modalProceedBtn: { borderRadius: 16, overflow: 'hidden', marginBottom: 10 },
  modalProceedTouch: { paddingVertical: 16, alignItems: 'center' },
  modalProceedText: { fontSize: 15, fontWeight: '800', color: colors.textPrimary, letterSpacing: 0.3 },
  modalCancel: { paddingVertical: 10, alignItems: 'center' },
  modalCancelText: { fontSize: 14, color: colors.textMuted, fontWeight: '600' },
});

export default RentalDetailScreen;