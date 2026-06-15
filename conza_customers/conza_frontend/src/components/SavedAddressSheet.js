import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import useAppStore from '../store/useAppStore';
import { SavedAddressCardSkeleton, SkeletonList } from './Skeleton';
import { colors } from '../theme/colors';
import { authAPI } from '../api/authAPI';

// ── Constants ─────────────────────────────────────────────────────────────────
const LABEL_PRESETS = [
  { key: 'Home', emoji: '🏠' },
  { key: 'Work', emoji: '🏢' },
  { key: 'Site', emoji: '🏗' },
  { key: 'Other', emoji: '📍' },
];

const getEmoji = (label) => {
  const found = LABEL_PRESETS.find((p) => p.key === label);
  return found ? found.emoji : '📍';
};

// ── Address Row (list item) ───────────────────────────────────────────────────
const AddressRow = React.memo(({ item, onSelect, onEdit, onDelete }) => (
  <View style={styles.addressRow}>
    <View style={styles.addressRowIcon}>
      <Text style={styles.addressRowEmoji}>{getEmoji(item.label)}</Text>
    </View>
    <TouchableOpacity style={styles.addressRowBody} onPress={() => onSelect(item)} activeOpacity={0.7}>
      <Text style={styles.addressRowLabel}>{item.label}</Text>
      <Text style={styles.addressRowText} numberOfLines={2}>{item.address}</Text>
      {!!item.landmark && (
        <Text style={styles.addressRowLandmark}>Near: {item.landmark}</Text>
      )}
    </TouchableOpacity>
    <View style={styles.addressRowActions}>
      <TouchableOpacity onPress={() => onEdit(item)} activeOpacity={0.7} style={styles.addressActionBtn}>
        <Text style={styles.addressActionIcon}>✏️</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => onDelete(item)} activeOpacity={0.7} style={styles.addressActionBtn}>
        <Text style={styles.addressActionIcon}>🗑️</Text>
      </TouchableOpacity>
    </View>
  </View>
));

