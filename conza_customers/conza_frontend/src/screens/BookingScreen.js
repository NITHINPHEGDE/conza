import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

import CategoryButton    from '../components/CategoryButton';
import LabourCategoryCard from '../components/LabourCategoryCard';
import MaterialCard      from '../components/MaterialCard';
import SectionHeader     from '../components/SectionHeader';
import SkillWorkerCard   from '../components/SkillWorkerCard';
import RentalCard from '../components/RentalCard';
import { labourCategories, materials as dummyMaterials, rentalItems, rentalCategories, allWorkers } from '../data/dummyData';
import { colors } from '../theme/colors';

const CATEGORIES = [
  { key: 'Labour',   icon: '👷' },
  { key: 'Material', icon: '🧱' },
  { key: 'Rental',   icon: '🏗️' },
];

// ─── Skill Search Results View ─────────────────────────────────────────────────
const SkillSearchView = ({ query, onClear }) => {
  const navigation = useNavigation();
  const [selected, setSelected] = useState([]);

  const results = (allWorkers || []).filter((w) =>
  w.skills.some((s) => s.toLowerCase().includes(query.toLowerCase())) ||
  w.category.toLowerCase().includes(query.toLowerCase()) ||
  w.name.toLowerCase().includes(query.toLowerCase())
);

  const toggleWorker = useCallback((worker) => {
    setSelected((prev) =>
      prev.find((w) => w.id === worker.id)
        ? prev.filter((w) => w.id !== worker.id)
        : [...prev, worker]
    );
  }, []);

  const renderItem = useCallback(({ item }) => {
    const isSelected = !!selected.find((w) => w.id === item.id);
    return (
      <SkillWorkerCard
        worker={item}
        isSelected={isSelected}
        onToggle={toggleWorker}
      />
    );
  }, [selected, toggleWorker]);

  const totalPerDay = selected.reduce((sum, w) => sum + w.pricePerDay, 0);

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.skillList}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.skillSearchHeader}>
            <Text style={styles.skillResultCount}>
              {results.length} worker{results.length !== 1 ? 's' : ''} found for "{query}"
            </Text>
            <TouchableOpacity onPress={onClear} activeOpacity={0.7}>
              <Text style={styles.skillClearText}>Clear ✕</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={renderItem}
        ListEmptyComponent={
          <View style={styles.skillEmpty}>
            <Text style={styles.skillEmptyEmoji}>🔍</Text>
            <Text style={styles.skillEmptyText}>No workers found</Text>
            <Text style={styles.skillEmptySub}>
              Try searching "plumbing", "painting", "wiring" etc.
            </Text>
          </View>
        }
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={5}
        removeClippedSubviews={true}
      />

      {/* Bottom bar when workers selected */}
      {selected.length > 0 && (
        <View style={styles.bottomBar}>
          <View style={styles.bottomBarInfo}>
            <Text style={styles.selectedCount}>
              {selected.length} worker{selected.length > 1 ? 's' : ''} selected
            </Text>
            <Text style={styles.totalPrice}>₹{totalPerDay}/day</Text>
          </View>
          <LinearGradient
            colors={[colors.gradientStart, colors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.checkoutBtn}
          >
            <TouchableOpacity
              style={styles.checkoutTouchable}
              activeOpacity={0.85}
              onPress={() =>
                navigation.navigate('LabourCheckout', {
                  selectedWorkers: selected,
                  category: 'Service',
                })
              }
            >
              <Text style={styles.checkoutText}>Proceed to Checkout →</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      )}
    </View>
  );
};

