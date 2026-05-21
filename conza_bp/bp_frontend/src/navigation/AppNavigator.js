// src/navigation/AppNavigator.js
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { registerBackgroundFetch } from '../utils/backgroundTask';

import RoleSelectionScreen  from '../screens/RoleSelectionScreen';
import LabourHomeScreen     from '../screens/LabourHomeScreen';
import RequestDetailsScreen from '../screens/RequestDetailsScreen';
import ActiveJobScreen      from '../screens/ActiveJobScreen';
import HistoryScreen        from '../screens/HistoryScreen';
import ProfileScreen        from '../screens/ProfileScreen';
import PaymentScreen        from '../screens/PaymentScreen';
import AuthLandingScreen    from '../screens/auth/AuthLandingScreen';
import LoginScreen          from '../screens/auth/LoginScreen';
import SignUpScreen         from '../screens/auth/SignUpScreen';

import usePartnerStore, { selectActiveJob, selectJobStatus } from '../store/usePartnerStore';
import { getLoggedInUser } from '../services/authService';
import { socket } from '../utils/socket';
import { colors } from '../theme/colors';
import {
  requestNotificationPermissions,
  setupNotificationChannel,
  stopAlertSound,
  registerPushToken,
} from '../utils/notificationService';
import { requestBatteryOptimizationExemption } from '../utils/batteryOptimization';
import * as Notifications from 'expo-notifications';

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();

const TAB_ICONS  = { Home: '🏠', Earnings: '💳', Active: '🔧', History: '📋', Profile: '👤' };
const GRAD_START = { x: 0, y: 0 };
const GRAD_END   = { x: 1, y: 0 };
const STACK_OPTS = { headerShown: false };
const CARD_OPTS  = { presentation: 'card', headerShown: false };

const TabIcon = React.memo(({ name, focused }) => (
  <View style={styles.iconWrapper}>
    {focused && (
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientEnd]}
        start={GRAD_START} end={GRAD_END}
        style={styles.activePill}
      />
    )}
    <Text style={focused ? styles.tabIconActive : styles.tabIcon}>{TAB_ICONS[name]}</Text>
  </View>
));

const FloatingJobButton = React.memo(({ navigation }) => {
  const activeJob = usePartnerStore(selectActiveJob);
  const jobStatus = usePartnerStore(selectJobStatus);
  const handlePress = useCallback(() => navigation.navigate('ActiveJob'), [navigation]);

  if (!activeJob || jobStatus === 'completed') return null;

  const statusLabel =
    jobStatus === 'accepted'    ? '🚗 On the Way' :
    jobStatus === 'arrived'     ? '📍 Arrived'    :
    jobStatus === 'in_progress' ? '⚒️ Working'    :
    jobStatus === 'cancelled'   ? '❌ Cancelled'  : 'View Status';

  return (
    <TouchableOpacity style={styles.floatingBtn} onPress={handlePress} activeOpacity={0.9}>
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientEnd]}
        start={GRAD_START} end={GRAD_END}
        style={styles.floatingBtnInner}
      >
        <Text style={styles.floatingPulse}>●</Text>
        <Text style={styles.floatingBtnText}>{statusLabel}</Text>
        <Text style={styles.floatingArrow}>›</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
});

const tabScreenOptions = ({ route }) => ({
  headerShown: false,
  lazy: true,
  tabBarShowLabel: true,
  tabBarStyle: styles.tabBar,
  tabBarLabelStyle: styles.tabLabel,
  tabBarActiveTintColor: colors.accentAmber,
  tabBarInactiveTintColor: colors.textMuted,
  tabBarIcon: ({ focused }) => <TabIcon name={route.name} focused={focused} />,
});

const MainTabs = ({ navigation }) => (
  <View style={styles.flex}>
    <Tab.Navigator initialRouteName="Home" screenOptions={tabScreenOptions}>
      <Tab.Screen name="Home"     component={LabourHomeScreen} options={{ title: 'Home'     }} />
      <Tab.Screen name="Earnings" component={PaymentScreen}    options={{ title: 'Earnings' }} />
      <Tab.Screen name="Active"   component={ActiveJobScreen}  options={{ title: 'Active'   }} />
      <Tab.Screen name="History"  component={HistoryScreen}    options={{ title: 'History'  }} />
      <Tab.Screen name="Profile"  component={ProfileScreen}    options={{ title: 'Profile'  }} />
    </Tab.Navigator>
    <FloatingJobButton navigation={navigation} />
  </View>
);

const MainAppStack = () => (
  <Stack.Navigator screenOptions={STACK_OPTS}>
    <Stack.Screen name="Tabs"           component={MainTabs}             />
    <Stack.Screen name="RequestDetails" component={RequestDetailsScreen} options={CARD_OPTS} />
    <Stack.Screen name="ActiveJob"      component={ActiveJobScreen}      options={CARD_OPTS} />
  </Stack.Navigator>
);

