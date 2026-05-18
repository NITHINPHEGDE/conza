import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import HomeScreen        from '../screens/HomeScreen';
import OrdersScreen      from '../screens/OrdersScreen';
import OrderDetailScreen from '../screens/OrderDetailScreen';
import InventoryScreen   from '../screens/InventoryScreen';
import AddProductScreen  from '../screens/AddProductScreen';
import EarningsScreen    from '../screens/EarningsScreen';
import ProfileScreen     from '../screens/ProfileScreen';
import { colors }        from '../theme/colors';

const Tab   = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const TAB_ICONS = {
  Home:      '🏠',
  Orders:    '📦',
  Inventory: '🗃️',
  Earnings:  '💰',
  Profile:   '👤',
};

const TabIcon = ({ name, focused }) => (
  <View style={styles.iconWrapper}>
    {focused && (
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientEnd]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={styles.activePill}
      />
    )}
    <Text style={[styles.tabIcon, focused && styles.tabIconActive]}>
      {TAB_ICONS[name]}
    </Text>
  </View>
);

const OrdersStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="OrdersList"   component={OrdersScreen}      />
    <Stack.Screen name="OrderDetail"  component={OrderDetailScreen} />
  </Stack.Navigator>
);

const InventoryStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="InventoryList" component={InventoryScreen}  />
    <Stack.Screen name="AddProduct"    component={AddProductScreen} />
  </Stack.Navigator>
);

const TabNavigator = () => (
  <Tab.Navigator
    initialRouteName="Home"
    screenOptions={({ route }) => ({
      headerShown:             false,
      tabBarShowLabel:         true,
      tabBarStyle:             styles.tabBar,
      tabBarLabelStyle:        styles.tabLabel,
      tabBarActiveTintColor:   colors.accentAmber,
      tabBarInactiveTintColor: colors.textMuted,
      tabBarIcon: ({ focused }) => <TabIcon name={route.name} focused={focused} />,
    })}
  >
    <Tab.Screen name="Home"      component={HomeScreen}      options={{ title: 'Home'      }} />
    <Tab.Screen name="Orders"    component={OrdersStack}     options={{ title: 'Orders'    }} />
    <Tab.Screen name="Inventory" component={InventoryStack}  options={{ title: 'Inventory' }} />
    <Tab.Screen name="Earnings"  component={EarningsScreen}  options={{ title: 'Earnings'  }} />
    <Tab.Screen name="Profile"   component={ProfileScreen}   options={{ title: 'Profile'   }} />
  </Tab.Navigator>
);

const styles = StyleSheet.create({
  tabBar:        { backgroundColor: colors.tabBar, borderTopColor: colors.tabBarBorder, borderTopWidth: 1, height: 70, paddingBottom: 10, paddingTop: 8, shadowColor: colors.cardShadow, shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 10 },
  tabLabel:      { fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },
  iconWrapper:   { alignItems: 'center', justifyContent: 'center', position: 'relative', width: 44, height: 30 },
  activePill:    { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 10, opacity: 0.2 },
  tabIcon:       { fontSize: 21, opacity: 0.4 },
  tabIconActive: { opacity: 1 },
});

export default TabNavigator;