// src/components/EarningEstimateCard.js
import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

const fmt = (n) => `₹${Math.round(Number(n) || 0)}`;

// Headline for the gradient banner on the Request Details screen.
export const getEarningHeadline = (estimate) => {
  if (!estimate) return null;
  if (estimate.mode === 'scheduled') {
    return { label: "You'll earn", value: fmt(estimate.total && estimate.total.net) };
  }
  if (Number(estimate.minimumEarning) > 0) {
    return { label: "You'll earn at least", value: fmt(estimate.minimumEarning) };
  }
  // Category has no base charge → nothing is guaranteed, it is paid hourly.
  return { label: 'Paid per hour', value: `${fmt(estimate.extraHour && estimate.extraHour.net)}/hr` };
};

const Row = ({ title, value, sub }) => (
  <View style={styles.row}>
    <View style={styles.rowTop}>
      <Text style={styles.rowTitle}>{title}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
    {!!sub && <Text style={styles.rowSub}>{sub}</Text>}
  </View>
);

const EarningEstimateCard = ({ estimate, loading, error, onRetry }) => {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Earning Breakdown</Text>

      {!estimate ? (
        error ? (
          <View style={styles.stateBox}>
            <Text style={styles.stateText}>Couldn't load your earning estimate.</Text>
            <Text style={styles.errorDetail}>{String(error)}</Text>
            <TouchableOpacity onPress={onRetry} activeOpacity={0.8} style={styles.retryBtn}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.stateBox}>
            <ActivityIndicator size="small" color={colors.accentAmber} />
            <Text style={styles.stateText}>{loading ? 'Calculating your earning…' : 'Preparing…'}</Text>
          </View>
        )
      ) : estimate.mode === 'scheduled' ? (
        <>
          <Row
            title="Per day"
            value={fmt(estimate.perDay.net)}
            sub={`${fmt(estimate.perDay.gross)} per day − ${estimate.commissionPercent}% commission (${fmt(estimate.perDay.commissionAmount)})`}
          />
          <View style={styles.divider} />
          <Row
            title={`Total for ${estimate.totalDays} day${estimate.totalDays > 1 ? 's' : ''}`}
            value={fmt(estimate.total.net)}
            sub={`${fmt(estimate.total.gross)} − ${estimate.commissionPercent}% commission (${fmt(estimate.total.commissionAmount)})`}
          />
        </>
      ) : (
        <>
          <Row
            title="Finish within 1 hour"
            value={fmt(estimate.withinOneHour.net)}
            sub={`${fmt(estimate.baseCharge)} base charge − ${estimate.commissionPercent}% commission (${fmt(estimate.withinOneHour.commissionAmount)})`}
          />
          <Row
            title="Each extra hour"
            value={`+ ${fmt(estimate.extraHour.net)}`}
            sub={`${fmt(estimate.perHourCharge)} per hour − ${estimate.commissionPercent}% commission (${fmt(estimate.extraHour.commissionAmount)})`}
          />
          {Array.isArray(estimate.examples) && estimate.examples.length > 0 && (
            <>
              <View style={styles.divider} />
              <View style={styles.examplesRow}>
                <Text style={styles.examplesLabel}>For example</Text>
                <Text style={styles.examplesText}>
                  {estimate.examples.map((ex) => `${ex.hours} hrs → ${fmt(ex.net)}`).join('   ·   ')}
                </Text>
              </View>
            </>
          )}
        </>
      )}

      {!!estimate && (
        <Text style={styles.note}>
          Final amount is calculated from actual working time.
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  section:      { marginHorizontal: 20, marginBottom: 16, backgroundColor: colors.surface, borderRadius: 18, borderWidth: 1, borderColor: colors.border, padding: 16 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 },
  row:          { marginBottom: 12 },
  rowTop:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowTitle:     { flex: 1, fontSize: 14, fontWeight: '600', color: colors.textPrimary, paddingRight: 8 },
  rowValue:     { fontSize: 16, fontWeight: '800', color: colors.statusGreen },
  rowSub:       { fontSize: 11, color: colors.textMuted, marginTop: 3, lineHeight: 15 },
  divider:      { height: 1, backgroundColor: colors.borderLight, marginBottom: 12 },
  examplesRow:  { backgroundColor: colors.surfaceElevated, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: colors.border },
  examplesLabel:{ fontSize: 11, fontWeight: '600', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 4 },
  examplesText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, lineHeight: 19 },
  note:         { fontSize: 11, color: colors.textMuted, marginTop: 12, lineHeight: 16 },
  stateBox:     { alignItems: 'center', justifyContent: 'center', paddingVertical: 16 },
  stateText:    { fontSize: 13, color: colors.textSecondary, marginTop: 8 },
  errorDetail:  { fontSize: 11, color: colors.danger, textAlign: 'center', marginTop: 6, lineHeight: 16 },
  retryBtn:     { marginTop: 10, paddingHorizontal: 16, paddingVertical: 7, borderRadius: 8, backgroundColor: colors.accentAmberSoft },
  retryText:    { fontSize: 13, fontWeight: '700', color: colors.accentAmber },
});

export default EarningEstimateCard;
