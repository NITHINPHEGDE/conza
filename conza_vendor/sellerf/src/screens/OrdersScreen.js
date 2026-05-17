import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useModeStore   from '../store/useModeStore';
import useVendorStore from '../store/useVendorStore';
import ModeToggle     from '../components/ModeToggle';
import OrderCard      from '../components/OrderCard';
import { colors }     from '../theme/colors';

const STATUS_FILTERS = ['all', 'pending', 'processing', 'delivered', 'cancelled'];

const OrdersScreen = () => {
  const insets = useSafeAreaInsets();
  const { mode } = useModeStore();
  const { getFilteredOrders } = useVendorStore();
  const [statusFilter, setStatusFilter] = useState('all');

  const orders = getFilteredOrders(mode).filter(
    (o) => statusFilter === 'all' || o.status === statusFilter
  );

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
  <Text style={styles.headerTitle}>{mode === 'materials' ? 'Material Orders' : 'Rental Requests'}</Text>
  <ModeToggle />
</View>

      {/* Status filter pills */}
      <View style={styles.filtersWrap}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={STATUS_FILTERS}
          keyExtractor={(f) => f}
          contentContainerStyle={styles.filters}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.filterPill, statusFilter === item && styles.filterPillActive]}
              onPress={() => setStatusFilter(item)}
            >
              <Text style={[styles.filterPillText, statusFilter === item && styles.filterPillTextActive]}>
                {item.charAt(0).toUpperCase() + item.slice(1)}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <FlatList
        data={orders}
        keyExtractor={(o) => o.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📭</Text>
            <Text style={styles.emptyText}>No orders found</Text>
          </View>
        }
        renderItem={({ item }) => <OrderCard order={item} />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen:       { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerTitle:  { fontSize: 20, fontWeight: '800', color: colors.textPrimary },
  filtersWrap:  { backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  filters:      { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  filterPill:   { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.border },
  filterPillActive:     { backgroundColor: colors.accentAmberSoft, borderColor: colors.accentAmber },
  filterPillText:       { fontSize: 12, fontWeight: '600', color: colors.textMuted },
  filterPillTextActive: { color: colors.accentAmber, fontWeight: '800' },
  list:         { padding: 16, paddingBottom: 40 },
  empty:        { alignItems: 'center', paddingTop: 80 },
  emptyEmoji:   { fontSize: 48, marginBottom: 12 },
  emptyText:    { fontSize: 16, color: colors.textMuted, fontWeight: '600' },
});

export default OrdersScreen;