import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
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
import usePartnerStore      from '../store/usePartnerStore';
import { colors }           from '../theme/colors';

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();

const TAB_ICONS = { Home: '🏠', Earnings: '💳', Active: '🔧', History: '📋', Profile: '👤' };

const TabIcon = ({ name, focused }) => (
  <View style={styles.iconWrapper}>
    {focused && (
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.activePill}
      />
    )}
    <Text style={[styles.tabIcon, focused && styles.tabIconActive]}>
      {TAB_ICONS[name]}
    </Text>
  </View>
);

const FloatingJobButton = ({ navigation }) => {
  const activeJob = usePartnerStore((s) => s.activeJob);
  const jobStatus = usePartnerStore((s) => s.jobStatus);

  if (!activeJob || jobStatus === 'completed') return null;

  const statusLabel =
    jobStatus === 'on_way'      ? '🚗 On the Way' :
    jobStatus === 'arrived'     ? '📍 Arrived'     :
    jobStatus === 'in_progress' ? '⚒️ Working'     : '';

  return (
    <TouchableOpacity
      style={styles.floatingBtn}
      onPress={() => navigation.navigate('ActiveJob')}
      activeOpacity={0.9}
    >
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.floatingBtnInner}
      >
        <Text style={styles.floatingPulse}>●</Text>
        <Text style={styles.floatingBtnText}>{statusLabel}</Text>
        <Text style={styles.floatingArrow}>›</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const MainTabs = ({ navigation }) => (
  <View style={{ flex: 1 }}>
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        tabBarActiveTintColor: colors.accentAmber,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarIcon: ({ focused }) => <TabIcon name={route.name} focused={focused} />,
      })}
    >
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
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Tabs"           component={MainTabs}            />
    <Stack.Screen name="RequestDetails" component={RequestDetailsScreen} options={{ presentation: 'card' }} />
    <Stack.Screen name="ActiveJob"      component={ActiveJobScreen}     options={{ presentation: 'card' }} />
  </Stack.Navigator>
);

const AppNavigator = () => (
  <NavigationContainer>
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />
      <Stack.Screen name="MainApp"       component={MainAppStack}        />
    </Stack.Navigator>
  </NavigationContainer>
);

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.tabBar,
    borderTopColor: colors.tabBarBorder,
    borderTopWidth: 1,
    height: 70,
    paddingBottom: 10,
    paddingTop: 8,
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 10,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    width: 44,
    height: 30,
  },
  activePill: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 10,
    opacity: 0.2,
  },
  tabIcon: { fontSize: 21, opacity: 0.4 },
  tabIconActive: { opacity: 1 },
  floatingBtn: {
    position: 'absolute',
    bottom: 84,
    alignSelf: 'center',
    zIndex: 999,
    shadowColor: colors.accentAmber,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
    borderRadius: 30,
  },
  floatingBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 30,
    paddingHorizontal: 20,
    paddingVertical: 11,
    gap: 8,
  },
  floatingPulse: {
    fontSize: 10,
    color: colors.danger,
    fontWeight: '900',
  },
  floatingBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: 0.3,
  },
  floatingArrow: {
    fontSize: 18,
    color: colors.textPrimary,
    fontWeight: '300',
    lineHeight: 22,
  },
});

export default AppNavigator;