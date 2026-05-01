import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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

// ─── Labour Grid ──────────────────────────────────────────────────────
const LabourView = () => {
  const navigation = useNavigation();
  const [selectedId, setSelectedId] = useState(null);

  const selectedItem = labourCategories.find((l) => l.id === selectedId);

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
          <LinearGradient
            colors={selectedId
              ? [colors.gradientStart, colors.gradientEnd]
              : [colors.surfaceElevated, colors.surfaceElevated]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.continueBtn}
          >
            <TouchableOpacity
              style={styles.continueTouchable}
              activeOpacity={selectedId ? 0.85 : 1}
              onPress={handleContinue}
            >
              <Text style={[styles.continueBtnText, !selectedId && styles.continueBtnTextDim]}>
                {selectedId ? `Continue with ${selectedItem.label} →` : 'Select a Category'}
              </Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      }
    />
  );
};

// ─── Material View ────────────────────────────────────────────────────────────
const MaterialView = () => {
  const [query, setQuery] = useState('');

  const filtered = query.trim()
    ? materials.filter((m) =>
        m.name.toLowerCase().includes(query.toLowerCase()) ||
        m.seller.toLowerCase().includes(query.toLowerCase())
      )
    : materials;

  const renderItem = useCallback(({ item }) => (
    <View style={styles.materialCardWrapper}>
      <MaterialCard item={item} onPress={() => {}} />
    </View>
  ), []);

  return (
    <FlatList
      data={filtered}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      numColumns={2}
      columnWrapperStyle={styles.materialGridRow}
      contentContainerStyle={styles.materialGridList}
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
const BookingScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [activeCategory, setActiveCategory] = useState('Labour');
  const [search, setSearch] = useState('');

  return (
     <View style={[styles.safe, { paddingTop: insets.top + 10}]}>
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
    </View>
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

  // Material
// Material
  materialGridList: {
    paddingTop: 16,
    paddingBottom: 30,
    paddingHorizontal: 12,
  },
  materialGridRow: {
    justifyContent: 'space-between',
    marginBottom: 0,
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