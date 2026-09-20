import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const fmt = (n) => `₹${Math.round(Number(n) || 0)}`;

const Row = ({ label, value }) => (
  <View style={styles.row}>
    <Text style={styles.rowLabel}>{label}</Text>
    <Text style={styles.rowValue}>{value}</Text>
  </View>
);

// One pricing section. `foundationLabel` is the first line (the base the
// admin's Labour pricing settings are applied on top of); the remaining
// lines are driven entirely by the live Finance → Pricing → Labour settings
// returned from the server, so they appear/disappear/change with the admin.
const ScenarioCard = ({ icon, title, subtitle, badge, foundationLabel, data }) => {
  const multiplier = Number(data.peakHourMultiplier) || 1;
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardIconWrap}>
          <MaterialCommunityIcons name={icon} size={18} color="#B45309" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardSubtitle}>{subtitle}</Text>
        </View>
        {!!badge && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        )}
      </View>

      <Row label={foundationLabel} value={fmt(data.baseCost)} />

      {multiplier !== 1 && (
        <Row label={`Peak hour surge (×${multiplier})`} value={`+${fmt(data.surgeAmount)}`} />
      )}

      {Number(data.minChargeAdjustment) > 0 && (
        <Row label="Minimum charge adjustment" value={`+${fmt(data.minChargeAdjustment)}`} />
      )}

      {Number(data.serviceCharge) > 0 && (
        <Row label="Service charge" value={fmt(data.serviceCharge)} />
      )}

      {Number(data.costRate) > 0 && (
        <Row label={`GST (${data.costRate}%)`} value={fmt(data.costRateAmount)} />
      )}

      {Number(data.platformCommission) > 0 && (
        <Row
          label={`Platform commission (${data.platformCommission}%)`}
          value={fmt(data.platformCommissionAmount)}
        />
      )}

      <View style={styles.totalBox}>
        <Text style={styles.totalLabel}>Estimated Total</Text>
        <Text style={styles.totalValue}>{fmt(data.total)}</Text>
      </View>
    </View>
  );
};

const LabourPriceEstimate = ({ isImmediate, estimates, loading, error, onRetry }) => {
  const workerCount = Number(estimates?.workerCount) || 1;
  const multi = workerCount > 1;
  const hasData = isImmediate
    ? !!(estimates && estimates.lessThanHour && estimates.oneHour)
    : !!(estimates && estimates.scheduled);

  if (!hasData) {
    return (
      <View style={styles.card}>
        {error ? (
          <View style={styles.stateBox}>
            <MaterialCommunityIcons name="alert-circle-outline" size={20} color="#B91C1C" />
            <Text style={styles.stateText}>Couldn't load the price estimate.</Text>
            <TouchableOpacity onPress={onRetry} activeOpacity={0.8} style={styles.retryBtn}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.stateBox}>
            <ActivityIndicator size="small" color="#F59E0B" />
            <Text style={styles.stateText}>{loading ? 'Calculating your estimate…' : 'Preparing estimate…'}</Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <View>
      {isImmediate ? (
        <>
          <ScenarioCard
            icon="timer-sand"
            title="If work takes less than 1 hour"
            subtitle="Calculated on the category base charge"
            badge="Base charge"
            foundationLabel={multi ? `Base charge (${workerCount} workers)` : 'Base charge'}
            data={estimates.lessThanHour}
          />
          <View style={{ height: 12 }} />
          <ScenarioCard
            icon="clock-outline"
            title="If work takes 1 hour"
            subtitle="Calculated on the category per-hour charge"
            badge="Per hour"
            foundationLabel={multi ? `Per hour charge (${workerCount} workers)` : 'Per hour charge'}
            data={estimates.oneHour}
          />
        </>
      ) : (
        <ScenarioCard
          icon="calendar-range"
          title={`Scheduled work (${estimates.totalDays} day${estimates.totalDays > 1 ? 's' : ''})`}
          subtitle="Calculated on the category per-day charge"
          badge="Per day"
          foundationLabel={
            multi
              ? `Labour charge (${workerCount} workers × ${estimates.totalDays} day${estimates.totalDays > 1 ? 's' : ''})`
              : `Labour charge (${estimates.totalDays} day${estimates.totalDays > 1 ? 's' : ''})`
          }
          data={estimates.scheduled}
        />
      )}

      <View style={styles.disclaimerBox}>
        <MaterialCommunityIcons name="information" size={16} color="#2563EB" style={{ marginTop: 1 }} />
        <Text style={styles.disclaimerText}>
          This is an estimated amount. You will be charged based on actual working time. Final bill will be generated after the work is completed.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  cardIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  cardSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  badge: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#B45309',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  rowLabel: {
    flex: 1,
    fontSize: 13,
    color: '#475569',
    fontWeight: '400',
    paddingRight: 8,
  },
  rowValue: {
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '500',
  },
  totalBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 2,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  totalValue: {
    fontSize: 17,
    fontWeight: '600',
    color: '#0F172A',
  },
  disclaimerBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    padding: 10,
    marginTop: 12,
    gap: 8,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 11,
    color: '#1E40AF',
    lineHeight: 16,
  },
  stateBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 22,
    gap: 8,
  },
  stateText: {
    fontSize: 13,
    color: '#475569',
  },
  retryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#FEF3C7',
  },
  retryText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#B45309',
  },
});

export default LabourPriceEstimate;