// ─── Labour Grid ──────────────────────────────────────────────────────────────
const LabourView = () => {
  const navigation  = useNavigation();
  const [selectedId, setSelectedId] = useState(null);
  const [showModal, setShowModal]   = useState(false);
  const [quantity, setQuantity]     = useState(1);

  const selectedItem = labourCategories.find((l) => l.id === selectedId);

  const handleContinue = () => {
    if (!selectedId) return;
    navigation.navigate('WorkersNearby', { category: selectedItem.label });
  };

  const handleSelect = useCallback((item) => {
    setSelectedId((prevId) => (prevId === item.id ? null : item.id));
  }, []);

  const renderItem = useCallback(({ item }) => (
    <LabourCategoryCard
      item={item}
      isSelected={selectedId === item.id}
      onPress={handleSelect}
    />
  ), [selectedId, handleSelect]);

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
        initialNumToRender={6}
        maxToRenderPerBatch={6}
        windowSize={5}
        removeClippedSubviews={true}
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
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>
              How many {selectedItem?.label}s do you need?
            </Text>
            <Text style={styles.modalSub}>
              We'll find the nearest available workers for you
            </Text>
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
            <View style={styles.modalNote}>
              <Text style={styles.modalNoteText}>
                📍 Workers will be matched based on your location and availability
              </Text>
            </View>
            <LinearGradient
              colors={[colors.gradientStart, colors.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.modalConfirmBtn}
            >
              <TouchableOpacity
                style={styles.continueTouchable}
                activeOpacity={0.85}
                onPress={() => setShowModal(false)}
              >
                <Text style={styles.continueBtnText}>
                  Book {quantity} {selectedItem?.label}{quantity > 1 ? 's' : ''} →
                </Text>
              </TouchableOpacity>
            </LinearGradient>
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
  const navigation = useNavigation();
  const [query, setQuery] = useState('');
  const [materials, setMaterials] = useState([]);

  useEffect(() => {
    const initialized = dummyMaterials.map(item => ({
      ...item,
      quantity: item.quantity ?? 0,
    }));
    setMaterials(initialized);
  }, []);

  const handleUpdateQuantity = useCallback((id, newQty) => {
    setMaterials((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: newQty } : item
      )
    );
  }, []);

  const handleImagePress = useCallback((item) => {
    navigation.navigate('MaterialDetail', { item });
  }, [navigation]);

  const filtered = query.trim()
    ? materials.filter((m) =>
        m.name.toLowerCase().includes(query.toLowerCase()) ||
        m.seller.toLowerCase().includes(query.toLowerCase())
      )
    : materials;

  const cartItems  = materials.filter((m) => (m.quantity ?? 0) > 0);
  const totalItems = cartItems.reduce((sum, m) => sum + (m.quantity ?? 0), 0);
  const totalPrice = cartItems.reduce((sum, m) => sum + m.price * (m.quantity ?? 0), 0);

  const renderItem = useCallback(({ item }) => (
    <View style={styles.materialCardWrapper}>
      <MaterialCard
        {...item}
        onUpdate={handleUpdateQuantity}
        onImagePress={handleImagePress}
      />
    </View>
  ), [handleUpdateQuantity, handleImagePress]);

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
        initialNumToRender={6}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={true}
      />
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
            <TouchableOpacity style={styles.materialCheckoutBtnTouch} 
            activeOpacity={0.85}
            onPress={() => navigation.navigate('MaterialCheckout', {
              cartItems,
              cart: cartItems.reduce((acc, item) => ({ ...acc, [item.id]: item.quantity }), {}),
            })}>
              <Text style={styles.materialCheckoutBtnText}>Checkout →</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      )}
    </View>
  );
};

