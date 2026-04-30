import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';

import BookingScreen  from '../screens/BookingScreen';
import ProjectScreen  from '../screens/ProjectScreen';
import ProfileScreen  from '../screens/ProfileScreen';
import { colors } from '../theme/colors';

const Tab = createBottomTabNavigator();

// Placeholder screen for empty tabs
const PlaceholderScreen = ({ label }) => (
  <View style={styles.placeholder}>
    <Text style={styles.placeholderEmoji}>🚧</Text>
    <Text style={styles.placeholderText}>{label}</Text>
    <Text style={styles.placeholderSub}>Coming Soon</Text>
  </View>
);

const ExploreScreen = () => <PlaceholderScreen label="Explore" />;
const MessagesScreen = () => <PlaceholderScreen label="Messages" />;

const TAB_ICONS = {
  Booking:  { active: '🏠', inactive: '🏠' },
  Explore:  { active: '🔍', inactive: '🔍' },
  Projects: { active: '📋', inactive: '📋' },
  Messages: { active: '💬', inactive: '💬' },
  Profile:  { active: '👤', inactive: '👤' },
};

const TabIcon = ({ name, focused }) => {
  const icon = TAB_ICONS[name];
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
      <Text style={[styles.tabIcon, focused && styles.tabIconActive]}>
        {focused ? icon.active : icon.inactive}
      </Text>
    </View>
  );
};

const TabNavigator = () => (
  <Tab.Navigator
    initialRouteName="Booking"
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarShowLabel: true,
      tabBarStyle: styles.tabBar,
      tabBarLabelStyle: styles.tabLabel,
      tabBarActiveTintColor: colors.accentGreen,
      tabBarInactiveTintColor: colors.textMuted,
      tabBarIcon: ({ focused }) => <TabIcon name={route.name} focused={focused} />,
    })}
  >
    <Tab.Screen name="Booking"  component={BookingScreen}  options={{ title: 'Home'     }} />
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
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    width: 44,
    height: 32,
  },
  activePill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 10,
    opacity: 0.18,
  },
  tabIcon: {
    fontSize: 22,
    opacity: 0.45,
  },
  tabIconActive: {
    opacity: 1,
  },

  // Placeholder
  placeholder: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderEmoji: {
    fontSize: 52,
    marginBottom: 16,
  },
  placeholderText: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  placeholderSub: {
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: '500',
  },
});

export default TabNavigator;