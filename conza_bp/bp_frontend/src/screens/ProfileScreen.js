import React, { useMemo, useCallback, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, StatusBar, ScrollView,
  Image, Modal, TextInput, ActivityIndicator, Alert, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import usePartnerStore from '../store/usePartnerStore';
import { logout } from '../services/authService';
import { stopLocationTracking } from '../services/locationService';
import { uploadImageToCloudinary } from '../utils/cloudinary';
import { colors } from '../theme/colors';

const CATEGORIES = ['Plumber', 'Carpenter', 'Mason', 'Electrician', 'Painter', 'Builder'];

// ── Stat Card ─────────────────────────────────────────────────────────────────
const StatCard = React.memo(({ value, label }) => (
  <View style={styles.statCard}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
));

// ── Field Row ─────────────────────────────────────────────────────────────────
const FieldRow = React.memo(({ label, value, onChangeText, placeholder, keyboardType = 'default', multiline = false }) => (
  <View style={styles.fieldRow}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <TextInput
      style={[styles.fieldInput, multiline && styles.fieldInputMulti]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder || label}
      placeholderTextColor={colors.textMuted}
      keyboardType={keyboardType}
      multiline={multiline}
      numberOfLines={multiline ? 4 : 1}
      textAlignVertical={multiline ? 'top' : 'center'}
    />
  </View>
));

// ── Category Picker ───────────────────────────────────────────────────────────
const CategoryPicker = React.memo(({ selected, onSelect }) => (
  <View style={styles.fieldRow}>
    <Text style={styles.fieldLabel}>Service Category</Text>
    <View style={styles.categoryGrid}>
      {CATEGORIES.map((cat) => (
        <TouchableOpacity
          key={cat}
          style={[styles.catChip, selected === cat && styles.catChipActive]}
          onPress={() => onSelect(cat)}
          activeOpacity={0.75}
        >
          <Text style={[styles.catChipText, selected === cat && styles.catChipTextActive]}>{cat}</Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>
));

// ── Edit Profile Modal ────────────────────────────────────────────────────────
const EditProfileModal = React.memo(({ visible, profile, onClose, onSave }) => {
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [localImage, setLocalImage] = useState(null);

  React.useEffect(() => {
    if (visible) {
      setForm({
        fullName:     profile.fullName     || '',
        phone:        profile.phone        || '',
        email:        profile.email        || '',
        category:     profile.category     || '',
        locationText: profile.locationText || '',
        experience:   profile.experience != null ? String(profile.experience) : '',
        bio:          profile.bio          || '',
      });
      setLocalImage(null);
    }
  }, [visible, profile]);

  const set = useCallback((field) => (val) => setForm((f) => ({ ...f, [field]: val })), []);

  const pickImage = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow photo access to update your profile picture.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      setLocalImage(result.assets[0].uri);
    }
  }, []);

  const handleSave = useCallback(async () => {
    if (!form.fullName?.trim()) {
      Alert.alert('Required', 'Full name cannot be empty.');
      return;
    }
    setSaving(true);
    try {
      const updates = { ...form };
      if (updates.experience !== '') {
        updates.experience = parseFloat(updates.experience) || null;
      } else {
        updates.experience = null;
      }

      if (localImage) {
        setUploadingImage(true);
        updates.profileImage = await uploadImageToCloudinary(localImage);
        setUploadingImage(false);
      }

      await onSave(updates);
      onClose();
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not save profile.');
    } finally {
      setSaving(false);
      setUploadingImage(false);
    }
  }, [form, localImage, onSave, onClose]);

  const displayImage = localImage || profile.profileImage;
  const initials = (form.fullName || 'W').split(' ').map((n) => n[0]).join('').toUpperCase();

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose} style={styles.modalCancelBtn}>
            <Text style={styles.modalCancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Edit Profile</Text>
          <TouchableOpacity onPress={handleSave} style={styles.modalSaveBtn} disabled={saving}>
            {saving ? (
              <ActivityIndicator size="small" color={colors.accentAmber} />
            ) : (
              <Text style={styles.modalSaveText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalContent} showsVerticalScrollIndicator={false}>
          {/* Avatar picker */}
          <View style={styles.avatarPickerRow}>
            <TouchableOpacity onPress={pickImage} activeOpacity={0.8} style={styles.avatarPickerTouch}>
              {displayImage ? (
                <Image source={{ uri: displayImage }} style={styles.avatarPickerImg} />
              ) : (
                <LinearGradient
                  colors={[colors.gradientStart, colors.gradientEnd]}
                  style={styles.avatarPickerImg}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.avatarPickerInitials}>{initials}</Text>
                </LinearGradient>
              )}
              <View style={styles.avatarPickerOverlay}>
                <Text style={styles.avatarPickerIcon}>📷</Text>
              </View>
            </TouchableOpacity>
            {uploadingImage && (
              <Text style={styles.uploadingText}>Uploading image…</Text>
            )}
          </View>

          <FieldRow label="Full Name" value={form.fullName} onChangeText={set('fullName')} />
          <FieldRow label="Phone Number" value={form.phone} onChangeText={set('phone')} keyboardType="phone-pad" />
          <FieldRow label="Email" value={form.email} onChangeText={set('email')} keyboardType="email-address" />
          <CategoryPicker selected={form.category} onSelect={set('category')} />
          <FieldRow label="Service Areas" value={form.locationText} onChangeText={set('locationText')} placeholder="e.g. Kozhikode, Calicut" />
          <FieldRow label="Experience (years)" value={form.experience} onChangeText={set('experience')} keyboardType="numeric" />
          <FieldRow label="Bio / About" value={form.bio} onChangeText={set('bio')} placeholder="Tell customers about yourself…" multiline />
        </ScrollView>
      </View>
    </Modal>
  );
});

// ── Menu Item ─────────────────────────────────────────────────────────────────
const MenuItem = React.memo(({ icon, label, sub, danger, onPress }) => (
  <TouchableOpacity style={styles.menuItem} activeOpacity={0.75} onPress={onPress}>
    <View style={[styles.menuIcon, danger && styles.menuIconDanger]}>
      <Text style={{ fontSize: 18 }}>{icon}</Text>
    </View>
    <View style={{ flex: 1 }}>
      <Text style={[styles.menuLabel, danger && { color: colors.danger }]}>{label}</Text>
      {sub ? <Text style={styles.menuSub}>{sub}</Text> : null}
    </View>
    {!danger && <Text style={styles.menuArrow}>›</Text>}
  </TouchableOpacity>
));

// ── Profile Screen ────────────────────────────────────────────────────────────
const ProfileScreen = ({ navigation }) => {
  const insets        = useSafeAreaInsets();
  const profile       = usePartnerStore((s) => s.worker) || {};
  const todaysJobs    = usePartnerStore((s) => s.todaysJobs);
  const todaysEarnings = usePartnerStore((s) => s.todaysEarnings);
  const rating        = usePartnerStore((s) => s.worker?.rating ?? 5.0);
  const updateProfile = usePartnerStore((s) => s.updateWorkerProfile);
  const [editVisible, setEditVisible] = useState(false);

  const initials = useMemo(() =>
    (profile.fullName || profile.name || 'W').split(' ').map((n) => n[0]).join('').toUpperCase(),
    [profile.fullName, profile.name]
  );

  const handleLogout = useCallback(async () => {
    stopLocationTracking();
    await logout();
    navigation.replace('Auth');
  }, [navigation]);

  const handleSave = useCallback(async (updates) => {
    await updateProfile(updates);
  }, [updateProfile]);

  const handleHelpFAQ = useCallback(() => {
    navigation.navigate('HelpFAQ');
  }, [navigation]);

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 10 }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          {profile.profileImage ? (
            <Image source={{ uri: profile.profileImage }} style={styles.avatarImage} resizeMode="cover" />
          ) : (
            <LinearGradient
              colors={[colors.gradientStart, colors.gradientEnd]}
              style={styles.avatar}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            >
              <Text style={styles.avatarInitials}>{initials}</Text>
            </LinearGradient>
          )}
          <Text style={styles.userName}>{profile.fullName || profile.name || 'Worker'}</Text>
          <Text style={styles.userCategory}>⭐ {rating.toFixed(1)} · {profile.category || ''}</Text>
          <Text style={styles.userPhone}>{profile.phone || ''}</Text>
          <TouchableOpacity style={styles.editBtn} activeOpacity={0.8} onPress={() => setEditVisible(true)}>
            <Text style={styles.editBtnText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatCard value={String(todaysJobs)} label="Today's Jobs" />
          <View style={styles.statDivider} />
          <StatCard value={`₹${todaysEarnings}`} label="Today's Earn" />
          <View style={styles.statDivider} />
          <StatCard value={rating.toFixed(1)} label="Rating" />
        </View>

        {/* Profile Info */}
        {(profile.locationText || profile.bio || profile.experience != null) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>My Info</Text>
            {!!profile.locationText && (
              <MenuItem icon="📍" label="Service Areas" sub={profile.locationText} />
            )}
            {!!profile.category && (
              <MenuItem icon="🔧" label="Service Category" sub={profile.category} />
            )}
            {profile.experience != null && (
              <MenuItem icon="⏱️" label="Experience" sub={`${profile.experience} year${profile.experience !== 1 ? 's' : ''}`} />
            )}
            {!!profile.bio && (
              <MenuItem icon="📝" label="About" sub={profile.bio} />
            )}
          </View>
        )}

        {/* Support */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <MenuItem icon="❓" label="Help & FAQ" onPress={handleHelpFAQ} />
          <MenuItem
            icon="💬"
            label="Chat With Us"
            sub="Email support"
            onPress={() => {
              const { Linking } = require('react-native');
              const name  = profile.fullName || profile.name || '';
              const phone = profile.phone || '';
              const mailto = `mailto:nr.conza@gmail.com?subject=Conza%20Partner%20Support%20Request&body=Partner%20Name%3A%20${encodeURIComponent(name)}%0APhone%3A%20${encodeURIComponent(phone)}%0AIssue%3A%20`;
              Linking.openURL(mailto).catch(() => Alert.alert('Error', 'Could not open mail app.'));
            }}
          />
        </View>

        <View style={styles.section}>
          <MenuItem icon="🚪" label="Logout" danger onPress={handleLogout} />
        </View>

        <Text style={styles.version}>Conza Partner v1.0.0</Text>
      </ScrollView>

      <EditProfileModal
        visible={editVisible}
        profile={profile}
        onClose={() => setEditVisible(false)}
        onSave={handleSave}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen:   { flex: 1, backgroundColor: colors.background },
  scroll:   { paddingBottom: 40 },
  avatarSection: {
    alignItems: 'center', paddingVertical: 28, paddingHorizontal: 20,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  avatar: {
    width: 80, height: 80, borderRadius: 26, alignItems: 'center',
    justifyContent: 'center', marginBottom: 12,
    shadowColor: colors.accentAmber, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 12, elevation: 10,
  },
  avatarImage: { width: 80, height: 80, borderRadius: 26, marginBottom: 12 },
  avatarInitials: { fontSize: 26, fontWeight: '800', color: colors.textPrimary, letterSpacing: 1 },
  userName:      { fontSize: 20, fontWeight: '800', color: colors.textPrimary, marginBottom: 4 },
  userCategory:  { fontSize: 13, fontWeight: '600', color: colors.accentAmber, marginBottom: 4 },
  userPhone:     { fontSize: 13, color: colors.textSecondary, marginBottom: 16, fontWeight: '500' },
  editBtn: {
    paddingHorizontal: 22, paddingVertical: 8, borderRadius: 12,
    borderWidth: 1.5, borderColor: colors.accentYellow, backgroundColor: colors.accentYellowSoft,
  },
  editBtnText: { fontSize: 13, fontWeight: '700', color: colors.accentAmber },
  statsRow: {
    flexDirection: 'row', backgroundColor: colors.surface,
    marginHorizontal: 20, marginTop: 18, borderRadius: 18,
    borderWidth: 1, borderColor: colors.border, overflow: 'hidden',
  },
  statCard: { flex: 1, alignItems: 'center', paddingVertical: 16 },
  statValue: { fontSize: 16, fontWeight: '800', color: colors.textPrimary, marginBottom: 4 },
  statLabel: { fontSize: 10, color: colors.textMuted, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.4, textAlign: 'center' },
  statDivider: { width: 1, backgroundColor: colors.border, marginVertical: 14 },
  section: {
    marginTop: 20, marginHorizontal: 20, backgroundColor: colors.surface,
    borderRadius: 18, borderWidth: 1, borderColor: colors.border,
    overflow: 'hidden', paddingTop: 4, paddingBottom: 4,
  },
  sectionTitle: {
    fontSize: 11, fontWeight: '700', color: colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.8,
    paddingHorizontal: 16, paddingTop: 10, paddingBottom: 6,
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 12,
    paddingHorizontal: 16, gap: 12, borderTopWidth: 1, borderTopColor: colors.border,
  },
  menuIcon: {
    width: 38, height: 38, borderRadius: 12, backgroundColor: colors.surfaceElevated,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border,
  },
  menuIconDanger: { backgroundColor: colors.dangerSoft, borderColor: 'rgba(224,59,59,0.2)' },
  menuLabel:  { fontSize: 14, fontWeight: '600', color: colors.textPrimary, marginBottom: 2 },
  menuSub:    { fontSize: 11, color: colors.textMuted, fontWeight: '400' },
  menuArrow:  { fontSize: 22, color: colors.textMuted, fontWeight: '300', lineHeight: 26 },
  version:    { textAlign: 'center', marginTop: 28, fontSize: 12, color: colors.textMuted, fontWeight: '500' },

  // Modal
  modalContainer: { flex: 1, backgroundColor: colors.background },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 16 : 20, paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.surface,
  },
  modalTitle:      { fontSize: 17, fontWeight: '700', color: colors.textPrimary },
  modalCancelBtn:  { paddingVertical: 4, paddingHorizontal: 2, minWidth: 60 },
  modalCancelText: { fontSize: 15, color: colors.textSecondary, fontWeight: '500' },
  modalSaveBtn:    { paddingVertical: 4, paddingHorizontal: 2, minWidth: 60, alignItems: 'flex-end' },
  modalSaveText:   { fontSize: 15, color: colors.accentAmber, fontWeight: '700' },
  modalScroll:     { flex: 1 },
  modalContent:    { padding: 20, paddingBottom: 60 },

  avatarPickerRow:    { alignItems: 'center', marginBottom: 28 },
  avatarPickerTouch:  { position: 'relative' },
  avatarPickerImg:    { width: 90, height: 90, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  avatarPickerInitials: { fontSize: 30, fontWeight: '800', color: colors.textPrimary },
  avatarPickerOverlay: {
    position: 'absolute', bottom: 0, right: 0, width: 30, height: 30,
    borderRadius: 10, backgroundColor: colors.surface, borderWidth: 1.5,
    borderColor: colors.accentYellow, alignItems: 'center', justifyContent: 'center',
  },
  avatarPickerIcon: { fontSize: 14 },
  uploadingText:    { marginTop: 8, fontSize: 12, color: colors.textMuted, fontWeight: '500' },

  fieldRow:         { marginBottom: 18 },
  fieldLabel:       { fontSize: 12, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  fieldInput: {
    backgroundColor: colors.inputBg, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 13,
    fontSize: 15, fontWeight: '500', color: colors.textPrimary,
    borderWidth: 1, borderColor: colors.border,
  },
  fieldInputMulti:  { minHeight: 100, paddingTop: 13 },

  categoryGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.border,
  },
  catChipActive:     { backgroundColor: colors.accentYellowSoft, borderColor: colors.accentYellow },
  catChipText:       { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  catChipTextActive: { color: colors.accentAmber, fontWeight: '700' },
});

export default ProfileScreen;