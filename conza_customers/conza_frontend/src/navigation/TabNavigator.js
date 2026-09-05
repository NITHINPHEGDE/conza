import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import BookingScreen          from '../screens/BookingScreen';
import WorkersNearbyScreen    from '../screens/WorkersNearbyScreen';
import ProjectsScreen         from '../screens/ProjectsScreen';
import CreateProjectScreen    from '../screens/CreateProjectScreen';
import ProjectDetailScreen    from '../screens/ProjectDetailScreen';
import ProfileScreen          from '../screens/ProfileScreen';
import LabourCheckoutScreen   from '../screens/LabourCheckoutScreen';
import MaterialCheckoutScreen from '../screens/MaterialCheckoutScreen';
import BookingConfirmationScreen from '../screens/BookingConfirmationScreen';
import MaterialDetailScreen   from '../screens/MaterialDetailScreen';
import RentalDetailScreen     from '../screens/RentalDetailScreen';
import RentalCheckoutScreen   from '../screens/RentalCheckoutScreen';
import LoginScreen            from '../screens/LoginScreen';
import SignupScreen           from '../screens/SignupScreen';
import StatusScreen           from '../screens/StatusScreen';
import BookingTrackingScreen  from '../screens/BookingTrackingScreen';
import OrderDetailScreen      from '../screens/OrderDetailScreen';
import CartScreen             from '../screens/CartScreen';
import WalletScreen           from '../screens/WalletScreen';
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
    <Stack.Screen name="Checkout"         component={MaterialCheckoutScreen} />
    <Stack.Screen name="BookingConfirmation" component={BookingConfirmationScreen} />
    <Stack.Screen name="Wallet"           component={WalletScreen}           />
  </Stack.Navigator>
);

// Cart tab stack — cart → checkout → confirmation
const CartStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="CartHome"            component={CartScreen}             />
    <Stack.Screen name="Checkout"            component={MaterialCheckoutScreen} />
    <Stack.Screen name="BookingConfirmation" component={BookingConfirmationScreen} />
  </Stack.Navigator>
);

// Status tab stack — list → detail
const StatusStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="StatusList"    component={StatusScreen}          />
    <Stack.Screen name="BookingDetail" component={BookingTrackingScreen} />
    <Stack.Screen name="OrderDetail"   component={OrderDetailScreen}     />
  </Stack.Navigator>
);

// Projects tab stack — list → create / detail
const ProjectsStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ProjectsHome"  component={ProjectsScreen}      />
    <Stack.Screen name="CreateProject" component={CreateProjectScreen} />
    <Stack.Screen name="ProjectDetail" component={ProjectDetailScreen} />
  </Stack.Navigator>
);

// Profile tab stack — profile → wallet
const ProfileStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ProfileHome" component={ProfileScreen} />
    <Stack.Screen name="Wallet"      component={WalletScreen}  />
  </Stack.Navigator>
);

export const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login"  component={LoginScreen}  />
    <Stack.Screen name="Signup" component={SignupScreen} />
  </Stack.Navigator>
);

const getTabIcon = (name, focused) => {
  switch (name) {
    case 'Booking':  return focused ? 'home' : 'home-outline';
    case 'CartTab':  return focused ? 'cart' : 'cart-outline';
    case 'Projects': return focused ? 'folder' : 'folder-outline';
    case 'Status':   return focused ? 'poll' : 'poll';
    case 'Profile':  return focused ? 'account' : 'account-outline';
    default:         return 'circle';
  }
};

const TabIcon = ({ name, focused }) => {
  const materialCartCount = useAppStore((s) => s.getCartItemCount());
  const rentalCartCount   = useAppStore((s) => s.getRentalCartCount());
  const totalCart = materialCartCount + rentalCartCount;
  const displayBadge = totalCart > 0 ? totalCart : 0;

  return (
    <View style={styles.iconWrapper}>
      <MaterialCommunityIcons
        name={getTabIcon(name, focused)}
        size={22}
        color={focused ? '#F59E0B' : '#94A3B8'}
      />
      {name === 'CartTab' && displayBadge > 0 && (
        <View style={styles.tabBadge}>
          <Text style={styles.tabBadgeText}>{displayBadge}</Text>
        </View>
      )}
    </View>
  );
};

const TabNavigator = () => {
  const insets = useSafeAreaInsets();

  const bottomPadding = Math.max(insets.bottom, 6) + 4;
  const tabBarHeight  = 54 + bottomPadding;

  return (
    <Tab.Navigator
      initialRouteName="Booking"
      screenOptions={({ route }) => ({
        headerShown:             false,
        tabBarShowLabel:         true,
        tabBarStyle:             [styles.tabBar, { height: tabBarHeight, paddingBottom: bottomPadding }],
        tabBarLabelStyle:        styles.tabLabel,
        tabBarActiveTintColor:   '#F59E0B',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarIcon: ({ focused }) => <TabIcon name={route.name} focused={focused} />,
      })}
    >
      <Tab.Screen name="Booking"  component={BookingStack}  options={{ title: 'Home'     }} />
      <Tab.Screen name="CartTab"  component={CartStack}     options={{ title: 'Cart'     }} />
      <Tab.Screen name="Projects" component={ProjectsStack} options={{ title: 'Projects' }} />
      <Tab.Screen name="Status"   component={StatusStack}   options={{ title: 'Status'   }} />
      <Tab.Screen name="Profile"  component={ProfileStack}  options={{ title: 'Profile'  }} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderTopColor:  '#F1F5F9',
    borderTopWidth:  0.8,
    paddingTop:      6,
    shadowColor:     '#000',
    shadowOffset:    { width: 0, height: -2 },
    shadowOpacity:   0.03,
    shadowRadius:    6,
    elevation:       6,
  },
  tabLabel:      { fontSize: 10, fontWeight: '500', letterSpacing: 0.1, marginTop: -1 },
  iconWrapper:   { alignItems: 'center', justifyContent: 'center', position: 'relative', width: 44, height: 28 },

  tabBadge: {
    position: 'absolute',
    top: -4,
    right: 2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FF9500',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  tabBadgeText: { fontSize: 9.5, fontWeight: '800', color: '#FFFFFF' },
  placeholder:   { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },

  placeholderText:  { fontSize: 20, fontWeight: '800', color: colors.textPrimary, marginBottom: 5 },
  placeholderSub:   { fontSize: 14, color: colors.textMuted, fontWeight: '500' },
});

export default TabNavigator;