import { StyleSheet, Text, View } from 'react-native';

import { formatEuro } from '@/utils/debt';

type SummaryCardProps = {
  netCents: number;
  owedByMeCents: number;
  owedToMeCents: number;
};

export function SummaryCard({ netCents, owedByMeCents, owedToMeCents }: SummaryCardProps) {
  const isPositive = netCents >= 0;

  return (
    <View style={styles.card}>
      <Text style={styles.label}>Insgesamt</Text>
      <Text style={[styles.total, isPositive ? styles.positive : styles.negative]}>
        {formatEuro(netCents, { signed: true })}
      </Text>

      <View style={styles.divider} />

      <View style={styles.row}>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Ich schulde</Text>
          <Text style={[styles.metricValue, styles.negative]}>{formatEuro(owedByMeCents)}</Text>
        </View>
        <View style={styles.verticalDivider} />
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Ich bekomme</Text>
          <Text style={[styles.metricValue, styles.positive]}>{formatEuro(owedToMeCents)}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    marginHorizontal: 20,
    padding: 26,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.08,
    shadowRadius: 28,
  },
  label: {
    color: '#667085',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  total: {
    fontSize: 58,
    fontWeight: '900',
    letterSpacing: -2,
    lineHeight: 68,
    marginTop: 4,
    textAlign: 'center',
  },
  positive: {
    color: '#159447',
  },
  negative: {
    color: '#D64545',
  },
  divider: {
    backgroundColor: '#EEF0F2',
    height: 1,
    marginVertical: 20,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  metric: {
    alignItems: 'center',
    flex: 1,
    gap: 5,
  },
  metricLabel: {
    color: '#8A93A1',
    fontSize: 13,
    fontWeight: '800',
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '900',
  },
  verticalDivider: {
    backgroundColor: '#EEF0F2',
    height: 38,
    width: 1,
  },
});
