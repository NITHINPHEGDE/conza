import React, { useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  Image, 
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import usePartnerStore from '../store/usePartnerStore';
import { logout } from '../services/authService';
import { stopLocationTracking } from '../services/locationService';
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

const ProfileScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const profile = usePartnerStore((s) => s.worker) || {};
  const todaysJobs = usePartnerStore((s) => s.todaysJobs);
  const todaysEarnings = usePartnerStore((s) => s.todaysEarnings);
  const rating = usePartnerStore((s) => s.rating);

  const initials = useMemo(() =>
  (profile.fullName || profile.name || 'W').split(' ').map((n) => n[0]).join(''),
  [profile.fullName, profile.name]
);

const profileImage = profile.profileImage || null;

  const handleLogout = useCallback(async () => {
    stopLocationTracking();
    await logout();
    navigation.replace('Auth');
  }, [navigation]);

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 10 }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Avatar Section */}
        <View style={styles.avatarSection}>
              {profileImage ? (
        <Image
          source={{ uri: profileImage }}
          style={styles.avatarImage}
          resizeMode="cover"
        />
      ) : (
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientEnd]}
          style={styles.avatar}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.avatarInitials}>{initials}</Text>
        </LinearGradient>
      )}
          <Text style={styles.userName}>{profile.fullName || profile.name || "Worker"}</Text>
          <Text style={styles.userCategory}>⭐ {rating} · {profile.category || ""}</Text>
          <Text style={styles.userPhone}>{profile.phone || ""}</Text>
          <TouchableOpacity style={styles.editBtn} activeOpacity={0.8}>
            <Text style={styles.editBtnText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatCard value={String(todaysJobs)} label="Today's Jobs" />
          <View style={styles.statDivider} />
          <StatCard value={`₹${todaysEarnings}`} label="Today's Earn" />
          <View style={styles.statDivider} />
          <StatCard value={String(rating)} label="Rating" />
        </View>

        {/* Account */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <MenuItem icon="📍" label="Service Location" sub={profile.locationText || profile.location || ''} />
          <MenuItem icon="🔧" label="Skills & Category" sub={profile.category} />
          <MenuItem icon="💳" label="Bank & Payments" sub="Add bank account" />
          <MenuItem icon="🔔" label="Notifications" sub="Job alerts, earnings" />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <MenuItem icon="❓" label="Help & FAQ" />
          <MenuItem icon="💬" label="Contact Support" />
          <MenuItem icon="⭐" label="Rate the App" />
        </View>

        <View style={styles.section}>
          <MenuItem
            icon="🚪"
            label="Logout"
            danger
            onPress={handleLogout}
          /> 
        </View>

        <Text style={styles.version}>Conza Partner v1.0.0</Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    paddingBottom: 40,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: colors.accentAmber,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 10,
  },
  avatarInitials: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  userCategory: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.accentAmber,
    marginBottom: 4,
  },
  userPhone: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 16,
    fontWeight: '500',
  },
  editBtn: {
    paddingHorizontal: 22,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.accentYellow,
    backgroundColor: colors.accentYellowSoft,
  },
  editBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.accentAmber,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    marginHorizontal: 20,
    marginTop: 18,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginVertical: 14,
  },
  section: {
    marginTop: 20,
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
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  menuIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  menuIconDanger: {
    backgroundColor: colors.dangerSoft,
    borderColor: 'rgba(224,59,59,0.2)',
  },
  menuLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  menuSub: {
    fontSize: 11,
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
    marginTop: 28,
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '500',
  },
  avatarImage: {
  width: 80,
  height: 80,
  borderRadius: 26,
  marginBottom: 12,
},
});

export default ProfileScreen;
