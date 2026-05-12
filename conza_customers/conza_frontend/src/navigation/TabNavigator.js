import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import BookingScreen       from '../screens/BookingScreen';
import WorkersNearbyScreen from '../screens/WorkersNearbyScreen';
import ProjectScreen       from '../screens/ProjectScreen';
import ProfileScreen       from '../screens/ProfileScreen';
import LabourCheckoutScreen from '../screens/LabourCheckoutScreen';
import MaterialCheckoutScreen from '../screens/MaterialCheckoutScreen';
import MaterialDetailScreen from '../screens/MaterialDetailScreen';
import RentalDetailScreen   from '../screens/RentalDetailScreen';
import RentalCheckoutScreen from '../screens/RentalCheckoutScreen';
import LoginScreen   from '../screens/LoginScreen';
import SignupScreen  from '../screens/SignupScreen';
import { colors }          from '../theme/colors';

const Tab   = createBottomTabNavigator();
const Stack = createNativeStackNavigator();


// Placeholder
const PlaceholderScreen = ({ label }) => (
  <View style={styles.placeholder}>
    <Text style={styles.placeholderEmoji}>🚧</Text>
    <Text style={styles.placeholderText}>{label}</Text>
    <Text style={styles.placeholderSub}>Coming Soon</Text>
  </View>
);

const ExploreScreen  = () => <PlaceholderScreen label="Explore"  />;
const MessagesScreen = () => <PlaceholderScreen label="Messages" />;

// Stack for Booking tab (supports pushing WorkersNearbyScreen)
const BookingStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="BookingHome"    component={BookingScreen}       />
    <Stack.Screen name="WorkersNearby"  component={WorkersNearbyScreen} />
    <Stack.Screen name="LabourCheckout" component={LabourCheckoutScreen} />
    <Stack.Screen name="MaterialCheckout"    component={MaterialCheckoutScreen} />
    <Stack.Screen name="MaterialDetail" component={MaterialDetailScreen} />
     <Stack.Screen name="RentalDetail"     component={RentalDetailScreen}     />
    <Stack.Screen name="RentalCheckout"   component={RentalCheckoutScreen}   />
  </Stack.Navigator>
);

// Add new Auth stack:
export const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login"  component={LoginScreen}  />
    <Stack.Screen name="Signup" component={SignupScreen} />
  </Stack.Navigator>
);

const TAB_ICONS = {
  Booking:  '🏠',
  Explore:  '🔍',
  Projects: '📋',
  Messages: '💬',
  Profile:  '👤',
};

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

const TabNavigator = () => (
  <Tab.Navigator
    initialRouteName="Booking"
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
    <Tab.Screen name="Booking"  component={BookingStack}   options={{ title: 'Home'     }} />
    <Tab.Screen name="Explore"  component={ExploreScreen}  options={{ title: 'Explore'  }} />
    <Tab.Screen name="Projects" component={ProjectScreen}  options={{ title: 'Projects' }} />
    <Tab.Screen name="Messages" component={MessagesScreen} options={{ title: 'Messages' }} />
    <Tab.Screen name="Profile"  component={ProfileScreen}  options={{ title: 'Profile'  }} />
  </Tab.Navigator>
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
  placeholder: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderEmoji: { fontSize: 48, marginBottom: 14 },
  placeholderText: { fontSize: 20, fontWeight: '800', color: colors.textPrimary, marginBottom: 5 },
  placeholderSub: { fontSize: 14, color: colors.textMuted, fontWeight: '500' },
});

export default TabNavigator;