// ── Redesigned Add / Edit Form ────────────────────────────────────────────────
const AddressForm = React.memo(({
  initial,
  prefillLat,
  prefillLng,
  prefillAddress,
  onSave,
  onCancel,
  saving,
}) => {
  // Internal lat/lng — stored but never shown
  const latRef = useRef(
    initial?.latitude  != null ? initial.latitude  :
    prefillLat         != null ? prefillLat         : null
  );
  const lngRef = useRef(
    initial?.longitude != null ? initial.longitude :
    prefillLng         != null ? prefillLng         : null
  );

  // Address type chip
  const initialPreset = LABEL_PRESETS.find((p) => p.key === initial?.label)?.key || '';
  const [selectedPreset, setSelectedPreset] = useState(initialPreset);
  const [customLabel,    setCustomLabel]    = useState(
    initial?.label && !LABEL_PRESETS.find((p) => p.key === initial.label) ? initial.label : ''
  );

  // Address detail fields
  const [houseNo,   setHouseNo]   = useState(initial?.houseNo   || '');
  const [building,  setBuilding]  = useState(initial?.building  || '');
  const [street,    setStreet]    = useState(initial?.street    || '');
  const [area,      setArea]      = useState(initial?.area      || '');
  const [landmark,  setLandmark]  = useState(initial?.landmark  || '');

  // Auto-filled read-only fields
  const [city,     setCity]     = useState(initial?.city     || '');
  const [district, setDistrict] = useState(initial?.district || '');
  const [state,    setState]    = useState(initial?.state    || '');
  const [pincode,  setPincode]  = useState(initial?.pincode  || '');

  // Geocode loading
  const [geocodeLoading, setGeocodeLoading] = useState(false);

  // Selected location display
  const [locationDisplay, setLocationDisplay] = useState(
    prefillAddress || initial?.address || ''
  );

  // Run reverse geocode on mount when we have coordinates
  useEffect(() => {
    const lat = latRef.current;
    const lng = lngRef.current;
    if (lat == null || lng == null) return;

    // If editing an existing address with structured fields already populated, skip
    if (initial?.city) {
      setCity(initial.city || '');
      setDistrict(initial.district || '');
      setState(initial.state || '');
      setPincode(initial.pincode || '');
      setArea(initial.area || area);
      setStreet(initial.street || street);
      setHouseNo(initial.houseNo || houseNo);
      setBuilding(initial.building || building);
      return;
    }

    // Auto-fill from reverse geocode
    (async () => {
      setGeocodeLoading(true);
      try {
        const data = await authAPI.reverseGeocode(lat, lng);
        if (data.success && data.address) {
          const a = data.address;
          setHouseNo((v)  => v || a.houseNumber || '');
          setBuilding((v) => v || a.houseName   || '');
          setStreet((v)   => v || a.street      || '');
          setArea((v)     => v || a.area        || '');
          setCity(a.city     || a.district || '');
          setDistrict(a.district || '');
          setState(a.state   || '');
          setPincode(a.pincode || '');
          setLocationDisplay(a.fullAddress || prefillAddress || '');
        }
      } catch (_) {
        // Silently ignore — user can still fill manually
      } finally {
        setGeocodeLoading(false);
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const effectiveLabel = selectedPreset || customLabel.trim();

  const handlePresetPress = useCallback((key) => {
    setSelectedPreset(key);
    setCustomLabel('');
  }, []);

  const handleCustomLabelChange = useCallback((v) => {
    setSelectedPreset('');
    setCustomLabel(v);
  }, []);

  const buildFullAddress = useCallback(() => {
    return [houseNo.trim(), building.trim(), street.trim(), area.trim(), city.trim(), state.trim(), pincode.trim()]
      .filter(Boolean)
      .join(', ');
  }, [houseNo, building, street, area, city, state, pincode]);

  const handleSave = useCallback(() => {
    const finalLabel = effectiveLabel;
    if (!finalLabel) {
      Alert.alert('Required', 'Please select or enter an address type.');
      return;
    }
    if (!area.trim() && !street.trim() && !houseNo.trim()) {
      Alert.alert('Required', 'Please enter at least a street or area.');
      return;
    }
    if (latRef.current == null || lngRef.current == null) {
      Alert.alert('Required', 'Location coordinates are missing. Please go back and pick a location first.');
      return;
    }

    const fullAddress = buildFullAddress();

    onSave({
      label:     finalLabel,
      address:   fullAddress,
      latitude:  latRef.current,
      longitude: lngRef.current,
      landmark:  landmark.trim(),
      // Extra structured fields stored internally for potential future use
      houseNo:   houseNo.trim(),
      building:  building.trim(),
      street:    street.trim(),
      area:      area.trim(),
      city:      city.trim(),
      district:  district.trim(),
      state:     state.trim(),
      pincode:   pincode.trim(),
    });
  }, [effectiveLabel, houseNo, building, street, area, landmark, city, district, state, pincode, buildFullAddress, onSave]);

  const hasLocation = latRef.current != null && lngRef.current != null;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Header */}
      <View style={styles.formHeaderRow}>
        <TouchableOpacity onPress={onCancel} style={styles.formBackBtn} activeOpacity={0.7}>
          <Text style={styles.formBackIcon}>‹</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.formTitle}>Add New Address</Text>
          <Text style={styles.formSubtitle}>Save an address for faster booking</Text>
        </View>
      </View>

      {/* ── Address Type Chips ── */}
      <Text style={styles.sectionLabel}>Address Type</Text>
      <View style={styles.chipRow}>
        {LABEL_PRESETS.map(({ key, emoji }) => {
          const active = selectedPreset === key;
          return (
            <TouchableOpacity
              key={key}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => handlePresetPress(key)}
              activeOpacity={0.75}
            >
              <Text style={styles.chipEmoji}>{emoji}</Text>
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{key}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Custom label (shown only when Other selected) */}
      {selectedPreset === 'Other' && (
        <TextInput
          style={[styles.input, styles.inputSm]}
          placeholder="Enter custom label…"
          placeholderTextColor={colors.textMuted}
          value={customLabel}
          onChangeText={handleCustomLabelChange}
          maxLength={30}
          returnKeyType="done"
        />
      )}

      {/* ── Location Card ── */}
      <Text style={styles.sectionLabel}>Location</Text>
      <View style={[styles.locationCard, !hasLocation && styles.locationCardEmpty]}>
        <View style={styles.locationCardLeft}>
          <Text style={styles.locationCardIcon}>📍</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.locationCardTitle}>
              {hasLocation ? 'Selected Location' : 'No location selected'}
            </Text>
            {geocodeLoading ? (
              <View style={styles.geocodeRow}>
                <ActivityIndicator size="small" color={colors.accentAmber} style={{ marginRight: 6 }} />
                <Text style={styles.geocodeLoadingText}>Fetching address…</Text>
              </View>
            ) : (
              <Text style={styles.locationCardAddress} numberOfLines={2}>
                {locationDisplay || (hasLocation ? `${latRef.current?.toFixed(4)}, ${lngRef.current?.toFixed(4)}` : 'Go back to pick a location')}
              </Text>
            )}
          </View>
        </View>
      </View>

      {/* ── Address Details ── */}
      <Text style={styles.sectionLabel}>Address Details</Text>

      <View style={styles.inputRow}>
        <View style={[styles.inputWrap, { flex: 1 }]}>
          <Text style={styles.inputLabel}>House / Flat No</Text>
          <TextInput
            style={styles.input}
            placeholder="A-101"
            placeholderTextColor={colors.textMuted}
            value={houseNo}
            onChangeText={setHouseNo}
            returnKeyType="next"
          />
        </View>
        <View style={[styles.inputWrap, { flex: 1 }]}>
          <Text style={styles.inputLabel}>Building Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Sunrise Apts"
            placeholderTextColor={colors.textMuted}
            value={building}
            onChangeText={setBuilding}
            returnKeyType="next"
          />
        </View>
      </View>

      <View style={styles.inputWrap}>
        <Text style={styles.inputLabel}>Street / Road</Text>
        <TextInput
          style={styles.input}
          placeholder="MG Road"
          placeholderTextColor={colors.textMuted}
          value={street}
          onChangeText={setStreet}
          returnKeyType="next"
        />
      </View>

      <View style={styles.inputWrap}>
        <Text style={styles.inputLabel}>Area / Locality</Text>
        <TextInput
          style={styles.input}
          placeholder="Koramangala"
          placeholderTextColor={colors.textMuted}
          value={area}
          onChangeText={setArea}
          returnKeyType="next"
        />
      </View>

      <View style={styles.inputWrap}>
        <Text style={styles.inputLabel}>
          Landmark <Text style={styles.optionalTag}>(optional)</Text>
        </Text>
        <TextInput
          style={styles.input}
          placeholder="Near bus stop, opposite park…"
          placeholderTextColor={colors.textMuted}
          value={landmark}
          onChangeText={setLandmark}
          maxLength={80}
          returnKeyType="done"
        />
      </View>

      {/* ── Auto-filled Section ── */}
      {(city || district || state || pincode || geocodeLoading) ? (
        <>
          <Text style={styles.sectionLabel}>
            Auto-filled Details
            {geocodeLoading && (
              <Text style={styles.autoFillNote}> · Loading…</Text>
            )}
          </Text>
          <View style={styles.autoFillCard}>
            <View style={styles.autoFillRow}>
              <View style={styles.autoFillField}>
                <Text style={styles.autoFillFieldLabel}>City</Text>
                {geocodeLoading
                  ? <View style={styles.autoFillSkeleton} />
                  : <Text style={styles.autoFillFieldValue}>{city || '—'}</Text>
                }
              </View>
              <View style={styles.autoFillDivider} />
              <View style={styles.autoFillField}>
                <Text style={styles.autoFillFieldLabel}>District</Text>
                {geocodeLoading
                  ? <View style={styles.autoFillSkeleton} />
                  : <Text style={styles.autoFillFieldValue}>{district || '—'}</Text>
                }
              </View>
            </View>
            <View style={[styles.autoFillRow, { borderTopWidth: 1, borderTopColor: colors.border }]}>
              <View style={styles.autoFillField}>
                <Text style={styles.autoFillFieldLabel}>State</Text>
                {geocodeLoading
                  ? <View style={styles.autoFillSkeleton} />
                  : <Text style={styles.autoFillFieldValue}>{state || '—'}</Text>
                }
              </View>
              <View style={styles.autoFillDivider} />
              <View style={styles.autoFillField}>
                <Text style={styles.autoFillFieldLabel}>Pincode</Text>
                {geocodeLoading
                  ? <View style={styles.autoFillSkeleton} />
                  : <Text style={styles.autoFillFieldValue}>{pincode || '—'}</Text>
                }
              </View>
            </View>
          </View>
        </>
      ) : null}

      {/* ── Save Button ── */}
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.saveBtn}
      >
        <TouchableOpacity
          style={styles.saveBtnTouch}
          onPress={handleSave}
          disabled={saving || geocodeLoading}
          activeOpacity={0.85}
        >
          {saving
            ? <ActivityIndicator color={colors.black} />
            : <Text style={styles.saveBtnText}>Save Address</Text>
          }
        </TouchableOpacity>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
});

// ── Main Sheet ────────────────────────────────────────────────────────────────
const SavedAddressSheet = ({
  visible,
  onClose,
  onSelect,
  currentLat,
  currentLng,
  currentAddress,
}) => {
  const savedAddresses        = useAppStore((s) => s.savedAddresses);
  const savedAddressesLoading = useAppStore((s) => s.savedAddressesLoading);
  const fetchSavedAddresses   = useAppStore((s) => s.fetchSavedAddresses);
  const addSavedAddress       = useAppStore((s) => s.addSavedAddress);
  const updateSavedAddress    = useAppStore((s) => s.updateSavedAddress);
  const deleteSavedAddress    = useAppStore((s) => s.deleteSavedAddress);
  const userProfile           = useAppStore((s) => s.userProfile);

  const [view,       setView]       = useState('list');
  const [editTarget, setEditTarget] = useState(null);
  const [saving,     setSaving]     = useState(false);

  useEffect(() => {
    if (visible && userProfile) fetchSavedAddresses();
  }, [visible, userProfile]);

  useEffect(() => {
    if (!visible) { setView('list'); setEditTarget(null); }
  }, [visible]);

  const handleSelect = useCallback((item) => {
    onSelect?.(item);
    onClose?.();
  }, [onSelect, onClose]);

  const handleUseCurrentLocation = useCallback(() => {
    if (currentLat == null || currentLng == null) return;
    onSelect?.({
      label:     'Current Location',
      address:   currentAddress || 'Current Location',
      latitude:  currentLat,
      longitude: currentLng,
      landmark:  '',
    });
    onClose?.();
  }, [currentLat, currentLng, currentAddress, onSelect, onClose]);

  const handleEdit = useCallback((item) => {
    setEditTarget(item);
    setView('edit');
  }, []);

  const [deleteTarget, setDeleteTarget] = useState(null);

  const handleDelete = useCallback((item) => {
    setDeleteTarget(item);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    const result = await deleteSavedAddress(deleteTarget._id?.toString() || deleteTarget._id);
    setDeleteTarget(null);
    if (result && !result.success) {
      setDeleteTarget(null);
      Alert.alert('Error', result.error || 'Could not delete address.');
    }
  }, [deleteTarget, deleteSavedAddress]);

  const handleAddSave = useCallback(async (fields) => {
    setSaving(true);
    const result = await addSavedAddress(fields);
    setSaving(false);
    if (result.success) {
      setView('list');
    } else {
      Alert.alert('Error', result.error || 'Could not save address.');
    }
  }, [addSavedAddress]);

  const handleEditSave = useCallback(async (fields) => {
    if (!editTarget) return;
    setSaving(true);
    const result = await updateSavedAddress(editTarget._id?.toString() || editTarget._id, fields);
    setSaving(false);
    if (result.success) {
      setView('list');
      setEditTarget(null);
    } else {
      Alert.alert('Error', result.error || 'Could not update address.');
    }
  }, [updateSavedAddress, editTarget]);

  const hasCurrentLocation = currentLat != null && currentLng != null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity style={styles.sheet} activeOpacity={1}>
          {/* Handle */}
          <View style={styles.handle} />

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}
          >
            {/* ── Delete Confirmation ── */}
            {deleteTarget && (
              <View style={styles.deleteConfirmCard}>
                <Text style={styles.deleteConfirmText}>
                  Remove "{deleteTarget.label}" from saved addresses?
                </Text>
                <View style={styles.deleteConfirmBtns}>
                  <TouchableOpacity
                    style={styles.deleteConfirmCancel}
                    onPress={() => setDeleteTarget(null)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.deleteConfirmCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteConfirmDelete}
                    onPress={confirmDelete}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.deleteConfirmDeleteText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* ── List View ── */}
            {view === 'list' && (
              <>
                <View style={styles.sheetHeader}>
                  <Text style={styles.sheetTitle}>Delivery Location</Text>
                  <TouchableOpacity
                    onPress={() => { setEditTarget(null); setView('add'); }}
                    activeOpacity={0.7}
                    style={styles.addNewBtn}
                  >
                    <Text style={styles.addNewText}>+ Add New</Text>
                  </TouchableOpacity>
                </View>

                {/* Current GPS */}
                {hasCurrentLocation && (
                  <TouchableOpacity
                    style={styles.currentLocationRow}
                    onPress={handleUseCurrentLocation}
                    activeOpacity={0.75}
                  >
                    <View style={styles.currentLocationIcon}>
                      <Text style={{ fontSize: 20 }}>🎯</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.currentLocationLabel}>Use Current Location</Text>
                      <Text style={styles.currentLocationSub} numberOfLines={1}>
                        {currentAddress || 'GPS location'}
                      </Text>
                    </View>
                    <View style={styles.useChip}>
                      <Text style={styles.useChipText}>Use</Text>
                    </View>
                  </TouchableOpacity>
                )}

                {/* Save current as shortcut */}
                {hasCurrentLocation && (
                  <TouchableOpacity
                    style={styles.saveCurrentRow}
                    onPress={() => { setEditTarget(null); setView('add'); }}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.saveCurrentText}>📌 Save current location as an address</Text>
                  </TouchableOpacity>
                )}

                {/* Saved addresses */}
                {savedAddressesLoading ? (
                  <View style={{ paddingTop: 8 }}>
                    <SkeletonList component={SavedAddressCardSkeleton} count={3} />
                  </View>
                ) : savedAddresses.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyEmoji}>🏠</Text>
                    <Text style={styles.emptyTitle}>No saved addresses</Text>
                    <Text style={styles.emptySub}>Save Home, Work or a site for faster booking</Text>
                  </View>
                ) : (
                  <>
                    <Text style={styles.listSectionTitle}>Saved Addresses</Text>
                    {savedAddresses.map((item) => (
                      <AddressRow
                        key={item._id?.toString() || item._id}
                        item={item}
                        onSelect={handleSelect}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                      />
                    ))}
                  </>
                )}
              </>
            )}

            {/* ── Add View ── */}
            {view === 'add' && (
              <AddressForm
                prefillLat={currentLat}
                prefillLng={currentLng}
                prefillAddress={currentAddress}
                onSave={handleAddSave}
                onCancel={() => setView('list')}
                saving={saving}
              />
            )}

            {/* ── Edit View ── */}
            {view === 'edit' && editTarget && (
              <AddressForm
                initial={editTarget}
                prefillLat={editTarget.latitude}
                prefillLng={editTarget.longitude}
                prefillAddress={editTarget.address}
                onSave={handleEditSave}
                onCancel={() => { setView('list'); setEditTarget(null); }}
                saving={saving}
              />
            )}
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.38)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 36,
    maxHeight: '92%',
  },
  scrollContent: {
    paddingBottom: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: 20,
  },

  // ── List header ──
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  addNewBtn: {
    backgroundColor: colors.accentYellowSoft,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.accentYellow,
  },
  addNewText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.accentAmber,
  },

  // ── Current location row ──
  currentLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accentYellowSoft,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: colors.accentYellow,
    gap: 12,
  },
  currentLocationIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  currentLocationLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  currentLocationSub: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  useChip: {
    backgroundColor: colors.accentAmber,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  useChipText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.white,
  },
  saveCurrentRow: {
    paddingVertical: 10,
    marginBottom: 14,
  },
  saveCurrentText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.accentAmber,
  },
  listSectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginBottom: 10,
  },

  // ── Address row ──
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  addressRowIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  addressRowEmoji: { fontSize: 18 },
  addressRowBody: { flex: 1 },
  addressRowLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 3,
  },
  addressRowText: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
  },
  addressRowLandmark: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  addressRowActions: {
    flexDirection: 'row',
    gap: 4,
  },
  addressActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  addressActionIcon: { fontSize: 14 },

  // ── Empty state ──
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyEmoji: { fontSize: 44, marginBottom: 14 },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 19,
  },

  // ── Form ──
  formHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 22,
    gap: 12,
  },
  formBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 2,
  },
  formBackIcon: {
    fontSize: 24,
    color: colors.textPrimary,
    lineHeight: 28,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  formSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '400',
  },

  // chips
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginBottom: 10,
    marginTop: 4,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
    flexWrap: 'wrap',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
  },
  chipActive: {
    borderColor: colors.accentYellow,
    backgroundColor: colors.accentYellowSoft,
  },
  chipEmoji: { fontSize: 15 },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  chipTextActive: {
    color: colors.accentAmber,
    fontWeight: '700',
  },

  // location card
  locationCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
  },
  locationCardEmpty: {
    borderStyle: 'dashed',
    borderColor: colors.textMuted,
    backgroundColor: colors.surfaceElevated,
  },
  locationCardLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  locationCardIcon: { fontSize: 18, marginTop: 1 },
  locationCardTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  locationCardAddress: {
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: '500',
    lineHeight: 18,
  },
  geocodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  geocodeLoadingText: {
    fontSize: 12,
    color: colors.textMuted,
  },

  // inputs
  inputRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 0,
  },
  inputWrap: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 5,
    letterSpacing: 0.2,
  },
  optionalTag: {
    fontSize: 11,
    fontWeight: '400',
    color: colors.textMuted,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 13,
    paddingVertical: 11,
    fontSize: 14,
    color: colors.textPrimary,
  },
  inputSm: {
    marginBottom: 14,
  },

  // auto-fill card
  autoFillCard: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: 20,
  },
  autoFillRow: {
    flexDirection: 'row',
  },
  autoFillField: {
    flex: 1,
    padding: 12,
  },
  autoFillDivider: {
    width: 1,
    backgroundColor: colors.border,
  },
  autoFillFieldLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  autoFillFieldValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  autoFillNote: {
    fontSize: 10,
    fontWeight: '400',
    color: colors.textMuted,
    textTransform: 'none',
  },
  autoFillSkeleton: {
    height: 14,
    width: '70%',
    borderRadius: 6,
    backgroundColor: colors.border,
  },

  // save button
  saveBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 8,
    marginBottom: 4,
  },
  saveBtnTouch: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: 0.3,
  },
  deleteConfirmCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: colors.danger || '#EF4444',
  },
  deleteConfirmText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 14,
    lineHeight: 20,
  },
  deleteConfirmBtns: {
    flexDirection: 'row',
    gap: 10,
  },
  deleteConfirmCancel: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
  },
  deleteConfirmCancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  deleteConfirmDelete: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: '#EF4444',
    alignItems: 'center',
  },
  deleteConfirmDeleteText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default SavedAddressSheet;