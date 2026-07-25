import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const STATUS_META = {
  pending:                        { text: 'Waiting for a worker to accept', color: '#F59E0B', icon: 'clock-outline' },
  accepted:                       { text: 'Worker on the way',              color: '#3B82F6', icon: 'car-side' },
  arrived:                        { text: 'Worker arrived',                 color: '#10B981', icon: 'account-check' },
  in_progress:                    { text: 'Work in progress',               color: '#6366F1', icon: 'hammer-wrench' },
  awaiting_customer_confirmation: { text: 'Confirm work completion',        color: '#F97316', icon: 'clipboard-check' },
  completed:                      { text: 'Completed',                     color: '#10B981', icon: 'check-decagram' },
  expired:                        { text: 'No longer needed',              color: '#94A3B8', icon: 'close-circle-outline' },
  cancelled:                      { text: 'Cancelled',                     color: '#EF4444', icon: 'close-circle' },
};

const AutobookStatusCard = React.memo(({ entry, highlighted, onConfirm, onReportIssue, confirming }) => {
  const meta   = STATUS_META[entry.status] || STATUS_META.pending;
  const worker = entry.workerSnapshot || {};

  const cardStyle = useMemo(() => [
    styles.card,
    { borderColor: meta.color },
    highlighted && styles.cardHighlighted,
  ], [meta.color, highlighted]);

  return (
    <View style={cardStyle}>
      <View style={styles.top}>
        <View style={[styles.iconWrap, { backgroundColor: `${meta.color}22` }]}>
          <MaterialCommunityIcons name={meta.icon} size={20} color={meta.color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name} numberOfLines={1}>{worker.name || worker.fullName || 'Worker'}</Text>
          <Text style={[styles.status, { color: meta.color }]}>{meta.text}</Text>
        </View>
        {!!worker.rating && (
          <View style={styles.ratingChip}>
            <Text style={styles.ratingText}>⭐ {worker.rating}</Text>
          </View>
        )}
      </View>

      {entry.status === 'awaiting_customer_confirmation' && (
        <View style={styles.actions}>
          <TouchableOpacity style={styles.confirmBtn} onPress={onConfirm} disabled={confirming} activeOpacity={0.85}>
            {confirming
              ? <ActivityIndicator color="#FFF" size="small" />
              : <Text style={styles.confirmBtnText}>✓ Confirm Completed</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={styles.issueBtn} onPress={onReportIssue} disabled={confirming} activeOpacity={0.85}>
            <Text style={styles.issueBtnText}>Report Issue</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  card: { backgroundColor: '#FFF', borderRadius: 16, borderWidth: 1.5, padding: 14, marginBottom: 12 },
  cardHighlighted: { shadowColor: '#F97316', shadowOpacity: 0.35, shadowRadius: 10, elevation: 6, borderWidth: 2 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  status: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  ratingChip: { backgroundColor: '#F8FAFC', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4 },
  ratingText: { fontSize: 11, fontWeight: '700', color: '#1E293B' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  confirmBtn: { flex: 1, backgroundColor: '#10B981', borderRadius: 12, paddingVertical: 11, alignItems: 'center' },
  confirmBtnText: { color: '#FFF', fontWeight: '700', fontSize: 13 },
  issueBtn: { flex: 1, borderRadius: 12, paddingVertical: 11, alignItems: 'center', borderWidth: 1.5, borderColor: '#EF4444' },
  issueBtnText: { color: '#EF4444', fontWeight: '700', fontSize: 13 },
});

export default AutobookStatusCard;
