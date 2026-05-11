import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import RoleCard from '../components/RoleCard';
import { colors } from '../theme/colors';

const ROLES = [
  {
    id: 'labour',
    emoji: '👷',
    title: 'Labour',
    description: 'Accept construction job requests. Earn daily by offering your skilled services.',
  },
  {
    id: 'vendor',
    emoji: '🏪',
    title: 'Vendor',
    description: 'Sell construction materials. Manage orders and grow your supply business.',
  },
  {
    id: 'rental',
    emoji: '🏗️',
    title: 'Rental',
    description: 'Rent out equipment. List your machinery and earn from every booking.',
  },
];

const RoleSelectionScreen = ({ navigation }) => {
  const [selectedRole, setSelectedRole] = useState(null);
  const insets = useSafeAreaInsets();

  const handleContinue = () => {
  if (selectedRole === 'labour') {
    navigation.navigate('AuthLanding');
  }
};

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoText}>🔨</Text>
          </View>
          <Text style={styles.brand}>Conza Partner</Text>
          <Text style={styles.title}>Choose Your Role</Text>
          <Text style={styles.subtitle}>
            Select how you want to earn on the Conza platform
          </Text>
        </View>

        {/* Role cards */}
        {ROLES.map((role) => (
          <RoleCard
            key={role.id}
            emoji={role.emoji}
            title={role.title}
            description={role.description}
            active={selectedRole === role.id}
            onPress={() => setSelectedRole(role.id)}
          />
        ))}

        {/* Coming soon note */}
        {selectedRole && selectedRole !== 'labour' && (
          <View style={styles.comingSoonBox}>
            <Text style={styles.comingSoonIcon}>🚧</Text>
            <Text style={styles.comingSoonText}>
              {selectedRole === 'vendor' ? 'Vendor' : 'Rental'} app is coming soon.
              Only Labour flow is available now.
            </Text>
          </View>
        )}

        {/* CTA */}
        <View style={styles.footer}>
          <TouchableOpacity
            onPress={handleContinue}
            activeOpacity={0.85}
            disabled={!selectedRole || selectedRole !== 'labour'}
          >
            <LinearGradient
              colors={
                selectedRole === 'labour'
                  ? [colors.gradientStart, colors.gradientEnd]
                  : [colors.surfaceElevated, colors.border]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.continueBtn}
            >
              <Text style={[
                styles.continueBtnText,
                selectedRole !== 'labour' && { color: colors.textMuted },
              ]}>
                Continue →
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 36,
    paddingHorizontal: 20,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: colors.accentYellowSoft,
    borderWidth: 1.5,
    borderColor: colors.accentYellow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  logoText: {
    fontSize: 30,
  },
  brand: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.accentAmber,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 10,
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '400',
  },
  comingSoonBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 4,
    marginBottom: 8,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 12,
    padding: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  comingSoonIcon: {
    fontSize: 16,
  },
  comingSoonText: {
    flex: 1,
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
    lineHeight: 17,
  },
  footer: {
    marginTop: 30,
    marginHorizontal: 20,
  },
  continueBtn: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  continueBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: 0.5,
  },
});

export default RoleSelectionScreen;
