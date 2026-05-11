// src/screens/auth/AuthLandingScreen.js
import React, { useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme/colors';

const GRAD_START = { x: 0, y: 0 };
const GRAD_END   = { x: 1, y: 0 };
const GRAD_DIAG  = { x: 0, y: 0 };
const GRAD_DIAG_E= { x: 1, y: 1 };

const AuthLandingScreen = ({ navigation }) => {
  const goLogin  = useCallback(() => navigation.navigate('Login'),  [navigation]);
  const goSignUp = useCallback(() => navigation.navigate('SignUp'), [navigation]);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <View style={styles.screen}>

        {/* Hero */}
        <View style={styles.hero}>
          <LinearGradient
            colors={[colors.gradientStart, colors.gradientEnd]}
            start={GRAD_DIAG} end={GRAD_DIAG_E}
            style={styles.logoBadge}
          >
            <Text style={styles.logoEmoji}>👷</Text>
          </LinearGradient>
          <Text style={styles.brand}>Conza Partner</Text>
          <Text style={styles.heroTitle}>Start Earning{'\n'}Today</Text>
          <Text style={styles.heroSub}>
            Join thousands of skilled professionals{'\n'}earning daily on Conza
          </Text>
        </View>

        {/* Stats strip */}
        <View style={styles.statsStrip}>
          <View style={styles.stat}>
            <Text style={styles.statVal}>10K+</Text>
            <Text style={styles.statLbl}>Partners</Text>
          </View>
          <View style={styles.statDiv} />
          <View style={styles.stat}>
            <Text style={styles.statVal}>₹850</Text>
            <Text style={styles.statLbl}>Avg/Day</Text>
          </View>
          <View style={styles.statDiv} />
          <View style={styles.stat}>
            <Text style={styles.statVal}>4.8★</Text>
            <Text style={styles.statLbl}>Rated</Text>
          </View>
        </View>

        {/* CTA */}
        <View style={styles.cta}>
          <TouchableOpacity onPress={goSignUp} activeOpacity={0.88}>
            <LinearGradient
              colors={[colors.gradientStart, colors.gradientEnd]}
              start={GRAD_START} end={GRAD_END}
              style={styles.signupBtn}
            >
              <Text style={styles.signupBtnText}>Create Account →</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={goLogin}
            activeOpacity={0.8}
            style={styles.loginBtn}
          >
            <Text style={styles.loginBtnText}>Already have an account? </Text>
            <Text style={styles.loginBtnAccent}>Log In</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.terms}>
          By continuing you agree to our Terms of Service and Privacy Policy
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: colors.background },
  screen:      { flex: 1, paddingHorizontal: 24, justifyContent: 'space-between', paddingBottom: 32 },
  hero:        { alignItems: 'center', paddingTop: 48 },
  logoBadge:   { width: 80, height: 80, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  logoEmoji:   { fontSize: 36 },
  brand:       { fontSize: 12, fontWeight: '700', color: colors.accentAmber, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 16 },
  heroTitle:   { fontSize: 36, fontWeight: '900', color: colors.textPrimary, textAlign: 'center', lineHeight: 44, marginBottom: 14, letterSpacing: 0.3 },
  heroSub:     { fontSize: 15, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  statsStrip:  { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: colors.border, marginVertical: 10 },
  stat:        { flex: 1, alignItems: 'center' },
  statVal:     { fontSize: 20, fontWeight: '900', color: colors.textPrimary, marginBottom: 4 },
  statLbl:     { fontSize: 11, fontWeight: '600', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  statDiv:     { width: 1, backgroundColor: colors.border, marginVertical: 4 },
  cta:         { gap: 14 },
  signupBtn:   { borderRadius: 16, paddingVertical: 17, alignItems: 'center' },
  signupBtnText:{ fontSize: 17, fontWeight: '800', color: colors.textPrimary, letterSpacing: 0.4 },
  loginBtn:    { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 4 },
  loginBtnText:{ fontSize: 14, color: colors.textSecondary, fontWeight: '500' },
  loginBtnAccent:{ fontSize: 14, color: colors.accentAmber, fontWeight: '800' },
  terms:       { fontSize: 11, color: colors.textMuted, textAlign: 'center', lineHeight: 16 },
});

export default AuthLandingScreen;