import React, { useCallback, useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Modal,
  Pressable,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import useAppStore from '../store/useAppStore';
import SavedAddressSheet from '../components/SavedAddressSheet';

const CartScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  // Store slices
  const cart = useAppStore((s) => s.cart);
  const cartItemsMap = useAppStore((s) => s.cartItemsMap);
  const materials = useAppStore((s) => s.materials);
  const addToCart = useAppStore((s) => s.addToCart);
  const removeFromCart = useAppStore((s) => s.removeFromCart);
  const clearCart = useAppStore((s) => s.clearCart);
  const getCartItems = useAppStore((s) => s.getCartItems);
  const loadPersistedCart = useAppStore((s) => s.loadPersistedCart);
  const fetchMaterials = useAppStore((s) => s.fetchMaterials);
  const fetchRentalData = useAppStore((s) => s.fetchRentalData);

  const rentalCart = useAppStore((s) => s.rentalCart);
  const removeFromRentalCart = useAppStore((s) => s.removeFromRentalCart);
  const clearRentalCart = useAppStore((s) => s.clearRentalCart);

  const myProjects = useAppStore((s) => s.myProjects);
  const fetchMyProjects = useAppStore((s) => s.fetchMyProjects);
  const userLocationText = useAppStore((s) => s.userLocationText);

  // Local state
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'materials' | 'rentals'
  const [selectedItems, setSelectedItems] = useState({}); // { [id]: boolean }
  const [materialsCollapsed, setMaterialsCollapsed] = useState(false);
  const [rentalsCollapsed, setRentalsCollapsed] = useState(false);

  // Address & Project selection
  const [showAddressSheet, setShowAddressSheet] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showProjectModal, setShowProjectModal] = useState(false);

  // Breakup modal
  const [showBreakupModal, setShowBreakupModal] = useState(false);

  useEffect(() => {
    loadPersistedCart();
    fetchMyProjects();
    fetchMaterials();
    fetchRentalData();
  }, [loadPersistedCart, fetchMyProjects, fetchMaterials, fetchRentalData]);

  useEffect(() => {
    if (myProjects && myProjects.length > 0 && !selectedProject) {
      setSelectedProject(myProjects[0]);
    }
  }, [myProjects, selectedProject]);

  const materialItems = useMemo(() => getCartItems(), [cart, materials, cartItemsMap, getCartItems]);

  // Default all items to selected when cart changes
  useEffect(() => {
    setSelectedItems((prev) => {
      const next = { ...prev };
      materialItems.forEach((m) => {
        const id = String(m.id || m._id);
        if (next[`mat_${id}`] === undefined) next[`mat_${id}`] = true;
      });
      rentalCart.forEach((r) => {
        const id = String(r.id || r._id);
        if (next[`ren_${id}`] === undefined) next[`ren_${id}`] = true;
      });
      return next;
    });
  }, [materialItems, rentalCart]);

  const toggleItemSelect = (key) => {
    setSelectedItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Group materials by seller/vendor
  const materialVendors = useMemo(() => {
    const map = {};
    materialItems.forEach((item) => {
      const vendorName = item.seller || 'RN Enterprises';
      if (!map[vendorName]) {
        map[vendorName] = {
          name: vendorName,
          subtitle: 'Building better together',
          deliveryCharge: 250,
          deliveryTime: '1 - 2 days',
          items: [],
        };
      }
      map[vendorName].items.push(item);
    });
    return Object.values(map);
  }, [materialItems]);

  // Group rentals by seller/vendor
  const rentalVendors = useMemo(() => {
    const map = {};
    rentalCart.forEach((item) => {
      const vendorName = item.seller || 'PowerUp Rentals';
      if (!map[vendorName]) {
        map[vendorName] = {
          name: vendorName,
          subtitle: 'Equip your ambition',
          deliveryCharge: 800,
          deliveryTime: 'Same day',
          items: [],
        };
      }
      map[vendorName].items.push(item);
    });
    return Object.values(map);
  }, [rentalCart]);

  // Selected counts & financial calculations
  const {
    selectedMaterialsCount,
    selectedRentalsCount,
    totalSelectedItems,
    materialsSubtotal,
    materialsDeliveryTotal,
    rentalsSubtotal,
    rentalsDeliveryTotal,
    grandTotal,
  } = useMemo(() => {
    let matCount = 0;
    let matSub = 0;
    let matDeliv = 0;

    materialVendors.forEach((vendor) => {
      let hasSelectedFromVendor = false;
      vendor.items.forEach((item) => {
        const itemId = String(item.id || item._id);
        if (selectedItems[`mat_${itemId}`]) {
          const qty = Number(cart[itemId]) || Number(cart[item.id]) || 1;
          matCount += qty;
          matSub += (Number(item.price) || 0) * qty;
          hasSelectedFromVendor = true;
        }
      });
      if (hasSelectedFromVendor) {
        matDeliv += vendor.deliveryCharge;
      }
    });

    let renCount = 0;
    let renSub = 0;
    let renDeliv = 0;

    rentalVendors.forEach((vendor) => {
      let hasSelectedFromVendor = false;
      vendor.items.forEach((item) => {
        const itemId = String(item.id || item._id);
        if (selectedItems[`ren_${itemId}`]) {
          const days = Number(item.rentalDays) || 3;
          renCount += 1;
          renSub += (Number(item.pricePerDay) || 600) * days;
          hasSelectedFromVendor = true;
        }
      });
      if (hasSelectedFromVendor) {
        renDeliv += vendor.deliveryCharge;
      }
    });

    return {
      selectedMaterialsCount: matCount,
      selectedRentalsCount: renCount,
      totalSelectedItems: matCount + renCount,
      materialsSubtotal: matSub,
      materialsDeliveryTotal: matDeliv,
      rentalsSubtotal: renSub,
      rentalsDeliveryTotal: renDeliv,
      grandTotal: matSub + matDeliv + renSub + renDeliv,
    };
  }, [materialVendors, rentalVendors, selectedItems, cart]);

  const totalCartCount = materialItems.length + rentalCart.length;

  const handleClearAll = () => {
    Alert.alert('Clear Cart', 'Remove all items from your cart?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear All',
        style: 'destructive',
        onPress: () => {
          clearCart();
          clearRentalCart();
        },
      },
    ]);
  };

  const handleProceedToCheckout = () => {
    if (totalSelectedItems === 0) {
      Alert.alert('No Items Selected', 'Please select at least one item to proceed.');
      return;
    }

    const selectedMatList = materialItems.filter((m) => selectedItems[`mat_${String(m.id || m._id)}`]);
    const selectedRenList = rentalCart.filter((r) => selectedItems[`ren_${String(r.id || r._id)}`]);

    navigation.navigate('Checkout', {
      selectedMaterials: selectedMatList,
      selectedRentals: selectedRenList,
      cart,
      selectedProject,
      selectedAddress,
      deliveryLocationText: selectedAddress?.address || userLocationText || 'Sri Maregowda Circle, Bengaluru - 560002',
    });
  };

  const displayAddress = selectedAddress?.address || userLocationText || 'Sri Maregowda Circle, Bengaluru - 560002';

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleCol}>
          <Text style={styles.headerTitle}>Cart</Text>
          <Text style={styles.headerSubtitle}>Review and place your order</Text>
        </View>
        {totalCartCount > 0 && (
          <TouchableOpacity onPress={handleClearAll} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.clearAllText}>Clear all</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Top Delivery & Project Selector Card */}
      <View style={styles.selectorCard}>
        {/* Deliver to section */}
        <TouchableOpacity
          style={styles.selectorLeft}
          onPress={() => setShowAddressSheet(true)}
          activeOpacity={0.75}
        >
          <MaterialCommunityIcons name="map-marker" size={17} color="#EA580C" style={{ marginRight: 6 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.selectorSmallLabel}>Deliver to</Text>
            <View style={styles.selectorRow}>
              <Text style={styles.selectorValueText} numberOfLines={1}>
                {displayAddress}
              </Text>
              <MaterialCommunityIcons name="chevron-down" size={14} color="#64748B" />
            </View>
          </View>
        </TouchableOpacity>

        <View style={styles.selectorDivider} />

        {/* Project selector section */}
        <TouchableOpacity
          style={styles.selectorRight}
          onPress={() => setShowProjectModal(true)}
          activeOpacity={0.75}
        >
          <MaterialCommunityIcons name="folder-outline" size={17} color="#475569" style={{ marginRight: 6 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.selectorSmallLabel}>Project</Text>
            <View style={styles.selectorRow}>
              <Text style={styles.selectorValueText} numberOfLines={1}>
                {selectedProject?.name || 'None'}
              </Text>
              <MaterialCommunityIcons name="chevron-down" size={14} color="#64748B" />
            </View>
          </View>
        </TouchableOpacity>
      </View>

      {/* Category Tabs: All items | Materials | Rentals */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'all' && styles.tabBtnActive]}
          onPress={() => setActiveTab('all')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}>
            All items ({totalCartCount})
          </Text>
          {activeTab === 'all' && <View style={styles.tabUnderline} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'materials' && styles.tabBtnActive]}
          onPress={() => setActiveTab('materials')}
          activeOpacity={0.8}
        >
          <View style={styles.tabInnerWithIcon}>
            <MaterialCommunityIcons
              name="package-variant-closed"
              size={15}
              color={activeTab === 'materials' ? '#D97706' : '#64748B'}
            />
            <Text style={[styles.tabText, activeTab === 'materials' && styles.tabTextActive]}>
              Materials ({materialItems.length})
            </Text>
          </View>
          {activeTab === 'materials' && <View style={styles.tabUnderline} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'rentals' && styles.tabBtnActive]}
          onPress={() => setActiveTab('rentals')}
          activeOpacity={0.8}
        >
          <View style={styles.tabInnerWithIcon}>
            <MaterialCommunityIcons
              name="tractor"
              size={15}
              color={activeTab === 'rentals' ? '#D97706' : '#64748B'}
            />
            <Text style={[styles.tabText, activeTab === 'rentals' && styles.tabTextActive]}>
              Rentals ({rentalCart.length})
            </Text>
          </View>
          {activeTab === 'rentals' && <View style={styles.tabUnderline} />}
        </TouchableOpacity>
      </View>

      {/* Cart Scrollable Content */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {totalCartCount === 0 ? (
          <View style={styles.emptyCartCard}>
            <MaterialCommunityIcons name="cart-outline" size={54} color="#94A3B8" style={{ marginBottom: 12 }} />
            <Text style={styles.emptyCartTitle}>Your cart is empty</Text>
            <Text style={styles.emptyCartSub}>Add construction materials or equipment rentals to get started.</Text>
            <View style={styles.emptyActionRow}>
              <TouchableOpacity
                style={styles.emptyBrowseBtn}
                onPress={() => navigation.navigate('Booking', { screen: 'BookingHome' })}
              >
                <Text style={styles.emptyBrowseBtnText}>Explore Materials</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            {/* MATERIALS SECTION */}
            {(activeTab === 'all' || activeTab === 'materials') && materialItems.length > 0 && (
              <View style={styles.categorySection}>
                {/* Section Header */}
                <TouchableOpacity
                  style={styles.categoryHeader}
                  onPress={() => setMaterialsCollapsed(!materialsCollapsed)}
                  activeOpacity={0.7}
                >
                  <View style={styles.categoryHeaderLeft}>
                    <View style={[styles.categoryIconCircle, { backgroundColor: '#FFEDD5' }]}>
                      <MaterialCommunityIcons name="package-variant-closed" size={17} color="#EA580C" />
                    </View>
                    <View>
                      <Text style={styles.categoryTitle}>
                        Materials <Text style={styles.itemCountText}>{materialItems.length} items</Text>
                      </Text>
                      <Text style={styles.categorySubtitle}>Supplied and delivered by material vendors</Text>
                    </View>
                  </View>
                  <MaterialCommunityIcons
                    name={materialsCollapsed ? 'chevron-down' : 'chevron-up'}
                    size={20}
                    color="#64748B"
                  />
                </TouchableOpacity>

                {!materialsCollapsed &&
                  materialVendors.map((vendor) => {
                    const vendorSubtotal = vendor.items.reduce(
                      (sum, i) => sum + (Number(i.price) || 0) * (Number(cart[i.id]) || 0),
                      0
                    );

                    return (
                      <View key={vendor.name} style={styles.vendorBlock}>
                        {/* Vendor Header */}
                        <View style={styles.vendorHeaderRow}>
                          <View style={styles.vendorAvatar}>
                            <Text style={styles.vendorInitials}>{vendor.name.slice(0, 2).toUpperCase()}</Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                              <Text style={styles.vendorName}>{vendor.name}</Text>
                              <MaterialCommunityIcons name="chevron-right" size={14} color="#64748B" />
                            </View>
                            <Text style={styles.vendorSubtitle}>{vendor.subtitle}</Text>
                          </View>
                          <View style={styles.vendorDeliveryMeta}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                              <MaterialCommunityIcons name="truck-delivery-outline" size={13} color="#64748B" />
                              <Text style={styles.vendorMetaLabel}>Delivery charge</Text>
                            </View>
                            <Text style={styles.vendorMetaValue}>₹{vendor.deliveryCharge}</Text>
                          </View>
                          <View style={styles.vendorDividerLine} />
                          <View style={styles.vendorDeliveryMeta}>
                            <Text style={styles.vendorMetaLabel}>Delivery in</Text>
                            <Text style={styles.vendorMetaValue}>{vendor.deliveryTime}</Text>
                          </View>
                        </View>

                        {/* Vendor Items */}
                        {vendor.items.map((item) => {
                          const itemId = String(item.id || item._id);
                          const itemKey = `mat_${itemId}`;
                          const isSelected = !!selectedItems[itemKey];
                          const qty = Number(cart[itemId]) || Number(cart[item.id]) || 1;
                          const lineTotal = (Number(item.price) || 0) * qty;

                          return (
                            <View key={itemId} style={styles.itemRow}>
                              {/* Checkbox */}
                              <TouchableOpacity
                                style={[styles.checkbox, isSelected && styles.checkboxChecked]}
                                onPress={() => toggleItemSelect(itemKey)}
                                activeOpacity={0.7}
                              >
                                {isSelected && <MaterialCommunityIcons name="check" size={13} color="#FFFFFF" />}
                              </TouchableOpacity>

                              {/* Image */}
                              <Image
                                source={item.image ? { uri: item.image } : require('../../assets/images/project_default.jpg')}
                                style={styles.itemThumb}
                                resizeMode="cover"
                              />

                              {/* Info Column */}
                              <View style={styles.itemInfoCol}>
                                <Text style={styles.itemTitle} numberOfLines={1}>{item.name}</Text>
                                <Text style={styles.itemSizeText}>50 kg (1 bag)</Text>
                                <Text style={styles.itemPricePerUnit}>₹{item.price} / bag</Text>
                                <View style={styles.stockBadge}>
                                  <View style={styles.stockDot} />
                                  <Text style={styles.stockBadgeText}>In stock</Text>
                                </View>
                              </View>

                              {/* Stepper and Price Column */}
                              <View style={styles.itemRightCol}>
                                <Text style={styles.itemLineTotal}>₹{lineTotal.toLocaleString('en-IN')}</Text>
                                <Text style={styles.itemCalcSub}>₹{item.price} × {qty}</Text>

                                <View style={styles.stepperContainer}>
                                  <TouchableOpacity
                                    style={styles.stepperBtn}
                                    onPress={() => removeFromCart(item)}
                                    activeOpacity={0.7}
                                  >
                                    <MaterialCommunityIcons name="minus" size={13} color="#0F172A" />
                                  </TouchableOpacity>
                                  <Text style={styles.stepperValue}>{qty}</Text>
                                  <TouchableOpacity
                                    style={styles.stepperBtn}
                                    onPress={() => addToCart(item)}
                                    activeOpacity={0.7}
                                  >
                                    <MaterialCommunityIcons name="plus" size={13} color="#0F172A" />
                                  </TouchableOpacity>
                                </View>
                              </View>

                              {/* Footer Actions: Remove | Save for later */}
                              <View style={styles.itemActionsRow}>
                                <TouchableOpacity
                                  style={styles.itemActionTouch}
                                  onPress={() => addToCart({ id: itemId, _setQty: 0 })}
                                  activeOpacity={0.7}
                                >
                                  <MaterialCommunityIcons name="trash-can-outline" size={13} color="#64748B" />
                                  <Text style={styles.itemActionText}>Remove</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                  style={styles.itemActionTouch}
                                  onPress={() => Alert.alert('Saved', 'Item saved for later.')}
                                  activeOpacity={0.7}
                                >
                                  <MaterialCommunityIcons name="bookmark-outline" size={13} color="#64748B" />
                                  <Text style={styles.itemActionText}>Save for later</Text>
                                </TouchableOpacity>
                              </View>
                            </View>
                          );
                        })}

                        {/* Vendor Subtotal Line */}
                        <View style={styles.vendorSubtotalLine}>
                          <Text style={styles.vendorSubtotalLabel}>
                            {vendor.name} subtotal ({vendor.items.length} items)
                          </Text>
                          <Text style={styles.vendorSubtotalValue}>₹{vendorSubtotal.toLocaleString('en-IN')}</Text>
                        </View>
                        <View style={styles.vendorDeliveryLine}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                            <Text style={styles.vendorDeliveryLabel}>Delivery charges</Text>
                            <MaterialCommunityIcons name="information-outline" size={12} color="#94A3B8" />
                          </View>
                          <Text style={styles.vendorDeliveryValue}>₹{vendor.deliveryCharge}</Text>
                        </View>
                      </View>
                    );
                  })}
              </View>
            )}

            {/* RENTALS SECTION */}
            {(activeTab === 'all' || activeTab === 'rentals') && rentalCart.length > 0 && (
              <View style={styles.categorySection}>
                {/* Section Header */}
                <TouchableOpacity
                  style={styles.categoryHeader}
                  onPress={() => setRentalsCollapsed(!rentalsCollapsed)}
                  activeOpacity={0.7}
                >
                  <View style={styles.categoryHeaderLeft}>
                    <View style={[styles.categoryIconCircle, { backgroundColor: '#FFEDD5' }]}>
                      <MaterialCommunityIcons name="tractor" size={17} color="#EA580C" />
                    </View>
                    <View>
                      <Text style={styles.categoryTitle}>
                        Rentals <Text style={styles.itemCountText}>{rentalCart.length} item</Text>
                      </Text>
                      <Text style={styles.categorySubtitle}>Supplied and delivered by rental vendors</Text>
                    </View>
                  </View>
                  <MaterialCommunityIcons
                    name={rentalsCollapsed ? 'chevron-down' : 'chevron-up'}
                    size={20}
                    color="#64748B"
                  />
                </TouchableOpacity>

                {!rentalsCollapsed &&
                  rentalVendors.map((vendor) => {
                    const vendorSubtotal = vendor.items.reduce((sum, i) => {
                      const days = Number(i.rentalDays) || 3;
                      return sum + (Number(i.pricePerDay) || 600) * days;
                    }, 0);

                    return (
                      <View key={vendor.name} style={styles.vendorBlock}>
                        {/* Vendor Header */}
                        <View style={styles.vendorHeaderRow}>
                          <View style={styles.vendorAvatar}>
                            <Text style={styles.vendorInitials}>{vendor.name.slice(0, 2).toUpperCase()}</Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                              <Text style={styles.vendorName}>{vendor.name}</Text>
                              <MaterialCommunityIcons name="chevron-right" size={14} color="#64748B" />
                            </View>
                            <Text style={styles.vendorSubtitle}>{vendor.subtitle}</Text>
                          </View>
                          <View style={styles.vendorDeliveryMeta}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                              <MaterialCommunityIcons name="truck-delivery-outline" size={13} color="#64748B" />
                              <Text style={styles.vendorMetaLabel}>Delivery charge</Text>
                            </View>
                            <Text style={styles.vendorMetaValue}>₹{vendor.deliveryCharge}</Text>
                          </View>
                          <View style={styles.vendorDividerLine} />
                          <View style={styles.vendorDeliveryMeta}>
                            <Text style={styles.vendorMetaLabel}>Delivery in</Text>
                            <Text style={styles.vendorMetaValue}>{vendor.deliveryTime}</Text>
                          </View>
                        </View>

                        {/* Rental Items */}
                        {vendor.items.map((item) => {
                          const itemId = String(item.id || item._id);
                          const itemKey = `ren_${itemId}`;
                          const isSelected = !!selectedItems[itemKey];
                          const days = Number(item.rentalDays) || 3;
                          const rate = Number(item.pricePerDay) || 600;
                          const lineTotal = rate * days;

                          return (
                            <View key={itemId} style={styles.itemRow}>
                              <TouchableOpacity
                                style={[styles.checkbox, isSelected && styles.checkboxChecked]}
                                onPress={() => toggleItemSelect(itemKey)}
                                activeOpacity={0.7}
                              >
                                {isSelected && <MaterialCommunityIcons name="check" size={13} color="#FFFFFF" />}
                              </TouchableOpacity>

                              <Image
                                source={item.image ? { uri: item.image } : require('../../assets/images/rental_tractor.jpg')}
                                style={styles.itemThumb}
                                resizeMode="cover"
                              />

                              <View style={styles.itemInfoCol}>
                                <Text style={styles.itemTitle} numberOfLines={1}>{item.name}</Text>
                                <Text style={styles.itemSizeText}>With operator (optional)</Text>
                                <Text style={styles.itemPricePerUnit}>₹{rate} / day</Text>

                                <View style={styles.rentalDatesRow}>
                                  <MaterialCommunityIcons name="calendar-blank-outline" size={12} color="#64748B" />
                                  <Text style={styles.rentalDatesText}>12 Sep 2024 → 15 Sep 2024</Text>
                                  <Text style={styles.rentalDaysBadge}>{days} days</Text>
                                  <TouchableOpacity onPress={() => Alert.alert('Edit Dates', 'Select new rental dates.')}>
                                    <Text style={styles.rentalEditLink}>Edit</Text>
                                  </TouchableOpacity>
                                </View>

                                <View style={styles.stockBadge}>
                                  <View style={styles.stockDot} />
                                  <Text style={styles.stockBadgeText}>Available</Text>
                                </View>
                              </View>

                              <View style={styles.itemRightCol}>
                                <Text style={styles.itemLineTotal}>₹{lineTotal.toLocaleString('en-IN')}</Text>
                                <Text style={styles.itemCalcSub}>{days} days × ₹{rate}</Text>
                              </View>

                              {/* Footer Actions */}
                              <View style={styles.itemActionsRow}>
                                <TouchableOpacity
                                  style={styles.itemActionTouch}
                                  onPress={() => removeFromRentalCart(itemId)}
                                  activeOpacity={0.7}
                                >
                                  <MaterialCommunityIcons name="trash-can-outline" size={13} color="#64748B" />
                                  <Text style={styles.itemActionText}>Remove</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                  style={styles.itemActionTouch}
                                  onPress={() => Alert.alert('Saved', 'Item saved for later.')}
                                  activeOpacity={0.7}
                                >
                                  <MaterialCommunityIcons name="bookmark-outline" size={13} color="#64748B" />
                                  <Text style={styles.itemActionText}>Save for later</Text>
                                </TouchableOpacity>
                              </View>
                            </View>
                          );
                        })}

                        {/* Vendor Subtotal Line */}
                        <View style={styles.vendorSubtotalLine}>
                          <Text style={styles.vendorSubtotalLabel}>
                            {vendor.name} subtotal ({vendor.items.length} item)
                          </Text>
                          <Text style={styles.vendorSubtotalValue}>₹{vendorSubtotal.toLocaleString('en-IN')}</Text>
                        </View>
                        <View style={styles.vendorDeliveryLine}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                            <Text style={styles.vendorDeliveryLabel}>Delivery charges</Text>
                            <MaterialCommunityIcons name="information-outline" size={12} color="#94A3B8" />
                          </View>
                          <Text style={styles.vendorDeliveryValue}>₹{vendor.deliveryCharge}</Text>
                        </View>
                      </View>
                    );
                  })}
              </View>
            )}

            {/* Price Summary Card */}
            <View style={styles.priceSummaryCard}>
              <Text style={styles.priceSummaryTitle}>Price Summary</Text>

              {materialVendors.map((v) => (
                <React.Fragment key={v.name}>
                  <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>Materials ({v.name})</Text>
                    <Text style={styles.priceValue}>₹{materialsSubtotal.toLocaleString('en-IN')}</Text>
                  </View>
                  <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>Materials delivery charge</Text>
                    <Text style={styles.priceValue}>₹{materialsDeliveryTotal.toLocaleString('en-IN')}</Text>
                  </View>
                </React.Fragment>
              ))}

              {rentalVendors.map((v) => (
                <React.Fragment key={v.name}>
                  <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>Rentals ({v.name})</Text>
                    <Text style={styles.priceValue}>₹{rentalsSubtotal.toLocaleString('en-IN')}</Text>
                  </View>
                  <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>Rentals delivery charge</Text>
                    <Text style={styles.priceValue}>₹{rentalsDeliveryTotal.toLocaleString('en-IN')}</Text>
                  </View>
                </React.Fragment>
              ))}

              <View style={styles.totalRow}>
                <View>
                  <Text style={styles.totalLabel}>Total Amount</Text>
                  <Text style={styles.totalSub}>Includes GST and applicable fees</Text>
                </View>
                <Text style={styles.totalValue}>₹{grandTotal.toLocaleString('en-IN')}</Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {/* Sticky Bottom Bar */}
      {totalCartCount > 0 && (
        <View style={styles.bottomBar}>
          <View style={styles.bottomLeftCol}>
            <Text style={styles.bottomItemCount}>{totalSelectedItems} items</Text>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
              <Text style={styles.bottomTotalAmount}>₹{grandTotal.toLocaleString('en-IN')}</Text>
              <TouchableOpacity
                style={styles.viewBreakupTouch}
                onPress={() => setShowBreakupModal(true)}
              >
                <Text style={styles.viewBreakupText}>View breakup</Text>
                <MaterialCommunityIcons name="chevron-up" size={14} color="#EA580C" />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={styles.checkoutBtn}
            onPress={handleProceedToCheckout}
            activeOpacity={0.88}
          >
            <Text style={styles.checkoutBtnText}>Proceed to Checkout</Text>
            <MaterialCommunityIcons name="arrow-right" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}

      {/* Project Selection Modal */}
      <Modal visible={showProjectModal} transparent animationType="fade" onRequestClose={() => setShowProjectModal(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setShowProjectModal(false)}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Select Project</Text>
            <Text style={styles.modalSub}>Link this order to a project to track expenses and status together.</Text>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 300 }}>
              <TouchableOpacity
                style={[styles.projectOption, !selectedProject && styles.projectOptionSelected]}
                onPress={() => {
                  setSelectedProject(null);
                  setShowProjectModal(false);
                }}
              >
                <Text style={[styles.projectOptionText, !selectedProject && styles.projectOptionTextSelected]}>
                  No Project (General Order)
                </Text>
              </TouchableOpacity>

              {(myProjects || []).map((p) => {
                const isSel = selectedProject?._id === p._id;
                return (
                  <TouchableOpacity
                    key={p._id}
                    style={[styles.projectOption, isSel && styles.projectOptionSelected]}
                    onPress={() => {
                      setSelectedProject(p);
                      setShowProjectModal(false);
                    }}
                  >
                    <View style={styles.projectOptionDot} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.projectOptionText, isSel && styles.projectOptionTextSelected]}>
                        {p.name}
                      </Text>
                      <Text style={styles.projectOptionMeta}>{p.location || 'Bengaluru, Karnataka'}</Text>
                    </View>
                    {isSel && <MaterialCommunityIcons name="check" size={16} color="#D97706" />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowProjectModal(false)}>
              <Text style={styles.modalCloseBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* Breakup Modal */}
      <Modal visible={showBreakupModal} transparent animationType="fade" onRequestClose={() => setShowBreakupModal(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setShowBreakupModal(false)}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Bill Breakup</Text>
            <View style={styles.breakupRow}>
              <Text style={styles.breakupLabel}>Materials Items ({selectedMaterialsCount}):</Text>
              <Text style={styles.breakupValue}>₹{materialsSubtotal.toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.breakupRow}>
              <Text style={styles.breakupLabel}>Materials Delivery Charges:</Text>
              <Text style={styles.breakupValue}>₹{materialsDeliveryTotal.toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.breakupRow}>
              <Text style={styles.breakupLabel}>Rentals Items ({selectedRentalsCount}):</Text>
              <Text style={styles.breakupValue}>₹{rentalsSubtotal.toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.breakupRow}>
              <Text style={styles.breakupLabel}>Rentals Delivery Charges:</Text>
              <Text style={styles.breakupValue}>₹{rentalsDeliveryTotal.toLocaleString('en-IN')}</Text>
            </View>
            <View style={[styles.breakupRow, { borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingTop: 8, marginTop: 6 }]}>
              <Text style={[styles.breakupLabel, { fontWeight: '700', color: '#0F172A' }]}>Grand Total:</Text>
              <Text style={[styles.breakupValue, { fontWeight: '700', color: '#0F172A' }]}>₹{grandTotal.toLocaleString('en-IN')}</Text>
            </View>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowBreakupModal(false)}>
              <Text style={styles.modalCloseBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* Saved Address Sheet */}
      <SavedAddressSheet
        visible={showAddressSheet}
        onClose={() => setShowAddressSheet(false)}
        onSelectAddress={(addr) => {
          setSelectedAddress(addr);
          setShowAddressSheet(false);
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
  headerTitleCol: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '400',
    marginTop: 2,
  },
  clearAllText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#EA580C',
  },

  // Selector Card (Delivery & Project)
  selectorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 14,
    marginTop: 6,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  selectorLeft: {
    flex: 1.3,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 8,
  },
  selectorRight: {
    flex: 0.9,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 8,
  },
  selectorDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#F1F5F9',
  },
  selectorSmallLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '400',
  },
  selectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  selectorValueText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
    flex: 1,
  },

  // Tab Row
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingHorizontal: 10,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 11,
    position: 'relative',
  },
  tabBtnActive: {},
  tabInnerWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tabText: {
    fontSize: 12.5,
    fontWeight: '500',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#D97706',
    fontWeight: '600',
  },
  tabUnderline: {
    position: 'absolute',
    bottom: 0,
    left: 8,
    right: 8,
    height: 2,
    backgroundColor: '#D97706',
    borderRadius: 1,
  },

  scrollContent: {
    paddingBottom: 90,
  },

  // Category Section
  categorySection: {
    borderBottomWidth: 6,
    borderBottomColor: '#F8FAFC',
    paddingBottom: 10,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  categoryHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  categoryIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  itemCountText: {
    fontSize: 12,
    fontWeight: '400',
    color: '#64748B',
  },
  categorySubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },

  // Vendor Block
  vendorBlock: {
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  vendorHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  vendorAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vendorInitials: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
  },
  vendorName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  vendorSubtitle: {
    fontSize: 10.5,
    color: '#64748B',
  },
  vendorDeliveryMeta: {
    alignItems: 'flex-end',
  },
  vendorMetaLabel: {
    fontSize: 9.5,
    color: '#64748B',
  },
  vendorMetaValue: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0F172A',
  },
  vendorDividerLine: {
    width: 1,
    height: 22,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 4,
  },

  // Items
  itemRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  checkboxChecked: {
    backgroundColor: '#EA580C',
    borderColor: '#EA580C',
  },
  itemThumb: {
    width: 58,
    height: 58,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    marginRight: 10,
  },
  itemInfoCol: {
    flex: 1,
    paddingRight: 6,
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  itemSizeText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  itemPricePerUnit: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#0F172A',
    marginTop: 2,
  },
  stockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3.5,
    backgroundColor: '#ECFDF5',
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 4,
  },
  stockDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#10B981',
  },
  stockBadgeText: {
    fontSize: 9.5,
    fontWeight: '600',
    color: '#10B981',
  },

  itemRightCol: {
    alignItems: 'flex-end',
  },
  itemLineTotal: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  itemCalcSub: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
    marginBottom: 6,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    height: 28,
  },
  stepperBtn: {
    paddingHorizontal: 8,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
    paddingHorizontal: 6,
  },

  rentalDatesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
    flexWrap: 'wrap',
  },
  rentalDatesText: {
    fontSize: 10.5,
    color: '#64748B',
  },
  rentalDaysBadge: {
    fontSize: 10,
    fontWeight: '600',
    color: '#475569',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  rentalEditLink: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#D97706',
  },

  itemActionsRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 14,
    marginTop: 8,
    paddingTop: 4,
  },
  itemActionTouch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  itemActionText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '400',
  },

  vendorSubtotalLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
  },
  vendorSubtotalLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
  },
  vendorSubtotalValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  vendorDeliveryLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  vendorDeliveryLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  vendorDeliveryValue: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#0F172A',
  },

  // Price Summary Card
  priceSummaryCard: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  priceSummaryTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 10,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  priceLabel: {
    fontSize: 12,
    color: '#475569',
  },
  priceValue: {
    fontSize: 12.5,
    fontWeight: '500',
    color: '#0F172A',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 10,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  totalSub: {
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 1,
  },
  totalValue: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },

  // Sticky Bottom Bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 8,
  },
  bottomLeftCol: {
    justifyContent: 'center',
  },
  bottomItemCount: {
    fontSize: 11,
    color: '#64748B',
  },
  bottomTotalAmount: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  viewBreakupTouch: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 6,
  },
  viewBreakupText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#EA580C',
  },
  checkoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EA580C',
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 10,
    gap: 6,
  },
  checkoutBtnText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Empty cart
  emptyCartCard: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyCartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 4,
  },
  emptyCartSub: {
    fontSize: 12.5,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 16,
  },
  emptyActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  emptyBrowseBtn: {
    backgroundColor: '#EA580C',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
  },
  emptyBrowseBtnText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Modals
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
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
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  modalSub: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 12,
  },
  projectOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 6,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  projectOptionSelected: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  projectOptionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D97706',
    marginRight: 8,
  },
  projectOptionText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#334155',
  },
  projectOptionTextSelected: {
    color: '#92400E',
    fontWeight: '600',
  },
  projectOptionMeta: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  breakupRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  breakupLabel: {
    fontSize: 12.5,
    color: '#475569',
  },
  breakupValue: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#0F172A',
  },
  modalCloseBtn: {
    marginTop: 12,
    alignItems: 'center',
    paddingVertical: 8,
  },
  modalCloseBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#EA580C',
  },
});

export default CartScreen;
