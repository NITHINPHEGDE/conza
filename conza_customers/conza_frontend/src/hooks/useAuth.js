import { useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { authAPI } from '../api/authAPI';
import useAppStore from '../store/useAppStore';

// ── Reverse geocode using backend API ──────────────────────────────────────────
const reverseGeocodeWithMappls = async (latitude, longitude) => {
  try {
    const data = await authAPI.reverseGeocode(latitude, longitude);
    return data.locationText || '';
  } catch {
    return '';
  }
};

// ── Parse result into address fields for checkout autofill ────────────────────
export const reverseGeocodeFullAddress = async (latitude, longitude) => {
  try {
    const data = await authAPI.reverseGeocode(latitude, longitude);
    if (!data.success) return null;
    return data.address;
  } catch {
    return null;
  }
};

// ── Hook ──────────────────────────────────────────────────────────────────────
export const useAuth = () => {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const setUserProfile        = useAppStore((s) => s.setUserProfile);

  // ── Signup ─────────────────────────────────────────────────────────────────
  const signup = async ({ fullName, username, phone, email, password }) => {
    try {
      setLoading(true);
      setError(null);

      let latitude = null, longitude = null, locationText = '';

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        latitude  = pos.coords.latitude;
        longitude = pos.coords.longitude;

        // Use Mappls for accurate Indian address
        locationText = await reverseGeocodeWithMappls(latitude, longitude);
      }

      const data = await authAPI.signup({
        fullName, username, phone, email, password,
        latitude, longitude, locationText,
      });

      setUserProfile(data.user);
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // ── Login ──────────────────────────────────────────────────────────────────
  const login = async (phone, password) => {
    try {
      setLoading(true);
      setError(null);
      const data = await authAPI.login(phone, password);
      setUserProfile(data.user);
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // ── Logout ─────────────────────────────────────────────────────────────────
  const logout = async () => {
    await authAPI.logout();
    setUserProfile(null);
  };

  // ── Restore session on app open ────────────────────────────────────────────
  const restoreSession = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) return false;
      const data = await authAPI.getMe();
      setUserProfile(data.user);
      return true;
    } catch {
      await AsyncStorage.removeItem('authToken');
      return false;
    }
  };

  // ── Refresh location (call on app open or every 3 hrs) ─────────────────────
  const refreshLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return null;

      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const locationText = await reverseGeocodeWithMappls(
        pos.coords.latitude,
        pos.coords.longitude,
      );

      await authAPI.updateLocation({
        latitude:     pos.coords.latitude,
        longitude:    pos.coords.longitude,
        locationText,
      });

      return {
        latitude:     pos.coords.latitude,
        longitude:    pos.coords.longitude,
        locationText,
      };
    } catch {
      return null;
    }
  };

  // ── Update Profile ─────────────────────────────────────────────────────────
  const updateProfile = async (payload) => {
    try {
      setLoading(true);
      setError(null);
      const data = await authAPI.updateProfile(payload);
      if (data.success) {
        setUserProfile(data.user);
        return { success: true };
      }
      return { success: false, error: data.message };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  return { signup, login, logout, restoreSession, refreshLocation, updateProfile, loading, error };
};