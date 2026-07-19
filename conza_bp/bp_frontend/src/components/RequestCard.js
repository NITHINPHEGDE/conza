// src/components/RequestCard.js
import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';

const GRAD_START = { x: 0, y: 0 };
const GRAD_END   = { x: 1, y: 0 };

const RequestCard = React.memo(({ request, onViewDetails }) => {
  const handlePress = useCallback(
    () => onViewDetails(request),
    [onViewDetails, request],
  );

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{request.userName.charAt(0)}</Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.userName}>{request.userName}</Text>
          <Text style={styles.subService}>{request.service} · {request.subService}</Text>
        </View>
        <View style={styles.amountBadge}>
          <Text style={styles.amountText}>₹{request.estimatedAmount}</Text>
        </View>
      </View>

      {request.isAutoBook && (
        <View style={styles.autoBadge}>
          <Text style={styles.autoBadgeText}>
            ⚡ Auto-Match · {Math.max(0, (request.requiredWorkers || 0) - (request.acceptedCount || 0))} slot{(request.requiredWorkers || 0) - (request.acceptedCount || 0) === 1 ? '' : 's'} left
          </Text>
        </View>
      )}

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Text style={styles.metaIcon}>📍</Text>
          <Text style={styles.metaText}>{request.location}, {request.area}</Text>
        </View>
        <View style={styles.metaDot} />
        <View style={styles.metaItem}>
          <Text style={styles.metaIcon}>🛣️</Text>
          <Text style={styles.metaText}>{request.distance}</Text>
        </View>
        <View style={styles.metaDot} />
        <View style={styles.metaItem}>
          <Text style={styles.metaIcon}>⏱️</Text>
          <Text style={styles.metaText}>{request.timeAway}</Text>
        </View>
      </View>

      <TouchableOpacity onPress={handlePress} activeOpacity={0.85}>
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientEnd]}
          start={GRAD_START} end={GRAD_END}
          style={styles.viewBtn}
        >
          <Text style={styles.viewBtnText}>View Details</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
});

const styles = StyleSheet.create({
  card:        { backgroundColor: colors.surface, borderRadius: 18, padding: 16, marginHorizontal: 20, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
  header:      { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar:      { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.accentYellowSoft, borderWidth: 1.5, borderColor: colors.accentYellow, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarText:  { fontSize: 17, fontWeight: '800', color: colors.accentAmber },
  headerInfo:  { flex: 1 },
  userName:    { fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginBottom: 2 },
  subService:  { fontSize: 12, fontWeight: '500', color: colors.textSecondary },
  amountBadge: { backgroundColor: colors.accentAmberSoft, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: 'rgba(240,165,0,0.25)' },
  amountText:  { fontSize: 14, fontWeight: '800', color: colors.accentAmber },
  autoBadge:   { alignSelf: 'flex-start', backgroundColor: 'rgba(240,165,0,0.12)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(240,165,0,0.25)' },
  autoBadgeText: { fontSize: 10, fontWeight: '700', color: colors.accentAmber },
  autoBookBadge: { alignSelf: 'flex-start', backgroundColor: colors.accentYellowSoft, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: 'rgba(245,200,66,0.3)', marginBottom: 12 },
  autoBookBadgeText: { fontSize: 11, fontWeight: '700', color: colors.accentAmber },
  metaRow:     { flexDirection: 'row', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 4 },
  metaItem:    { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaIcon:    { fontSize: 11 },
  metaText:    { fontSize: 11, color: colors.textSecondary, fontWeight: '500' },
  metaDot:     { width: 3, height: 3, borderRadius: 2, backgroundColor: colors.textMuted, marginHorizontal: 4 },
  viewBtn:     { borderRadius: 12, paddingVertical: 11, alignItems: 'center' },
  viewBtnText: { fontSize: 14, fontWeight: '700', color: colors.textPrimary, letterSpacing: 0.3 },
});

export default RequestCard;