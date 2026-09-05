import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Modal,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import useAppStore, { EMPTY_ARRAY } from '../store/useAppStore';
import { WorkerListSkeleton, ErrorState } from '../components/LoadingState';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { socket } from '../utils/socket';

// ─── Constants & Colors ───────────────────────────────────────────────────────
const VERIFIED_GREEN = '#16A34A';
const AMBER_ACCENT   = '#F59E0B';
const DARK_COFFEE    = '#381E0D';

const WORKER_AVATARS = [
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80',
  'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=400&q=80',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&q=80',
];

const getWorkerAvatar = (worker, index = 0) => {
  if (worker?.profileImage && typeof worker.profileImage === 'string' && worker.profileImage.trim().startsWith('http')) {
    return worker.profileImage.trim();
  }
  const str = worker?._id || worker?.name || String(index);
  const hash = Math.abs(str.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0));
  return WORKER_AVATARS[hash % WORKER_AVATARS.length];
};

// ─── Worker Card ──────────────────────────────────────────────────────────────
const WorkerCard = React.memo(({ worker, index = 0, isSelected, onToggle, onViewProfile }) => {
  const [imageError, setImageError] = useState(false);

  const handleToggle = useCallback(() => onToggle(worker), [onToggle, worker]);
  const handleViewProfile = useCallback(() => onViewProfile(worker), [onViewProfile, worker]);

  const isVerified = worker.isVerified !== false;
  const experienceYears = Number(worker.experience) || (index % 3 === 0 ? 5 : index % 3 === 1 ? 4 : 3);
  const positiveReviewPct = Math.max(88, Math.min(100, Math.round(((Number(worker.rating) || 4.7) / 5) * 100)));
  const hourlyRate = Number(worker.pricePerDay) || 200;
  const baseCharge = (worker.baseCharge != null && Number(worker.baseCharge) > 0)
    ? Number(worker.baseCharge)
    : 350;
  const totalJobs = worker.totalJobs || (index === 0 ? 128 : index === 1 ? 96 : 75);
  const distance = worker.distance || '1 min away';

  const avatarUri = getWorkerAvatar(worker, index);

  return (
    <TouchableOpacity
      style={[styles.card, isSelected && styles.cardSelected]}
      onPress={handleToggle}
      activeOpacity={0.85}
    >
      {/* Top section: Avatar + Info + Pricing */}
      <View style={styles.cardTopRow}>
        {/* Avatar with Verified pill badge */}
        <View style={styles.avatarContainer}>
          {!imageError ? (
            <Image
              source={{ uri: avatarUri }}
              style={styles.avatarImage}
              resizeMode="cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <LinearGradient
              colors={['#FDE68A', '#F59E0B']}
              style={styles.avatarPlaceholder}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.avatarInitials}>{worker.initials || 'W'}</Text>
            </LinearGradient>
          )}

          {isVerified && (
            <View style={styles.verifiedPill}>
              <MaterialCommunityIcons name="check-circle" size={11} color={VERIFIED_GREEN} />
              <Text style={styles.verifiedPillText}>Verified</Text>
            </View>
          )}
        </View>

        {/* Center column: Name + Experienced badge + Rating + Distance */}
        <View style={styles.cardCenterCol}>
          <View style={styles.nameRow}>
            <Text style={styles.workerName} numberOfLines={1}>
              {worker.name}
            </Text>
            <View style={styles.experiencedBadge}>
              <Text style={styles.experiencedBadgeText}>Experienced</Text>
            </View>
          </View>

          <View style={styles.ratingRow}>
            <MaterialCommunityIcons name="star" size={14} color={AMBER_ACCENT} />
            <Text style={styles.ratingValue}>{worker.rating || '4.7'}</Text>
            <Text style={styles.ratingDivider}>|</Text>
            <Text style={styles.jobsCompletedText}>{totalJobs} Jobs completed</Text>
          </View>

          <View style={styles.distanceRow}>
            <MaterialCommunityIcons name="map-marker" size={13} color="#D97706" />
            <Text style={styles.distanceText}>{distance}</Text>
          </View>
        </View>

        {/* Right column: Pricing */}
        <View style={styles.cardRightCol}>
          <View style={styles.priceColValues}>
            <Text style={styles.hourlyRateValue}>₹{hourlyRate}/hr</Text>
            <View style={styles.priceLabelRow}>
              <Text style={styles.priceSubLabel}>Hourly Rate</Text>
              <MaterialCommunityIcons name="information-outline" size={10.5} color="#9CA3AF" />
            </View>

            <View style={styles.priceDividerLine} />

            <Text style={styles.basePriceValue}>₹{baseCharge}</Text>
            <View style={styles.priceLabelRow}>
              <Text style={styles.priceSubLabel}>Base Price (15–40 min)</Text>
              <MaterialCommunityIcons name="information-outline" size={10.5} color="#9CA3AF" />
            </View>
          </View>
        </View>
      </View>

      {/* Thin Horizontal Card Divider */}
      <View style={styles.cardHorizontalDivider} />

      {/* Bottom section: 3 Trust Stats + View Profile Button */}
      <View style={styles.cardBottomRow}>
        <View style={styles.trustStatsGroup}>
          <View style={styles.trustStatItem}>
            <MaterialCommunityIcons name="briefcase-outline" size={14} color="#374151" />
            <Text style={styles.trustStatValue}>{experienceYears}+ Years</Text>
            <Text style={styles.trustStatLabel}>Experience</Text>
          </View>

          <View style={styles.trustStatItem}>
            <MaterialCommunityIcons name="shield-check-outline" size={14} color="#374151" />
            <Text style={styles.trustStatValue}>100%</Text>
            <Text style={styles.trustStatLabel}>Verified</Text>
          </View>

          <View style={styles.trustStatItem}>
            <MaterialCommunityIcons name="thumb-up-outline" size={14} color="#374151" />
            <Text style={styles.trustStatValue}>{positiveReviewPct}%</Text>
            <Text style={styles.trustStatLabel}>Positive Reviews</Text>
          </View>
        </View>

        <View style={styles.cardActionsGroup}>
          <TouchableOpacity
            style={styles.viewProfileBtn}
            onPress={handleViewProfile}
            activeOpacity={0.8}
          >
            <Text style={styles.viewProfileBtnText}>View Profile</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
});

