// conzavf/src/navigation/AppNavigator.js
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer }    from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { getLoggedInSeller }      from '../services/authService';
import useVendorStore              from '../store/useVendorStore';
import TabNavigator                from './TabNavigator';
import AuthLandingScreen           from '../screens/auth/AuthLandingScreen';
import LoginScreen                 from '../screens/auth/LoginScreen';
import RegisterScreen              from '../screens/auth/RegisterScreen';
import { colors }                  from '../theme/colors';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const seller    = useVendorStore((s) => s.seller);
  const setSeller = useVendorStore((s) => s.setSeller);
  const initSocketListeners = useVendorStore((s) => s.initSocketListeners);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const s = await getLoggedInSeller();
        if (s) {
          setSeller(s);
          initSocketListeners();
        }
      } catch (_) {}
      setBooting(false);
    })();
  }, []);

  if (booting) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.accentAmber} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {seller
          ? <Stack.Screen name="Main" component={TabNavigator} />
          : <>
              <Stack.Screen name="Landing"  component={AuthLandingScreen} />
              <Stack.Screen name="Login"    component={LoginScreen}       />
              <Stack.Screen name="Register" component={RegisterScreen}    />
            </>
        }
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;