import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Modal,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import useAppStore from '../store/useAppStore';
import AddToProjectSheet from '../components/AddToProjectSheet';
import SlideToast from '../components/SlideToast';

// Role-specific avatar with slender circular background and lightweight vector icon
const BookingAvatar = React.memo(({ type }) => {
  switch (type) {
    case 'painter':
      return (
        <View style={[styles.avatarCircle, { backgroundColor: '#FFF7ED', borderColor: '#FFEDD5' }]}>
          <View style={styles.avatarInner}>
            <MaterialCommunityIcons name="account-hard-hat-outline" size={20} color="#D97706" />
            <FontAwesome5 name="paint-roller" size={8} color="#D97706" style={styles.avatarSubIcon} />
          </View>
        </View>
      );
    case 'electrician':
      return (
        <View style={[styles.avatarCircle, { backgroundColor: '#FEF2F2', borderColor: '#FEE2E2' }]}>
          <View style={styles.avatarInner}>
            <MaterialCommunityIcons name="account-hard-hat-outline" size={20} color="#EF4444" />
            <MaterialCommunityIcons name="power-plug-outline" size={9} color="#EF4444" style={styles.avatarSubIcon} />
          </View>
        </View>
      );
    case 'masonry':
      return (
        <View style={[styles.avatarCircle, { backgroundColor: '#FFFBEB', borderColor: '#FEF3C7' }]}>
          <MaterialCommunityIcons name="wall" size={18} color="#D97706" />
        </View>
      );
    case 'plumber':
      return (
        <View style={[styles.avatarCircle, { backgroundColor: '#EFF6FF', borderColor: '#DBEAFE' }]}>
          <MaterialCommunityIcons name="pipe-wrench" size={18} color="#2563EB" />
        </View>
      );
    case 'carpenter':
      return (
        <View style={[styles.avatarCircle, { backgroundColor: '#FFF7ED', borderColor: '#FFEDD5' }]}>
          <MaterialCommunityIcons name="hammer-wrench" size={18} color="#D97706" />
        </View>
      );
    case 'welder':
      return (
        <View style={[styles.avatarCircle, { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' }]}>
          <MaterialCommunityIcons name="flash-outline" size={18} color="#D97706" />
        </View>
      );
    case 'material':
      return (
        <View style={[styles.avatarCircle, { backgroundColor: '#EFF6FF', borderColor: '#DBEAFE' }]}>
          <MaterialCommunityIcons name="package-variant-closed" size={18} color="#2563EB" />
        </View>
      );
    case 'rental':
      return (
        <View style={[styles.avatarCircle, { backgroundColor: '#FAF5FF', borderColor: '#F3E8FF' }]}>
          <MaterialCommunityIcons name="tractor" size={18} color="#7C3AED" />
        </View>
      );
    default:
      return (
        <View style={[styles.avatarCircle, { backgroundColor: '#FFF7ED', borderColor: '#FFEDD5' }]}>
          <MaterialCommunityIcons name="account-hard-hat-outline" size={20} color="#D97706" />
        </View>
      );
  }
});
BookingAvatar.displayName = 'BookingAvatar';

// Clean list card matching design
const BookingCard = React.memo(({ item, onViewDetails, onAddToProject }) => {
  return (
    <TouchableOpacity
      style={styles.cardContainer}
      onPress={() => onViewDetails(item)}
      activeOpacity={0.88}
    >
      <BookingAvatar type={item.iconType} />

      <View style={styles.cardContent}>
        <Text style={styles.serviceTitle} numberOfLines={1}>{item.category || 'Service'}</Text>

        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="account-outline" size={14} color="#64748B" />
          <Text style={styles.vendorName} numberOfLines={1}>{item.vendor || item.workerName || 'Vendor'}</Text>
        </View>

        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="map-marker-outline" size={14} color="#64748B" />
          <Text style={styles.locationText} numberOfLines={1}>{item.location}</Text>
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <MaterialCommunityIcons name="calendar-blank-outline" size={12} color="#64748B" />
            <Text style={styles.metaText}>{item.dates}</Text>
          </View>
          <View style={styles.metaItem}>
            <MaterialCommunityIcons name="clock-outline" size={12} color="#64748B" />
            <Text style={styles.metaText}>{item.duration}</Text>
          </View>
          <View style={styles.metaItem}>
            <MaterialCommunityIcons name="pound" size={11} color="#64748B" />
            <Text style={styles.metaText}>{item.bookingCode?.replace('#', '') || item._id?.slice(-6)?.toUpperCase()}</Text>
          </View>
        </View>
      </View>

      <View style={styles.cardRight}>
        {item.status === 'completed' && (
          <View style={styles.statusBadge}>
            <MaterialCommunityIcons name="check" size={14} color="#10B981" />
            <Text style={styles.statusCompletedText}>Completed</Text>
          </View>
        )}
        {item.status === 'cancelled' && (
          <View style={styles.statusBadge}>
            <MaterialCommunityIcons name="close" size={14} color="#EF4444" />
            <Text style={styles.statusCancelledText}>Cancelled</Text>
          </View>
        )}
        {item.status === 'active' && (
          <View style={styles.statusBadge}>
            <View style={styles.activeDot} />
            <Text style={styles.statusActiveText}>Active</Text>
          </View>
        )}

        <View style={styles.priceRow}>
          <Text style={styles.priceText}>₹{Number(item.price || item.total).toLocaleString('en-IN')}</Text>
          <MaterialCommunityIcons name="chevron-right" size={18} color="#94A3B8" />
        </View>

        <View style={styles.viewDetailsBtn}>
          <Text style={styles.viewDetailsText}>View details</Text>
          <MaterialCommunityIcons name="chevron-right" size={13} color="#0F172A" />
        </View>

        {item.projectName ? (
          <View style={styles.assignedBadge}>
            <Text style={styles.assignedText} numberOfLines={1}>{item.projectName} • Assigned</Text>
            <MaterialCommunityIcons name="open-in-new" size={12} color="#10B981" />
          </View>
        ) : item.status !== 'cancelled' ? (
          <TouchableOpacity
            style={styles.addProjectBtn}
            onPress={(e) => {
              e?.stopPropagation?.();
              onAddToProject(item);
            }}
            activeOpacity={0.7}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Text style={styles.addProjectText}>+ Add to project</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </TouchableOpacity>
  );
});
BookingCard.displayName = 'BookingCard';

const StatusScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const {
    labourBookings,
    labourBookingsLoading,
    fetchLabourBookings,
    setActiveBookingId,
    sellerOrders,
    sellerOrdersLoading,
    fetchMySellerOrders,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState('labour'); // 'labour' | 'order' | 'rental'
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'active' | 'completed' | 'cancelled'
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recent'); // 'recent' | 'price_high' | 'price_low'
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedAttachment, setSelectedAttachment] = useState(null);
  const [showAddToProject, setShowAddToProject] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '' });

  useFocusEffect(
    useCallback(() => {
      fetchLabourBookings();
      fetchMySellerOrders();
    }, [fetchLabourBookings, fetchMySellerOrders])
  );

  const handleViewBooking = useCallback(async (booking) => {
    if (booking._id) {
      await setActiveBookingId(booking._id);
    }
    navigation.navigate('BookingDetail');
  }, [setActiveBookingId, navigation]);

  const handleViewOrder = useCallback((order) => {
    navigation.navigate('OrderDetail', { orderId: order._id });
  }, [navigation]);

  const handleViewItem = useCallback((item) => {
    if (item.serviceType === 'labour') {
      handleViewBooking(item.rawBooking || item);
    } else {
      handleViewOrder(item.rawOrder || item);
    }
  }, [handleViewBooking, handleViewOrder]);

  const handleOpenAddToProject = useCallback((item) => {
    setSelectedAttachment({
      refModel: item.serviceType === 'labour' ? 'Booking' : 'SellerOrder',
      refId: item._id,
      title: item.category ? `${item.category} Booking` : 'Booking',
    });
    setShowAddToProject(true);
  }, []);

  const handleCloseAddToProject = useCallback(() => {
    setShowAddToProject(false);
  }, []);

  const handleAddToProjectSuccess = useCallback((project, message) => {
    setToast({ visible: true, message });
  }, []);

  const handleDismissToast = useCallback(() => {
    setToast({ visible: false, message: '' });
  }, []);

  const onRefresh = useCallback(() => {
    fetchLabourBookings();
    fetchMySellerOrders();
  }, [fetchLabourBookings, fetchMySellerOrders]);

  // Real labour bookings only
  const allLabour = useMemo(() => {
    if (!labourBookings || labourBookings.length === 0) {
      return [];
    }
    return labourBookings.map((b) => {
      const worker = b.workers?.[0];
      const start = b.startDate ? new Date(b.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '—';
      const end = b.endDate ? new Date(b.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '—';
      return {
        _id: b._id,
        bookingCode: `#${b._id.slice(-6).toUpperCase()}`,
        category: b.category || 'Labour',
        serviceType: 'labour',
        vendor: worker?.fullName || (b.isAutobook ? 'Auto Book Crew' : 'Worker Crew'),
        workerName: worker?.fullName || 'Worker Crew',
        location: b.area ? `${b.area}, ${b.city}` : (b.city || 'Bengaluru'),
        dates: `${start} - ${end}`,
        duration: `${b.totalDays || 1} day${(b.totalDays || 1) > 1 ? 's' : ''}`,
        status: b.status === 'completed' ? 'completed' : (b.status === 'cancelled' ? 'cancelled' : 'active'),
        price: b.total || 0,
        total: b.total || 0,
        projectName: b.projectName || null,
        iconType: (b.category || '').toLowerCase().includes('paint') ? 'painter' :
                  (b.category || '').toLowerCase().includes('elect') ? 'electrician' :
                  (b.category || '').toLowerCase().includes('mason') ? 'masonry' :
                  (b.category || '').toLowerCase().includes('plumb') ? 'plumber' :
                  (b.category || '').toLowerCase().includes('carpent') ? 'carpenter' : 'painter',
        isReal: true,
        rawBooking: b,
      };
    });
  }, [labourBookings]);

  // Real material orders only
  const allMaterials = useMemo(() => {
    return (sellerOrders || [])
      .filter((o) => o.orderType === 'material')
      .map((o) => {
        const orderDate = o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '—';
        return {
          _id: o._id,
          bookingCode: `#${(o._id || '').slice(-6).toUpperCase()}`,
          category: (o.items || []).map((i) => i.title || i.name).filter(Boolean).join(', ') || 'Materials',
          serviceType: 'order',
          orderType: 'material',
          vendor: o.sellerName || o.shopName || 'Material Vendor',
          location: o.city || 'Bengaluru',
          dates: orderDate,
          duration: '1 day',
          status: o.status === 'delivered' ? 'completed' : (o.status === 'cancelled' ? 'cancelled' : 'active'),
          price: o.total || 0,
          total: o.total || 0,
          projectName: o.projectName || null,
          iconType: 'material',
          isReal: true,
          rawOrder: o,
        };
      });
  }, [sellerOrders]);

  // Real rental orders only
  const allRentals = useMemo(() => {
    return (sellerOrders || [])
      .filter((o) => o.orderType === 'rental')
      .map((o) => {
        const rentalDate = o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '—';
        return {
          _id: o._id,
          bookingCode: `#${(o._id || '').slice(-6).toUpperCase()}`,
          category: (o.items || []).map((i) => i.title || i.name).filter(Boolean).join(', ') || 'Equipment Rental',
          serviceType: 'rental',
          orderType: 'rental',
          vendor: o.sellerName || o.shopName || 'Rental Vendor',
          location: o.city || 'Bengaluru',
          dates: rentalDate,
          duration: `${o.rentalDays || 1} day${(o.rentalDays || 1) > 1 ? 's' : ''}`,
          status: o.status === 'returned' ? 'completed' : (o.status === 'cancelled' ? 'cancelled' : 'active'),
          price: o.total || 0,
          total: o.total || 0,
          projectName: o.projectName || null,
          iconType: 'rental',
          isReal: true,
          rawOrder: o,
        };
      });
  }, [sellerOrders]);

  // Overall metric counts computed strictly from real data
  const allBookings = useMemo(() => [...allLabour, ...allMaterials, ...allRentals], [allLabour, allMaterials, allRentals]);
  const totalBookingsCount = allBookings.length;
  const activeBookingsCount = allBookings.filter((b) => b.status === 'active').length;
  const completedBookingsCount = allBookings.filter((b) => b.status === 'completed').length;
  const cancelledBookingsCount = allBookings.filter((b) => b.status === 'cancelled').length;

  // Segment counts
  const labourCount = allLabour.length;
  const materialCount = allMaterials.length;
  const rentalCount = allRentals.length;

  // Current segment items
  const currentSegmentList =
    activeTab === 'labour' ? allLabour :
    activeTab === 'order'  ? allMaterials :
    allRentals;

  // Filtered and searched list
  const displayList = useMemo(() => {
    let list = [...currentSegmentList];

    if (activeFilter !== 'all') {
      list = list.filter((b) => b.status === activeFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((b) =>
        (b.category || '').toLowerCase().includes(q) ||
        (b.vendor || '').toLowerCase().includes(q) ||
        (b.workerName || '').toLowerCase().includes(q) ||
        (b.location || '').toLowerCase().includes(q) ||
        (b.bookingCode || '').toLowerCase().includes(q)
      );
    }

    if (sortBy === 'price_high') {
      list.sort((a, b) => (b.price || b.total || 0) - (a.price || a.total || 0));
    } else if (sortBy === 'price_low') {
      list.sort((a, b) => (a.price || a.total || 0) - (b.price || b.total || 0));
    }

    return list;
  }, [currentSegmentList, activeFilter, searchQuery, sortBy]);

  const handleSelectFilter = (filterKey) => {
    setActiveFilter(filterKey);
  };

  const handleSelectTab = (tabKey) => {
    setActiveTab(tabKey);
  };

  const toggleSort = () => {
    setSortBy((prev) => (prev === 'recent' ? 'price_high' : prev === 'price_high' ? 'price_low' : 'recent'));
  };

  const isLoading = labourBookingsLoading || sellerOrdersLoading;

  return (
    <View style={[styles.screen, { paddingTop: Math.max(insets.top, 12) + 6 }]}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerTextCol}>
          <Text style={styles.headerTitle}>My Bookings</Text>
          <Text style={styles.headerSubtitle}>Track your labour, materials and rentals</Text>
        </View>
        <TouchableOpacity
          style={styles.bellBtn}
          onPress={() => setToast({ visible: true, message: 'You are all caught up!' })}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="bell-outline" size={26} color="#111827" />
          <View style={styles.bellBadge} />
        </TouchableOpacity>
      </View>

      {/* Metrics Summary Row */}
      <View style={styles.metricsWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.metricsScroll}>
          <View style={styles.metricPill}>
            <MaterialCommunityIcons name="file-document-outline" size={14} color="#475569" />
            <Text style={styles.metricText}>{totalBookingsCount} bookings</Text>
          </View>
          <View style={styles.metricPill}>
            <View style={[styles.statusDot, { backgroundColor: '#10B981' }]} />
            <Text style={styles.metricText}>{activeBookingsCount} active</Text>
          </View>
          <View style={styles.metricPill}>
            <MaterialCommunityIcons name="check-circle-outline" size={14} color="#10B981" />
            <Text style={styles.metricText}>{completedBookingsCount} completed</Text>
          </View>
          <View style={styles.metricPill}>
            <MaterialCommunityIcons name="close-circle-outline" size={14} color="#EF4444" />
            <Text style={styles.metricText}>{cancelledBookingsCount} cancelled</Text>
          </View>
        </ScrollView>
      </View>

      {/* Primary Segment Switcher (Labour, Materials, Rentals) */}
      <View style={styles.segmentRow}>
        <TouchableOpacity
          style={styles.segmentTab}
          onPress={() => handleSelectTab('labour')}
          activeOpacity={0.8}
        >
          <View style={styles.segmentInner}>
            <MaterialCommunityIcons
              name="account-outline"
              size={18}
              color={activeTab === 'labour' ? '#D97706' : '#64748B'}
            />
            <Text style={[styles.segmentLabel, activeTab === 'labour' && styles.segmentLabelActive]}>
              Labour
            </Text>
            <View style={[styles.segmentBadge, activeTab === 'labour' && styles.segmentBadgeActive]}>
              <Text style={[styles.segmentBadgeText, activeTab === 'labour' && styles.segmentBadgeTextActive]}>
                {labourCount}
              </Text>
            </View>
          </View>
          {activeTab === 'labour' && <View style={styles.segmentUnderline} />}
        </TouchableOpacity>

        <View style={styles.segmentDivider} />

        <TouchableOpacity
          style={styles.segmentTab}
          onPress={() => handleSelectTab('order')}
          activeOpacity={0.8}
        >
          <View style={styles.segmentInner}>
            <MaterialCommunityIcons
              name="cube-outline"
              size={18}
              color={activeTab === 'order' ? '#D97706' : '#64748B'}
            />
            <Text style={[styles.segmentLabel, activeTab === 'order' && styles.segmentLabelActive]}>
              Materials
            </Text>
            <View style={[styles.segmentBadge, activeTab === 'order' && styles.segmentBadgeActive]}>
              <Text style={[styles.segmentBadgeText, activeTab === 'order' && styles.segmentBadgeTextActive]}>
                {materialCount}
              </Text>
            </View>
          </View>
          {activeTab === 'order' && <View style={styles.segmentUnderline} />}
        </TouchableOpacity>

        <View style={styles.segmentDivider} />

        <TouchableOpacity
          style={styles.segmentTab}
          onPress={() => handleSelectTab('rental')}
          activeOpacity={0.8}
        >
          <View style={styles.segmentInner}>
            <MaterialCommunityIcons
              name="tractor"
              size={18}
              color={activeTab === 'rental' ? '#D97706' : '#64748B'}
            />
            <Text style={[styles.segmentLabel, activeTab === 'rental' && styles.segmentLabelActive]}>
              Rentals
            </Text>
            <View style={[styles.segmentBadge, activeTab === 'rental' && styles.segmentBadgeActive]}>
              <Text style={[styles.segmentBadgeText, activeTab === 'rental' && styles.segmentBadgeTextActive]}>
                {rentalCount}
              </Text>
            </View>
          </View>
          {activeTab === 'rental' && <View style={styles.segmentUnderline} />}
        </TouchableOpacity>
      </View>

      {/* Search Bar & Filter Button */}
      <View style={styles.searchFilterRow}>
        <View style={styles.searchInputWrapper}>
          <MaterialCommunityIcons name="magnify" size={20} color="#94A3B8" style={{ marginRight: 6 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search bookings by service, vendor or location"
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <MaterialCommunityIcons name="close-circle" size={16} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={styles.filterBtn}
          onPress={() => setShowFilterModal(true)}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="tune-variant" size={16} color="#1E293B" />
          <Text style={styles.filterBtnText}>Filter</Text>
          <MaterialCommunityIcons name="chevron-down" size={16} color="#64748B" />
        </TouchableOpacity>
      </View>

      {/* Status Filter Tabs */}
      <View style={styles.filterTabsRow}>
        <TouchableOpacity
          style={styles.filterTab}
          onPress={() => handleSelectFilter('all')}
          activeOpacity={0.8}
        >
          <Text style={[styles.filterTabText, activeFilter === 'all' && styles.filterTabTextActive]}>
            All ({totalBookingsCount})
          </Text>
          {activeFilter === 'all' && <View style={styles.filterTabUnderline} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.filterTab}
          onPress={() => handleSelectFilter('active')}
          activeOpacity={0.8}
        >
          <Text style={[styles.filterTabText, activeFilter === 'active' && styles.filterTabTextActive]}>
            Active ({activeBookingsCount})
          </Text>
          {activeFilter === 'active' && <View style={styles.filterTabUnderline} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.filterTab}
          onPress={() => handleSelectFilter('completed')}
          activeOpacity={0.8}
        >
          <Text style={[styles.filterTabText, activeFilter === 'completed' && styles.filterTabTextActive]}>
            Completed ({completedBookingsCount})
          </Text>
          {activeFilter === 'completed' && <View style={styles.filterTabUnderline} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.filterTab}
          onPress={() => handleSelectFilter('cancelled')}
          activeOpacity={0.8}
        >
          <Text style={[styles.filterTabText, activeFilter === 'cancelled' && styles.filterTabTextActive]}>
            Cancelled ({cancelledBookingsCount})
          </Text>
          {activeFilter === 'cancelled' && <View style={styles.filterTabUnderline} />}
        </TouchableOpacity>
      </View>

      {/* Subheader / Sort Bar */}
      <View style={styles.subheaderRow}>
        <Text style={styles.subheaderTitle}>Recent bookings</Text>
        <View style={styles.subheaderRight}>
          <TouchableOpacity style={styles.sortDropdown} onPress={toggleSort} activeOpacity={0.7}>
            <Text style={styles.sortDropdownText}>
              {sortBy === 'recent' ? 'Most recent' : sortBy === 'price_high' ? 'Price: High' : 'Price: Low'}
            </Text>
            <MaterialCommunityIcons name="chevron-down" size={14} color="#64748B" />
          </TouchableOpacity>
          <View style={styles.layoutToggleBtn}>
            <MaterialCommunityIcons name="format-list-bulleted" size={16} color="#1E293B" />
          </View>
        </View>
      </View>

      {/* Scrollable Booking List */}
      <ScrollView
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={onRefresh} colors={['#D97706']} tintColor="#D97706" />
        }
        showsVerticalScrollIndicator={false}
      >
        {displayList.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="clipboard-text-search-outline" size={48} color="#94A3B8" style={{ marginBottom: 12 }} />
            <Text style={styles.emptyTitle}>No bookings found</Text>
            <Text style={styles.emptySubtitle}>Try changing your search query or status filter</Text>
          </View>
        ) : (
          displayList.map((item) => (
            <BookingCard
              key={item._id}
              item={item}
              onViewDetails={handleViewItem}
              onAddToProject={handleOpenAddToProject}
            />
          ))
        )}
      </ScrollView>

      {/* Filter Modal */}
      <Modal visible={showFilterModal} transparent animationType="fade" onRequestClose={() => setShowFilterModal(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setShowFilterModal(false)}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Filter Bookings</Text>
            <TouchableOpacity
              style={[styles.modalOption, activeFilter === 'all' && styles.modalOptionActive]}
              onPress={() => { handleSelectFilter('all'); setShowFilterModal(false); }}
            >
              <Text style={[styles.modalOptionText, activeFilter === 'all' && styles.modalOptionTextActive]}>
                All Bookings ({totalBookingsCount})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalOption, activeFilter === 'active' && styles.modalOptionActive]}
              onPress={() => { handleSelectFilter('active'); setShowFilterModal(false); }}
            >
              <Text style={[styles.modalOptionText, activeFilter === 'active' && styles.modalOptionTextActive]}>
                Active Only ({activeBookingsCount})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalOption, activeFilter === 'completed' && styles.modalOptionActive]}
              onPress={() => { handleSelectFilter('completed'); setShowFilterModal(false); }}
            >
              <Text style={[styles.modalOptionText, activeFilter === 'completed' && styles.modalOptionTextActive]}>
                Completed Only ({completedBookingsCount})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalOption, activeFilter === 'cancelled' && styles.modalOptionActive]}
              onPress={() => { handleSelectFilter('cancelled'); setShowFilterModal(false); }}
            >
              <Text style={[styles.modalOptionText, activeFilter === 'cancelled' && styles.modalOptionTextActive]}>
                Cancelled Only ({cancelledBookingsCount})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowFilterModal(false)}>
              <Text style={styles.modalCloseBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* Project Attachment Sheet & Toast */}
      <AddToProjectSheet
        visible={showAddToProject}
        attachment={selectedAttachment}
        onClose={handleCloseAddToProject}
        onSuccess={handleAddToProjectSuccess}
      />
      <SlideToast visible={toast.visible} message={toast.message} onDismiss={handleDismissToast} />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  headerTextCol: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12.5,
    color: '#64748B',
    fontWeight: '400',
    marginTop: 2,
  },
  bellBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginLeft: 12,
  },
  bellBadge: {
    position: 'absolute',
    top: 6,
    right: 7,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#F59E0B',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },

  // Metric pills
  metricsWrapper: {
    backgroundColor: '#FFFFFF',
    paddingBottom: 10,
  },
  metricsScroll: {
    paddingHorizontal: 16,
    gap: 7,
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  metricText: {
    fontSize: 11.5,
    fontWeight: '500',
    color: '#334155',
  },

  // Primary Segment Switcher (Labour, Materials, Rentals)
  segmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingHorizontal: 8,
  },
  segmentTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    position: 'relative',
  },
  segmentInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  segmentLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
  },
  segmentLabelActive: {
    color: '#D97706',
    fontWeight: '600',
  },
  segmentBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  segmentBadgeActive: {
    backgroundColor: '#FEF3C7',
  },
  segmentBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
  },
  segmentBadgeTextActive: {
    color: '#D97706',
  },
  segmentUnderline: {
    position: 'absolute',
    bottom: 0,
    left: 12,
    right: 12,
    height: 1.5,
    backgroundColor: '#D97706',
    borderRadius: 1,
  },
  segmentDivider: {
    width: 1,
    height: 16,
    backgroundColor: '#F1F5F9',
  },

  // Search & Filter row
  searchFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 38,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    backgroundColor: '#FAFAFA',
    paddingHorizontal: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    fontWeight: '400',
    color: '#1E293B',
    padding: 0,
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 38,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    gap: 4,
  },
  filterBtnText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#334155',
  },

  // Status Filter Tabs
  filterTabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingHorizontal: 8,
  },
  filterTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    position: 'relative',
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
  },
  filterTabTextActive: {
    color: '#D97706',
    fontWeight: '600',
  },
  filterTabUnderline: {
    position: 'absolute',
    bottom: 0,
    left: 12,
    right: 12,
    height: 1.5,
    backgroundColor: '#D97706',
    borderRadius: 1,
  },

  // Subheader
  subheaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#F8FAFC',
  },
  subheaderTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  subheaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sortDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  sortDropdownText: {
    fontSize: 11.5,
    fontWeight: '500',
    color: '#64748B',
  },
  layoutToggleBtn: {
    width: 26,
    height: 26,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },

  // List content & Cards
  listContent: {
    paddingHorizontal: 14,
    paddingTop: 4,
    paddingBottom: 40,
  },
  cardContainer: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 13,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarInner: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    width: 24,
    height: 24,
  },
  avatarSubIcon: {
    position: 'absolute',
    right: -3,
    bottom: -1,
  },
  cardContent: {
    flex: 1,
    paddingRight: 6,
  },
  serviceTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  vendorName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#475569',
  },
  locationText: {
    fontSize: 11.5,
    fontWeight: '400',
    color: '#64748B',
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 7,
    marginTop: 6,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2.5,
  },
  metaText: {
    fontSize: 10.5,
    color: '#64748B',
    fontWeight: '400',
  },

  // Right side of card
  cardRight: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2.5,
  },
  statusCompletedText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#10B981',
  },
  statusCancelledText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#EF4444',
  },
  activeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#F59E0B',
  },
  statusActiveText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#F59E0B',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  priceText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
  viewDetailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  viewDetailsText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#475569',
  },
  assignedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 3,
  },
  assignedText: {
    fontSize: 10.5,
    fontWeight: '500',
    color: '#10B981',
  },
  addProjectBtn: {
    marginTop: 3,
  },
  addProjectText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#D97706',
  },

  // Empty state
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 6,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 12,
    fontWeight: '400',
    color: '#94A3B8',
    textAlign: 'center',
  },

  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 14,
  },
  modalOption: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 6,
    backgroundColor: '#F8FAFC',
  },
  modalOptionActive: {
    backgroundColor: '#FEF3C7',
  },
  modalOptionText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#475569',
  },
  modalOptionTextActive: {
    color: '#D97706',
    fontWeight: '600',
  },
  modalCloseBtn: {
    marginTop: 10,
    alignItems: 'center',
    paddingVertical: 8,
  },
  modalCloseBtnText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
  },
});

export default StatusScreen;