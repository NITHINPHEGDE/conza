import React, { useState, useCallback, useEffect, useMemo } from 'react';
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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import useAppStore from '../store/useAppStore';
import { SavedAddressCardSkeleton } from './Skeleton';
import { SkeletonList } from './Skeleton';
import { colors } from '../theme/colors';

// ── Label presets ─────────────────────────────────────────────────────────────
const LABEL_PRESETS = ['Home', 'Work', 'Site', 'Other'];

// ── Single address row ────────────────────────────────────────────────────────
const AddressRow = React.memo(({ item, onSelect, onEdit, onDelete }) => (
  <View style={styles.addressRow}>
    <View style={styles.addressRowIcon}>
      <Text style={styles.addressRowEmoji}>
        {item.label === 'Home' ? '🏠' : item.label === 'Work' ? '💼' : item.label === 'Site' ? '🏗️' : '📍'}
      </Text>
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

// ── Add / Edit sub-form ───────────────────────────────────────────────────────
const AddressForm = React.memo(({
  initial,
  prefillAddress,
  prefillLat,
  prefillLng,
  onSave,
  onCancel,
  saving,
}) => {
  const [label,    setLabel]    = useState(initial?.label    || '');
  const [address,  setAddress]  = useState(initial?.address  || prefillAddress || '');
  const [landmark, setLandmark] = useState(initial?.landmark || '');
  const [lat,      setLat]      = useState(
    initial?.latitude  != null ? String(initial.latitude)  : (prefillLat  != null ? String(prefillLat)  : '')
  );
  const [lng,      setLng]      = useState(
    initial?.longitude != null ? String(initial.longitude) : (prefillLng != null ? String(prefillLng) : '')
  );
  const [customLabel, setCustomLabel] = useState(
    initial?.label && !LABEL_PRESETS.includes(initial.label) ? initial.label : ''
  );
  const [usingPreset, setUsingPreset] = useState(
    LABEL_PRESETS.includes(initial?.label || '') ? (initial?.label || '') : (initial?.label ? '' : '')
  );

  const effectiveLabel = usingPreset || customLabel;

  const handlePreset = useCallback((p) => {
    setUsingPreset(p);
    setCustomLabel('');
    setLabel(p);
  }, []);

  const handleCustom = useCallback((v) => {
    setUsingPreset('');
    setCustomLabel(v);
    setLabel(v);
  }, []);

  const handleSave = useCallback(() => {
    const finalLabel = effectiveLabel.trim();
    if (!finalLabel)        { Alert.alert('Required', 'Please choose or enter a label.'); return; }
    if (!address.trim())    { Alert.alert('Required', 'Please enter the address.'); return; }
    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);
    if (isNaN(parsedLat) || isNaN(parsedLng)) {
      Alert.alert('Required', 'Latitude and longitude are required.');
      return;
    }
    onSave({
      label:     finalLabel,
      address:   address.trim(),
      latitude:  parsedLat,
      longitude: parsedLng,
      landmark:  landmark.trim(),
    });
  }, [effectiveLabel, address, lat, lng, landmark, onSave]);

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Text style={styles.formTitle}>{initial ? 'Edit Address' : 'Add Address'}</Text>

      {/* Label presets */}
      <Text style={styles.formLabel}>Label</Text>
      <View style={styles.presetRow}>
        {LABEL_PRESETS.map((p) => (
          <TouchableOpacity
            key={p}
            style={[styles.presetBtn, usingPreset === p && styles.presetBtnActive]}
            onPress={() => handlePreset(p)}
            activeOpacity={0.75}
          >
            <Text style={[styles.presetText, usingPreset === p && styles.presetTextActive]}>{p}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TextInput
        style={styles.input}
        placeholder="Or type custom label…"
        placeholderTextColor={colors.textMuted}
        value={customLabel}
        onChangeText={handleCustom}
        maxLength={30}
      />

      {/* Address */}
      <Text style={styles.formLabel}>Full Address</Text>
      <TextInput
        style={[styles.input, styles.inputMultiline]}
        placeholder="House / Building, Street, Area, City…"
        placeholderTextColor={colors.textMuted}
        value={address}
        onChangeText={setAddress}
        multiline
        numberOfLines={3}
      />

      {/* Landmark (optional) */}
      <Text style={styles.formLabel}>Landmark <Text style={styles.optionalTag}>(optional)</Text></Text>
      <TextInput
        style={styles.input}
        placeholder="Near school, beside park…"
        placeholderTextColor={colors.textMuted}
        value={landmark}
        onChangeText={setLandmark}
        maxLength={80}
      />

      {/* Coordinates — shown read-only when prefilled, editable otherwise */}
      <View style={styles.coordRow}>
        <View style={styles.coordField}>
          <Text style={styles.formLabel}>Latitude</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 12.9716"
            placeholderTextColor={colors.textMuted}
            value={lat}
            onChangeText={setLat}
            keyboardType="numeric"
          />
        </View>
        <View style={styles.coordField}>
          <Text style={styles.formLabel}>Longitude</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 77.5946"
            placeholderTextColor={colors.textMuted}
            value={lng}
            onChangeText={setLng}
            keyboardType="numeric"
          />
        </View>
      </View>

      {/* Actions */}
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.saveBtn}
      >
        <TouchableOpacity style={styles.saveBtnTouch} onPress={handleSave} disabled={saving} activeOpacity={0.85}>
          {saving
            ? <ActivityIndicator color="#000" />
            : <Text style={styles.saveBtnText}>{initial ? 'Save Changes' : 'Add Address'}</Text>
          }
        </TouchableOpacity>
      </LinearGradient>

      <TouchableOpacity onPress={onCancel} style={styles.cancelBtn} activeOpacity={0.7}>
        <Text style={styles.cancelText}>Cancel</Text>
      </TouchableOpacity>
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

  // 'list' | 'add' | 'edit'
  const [view,       setView]       = useState('list');
  const [editTarget, setEditTarget] = useState(null);
  const [saving,     setSaving]     = useState(false);

  // Fetch on open (only if logged in and we haven't loaded yet or list is stale)
  useEffect(() => {
    if (visible && userProfile) {
      fetchSavedAddresses();
    }
  }, [visible, userProfile]);

  // Reset to list view on close
  useEffect(() => {
    if (!visible) {
      setView('list');
      setEditTarget(null);
    }
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

  const handleSaveCurrentAsAddress = useCallback(() => {
    setEditTarget(null);
    setView('add');
  }, []);

  const handleEdit = useCallback((item) => {
    setEditTarget(item);
    setView('edit');
  }, []);

  const handleDelete = useCallback((item) => {
    Alert.alert(
      'Delete Address',
      `Remove "${item.label}" from saved addresses?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteSavedAddress(item._id?.toString() || item._id);
          },
        },
      ]
    );
  }, [deleteSavedAddress]);

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

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* ── List View ── */}
            {view === 'list' && (
              <>
                <View style={styles.sheetHeader}>
                  <Text style={styles.sheetTitle}>Delivery Location</Text>
                  <TouchableOpacity onPress={() => setView('add')} activeOpacity={0.7}>
                    <Text style={styles.addNewText}>+ Add New</Text>
                  </TouchableOpacity>
                </View>

                {/* Use current GPS location */}
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

                {/* Save current as address shortcut */}
                {hasCurrentLocation && (
                  <TouchableOpacity
                    style={styles.saveCurrentRow}
                    onPress={handleSaveCurrentAsAddress}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.saveCurrentText}>📌 Save current location as an address</Text>
                  </TouchableOpacity>
                )}

                {/* Saved addresses list */}
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
                initial={hasCurrentLocation ? {
                  address:   currentAddress || '',
                  latitude:  currentLat,
                  longitude: currentLng,
                } : undefined}
                prefillAddress={currentAddress}
                prefillLat={currentLat}
                prefillLng={currentLng}
                onSave={handleAddSave}
                onCancel={() => setView('list')}
                saving={saving}
              />
            )}

            {/* ── Edit View ── */}
            {view === 'edit' && editTarget && (
              <AddressForm
                initial={editTarget}
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
    maxHeight: '88%',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: 20,
  },

  // Header
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
  addNewText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.accentAmber,
  },

  // Current location row
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
    fontWeight: '400',
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

  // Save current shortcut
  saveCurrentRow: {
    paddingVertical: 10,
    marginBottom: 14,
  },
  saveCurrentText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.accentAmber,
  },

  // List section
  listSectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginBottom: 10,
  },

  // Address row
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
    fontWeight: '400',
    lineHeight: 17,
  },
  addressRowLandmark: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '400',
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

  // Empty
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

  // Form
  formTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 20,
    textAlign: 'center',
  },
  formLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  optionalTag: {
    fontSize: 11,
    fontWeight: '400',
    color: colors.textMuted,
    textTransform: 'none',
  },
  presetRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  presetBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
  },
  presetBtnActive: {
    borderColor: colors.accentYellow,
    backgroundColor: colors.accentYellowSoft,
  },
  presetText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  presetTextActive: {
    color: colors.accentAmber,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.textPrimary,
    marginBottom: 14,
  },
  inputMultiline: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  coordRow: {
    flexDirection: 'row',
    gap: 12,
  },
  coordField: { flex: 1 },

  // Save button
  saveBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 4,
    marginBottom: 10,
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
  cancelBtn: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: '600',
  },
});

export default SavedAddressSheet;