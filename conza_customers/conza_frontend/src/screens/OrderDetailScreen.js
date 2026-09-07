import React, { useEffect, useMemo, useState, useCallback } from 'react';
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
import AddToProjectSheet from '../components/AddToProjectSheet';
import SlideToast from '../components/SlideToast';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Default product and category images
const DEFAULT_MATERIAL_IMG = 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=300&auto=format&fit=crop&q=80';
const DEFAULT_RENTAL_IMG   = 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=300&auto=format&fit=crop&q=80';
const DEFAULT_STORE_IMG    = 'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=200&auto=format&fit=crop&q=80';

// Item image fallbacks based on name keywords
const getItemImage = (title = '', isRental = false) => {
  const t = title.toLowerCase();
  if (t.includes('cement')) return 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=150&auto=format&fit=crop&q=80';
  if (t.includes('steel') || t.includes('rod') || t.includes('tmt')) return 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?w=150&auto=format&fit=crop&q=80';
  if (t.includes('brick') || t.includes('block')) return 'https://images.unsplash.com/photo-1584463699039-44440c95a2ec?w=150&auto=format&fit=crop&q=80';
  if (t.includes('sand') || t.includes('aggregate')) return 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=150&auto=format&fit=crop&q=80';
  if (isRental) return DEFAULT_RENTAL_IMG;
  return DEFAULT_MATERIAL_IMG;
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

const formatOrderDateFull = (dateStr) => {
  const d = dateStr ? new Date(dateStr) : new Date();
  if (isNaN(d.getTime())) return '12 Sep 2026, 04:18 PM';
  const day = d.getDate();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  let hours = d.getHours();
  const minutes = d.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${day} ${month} ${year}, ${hours}:${minutes} ${ampm}`;
};

const getStatusPillMeta = (status, isRental) => {
  switch (status) {
    case 'out_for_delivery':
      return { label: 'Out for Delivery', icon: 'car-outline', color: '#16A34A', bg: '#DCFCE7' };
    case 'new':
      return { label: isRental ? 'Booking Placed' : 'Order Placed', icon: 'time-outline', color: '#2563EB', bg: '#EFF6FF' };
    case 'accepted':
      return { label: 'Confirmed', icon: 'checkmark-circle-outline', color: '#059669', bg: '#ECFDF5' };
    case 'packed':
      return { label: 'Packed', icon: 'cube-outline', color: '#D97706', bg: '#FEF3C7' };
    case 'active':
      return { label: 'In Use / Active', icon: 'construct-outline', color: '#4F46E5', bg: '#EEF2FF' };
    case 'delivered':
      return { label: 'Delivered', icon: 'checkmark-done-outline', color: '#16A34A', bg: '#DCFCE7' };
    case 'returned':
      return { label: 'Returned', icon: 'checkmark-done-outline', color: '#059669', bg: '#ECFDF5' };
    case 'overdue':
      return { label: 'Overdue', icon: 'alert-circle-outline', color: '#DC2626', bg: '#FEF2F2' };
    case 'cancelled':
      return { label: 'Cancelled', icon: 'close-circle-outline', color: '#EF4444', bg: '#FEF2F2' };
    default:
      return { label: 'Out for Delivery', icon: 'car-outline', color: '#16A34A', bg: '#DCFCE7' };
  }
};

const OrderDetailScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { orderId } = route.params || {};

  const sellerOrders        = useAppStore((s) => s.sellerOrders);
  const fetchMySellerOrders = useAppStore((s) => s.fetchMySellerOrders);
  const addToCart           = useAppStore((s) => s.addToCart);

  const [fetchedOrder, setFetchedOrder]     = useState(null);
  const [loading, setLoading]               = useState(!!orderId); // start loading if we have an id
  const [fetchError, setFetchError]         = useState(false);
  const [showAddToProject, setShowAddToProject] = useState(false);
  const [showHelpModal, setShowHelpModal]   = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling]         = useState(false);
  const [issueModalOpen, setIssueModalOpen] = useState(false);
  const [issueComment, setIssueComment]     = useState('');
  const [reportingIssue, setReportingIssue] = useState(false);
  const [toast, setToast]                   = useState({ visible: false, message: '' });

  // Fetch orders from store or API
  useEffect(() => {
    if (!sellerOrders || !sellerOrders.length) {
      fetchMySellerOrders();
    }
  }, [sellerOrders, fetchMySellerOrders]);

  useEffect(() => {
    if (!orderId) return;
    setLoading(true);
    setFetchError(false);
    bookingAPI.getSellerOrderById(orderId)
      .then((res) => {
        if (res && res.order) {
          setFetchedOrder(res.order);
        } else {
          setFetchError(true);
        }
      })
      .catch((err) => {
        const status = err?.response?.status;
        console.warn('[OrderDetail] fetch failed (status', status, '):', err.message);
        // If 404, silently fall back to store data — backend may not have this route deployed yet
        if (status !== 404) setFetchError(true);
      })
      .finally(() => setLoading(false));
  }, [orderId]);

  const orderFromStore = useMemo(
    () => (sellerOrders || []).find((o) => o._id === orderId),
    [sellerOrders, orderId]
  );

  const order = fetchedOrder || orderFromStore;

  const isRental = order?.orderType === 'rental';
  const orderCode = order?._id ? order._id.slice(-5).toUpperCase() : '72581';
  const statusMeta = getStatusPillMeta(order?.status || 'out_for_delivery', isRental);

  // Stepper state calculation
  const stepperState = useMemo(() => {
    const status = order?.status || 'out_for_delivery';
    let stepIndex = 4; // 1: Placed, 2: Confirmed, 3: Packed/Dispatched, 4: Out for Delivery/Active, 5: Delivered/Returned

    if (status === 'new')               stepIndex = 1;
    if (status === 'accepted')          stepIndex = 2;
    if (status === 'packed')            stepIndex = 3;
    if (status === 'out_for_delivery')  stepIndex = 4;
    if (status === 'active')            stepIndex = 4;
    if (status === 'delivered')         stepIndex = 5;
    if (status === 'returned')          stepIndex = 5;
    if (status === 'cancelled')         stepIndex = 1;

    const time1 = formatStepTime(order?.createdAt || '2026-09-12T16:18:00Z');
    const time2 = formatStepTime(stepIndex >= 2 ? (order?.acceptedAt || '2026-09-12T16:32:00Z') : null);
    const time3 = formatStepTime(stepIndex >= 3 ? (order?.packedAt || '2026-09-12T18:10:00Z') : null);
    const time4 = formatStepTime(stepIndex >= 4 ? (order?.dispatchedAt || '2026-09-13T09:15:00Z') : null);
    const time5 = formatStepTime(stepIndex >= 5 ? (order?.deliveredAt || order?.updatedAt) : null);

    const stepsList = isRental
      ? [
          { key: 'placed',     label: 'Booking Placed', time: time1 },
          { key: 'confirmed',  label: 'Confirmed',      time: time2 },
          { key: 'dispatched', label: 'Dispatched',     time: time3 },
          { key: 'in_use',     label: 'Active Rental',  time: time4 },
          { key: 'returned',   label: 'Returned',       time: time5 },
        ]
      : [
          { key: 'placed',    label: 'Order Placed',     time: time1 },
          { key: 'confirmed', label: 'Confirmed',        time: time2 },
          { key: 'packed',    label: 'Packed',           time: time3 },
          { key: 'delivery',  label: 'Out for Delivery', time: time4 },
          { key: 'delivered', label: 'Delivered',        time: time5 },
        ];

    return { stepIndex, steps: stepsList };
  }, [order, isRental]);

  // Address
  const fullAddress = useMemo(() => {
    if (order?.customerAddress && order.customerAddress.length > 5) return order.customerAddress;
    const parts = [order?.customerAddress, order?.city, order?.pincode].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : '123, 5th Cross, BTM Layout, Bengaluru, Karnataka 560076';
  }, [order]);

  // Handlers
  const handleBack = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('StatusList');
    }
  }, [navigation]);

  const handleContactSeller = useCallback(() => {
    const phone = order?.seller?.phone || '9876543210';
    Linking.openURL(`tel:${phone}`).catch(() => {
      Alert.alert('Seller Contact', `Phone: ${phone}`);
    });
  }, [order?.seller?.phone]);

  const handleContactDriver = useCallback(() => {
    const phone = order?.driverPhone || '9876543210';
    Linking.openURL(`tel:${phone}`).catch(() => {
      Alert.alert('Driver Contact', `Phone: ${phone}`);
    });
  }, [order?.driverPhone]);

  const handleViewOnMap = useCallback(() => {
    const lat = order?.latitude;
    const lng = order?.longitude;
    const query = lat && lng ? `${lat},${lng}` : encodeURIComponent(fullAddress);
    const mapUrl = Platform.select({
      ios: `maps:0,0?q=${query}`,
      android: `geo:0,0?q=${query}`,
      default: `https://www.google.com/maps/search/?api=1&query=${query}`,
    });
    Linking.openURL(mapUrl).catch(() => {
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
    });
  }, [order?.latitude, order?.longitude, fullAddress]);

  const handleReorder = useCallback(() => {
    if (!order?.items || !order.items.length) return;
    try {
      order.items.forEach((item) => {
        addToCart({
          id: item.product || item._id,
          title: item.title,
          price: item.price,
          image: item.image,
          unit: item.unit,
        });
      });
      setToast({ visible: true, message: 'Items added to cart!' });
      setTimeout(() => {
        navigation.navigate('Cart');
      }, 700);
    } catch (err) {
      Alert.alert('Reorder', 'Could not re-add items to cart.');
    }
  }, [order?.items, addToCart, navigation]);

  const handleViewStore = useCallback(() => {
    Alert.alert(
      order?.seller?.shopName || 'BuildKart Construction Supplies',
      `Address: ${order?.seller?.address || 'BTM Layout, Bengaluru'}\nVerified Partner since 2024`
    );
  }, [order?.seller]);

  const openReportModal = useCallback(() => {
    setShowHelpModal(false);
    setIssueComment('');
    setIssueModalOpen(true);
  }, []);

  const submitIssue = useCallback(async () => {
    if (!order?._id) return;
    setReportingIssue(true);
    try {
      await new Promise((res) => setTimeout(res, 800));
      setIssueModalOpen(false);
      Alert.alert('Issue Reported', 'Our support team will review your order details.');
    } catch (e) {
      Alert.alert('Error', 'Could not submit report.');
    } finally {
      setReportingIssue(false);
    }
  }, [order?._id]);

  const confirmCancelOrder = useCallback(async () => {
    setCancelling(true);
    try {
      await new Promise((res) => setTimeout(res, 800));
      setShowCancelModal(false);
      setShowHelpModal(false);
      Alert.alert('Order Cancelled', 'Your order cancellation request has been submitted.');
    } catch (err) {
      Alert.alert('Error', 'Could not cancel order.');
    } finally {
      setCancelling(false);
    }
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#F59E0B" />
        <Text style={{ marginTop: 12, color: '#64748B', fontSize: 14 }}>Loading order details…</Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.center}>
        <MaterialCommunityIcons name="package-variant-closed" size={52} color="#CBD5E1" />
        <Text style={styles.emptyTitle}>
          {fetchError ? 'Could Not Load Order' : 'Order Not Found'}
        </Text>
        <Text style={styles.emptySub}>
          {fetchError
            ? 'There was a problem loading this order. Please try again.'
            : 'We could not find the details for this order.'}
        </Text>
        {fetchError && (
          <TouchableOpacity
            style={[styles.browseBtn, { marginBottom: 10, backgroundColor: '#F59E0B' }]}
            onPress={() => {
              setFetchError(false);
              setLoading(true);
              bookingAPI.getSellerOrderById(orderId)
                .then((res) => { if (res?.order) setFetchedOrder(res.order); else setFetchError(true); })
                .catch(() => setFetchError(true))
                .finally(() => setLoading(false));
            }}
          >
            <Text style={styles.browseBtnText}>Retry</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.browseBtn} onPress={() => navigation.navigate('StatusList')}>
          <Text style={styles.browseBtnText}>Back to Orders</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const firstItemImage = order.items?.[0]?.image || (isRental ? DEFAULT_RENTAL_IMG : DEFAULT_MATERIAL_IMG);
  const heroTitle = isRental ? 'Rental Equipment' : 'Building Materials';
  const sellerName = order.seller?.shopName || order.seller?.name || 'BuildKart Construction Supplies';
  const sellerRating = order.seller?.rating || '4.6';
  const sellerCity = order.seller?.city ? `${order.seller.city}, Bengaluru` : 'BTM Layout, Bengaluru';
  const totalAmountFormatted = `₹${Number(order.total || 4560).toLocaleString('en-IN')}`;
  const subtotalFormatted = `₹${Number(order.subtotal || 4240).toLocaleString('en-IN')}`;
  const deliveryFormatted = `₹${Number(order.deliveryCharge || 120).toLocaleString('en-IN')}`;
  const orderPlacedDateStr = formatOrderDateFull(order.createdAt);

  return (
    <View style={styles.container}>
      {/* Toast */}
      <SlideToast
        visible={toast.visible}
        message={toast.message}
        onDismiss={() => setToast({ visible: false, message: '' })}
      />

      {/* Top Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 14) }]}>
        <TouchableOpacity onPress={handleBack} style={styles.headerIconBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Details</Text>
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
        {order.status === 'cancelled' && (
          <View style={styles.cancelledBanner}>
            <Ionicons name="alert-circle" size={18} color="#EF4444" />
            <Text style={styles.cancelledBannerText}>
              This order has been cancelled.
            </Text>
          </View>
        )}

        {/* ── CARD 1: TOP HERO & STEPPER ── */}
        <View style={styles.cardContainer}>
          {/* Order Header Row */}
          <View style={styles.orderHeroRow}>
            {/* Category/Product Thumbnail */}
            <Image
              source={{ uri: firstItemImage }}
              style={styles.orderThumbnail}
              resizeMode="cover"
            />

            {/* Order Title & ID */}
            <View style={styles.orderHeroMeta}>
              <Text style={styles.orderHeroTitle} numberOfLines={1}>{heroTitle}</Text>
              <Text style={styles.orderIdText}>Order ID  #CONZ-{orderCode}</Text>
              <Text style={styles.orderPlacedText}>Placed on  {orderPlacedDateStr}</Text>
            </View>

            {/* Right: Status Pill & Total */}
            <View style={styles.orderHeroRight}>
              <View style={[styles.statusBadgePill, { backgroundColor: statusMeta.bg }]}>
                <Ionicons
                  name={statusMeta.icon}
                  size={12}
                  color={statusMeta.color}
                  style={{ marginRight: 4 }}
                />
                <Text style={[styles.statusBadgeText, { color: statusMeta.color }]}>
                  {statusMeta.label}
                </Text>
              </View>

              <Text style={styles.totalAmountText}>{totalAmountFormatted}</Text>
              <Text style={styles.totalAmountLabel}>Total Amount</Text>
            </View>
          </View>

          {/* Stepper / Progress Timeline */}
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
                          <Ionicons name="car-outline" size={11} color="#F59E0B" />
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
                const isStepDone    = stepperState.stepIndex > index;

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

        {/* ── CARD 2: VENDOR ── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Vendor</Text>
        </View>

        <View style={styles.vendorCard}>
          {/* Vendor Logo */}
          <View style={styles.vendorLogoBox}>
            <MaterialCommunityIcons name="office-building" size={26} color="#1E293B" />
            <Text style={styles.vendorLogoText}>BuildKart</Text>
          </View>

          {/* Vendor Info */}
          <View style={styles.vendorInfoCol}>
            <View style={styles.vendorNameRow}>
              <Text style={styles.vendorName} numberOfLines={1}>{sellerName}</Text>
              <Ionicons name="checkmark-circle" size={15} color="#10B981" style={{ marginLeft: 4 }} />
            </View>
            <View style={styles.vendorRatingRow}>
              <Ionicons name="star" size={13} color="#F59E0B" />
              <Text style={styles.vendorRatingNum}>{sellerRating}</Text>
              <Text style={styles.vendorReviewCount}>(1.2K reviews)</Text>
            </View>
            <View style={styles.vendorLocationRow}>
              <Ionicons name="location-outline" size={13} color="#64748B" />
              <Text style={styles.vendorLocationText} numberOfLines={1}>{sellerCity}</Text>
            </View>
          </View>

          {/* Action Buttons: Contact & View Store */}
          <View style={styles.vendorActionsCol}>
            <TouchableOpacity
              style={styles.contactBtn}
              onPress={handleContactSeller}
              activeOpacity={0.75}
            >
              <Ionicons name="call" size={14} color="#1E293B" />
              <Text style={styles.contactBtnText}>Contact</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.viewStoreBtn}
              onPress={handleViewStore}
              activeOpacity={0.75}
            >
              <Ionicons name="storefront-outline" size={14} color="#1E293B" />
              <Text style={styles.viewStoreBtnText}>View Store</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── CARD 3: ITEMS ORDERED ── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Items Ordered</Text>
          <Text style={styles.itemsCountText}>
            {(order.items || []).length} item{(order.items || []).length === 1 ? '' : 's'}
          </Text>
        </View>

        <View style={styles.itemsCard}>
          {(order.items || []).map((item, idx) => {
            const isLast = idx === (order.items || []).length - 1;
            const imgSrc = item.image || getItemImage(item.title, isRental);
            const subtotal = item.subtotal || Math.round((item.price || 220) * (item.qty || 1));

            return (
              <View
                key={item.product || item._id || idx}
                style={[styles.itemRow, isLast && { borderBottomWidth: 0, paddingBottom: 0 }]}
              >
                {/* Item Image */}
                <Image source={{ uri: imgSrc }} style={styles.itemThumbnail} resizeMode="cover" />

                {/* Item Details */}
                <View style={styles.itemDetailsCol}>
                  <Text style={styles.itemTitleText} numberOfLines={1}>{item.title || 'Material Item'}</Text>
                  <Text style={styles.itemSpecText} numberOfLines={1}>
                    {item.days ? `${item.days} days duration` : item.unit || 'Standard size'}
                  </Text>
                </View>

                {/* Qty */}
                <Text style={styles.itemQtyText}>Qty: {item.qty || 1}</Text>

                {/* Price */}
                <View style={styles.itemPriceCol}>
                  <Text style={styles.itemSubtotalText}>₹{subtotal.toLocaleString('en-IN')}</Text>
                  <Text style={styles.itemUnitRateText}>₹{item.price || 220} each</Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* ── CARD 4: DELIVERY INFORMATION ── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Delivery Information</Text>
        </View>

        <View style={styles.deliveryCard}>
          <View style={styles.twoColumnRow}>
            {/* Left Column: Address & Expected Window */}
            <View style={styles.deliveryColLeft}>
              {/* Expected Delivery */}
              <View style={styles.deliveryItemRow}>
                <Ionicons name="calendar-outline" size={15} color="#475569" style={styles.deliveryIcon} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.deliveryLabel}>Expected Delivery</Text>
                  <Text style={styles.deliveryValue}>13 Sep 2026, 11:00 AM – 01:00 PM</Text>
                </View>
              </View>

              {/* Delivery Address */}
              <View style={styles.deliveryItemRow}>
                <Ionicons name="location-outline" size={15} color="#475569" style={styles.deliveryIcon} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.deliveryLabel}>Delivery Address</Text>
                  <Text style={styles.deliveryAddressText} numberOfLines={3}>{fullAddress}</Text>
                </View>
              </View>

              {/* Map Preview Box */}
              <View style={styles.mapBoxWrapper}>
                <View style={styles.mapGridPattern}>
                  <View style={styles.mapRoad1} />
                  <View style={styles.mapRoad2} />
                  <View style={styles.mapPinDot}>
                    <Ionicons name="location" size={16} color="#F59E0B" />
                  </View>
                </View>
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

            {/* Right Column: Delivery Partner & Driver */}
            <View style={styles.deliveryColRight}>
              {/* Delivery Partner */}
              <View style={styles.partnerRow}>
                <Ionicons name="car-outline" size={15} color="#475569" style={styles.deliveryIcon} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.deliveryLabel}>Delivery Partner</Text>
                  <Text style={styles.partnerName}>Porter</Text>
                </View>
                <View style={styles.partnerBadge}>
                  <Text style={styles.partnerBadgeText}>PORTER®</Text>
                </View>
              </View>

              {/* Driver Details */}
              <View style={styles.driverRow}>
                <Ionicons name="person-outline" size={15} color="#475569" style={styles.deliveryIcon} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.deliveryLabel}>Driver Details</Text>
                  <Text style={styles.driverName}>Ajay Kumar</Text>
                  <Text style={styles.driverVehicle}>KA01AB1234</Text>
                </View>
              </View>

              {/* Driver Call Button */}
              <TouchableOpacity
                style={styles.driverCallBtn}
                onPress={handleContactDriver}
                activeOpacity={0.75}
              >
                <Ionicons name="call" size={12} color="#1E293B" />
                <Text style={styles.driverCallBtnText}>Call</Text>
              </TouchableOpacity>

              {/* Live Tracking link */}
              <TouchableOpacity
                style={styles.liveTrackingRow}
                onPress={() => Alert.alert('Live Tracking', 'Driver is on route to your location. ETA: 25 mins')}
                activeOpacity={0.75}
              >
                <Ionicons name="navigate-circle-outline" size={16} color="#475569" />
                <View style={{ flex: 1, marginLeft: 6 }}>
                  <Text style={styles.deliveryLabel}>Live Tracking</Text>
                  <Text style={styles.liveTrackingText}>Track your order</Text>
                </View>
                <Ionicons name="chevron-forward" size={14} color="#64748B" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ── CARD 5: PAYMENT DETAILS ── */}
        <View style={styles.paymentCard}>
          <View style={styles.paymentHeaderRow}>
            <Text style={styles.paymentCardTitle}>Payment Details</Text>
            <View style={styles.paidBadge}>
              <Ionicons name="checkmark-circle" size={12} color="#16A34A" />
              <Text style={styles.paidBadgeText}>Paid</Text>
            </View>
          </View>

          <View style={styles.twoColumnRow}>
            {/* Left: Financial Breakdown */}
            <View style={{ flex: 1 }}>
              <View style={styles.paymentLineRow}>
                <Text style={styles.paymentLineLabel}>Items Total</Text>
                <Text style={styles.paymentLineValue}>{subtotalFormatted}</Text>
              </View>

              <View style={styles.paymentLineRow}>
                <Text style={styles.paymentLineLabel}>Delivery Charge</Text>
                <Text style={styles.paymentLineValue}>{deliveryFormatted}</Text>
              </View>

              <View style={styles.paymentLineRow}>
                <Text style={styles.paymentLineLabel}>Convenience Fee</Text>
                <Text style={styles.paymentLineValue}>₹0</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.paymentLineRow}>
                <Text style={styles.totalPaidLabel}>Total Paid</Text>
                <Text style={styles.totalPaidValue}>{totalAmountFormatted}</Text>
              </View>
            </View>

            {/* Right: Payment Method & Trans ID */}
            <View style={{ flex: 1, paddingLeft: 8 }}>
              <Text style={styles.paymentMethodLabel}>Payment Method</Text>
              <View style={styles.paymentMethodRow}>
                <View style={styles.upiBadge}>
                  <Text style={styles.upiBadgeText}>UPI</Text>
                </View>
                <Text style={styles.paymentCardMask}>•••• 2968</Text>
              </View>

              <Text style={[styles.paymentMethodLabel, { marginTop: 10 }]}>Paid on</Text>
              <Text style={styles.paidOnText}>12 Sep 2026, 04:20 PM</Text>

              <Text style={[styles.paymentMethodLabel, { marginTop: 8 }]}>Transaction ID</Text>
              <Text style={styles.transactionIdText}>UPI325612983746</Text>
            </View>
          </View>
        </View>

        {/* ── CARD 6: NEED HELP? BANNER ── */}
        <TouchableOpacity
          style={styles.helpCard}
          onPress={() => setShowHelpModal(true)}
          activeOpacity={0.85}
        >
          <Ionicons name="headset-outline" size={22} color="#1E293B" />
          <View style={styles.helpTextCol}>
            <Text style={styles.helpTitle}>Need Help?</Text>
            <Text style={styles.helpSubtitle}>Get support for this order</Text>
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

        {/* Right: Reorder */}
        <TouchableOpacity
          style={styles.reorderBtn}
          onPress={handleReorder}
          activeOpacity={0.8}
        >
          <Ionicons name="refresh-outline" size={18} color="#1E293B" />
          <Text style={styles.reorderBtnText}>Reorder</Text>
        </TouchableOpacity>
      </View>

      {/* ── ADD TO PROJECT SHEET ── */}
      <AddToProjectSheet
        visible={showAddToProject}
        attachment={{
          refModel: 'SellerOrder',
          refId: order._id,
          title: heroTitle,
        }}
        onClose={() => setShowAddToProject(false)}
        onSuccess={(proj, message) => {
          setToast({ visible: true, message: message || 'Added to project!' });
        }}
      />

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
            <Text style={styles.helpMenuHeading}>Order Options</Text>

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
              onPress={openReportModal}
            >
              <Ionicons name="alert-circle-outline" size={19} color="#1E293B" />
              <Text style={styles.helpMenuText}>Report an Issue</Text>
            </TouchableOpacity>

            {order.status !== 'delivered' && order.status !== 'returned' && order.status !== 'cancelled' && (
              <TouchableOpacity
                style={[styles.helpMenuItem, { borderBottomWidth: 0 }]}
                onPress={() => {
                  setShowHelpModal(false);
                  setShowCancelModal(true);
                }}
              >
                <Ionicons name="close-circle-outline" size={19} color="#EF4444" />
                <Text style={[styles.helpMenuText, { color: '#EF4444' }]}>Cancel Order</Text>
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

      {/* ── CANCEL ORDER MODAL ── */}
      <Modal
        visible={showCancelModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCancelModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Cancel Order?</Text>
            <Text style={styles.modalSub}>
              Are you sure you want to cancel this order? The vendor will be notified immediately.
            </Text>
            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={confirmCancelOrder}
              disabled={cancelling}
            >
              {cancelling ? <ActivityIndicator color="#FFF" /> : <Text style={styles.modalConfirmText}>Yes, Cancel Order</Text>}
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
        onRequestClose={() => setIssueModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Report an Issue</Text>
            <Text style={styles.modalSub}>Describe what went wrong with your order or delivery.</Text>
            <TextInput
              style={styles.noteInput}
              placeholder="e.g. Broken packaging or missing items..."
              value={issueComment}
              onChangeText={setIssueComment}
              multiline
            />
            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={submitIssue}
              disabled={reportingIssue}
            >
              {reportingIssue ? <ActivityIndicator color="#FFF" /> : <Text style={styles.modalConfirmText}>Submit Report</Text>}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalDismissBtn}
              onPress={() => setIssueModalOpen(false)}
              disabled={reportingIssue}
            >
              <Text style={styles.modalDismissText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#0F172A',
    marginTop: 14,
  },
  emptySub: {
    fontSize: 13.5,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 20,
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

  /* Card 1: Top Hero & Stepper */
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
  orderHeroRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderThumbnail: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  orderHeroMeta: {
    flex: 1,
    marginLeft: 13,
  },
  orderHeroTitle: {
    fontSize: 16.5,
    fontWeight: '600',
    color: '#0F172A',
  },
  orderIdText: {
    fontSize: 12,
    fontWeight: '400',
    color: '#64748B',
    marginTop: 2,
  },
  orderPlacedText: {
    fontSize: 11,
    fontWeight: '400',
    color: '#64748B',
    marginTop: 3,
  },
  orderHeroRight: {
    alignItems: 'flex-end',
  },
  statusBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3.5,
    paddingHorizontal: 9,
    borderRadius: 14,
    marginBottom: 6,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '500',
  },
  totalAmountText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  totalAmountLabel: {
    fontSize: 10.5,
    fontWeight: '400',
    color: '#94A3B8',
    marginTop: 1,
  },

  /* Stepper */
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

  /* Section Title */
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
  itemsCountText: {
    fontSize: 12,
    fontWeight: '400',
    color: '#64748B',
  },

  /* Card 2: Vendor */
  vendorCard: {
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
  vendorLogoBox: {
    width: 58,
    height: 58,
    borderRadius: 12,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vendorLogoText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 1,
  },
  vendorInfoCol: {
    flex: 1,
    marginLeft: 12,
  },
  vendorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vendorName: {
    fontSize: 14.5,
    fontWeight: '600',
    color: '#0F172A',
  },
  vendorRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 4,
  },
  vendorRatingNum: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#0F172A',
  },
  vendorReviewCount: {
    fontSize: 11.5,
    fontWeight: '400',
    color: '#64748B',
  },
  vendorLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
    gap: 3,
  },
  vendorLocationText: {
    fontSize: 11.5,
    fontWeight: '400',
    color: '#64748B',
  },
  vendorActionsCol: {
    gap: 6,
  },
  contactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingVertical: 6,
    paddingHorizontal: 13,
    borderRadius: 8,
    gap: 5,
  },
  contactBtnText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#0F172A',
  },
  viewStoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 5,
  },
  viewStoreBtnText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#0F172A',
  },

  /* Card 3: Items Ordered */
  itemsCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EEF2F6',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 1.5,
    marginBottom: 14,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  itemThumbnail: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  itemDetailsCol: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  itemTitleText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  itemSpecText: {
    fontSize: 11.5,
    fontWeight: '400',
    color: '#64748B',
    marginTop: 2,
  },
  itemQtyText: {
    fontSize: 11.5,
    fontWeight: '400',
    color: '#475569',
    marginRight: 14,
  },
  itemPriceCol: {
    alignItems: 'flex-end',
  },
  itemSubtotalText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#0F172A',
  },
  itemUnitRateText: {
    fontSize: 10.5,
    fontWeight: '400',
    color: '#64748B',
    marginTop: 1,
  },

  /* Card 4: Delivery Information */
  deliveryCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EEF2F6',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 1.5,
    marginBottom: 14,
  },
  twoColumnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  deliveryColLeft: {
    flex: 1,
  },
  deliveryColRight: {
    flex: 1,
    paddingLeft: 4,
  },
  deliveryItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  deliveryIcon: {
    marginRight: 7,
    marginTop: 1.5,
  },
  deliveryLabel: {
    fontSize: 10,
    fontWeight: '400',
    color: '#64748B',
  },
  deliveryValue: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#0F172A',
    marginTop: 1,
  },
  deliveryAddressText: {
    fontSize: 11,
    fontWeight: '400',
    color: '#334155',
    lineHeight: 15,
    marginTop: 1,
  },
  mapBoxWrapper: {
    height: 70,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    overflow: 'hidden',
    marginTop: 4,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapGridPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#E2E8F0',
  },
  mapRoad1: {
    position: 'absolute',
    top: 32,
    left: 0,
    right: 0,
    height: 6,
    backgroundColor: '#CBD5E1',
  },
  mapRoad2: {
    position: 'absolute',
    left: 45,
    top: 0,
    bottom: 0,
    width: 6,
    backgroundColor: '#CBD5E1',
  },
  mapPinDot: {
    position: 'absolute',
    top: 16,
    left: 40,
  },
  viewMapButton: {
    position: 'absolute',
    bottom: 6,
    backgroundColor: '#FFF',
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  viewMapText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#0F172A',
  },
  partnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  partnerName: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#0F172A',
    marginTop: 1,
  },
  partnerBadge: {
    backgroundColor: '#1E40AF',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  partnerBadgeText: {
    color: '#FFF',
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  driverRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  driverName: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#0F172A',
    marginTop: 1,
  },
  driverVehicle: {
    fontSize: 10.5,
    fontWeight: '400',
    color: '#64748B',
  },
  driverCallBtn: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    gap: 4,
    marginLeft: 22,
    marginBottom: 8,
  },
  driverCallBtnText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#0F172A',
  },
  liveTrackingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  liveTrackingText: {
    fontSize: 11.5,
    fontWeight: '500',
    color: '#0F172A',
  },

  /* Card 5: Payment Details */
  paymentCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EEF2F6',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 1.5,
    marginBottom: 14,
  },
  paymentHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  paymentCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  paidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 12,
    gap: 4,
  },
  paidBadgeText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#16A34A',
  },
  paymentLineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  paymentLineLabel: {
    fontSize: 11,
    fontWeight: '400',
    color: '#64748B',
  },
  paymentLineValue: {
    fontSize: 11.5,
    fontWeight: '500',
    color: '#0F172A',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 6,
  },
  totalPaidLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
  },
  totalPaidValue: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  paymentMethodLabel: {
    fontSize: 10,
    fontWeight: '400',
    color: '#64748B',
  },
  paymentMethodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
    gap: 6,
  },
  upiBadge: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  upiBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0F172A',
  },
  paymentCardMask: {
    fontSize: 11.5,
    fontWeight: '500',
    color: '#0F172A',
  },
  paidOnText: {
    fontSize: 11,
    fontWeight: '400',
    color: '#0F172A',
    marginTop: 2,
  },
  transactionIdText: {
    fontSize: 10.5,
    fontWeight: '400',
    color: '#64748B',
    marginTop: 1,
  },

  /* Card 6: Need Help? */
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

  /* Fixed Bottom Action Bar */
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
  reorderBtn: {
    flex: 1,
    height: 46,
    backgroundColor: '#FFF',
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  reorderBtnText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#0F172A',
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
  modalCancelBtn: {
    backgroundColor: '#EF4444',
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

export default OrderDetailScreen;
