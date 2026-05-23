// conzavf/src/screens/auth/AuthLandingScreen.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';

const AuthLandingScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientEnd]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <Text style={styles.logo}>🏗️</Text>
        <Text style={styles.appName}>Conza Vendor</Text>
        <Text style={styles.tagline}>Sell materials & rent equipment{'\n'}to construction sites near you</Text>
      </LinearGradient>

      <View style={styles.bottom}>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => navigation.navigate('Register')}
        >
          <LinearGradient
            colors={[colors.gradientStart, colors.gradientEnd]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.gradient}
          >
            <Text style={styles.primaryBtnText}>Create Seller Account</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.secondaryBtnText}>Sign In</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screen:        { flex: 1, backgroundColor: colors.background },
  hero:          { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  logo:          { fontSize: 72, marginBottom: 20 },
  appName:       { fontSize: 32, fontWeight: '900', color: '#FFF', marginBottom: 12 },
  tagline:       { fontSize: 15, color: 'rgba(255,255,255,0.85)', textAlign: 'center', lineHeight: 22 },
  bottom:        { padding: 28, gap: 14 },
  primaryBtn:    { borderRadius: 16, overflow: 'hidden' },
  gradient:      { paddingVertical: 18, alignItems: 'center' },
  primaryBtnText:{ fontSize: 16, fontWeight: '800', color: '#FFF' },
  secondaryBtn:  { paddingVertical: 18, alignItems: 'center', borderRadius: 16, borderWidth: 1.5, borderColor: colors.border },
  secondaryBtnText: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
});

export default AuthLandingScreen;