// ─── Quick Auto Book Card ─────────────────────────────────────────────────────
const AutoBookCard = React.memo(({ category, onPress }) => (
  <LinearGradient
    colors={['#FEE388', '#FCD34D']}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
    style={styles.autoBookCard}
  >
    <View style={styles.autoBookInner}>
      <MaterialCommunityIcons name="flash" size={24} color="#EA580C" style={styles.autoBookFlash} />
      <View style={styles.autoBookTextWrap}>
        <Text style={styles.autoBookTitle} numberOfLines={1}>Quick Auto Book</Text>
        <Text style={styles.autoBookSub} numberOfLines={1}>
          We'll assign the best {category ? category.toLowerCase() : 'painter'} for you
        </Text>
      </View>
      <TouchableOpacity
        style={styles.autoBookBtn}
        activeOpacity={0.85}
        onPress={onPress}
      >
        <Text style={styles.autoBookBtnText}>Book Now →</Text>
      </TouchableOpacity>
    </View>
  </LinearGradient>
));

// ─── Stats Bar ───────────────────────────────────────────────────────────────
const StatsBar = React.memo(({ count, avgRating, arrival, verifiedPct, category }) => (
  <View style={styles.statsBarCard}>
    <View style={styles.statsBarItem}>
      <MaterialCommunityIcons name="account-group" size={13} color={AMBER_ACCENT} />
      <Text style={styles.statsTextInline} numberOfLines={1}>
        <Text style={styles.statsValue}>{count || 24}</Text>
        <Text style={styles.statsLabel}> {category ? category + 's' : 'Pros'}</Text>
      </Text>
    </View>

    <View style={styles.statsDivider} />

    <View style={styles.statsBarItem}>
      <MaterialCommunityIcons name="star" size={13} color={AMBER_ACCENT} />
      <Text style={styles.statsTextInline} numberOfLines={1}>
        <Text style={styles.statsValue}>{avgRating !== '—' ? avgRating : '4.7'}</Text>
        <Text style={styles.statsLabel}> Rating</Text>
      </Text>
    </View>

    <View style={styles.statsDivider} />

    <View style={styles.statsBarItem}>
      <MaterialCommunityIcons name="clock-time-four-outline" size={13} color={AMBER_ACCENT} />
      <Text style={styles.statsTextInline} numberOfLines={1}>
        <Text style={styles.statsValue}>{arrival !== '—' ? arrival : '10–15m'}</Text>
        <Text style={styles.statsLabel}> Arrival</Text>
      </Text>
    </View>

    <View style={styles.statsDivider} />

    <View style={styles.statsBarItem}>
      <MaterialCommunityIcons name="shield-check-outline" size={13} color={AMBER_ACCENT} />
      <Text style={styles.statsTextInline} numberOfLines={1}>
        <Text style={styles.statsValue}>{verifiedPct > 0 ? `${verifiedPct}%` : '100%'}</Text>
        <Text style={styles.statsLabel}> Verified</Text>
      </Text>
    </View>
  </View>
));

