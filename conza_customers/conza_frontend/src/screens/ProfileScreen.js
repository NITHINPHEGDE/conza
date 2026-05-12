import React, { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import useAppStore from '../store/useAppStore';
import { SectionLoader } from '../components/LoadingState';
import { useAuth } from '../hooks/useAuth';
import { colors } from '../theme/colors';

const StatCard = React.memo(({ value, label }) => (
  <View style={styles.statCard}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
));

const MenuItem = React.memo(({ icon, label, sub, danger, onPress }) => (
  <TouchableOpacity style={styles.menuItem} activeOpacity={0.75} onPress={onPress}>
    <View style={[styles.menuIcon, danger && styles.menuIconDanger]}>
      <Text style={{ fontSize: 18 }}>{icon}</Text>
    </View>
    <View style={{ flex: 1 }}>
      <Text style={[styles.menuLabel, danger && { color: colors.danger }]}>{label}</Text>
      {sub && <Text style={styles.menuSub}>{sub}</Text>}
    </View>
    {!danger && <Text style={styles.menuArrow}>›</Text>}
  </TouchableOpacity>
));

const ProfileScreen = () => {
  const userProfile    = useAppStore((s) => s.userProfile);
  const profileLoading = useAppStore((s) => s.profileLoading);
  const insets = useSafeAreaInsets();
  const { logout, updateProfile, loading } = useAuth();

  const [editVisible, setEditVisible] = React.useState(false);
  const [form, setForm] = React.useState({ fullName: '', email: '', locationText: '' });

  const openEdit = () => {
    setForm({
      fullName:     userProfile.fullName || '',
      email:        userProfile.email || '',
      locationText: userProfile.locationText || '',
    });
    setEditVisible(true);
  };

  const handleUpdateProfile = async () => {
    const res = await updateProfile(form);
    if (res.success) setEditVisible(false);
  };

  const handleLogout = async () => {
    await logout();
    // Navigation will auto-switch to Auth stack due to userProfile becoming null
  };

  if (profileLoading || !userProfile) return (
    <View style={[styles.safe, { paddingTop: insets.top + 10 }]}>
      <SectionLoader message="Loading profile..." />
    </View>
  );

  const u = userProfile;
  const initials = useMemo(() => 
    u.fullName?.split(' ').map((n) => n[0]).join('') || '??',
    [u.fullName]
  );

  return (
     <View style={[styles.safe, { paddingTop: insets.top + 10 }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Avatar Section */}
        <LinearGradient
          colors={['rgba(34,197,94,0.1)', 'transparent']}
          style={styles.avatarSection}
        >
          <LinearGradient
            colors={[colors.gradientStart, colors.gradientEnd]}
            style={styles.avatar}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.avatarInitials}>{initials}</Text>
          </LinearGradient>
          <Text style={styles.userName}>{u.fullName}</Text>
          <Text style={styles.userPhone}>{u.phone}</Text>
          <TouchableOpacity style={styles.editBtn} activeOpacity={0.8} onPress={openEdit}>
            <Text style={styles.editBtnText}>Edit Profile</Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatCard value={u.projectsCompleted} label="Completed" />
          <View style={styles.statDivider} />
          <StatCard value={u.activeSites} label="Active Sites" />
          <View style={styles.statDivider} />
          <StatCard value={u.memberSince} label="Member Since" />
        </View>

        {/* Menu */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <MenuItem icon="📍" label="Saved Addresses"      sub={u.locationText || 'No address set'} />
          <MenuItem icon="📋" label="My Orders"            sub="View past bookings" />
          <MenuItem icon="💳" label="Payment Methods"      sub="UPI, Card, COD" />
          <MenuItem icon="🔔" label="Notifications"        sub="Manage alerts" />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <MenuItem icon="❓" label="Help & FAQ" />
          <MenuItem icon="💬" label="Chat with Us" />
          <MenuItem icon="⭐" label="Rate the App" />
        </View>

        <View style={styles.section}>
          <MenuItem icon="🚪" label="Logout" danger onPress={handleLogout} />
        </View>

        <Text style={styles.version}>ConstructApp v1.0.0</Text>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={editVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Edit Profile</Text>
            
            <ScrollView style={{ maxHeight: 400 }}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  value={form.fullName}
                  onChangeText={(v) => setForm({ ...form, fullName: v })}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={form.email}
                  onChangeText={(v) => setForm({ ...form, email: v })}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Location Address</Text>
                <TextInput
                  style={styles.input}
                  value={form.locationText}
                  onChangeText={(v) => setForm({ ...form, locationText: v })}
                  multiline
                />
              </View>
            </ScrollView>

            <LinearGradient
              colors={[colors.gradientStart, colors.gradientEnd]}
              style={styles.saveBtn}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            >
              <TouchableOpacity style={styles.saveBtnTouch} onPress={handleUpdateProfile} disabled={loading}>
                {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
              </TouchableOpacity>
            </LinearGradient>

            <TouchableOpacity onPress={() => setEditVisible(false)} style={styles.cancelBtn}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    paddingBottom: 40,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    shadowColor: colors.accentGreen,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  avatarInitials: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: 1,
  },
  userName: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  userPhone: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 18,
    fontWeight: '500',
  },
  editBtn: {
    paddingHorizontal: 24,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.accentGreen,
    backgroundColor: colors.accentGreenSoft,
  },
  editBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.accentGreen,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 18,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginVertical: 14,
  },
  section: {
    marginTop: 24,
    marginHorizontal: 20,
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    paddingTop: 4,
    paddingBottom: 4,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 16,
    gap: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  menuIconDanger: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderColor: 'rgba(239,68,68,0.2)',
  },
  menuLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  menuSub: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '400',
  },
  menuArrow: {
    fontSize: 22,
    color: colors.textMuted,
    fontWeight: '300',
    lineHeight: 26,
  },
  version: {
    textAlign: 'center',
    marginTop: 32,
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '500',
  },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: colors.background, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 40 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: colors.textPrimary, textAlign: 'center', marginBottom: 24 },
  inputGroup: { marginBottom: 18 },
  label: { fontSize: 13, fontWeight: '700', color: colors.textSecondary, marginBottom: 8 },
  input: { backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 14, fontSize: 15, color: colors.textPrimary },
  saveBtn: { borderRadius: 16, overflow: 'hidden', marginTop: 12 },
  saveBtnTouch: { paddingVertical: 16, alignItems: 'center' },
  saveBtnText: { fontSize: 16, fontWeight: '800', color: colors.textPrimary },
  cancelBtn: { marginTop: 12, paddingVertical: 12, alignItems: 'center' },
  cancelBtnText: { fontSize: 14, color: colors.textMuted, fontWeight: '600' },
});

export default ProfileScreen;