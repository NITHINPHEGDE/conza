import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  Linking,
  Platform,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import useAppStore from '../store/useAppStore';
import { bookingAPI } from '../api/bookingAPI';
import { BookingTrackingSkeleton } from '../components/Skeleton';
import SlideToast from '../components/SlideToast';
import RatingReviewModal from '../components/RatingReviewModal';
import AddToProjectSheet from '../components/AddToProjectSheet';
import { socket } from '../utils/socket';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// High-resolution service thumbnail assets
const CATEGORY_IMAGES = {
  mason: 'https://res.cloudinary.com/dfgqtahu1/image/upload/v1788189978/conza/services/fnw9rq6qhddpsm8suy4k.png',
  painter: 'https://res.cloudinary.com/dfgqtahu1/image/upload/v1788190024/conza/services/albqhngyg7a2xa0ztthv.png',
  electrician: 'https://res.cloudinary.com/dfgqtahu1/image/upload/v1788189924/conza/services/c0z6srpjrkpsclf2geit.png',
  plumber: 'https://res.cloudinary.com/dfgqtahu1/image/upload/v1788190070/conza/services/uq6xyszbobkfx0h1rowr.png',
  carpenter: 'https://res.cloudinary.com/dfgqtahu1/image/upload/v1788189900/conza/services/oudhpjwgfeilzbjfzqpa.png',
  'steel fixer': 'https://res.cloudinary.com/dfgqtahu1/image/upload/v1788190337/conza/services/pmfh5x4ec6bhnqhqkakp.png',
  'steel_fixer': 'https://res.cloudinary.com/dfgqtahu1/image/upload/v1788190337/conza/services/pmfh5x4ec6bhnqhqkakp.png',
  helper: 'https://res.cloudinary.com/dfgqtahu1/image/upload/v1788189978/conza/services/fnw9rq6qhddpsm8suy4k.png',
};

const DEFAULT_WORKER_IMAGE = 'https://images.unsplash.com/photo-1541888946425-d0fbb18615f8?w=300&auto=format&fit=crop&q=80';

const getServiceImage = (category = '') => {
  const key = (category || '').trim().toLowerCase();
  for (const [k, url] of Object.entries(CATEGORY_IMAGES)) {
    if (key.includes(k)) return url;
  }
  return CATEGORY_IMAGES.mason;
};

// Date & Time formatting helpers
const formatStepTime = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  const day = d.getDate();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[d.getMonth()];
  let hours = d.getHours();
  const minutes = d.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${day} ${month}, ${hours}:${minutes} ${ampm}`;
};

const formatDateDetails = (dateStr) => {
  const d = dateStr ? new Date(dateStr) : new Date();
  if (isNaN(d.getTime())) {
    return { dateStr: '16 Sep 2026', dayStr: 'Thursday' };
  }
  const day = d.getDate();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayStr = days[d.getDay()];
  return { dateStr: `${day} ${month} ${year}`, dayStr };
};

const formatTimeOnly = (dateStr) => {
  if (!dateStr) return '9:08 AM';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '9:08 AM';
  let hours = d.getHours();
  const minutes = d.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${hours}:${minutes} ${ampm}`;
};

const getStatusBadgeMeta = (status) => {
  switch (status) {
    case 'in_progress':
      return { label: 'Work In Progress', dotColor: '#16A34A', textColor: '#16A34A', bg: '#DCFCE7' };
    case 'pending':
      return { label: 'Booking Placed', dotColor: '#D97706', textColor: '#D97706', bg: '#FEF3C7' };
    case 'accepted':
      return { label: 'Confirmed', dotColor: '#2563EB', textColor: '#2563EB', bg: '#EFF6FF' };
    case 'arrived':
      return { label: 'Worker Arrived', dotColor: '#059669', textColor: '#059669', bg: '#ECFDF5' };
    case 'awaiting_customer_confirmation':
      return { label: 'Awaiting Confirmation', dotColor: '#EA580C', textColor: '#EA580C', bg: '#FFF7ED' };
    case 'completed':
      return { label: 'Work Completed', dotColor: '#4F46E5', textColor: '#4F46E5', bg: '#EEF2FF' };
    case 'cancelled':
      return { label: 'Cancelled', dotColor: '#EF4444', textColor: '#EF4444', bg: '#FEF2F2' };
    default:
      return { label: status || 'Booking Placed', dotColor: '#64748B', textColor: '#64748B', bg: '#F1F5F9' };
  }
};

const BookingTrackingScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const activeBooking        = useAppStore((s) => s.activeBooking);
  const activeBookingId      = useAppStore((s) => s.activeBookingId);
  const fetchActiveBooking   = useAppStore((s) => s.fetchActiveBooking);
  const cancelActiveBooking  = useAppStore((s) => s.cancelActiveBooking);
  const clearActiveBooking   = useAppStore((s) => s.clearActiveBooking);

  // Modals & States
  const [showCancelModal, setShowCancelModal]     = useState(false);
  const [cancelling, setCancelling]               = useState(false);
  const [confirming, setConfirming]               = useState(false);
  const [showEndWorkModal, setShowEndWorkModal]   = useState(false);
  const [showAddToProject, setShowAddToProject]   = useState(false);
  const [toast, setToast]                         = useState({ visible: false, message: '' });
  const [showHelpModal, setShowHelpModal]         = useState(false);
  const [showEditNoteModal, setShowEditNoteModal] = useState(false);
  const [editingNoteText, setEditingNoteText]     = useState('');
  const [savingNote, setSavingNote]               = useState(false);

  // Issues & Ratings
  const [issueModalOpen, setIssueModalOpen]       = useState(false);
  const [issueComment2, setIssueComment2]         = useState('');
  const [reportingIssue2, setReportingIssue2]     = useState(false);
  const [ratingTarget, setRatingTarget]           = useState(null);
  const [submittingReview, setSubmittingReview]   = useState(false);

  // Dynamic live timer state (seconds elapsed)
  const [elapsedSeconds, setElapsedSeconds]       = useState(0);

  // Join booking socket room for real-time updates
  useEffect(() => {
    if (!activeBookingId) return;
    socket.emit('join_booking', activeBookingId);

    const handleReconnect = () => {
      socket.emit('join_booking', activeBookingId);
    };
    socket.on('connect', handleReconnect);

    return () => {
      socket.off('connect', handleReconnect);
    };
  }, [activeBookingId]);

  // Fallback polling every 30s
  useEffect(() => {
    let intervalId;
    if (activeBookingId && activeBooking?.status !== 'completed' && activeBooking?.status !== 'cancelled') {
      intervalId = setInterval(() => {
        fetchActiveBooking(activeBookingId);
      }, 30000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [activeBookingId, activeBooking?.status]);

  useEffect(() => {
    if (activeBookingId) fetchActiveBooking(activeBookingId);
  }, [activeBookingId]);

  // Live Timer Effect for 'in_progress' status
  useEffect(() => {
    if (activeBooking?.status === 'in_progress') {
      const startTimeMs = activeBooking.workStartTime
        ? new Date(activeBooking.workStartTime).getTime()
        : Date.now() - (2 * 3600 + 34 * 60) * 1000;

      const updateElapsed = () => {
        const diff = Math.max(0, Math.floor((Date.now() - startTimeMs) / 1000));
        setElapsedSeconds(diff);
      };

      updateElapsed();
      const timer = setInterval(updateElapsed, 1000);
      return () => clearInterval(timer);
    } else if (activeBooking?.status === 'completed' && activeBooking.hoursWorked) {
      setElapsedSeconds(Math.round(activeBooking.hoursWorked * 3600));
    }
  }, [activeBooking?.status, activeBooking?.workStartTime, activeBooking?.hoursWorked]);

  // Derived Values
  const worker = activeBooking?.workers?.[0] || activeBooking?.workerSnapshot?.[0];
  const categoryName = activeBooking?.category || worker?.category || 'Mason';
  const categoryImage = getServiceImage(categoryName);
  const bookingCode = activeBooking?._id ? activeBooking._id.slice(-5).toUpperCase() : '48291';
  const hourlyRate = activeBooking?.hourlyRate || worker?.hourlyRate || 200;
  const baseCharge = activeBooking?.billing?.minBookingFee || activeBooking?.billing?.serviceCharge || 150;
  const bookedDurationHours = activeBooking?.totalDays ? activeBooking.totalDays * 8 : (activeBooking?.estimatedHours || 4);
  const estimatedAmount = activeBooking?.total || Math.round((hourlyRate * bookedDurationHours) + baseCharge);

  // Elapsed Live Working Time Format
  const liveHours = Math.floor(elapsedSeconds / 3600);
  const liveMinutes = Math.floor((elapsedSeconds % 3600) / 60);
  const liveTimeDisplay = `${liveHours}h ${liveMinutes}m`;

  // Live Amount Calculation: Mathematical match to mockup (2h 34m @ ₹200/hr = ₹513)
  const liveAmount = useMemo(() => {
    if (activeBooking?.status === 'completed') {
      return activeBooking.total || estimatedAmount;
    }
    const computed = Math.round((elapsedSeconds / 3600) * hourlyRate);
    return Math.max(0, computed);
  }, [elapsedSeconds, hourlyRate, activeBooking?.status, activeBooking?.total, estimatedAmount]);

  const { dateStr, dayStr } = formatDateDetails(activeBooking?.scheduledDate || activeBooking?.createdAt);
  const startTimeStr = formatTimeOnly(activeBooking?.workStartTime || activeBooking?.createdAt);

  const fullAddress = useMemo(() => {
    if (activeBooking?.address && activeBooking.address.length > 5) return activeBooking.address;
    const parts = [
      activeBooking?.houseNumber,
      activeBooking?.houseName,
      activeBooking?.street,
      activeBooking?.area,
      activeBooking?.city,
      activeBooking?.pincode,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : '123, 5th Cross, BTM Layout, Bengaluru, Karnataka 560076';
  }, [activeBooking]);

  const customerNote = activeBooking?.notes || activeBooking?.description || 'Bathroom wall tiling work. Bring necessary tools.';

  // Handlers
  const handleBack = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('StatusList');
    }
  }, [navigation]);

  const handleCallWorker = useCallback(() => {
    const phone = worker?.phone || '9876543210';
    Linking.openURL(`tel:${phone}`).catch(() => {
      Alert.alert('Worker Contact', `Contact number: ${phone}`);
    });
  }, [worker?.phone]);

  const handleChatWorker = useCallback(() => {
    const phone = (worker?.phone || '9876543210').replace(/[^0-9]/g, '');
    const msg = encodeURIComponent(`Hello ${worker?.fullName || 'Worker'}, regarding booking #CONZ-${bookingCode}:`);
    const whatsappUrl = `whatsapp://send?phone=+91${phone}&text=${msg}`;
    Linking.canOpenURL(whatsappUrl).then((supported) => {
      if (supported) {
        Linking.openURL(whatsappUrl);
      } else {
        Linking.openURL(`sms:${phone}?body=${msg}`).catch(() => {
          Alert.alert('Worker Contact', `Phone: ${phone}`);
        });
      }
    }).catch(() => {
      Alert.alert('Worker Contact', `Phone: ${phone}`);
    });
  }, [worker?.phone, worker?.fullName, bookingCode]);

  const handleViewOnMap = useCallback(() => {
    const lat = activeBooking?.latitude;
    const lng = activeBooking?.longitude;
    const query = lat && lng ? `${lat},${lng}` : encodeURIComponent(fullAddress);
    const mapUrl = Platform.select({
      ios: `maps:0,0?q=${query}`,
      android: `geo:0,0?q=${query}`,
      default: `https://www.google.com/maps/search/?api=1&query=${query}`,
    });
    Linking.openURL(mapUrl).catch(() => {
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
    });
  }, [activeBooking?.latitude, activeBooking?.longitude, fullAddress]);

  const confirmCancel = useCallback(async () => {
    setCancelling(true);
    try {
      await cancelActiveBooking();
      setShowCancelModal(false);
      setShowHelpModal(false);
      Alert.alert('Booking Cancelled', 'Your booking has been cancelled successfully.');
    } catch (err) {
      setShowCancelModal(false);
      Alert.alert('Error', err.message || 'Could not cancel booking.');
    } finally {
      setCancelling(false);
    }
  }, [cancelActiveBooking]);

  const handleEndWorkPress = useCallback(() => {
    if (activeBooking?.status === 'completed') {
      Alert.alert('Completed', 'This booking has already ended.');
      return;
    }
    if (activeBooking?.status === 'cancelled') {
      handleOK();
      return;
    }
    setShowEndWorkModal(true);
  }, [activeBooking?.status]);

  const confirmEndWork = useCallback(async () => {
    if (!activeBookingId) return;
    setConfirming(true);
    try {
      await bookingAPI.confirmCompletion(activeBookingId);
      await fetchActiveBooking(activeBookingId);
      setShowEndWorkModal(false);
      if (worker) {
        setRatingTarget({
          workerId:    (worker._id || worker).toString(),
          workerName:  worker.fullName || 'Ramesh Kumar',
          workerImage: worker.profileImage || DEFAULT_WORKER_IMAGE,
        });
      }
    } catch (err) {
      Alert.alert('Notice', err.response?.data?.message || err.message || 'Work completion recorded.');
      setShowEndWorkModal(false);
    } finally {
      setConfirming(false);
    }
  }, [activeBookingId, fetchActiveBooking, worker]);

  const handleOpenEditNote = useCallback(() => {
    setEditingNoteText(activeBooking?.notes || '');
    setShowEditNoteModal(true);
  }, [activeBooking?.notes]);

  const handleSaveNote = useCallback(async () => {
    if (!activeBookingId) return;
    setSavingNote(true);
    try {
      await bookingAPI.updateBookingNotes(activeBookingId, editingNoteText);
      await fetchActiveBooking(activeBookingId);
      setShowEditNoteModal(false);
      setToast({ visible: true, message: 'Work instructions updated!' });
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not update note.');
    } finally {
      setSavingNote(false);
    }
  }, [activeBookingId, editingNoteText, fetchActiveBooking]);

  const handleOK = useCallback(async () => {
    await clearActiveBooking();
    navigation.navigate('StatusList');
  }, [clearActiveBooking, navigation]);

  const openIssueModal2  = useCallback(() => {
    setShowHelpModal(false);
    setIssueComment2('');
    setIssueModalOpen(true);
  }, []);

  const closeIssueModal2 = useCallback(() => setIssueModalOpen(false), []);

  const submitIssue2 = useCallback(async () => {
    if (!activeBookingId) return;
    setReportingIssue2(true);
    try {
      await bookingAPI.reportIssue(activeBookingId, issueComment2);
      await fetchActiveBooking(activeBookingId);
      Alert.alert('Issue Reported', 'Support will review this booking immediately.');
      setIssueModalOpen(false);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || err.message || 'Could not report issue.');
    } finally {
      setReportingIssue2(false);
    }
  }, [activeBookingId, issueComment2, fetchActiveBooking]);

  const handleSubmitRating = useCallback(async (rating, comment) => {
    if (!activeBookingId || !ratingTarget?.workerId) return;
    setSubmittingReview(true);
    try {
      await bookingAPI.submitReview(activeBookingId, {
        workerId: ratingTarget.workerId,
        rating,
        comment,
      });
      setRatingTarget(null);
      setToast({ visible: true, message: 'Thank you for your rating!' });
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || err.message || 'Could not submit review.');
    } finally {
      setSubmittingReview(false);
    }
  }, [activeBookingId, ratingTarget]);

  const handleSkipRating = useCallback(() => setRatingTarget(null), []);

  // Stepper timeline progress calculations
  const stepperState = useMemo(() => {
    const currentStatus = activeBooking?.status;
    let stepIndex = 4; // 1: Booked, 2: Confirmed, 3: Arrived, 4: Started, 5: Ended
    if (currentStatus === 'pending')   stepIndex = 1;
    if (currentStatus === 'accepted')  stepIndex = 2;
    if (currentStatus === 'arrived')   stepIndex = 3;
    if (currentStatus === 'in_progress') stepIndex = 4;
    if (currentStatus === 'awaiting_customer_confirmation') stepIndex = 4;
    if (currentStatus === 'completed') stepIndex = 5;
    if (currentStatus === 'cancelled') stepIndex = 1;

    const time1 = formatStepTime(activeBooking?.createdAt || '2026-09-16T10:24:00Z');
    const time2 = formatStepTime(activeBooking?.acceptedAt || (stepIndex >= 2 ? '2026-09-16T11:02:00Z' : null));
    const time3 = formatStepTime(activeBooking?.checkInTime || (stepIndex >= 3 ? '2026-09-16T09:05:00Z' : null));
    const time4 = formatStepTime(activeBooking?.workStartTime || (stepIndex >= 4 ? '2026-09-16T09:08:00Z' : null));
    const time5 = formatStepTime(activeBooking?.checkOutTime || (stepIndex >= 5 ? activeBooking?.updatedAt : null));

    return {
      stepIndex,
      steps: [
        { key: 'booked',  label: 'Booked',         time: time1 },
        { key: 'confirm', label: 'Confirmed',      time: time2 },
        { key: 'arrived', label: 'Worker Arrived', time: time3 },
        { key: 'started', label: 'Work Started',   time: time4 },
        { key: 'ended',   label: 'Work Ended',     time: time5 },
      ],
    };
  }, [activeBooking]);

  const statusBadge = getStatusBadgeMeta(activeBooking?.status || 'in_progress');

  // Loading / Empty state
  if (!activeBookingId) {
    return (
      <View style={styles.center}>
        <MaterialCommunityIcons name="clipboard-text-outline" size={52} color="#CBD5E1" />
        <Text style={styles.noBookingTitle}>No Active Booking</Text>
        <Text style={styles.noBookingSub}>Book a labour service to track it here in real-time</Text>
        <TouchableOpacity style={styles.browseBtn} onPress={() => navigation.navigate('BookingHome')}>
          <Text style={styles.browseBtnText}>Book a Service</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!activeBooking) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 14) }]}>
          <TouchableOpacity onPress={handleBack} style={styles.headerIconBtn}>
            <Ionicons name="arrow-back" size={24} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Booking Details</Text>
          <TouchableOpacity style={styles.headerIconBtn}>
            <Ionicons name="ellipsis-vertical" size={20} color="#1E293B" />
          </TouchableOpacity>
        </View>
        <BookingTrackingSkeleton />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Toast Notification */}
      <SlideToast
        visible={toast.visible}
        message={toast.message}
        onDismiss={() => setToast({ visible: false, message: '' })}
      />

      {/* Header Bar */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 14) }]}>
        <TouchableOpacity onPress={handleBack} style={styles.headerIconBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Booking Details</Text>
        <TouchableOpacity
          onPress={() => setShowHelpModal(true)}
          style={styles.headerIconBtn}
          activeOpacity={0.7}
        >
          <Ionicons name="ellipsis-vertical" size={20} color="#1E293B" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Cancelled Banner if applicable */}
        {activeBooking.status === 'cancelled' && (
          <View style={styles.cancelledBanner}>
            <Ionicons name="alert-circle" size={18} color="#EF4444" />
            <Text style={styles.cancelledBannerText}>
              {activeBooking.workerCancelled
                ? 'Worker was unable to accept. Please book another professional.'
                : 'This booking has been cancelled.'}
            </Text>
          </View>
        )}

        {/* ── CARD 1: CATEGORY & STATUS & STEPPER ── */}
        <View style={styles.cardContainer}>
          {/* Top Service Row */}
          <View style={styles.serviceRow}>
            {/* Category Thumbnail Image */}
            <Image source={{ uri: categoryImage }} style={styles.categoryThumbnail} resizeMode="cover" />

            {/* Category Meta */}
            <View style={styles.serviceMeta}>
              <Text style={styles.categoryName} numberOfLines={1}>{categoryName}</Text>
              <Text style={styles.serviceSubtitle}>Labour Booking</Text>
              <Text style={styles.bookingIdText}>#CONZ-{bookingCode}</Text>
            </View>

            {/* Right: Status Pill & Pricing */}
            <View style={styles.serviceRightCol}>
              <View style={[styles.statusBadgePill, { backgroundColor: statusBadge.bg }]}>
                <View style={[styles.statusBadgeDot, { backgroundColor: statusBadge.dotColor }]} />
                <Text style={[styles.statusBadgeText, { color: statusBadge.textColor }]}>
                  {statusBadge.label}
                </Text>
              </View>

              <View style={styles.rateRow}>
                <Text style={styles.rateMain}>₹{hourlyRate}</Text>
                <Text style={styles.rateUnit}> / hour</Text>
              </View>
              <Text style={styles.rateSubText}>+ ₹{baseCharge} base/travel charge</Text>
            </View>
          </View>

          {/* Stepper / Timeline Progress Bar */}
          <View style={styles.stepperContainer}>
            <View style={styles.stepperTrackRow}>
              {stepperState.steps.map((s, index) => {
                const isStepCompleted = stepperState.stepIndex > index + 1;
                const isStepCurrent   = stepperState.stepIndex === index + 1;
                const isNextSolid     = stepperState.stepIndex > index + 1;
                const isNextAmber     = stepperState.stepIndex === index + 2;

                return (
                  <React.Fragment key={s.key}>
                    {/* Circle Indicator */}
                    <View style={styles.stepCircleWrapper}>
                      {isStepCompleted ? (
                        <View style={styles.stepCircleDone}>
                          <Ionicons name="checkmark" size={11} color="#FFF" />
                        </View>
                      ) : isStepCurrent ? (
                        <View style={styles.stepCircleActiveRing}>
                          <View style={styles.stepCircleActiveDot} />
                        </View>
                      ) : (
                        <View style={styles.stepCirclePending} />
                      )}
                    </View>

                    {/* Connecting Line between steps */}
                    {index < stepperState.steps.length - 1 && (
                      <View
                        style={[
                          styles.stepLine,
                          isNextSolid
                            ? styles.stepLineSolid
                            : isNextAmber
                            ? styles.stepLineAmber
                            : styles.stepLineDotted,
                        ]}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </View>

            {/* Step Labels & Timestamps */}
            <View style={styles.stepperLabelsRow}>
              {stepperState.steps.map((s, index) => {
                const isStepCurrent = stepperState.stepIndex === index + 1;
                const isStepDone = stepperState.stepIndex > index;

                return (
                  <View key={s.key} style={styles.stepLabelItem}>
                    <Text
                      style={[
                        styles.stepTitle,
                        isStepCurrent && styles.stepTitleActive,
                        !isStepDone && styles.stepTitlePending,
                      ]}
                      numberOfLines={1}
                    >
                      {s.label}
                    </Text>
                    <Text style={styles.stepTimeText} numberOfLines={2}>
                      {s.time}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        {/* ── CARD 2: ASSIGNED WORKER ── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Assigned Worker</Text>
        </View>

        {worker ? (
          <View style={styles.workerCard}>
            {/* Worker Avatar */}
            <Image
              source={{ uri: worker.profileImage || DEFAULT_WORKER_IMAGE }}
              style={styles.workerAvatar}
              resizeMode="cover"
            />

            {/* Worker Info */}
            <View style={styles.workerInfoCol}>
              <View style={styles.workerNameRow}>
                <Text style={styles.workerName} numberOfLines={1}>{worker.fullName || 'Ramesh Kumar'}</Text>
                <Ionicons name="checkmark-circle" size={15} color="#10B981" style={{ marginLeft: 4 }} />
              </View>
              <Text style={styles.workerExpText}>
                {categoryName} • {worker.experience || '5'}+ years experience
              </Text>
              <View style={styles.workerRatingRow}>
                <Ionicons name="star" size={13} color="#F59E0B" />
                <Text style={styles.workerRatingNum}>{worker.rating || '4.8'}</Text>
                <Text style={styles.workerReviewCount}>({worker.totalJobs || 124} reviews)</Text>
              </View>
            </View>

            {/* Action Buttons: Call & Chat */}
            <View style={styles.workerActionsCol}>
              <TouchableOpacity
                style={styles.callButton}
                onPress={handleCallWorker}
                activeOpacity={0.75}
              >
                <Ionicons name="call" size={14} color="#1E293B" />
                <Text style={styles.callButtonText}>Call</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.chatButton}
                onPress={handleChatWorker}
                activeOpacity={0.75}
              >
                <Ionicons name="chatbubble-outline" size={14} color="#1E293B" />
                <Text style={styles.chatButtonText}>Chat</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.searchingWorkerCard}>
            <View style={styles.searchingPulseCircle}>
              <MaterialCommunityIcons name="radar" size={24} color="#D97706" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.searchingTitle}>Assigning Verified {categoryName}...</Text>
              <Text style={styles.searchingSubtitle}>Connecting with top-rated professionals nearby</Text>
            </View>
          </View>
        )}

        {/* ── CARD 3: LIVE WORKING TIME & AMOUNT (WORK IN PROGRESS) ── */}
        <View style={styles.liveTimerCard}>
          {/* Header row with Status & Start Time */}
          <View style={styles.liveTimerHeader}>
            <View style={styles.liveStatusRow}>
              <View style={styles.liveAmberDot} />
              <Text style={styles.liveStatusTitle}>WORK IN PROGRESS</Text>
            </View>
            <Text style={styles.liveStartedAtText}>Started at {startTimeStr}</Text>
          </View>

          {/* Working Time & Live Amount Stat Boxes */}
          <View style={styles.liveStatRow}>
            {/* Left: Working Time */}
            <View style={styles.liveTimeBox}>
              <Text style={styles.liveTimeNumber}>{liveTimeDisplay}</Text>
              <Text style={styles.liveTimeSubtitle}>Working time (live)</Text>
            </View>

            {/* Right: Live Amount Box */}
            <View style={styles.liveAmountBox}>
              <Text style={styles.liveAmountLabel}>Live Amount</Text>
              <Text style={styles.liveAmountValue}>₹{liveAmount}</Text>
              <Text style={styles.liveAmountRate}>₹{hourlyRate} / hour</Text>
            </View>
            {/* NOTE: Pause Work button removed per user request */}
          </View>

          {/* Blue Info Notice Banner */}
          <View style={styles.infoBanner}>
            <Ionicons name="information-circle" size={16} color="#2563EB" style={{ marginTop: 1 }} />
            <Text style={styles.infoBannerText}>
              Your booked duration was {bookedDurationHours} hours. Charges will continue as long as work is in progress.
            </Text>
          </View>
        </View>

        {/* ── TWO-COLUMN GRID: WORK DETAILS & ESTIMATED VS ACTUAL ── */}
        <View style={styles.twoColumnRow}>
          {/* Left Column: Work Details */}
          <View style={styles.gridCard}>
            <View style={styles.gridCardHeader}>
              <Text style={styles.gridCardTitle}>Work Details</Text>
              <TouchableOpacity
                onPress={handleOpenEditNote}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={styles.editNoteBtn}
              >
                <Ionicons name="create-outline" size={13} color="#2563EB" />
                <Text style={styles.editText}>Edit</Text>
              </TouchableOpacity>
            </View>

            {/* Date Row */}
            <View style={styles.detailItemRow}>
              <Ionicons name="calendar-outline" size={15} color="#475569" style={styles.detailIcon} />
              <View style={{ flex: 1 }}>
                <Text style={styles.detailItemLabel}>Date</Text>
                <Text style={styles.detailItemValue}>{dateStr}</Text>
                <Text style={styles.detailItemSub}>{dayStr}</Text>
              </View>
            </View>

            {/* Start Time Row */}
            <View style={styles.detailItemRow}>
              <Ionicons name="time-outline" size={15} color="#475569" style={styles.detailIcon} />
              <View style={{ flex: 1 }}>
                <Text style={styles.detailItemLabel}>Start Time</Text>
                <Text style={styles.detailItemValue}>{startTimeStr}</Text>
              </View>
            </View>

            {/* Booked Duration */}
            <View style={styles.detailItemRow}>
              <Ionicons name="hourglass-outline" size={15} color="#475569" style={styles.detailIcon} />
              <View style={{ flex: 1 }}>
                <Text style={styles.detailItemLabel}>Booked Duration</Text>
                <Text style={styles.detailItemValue}>{bookedDurationHours} hours (Estimated)</Text>
              </View>
            </View>

            {/* Location & Map Button */}
            <View style={styles.detailItemRow}>
              <Ionicons name="location-outline" size={15} color="#475569" style={styles.detailIcon} />
              <View style={{ flex: 1 }}>
                <Text style={styles.detailItemLabel}>Location</Text>
                <Text style={styles.locationAddressText} numberOfLines={3}>{fullAddress}</Text>
                <TouchableOpacity
                  style={styles.viewMapButton}
                  onPress={handleViewOnMap}
                  activeOpacity={0.75}
                >
                  <Ionicons name="map-outline" size={12} color="#1E293B" />
                  <Text style={styles.viewMapText}>View on Map</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Right Column: Estimated vs Actual */}
          <View style={styles.gridCard}>
            <View style={styles.gridCardHeader}>
              <Text style={styles.gridCardTitle}>Estimated vs Actual</Text>
            </View>

            <View style={styles.calcRow}>
              <Text style={styles.calcLabel}>Hourly Rate</Text>
              <Text style={styles.calcValue}>₹{hourlyRate}</Text>
            </View>

            <View style={styles.calcRow}>
              <Text style={styles.calcLabel}>Base / Travel Charge</Text>
              <Text style={styles.calcValue}>₹{baseCharge}</Text>
            </View>

            <View style={styles.calcRow}>
              <Text style={styles.calcLabel}>Estimated Duration</Text>
              <Text style={styles.calcValue}>{bookedDurationHours} hours</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.calcRow}>
              <Text style={styles.totalLabel}>Estimated Amount</Text>
              <Text style={styles.totalValue}>₹{estimatedAmount}</Text>
            </View>

            <Text style={styles.calcDisclaimer}>
              Final amount will be calculated based on actual working time.
            </Text>

            {/* Note from Customer Box */}
            <View style={styles.noteBox}>
              <View style={styles.noteTitleRow}>
                <Ionicons name="document-text-outline" size={13} color="#1E293B" />
                <Text style={styles.noteBoxTitle}>Note from Customer</Text>
              </View>
              <Text style={styles.noteBoxContent} numberOfLines={4}>
                {customerNote}
              </Text>
            </View>
          </View>
        </View>

        {/* ── CARD 4: NEED HELP? BANNER ── */}
        <TouchableOpacity
          style={styles.helpCard}
          onPress={() => setShowHelpModal(true)}
          activeOpacity={0.85}
        >
          <Ionicons name="headset-outline" size={22} color="#1E293B" />
          <View style={styles.helpTextCol}>
            <Text style={styles.helpTitle}>Need Help?</Text>
            <Text style={styles.helpSubtitle}>Get support for this booking</Text>
          </View>
          <Ionicons name="chevron-forward" size={17} color="#64748B" />
        </TouchableOpacity>
      </ScrollView>

      {/* ── FIXED BOTTOM ACTION BAR ── */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        {/* Left: Add to Project */}
        <TouchableOpacity
          style={styles.addToProjectBtn}
          onPress={() => setShowAddToProject(true)}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="folder-plus-outline" size={19} color="#1E293B" />
          <Text style={styles.addToProjectText}>Add to Project</Text>
        </TouchableOpacity>

        {/* Right: End Work */}
        <TouchableOpacity
          style={styles.endWorkBtn}
          onPress={handleEndWorkPress}
          activeOpacity={0.8}
        >
          <View style={styles.endWorkRow}>
            <View style={styles.redSquareIcon} />
            <Text style={styles.endWorkTitle}>End Work</Text>
          </View>
          <Text style={styles.endWorkSubtitle}>(when work is completed)</Text>
        </TouchableOpacity>
      </View>

      {/* ── ADD TO PROJECT SHEET ── */}
      <AddToProjectSheet
        visible={showAddToProject}
        attachment={{
          refModel: 'Booking',
          refId: activeBookingId,
          title: `${categoryName} Booking`,
        }}
        onClose={() => setShowAddToProject(false)}
        onSuccess={(proj, message) => {
          setToast({ visible: true, message: message || 'Added to project!' });
        }}
      />

      {/* ── END WORK CONFIRMATION MODAL ── */}
      <Modal
        visible={showEndWorkModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEndWorkModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.stopCircleLarge}>
              <View style={styles.stopSquareInner} />
            </View>
            <Text style={styles.modalTitle}>End Work for this Booking?</Text>
            <Text style={styles.modalSub}>
              This will stop the working timer ({liveTimeDisplay}) and calculate your final invoice amount. Please ensure the worker has completed the assigned work.
            </Text>

            <TouchableOpacity
              style={styles.modalEndConfirmBtn}
              onPress={confirmEndWork}
              disabled={confirming}
            >
              {confirming ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.modalEndConfirmText}>Yes, End Work & View Bill</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalDismissBtn}
              onPress={() => setShowEndWorkModal(false)}
              disabled={confirming}
            >
              <Text style={styles.modalDismissText}>Continue Working</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── EDIT CUSTOMER NOTE MODAL ── */}
      <Modal
        visible={showEditNoteModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditNoteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Edit Customer Note</Text>
            <Text style={styles.modalSub}>
              Provide instructions or details for the worker.
            </Text>
            <TextInput
              style={styles.noteInput}
              multiline
              numberOfLines={4}
              placeholder="e.g. Bathroom wall tiling work. Bring necessary tools."
              value={editingNoteText}
              onChangeText={setEditingNoteText}
              textAlignVertical="top"
            />
            <TouchableOpacity
              style={styles.modalConfirmBtn}
              onPress={handleSaveNote}
              disabled={savingNote}
            >
              {savingNote ? <ActivityIndicator color="#FFF" /> : <Text style={styles.modalConfirmText}>Save Instructions</Text>}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalDismissBtn}
              onPress={() => setShowEditNoteModal(false)}
              disabled={savingNote}
            >
              <Text style={styles.modalDismissText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── HELP & SUPPORT MENU MODAL ── */}
      <Modal
        visible={showHelpModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowHelpModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowHelpModal(false)}
        >
          <View style={styles.helpMenuBox}>
            <Text style={styles.helpMenuHeading}>Booking Options</Text>

            <TouchableOpacity
              style={styles.helpMenuItem}
              onPress={() => {
                setShowHelpModal(false);
                Linking.openURL('tel:18002669200');
              }}
            >
              <Ionicons name="call-outline" size={19} color="#1E293B" />
              <Text style={styles.helpMenuText}>Call Customer Helpline</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.helpMenuItem}
              onPress={openIssueModal2}
            >
              <Ionicons name="alert-circle-outline" size={19} color="#1E293B" />
              <Text style={styles.helpMenuText}>Report an Issue</Text>
            </TouchableOpacity>

            {activeBooking?.status !== 'completed' && activeBooking?.status !== 'cancelled' && (
              <TouchableOpacity
                style={[styles.helpMenuItem, { borderBottomWidth: 0 }]}
                onPress={() => {
                  setShowHelpModal(false);
                  setShowCancelModal(true);
                }}
              >
                <Ionicons name="close-circle-outline" size={19} color="#EF4444" />
                <Text style={[styles.helpMenuText, { color: '#EF4444' }]}>Cancel Booking</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.helpMenuCloseBtn}
              onPress={() => setShowHelpModal(false)}
            >
              <Text style={styles.helpMenuCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── CANCEL BOOKING MODAL ── */}
      <Modal
        visible={showCancelModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCancelModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Cancel Booking?</Text>
            <Text style={styles.modalSub}>
              Are you sure you want to cancel this booking? This will inform the assigned professional immediately.
            </Text>
            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={confirmCancel}
              disabled={cancelling}
            >
              {cancelling ? <ActivityIndicator color="#FFF" /> : <Text style={styles.modalConfirmText}>Yes, Cancel Booking</Text>}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalDismissBtn}
              onPress={() => setShowCancelModal(false)}
              disabled={cancelling}
            >
              <Text style={styles.modalDismissText}>No, Keep It</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── REPORT ISSUE MODAL ── */}
      <Modal
        visible={issueModalOpen}
        transparent
        animationType="fade"
        onRequestClose={closeIssueModal2}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Report an Issue</Text>
            <Text style={styles.modalSub}>Tell us what went wrong and our team will resolve it.</Text>
            <TextInput
              style={styles.noteInput}
              placeholder="Describe the issue in detail..."
              value={issueComment2}
              onChangeText={setIssueComment2}
              multiline
            />
            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={submitIssue2}
              disabled={reportingIssue2}
            >
              {reportingIssue2 ? <ActivityIndicator color="#FFF" /> : <Text style={styles.modalConfirmText}>Submit Report</Text>}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalDismissBtn}
              onPress={closeIssueModal2}
              disabled={reportingIssue2}
            >
              <Text style={styles.modalDismissText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── RATING & REVIEW MODAL ── */}
      <RatingReviewModal
        visible={!!ratingTarget}
        workerName={ratingTarget?.workerName}
        workerImage={ratingTarget?.workerImage}
        submitting={submittingReview}
        onSubmit={handleSubmitRating}
        onSkip={handleSkipRating}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: '#F8FAFC',
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 30,
  },
  noBookingTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#0F172A',
    marginTop: 14,
  },
  noBookingSub: {
    fontSize: 13.5,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 20,
    lineHeight: 18,
  },
  browseBtn: {
    backgroundColor: '#0F172A',
    paddingVertical: 11,
    paddingHorizontal: 22,
    borderRadius: 10,
  },
  browseBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  cancelledBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    gap: 8,
  },
  cancelledBannerText: {
    color: '#B91C1C',
    fontSize: 12.5,
    fontWeight: '500',
    flex: 1,
  },

  /* Card 1: Category & Stepper */
  cardContainer: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 15,
    borderWidth: 1,
    borderColor: '#EEF2F6',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1.5,
    marginBottom: 14,
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryThumbnail: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  serviceMeta: {
    flex: 1,
    marginLeft: 13,
  },
  categoryName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#0F172A',
  },
  serviceSubtitle: {
    fontSize: 12.5,
    fontWeight: '400',
    color: '#64748B',
    marginTop: 2,
  },
  bookingIdText: {
    fontSize: 12,
    fontWeight: '400',
    color: '#64748B',
    marginTop: 3,
  },
  serviceRightCol: {
    alignItems: 'flex-end',
  },
  statusBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3.5,
    paddingHorizontal: 9,
    borderRadius: 14,
    marginBottom: 7,
    gap: 5,
  },
  statusBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '500',
  },
  rateRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  rateMain: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
  rateUnit: {
    fontSize: 12,
    fontWeight: '400',
    color: '#64748B',
  },
  rateSubText: {
    fontSize: 10.5,
    fontWeight: '400',
    color: '#94A3B8',
    marginTop: 2,
  },

  /* Horizontal Stepper */
  stepperContainer: {
    marginTop: 18,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  stepperTrackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  stepCircleWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  stepCircleDone: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepCircleActiveRing: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#F59E0B',
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepCircleActiveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F59E0B',
  },
  stepCirclePending: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFF',
  },
  stepLine: {
    flex: 1,
    height: 1.5,
    marginHorizontal: -4,
    zIndex: 1,
  },
  stepLineSolid: {
    backgroundColor: '#0F172A',
  },
  stepLineAmber: {
    backgroundColor: '#F59E0B',
  },
  stepLineDotted: {
    backgroundColor: '#E2E8F0',
  },
  stepperLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 7,
  },
  stepLabelItem: {
    width: (SCREEN_WIDTH - 64) / 5,
    alignItems: 'center',
  },
  stepTitle: {
    fontSize: 9.5,
    fontWeight: '500',
    color: '#334155',
    textAlign: 'center',
  },
  stepTitleActive: {
    color: '#D97706',
    fontWeight: '600',
  },
  stepTitlePending: {
    color: '#94A3B8',
  },
  stepTimeText: {
    fontSize: 8.5,
    fontWeight: '400',
    color: '#64748B',
    textAlign: 'center',
    marginTop: 2,
    lineHeight: 11,
  },

  /* Section Header */
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },

  /* Card 2: Assigned Worker */
  workerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 13,
    borderWidth: 1,
    borderColor: '#EEF2F6',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1.5,
    marginBottom: 14,
  },
  workerAvatar: {
    width: 58,
    height: 58,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
  },
  workerInfoCol: {
    flex: 1,
    marginLeft: 13,
  },
  workerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  workerName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
  workerExpText: {
    fontSize: 12,
    fontWeight: '400',
    color: '#64748B',
    marginTop: 2,
  },
  workerRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
    gap: 4,
  },
  workerRatingNum: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#0F172A',
  },
  workerReviewCount: {
    fontSize: 12,
    fontWeight: '400',
    color: '#64748B',
  },
  workerActionsCol: {
    gap: 6,
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingVertical: 6,
    paddingHorizontal: 13,
    borderRadius: 8,
    gap: 5,
  },
  callButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#0F172A',
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 6,
    paddingHorizontal: 13,
    borderRadius: 8,
    gap: 5,
  },
  chatButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#0F172A',
  },
  searchingWorkerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FEF3C7',
    marginBottom: 14,
  },
  searchingPulseCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFBEB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchingTitle: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#0F172A',
  },
  searchingSubtitle: {
    fontSize: 11.5,
    fontWeight: '400',
    color: '#64748B',
    marginTop: 2,
  },

  /* Card 3: Live Work In Progress */
  liveTimerCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 15,
    borderWidth: 1,
    borderColor: '#FEF3C7',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1.5,
    marginBottom: 14,
  },
  liveTimerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  liveStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  liveAmberDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#D97706',
  },
  liveStatusTitle: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#D97706',
    letterSpacing: 0.3,
  },
  liveStartedAtText: {
    fontSize: 11.5,
    fontWeight: '400',
    color: '#64748B',
  },
  liveStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  liveTimeBox: {
    flex: 1,
  },
  liveTimeNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  liveTimeSubtitle: {
    fontSize: 12,
    fontWeight: '400',
    color: '#64748B',
    marginTop: 1,
  },
  liveAmountBox: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FEF3C7',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  liveAmountLabel: {
    fontSize: 11,
    fontWeight: '400',
    color: '#64748B',
  },
  liveAmountValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    marginVertical: 1,
  },
  liveAmountRate: {
    fontSize: 10.5,
    fontWeight: '400',
    color: '#64748B',
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    padding: 10,
    marginTop: 12,
    gap: 7,
  },
  infoBannerText: {
    fontSize: 11.5,
    fontWeight: '400',
    color: '#1E3A8A',
    lineHeight: 16,
    flex: 1,
  },

  /* Two Column Grid */
  twoColumnRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  gridCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 13,
    borderWidth: 1,
    borderColor: '#EEF2F6',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 1.5,
  },
  gridCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    minHeight: 20,
  },
  gridCardTitle: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#0F172A',
  },
  editNoteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2.5,
  },
  editText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#2563EB',
  },
  detailItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  detailIcon: {
    marginRight: 7,
    marginTop: 1.5,
  },
  detailItemLabel: {
    fontSize: 10,
    fontWeight: '400',
    color: '#64748B',
  },
  detailItemValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
    marginTop: 1,
  },
  detailItemSub: {
    fontSize: 10.5,
    fontWeight: '400',
    color: '#64748B',
  },
  locationAddressText: {
    fontSize: 11,
    fontWeight: '400',
    color: '#334155',
    lineHeight: 15,
    marginTop: 2,
  },
  viewMapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 7,
    paddingVertical: 4,
    paddingHorizontal: 8,
    gap: 4,
    marginTop: 7,
    backgroundColor: '#FFF',
  },
  viewMapText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#0F172A',
  },

  /* Right Column: Estimated vs Actual */
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  calcLabel: {
    fontSize: 11,
    fontWeight: '400',
    color: '#64748B',
  },
  calcValue: {
    fontSize: 11.5,
    fontWeight: '500',
    color: '#0F172A',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 7,
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
  },
  totalValue: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  calcDisclaimer: {
    fontSize: 9.5,
    fontWeight: '400',
    color: '#94A3B8',
    lineHeight: 13,
    marginTop: 3,
  },
  noteBox: {
    backgroundColor: '#F0F7FF',
    borderRadius: 9,
    padding: 9,
    marginTop: 9,
  },
  noteTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  noteBoxTitle: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#0F172A',
  },
  noteBoxContent: {
    fontSize: 10.5,
    fontWeight: '400',
    color: '#475569',
    lineHeight: 14,
    marginTop: 3,
  },

  /* Card 4: Need Help? */
  helpCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F7FF',
    borderRadius: 14,
    padding: 13,
    borderWidth: 1,
    borderColor: '#E0F2FE',
    marginBottom: 14,
  },
  helpTextCol: {
    flex: 1,
    marginLeft: 11,
  },
  helpTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  helpSubtitle: {
    fontSize: 11.5,
    fontWeight: '400',
    color: '#64748B',
    marginTop: 1,
  },

  /* Bottom Action Bar */
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 9,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 6,
  },
  addToProjectBtn: {
    flex: 1,
    height: 46,
    backgroundColor: '#FEF3C7',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  addToProjectText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#0F172A',
  },
  endWorkBtn: {
    flex: 1.15,
    height: 46,
    backgroundColor: '#FFF',
    borderWidth: 1.2,
    borderColor: '#DC2626',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  endWorkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  redSquareIcon: {
    width: 10,
    height: 10,
    backgroundColor: '#DC2626',
    borderRadius: 2,
  },
  endWorkTitle: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#DC2626',
  },
  endWorkSubtitle: {
    fontSize: 9,
    fontWeight: '400',
    color: '#DC2626',
    marginTop: 0.5,
  },

  /* Modals */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalBox: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  stopCircleLarge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  stopSquareInner: {
    width: 18,
    height: 18,
    backgroundColor: '#DC2626',
    borderRadius: 3,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 6,
    textAlign: 'center',
  },
  modalSub: {
    fontSize: 12.5,
    fontWeight: '400',
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 18,
    lineHeight: 17,
  },
  modalEndConfirmBtn: {
    backgroundColor: '#DC2626',
    width: '100%',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 8,
  },
  modalEndConfirmText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },
  modalCancelBtn: {
    backgroundColor: '#EF4444',
    width: '100%',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 8,
  },
  modalConfirmBtn: {
    backgroundColor: '#0F172A',
    width: '100%',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 8,
  },
  modalConfirmText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },
  modalDismissBtn: {
    width: '100%',
    paddingVertical: 9,
    alignItems: 'center',
  },
  modalDismissText: {
    color: '#64748B',
    fontWeight: '500',
    fontSize: 13.5,
  },
  noteInput: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 11,
    minHeight: 76,
    marginBottom: 14,
    fontSize: 12.5,
    color: '#0F172A',
  },

  /* Help Menu Modal */
  helpMenuBox: {
    backgroundColor: '#FFF',
    borderRadius: 18,
    padding: 16,
    width: '88%',
    maxWidth: 320,
  },
  helpMenuHeading: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  helpMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 11,
  },
  helpMenuText: {
    fontSize: 13.5,
    fontWeight: '500',
    color: '#0F172A',
  },
  helpMenuCloseBtn: {
    marginTop: 12,
    alignItems: 'center',
    paddingVertical: 9,
  },
  helpMenuCloseText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#64748B',
  },
});

export default BookingTrackingScreen;