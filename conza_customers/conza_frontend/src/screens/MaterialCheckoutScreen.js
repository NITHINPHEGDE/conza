import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  Modal,
  Pressable,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import useAppStore from '../store/useAppStore';
import SavedAddressSheet from '../components/SavedAddressSheet';
import { bookingAPI } from '../api/bookingAPI';

const MaterialCheckoutScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const {
    selectedMaterials = [],
    selectedRentals = [],
    cart = {},
    selectedProject: initialProject = null,
    selectedAddress: initialAddress = null,
    deliveryLocationText: initialLocationText = '',
  } = route.params || {};

  // Store slices
  const userProfile = useAppStore((s) => s.userProfile);
  const userLocationText = useAppStore((s) => s.userLocationText);
  const userLat = useAppStore((s) => s.userLat);
  const userLng = useAppStore((s) => s.userLng);
  const myProjects = useAppStore((s) => s.myProjects);
  const addAttachmentToProject = useAppStore((s) => s.addAttachmentToProject);
  const addSellerOrder = useAppStore((s) => s.addSellerOrder);
  const clearCart = useAppStore((s) => s.clearCart);
  const clearRentalCart = useAppStore((s) => s.clearRentalCart);

  // Selected project & address
  const [selectedProject, setSelectedProject] = useState(initialProject);
  const [showProjectModal, setShowProjectModal] = useState(false);

  const [selectedAddress, setSelectedAddress] = useState(initialAddress);
  const [showAddressSheet, setShowAddressSheet] = useState(false);

  // Payment Method
  const [paymentMethod, setPaymentMethod] = useState('upi'); // 'upi' | 'card' | 'netbanking' | 'wallet'
  const [submitting, setSubmitting] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const displayAddress = selectedAddress?.address || initialLocationText || userLocationText || 'Sri Maregowda Circle, Bengaluru - 560002';
  const recipientName = userProfile?.name || userProfile?.fullName || 'Rifat Kazi';
  const recipientPhone = userProfile?.phone || '98765 43210';

  // Group materials by vendor
  const materialsByVendor = useMemo(() => {
    const map = {};
    selectedMaterials.forEach((item) => {
      const vendor = item.seller || 'RN Enterprises';
      if (!map[vendor]) {
        map[vendor] = {
          vendorName: vendor,
          sellerId: item.sellerId || item.seller,
          deliveryCharge: 250,
          deliveryTime: '1 - 2 days',
          items: [],
        };
      }
      map[vendor].items.push(item);
    });
    return Object.values(map);
  }, [selectedMaterials]);

  // Group rentals by vendor
  const rentalsByVendor = useMemo(() => {
    const map = {};
    selectedRentals.forEach((item) => {
      const vendor = item.seller || 'PowerUp Rentals';
      if (!map[vendor]) {
        map[vendor] = {
          vendorName: vendor,
          sellerId: item.sellerId || item.seller,
          deliveryCharge: 800,
          deliveryTime: '12 Sep, 9:00 AM',
          items: [],
        };
      }
      map[vendor].items.push(item);
    });
    return Object.values(map);
  }, [selectedRentals]);

  // Totals calculations
  const {
    itemsCount,
    vendorsCount,
    materialsSubtotal,
    materialsDeliveryTotal,
    rentalsSubtotal,
    rentalsDeliveryTotal,
    itemsTotal,
    grandTotal,
  } = useMemo(() => {
    let mSub = 0;
    let mDeliv = 0;
    materialsByVendor.forEach((v) => {
      v.items.forEach((i) => {
        const itemId = String(i.id || i._id);
        const qty = Number(cart[itemId]) || Number(cart[i.id]) || 1;
        mSub += (Number(i.price) || 0) * qty;
      });
      mDeliv += v.deliveryCharge;
    });

    let rSub = 0;
    let rDeliv = 0;
    rentalsByVendor.forEach((v) => {
      v.items.forEach((i) => {
        const days = Number(i.rentalDays) || 3;
        rSub += (Number(i.pricePerDay) || 600) * days;
      });
      rDeliv += v.deliveryCharge;
    });

    const iTotal = mSub + rSub;
    const vCount = materialsByVendor.length + rentalsByVendor.length;
    const iCount = selectedMaterials.length + selectedRentals.length;

    return {
      itemsCount: iCount,
      vendorsCount: vCount,
      materialsSubtotal: mSub,
      materialsDeliveryTotal: mDeliv,
      rentalsSubtotal: rSub,
      rentalsDeliveryTotal: rDeliv,
      itemsTotal: iTotal,
      grandTotal: iTotal + mDeliv + rDeliv,
    };
  }, [materialsByVendor, rentalsByVendor, cart, selectedMaterials, selectedRentals]);

  const handlePlaceOrder = async () => {
    setSubmitting(true);
    try {
      const createdOrders = [];

      // 1. Submit Material Orders (one per vendor)
      for (const v of materialsByVendor) {
        const sub = v.items.reduce((s, i) => {
          const itemId = String(i.id || i._id);
          const qty = Number(cart[itemId]) || Number(cart[i.id]) || 1;
          return s + (Number(i.price) || 0) * qty;
        }, 0);
        const tot = sub + v.deliveryCharge;

        const payload = {
          sellerId: v.sellerId,
          orderType: 'material',
          items: v.items.map((i) => {
            const itemId = String(i.id || i._id);
            const qty = Number(cart[itemId]) || Number(cart[i.id]) || 1;
            return {
              productId: itemId,
              qty,
              subtotal: (Number(i.price) || 0) * qty,
            };
          }),
          customerAddress: displayAddress,
          city: 'Bengaluru',
          pincode: '560002',
          latitude: userLat || 12.9716,
          longitude: userLng || 77.5946,
          subtotal: sub,
          deliveryCharge: v.deliveryCharge,
          total: tot,
          paymentMethod,
          notes: selectedProject ? `Project: ${selectedProject.name}` : '',
        };

        const res = await bookingAPI.placeSellerOrder(payload);
        if (res.success && res.order) {
          addSellerOrder(res.order);
          createdOrders.push(res.order);

          // Attach to project if chosen
          if (selectedProject?._id) {
            await addAttachmentToProject(selectedProject._id, {
              refModel: 'SellerOrder',
              refId: res.order._id,
            });
          }
        }
      }

      // 2. Submit Rental Orders (one per vendor)
      for (const v of rentalsByVendor) {
        const sub = v.items.reduce((s, i) => s + (Number(i.pricePerDay) || 600) * (Number(i.rentalDays) || 3), 0);
        const tot = sub + v.deliveryCharge;

        const payload = {
          sellerId: v.sellerId,
          orderType: 'rental',
          items: v.items.map((i) => ({
            productId: String(i.id || i._id),
            qty: 1,
            subtotal: (Number(i.pricePerDay) || 600) * (Number(i.rentalDays) || 3),
            rentalDays: Number(i.rentalDays) || 3,
            startDate: i.startDate || '12 Sep 2024',
            endDate: i.endDate || '15 Sep 2024',
            withOperator: true,
          })),
          customerAddress: displayAddress,
          city: 'Bengaluru',
          pincode: '560002',
          latitude: userLat || 12.9716,
          longitude: userLng || 77.5946,
          subtotal: sub,
          deliveryCharge: v.deliveryCharge,
          total: tot,
          paymentMethod,
          notes: selectedProject ? `Project: ${selectedProject.name}` : '',
        };

        const res = await bookingAPI.placeSellerOrder(payload);
        if (res.success && res.order) {
          addSellerOrder(res.order);
          createdOrders.push(res.order);

          // Attach to project if chosen
          if (selectedProject?._id) {
            await addAttachmentToProject(selectedProject._id, {
              refModel: 'SellerOrder',
              refId: res.order._id,
            });
          }
        }
      }

      // Clear carts
      clearCart();
      clearRentalCart();

      const firstOrder = createdOrders[0];
      navigation.navigate('BookingConfirmation', {
        attachment: firstOrder,
        title: 'Order Placed! 📦',
        message: selectedProject
          ? `Your order has been placed and added to "${selectedProject.name}". Track it from Status.`
          : 'Your order has been placed successfully. Track it from Status.',
      });
    } catch (err) {
      Alert.alert('Order Failed', err?.response?.data?.message || err.message || 'Could not place order.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <MaterialCommunityIcons name="chevron-left" size={26} color="#0F172A" />
        </TouchableOpacity>
        <View style={styles.headerTitles}>
          <Text style={styles.headerTitle}>Checkout</Text>
          <Text style={styles.headerSubtitle}>Review your order and complete the payment</Text>
        </View>
        <View style={styles.conzaBranding}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
            <MaterialCommunityIcons name="hard-hat" size={14} color="#F59E0B" />
            <Text style={styles.brandTitle}>CONZA</Text>
          </View>
          <Text style={styles.brandTagline}>BUILD • BOOK • BELONG</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Project (Optional) Card */}
        <TouchableOpacity
          style={styles.projectSelectorCard}
          onPress={() => setShowProjectModal(true)}
          activeOpacity={0.8}
        >
          <View style={styles.projectIconCircle}>
            <MaterialCommunityIcons name="folder-outline" size={18} color="#EA580C" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.projectCardTitle}>Project (Optional)</Text>
            <Text style={styles.projectCardSub}>Add this order to a project</Text>
          </View>
          <View style={styles.currentProjectPill}>
            <Text style={styles.currentProjectText} numberOfLines={1}>
              {selectedProject ? `${selectedProject.name} - Current Project` : 'Select Project'}
            </Text>
            <MaterialCommunityIcons name="chevron-down" size={14} color="#EA580C" />
          </View>
        </TouchableOpacity>

        {/* Delivery Details Card */}
        <View style={styles.deliverySection}>
          <View style={styles.sectionTitleRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <MaterialCommunityIcons name="map-marker-outline" size={18} color="#0F172A" />
              <Text style={styles.sectionHeading}>Delivery Details</Text>
            </View>
            <TouchableOpacity onPress={() => setShowAddressSheet(true)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.changeLink}>Change</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.deliveryCard}>
            <View style={styles.deliveryPinCircle}>
              <MaterialCommunityIcons name="map-marker" size={16} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.deliveryAddressText} numberOfLines={2}>
                {displayAddress}
              </Text>
              <Text style={styles.recipientText}>
                {recipientName} • {recipientPhone}
              </Text>
            </View>
          </View>
        </View>

        {/* Order Items Section */}
        <View style={styles.orderItemsSection}>
          <View style={styles.sectionTitleRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <MaterialCommunityIcons name="briefcase-outline" size={18} color="#0F172A" />
              <Text style={styles.sectionHeading}>Order Items</Text>
            </View>
            <Text style={styles.vendorItemCount}>
              {vendorsCount} vendors • {itemsCount} items
            </Text>
          </View>

          {/* Group: Materials */}
          {materialsByVendor.map((vendor) => (
            <View key={vendor.vendorName} style={styles.vendorOrderBlock}>
              <View style={styles.vendorBlockHeader}>
                <View style={[styles.vendorGroupIcon, { backgroundColor: '#FFEDD5' }]}>
                  <MaterialCommunityIcons name="package-variant-closed" size={16} color="#EA580C" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.vendorGroupTitle}>Materials</Text>
                  <Text style={styles.vendorGroupSub}>Supplied by {vendor.vendorName}</Text>
                </View>
                <View style={styles.vendorDeliveryPill}>
                  <MaterialCommunityIcons name="truck-delivery-outline" size={13} color="#64748B" />
                  <Text style={styles.vendorChargeText}>Delivery charge: ₹{vendor.deliveryCharge}</Text>
                </View>
                <View style={styles.vendorDivider} />
                <View>
                  <Text style={styles.vendorChargeText}>Delivery in</Text>
                  <Text style={[styles.vendorChargeText, { fontWeight: '600', color: '#0F172A' }]}>
                    {vendor.deliveryTime}
                  </Text>
                </View>
              </View>

              {/* Items in this vendor */}
              {vendor.items.map((item) => {
                const itemId = String(item.id || item._id);
                const qty = Number(cart[itemId]) || Number(cart[item.id]) || 1;
                const total = (Number(item.price) || 0) * qty;

                return (
                  <View key={itemId} style={styles.checkoutItemRow}>
                    <Image
                      source={item.image ? { uri: item.image } : require('../../assets/images/project_default.jpg')}
                      style={styles.checkoutItemImage}
                      resizeMode="cover"
                    />
                    <View style={styles.checkoutItemInfo}>
                      <Text style={styles.checkoutItemTitle} numberOfLines={1}>{item.name}</Text>
                      <Text style={styles.checkoutItemSub}>50 kg (1 bag)</Text>
                      <Text style={styles.checkoutItemRate}>₹{item.price} / bag • Qty: {qty}</Text>
                    </View>
                    <Text style={styles.checkoutItemTotal}>₹{total.toLocaleString('en-IN')}</Text>
                  </View>
                );
              })}

              <View style={styles.groupSubtotalLine}>
                <Text style={styles.groupSubtotalLabel}>Subtotal (Materials)</Text>
                <Text style={styles.groupSubtotalValue}>₹{materialsSubtotal.toLocaleString('en-IN')}</Text>
              </View>
            </View>
          ))}

          {/* Group: Rentals */}
          {rentalsByVendor.map((vendor) => (
            <View key={vendor.vendorName} style={styles.vendorOrderBlock}>
              <View style={styles.vendorBlockHeader}>
                <View style={[styles.vendorGroupIcon, { backgroundColor: '#FFEDD5' }]}>
                  <MaterialCommunityIcons name="tractor" size={16} color="#EA580C" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.vendorGroupTitle}>Rentals</Text>
                  <Text style={styles.vendorGroupSub}>Supplied by {vendor.vendorName}</Text>
                </View>
                <View style={styles.vendorDeliveryPill}>
                  <MaterialCommunityIcons name="truck-delivery-outline" size={13} color="#64748B" />
                  <Text style={styles.vendorChargeText}>Delivery charge: ₹{vendor.deliveryCharge}</Text>
                </View>
                <View style={styles.vendorDivider} />
                <View>
                  <Text style={styles.vendorChargeText}>Delivery on</Text>
                  <Text style={[styles.vendorChargeText, { fontWeight: '600', color: '#0F172A' }]}>
                    {vendor.deliveryTime}
                  </Text>
                </View>
              </View>

              {/* Rental Items in this vendor */}
              {vendor.items.map((item) => {
                const itemId = String(item.id || item._id);
                const days = Number(item.rentalDays) || 3;
                const rate = Number(item.pricePerDay) || 600;
                const total = rate * days;

                return (
                  <View key={itemId} style={styles.checkoutItemRow}>
                    <Image
                      source={item.image ? { uri: item.image } : require('../../assets/images/rental_tractor.jpg')}
                      style={styles.checkoutItemImage}
                      resizeMode="cover"
                    />
                    <View style={styles.checkoutItemInfo}>
                      <Text style={styles.checkoutItemTitle} numberOfLines={1}>{item.name}</Text>
                      <Text style={styles.checkoutItemSub}>With operator (optional)</Text>
                      <Text style={styles.checkoutItemRate}>₹{rate} / day • {days} days</Text>
                      <Text style={styles.checkoutItemDates}>12 Sep 2024 → 15 Sep 2024</Text>
                    </View>
                    <Text style={styles.checkoutItemTotal}>₹{total.toLocaleString('en-IN')}</Text>
                  </View>
                );
              })}

              <View style={styles.groupSubtotalLine}>
                <Text style={styles.groupSubtotalLabel}>Subtotal (Rentals)</Text>
                <Text style={styles.groupSubtotalValue}>₹{rentalsSubtotal.toLocaleString('en-IN')}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Payment Method Section */}
        <View style={styles.paymentSection}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <MaterialCommunityIcons name="wallet-outline" size={18} color="#0F172A" />
            <Text style={styles.sectionHeading}>Payment Method</Text>
          </View>
          <Text style={styles.paymentSubheading}>UPI, Cards and more</Text>

          {/* Option 1: UPI */}
          <TouchableOpacity
            style={[styles.paymentMethodCard, paymentMethod === 'upi' && styles.paymentMethodCardSelected]}
            onPress={() => setPaymentMethod('upi')}
            activeOpacity={0.8}
          >
            <View style={[styles.radioOuter, paymentMethod === 'upi' && styles.radioOuterSelected]}>
              {paymentMethod === 'upi' && <View style={styles.radioInner} />}
            </View>
            <View style={styles.paymentMethodInfo}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.upiIconText}>UPI</Text>
                <Text style={styles.paymentMethodTitle}>Pay via UPI</Text>
              </View>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={16} color="#EA580C" />
          </TouchableOpacity>

          {/* Option 2: Debit / Credit Card */}
          <TouchableOpacity
            style={[styles.paymentMethodCard, paymentMethod === 'card' && styles.paymentMethodCardSelected]}
            onPress={() => setPaymentMethod('card')}
            activeOpacity={0.8}
          >
            <View style={[styles.radioOuter, paymentMethod === 'card' && styles.radioOuterSelected]}>
              {paymentMethod === 'card' && <View style={styles.radioInner} />}
            </View>
            <MaterialCommunityIcons name="credit-card-outline" size={18} color="#475569" style={{ marginRight: 8 }} />
            <Text style={styles.paymentMethodTitle}>Debit / Credit Card</Text>
          </TouchableOpacity>

          {/* Option 3: Net Banking */}
          <TouchableOpacity
            style={[styles.paymentMethodCard, paymentMethod === 'netbanking' && styles.paymentMethodCardSelected]}
            onPress={() => setPaymentMethod('netbanking')}
            activeOpacity={0.8}
          >
            <View style={[styles.radioOuter, paymentMethod === 'netbanking' && styles.radioOuterSelected]}>
              {paymentMethod === 'netbanking' && <View style={styles.radioInner} />}
            </View>
            <MaterialCommunityIcons name="bank-outline" size={18} color="#475569" style={{ marginRight: 8 }} />
            <Text style={styles.paymentMethodTitle}>Net Banking</Text>
          </TouchableOpacity>

          {/* Option 4: Wallet */}
          <TouchableOpacity
            style={[styles.paymentMethodCard, paymentMethod === 'wallet' && styles.paymentMethodCardSelected]}
            onPress={() => setPaymentMethod('wallet')}
            activeOpacity={0.8}
          >
            <View style={[styles.radioOuter, paymentMethod === 'wallet' && styles.radioOuterSelected]}>
              {paymentMethod === 'wallet' && <View style={styles.radioInner} />}
            </View>
            <MaterialCommunityIcons name="wallet-outline" size={18} color="#475569" style={{ marginRight: 8 }} />
            <Text style={styles.paymentMethodTitle}>Wallet (e.g. PhonePe, Paytm)</Text>
          </TouchableOpacity>
        </View>

        {/* Price Summary Section */}
        <View style={styles.priceSummarySection}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
            <MaterialCommunityIcons name="receipt-text-outline" size={18} color="#0F172A" />
            <Text style={styles.sectionHeading}>Price Summary</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Items total</Text>
            <Text style={styles.summaryValue}>₹{itemsTotal.toLocaleString('en-IN')}</Text>
          </View>

          {materialsByVendor.map((v) => (
            <View key={v.vendorName} style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Materials delivery charge ({v.vendorName})</Text>
              <Text style={styles.summaryValue}>₹{v.deliveryCharge}</Text>
            </View>
          ))}

          {rentalsByVendor.map((v) => (
            <View key={v.vendorName} style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Rentals delivery charge ({v.vendorName})</Text>
              <Text style={styles.summaryValue}>₹{v.deliveryCharge}</Text>
            </View>
          ))}

          <View style={styles.summaryGrandTotalRow}>
            <View>
              <Text style={styles.grandTotalLabel}>Total Amount</Text>
              <Text style={styles.grandTotalSub}>Includes GST and applicable fees</Text>
            </View>
            <Text style={styles.grandTotalValue}>₹{grandTotal.toLocaleString('en-IN')}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Bar */}
      <View style={styles.stickyFooter}>
        <View style={styles.footerLeft}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Text style={styles.footerAmount}>₹{grandTotal.toLocaleString('en-IN')}</Text>
            <MaterialCommunityIcons name="information-outline" size={14} color="#94A3B8" />
          </View>
          <TouchableOpacity
            style={styles.viewDetailsTouch}
            onPress={() => setShowDetailsModal(true)}
          >
            <Text style={styles.viewDetailsText}>View details</Text>
            <MaterialCommunityIcons name="chevron-up" size={13} color="#EA580C" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.placeOrderBtn, submitting && styles.placeOrderBtnDisabled]}
          onPress={handlePlaceOrder}
          disabled={submitting}
          activeOpacity={0.88}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.placeOrderText}>Place Order</Text>
              <MaterialCommunityIcons name="arrow-right" size={16} color="#FFFFFF" />
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Project Selector Modal */}
      <Modal visible={showProjectModal} transparent animationType="fade" onRequestClose={() => setShowProjectModal(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setShowProjectModal(false)}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Select Project</Text>
            <Text style={styles.modalSub}>Link this order directly to a project for unified expense tracking.</Text>

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

      {/* View Details Modal */}
      <Modal visible={showDetailsModal} transparent animationType="fade" onRequestClose={() => setShowDetailsModal(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setShowDetailsModal(false)}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Order Breakdown</Text>
            <View style={styles.breakupRow}>
              <Text style={styles.breakupLabel}>Items Total:</Text>
              <Text style={styles.breakupValue}>₹{itemsTotal.toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.breakupRow}>
              <Text style={styles.breakupLabel}>Materials Delivery Charges:</Text>
              <Text style={styles.breakupValue}>₹{materialsDeliveryTotal.toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.breakupRow}>
              <Text style={styles.breakupLabel}>Rentals Delivery Charges:</Text>
              <Text style={styles.breakupValue}>₹{rentalsDeliveryTotal.toLocaleString('en-IN')}</Text>
            </View>
            <View style={[styles.breakupRow, { borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingTop: 8, marginTop: 6 }]}>
              <Text style={[styles.breakupLabel, { fontWeight: '700', color: '#0F172A' }]}>Final Total:</Text>
              <Text style={[styles.breakupValue, { fontWeight: '700', color: '#0F172A' }]}>₹{grandTotal.toLocaleString('en-IN')}</Text>
            </View>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowDetailsModal(false)}>
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
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  headerTitles: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 1,
  },
  conzaBranding: {
    alignItems: 'flex-end',
  },
  brandTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  brandTagline: {
    fontSize: 7.5,
    fontWeight: '600',
    color: '#94A3B8',
    letterSpacing: 0.3,
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 90,
  },

  // Project selector
  projectSelectorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBF5',
    borderWidth: 1,
    borderColor: '#FED7AA',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  projectIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#FFEDD5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  projectCardTitle: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#0F172A',
  },
  projectCardSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  currentProjectPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  currentProjectText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#EA580C',
    maxWidth: 130,
  },

  // Delivery section
  deliverySection: {
    marginBottom: 20,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  changeLink: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EA580C',
  },
  deliveryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
  },
  deliveryPinCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EA580C',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  deliveryAddressText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#0F172A',
  },
  recipientText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },

  // Order Items
  orderItemsSection: {
    marginBottom: 20,
  },
  vendorItemCount: {
    fontSize: 11.5,
    color: '#64748B',
  },
  vendorOrderBlock: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  vendorBlockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  vendorGroupIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  vendorGroupTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  vendorGroupSub: {
    fontSize: 10.5,
    color: '#64748B',
  },
  vendorDeliveryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  vendorChargeText: {
    fontSize: 10.5,
    color: '#64748B',
  },
  vendorDivider: {
    width: 1,
    height: 18,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 6,
  },

  checkoutItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  checkoutItemImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    marginRight: 10,
  },
  checkoutItemInfo: {
    flex: 1,
  },
  checkoutItemTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  checkoutItemSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  checkoutItemRate: {
    fontSize: 11.5,
    color: '#475569',
    marginTop: 1,
  },
  checkoutItemDates: {
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 1,
  },
  checkoutItemTotal: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },

  groupSubtotalLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
  },
  groupSubtotalLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  groupSubtotalValue: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
  },

  // Payment Method
  paymentSection: {
    marginBottom: 20,
  },
  paymentSubheading: {
    fontSize: 11.5,
    color: '#64748B',
    marginBottom: 10,
  },
  paymentMethodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 8,
  },
  paymentMethodCardSelected: {
    borderColor: '#FED7AA',
    backgroundColor: '#FFFBF5',
  },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  radioOuterSelected: {
    borderColor: '#EA580C',
  },
  radioInner: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#EA580C',
  },
  paymentMethodInfo: {
    flex: 1,
  },
  upiIconText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#EA580C',
    fontStyle: 'italic',
  },
  paymentMethodTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },

  // Price Summary Section
  priceSummarySection: {
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 12.5,
    color: '#64748B',
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '500',
    color: '#0F172A',
  },
  summaryGrandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 10,
    marginTop: 6,
  },
  grandTotalLabel: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  grandTotalSub: {
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 1,
  },
  grandTotalValue: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },

  // Sticky Footer
  stickyFooter: {
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
    shadowOpacity: 0.06,
    shadowRadius: 5,
    elevation: 8,
  },
  footerLeft: {
    justifyContent: 'center',
  },
  footerAmount: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  viewDetailsTouch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1,
    marginTop: 1,
  },
  viewDetailsText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#EA580C',
  },
  placeOrderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EA580C',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  placeOrderBtnDisabled: {
    opacity: 0.65,
  },
  placeOrderText: {
    fontSize: 14,
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

  breakupRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
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
});

export default MaterialCheckoutScreen;