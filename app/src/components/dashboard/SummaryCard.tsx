import { StyleSheet, Text, View } from 'react-native';

import { DashboardColors, useDashboardTheme } from '@/components/dashboard/theme';
import { formatEuro } from '@/utils/debt';

type SummaryCardProps = {
  netCents: number;
  owedByMeCents: number;
  owedToMeCents: number;
};

export function SummaryCard({ netCents, owedByMeCents, owedToMeCents }: SummaryCardProps) {
  const colors = useDashboardTheme();
  const styles = createStyles(colors);
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

function createStyles(colors: DashboardColors) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      borderRadius: 32,
      marginHorizontal: 20,
      padding: 26,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 18 },
      shadowOpacity: 0.08,
      shadowRadius: 28,
    },
    label: {
      color: colors.textMuted,
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
      color: colors.positive,
    },
    negative: {
      color: colors.negative,
    },
    divider: {
      backgroundColor: colors.border,
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
      color: colors.textSubtle,
      fontSize: 13,
      fontWeight: '800',
    },
    metricValue: {
      fontSize: 22,
      fontWeight: '900',
    },
    verticalDivider: {
      backgroundColor: colors.border,
      height: 38,
      width: 1,
    },
  });
}
