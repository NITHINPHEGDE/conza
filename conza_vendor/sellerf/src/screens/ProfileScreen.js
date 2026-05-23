import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import useModeStore   from '../store/useModeStore';
import useVendorStore from '../store/useVendorStore';
import ModeToggle     from '../components/ModeToggle';
import { colors }     from '../theme/colors';
import { logoutSeller } from '../services/authService';

const MenuItem = ({ icon, label, value }) => (
  <TouchableOpacity style={styles.menuItem}>
    <Text style={styles.menuIcon}>{icon}</Text>
    <Text style={styles.menuLabel}>{label}</Text>
    <Text style={styles.menuValue}>{value || '›'}</Text>
  </TouchableOpacity>
);

const ProfileScreen = () => {
  const insets = useSafeAreaInsets();
  const { mode } = useModeStore();
  const { seller, clearSeller } = useVendorStore();

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <ModeToggle />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Avatar card */}
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientEnd]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={styles.avatarCard}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(seller?.name || '').charAt(0)}</Text>
          </View>
          <View>
            <Text style={styles.vendorName}>{seller?.name}</Text>
            <Text style={styles.shopName}>{seller?.shopName}</Text>
            <Text style={styles.modeTag}>{mode === 'materials' ? '🧱 Material Seller' : '🏗️ Rental Provider'}</Text>
          </View>
        </LinearGradient>

        {/* Menu */}
        <View style={styles.menuCard}>
          <Text style={styles.menuSection}>Account</Text>
          <MenuItem icon="🏪" label="Shop Details"    />
          <MenuItem icon="📍" label="Service Area"    />
          <MenuItem icon="🏦" label="Bank Details"    />
          <MenuItem icon="📄" label="GST / Tax Info"  />
        </View>

        <View style={styles.menuCard}>
          <Text style={styles.menuSection}>{mode === 'materials' ? 'Seller Settings' : 'Rental Policy'}</Text>
          {mode === 'materials'
            ? <>
                <MenuItem icon="🚚" label="Delivery Options" />
                <MenuItem icon="↩️" label="Return Policy"    />
              </>
            : <>
                <MenuItem icon="💰" label="Deposit Terms"       />
                <MenuItem icon="📅" label="Min / Max Duration"  />
                <MenuItem icon="🔧" label="Maintenance Policy"  />
              </>
          }
        </View>

        <View style={styles.menuCard}>
          <MenuItem icon="🔔" label="Notifications" />
          <MenuItem icon="🔒" label="Privacy"       />
          <MenuItem icon="❓" label="Help & Support" />
          <TouchableOpacity
            style={styles.menuItem}
            onPress={async () => {
              await logoutSeller();
              clearSeller();
            }}
          >
            <Text style={styles.menuIcon}>🚪</Text>
            <Text style={styles.menuLabel}>Logout</Text>
            <Text style={styles.menuValue}>›</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen:       { flex: 1, backgroundColor: colors.background },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerTitle:  { fontSize: 20, fontWeight: '800', color: colors.textPrimary },
  scroll:       { paddingBottom: 40 },
  avatarCard:   { margin: 20, borderRadius: 20, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatar:       { width: 60, height: 60, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center' },
  avatarText:   { fontSize: 28, fontWeight: '900', color: '#FFF' },
  vendorName:   { fontSize: 18, fontWeight: '900', color: '#FFF' },
  shopName:     { fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: '600', marginTop: 2 },
  modeTag:      { fontSize: 11, color: 'rgba(255,255,255,0.75)', fontWeight: '700', marginTop: 4 },
  menuCard:     { marginHorizontal: 20, marginBottom: 14, backgroundColor: colors.surface, borderRadius: 18, padding: 8, elevation: 2, shadowColor: colors.cardShadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 6 },
  menuSection:  { fontSize: 11, fontWeight: '800', color: colors.textMuted, letterSpacing: 0.8, paddingHorizontal: 12, paddingVertical: 8 },
  menuItem:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border, gap: 12 },
  menuIcon:     { fontSize: 18, width: 28 },
  menuLabel:    { flex: 1, fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  menuValue:    { fontSize: 14, color: colors.textMuted },
});

export default ProfileScreen;