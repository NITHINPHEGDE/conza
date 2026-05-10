// src/navigation/AppNavigator.js
import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';

import RoleSelectionScreen  from '../screens/RoleSelectionScreen';
import LabourHomeScreen     from '../screens/LabourHomeScreen';
import RequestDetailsScreen from '../screens/RequestDetailsScreen';
import ActiveJobScreen      from '../screens/ActiveJobScreen';
import HistoryScreen        from '../screens/HistoryScreen';
import ProfileScreen        from '../screens/ProfileScreen';
import PaymentScreen        from '../screens/PaymentScreen';
import usePartnerStore, {
  selectActiveJob, selectJobStatus,
} from '../store/usePartnerStore';
import { colors } from '../theme/colors';

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();

const TAB_ICONS = { Home: '🏠', Earnings: '💳', Active: '🔧', History: '📋', Profile: '👤' };

// ── Static gradient vectors ───────────────────────────────────────────────────
const GRAD_START = { x: 0, y: 0 };
const GRAD_END   = { x: 1, y: 0 };

// ── Memoized tab icon ─────────────────────────────────────────────────────────
const TabIcon = React.memo(({ name, focused }) => (
  <View style={styles.iconWrapper}>
    {focused && (
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientEnd]}
        start={GRAD_START} end={GRAD_END}
        style={styles.activePill}
      />
    )}
    <Text style={focused ? styles.tabIconActive : styles.tabIcon}>
      {TAB_ICONS[name]}
    </Text>
  </View>
));

// ── Floating job button — only subscribes to 2 narrow selectors ───────────────
const FloatingJobButton = React.memo(({ navigation }) => {
  const activeJob = usePartnerStore(selectActiveJob);
  const jobStatus = usePartnerStore(selectJobStatus);

  const handlePress = useCallback(
    () => navigation.navigate('ActiveJob'),
    [navigation],
  );

  if (!activeJob || jobStatus === 'completed') return null;

  const statusLabel =
    jobStatus === 'on_way'      ? '🚗 On the Way' :
    jobStatus === 'arrived'     ? '📍 Arrived'    :
    jobStatus === 'in_progress' ? '⚒️ Working'    : '';

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

// ── Screen options — defined outside component so it's never recreated ─────────
const screenOptions = ({ route }) => ({
  headerShown: false,
  lazy: true,                       // <── key: don't mount until first visited
  tabBarShowLabel: true,
  tabBarStyle: styles.tabBar,
  tabBarLabelStyle: styles.tabLabel,
  tabBarActiveTintColor: colors.accentAmber,
  tabBarInactiveTintColor: colors.textMuted,
  tabBarIcon: ({ focused }) => <TabIcon name={route.name} focused={focused} />,
});

const stackScreenOptions = { headerShown: false };

const MainTabs = ({ navigation }) => (
  <View style={styles.flex}>
    <Tab.Navigator initialRouteName="Home" screenOptions={screenOptions}>
      <Tab.Screen name="Home"     component={LabourHomeScreen} options={HOME_OPTS}     />
      <Tab.Screen name="Earnings" component={PaymentScreen}    options={EARNINGS_OPTS} />
      <Tab.Screen name="Active"   component={ActiveJobScreen}  options={ACTIVE_OPTS}   />
      <Tab.Screen name="History"  component={HistoryScreen}    options={HISTORY_OPTS}  />
      <Tab.Screen name="Profile"  component={ProfileScreen}    options={PROFILE_OPTS}  />
    </Tab.Navigator>
    <FloatingJobButton navigation={navigation} />
  </View>
);

// Static options objects — defined once, never recreated
const HOME_OPTS     = { title: 'Home'     };
const EARNINGS_OPTS = { title: 'Earnings' };
const ACTIVE_OPTS   = { title: 'Active'   };
const HISTORY_OPTS  = { title: 'History'  };
const PROFILE_OPTS  = { title: 'Profile'  };

const MainAppStack = () => (
  <Stack.Navigator screenOptions={stackScreenOptions}>
    <Stack.Screen name="Tabs"           component={MainTabs}            />
    <Stack.Screen name="RequestDetails" component={RequestDetailsScreen} options={CARD_OPTS} />
    <Stack.Screen name="ActiveJob"      component={ActiveJobScreen}     options={CARD_OPTS} />
  </Stack.Navigator>
);

const CARD_OPTS = { presentation: 'card', headerShown: false };

const AppNavigator = () => (
  <NavigationContainer>
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />
      <Stack.Screen name="MainApp"       component={MainAppStack}        />
    </Stack.Navigator>
  </NavigationContainer>
);

const styles = StyleSheet.create({
  flex: { flex: 1 },
  tabBar: {
    backgroundColor: colors.tabBar,
    borderTopColor: colors.tabBarBorder,
    borderTopWidth: 1,
    height: 70,
    paddingBottom: 10,
    paddingTop: 8,
  },
  tabLabel:      { fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },
  iconWrapper:   { alignItems: 'center', justifyContent: 'center', position: 'relative', width: 44, height: 30 },
  activePill:    { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 10, opacity: 0.2 },
  tabIcon:       { fontSize: 21, opacity: 0.4 },
  tabIconActive: { fontSize: 21, opacity: 1 },
  floatingBtn: {
    position: 'absolute',
    bottom: 84,
    alignSelf: 'center',
    zIndex: 999,
    borderRadius: 30,
  },
  floatingBtnInner: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 30, paddingHorizontal: 20, paddingVertical: 11, gap: 8,
  },
  floatingPulse: { fontSize: 10, color: colors.danger, fontWeight: '900' },
  floatingBtnText: { fontSize: 13, fontWeight: '800', color: colors.textPrimary, letterSpacing: 0.3 },
  floatingArrow: { fontSize: 18, color: colors.textPrimary, fontWeight: '300', lineHeight: 22 },
});

export default AppNavigator;