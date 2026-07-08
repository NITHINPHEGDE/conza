import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import BookingScreen          from '../screens/BookingScreen';
import WorkersNearbyScreen    from '../screens/WorkersNearbyScreen';
import ProjectScreen          from '../screens/ProjectScreen';
import ProfileScreen          from '../screens/ProfileScreen';
import LabourCheckoutScreen   from '../screens/LabourCheckoutScreen';
import MaterialCheckoutScreen from '../screens/MaterialCheckoutScreen';
import MaterialDetailScreen   from '../screens/MaterialDetailScreen';
import RentalDetailScreen     from '../screens/RentalDetailScreen';
import RentalCheckoutScreen   from '../screens/RentalCheckoutScreen';
import LoginScreen            from '../screens/LoginScreen';
import SignupScreen           from '../screens/SignupScreen';
import StatusScreen           from '../screens/StatusScreen';
import BookingTrackingScreen  from '../screens/BookingTrackingScreen';
import CartScreen             from '../screens/CartScreen';
import useAppStore            from '../store/useAppStore';
import { colors }             from '../theme/colors';

const Tab   = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const PlaceholderScreen = ({ label }) => (
  <View style={styles.placeholder}>
    <MaterialCommunityIcons name="hammer-wrench" size={48} color={colors.accentAmber} style={{ marginBottom: 14 }} />
    <Text style={styles.placeholderText}>{label}</Text>
    <Text style={styles.placeholderSub}>Coming Soon</Text>
  </View>
);

// Booking tab stack
const BookingStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="BookingHome"      component={BookingScreen}          />
    <Stack.Screen name="WorkersNearby"    component={WorkersNearbyScreen}    />
    <Stack.Screen name="LabourCheckout"   component={LabourCheckoutScreen}   />
    <Stack.Screen name="MaterialCheckout" component={MaterialCheckoutScreen} />
    <Stack.Screen name="MaterialDetail"   component={MaterialDetailScreen}   />
    <Stack.Screen name="RentalDetail"     component={RentalDetailScreen}     />
    <Stack.Screen name="RentalCheckout"   component={RentalCheckoutScreen}   />
  </Stack.Navigator>
);

// Status tab stack — list → detail
const StatusStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="StatusList"    component={StatusScreen}          />
    <Stack.Screen name="BookingDetail" component={BookingTrackingScreen} />
  </Stack.Navigator>
);

export const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login"  component={LoginScreen}  />
    <Stack.Screen name="Signup" component={SignupScreen} />
  </Stack.Navigator>
);

const TAB_ICONS = {
  Booking:  'home-variant',
  CartTab:  'cart',
  Projects: 'clipboard-text',
  Status:   'bell',
  Profile:  'account-circle',
};

const TabIcon = ({ name, focused }) => {
  const materialCartCount = useAppStore((s) => s.getCartItemCount());
  const rentalCartCount   = useAppStore((s) => s.getRentalCartCount());
  const totalCart = materialCartCount + rentalCartCount;

  return (
    <View style={styles.iconWrapper}>
      {focused && (
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.activePill}
        />
      )}
      <MaterialCommunityIcons
        name={TAB_ICONS[name]}
        size={22}
        color={focused ? colors.accentAmber : colors.textMuted}
      />
      {name === 'CartTab' && totalCart > 0 && (
        <View style={styles.tabBadge}>
          <Text style={styles.tabBadgeText}>{totalCart}</Text>
        </View>
      )}
    </View>
  );
};

const TabNavigator = () => {
  const insets = useSafeAreaInsets();

  // Gesture-nav devices report a small inset (~8-20px); button-nav devices
  // report a much larger one (~48px+) for the opaque system nav bar.
  // We add our own baseline padding on top of whatever the OS reports,
  // so the tab bar never sits under (or gets swallowed by) the nav bar.
  const bottomPadding = Math.max(insets.bottom, 10) + 8;
  const tabBarHeight  = 54 + bottomPadding;

  return (
    <Tab.Navigator
      initialRouteName="Booking"
      screenOptions={({ route }) => ({
        headerShown:             false,
        tabBarShowLabel:         true,
        tabBarStyle:             [styles.tabBar, { height: tabBarHeight, paddingBottom: bottomPadding }],
        tabBarLabelStyle:        styles.tabLabel,
        tabBarActiveTintColor:   colors.accentAmber,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarIcon: ({ focused }) => <TabIcon name={route.name} focused={focused} />,
      })}
    >
      <Tab.Screen name="Booking"  component={BookingStack}  options={{ title: 'Home'     }} />
      <Tab.Screen name="CartTab"  component={CartScreen}    options={{ title: 'Cart'     }} />
      <Tab.Screen name="Projects" component={ProjectScreen} options={{ title: 'Projects' }} />
      <Tab.Screen name="Status"   component={StatusStack}   options={{ title: 'Status'   }} />
      <Tab.Screen name="Profile"  component={ProfileScreen} options={{ title: 'Profile'  }} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.tabBar,
    borderTopColor:  colors.tabBarBorder,
    borderTopWidth:  1,
    paddingTop:      8,
    shadowColor:     colors.cardShadow,
    shadowOffset:    { width: 0, height: -3 },
    shadowOpacity:   0.08,
    shadowRadius:    10,
    elevation:       10,
  },
  tabLabel:      { fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },
  iconWrapper:   { alignItems: 'center', justifyContent: 'center', position: 'relative', width: 44, height: 30 },
  activePill:    { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 10, opacity: 0.2 },

  tabBadge: {
    position: 'absolute',
    top: -2,
    right: 0,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.accentAmber,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  tabBadgeText: { fontSize: 9, fontWeight: '800', color: '#fff' },
  placeholder:   { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },

  placeholderText:  { fontSize: 20, fontWeight: '800', color: colors.textPrimary, marginBottom: 5 },
  placeholderSub:   { fontSize: 14, color: colors.textMuted, fontWeight: '500' },
});

export default TabNavigator;