// ─── Transparent Pricing Card ────────────────────────────────────────────────
const PricingBanner = React.memo(({ hourlyRate, baseCharge }) => (
  <View style={styles.pricingCard}>
    <View style={styles.pricingCardRow}>
      <View style={styles.pricingLeftInline}>
        <MaterialCommunityIcons name="tag-outline" size={14} color="#D97706" />
        <Text style={styles.pricingCardTitle}>Transparent Pricing</Text>
      </View>

      <View style={styles.pricingRatesInline}>
        <View style={styles.pricingPill}>
          <Text style={styles.pricingRateValue}>₹{hourlyRate}/hr</Text>
          <Text style={styles.pricingRateLabel}> Hourly</Text>
        </View>

        <View style={styles.pricingPillDivider} />

        <View style={styles.pricingPill}>
          <Text style={styles.pricingRateValue}>₹{baseCharge}</Text>
          <Text style={styles.pricingRateLabel}> Base (15–40m)</Text>
        </View>
      </View>
    </View>

    <Text style={styles.pricingCaption} numberOfLines={1}>
      Base covers travel & 40 min. Beyond 40 min, ₹{hourlyRate}/hr applies.
    </Text>
  </View>
));

// ─── View Profile Modal ──────────────────────────────────────────────────────
const ProfileModal = React.memo(({ worker, onClose, onToggle, isSelected }) => {
  if (!worker) return null;
  const [modalImgErr, setModalImgErr] = useState(false);

  const isVerified = worker.isVerified !== false;
  const avatarUri = getWorkerAvatar(worker);
  const experienceYears = Number(worker.experience) || 4;
  const totalJobs = worker.totalJobs || 50;
  const rating = worker.rating || '4.7';
  const hourlyRate = Number(worker.pricePerDay) || 200;
  const baseCharge = (worker.baseCharge != null && Number(worker.baseCharge) > 0)
    ? Number(worker.baseCharge)
    : 350;

  return (
    <Modal visible={!!worker} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity style={styles.modalSheet} activeOpacity={1}>
          <View style={styles.modalHandle} />

          {/* Clean Organized Header: Photo with Verified badge + Info */}
          <View style={styles.profileModalHeader}>
            <View style={styles.profileModalAvatarWrap}>
              {!modalImgErr ? (
                <Image
                  source={{ uri: avatarUri }}
                  style={styles.profileModalAvatarImage}
                  resizeMode="cover"
                  onError={() => setModalImgErr(true)}
                />
              ) : (
                <LinearGradient
                  colors={['#FEE388', '#FCD34D']}
                  style={styles.profileModalAvatarImage}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.profileModalAvatarText}>{worker.initials || 'W'}</Text>
                </LinearGradient>
              )}

              {isVerified && (
                <View style={styles.modalAvatarVerifiedPill}>
                  <MaterialCommunityIcons name="check-circle" size={11} color={VERIFIED_GREEN} />
                  <Text style={styles.modalAvatarVerifiedText}>Verified</Text>
                </View>
              )}
            </View>

            <View style={styles.profileModalInfoCol}>
              <View style={styles.profileModalNameRow}>
                <Text style={styles.profileModalName} numberOfLines={1}>{worker.name}</Text>
                <View style={styles.experiencedBadge}>
                  <Text style={styles.experiencedBadgeText}>Experienced</Text>
                </View>
              </View>

              <Text style={styles.profileModalCategory}>{worker.category || 'Painter'}</Text>

              <View style={styles.profileModalLocRow}>
                <MaterialCommunityIcons name="map-marker" size={13} color="#D97706" />
                <Text style={styles.profileModalLocText}>{worker.distance || '1 min away'}</Text>
              </View>
            </View>
          </View>

          {/* 3-Column Stats Row with Dividers */}
          <View style={styles.modalStatsRow}>
            <View style={styles.modalStatCol}>
              <MaterialCommunityIcons name="star" size={16} color={AMBER_ACCENT} />
              <Text style={styles.modalStatValue}>{rating}</Text>
              <Text style={styles.modalStatLabel}>Rating</Text>
            </View>

            <View style={styles.modalStatDivider} />

            <View style={styles.modalStatCol}>
              <MaterialCommunityIcons name="briefcase-check-outline" size={16} color="#374151" />
              <Text style={styles.modalStatValue}>{totalJobs}+</Text>
              <Text style={styles.modalStatLabel}>Jobs Done</Text>
            </View>

            <View style={styles.modalStatDivider} />

            <View style={styles.modalStatCol}>
              <MaterialCommunityIcons name="briefcase-variant-outline" size={16} color="#374151" />
              <Text style={styles.modalStatValue}>{experienceYears}+ Yrs</Text>
              <Text style={styles.modalStatLabel}>Experience</Text>
            </View>
          </View>

          {worker.bio ? (
            <Text style={styles.profileModalBio}>{worker.bio}</Text>
          ) : null}

          {(worker.skills || []).length > 0 && (
            <View style={styles.modalSkillsRow}>
              {worker.skills.map((skill) => (
                <View key={skill} style={styles.modalSkillTag}>
                  <Text style={styles.modalSkillText}>{skill}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Pricing Box in Modal */}
          <View style={styles.modalPriceBox}>
            <View style={styles.modalPriceSegment}>
              <Text style={styles.modalPriceLabel}>HOURLY RATE</Text>
              <Text style={styles.modalPriceValue}>₹{hourlyRate}/hr</Text>
            </View>
            <View style={styles.modalPriceDivider} />
            <View style={styles.modalPriceSegment}>
              <Text style={styles.modalPriceLabel}>BASE PRICE</Text>
              <Text style={styles.modalPriceValue}>₹{baseCharge}</Text>
            </View>
          </View>

          {/* Action Button */}
          <TouchableOpacity
            style={[styles.modalSelectBtn, isSelected && { backgroundColor: VERIFIED_GREEN }]}
            activeOpacity={0.85}
            onPress={() => { onToggle(worker); onClose(); }}
          >
            <Text style={styles.modalSelectBtnText}>
              {isSelected ? '✓ Remove Selection' : 'Select this worker'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onClose} style={styles.modalCancel} activeOpacity={0.7}>
            <Text style={styles.modalCancelText}>Close</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
});

// ─── Main Screen Component ────────────────────────────────────────────────────
const WorkersNearbyScreen = ({ route, navigation }) => {
  const category = route?.params?.category || 'Painter';

  const allWorkers = useAppStore((s) => (category ? s.workersByCategory[category] : null) || EMPTY_ARRAY);
  const labourLoading = useAppStore((s) => s.labourLoading);
  const labourError   = useAppStore((s) => s.labourError);
  const fetchWorkersByCategory = useAppStore((s) => s.fetchWorkersByCategory);

  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalStep, setModalStep] = useState('quantity');
  const [quantity, setQuantity]   = useState(1);
  const [profileWorker, setProfileWorker] = useState(null);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchWorkersByCategory(category);
    setRefreshing(false);
  }, [category, fetchWorkersByCategory]);

  useEffect(() => {
    if (category) {
      fetchWorkersByCategory(category);
    }
  }, [category, fetchWorkersByCategory]);

  useEffect(() => {
    socket.emit('join_workers_watch');
  }, []);

  const displayed = allWorkers;

  const toggleWorker = useCallback((worker) => {
    setSelected((prev) =>
      prev.find((w) => w._id === worker._id)
        ? prev.filter((w) => w._id !== worker._id)
        : [...prev, worker]
    );
  }, []);

  const handleViewProfile = useCallback((worker) => setProfileWorker(worker), []);
  const handleCloseProfile = useCallback(() => setProfileWorker(null), []);

  const handleOpenFilter = useCallback(() => {}, []);
  const handleOpenMap = useCallback(() => {}, []);
  const handleGoBack = useCallback(() => navigation.goBack(), [navigation]);

  const handleOpenModal = useCallback(() => {
    setModalStep('quantity');
    setShowModal(true);
  }, []);
  const handleCloseModal = useCallback(() => setShowModal(false), []);
  const handleShowTimingStep = useCallback(() => setModalStep('timing'), []);
  const handleBackToQuantity = useCallback(() => setModalStep('quantity'), []);

  const handleSelectTiming = useCallback((isImmediate) => {
    setShowModal(false);
    navigation.navigate('LabourCheckout', {
      category,
      isAutobook: true,
      requiredWorkers: quantity,
      presetIsImmediate: isImmediate,
      estimateWorkers: displayed.slice(0, quantity),
    });
  }, [navigation, category, quantity, displayed]);

  const handleIncrement = useCallback(() => setQuantity((q) => Math.min(10, q + 1)), []);
  const handleDecrement = useCallback(() => setQuantity((q) => Math.max(1, q - 1)), []);

  const handleCheckout = useCallback(() => {
    if (selected.length === 0) return;
    navigation.navigate('LabourCheckout', {
      selectedWorkers: selected,
      category,
    });
  }, [navigation, selected, category]);

  // Dynamic statistics for StatsBar
  const statsSummary = useMemo(() => {
    const count = displayed.length || 24;
    const totalRating = displayed.reduce((sum, w) => sum + (Number(w.rating) || 4.7), 0);
    const avgRating = displayed.length > 0 ? (totalRating / displayed.length).toFixed(1) : '4.7';

    const minutesList = displayed
      .map((w) => {
        const match = String(w.distance || '').match(/\d+/);
        return match ? parseInt(match[0], 10) : null;
      })
      .filter((n) => n !== null);
    let arrival = '10–15 min';
    if (minutesList.length > 0) {
      const min = Math.min(...minutesList);
      const max = Math.max(...minutesList);
      arrival = min === max ? `${min} min` : `${min}–${max} min`;
    }

    const verifiedCount = displayed.filter((w) => w.isVerified !== false).length;
    const verifiedPct = displayed.length > 0 ? Math.round((verifiedCount / displayed.length) * 100) : 100;

    return { count, avgRating, arrival, verifiedPct };
  }, [displayed]);

  // Dynamic pricing summary
  const pricingSummary = useMemo(() => {
    const withRates = displayed.filter((w) => Number(w.pricePerDay) > 0);
    const hourlyRate = withRates.length > 0
      ? Math.round(withRates.reduce((sum, w) => sum + Number(w.pricePerDay), 0) / withRates.length)
      : 200;

    const withBase = displayed.filter((w) => w.baseCharge != null && Number(w.baseCharge) > 0);
    const baseCharge = withBase.length > 0
      ? Math.round(withBase.reduce((sum, w) => sum + Number(w.baseCharge), 0) / withBase.length)
      : 350;

    return { hourlyRate, baseCharge };
  }, [displayed]);

  // List header containing Quick Auto Book, Stats Bar, and Transparent Pricing
  const listHeader = useMemo(() => (
    <View style={styles.listHeaderWrap}>
      <AutoBookCard category={category} onPress={handleOpenModal} />
      <StatsBar
        count={statsSummary.count}
        avgRating={statsSummary.avgRating}
        arrival={statsSummary.arrival}
        verifiedPct={statsSummary.verifiedPct}
        category={category}
      />
      <PricingBanner
        hourlyRate={pricingSummary.hourlyRate}
        baseCharge={pricingSummary.baseCharge}
      />
    </View>
  ), [category, handleOpenModal, statsSummary, pricingSummary]);

  const renderItem = useCallback(({ item, index }) => (
    <WorkerCard
      worker={item}
      index={index}
      isSelected={!!selected.find((w) => w._id === item._id)}
      onToggle={toggleWorker}
      onViewProfile={handleViewProfile}
    />
  ), [selected, toggleWorker, handleViewProfile]);

  const listEmpty = useMemo(() => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyEmoji}>🔍</Text>
      <Text style={styles.emptyText}>No workers available right now</Text>
      <Text style={styles.emptySub}>Check back soon or try another location</Text>
    </View>
  ), []);

  if (!category) return <ErrorState message="No category selected" onRetry={() => navigation.goBack()} />;
  if (labourLoading && !refreshing) return <WorkerListSkeleton />;
  if (labourError)   return <ErrorState message={labourError} onRetry={() => fetchWorkersByCategory(category)} />;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />

      {/* Pinned Top Navigation Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={handleGoBack}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="arrow-left" size={20} color="#111827" />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>{category ? `${category}s Nearby` : 'Painters Nearby'}</Text>
          <Text style={styles.headerSub}>
            Select one or more {category ? category.toLowerCase() + 's' : 'painters'}
          </Text>
        </View>

        <TouchableOpacity style={styles.headerIconBtn} onPress={handleOpenFilter} activeOpacity={0.7}>
          <MaterialCommunityIcons name="tune-variant" size={18} color="#111827" />
          <Text style={styles.headerIconLabel}>Filter</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.headerIconBtn} onPress={handleOpenMap} activeOpacity={0.7}>
          <MaterialCommunityIcons name="map-marker-outline" size={18} color="#111827" />
          <Text style={styles.headerIconLabel}>Map</Text>
        </TouchableOpacity>
      </View>

      {/* Main List */}
      <FlatList
        data={displayed}
        keyExtractor={(item, idx) => item._id || String(idx)}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={listEmpty}
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={5}
        removeClippedSubviews={true}
        extraData={selected}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[AMBER_ACCENT]}
            tintColor={AMBER_ACCENT}
          />
        }
      />

      {/* Floating Bottom Card Bar */}
      <View style={styles.floatingBottomBar}>
        <View style={styles.bottomBarLeft}>
          <View style={styles.bottomBarIconWrap}>
            <MaterialCommunityIcons name="account-group" size={22} color="#D97706" />
          </View>
          <View style={{ flexShrink: 1 }}>
            <Text style={styles.selectedCountText}>
              {selected.length} {category ? category.toLowerCase() : 'painter'}(s) selected
            </Text>
            <Text style={styles.selectedHintText}>
              {selected.length === 0
                ? `Select at least 1 ${category ? category.toLowerCase() : 'painter'} to continue`
                : 'You can compare and book'}
            </Text>
          </View>
        </View>

        <View style={styles.bottomBarRight}>
          {selected.length === 0 ? (
            <View style={styles.continueBtnDisabled}>
              <Text style={styles.continueBtnTextDisabled}>Continue →</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.continueBtnActive}
              activeOpacity={0.85}
              onPress={handleCheckout}
            >
              <Text style={styles.continueBtnTextActive}>Continue →</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.bottomBarCaption}>You can compare and book</Text>
        </View>
      </View>

      {/* Worker Profile Modal */}
      <ProfileModal
        worker={profileWorker}
        onClose={handleCloseProfile}
        onToggle={toggleWorker}
        isSelected={!!(profileWorker && selected.find((w) => w._id === profileWorker._id))}
      />

      {/* Quick Auto Book Modal */}
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={handleCloseModal}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={handleCloseModal}
        >
          <TouchableOpacity style={styles.modalSheet} activeOpacity={1}>
            <View style={styles.modalHandle} />
            {modalStep === 'quantity' && (
              <>
                <Text style={styles.modalTitle}>
                  How many {category}s do you need?
                </Text>
                <Text style={styles.modalSub}>
                  We'll match you with the highest-rated workers nearby
                </Text>

                <View style={styles.counterRow}>
                  <TouchableOpacity
                    style={styles.counterBtn}
                    onPress={handleDecrement}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.counterBtnText}>−</Text>
                  </TouchableOpacity>
                  <View style={styles.counterDisplay}>
                    <Text style={styles.counterValue}>{quantity}</Text>
                    <Text style={styles.counterLabel}>
                      {category}{quantity > 1 ? 's' : ''}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.counterBtn}
                    onPress={handleIncrement}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.counterBtnText}>+</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.modalNote}>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 5 }}>
                    <MaterialCommunityIcons name="map-marker" size={14} color="#D97706" style={{ marginTop: 1 }} />
                    <Text style={[styles.modalNoteText, { flex: 1 }]}>
                      Workers with valid Labour Cards will be prioritized for your safety.
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.modalPrimaryBtn}
                  activeOpacity={0.85}
                  onPress={handleShowTimingStep}
                >
                  <Text style={styles.modalPrimaryBtnText}>
                    Book {quantity} {category}{quantity > 1 ? 's' : ''} →
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleCloseModal}
                  style={styles.modalCancel}
                  activeOpacity={0.7}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}

            {modalStep === 'timing' && (
              <>
                <Text style={[styles.modalTitle, { fontSize: 18 }]}>Do you need it now or later?</Text>
                <Text style={[styles.modalSub, { marginBottom: 20 }]}>
                  We'll instantly notify every nearby {category.toLowerCase()} — first {quantity} to accept get the job.
                </Text>

                <TouchableOpacity
                  onPress={() => handleSelectTiming(true)}
                  activeOpacity={0.85}
                  style={{ marginBottom: 14 }}
                >
                  <View style={styles.modalPrimaryBtn}>
                    <Text style={styles.modalPrimaryBtnText}>⚡ Immediate — Need it now</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleSelectTiming(false)}
                  activeOpacity={0.85}
                  style={styles.modalSecondaryBtn}
                >
                  <Text style={styles.modalSecondaryBtnText}>📅 Scheduled — Pick a date</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleBackToQuantity}
                  style={styles.modalCancel}
                  activeOpacity={0.7}
                >
                  <Text style={styles.modalCancelText}>← Back</Text>
                </TouchableOpacity>
              </>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