const AuthStack = () => (
  <Stack.Navigator screenOptions={STACK_OPTS}>
    <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />
    <Stack.Screen name="AuthLanding"   component={AuthLandingScreen}   />
    <Stack.Screen name="Login"         component={LoginScreen}         />
    <Stack.Screen name="SignUp"        component={SignUpScreen}        />
  </Stack.Navigator>
);

// ── Root Navigator ─────────────────────────────────────────────────────────
const AppNavigator = () => {
  const [initialRoute, setInitialRoute] = useState(null);
  const setWorker       = usePartnerStore((s) => s.setWorker);
  const syncOnlineState = usePartnerStore((s) => s.syncOnlineState);
  const setActiveJobId  = usePartnerStore((s) => s.setActiveJobId);

  // ── One-time setup: permissions + notification channel ──────────────────
useEffect(() => {
    requestNotificationPermissions();
    setupNotificationChannel();
    registerBackgroundFetch();
    requestBatteryOptimizationExemption();

    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      stopAlertSound();
      const data = response.notification.request.content.data;
      if (data?.type === 'new_request') {
        usePartnerStore.getState().fetchRequests();
      }
    });

    return () => sub.remove();
  }, []);

  // ── Save push token as soon as worker is confirmed logged in ─────────────
  useEffect(() => {
    if (!initialRoute || initialRoute === 'Auth') return;

    const savePushToken = async () => {
      try {
        console.log('[Push] Attempting to save push token after login...');
        const token = await registerPushToken();
        if (!token) return;
        const { api } = require('../services/apiClient');
        const result = await api.patch('/workers/push-token', { pushToken: token });
        console.log('[Push] ✅ Token saved to backend:', result);
      } catch (err) {
        console.warn('[Push] Failed to save token:', err.message);
      }
    };

    savePushToken();
  }, [initialRoute]);

  useEffect(() => {
    let mounted = true;
    getLoggedInUser().then((worker) => {
      if (!mounted) return;
      if (worker) {
        setWorker(worker);
        syncOnlineState(worker.isOnline || false);

        AsyncStorage.getItem('activeJobId').then(id => {
          if (!id) return;
          setActiveJobId(id);
          if (socket.connected) {
            socket.emit('join_booking', id);
          } else {
            socket.once('connect', () => socket.emit('join_booking', id));
          }
        });

        setInitialRoute('MainApp');
      } else {
        setInitialRoute('Auth');
      }
    }).catch(() => {
      if (mounted) setInitialRoute('Auth');
    });
    return () => { mounted = false; };
  }, []);

  if (!initialRoute) {
    return (
      <View style={styles.splash}>
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientEnd]}
          start={GRAD_START} end={GRAD_END}
          style={styles.splashBadge}
        >
          <Text style={styles.splashEmoji}>🔨</Text>
        </LinearGradient>
        <Text style={styles.splashBrand}>Conza Partner</Text>
        <ActivityIndicator color={colors.accentAmber} style={styles.splashSpinner} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={initialRoute} screenOptions={STACK_OPTS}>
        <Stack.Screen name="Auth"    component={AuthStack}    />
        <Stack.Screen name="MainApp" component={MainAppStack} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  flex:             { flex: 1 },
  tabBar:           { backgroundColor: colors.tabBar, borderTopColor: colors.tabBarBorder, borderTopWidth: 1, height: 70, paddingBottom: 10, paddingTop: 8 },
  tabLabel:         { fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },
  iconWrapper:      { alignItems: 'center', justifyContent: 'center', position: 'relative', width: 44, height: 30 },
  activePill:       { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 10, opacity: 0.2 },
  tabIcon:          { fontSize: 21, opacity: 0.4 },
  tabIconActive:    { fontSize: 21, opacity: 1 },
  floatingBtn:      { position: 'absolute', bottom: 84, alignSelf: 'center', zIndex: 999, borderRadius: 30 },
  floatingBtnInner: { flexDirection: 'row', alignItems: 'center', borderRadius: 30, paddingHorizontal: 20, paddingVertical: 11, gap: 8 },
  floatingPulse:    { fontSize: 10, color: colors.danger, fontWeight: '900' },
  floatingBtnText:  { fontSize: 13, fontWeight: '800', color: colors.textPrimary, letterSpacing: 0.3 },
  floatingArrow:    { fontSize: 18, color: colors.textPrimary, fontWeight: '300', lineHeight: 22 },
  splash:           { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', gap: 14 },
  splashBadge:      { width: 80, height: 80, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  splashEmoji:      { fontSize: 36 },
  splashBrand:      { fontSize: 20, fontWeight: '900', color: colors.textPrimary, letterSpacing: 0.5 },
  splashSpinner:    { marginTop: 8 },
});

export default AppNavigator;