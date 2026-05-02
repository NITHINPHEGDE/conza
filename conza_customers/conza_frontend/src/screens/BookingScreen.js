import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

import CategoryButton from '../components/CategoryButton';
import LabourCategoryCard from '../components/LabourCategoryCard';
import MaterialCard from '../components/MaterialCard';
import SectionHeader from '../components/SectionHeader';

import { labourCategories, materials, rentalItems } from '../data/dummyData';
import { colors } from '../theme/colors';

const CATEGORIES = [
  { key: 'Labour',   icon: '👷' },
  { key: 'Material', icon: '🧱' },
  { key: 'Rental',   icon: '🏗️' },
];

// ─── Labour Grid ──────────────────────────────────────────────────────────────
const LabourView = () => {
  const navigation = useNavigation();
  const [selectedId, setSelectedId] = useState(null);

  const selectedItem = labourCategories.find((l) => l.id === selectedId);
  const [showModal, setShowModal] = useState(false);
  const [quantity, setQuantity]   = useState(1);
  
  const handleContinue = () => {
    if (!selectedId) return;
    navigation.navigate('WorkersNearby', { category: selectedItem.label });
  };

  const renderItem = useCallback(({ item }) => (
    <LabourCategoryCard
      item={item}
      isSelected={selectedId === item.id}
      onPress={(i) => setSelectedId(selectedId === i.id ? null : i.id)}
    />
  ), [selectedId]);

  return (
  <View style={{ flex: 1 }}>
    <FlatList
      data={labourCategories}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      numColumns={2}
      columnWrapperStyle={styles.gridRow}
      contentContainerStyle={styles.labourList}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={
        <SectionHeader title="Choose Category" actionLabel="View All" onAction={() => {}} />
      }
      ListFooterComponent={
        <View style={styles.continueWrapper}>
          {selectedId && (
            <>
              <LinearGradient
                colors={[colors.gradientStart, colors.gradientEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.continueBtn, { marginBottom: 10 }]}
              >
                <TouchableOpacity
                  style={styles.continueTouchable}
                  activeOpacity={0.85}
                  onPress={() => setShowModal(true)}
                >
                  <Text style={styles.continueBtnText}>
                    ⚡ Auto Book Nearest {selectedItem.label}
                  </Text>
                </TouchableOpacity>
              </LinearGradient>

              <TouchableOpacity
                style={styles.continueOutlineBtn}
                activeOpacity={0.85}
                onPress={handleContinue}
              >
                <Text style={styles.continueOutlineBtnText}>
                  Continue with {selectedItem.label} →
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      }
    />

    {/* Auto Book Modal */}
    <Modal
      visible={showModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowModal(false)}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setShowModal(false)}
      >
        <TouchableOpacity style={styles.modalSheet} activeOpacity={1}>

          {/* Handle bar */}
          <View style={styles.modalHandle} />

          <Text style={styles.modalTitle}>
            How many {selectedItem?.label}s do you need?
          </Text>
          <Text style={styles.modalSub}>
            We'll find the nearest available workers for you
          </Text>

          {/* Counter */}
          <View style={styles.counterRow}>
            <TouchableOpacity
              style={styles.counterBtn}
              onPress={() => setQuantity((q) => Math.max(1, q - 1))}
              activeOpacity={0.75}
            >
              <Text style={styles.counterBtnText}>−</Text>
            </TouchableOpacity>

            <View style={styles.counterDisplay}>
              <Text style={styles.counterValue}>{quantity}</Text>
              <Text style={styles.counterLabel}>
                {selectedItem?.label}{quantity > 1 ? 's' : ''}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.counterBtn}
              onPress={() => setQuantity((q) => Math.min(10, q + 1))}
              activeOpacity={0.75}
            >
              <Text style={styles.counterBtnText}>+</Text>
            </TouchableOpacity>
          </View>

          {/* Info note */}
          <View style={styles.modalNote}>
            <Text style={styles.modalNoteText}>
              📍 Workers will be matched based on your location and availability
            </Text>
          </View>

          {/* Confirm Button */}
          <LinearGradient
            colors={[colors.gradientStart, colors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.modalConfirmBtn}
          >
            <TouchableOpacity
              style={styles.continueTouchable}
              activeOpacity={0.85}
              onPress={() => {
                setShowModal(false);
                // TODO: trigger auto book with quantity
              }}
            >
              <Text style={styles.continueBtnText}>
                Book {quantity} {selectedItem?.label}{quantity > 1 ? 's' : ''} →
              </Text>
            </TouchableOpacity>
          </LinearGradient>

          {/* Cancel */}
          <TouchableOpacity
            onPress={() => setShowModal(false)}
            style={styles.modalCancel}
            activeOpacity={0.7}
          >
            <Text style={styles.modalCancelText}>Cancel</Text>
          </TouchableOpacity>

        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  </View>
);
};

// ─── Material View ────────────────────────────────────────────────────────────
const MaterialView = () => {
  const [query, setQuery] = useState('');
  const [cart, setCart]   = useState({});

  const filtered = query.trim()
    ? materials.filter((m) =>
        m.name.toLowerCase().includes(query.toLowerCase()) ||
        m.seller.toLowerCase().includes(query.toLowerCase())
      )
    : materials;

  const addToCart = (item) => {
    setCart((prev) => ({ ...prev, [item.id]: (prev[item.id] || 0) + 1 }));
  };

  const removeFromCart = (item) => {
    setCart((prev) => {
      const current = prev[item.id] || 0;
      if (current <= 1) {
        const updated = { ...prev };
        delete updated[item.id];
        return updated;
      }
      return { ...prev, [item.id]: current - 1 };
    });
  };

  const cartItems  = materials.filter((m) => cart[m.id] > 0);
  const totalItems = Object.values(cart).reduce((a, b) => a + b, 0);
  const totalPrice = cartItems.reduce((sum, m) => sum + m.price * cart[m.id], 0);

  const renderItem = useCallback(({ item }) => (
    <View style={styles.materialCardWrapper}>
      <MaterialCard
        item={item}
        quantity={cart[item.id] || 0}
        onAdd={addToCart}
        onRemove={removeFromCart}
      />
    </View>
  ), [cart]);

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        numColumns={2}
        columnWrapperStyle={styles.materialGridRow}
        contentContainerStyle={[
          styles.materialGridList,
          totalItems > 0 && { paddingBottom: 100 },
        ]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            <SectionHeader title="Browse Materials" actionLabel="Filter ↓" onAction={() => {}} />
            <View style={styles.materialSearchWrapper}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.materialSearchInput}
                placeholder="Search materials, sellers..."
                placeholderTextColor={colors.textMuted}
                value={query}
                onChangeText={setQuery}
              />
            </View>
          </View>
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>No materials found.</Text>
        }
      />

      {/* Checkout Bar */}
      {totalItems > 0 && (
        <View style={styles.materialCheckoutBar}>
          <View style={styles.materialCheckoutLeft}>
            <View style={styles.materialCheckoutBadge}>
              <Text style={styles.materialCheckoutBadgeText}>{totalItems}</Text>
            </View>
            <View>
              <Text style={styles.materialCheckoutLabel}>
                {totalItems} item{totalItems > 1 ? 's' : ''} added
              </Text>
              <Text style={styles.materialCheckoutTotal}>₹{totalPrice.toLocaleString()}</Text>
            </View>
          </View>
          <LinearGradient
            colors={[colors.gradientStart, colors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.materialCheckoutBtn}
          >
            <TouchableOpacity style={styles.materialCheckoutBtnTouch} activeOpacity={0.85}>
              <Text style={styles.materialCheckoutBtnText}>Checkout →</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      )}
    </View>
  );
};