// ─── Stylesheet (Matching Exact Pixel Design) ─────────────────────────────────
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },

  // ── Header Bar ───────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: '#F8F9FA',
    gap: 10,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  headerTitleWrap: {
    flex: 1,
    marginLeft: 2,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.4,
  },
  headerSub: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '400',
    marginTop: 2,
    letterSpacing: -0.1,
  },
  headerIconBtn: {
    width: 48,
    height: 50,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  headerIconLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1F2937',
    letterSpacing: -0.1,
  },

  // ── List Layout ──────────────────────────────────────────
  listContent: {
    paddingBottom: 120, // Extra space so last item floats above bottom bar
  },
  listHeaderWrap: {
    paddingTop: 4,
  },

  // ── Quick Auto Book Card ─────────────────────────────────
  autoBookCard: {
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 8,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#FDE68A',
    shadowColor: AMBER_ACCENT,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 6,
    elevation: 2,
  },
  autoBookInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  autoBookFlash: {
    marginRight: 6,
  },
  autoBookTextWrap: {
    flex: 1,
    marginRight: 8,
  },
  autoBookTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.2,
  },
  autoBookSub: {
    fontSize: 11,
    color: '#4B5563',
    fontWeight: '400',
    marginTop: 1,
    lineHeight: 14,
  },
  autoBookBtn: {
    backgroundColor: DARK_COFFEE,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  autoBookBtnText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '600',
  },

  // ── Stats Bar (Sleek & Slender Strip) ────────────────────
  statsBarCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 7,
    paddingHorizontal: 10,
    marginHorizontal: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  statsBarItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  statsTextInline: {
    flexShrink: 1,
  },
  statsValue: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#111827',
  },
  statsLabel: {
    fontSize: 10,
    fontWeight: '400',
    color: '#6B7280',
  },
  statsDivider: {
    width: 1,
    height: 14,
    backgroundColor: '#E5E7EB',
  },

  // ── Transparent Pricing Card (Sleek & Slender) ───────────
  pricingCard: {
    backgroundColor: '#FFFDF7',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 16,
    marginBottom: 10,
  },
  pricingCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pricingLeftInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  pricingCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.2,
  },
  pricingRatesInline: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pricingPill: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  pricingRateValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.2,
  },
  pricingRateLabel: {
    fontSize: 9.5,
    fontWeight: '400',
    color: '#6B7280',
  },
  pricingPillDivider: {
    width: 1,
    height: 12,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 8,
  },
  pricingCaption: {
    fontSize: 9.5,
    color: '#6B7280',
    marginTop: 4,
    fontWeight: '400',
  },

  // ── Worker Card ──────────────────────────────────────────
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardSelected: {
    borderColor: AMBER_ACCENT,
    borderWidth: 2,
    backgroundColor: '#FFFDF0',
    shadowColor: AMBER_ACCENT,
    shadowOpacity: 0.20,
    shadowRadius: 10,
    elevation: 4,
  },
  cardTopRow: {
    flexDirection: 'row',
  },

  // Avatar + Verified Pill
  avatarContainer: {
    width: 95,
    height: 115,
    borderRadius: 16,
    position: 'relative',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  verifiedPill: {
    position: 'absolute',
    bottom: -6,
    left: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  verifiedPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: VERIFIED_GREEN,
    letterSpacing: -0.1,
  },

  // Card Center Column
  cardCenterCol: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  workerName: {
    fontSize: 17.5,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.2,
    flexShrink: 1,
  },
  experiencedBadge: {
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
  },
  experiencedBadgeText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#3B82F6',
    letterSpacing: -0.1,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  ratingValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    marginLeft: 3,
  },
  ratingDivider: {
    fontSize: 12,
    color: '#E5E7EB',
    marginHorizontal: 6,
  },
  jobsCompletedText: {
    fontSize: 11.5,
    color: '#6B7280',
    fontWeight: '400',
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  distanceText: {
    fontSize: 11.5,
    color: '#4B5563',
    fontWeight: '500',
    marginLeft: 3,
  },

  // Card Right Column (Checkbox + Price)
  cardRightCol: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    flexShrink: 0,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: AMBER_ACCENT,
    borderColor: AMBER_ACCENT,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    includeFontPadding: false,
  },
  priceColValues: {
    alignItems: 'flex-end',
  },
  hourlyRateValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.2,
  },
  priceLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 1,
  },
  priceSubLabel: {
    fontSize: 9.5,
    color: '#9CA3AF',
    fontWeight: '400',
  },
  priceDividerLine: {
    width: 100,
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 6,
  },
  basePriceValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.2,
  },

  // Divider inside Card
  cardHorizontalDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginTop: 14,
    marginBottom: 12,
  },

  // Bottom Row of Card
  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  trustStatsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  trustStatItem: {
    alignItems: 'flex-start',
    gap: 1,
  },
  trustStatValue: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#111827',
    marginTop: 2,
    letterSpacing: -0.1,
  },
  trustStatLabel: {
    fontSize: 9,
    color: '#9CA3AF',
    fontWeight: '400',
  },

  cardActionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  viewProfileBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewProfileBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
  },
  selectBtn: {
    backgroundColor: AMBER_ACCENT,
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  selectBtnActive: {
    backgroundColor: VERIFIED_GREEN,
  },
  selectBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  selectBtnSquare: {
    width: 14,
    height: 14,
    borderRadius: 3,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectBtnSquareActive: {
    backgroundColor: '#FFFFFF',
  },
  selectBtnCheckmark: {
    color: VERIFIED_GREEN,
    fontSize: 10,
    fontWeight: '900',
    includeFontPadding: false,
  },

  // ── Floating Bottom Bar ──────────────────────────────────
  floatingBottomBar: {
    position: 'absolute',
    bottom: 12,
    left: 16,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 8,
  },
  bottomBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  bottomBarIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    flexShrink: 0,
  },
  selectedCountText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.2,
  },
  selectedHintText: {
    fontSize: 10.5,
    color: '#6B7280',
    fontWeight: '400',
    marginTop: 2,
  },
  bottomBarRight: {
    alignItems: 'center',
    flexShrink: 0,
  },
  continueBtnDisabled: {
    backgroundColor: '#D1D5DB',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueBtnTextDisabled: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '600',
  },
  continueBtnActive: {
    backgroundColor: AMBER_ACCENT,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 26,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: AMBER_ACCENT,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  continueBtnTextActive: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '600',
  },
  bottomBarCaption: {
    fontSize: 9.5,
    color: '#9CA3AF',
    marginTop: 4,
    fontWeight: '400',
    textAlign: 'center',
  },

  // ── Empty State ──────────────────────────────────────────
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyEmoji: {
    fontSize: 44,
    marginBottom: 14,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingHorizontal: 30,
  },

  // ── Modal Styles ─────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 20,
  },
  modalHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSub: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 30,
    marginBottom: 28,
  },
  counterBtn: {
    width: 56,
    height: 56,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  counterBtnText: {
    fontSize: 24,
    color: '#111827',
    fontWeight: '600',
  },
  counterDisplay: {
    alignItems: 'center',
    minWidth: 100,
  },
  counterValue: {
    fontSize: 32,
    fontWeight: '900',
    color: '#111827',
  },
  counterLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 2,
  },
  modalNote: {
    backgroundColor: '#FEF3C7',
    padding: 14,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  modalNoteText: {
    fontSize: 12.5,
    color: '#92400E',
    fontWeight: '600',
    lineHeight: 18,
  },
  modalPrimaryBtn: {
    backgroundColor: AMBER_ACCENT,
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalPrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  modalSecondaryBtn: {
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    marginBottom: 14,
  },
  modalSecondaryBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  modalCancel: {
    marginTop: 16,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#9CA3AF',
  },

  // ── Profile Modal Specifics ──────────────────────────────
  profileModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 20,
  },
  profileModalAvatarWrap: {
    width: 76,
    height: 92,
    borderRadius: 16,
    position: 'relative',
  },
  profileModalAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileModalAvatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalAvatarVerifiedPill: {
    position: 'absolute',
    bottom: -6,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  modalAvatarVerifiedText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: VERIFIED_GREEN,
  },
  profileModalInfoCol: {
    flex: 1,
    justifyContent: 'center',
  },
  profileModalNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  profileModalName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.3,
  },
  profileModalCategory: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 3,
  },
  profileModalLocRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  profileModalLocText: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '500',
    marginLeft: 3,
  },
  modalStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    paddingVertical: 14,
    marginBottom: 16,
  },
  modalStatCol: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  modalStatDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#E5E7EB',
  },
  modalStatValue: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#111827',
  },
  modalStatLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  profileModalBio: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 19,
    marginBottom: 14,
    fontWeight: '500',
  },
  modalSkillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 16,
  },
  modalSkillTag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  modalSkillText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#374151',
  },
  modalPriceBox: {
    flexDirection: 'row',
    backgroundColor: '#FFFDF7',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingVertical: 14,
    marginBottom: 20,
  },
  modalPriceSegment: {
    flex: 1,
    alignItems: 'center',
  },
  modalPriceLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#9CA3AF',
    marginBottom: 3,
  },
  modalPriceValue: {
    fontSize: 15.5,
    fontWeight: '700',
    color: '#111827',
  },
  modalPriceDivider: {
    width: 1,
    backgroundColor: '#FDE68A',
  },
  modalSelectBtn: {
    backgroundColor: AMBER_ACCENT,
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSelectBtnText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '700',
  },
});

export default WorkersNearbyScreen;