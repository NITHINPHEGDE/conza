import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { authAPI } from '../api/authAPI';
import useAppStore from '../store/useAppStore';

export const useAuth = () => {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const setUserProfile        = useAppStore((s) => s.setUserProfile);

  // ── Signup ────────────────────────────────────────────────────────────────
  const signup = async ({ fullName, username, phone, email, password }) => {
    try {
      setLoading(true);
      setError(null);

      let latitude = null, longitude = null, locationText = '';
      const { status } = await Location.requestForegroundPermissionsAsync();

      // Geocode helper
      const getAddress = async (lat, lng) => {
        try {
          const [place] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
          if (place) return [place.city, place.region].filter(Boolean).join(', ');
        } catch (e) {
          console.warn("Native geocoding failed, falling back to backend:", e.message);
        }
        try {
          const data = await authAPI.reverseGeocode(lat, lng);
          return data.locationText;
        } catch (e) {
          console.error("Backend geocoding also failed:", e.message);
          return '';
        }
      };

      if (status === 'granted') {
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        latitude     = pos.coords.latitude;
        longitude    = pos.coords.longitude;
        locationText = await getAddress(latitude, longitude);
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

  // ── Login ─────────────────────────────────────────────────────────────────
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

  // ── Logout ────────────────────────────────────────────────────────────────
  const logout = async () => {
    await authAPI.logout();
    setUserProfile(null);
  };

  // ── Restore session on app load ───────────────────────────────────────────
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

  // ── Update location (call every 3 hrs via background task or on app open) ──
  const refreshLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      
      let locationText = '';
      try {
        const [place] = await Location.reverseGeocodeAsync({
          latitude: pos.coords.latitude, longitude: pos.coords.longitude,
        });
        locationText = [place.city, place.region].filter(Boolean).join(', ');
      } catch {
        const data = await authAPI.reverseGeocode(pos.coords.latitude, pos.coords.longitude);
        locationText = data.locationText;
      }

      await authAPI.updateLocation({
        latitude:     pos.coords.latitude,
        longitude:    pos.coords.longitude,
        locationText,
      });
      return { latitude: pos.coords.latitude, longitude: pos.coords.longitude, locationText };
    } catch {
      return null;
    }
  };

  // ── Update profile ───────────────────────────────────────────────────────
  const updateProfile = async (payload) => {
    try {
      setLoading(true);
      setError(null);
      const data = await authAPI.updateProfile(payload);
      setUserProfile(data.user);
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  return { signup, login, logout, restoreSession, refreshLocation, updateProfile, loading, error };
};