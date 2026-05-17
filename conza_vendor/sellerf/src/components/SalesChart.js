import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { colors } from '../theme/colors';

const { width } = Dimensions.get('window');
const FILTERS = ['day', 'week', 'month'];

const LABELS = {
  day:   ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  week:  ['W1',  'W2',  'W3',  'W4',  'W5',  'W6',  'W7' ],
  month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul' ],
};

const SalesChart = ({ chartData }) => {
  const [filter, setFilter] = useState('week');

  const data = {
    labels:   LABELS[filter],
    datasets: [{ data: chartData[filter] || [0, 0, 0, 0, 0, 0, 0] }],
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Sales Overview</Text>
        <View style={styles.filters}>
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterBtn, filter === f && styles.filterActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <LineChart
        data={data}
        width={width - 40}
        height={180}
        yAxisPrefix="₹"
        yAxisSuffix="K"
        chartConfig={{
          backgroundColor:      colors.surface,
          backgroundGradientFrom: colors.surface,
          backgroundGradientTo:   colors.surface,
          decimalPlaces:          0,
          color: (opacity = 1) => `rgba(240, 165, 0, ${opacity})`,
          labelColor: ()        => colors.textMuted,
          strokeWidth:            2,
          propsForDots: {
            r: '4', strokeWidth: '2', stroke: colors.gradientEnd,
          },
        }}
        bezier
        style={styles.chart}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius:    18,
    padding:         16,
    marginHorizontal: 20,
    marginBottom:    20,
    elevation:        2,
    shadowColor:      colors.cardShadow,
    shadowOffset:     { width: 0, height: 2 },
    shadowOpacity:    0.08,
    shadowRadius:     8,
  },
  header:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title:           { fontSize: 15, fontWeight: '800', color: colors.textPrimary },
  filters:         { flexDirection: 'row', gap: 4 },
  filterBtn: {
    paddingHorizontal: 10,
    paddingVertical:    5,
    borderRadius:      10,
    backgroundColor:   colors.surfaceElevated,
  },
  filterActive:     { backgroundColor: colors.accentAmberSoft },
  filterText:       { fontSize: 11, fontWeight: '600', color: colors.textMuted },
  filterTextActive: { color: colors.accentAmber, fontWeight: '800' },
  chart:            { borderRadius: 12, marginLeft: -10 },
});

export default SalesChart;