// ─── Rental View ──────────────────────────────────────────────────────────────
const RentalView = () => {
  const navigation = useNavigation();
  const [query, setQuery]               = useState('');
  const [selectedCat, setSelectedCat]   = useState('all');
  const [showFilter, setShowFilter]     = useState(false);

  const filtered = rentalItems.filter((item) => {
    const matchCat   = selectedCat === 'all' || item.category === selectedCat;
    const matchQuery = item.name.toLowerCase().includes(query.toLowerCase()) ||
                       item.seller.toLowerCase().includes(query.toLowerCase());
    return matchCat && (query.trim() === '' || matchQuery);
  });

  const activeCat = rentalCategories.find((c) => c.id === selectedCat);

  const handleRentalPress = useCallback((item) => {
    navigation.navigate('RentalDetail', { item });
  }, [navigation]);

  const renderItem = useCallback(({ item }) => (
    <View style={styles.rentalCardWrapper}>
      <RentalCard
        item={item}
        onPress={handleRentalPress}
      />
    </View>
  ), [handleRentalPress]);

  return (
    <View style={{ flex: 1 }}>

      {/* Search + Filter bar */}
      <View style={styles.rentalTopBar}>
        <View style={styles.rentalSearchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.rentalSearchInput}
            placeholder="Search equipment..."
            placeholderTextColor={colors.textMuted}
            value={query}
            onChangeText={setQuery}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} activeOpacity={0.7}>
              <Text style={styles.searchClear}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Filter button */}
        <TouchableOpacity
          style={[styles.filterBtn, selectedCat !== 'all' && styles.filterBtnActive]}
          onPress={() => setShowFilter(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.filterBtnIcon}>⚙️</Text>
          <Text style={[styles.filterBtnText, selectedCat !== 'all' && styles.filterBtnTextActive]}>
            {selectedCat !== 'all' ? activeCat?.label : 'Filter'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Active filter chip */}
      {selectedCat !== 'all' && (
        <View style={styles.activeCatRow}>
          <Text style={styles.activeCatEmoji}>{activeCat?.emoji}</Text>
          <Text style={styles.activeCatLabel}>{activeCat?.label}</Text>
          <TouchableOpacity onPress={() => setSelectedCat('all')} activeOpacity={0.7}>
            <Text style={styles.activeCatClear}>✕ Clear</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Grid */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.rentalGridRow}
        contentContainerStyle={styles.rentalGridList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.skillEmpty}>
            <Text style={styles.skillEmptyEmoji}>🏗️</Text>
            <Text style={styles.skillEmptyText}>No equipment found</Text>
            <Text style={styles.skillEmptySub}>Try a different filter or search term</Text>
          </View>
        }
        renderItem={renderItem}
        initialNumToRender={6}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={true}
      />

      {/* Filter Modal */}
      <Modal
        visible={showFilter}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilter(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowFilter(false)}
        >
          <TouchableOpacity style={styles.modalSheet} activeOpacity={1}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Filter by Category</Text>
            <Text style={styles.modalSub}>Select a category to filter equipment</Text>

            <View style={styles.catGrid}>
              {rentalCategories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.catCard,
                    selectedCat === cat.id && styles.catCardSelected,
                  ]}
                  onPress={() => {
                    setSelectedCat(cat.id);
                    setShowFilter(false);
                  }}
                  activeOpacity={0.75}
                >
                  <Text style={styles.catEmoji}>{cat.emoji}</Text>
                  <Text style={[
                    styles.catLabel,
                    selectedCat === cat.id && styles.catLabelSelected,
                  ]}>
                    {cat.label}
                  </Text>
                  {selectedCat === cat.id && (
                    <View style={styles.catSelectedDot} />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              onPress={() => setShowFilter(false)}
              style={styles.modalCancel}
              activeOpacity={0.7}
            >
              <Text style={styles.modalCancelText}>Close</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
const BookingScreen = () => {
  const [activeCategory, setActiveCategory] = useState('Labour');
  const [search, setSearch]                 = useState('');
  const [activeSearch, setActiveSearch]     = useState('');

  const handleSearchSubmit = () => {
    if (search.trim()) setActiveSearch(search.trim());
  };

  const handleClearSearch = () => {
    setSearch('');
    setActiveSearch('');
  };

  const isSearching = activeSearch.trim().length > 0;


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
        {activeCategory === 'Labour' && (
        /* Search bar — always visible */
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search services, skills..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={(t) => {
              setSearch(t);
              setActiveSearch(t);
            }}
            
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={handleClearSearch} activeOpacity={0.7}>
              <Text style={styles.searchClear}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
        )}
        {/* Category buttons — hidden when searching */}
        {!isSearching && (
          <View style={styles.categoryRow}>
            {CATEGORIES.map((item) => (
              <CategoryButton
                key={item.key}
                label={item.key}
                icon={item.icon}
                isSelected={activeCategory === item.key}
                onPress={() => setActiveCategory(item.key)}
              />
            ))}
          </View>
        )}
      </View>

      {/* Dynamic Section */}
      <View style={styles.dynamicSection}>
        {isSearching ? (
          <SkillSearchView query={activeSearch} onClear={handleClearSearch} />
        ) : (
          <>
            {activeCategory === 'Labour'   && <LabourView />}
            {activeCategory === 'Material' && <MaterialView />}
            {activeCategory === 'Rental'   && <RentalView />}
          </>
        )}
      </View>
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
    paddingBottom: 18,
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
  searchIcon: { fontSize: 15, marginRight: 10 },
  searchInput: { flex: 1, fontSize: 14, color: colors.textPrimary },
  searchClear: {
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: '700',
  },
  categoryRow: { 
    flexDirection: 'row', 
    alignItems: 'center',
    width: '100%',
    justifyContent: 'space-between',
    paddingTop: 4
  },
  dynamicSection: { flex: 1, backgroundColor: colors.background },

  // Skill search
  skillList: {
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  skillSearchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  skillResultCount: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  skillClearText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.accentAmber,
  },
  skillEmpty: {
    alignItems: 'center',
    paddingTop: 60,
  },
  skillEmptyEmoji: { fontSize: 44, marginBottom: 14 },
  skillEmptyText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  skillEmptySub: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 30,
    fontWeight: '500',
  },

  // Bottom bar (skill search checkout)
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 28,
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  bottomBarInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  selectedCount: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  totalPrice: { fontSize: 16, fontWeight: '800', color: colors.textPrimary },
  checkoutBtn: { borderRadius: 16, overflow: 'hidden' },
  checkoutTouchable: { paddingVertical: 16, alignItems: 'center' },
  checkoutText: { fontSize: 15, fontWeight: '800', color: colors.textPrimary, letterSpacing: 0.3 },

  // Labour
  labourList: {
    paddingTop: 16,
    paddingBottom: 30,
    paddingHorizontal: 14,
  },
  gridRow: { justifyContent: 'space-between' },
  continueWrapper: {
    marginTop: 12,
    marginHorizontal: 6,
    marginBottom: 10,
  },
  continueBtn: { borderRadius: 16, overflow: 'hidden' },
  continueTouchable: { paddingVertical: 16, alignItems: 'center' },
  continueBtnText: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  continueBtnTextDim: { color: colors.textMuted },
  continueOutlineBtn: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  continueOutlineBtnText: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // Material
  materialGridList: {
    paddingTop: 16,
    paddingBottom: 30,
    paddingHorizontal: 12,
  },
  materialGridRow: { justifyContent: 'space-between' },
  materialCardWrapper: { flex: 1, margin: 6 },
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
  materialSearchInput: { flex: 1, fontSize: 14, color: colors.textPrimary },
  emptyText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '500',
    paddingVertical: 20,
    paddingLeft: 8,
  },
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
    minWidth: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.accentYellowSoft,
    borderWidth: 1,
    borderColor: colors.accentYellow,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  materialCheckoutBadgeText: {
    fontSize: 13,
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
  materialCheckoutBtn: { borderRadius: 14, overflow: 'hidden' },
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
  counterDisplay: { alignItems: 'center', minWidth: 80 },
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
  modalConfirmBtn: { borderRadius: 16, overflow: 'hidden', marginBottom: 12 },
  modalCancel: { paddingVertical: 12, alignItems: 'center' },
  modalCancelText: { fontSize: 14, color: colors.textMuted, fontWeight: '600' },

// Rental
  rentalTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 10,
    gap: 10,
  },
  rentalSearchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBg,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rentalSearchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 14,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterBtnActive: {
    backgroundColor: colors.accentYellowSoft,
    borderColor: colors.accentYellow,
  },
  filterBtnIcon: { fontSize: 14 },
  filterBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  filterBtnTextActive: { color: colors.accentAmber },
  activeCatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 10,
    gap: 8,
  },
  activeCatEmoji: { fontSize: 16 },
  activeCatLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
  },
  activeCatClear: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.accentAmber,
  },
  rentalGridList: {
    paddingHorizontal: 12,
    paddingBottom: 30,
  },
  rentalCardWrapper: { width: '47%', margin: '1.5%' },
rentalGridRow: { justifyContent: 'space-between' },

  // Category filter grid in modal
  catGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  catCard: {
    width: '30%',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 16,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1.5,
    borderColor: colors.border,
    position: 'relative',
  },
  catCardSelected: {
    backgroundColor: '#FFFDF0',
    borderColor: colors.accentYellow,
  },
  catEmoji: { fontSize: 28, marginBottom: 8 },
  catLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  catLabelSelected: { color: colors.accentAmber },
  catSelectedDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accentAmber,
  },
});

export default BookingScreen;