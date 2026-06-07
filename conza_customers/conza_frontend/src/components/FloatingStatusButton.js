import React, { useCallback, useMemo } from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import useAppStore from '../store/useAppStore';
import { useNavigation } from '@react-navigation/native';

const getStatusText = (status) => {
  switch (status) {
    case 'pending':   return 'Waiting for Partner';
    case 'accepted':  return 'Partner on the way';
    case 'arrived':   return 'Worker at location';
    case 'completed': return 'Work Completed!';
    case 'cancelled': return 'Booking Cancelled';
    default:          return 'View Status';
  }
};

const FloatingStatusButton = React.memo(() => {
  const activeBookingId = useAppStore((s) => s.activeBookingId);
  const activeBooking   = useAppStore((s) => s.activeBooking);
  const navigation      = useNavigation();

  const handlePress = useCallback(() => {
    navigation.navigate('Status');
  }, [navigation]);

  const statusColor = useMemo(() => {
    if (!activeBooking) return '#F59E0B';
    switch (activeBooking.status) {
      case 'completed': return '#6366F1';
      case 'cancelled': return '#EF4444';
      case 'arrived':   return '#10B981';
      default:          return '#F59E0B';
    }
  }, [activeBooking?.status]);

  const containerStyle = useMemo(() => [
    styles.container,
    { backgroundColor: statusColor },
  ], [statusColor]);

  if (!activeBookingId || !activeBooking) return null;

  return (
    <TouchableOpacity
      style={containerStyle}
      onPress={handlePress}
      activeOpacity={0.9}
    >
      <View style={styles.content}>
        <MaterialCommunityIcons name="pulse" size={24} color="#FFF" style={styles.icon} />
        <View>
          <Text style={styles.label}>Active Booking</Text>
          <Text style={styles.status}>{getStatusText(activeBooking.status)}</Text>
        </View>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={24} color="#FFF" />
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 90,
    left: 20,
    right: 20,
    height: 60,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    justifyContent: 'space-between',
    zIndex: 9999,
  },
  content: { flexDirection: 'row', alignItems: 'center' },
  icon:    { marginRight: 12 },
  label:   { color: 'rgba(255,255,255,0.8)', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  status:  { color: '#FFF', fontSize: 15, fontWeight: '800' },
});

export default FloatingStatusButton;