// ─── Rental View ──────────────────────────────────────────────────────────────
const RentalView = () => (
  <View style={styles.rentalContainer}>
    <SectionHeader title="Equipment Rental" />
    {rentalItems.map((item) => (
      <TouchableOpacity key={item.id} style={styles.rentalCard} activeOpacity={0.8}>
        <View style={styles.rentalEmoji}>
          <Text style={{ fontSize: 26 }}>{item.emoji}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.rentalName}>{item.name}</Text>
          <Text style={styles.rentalPrice}>₹{item.pricePerDay} / day</Text>
        </View>
        <TouchableOpacity style={styles.rentBtn} activeOpacity={0.8}>
          <Text style={styles.rentBtnText}>Rent</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    ))}
  </View>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────
const BookingScreen = () => {
  const [activeCategory, setActiveCategory] = useState('Labour');
  const [search, setSearch] = useState('');

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerMeta}>📍 Deliver to</Text>
          <Text style={styles.headerLocation}>Bangalore, KA</Text>
        </View>
        <TouchableOpacity style={styles.notifBtn} activeOpacity={0.8}>
          <Text style={{ fontSize: 19 }}>🔔</Text>
        </TouchableOpacity>
      </View>

      {/* Fixed Section */}
      <View style={styles.fixedSection}>
        {activeCategory !== 'Material' && (
          <View style={styles.searchBar}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search services..."
              placeholderTextColor={colors.textMuted}
              value={search}
              onChangeText={setSearch}
            />
          </View>
        )}
        <View style={styles.categoryRow}>
          {CATEGORIES.map((cat) => (
            <CategoryButton
              key={cat.key}
              label={cat.key}
              icon={cat.icon}
              isSelected={activeCategory === cat.key}
              onPress={() => setActiveCategory(cat.key)}
            />
          ))}
        </View>
      </View>

      {/* Dynamic Section */}
      <View style={styles.dynamicSection}>
        {activeCategory === 'Labour'   && <LabourView />}
        {activeCategory === 'Material' && <MaterialView />}
        {activeCategory === 'Rental'   && <RentalView />}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
  },
  headerMeta: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '500',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  headerLocation: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: 0.1,
  },
  notifBtn: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  fixedSection: {
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    backgroundColor: colors.background,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBg,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: {
    fontSize: 15,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dynamicSection: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Labour
  labourList: {
    paddingTop: 16,
    paddingBottom: 30,
    paddingHorizontal: 14,
  },
  gridRow: {
    justifyContent: 'space-between',
  },
  continueWrapper: {
    marginTop: 12,
    marginHorizontal: 6,
    marginBottom: 10,
  },
  continueBtn: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  continueTouchable: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  continueBtnText: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  continueBtnTextDim: {
    color: colors.textMuted,
  },
  continueOutlineBtn: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  continueOutlineBtnDim: {
    borderColor: colors.borderLight,
    backgroundColor: colors.surfaceElevated,
  },
  continueOutlineBtnText: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
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
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 20,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: 0.1,
  },
  modalSub: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    fontWeight: '500',
    marginBottom: 32,
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 28,
  },
  counterBtn: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: colors.accentYellowSoft,
    borderWidth: 1.5,
    borderColor: colors.accentYellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterBtnText: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.accentAmber,
    lineHeight: 30,
  },
  counterDisplay: {
    alignItems: 'center',
    minWidth: 80,
  },
  counterValue: {
    fontSize: 48,
    fontWeight: '800',
    color: colors.textPrimary,
    lineHeight: 56,
  },
  counterLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
    marginTop: 2,
  },
  modalNote: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 12,
    padding: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  modalNoteText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 18,
  },
  modalConfirmBtn: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },
  modalCancel: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: '600',
  },

  // Material
  materialGridList: {
    paddingTop: 16,
    paddingBottom: 30,
    paddingHorizontal: 12,
  },
  materialGridRow: {
    justifyContent: 'space-between',
  },
  materialCardWrapper: {
    flex: 1,
    margin: 6,
  },
  materialSearchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBg,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginHorizontal: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  materialSearchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '500',
    paddingVertical: 20,
    paddingLeft: 8,
  },

  // Material checkout bar
  materialCheckoutBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: 20,
    paddingVertical: 14,
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  materialCheckoutLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  materialCheckoutBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.accentYellowSoft,
    borderWidth: 1,
    borderColor: colors.accentYellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  materialCheckoutBadgeText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.accentAmber,
  },
  materialCheckoutLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
    marginBottom: 2,
  },
  materialCheckoutTotal: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  materialCheckoutBtn: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  materialCheckoutBtnTouch: {
    paddingHorizontal: 22,
    paddingVertical: 13,
    alignItems: 'center',
  },
  materialCheckoutBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: 0.3,
  },

  // Rental
  rentalContainer: {
    paddingTop: 16,
    paddingHorizontal: 20,
  },
  rentalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 13,
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  rentalEmoji: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: colors.accentYellowSoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(245,200,66,0.25)',
  },
  rentalName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 3,
  },
  rentalPrice: {
    fontSize: 13,
    color: colors.accentAmber,
    fontWeight: '600',
  },
  rentBtn: {
    backgroundColor: colors.accentYellowSoft,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(245,200,66,0.3)',
  },
  rentBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.accentAmber,
  },
});

export default BookingScreen;