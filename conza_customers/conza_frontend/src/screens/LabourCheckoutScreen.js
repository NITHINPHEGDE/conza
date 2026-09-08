import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
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
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, MaterialIcons, Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Location from 'expo-location';

import { colors } from '../theme/colors';
import { reverseGeocodeFullAddress } from '../hooks/useAuth';
import useAppStore from '../store/useAppStore';
import { useBooking } from '../hooks/useBooking';
import SavedAddressSheet from '../components/SavedAddressSheet';

// Subtle top-down vector map tile background asset
const mapPreviewBg = require('../../assets/images/map_preview_bg.jpg');

const WORKER_AVATARS = [
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80',
  'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=400&q=80',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&q=80',
];

const getWorkerFallbackAvatar = (worker, index = 0) => {
  const str = worker?._id || worker?.name || String(index);
  const hash = Math.abs(str.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0));
  return WORKER_AVATARS[hash % WORKER_AVATARS.length];
};

const LabourCheckoutScreen = ({ route, navigation }) => {
  const {
    selectedWorkers = [],
    category = '',
    isAutobook = false,
    requiredWorkers = 0,
    presetIsImmediate,
    estimateWorkers = [],
    selectedProject: initialProject = null,
  } = route.params || {};

  const effectiveWorkers = isAutobook ? estimateWorkers : selectedWorkers;
  const primaryWorker = effectiveWorkers[0] || {};

  const scrollRef = useRef(null);
  const [currentStep, setCurrentStep] = useState(1); // 1 = Details, 2 = Payment

  // Project linkage
  const activeProject = useAppStore((s) => s.activeProject);
  const selectedProject = initialProject || activeProject || null;

  // Wallet
  const walletBalance = useAppStore((s) => s.walletBalance);
  const savedAddresses = useAppStore((s) => s.savedAddresses);
  const userLat = useAppStore((s) => s.userLat);
  const userLng = useAppStore((s) => s.userLng);

  // Address state
  const defaultSavedAddr = useMemo(() => {
    if (!savedAddresses || !savedAddresses.length) return null;
    return savedAddresses.find((a) => a.isDefault) || savedAddresses[0];
  }, [savedAddresses]);

  const [addressLabel, setAddressLabel] = useState(defaultSavedAddr?.label ? `${defaultSavedAddr.label} (Default)` : 'Home (Default)');
  const [houseNumber, setHouseNumber]   = useState(defaultSavedAddr?.houseNo || '123');
  const [houseName, setHouseName]       = useState(defaultSavedAddr?.building || '');
  const [street, setStreet]             = useState(defaultSavedAddr?.street || '5th Cross');
  const [area, setArea]                 = useState(defaultSavedAddr?.area || 'BTM Layout');
  const [city, setCity]                 = useState(defaultSavedAddr?.city || 'Bengaluru');
  const [district, setDistrict]         = useState(defaultSavedAddr?.district || 'Bengaluru Urban');
  const [state, setState]               = useState(defaultSavedAddr?.state || 'Karnataka');
  const [pincode, setPincode]           = useState(defaultSavedAddr?.pincode || '560076');
  const [lat, setLat]                   = useState(defaultSavedAddr?.latitude || userLat || 12.9165);
  const [lng, setLng]                   = useState(defaultSavedAddr?.longitude || userLng || 77.6101);

  const [savedAddressSheetVisible, setSavedAddressSheetVisible] = useState(false);
  const [selectedSavedAddress, setSelectedSavedAddress]         = useState(defaultSavedAddr || null);

  const fullDisplayAddress = useMemo(() => {
    if (selectedSavedAddress?.address) return selectedSavedAddress.address;
    const parts = [
      houseNumber ? `${houseNumber},` : '',
      street,
      area,
      city,
      state ? `${state} ${pincode}` : pincode,
    ].filter(Boolean);
    return parts.join(' ').replace(/\s+,/g, ',') || '123, 5th Cross, BTM Layout, Bengaluru, Karnataka 560076';
  }, [selectedSavedAddress, houseNumber, street, area, city, state, pincode]);

  // Booking details
  const [bookingType, setBookingType] = useState(presetIsImmediate === false ? 'scheduled' : 'immediate');
  const [scheduledDate, setScheduledDate] = useState(new Date());
  const [scheduledTime, setScheduledTime] = useState(new Date());
  const [toDate, setToDate] = useState(new Date(Date.now() + 24 * 60 * 60 * 1000));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showToDatePicker, setShowToDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [notes, setNotes] = useState('');

  // Keep toDate at or after scheduledDate whenever scheduledDate changes
  useEffect(() => {
    const start = new Date(scheduledDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(toDate);
    end.setHours(0, 0, 0, 0);
    if (end < start) {
      setToDate(new Date(start));
    }
  }, [scheduledDate, toDate]);

  const scheduledDates = useMemo(() => {
    if (bookingType !== 'scheduled') return [];
    const dates = [];
    const cur = new Date(scheduledDate);
    cur.setHours(0, 0, 0, 0);
    const end = new Date(toDate);
    end.setHours(0, 0, 0, 0);
    while (cur <= end) {
      dates.push(new Date(cur));
      cur.setDate(cur.getDate() + 1);
    }
    return dates;
  }, [bookingType, scheduledDate, toDate]);

  const totalDays = bookingType === 'scheduled' ? Math.max(scheduledDates.length, 1) : 1;

  // Step 2 state: Payment method & terms
  const [paymentMethod, setPaymentMethod] = useState('cod'); // Default to Cash on Delivery
  const [agreeTerms, setAgreeTerms]       = useState(true);

  // Worker display values
  const workerName = primaryWorker.fullName || primaryWorker.name || 'Ramesh Kumar';
  const workerCategory = primaryWorker.category || category || 'Mason';
  const workerRating = primaryWorker.rating ? Number(primaryWorker.rating).toFixed(1) : '4.8';
  const workerReviews = primaryWorker.reviewCount || primaryWorker.totalJobs || 124;
  const workerExperience = primaryWorker.experience ? `${primaryWorker.experience}+ years experience` : '5+ years experience';
  const hourlyRate = Number(primaryWorker.pricePerDay) || 200;
  const travelCharge = (primaryWorker.baseCharge != null && Number(primaryWorker.baseCharge) > 0)
    ? Number(primaryWorker.baseCharge)
    : 150;

  // Pricing calculation
  const perDayOrHourRate = bookingType === 'scheduled'
    ? (Number(primaryWorker.perDayCharge) || Number(primaryWorker.pricePerDay) || 200)
    : hourlyRate;

  const labourCharge = bookingType === 'scheduled'
    ? perDayOrHourRate * totalDays
    : hourlyRate * 4; // Baseline estimated labour charge (matches design ₹800)
  const estimatedTotal = labourCharge + travelCharge; // Matches design ₹950

  // Original labour uploaded image (fallback to safe avatar)
  const [imageFailed, setImageFailed] = useState(false);
  const workerImageUri = useMemo(() => {
    if (primaryWorker?.profileImage && typeof primaryWorker.profileImage === 'string' && primaryWorker.profileImage.trim().length > 0) {
      return primaryWorker.profileImage.trim();
    }
    if (primaryWorker?.avatar && typeof primaryWorker.avatar === 'string' && primaryWorker.avatar.trim().length > 0) {
      return primaryWorker.avatar.trim();
    }
    if (primaryWorker?.photo && typeof primaryWorker.photo === 'string' && primaryWorker.photo.trim().length > 0) {
      return primaryWorker.photo.trim();
    }
    return null;
  }, [primaryWorker]);

  const fallbackUri = useMemo(() => getWorkerFallbackAvatar(primaryWorker, 0), [primaryWorker]);

  // Hook for submitting booking
  const { submitBooking, loading: submitting, error: submitError } = useBooking('labour');

  // Handle header back button
  const handleBack = useCallback(() => {
    if (currentStep === 2) {
      setCurrentStep(1);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    } else {
      navigation.goBack();
    }
  }, [currentStep, navigation]);

  // Handle step transition
  const handleContinueToPayment = useCallback(() => {
    if (!city || !pincode) {
      Alert.alert('Address Needed', 'Please provide a valid delivery address with city and pincode.');
      return;
    }
    setCurrentStep(2);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }, [city, pincode]);

  // Handle address selection from sheet
  const handleSavedAddressSelect = useCallback((item) => {
    setSelectedSavedAddress(item);
    setAddressLabel(item.label ? `${item.label} (Default)` : 'Saved Address');
    setHouseNumber(item.houseNo   || '');
    setHouseName(item.building    || '');
    setStreet(item.street         || '');
    setArea(item.area             || '');
    setCity(item.city             || '');
    setDistrict(item.district     || '');
    setState(item.state           || '');
    setPincode(item.pincode       || '');
    setLat(item.latitude          ?? userLat);
    setLng(item.longitude         ?? userLng);
  }, [userLat, userLng]);

  // Handle confirm booking
  const handleConfirmBooking = useCallback(async () => {
    if (!agreeTerms) {
      Alert.alert('Terms Required', 'Please accept the Terms & Conditions and Privacy Policy to proceed.');
      return;
    }

    const combinedScheduledDate = new Date(scheduledDate);
    combinedScheduledDate.setHours(scheduledTime.getHours());
    combinedScheduledDate.setMinutes(scheduledTime.getMinutes());

    const result = await submitBooking({
      selectedWorkers: effectiveWorkers.length ? effectiveWorkers : [primaryWorker],
      category: workerCategory,
      isAutobook,
      requiredWorkers: requiredWorkers || 1,
      projectId: selectedProject?._id,
      selectedProject,
      houseNumber,
      houseName,
      street,
      area,
      city,
      district,
      state,
      pincode,
      paymentMethod, // 'cod' or other
      description: notes,
      isImmediate: bookingType === 'immediate',
      scheduledDate: bookingType === 'scheduled' ? combinedScheduledDate : null,
      scheduledEndDate: bookingType === 'scheduled' ? toDate : null,
      scheduledDates: bookingType === 'scheduled' ? scheduledDates.map((d) => d.toISOString()) : [],
      totalDays,
      latitude: lat,
      longitude: lng,
    });

    if (result) {
      navigation.navigate('BookingConfirmation', {
        attachment: result,
        title: 'Booking Confirmed! ⚡',
        message: selectedProject
          ? `Your labour booking has been confirmed and linked to "${selectedProject.name}". Track it from Status.`
          : paymentMethod === 'cod'
            ? 'Your booking is confirmed! Pay in cash after the work is completed.'
            : 'Your labour booking has been confirmed successfully.',
      });
    }
  }, [
    agreeTerms,
    scheduledDate,
    scheduledTime,
    toDate,
    scheduledDates,
    totalDays,
    submitBooking,
    effectiveWorkers,
    primaryWorker,
    workerCategory,
    isAutobook,
    requiredWorkers,
    selectedProject,
    houseNumber,
    houseName,
    street,
    area,
    city,
    district,
    state,
    pincode,
    paymentMethod,
    notes,
    bookingType,
    lat,
    lng,
    navigation,
  ]);

  const handleDateChange = (event, date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (date) {
      setScheduledDate(date);
      if (Platform.OS === 'android') setShowDatePicker(false);
    }
  };

  const handleToDateChange = (event, date) => {
    setShowToDatePicker(Platform.OS === 'ios');
    if (date) {
      setToDate(date);
      if (Platform.OS === 'android') setShowToDatePicker(false);
    }
  };

  const handleTimeChange = (event, time) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (time) {
      setScheduledTime(time);
      if (Platform.OS === 'android') setShowTimePicker(false);
    }
  };

  const formattedScheduleDate = useMemo(() => {
    const today = new Date();
    const isToday =
      scheduledDate.getDate() === today.getDate() &&
      scheduledDate.getMonth() === today.getMonth() &&
      scheduledDate.getFullYear() === today.getFullYear();
    const dateStr = scheduledDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    return isToday ? `Today, ${dateStr}` : dateStr;
  }, [scheduledDate]);

  const formattedToDate = useMemo(() => {
    return toDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }, [toDate]);

  const formattedScheduleTime = useMemo(() => {
    if (bookingType === 'immediate') return 'ASAP';
    return scheduledTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  }, [bookingType, scheduledTime]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBackBtn} onPress={handleBack} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Proceed to Checkout</Text>
        <View style={styles.secureBookingBadge}>
          <MaterialCommunityIcons name="shield-check-outline" size={16} color="#64748B" />
          <Text style={styles.secureBookingText}>Secure Booking</Text>
        </View>
      </View>

      {/* Stepper Progress Bar */}
      <View style={styles.stepperContainer}>
        {/* Step 1: Details */}
        <View style={styles.stepItem}>
          <View style={[styles.stepCircle, currentStep === 1 ? styles.stepCircleActive : styles.stepCircleDone]}>
            {currentStep > 1 ? (
              <MaterialCommunityIcons name="check" size={16} color="#0F172A" />
            ) : (
              <Text style={styles.stepNumberActive}>1</Text>
            )}
          </View>
          <Text style={[styles.stepLabel, currentStep === 1 && styles.stepLabelActive]}>Details</Text>
        </View>

        {/* Line 1 -> 2 */}
        <View style={[styles.stepLine, currentStep > 1 ? styles.stepLineActive : styles.stepLineInactive]} />

        {/* Step 2: Payment */}
        <View style={styles.stepItem}>
          <View style={[styles.stepCircle, currentStep === 2 ? styles.stepCircleActive : styles.stepCircleInactive]}>
            <Text style={currentStep === 2 ? styles.stepNumberActive : styles.stepNumberInactive}>2</Text>
          </View>
          <Text style={[styles.stepLabel, currentStep === 2 && styles.stepLabelActive]}>Payment</Text>
        </View>

        {/* Line 2 -> 3 */}
        <View style={styles.stepLine} />

        {/* Step 3: Confirmation */}
        <View style={styles.stepItem}>
          <View style={[styles.stepCircle, styles.stepCircleInactive]}>
            <Text style={styles.stepNumberInactive}>3</Text>
          </View>
          <Text style={styles.stepLabel}>Confirmation</Text>
        </View>
      </View>

      {/* Main Scroll Content */}
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {currentStep === 1 ? (
          /* ========================================================================= */
          /*                             STEP 1: DETAILS                               */
          /* ========================================================================= */
          <>
            {/* Worker Card */}
            <View style={styles.workerCard}>
              <View style={styles.workerAvatarContainer}>
                <Image
                  source={{ uri: !imageFailed && workerImageUri ? workerImageUri : fallbackUri }}
                  style={styles.workerAvatarImage}
                  resizeMode="cover"
                  onError={() => setImageFailed(true)}
                />
              </View>

              <View style={styles.workerDetails}>
                <View style={styles.workerNameRow}>
                  <Text style={styles.workerName} numberOfLines={1}>{workerName}</Text>
                  <MaterialCommunityIcons name="check-circle" size={16} color="#10B981" style={{ marginLeft: 4 }} />
                </View>

                <Text style={styles.workerCategory}>{workerCategory}</Text>

                <View style={styles.workerRatingRow}>
                  <MaterialIcons name="star" size={14} color="#F59E0B" />
                  <Text style={styles.workerRatingText}>{workerRating}</Text>
                  <Text style={styles.workerReviewsText}>({workerReviews} reviews)</Text>
                </View>

                <View style={styles.workerMetaItem}>
                  <MaterialCommunityIcons name="briefcase-outline" size={13} color="#64748B" />
                  <Text style={styles.workerMetaText}>{workerExperience}</Text>
                </View>

                <View style={styles.workerMetaItem}>
                  <MaterialCommunityIcons name="shield-account-outline" size={13} color="#64748B" />
                  <Text style={styles.workerMetaText}>Aadhaar Verified</Text>
                </View>
              </View>

              <View style={styles.workerPriceCol}>
                <Text style={styles.workerHourlyPrice}>₹{hourlyRate}/hr</Text>
                <Text style={styles.workerTravelCharge}>+ ₹{travelCharge} travel charge</Text>
                <View style={styles.availableBadge}>
                  <Text style={styles.availableBadgeText}>Available for booking</Text>
                </View>
              </View>
            </View>

            {/* Booking Type Section */}
            <View style={styles.sectionHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <MaterialCommunityIcons name="flash" size={18} color="#0F172A" />
                <Text style={styles.sectionTitle}>Booking Type</Text>
              </View>
              <MaterialCommunityIcons name="information-outline" size={16} color="#94A3B8" />
            </View>

            <View style={styles.bookingTypeContainer}>
              {/* Instant Booking Option */}
              <TouchableOpacity
                style={[
                  styles.bookingTypeCard,
                  bookingType === 'immediate' && styles.bookingTypeCardSelected,
                ]}
                activeOpacity={0.85}
                onPress={() => setBookingType('immediate')}
              >
                <View style={styles.bookingTypeCardTop}>
                  <View style={[styles.radioCircle, bookingType === 'immediate' && styles.radioCircleSelected]}>
                    {bookingType === 'immediate' && <View style={styles.radioDot} />}
                  </View>
                  <MaterialCommunityIcons name="flash" size={16} color="#F59E0B" style={{ marginLeft: 6 }} />
                  <Text style={styles.bookingTypeTitle}>Instant Booking</Text>
                </View>
                <View style={styles.recommendedBadge}>
                  <Text style={styles.recommendedBadgeText}>Recommended</Text>
                </View>
                <Text style={styles.bookingTypeDesc}>
                  Get a labourer as soon as possible (usually within 1 hour)
                </Text>
              </TouchableOpacity>

              {/* Scheduled Booking Option */}
              <TouchableOpacity
                style={[
                  styles.bookingTypeCard,
                  bookingType === 'scheduled' && styles.bookingTypeCardSelected,
                ]}
                activeOpacity={0.85}
                onPress={() => setBookingType('scheduled')}
              >
                <View style={styles.bookingTypeCardTop}>
                  <View style={[styles.radioCircle, bookingType === 'scheduled' && styles.radioCircleSelected]}>
                    {bookingType === 'scheduled' && <View style={styles.radioDot} />}
                  </View>
                  <MaterialCommunityIcons name="calendar-month-outline" size={16} color="#475569" style={{ marginLeft: 6 }} />
                  <Text style={styles.bookingTypeTitle}>Scheduled Booking</Text>
                </View>
                <Text style={[styles.bookingTypeDesc, { marginTop: 16 }]}>
                  Choose date and time as per your convenience.
                </Text>
              </TouchableOpacity>
            </View>

            {/* Schedule Section */}
            <View style={[styles.sectionHeaderRow, { marginTop: 22 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <MaterialCommunityIcons name="calendar-month-outline" size={18} color="#0F172A" />
                <Text style={styles.sectionTitle}>Schedule</Text>
              </View>
            </View>

            <View style={styles.scheduleInfoBanner}>
              <View style={styles.scheduleIconCircle}>
                <MaterialCommunityIcons name="flash" size={16} color="#D97706" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.scheduleInfoTitle}>
                  {bookingType === 'immediate' ? 'Instant Booking Selected' : 'Scheduled Booking Selected'}
                </Text>
                <Text style={styles.scheduleInfoText}>
                  {bookingType === 'immediate'
                    ? 'We will confirm your booking and the labourer will be assigned shortly.'
                    : 'Choose your desired date and time below for assignment.'}
                </Text>
              </View>
            </View>

            {bookingType === 'immediate' ? (
              <View style={styles.scheduleSelectorsRow}>
                {/* Date Selector */}
                <TouchableOpacity
                  style={styles.selectorBox}
                  activeOpacity={0.7}
                  onPress={() => setShowDatePicker(true)}
                >
                  <MaterialCommunityIcons name="calendar-outline" size={20} color="#64748B" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.selectorLabel}>Date</Text>
                    <Text style={styles.selectorValue} numberOfLines={1}>{formattedScheduleDate}</Text>
                  </View>
                  <MaterialCommunityIcons name="chevron-down" size={18} color="#94A3B8" />
                </TouchableOpacity>

                {/* Start Time Selector */}
                <TouchableOpacity
                  style={styles.selectorBox}
                  activeOpacity={0.7}
                  onPress={() => setShowTimePicker(true)}
                >
                  <MaterialCommunityIcons name="clock-outline" size={20} color="#64748B" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.selectorLabel}>Start Time</Text>
                    <Text style={styles.selectorValue} numberOfLines={1}>{formattedScheduleTime}</Text>
                  </View>
                  <MaterialCommunityIcons name="chevron-down" size={18} color="#94A3B8" />
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <View style={styles.scheduleSelectorsRow}>
                  {/* Start Date Selector */}
                  <TouchableOpacity
                    style={styles.selectorBox}
                    activeOpacity={0.7}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <MaterialCommunityIcons name="calendar-outline" size={20} color="#64748B" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.selectorLabel}>Start Date</Text>
                      <Text style={styles.selectorValue} numberOfLines={1}>{formattedScheduleDate}</Text>
                    </View>
                    <MaterialCommunityIcons name="chevron-down" size={18} color="#94A3B8" />
                  </TouchableOpacity>

                  {/* End Date Selector */}
                  <TouchableOpacity
                    style={styles.selectorBox}
                    activeOpacity={0.7}
                    onPress={() => setShowToDatePicker(true)}
                  >
                    <MaterialCommunityIcons name="calendar-check-outline" size={20} color="#64748B" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.selectorLabel}>End Date</Text>
                      <Text style={styles.selectorValue} numberOfLines={1}>{formattedToDate}</Text>
                    </View>
                    <MaterialCommunityIcons name="chevron-down" size={18} color="#94A3B8" />
                  </TouchableOpacity>
                </View>

                <View style={[styles.scheduleSelectorsRow, { marginTop: 10 }]}>
                  {/* Start Time Selector */}
                  <TouchableOpacity
                    style={styles.selectorBox}
                    activeOpacity={0.7}
                    onPress={() => setShowTimePicker(true)}
                  >
                    <MaterialCommunityIcons name="clock-outline" size={20} color="#64748B" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.selectorLabel}>Start Time</Text>
                      <Text style={styles.selectorValue} numberOfLines={1}>{formattedScheduleTime}</Text>
                    </View>
                    <MaterialCommunityIcons name="chevron-down" size={18} color="#94A3B8" />
                  </TouchableOpacity>

                  {/* Duration Display Box */}
                  <View style={[styles.selectorBox, { backgroundColor: '#F8FAFC' }]}>
                    <MaterialCommunityIcons name="calendar-range" size={20} color="#D97706" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.selectorLabel}>Duration</Text>
                      <Text style={[styles.selectorValue, { color: '#D97706' }]} numberOfLines={1}>
                        {totalDays} Day{totalDays > 1 ? 's' : ''}
                      </Text>
                    </View>
                  </View>
                </View>
              </>
            )}

            {/* DateTime Pickers */}
            {showDatePicker && (
              <DateTimePicker
                value={scheduledDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleDateChange}
                minimumDate={new Date()}
              />
            )}
            {showToDatePicker && (
              <DateTimePicker
                value={toDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleToDateChange}
                minimumDate={scheduledDate}
              />
            )}
            {showTimePicker && (
              <DateTimePicker
                value={scheduledTime}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleTimeChange}
              />
            )}

            {/* NOTE: Estimated Duration section is completely REMOVED as requested */}

            {/* Work Location Section */}
            <View style={[styles.sectionHeaderRow, { marginTop: 22 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <MaterialCommunityIcons name="map-marker-outline" size={18} color="#0F172A" />
                <Text style={styles.sectionTitle}>Work Location</Text>
              </View>
              <TouchableOpacity activeOpacity={0.7} onPress={() => setSavedAddressSheetVisible(true)}>
                <Text style={styles.changeLinkText}>Change</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.locationCard}>
              <View style={styles.locationHeaderRow}>
                <View style={styles.homeIconBox}>
                  <MaterialCommunityIcons name="home-outline" size={20} color="#0F172A" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.locationLabelText}>{addressLabel}</Text>
                  <Text style={styles.locationAddressText} numberOfLines={2}>
                    {fullDisplayAddress}
                  </Text>
                </View>
              </View>

              {/* Mini Map View */}
              <View style={styles.miniMapContainer}>
                <Image
                  source={mapPreviewBg}
                  style={styles.miniMapImage}
                  resizeMode="cover"
                />
                <View style={styles.miniMapPinWrap}>
                  <MaterialCommunityIcons name="map-marker" size={32} color="#F59E0B" />
                </View>
                <TouchableOpacity
                  style={styles.viewOnMapPill}
                  activeOpacity={0.8}
                  onPress={() => setSavedAddressSheetVisible(true)}
                >
                  <MaterialCommunityIcons name="map-outline" size={14} color="#0F172A" />
                  <Text style={styles.viewOnMapText}>View on Map</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Additional Notes (Optional) */}
            <View style={[styles.sectionHeaderRow, { marginTop: 22 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <MaterialCommunityIcons name="file-document-outline" size={18} color="#0F172A" />
                <Text style={styles.sectionTitle}>Additional Notes (Optional)</Text>
              </View>
            </View>

            <View style={styles.notesContainer}>
              <TextInput
                style={styles.notesInput}
                placeholder="e.g. Bathroom wall tiling work. Please bring necessary tools."
                placeholderTextColor="#94A3B8"
                multiline
                maxLength={200}
                value={notes}
                onChangeText={setNotes}
              />
              <Text style={styles.notesCharCount}>{notes.length}/200</Text>
            </View>

            <View style={{ height: 90 }} />
          </>
        ) : (
          /* ========================================================================= */
          /*                             STEP 2: PAYMENT                               */
          /* ========================================================================= */
          <>
            {/* Price Summary (Estimated) */}
            <View style={styles.sectionHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <MaterialCommunityIcons name="currency-inr" size={18} color="#0F172A" />
                <Text style={styles.sectionTitle}>Price Summary (Estimated)</Text>
              </View>
            </View>

            <View style={styles.priceSummaryCard}>
              <View style={styles.priceSummaryRow}>
                <Text style={styles.priceSummaryLabel}>
                  {bookingType === 'scheduled'
                    ? `Labour charge (${totalDays} day${totalDays > 1 ? 's' : ''})`
                    : `Labour charge (${hourlyRate > 0 ? `₹${hourlyRate}/hr` : 'Hourly'})`}
                </Text>
                <Text style={styles.priceSummaryValue}>₹{labourCharge}</Text>
              </View>

              <View style={styles.priceSummaryRow}>
                <Text style={styles.priceSummaryLabel}>Base / Travel charge</Text>
                <Text style={styles.priceSummaryValue}>₹{travelCharge}</Text>
              </View>

              <View style={styles.estimatedTotalBox}>
                <Text style={styles.estimatedTotalLabel}>Estimated Total</Text>
                <Text style={styles.estimatedTotalValue}>₹{estimatedTotal}</Text>
              </View>

              <View style={styles.estimateDisclaimerBox}>
                <MaterialCommunityIcons name="information" size={16} color="#2563EB" style={{ marginTop: 1 }} />
                <Text style={styles.estimateDisclaimerText}>
                  This is an estimated amount. You will be charged based on actual working time. Final bill will be generated after the work is completed.
                </Text>
              </View>
            </View>

            {/* Payment Method Section */}
            <View style={[styles.sectionHeaderRow, { marginTop: 22 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <MaterialCommunityIcons name="credit-card-outline" size={18} color="#0F172A" />
                <Text style={styles.sectionTitle}>Payment Method</Text>
              </View>
            </View>
            <Text style={styles.sectionSubTitle}>Choose how you want to pay</Text>

            {/* Method 1: UPI */}
            <TouchableOpacity
              style={[styles.paymentMethodCard, paymentMethod === 'upi' && styles.paymentMethodCardSelected]}
              activeOpacity={0.8}
              onPress={() => setPaymentMethod('upi')}
            >
              <View style={styles.paymentMethodTop}>
                <View style={[styles.radioCircle, paymentMethod === 'upi' && styles.radioCircleSelected]}>
                  {paymentMethod === 'upi' && <View style={styles.radioDot} />}
                </View>
                <View style={styles.upiLogoBox}>
                  <Text style={styles.upiLogoText}>UPI</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.paymentMethodTitle}>UPI (Recommended)</Text>
                  <View style={styles.upiBadgesRow}>
                    <View style={styles.brandBadge}>
                      <Text style={[styles.brandBadgeText, { color: '#4285F4' }]}>G</Text>
                      <Text style={[styles.brandBadgeText, { color: '#EA4335' }]}>P</Text>
                      <Text style={[styles.brandBadgeText, { color: '#FBBC05' }]}>a</Text>
                      <Text style={[styles.brandBadgeText, { color: '#34A853' }]}>y</Text>
                    </View>
                    <View style={[styles.brandBadge, { backgroundColor: '#5F259F' }]}>
                      <Text style={[styles.brandBadgeText, { color: '#FFFFFF' }]}>PhonePe</Text>
                    </View>
                    <View style={[styles.brandBadge, { backgroundColor: '#00B9F5' }]}>
                      <Text style={[styles.brandBadgeText, { color: '#FFFFFF' }]}>Paytm</Text>
                    </View>
                    <View style={[styles.brandBadge, { backgroundColor: '#006699' }]}>
                      <Text style={[styles.brandBadgeText, { color: '#FFFFFF' }]}>BHIM</Text>
                    </View>
                  </View>
                </View>
              </View>
            </TouchableOpacity>

            {/* Method 2: Cards */}
            <TouchableOpacity
              style={[styles.paymentMethodCard, paymentMethod === 'card' && styles.paymentMethodCardSelected]}
              activeOpacity={0.8}
              onPress={() => setPaymentMethod('card')}
            >
              <View style={styles.paymentMethodTop}>
                <View style={[styles.radioCircle, paymentMethod === 'card' && styles.radioCircleSelected]}>
                  {paymentMethod === 'card' && <View style={styles.radioDot} />}
                </View>
                <View style={styles.paymentIconBox}>
                  <MaterialCommunityIcons name="credit-card-outline" size={20} color="#0F172A" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.paymentMethodTitle}>Credit / Debit Card</Text>
                  <Text style={styles.paymentMethodSub}>Visa, Mastercard, RuPay, Maestro</Text>
                  <View style={styles.cardBadgesRow}>
                    <View style={[styles.brandBadge, { backgroundColor: '#1A1F71' }]}>
                      <Text style={[styles.brandBadgeText, { color: '#FFFFFF', fontStyle: 'italic', fontWeight: '600' }]}>VISA</Text>
                    </View>
                    <View style={[styles.brandBadge, { backgroundColor: '#EB001B' }]}>
                      <Text style={[styles.brandBadgeText, { color: '#FF5F00', fontWeight: '600' }]}>●●</Text>
                    </View>
                    <View style={[styles.brandBadge, { backgroundColor: '#00529B' }]}>
                      <Text style={[styles.brandBadgeText, { color: '#F7A800', fontWeight: '600' }]}>RuPay</Text>
                    </View>
                  </View>
                </View>
              </View>
            </TouchableOpacity>

            {/* Method 3: Wallet */}
            <TouchableOpacity
              style={[styles.paymentMethodCard, paymentMethod === 'wallet' && styles.paymentMethodCardSelected]}
              activeOpacity={0.8}
              onPress={() => setPaymentMethod('wallet')}
            >
              <View style={styles.paymentMethodTop}>
                <View style={[styles.radioCircle, paymentMethod === 'wallet' && styles.radioCircleSelected]}>
                  {paymentMethod === 'wallet' && <View style={styles.radioDot} />}
                </View>
                <View style={[styles.paymentIconBox, { backgroundColor: '#0F172A' }]}>
                  <MaterialCommunityIcons name="wallet-outline" size={18} color="#FFFFFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.paymentMethodTitle}>Wallet</Text>
                  <Text style={styles.paymentMethodSub}>Use your CONZAA wallet</Text>
                  <Text style={styles.walletBalanceText}>Available balance: ₹{walletBalance}</Text>
                </View>
                <TouchableOpacity
                  style={styles.addMoneyBtn}
                  activeOpacity={0.7}
                  onPress={() => navigation.navigate('Wallet')}
                >
                  <Text style={styles.addMoneyBtnText}>Add Money</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>

            {/* Method 4: Cash on Delivery / Pay After Service */}
            <TouchableOpacity
              style={[styles.paymentMethodCard, paymentMethod === 'cod' && styles.paymentMethodCardSelected]}
              activeOpacity={0.8}
              onPress={() => setPaymentMethod('cod')}
            >
              <View style={styles.paymentMethodTop}>
                <View style={[styles.radioCircle, paymentMethod === 'cod' && styles.radioCircleSelected]}>
                  {paymentMethod === 'cod' && <View style={styles.radioDot} />}
                </View>
                <View style={[styles.paymentIconBox, { backgroundColor: '#0F172A' }]}>
                  <MaterialCommunityIcons name="cash-multiple" size={18} color="#FFFFFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.paymentMethodTitle}>Cash / Pay After Service</Text>
                  <Text style={styles.paymentMethodSub}>Pay after the work is completed</Text>
                </View>
                <View style={styles.popularBadge}>
                  <Text style={styles.popularBadgeText}>Popular</Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* Booking Policies Section */}
            <View style={[styles.sectionHeaderRow, { marginTop: 22 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <MaterialCommunityIcons name="shield-check-outline" size={18} color="#0F172A" />
                <Text style={styles.sectionTitle}>Booking Policies</Text>
              </View>
            </View>

            <View style={styles.policiesCard}>
              <View style={styles.policyRow}>
                <MaterialCommunityIcons name="calendar-clock-outline" size={18} color="#475569" />
                <Text style={styles.policyText}>Free cancellation before work starts</Text>
              </View>
              <View style={styles.policyRow}>
                <MaterialCommunityIcons name="clock-outline" size={18} color="#475569" />
                <Text style={styles.policyText}>You will be charged for actual working time</Text>
              </View>
              <View style={styles.policyRow}>
                <MaterialCommunityIcons name="shield-check-outline" size={18} color="#475569" />
                <Text style={styles.policyText}>Verified and background-checked labourers</Text>
              </View>
              <View style={styles.policyRow}>
                <MaterialCommunityIcons name="headphones" size={18} color="#475569" />
                <Text style={styles.policyText}>24/7 customer support</Text>
              </View>
            </View>

            {/* Terms and conditions Checkbox */}
            <TouchableOpacity
              style={styles.termsRow}
              activeOpacity={0.8}
              onPress={() => setAgreeTerms(!agreeTerms)}
            >
              <MaterialCommunityIcons
                name={agreeTerms ? 'checkbox-marked' : 'checkbox-blank-outline'}
                size={20}
                color={agreeTerms ? '#2563EB' : '#94A3B8'}
              />
              <Text style={styles.termsText}>
                I agree to the <Text style={styles.termsLink}>Terms & Conditions</Text> and{' '}
                <Text style={styles.termsLink}>Privacy Policy</Text>
              </Text>
            </TouchableOpacity>

            <View style={{ height: 110 }} />
          </>
        )}
      </ScrollView>

      {/* ========================================================================= */}
      {/*                             BOTTOM ACTION BAR                             */}
      {/* ========================================================================= */}
      {currentStep === 1 ? (
        <View style={styles.bottomBarSingle}>
          <TouchableOpacity
            style={styles.continueBtn}
            activeOpacity={0.88}
            onPress={handleContinueToPayment}
          >
            <Text style={styles.continueBtnText}>Continue to Payment  →</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.bottomBarDual}>
          <View style={styles.bottomPriceCol}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={styles.bottomTotalAmount}>₹{estimatedTotal}</Text>
              <MaterialCommunityIcons name="information-outline" size={15} color="#64748B" />
            </View>
            <Text style={styles.bottomTotalSub}>Estimated Total</Text>
          </View>

          <View style={styles.bottomActionCol}>
            <TouchableOpacity
              style={styles.confirmBookingBtn}
              activeOpacity={0.88}
              onPress={handleConfirmBooking}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#0F172A" />
              ) : (
                <Text style={styles.confirmBookingText}>Confirm Booking  →</Text>
              )}
            </TouchableOpacity>
            <Text style={styles.cancelAnytimeText}>You can cancel anytime before work starts</Text>
          </View>
        </View>
      )}

      {/* Saved Address Sheet Modal */}
      <SavedAddressSheet
        visible={savedAddressSheetVisible}
        onClose={() => setSavedAddressSheetVisible(false)}
        onSelect={handleSavedAddressSelect}
        currentLat={lat}
        currentLng={lng}
        currentAddress={fullDisplayAddress}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FAFAF7',
  },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerBackBtn: {
    padding: 6,
    marginLeft: -6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  secureBookingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  secureBookingText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
  },

  // ── Stepper ───────────────────────────────────────────────────────────────
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  stepItem: {
    alignItems: 'center',
  },
  stepCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  stepCircleActive: {
    backgroundColor: '#F59E0B',
  },
  stepCircleDone: {
    backgroundColor: '#F59E0B',
  },
  stepCircleInactive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  stepNumberActive: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
  },
  stepNumberInactive: {
    fontSize: 12,
    fontWeight: '500',
    color: '#94A3B8',
  },
  stepLabel: {
    fontSize: 11,
    fontWeight: '400',
    color: '#94A3B8',
  },
  stepLabelActive: {
    fontWeight: '600',
    color: '#0F172A',
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 12,
    marginBottom: 16,
  },
  stepLineActive: {
    backgroundColor: '#F59E0B',
  },
  stepLineInactive: {
    backgroundColor: '#E2E8F0',
  },

  // ── Scroll Content ────────────────────────────────────────────────────────
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  // ── Worker Card ───────────────────────────────────────────────────────────
  workerCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 16,
  },
  workerAvatarContainer: {
    width: 68,
    height: 68,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
    marginRight: 12,
  },
  workerAvatarImage: {
    width: '100%',
    height: '100%',
  },
  workerDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  workerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  workerName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
  workerCategory: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  workerRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginBottom: 4,
  },
  workerRatingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
  },
  workerReviewsText: {
    fontSize: 11,
    color: '#64748B',
  },
  workerMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  workerMetaText: {
    fontSize: 11,
    color: '#475569',
  },
  workerPriceCol: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  workerHourlyPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
  },
  workerTravelCharge: {
    fontSize: 10,
    color: '#64748B',
    marginBottom: 6,
  },
  availableBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  availableBadgeText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#059669',
  },

  // ── Sections Header ───────────────────────────────────────────────────────
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
  sectionSubTitle: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 10,
    marginTop: -4,
  },

  // ── Booking Type Cards ────────────────────────────────────────────────────
  bookingTypeContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  bookingTypeCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  bookingTypeCardSelected: {
    borderColor: '#F59E0B',
    backgroundColor: '#FFFDF0',
  },
  bookingTypeCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: '#F59E0B',
  },
  radioDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#F59E0B',
  },
  bookingTypeTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
    marginLeft: 4,
    flexShrink: 1,
  },
  recommendedBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 6,
    marginBottom: 6,
  },
  recommendedBadgeText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#059669',
  },
  bookingTypeDesc: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 15,
  },

  // ── Schedule ──────────────────────────────────────────────────────────────
  scheduleInfoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FEF3C7',
    gap: 10,
    marginBottom: 10,
  },
  scheduleIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scheduleInfoTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 2,
  },
  scheduleInfoText: {
    fontSize: 11,
    color: '#B45309',
    lineHeight: 15,
  },
  scheduleSelectorsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  selectorBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  selectorLabel: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '400',
  },
  selectorValue: {
    fontSize: 12,
    fontWeight: '500',
    color: '#0F172A',
    marginTop: 1,
  },

  // ── Work Location ─────────────────────────────────────────────────────────
  changeLinkText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#2563EB',
  },
  locationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  locationHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  homeIconBox: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  locationLabelText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 2,
  },
  locationAddressText: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 17,
  },
  miniMapContainer: {
    height: 86,
    borderRadius: 10,
    overflow: 'hidden',
    marginTop: 12,
    position: 'relative',
    backgroundColor: '#E2E8F0',
  },
  miniMapImage: {
    width: '100%',
    height: '100%',
  },
  miniMapPinWrap: {
    position: 'absolute',
    top: '32%',
    left: '48%',
    marginLeft: -16,
    marginTop: -16,
  },
  viewOnMapPill: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  viewOnMapText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#0F172A',
  },

  // ── Notes ─────────────────────────────────────────────────────────────────
  notesContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
  },
  notesInput: {
    height: 64,
    fontSize: 13,
    color: '#0F172A',
    textAlignVertical: 'top',
    padding: 0,
  },
  notesCharCount: {
    fontSize: 10,
    color: '#94A3B8',
    alignSelf: 'flex-end',
    marginTop: 4,
  },

  // ── Step 2: Price Summary ─────────────────────────────────────────────────
  priceSummaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  priceSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  priceSummaryLabel: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '400',
  },
  priceSummaryValue: {
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '500',
  },
  estimatedTotalBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginVertical: 4,
  },
  estimatedTotalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  estimatedTotalValue: {
    fontSize: 17,
    fontWeight: '600',
    color: '#0F172A',
  },
  estimateDisclaimerBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
    gap: 8,
  },
  estimateDisclaimerText: {
    flex: 1,
    fontSize: 11,
    color: '#1E40AF',
    lineHeight: 16,
  },

  // ── Step 2: Payment Methods ───────────────────────────────────────────────
  paymentMethodCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  paymentMethodCardSelected: {
    borderColor: '#F59E0B',
    backgroundColor: '#FFFDF0',
  },
  paymentMethodTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  paymentIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  upiLogoBox: {
    width: 34,
    height: 22,
    borderRadius: 4,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  upiLogoText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    fontStyle: 'italic',
  },
  paymentMethodTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  paymentMethodSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  upiBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  cardBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: '#F1F5F9',
  },
  brandBadgeText: {
    fontSize: 10,
    fontWeight: '500',
  },
  walletBalanceText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#475569',
    marginTop: 4,
  },
  addMoneyBtn: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addMoneyBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563EB',
  },
  popularBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  popularBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#059669',
  },

  // ── Step 2: Policies ──────────────────────────────────────────────────────
  policiesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  policyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  policyText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '400',
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
    marginBottom: 8,
  },
  termsText: {
    fontSize: 12,
    color: '#475569',
  },
  termsLink: {
    color: '#2563EB',
    textDecorationLine: 'underline',
    fontWeight: '400',
  },

  // ── Bottom Action Bars ────────────────────────────────────────────────────
  bottomBarSingle: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 8,
  },
  continueBtn: {
    backgroundColor: '#F59E0B',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },

  bottomBarDual: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 8,
  },
  bottomPriceCol: {
    justifyContent: 'center',
  },
  bottomTotalAmount: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0F172A',
  },
  bottomTotalSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  bottomActionCol: {
    alignItems: 'center',
  },
  confirmBookingBtn: {
    backgroundColor: '#F59E0B',
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 22,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 170,
  },
  confirmBookingText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
  cancelAnytimeText: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 4,
  },
});

export default LabourCheckoutScreen;