import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DashboardColors, useDashboardTheme } from '@/components/dashboard/theme';
import { EMPTY_GROUP_STATS, GroupStats, MemberStat } from '@/types/debt';
import { formatEuro } from '@/utils/debt';

type GroupStatsCardProps = {
  stats?: GroupStats | null;
  onOpenGameHistory: () => void;
};

export function GroupStatsCard({ stats, onOpenGameHistory }: GroupStatsCardProps) {
  const colors = useDashboardTheme();
  const styles = createStyles(colors);
  const safeStats = stats ?? EMPTY_GROUP_STATS;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>Statistiken</Text>
        </View>
        <Pressable style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]} onPress={onOpenGameHistory}>
          <Text style={styles.actionText}>Games</Text>
        </Pressable>
      </View>

      <View style={styles.metricGrid}>
        <StatBox label="Events" value={String(safeStats.totalEvents)} hint={`${safeStats.activeMembers} aktiv`} />
        <StatBox label="Volumen" value={formatEuro(safeStats.totalVolumeCents)} hint={`${safeStats.splitEventCount} Splits`} />
      </View>

      <View style={styles.metricGrid}>
        <StatBox label="Games" value={String(safeStats.gameEventCount)} hint={`${safeStats.paymentEventCount} Zahlungen`} />
        <StatBox label="Saldo Tracked" value={String(safeStats.activeMembers)} hint="Mitglieder mit Historie" />
      </View>

      <View style={styles.leaderboard}>
        <MemberHighlight label="Top Glaeubiger" stat={safeStats.biggestCreditor} emptyText="Noch niemand im Plus" positive />
        <MemberHighlight label="Top Schuldner" stat={safeStats.biggestDebtor} emptyText="Niemand schuldet etwas" negative />
        <MemberHighlight label="Aktivstes Mitglied" stat={safeStats.mostActiveMember} emptyText="Noch keine Aktivitaet" countMode />
        <MemberHighlight label="Game Gewinner" stat={safeStats.biggestGameWinner} emptyText="Noch keine Games" positive />
        <MemberHighlight label="Game Verlierer" stat={safeStats.biggestGameLoser} emptyText="Noch keine Games" negative />
      </View>
    </View>
  );
}

function MemberHighlight({
  label,
  stat,
  emptyText,
  positive,
  negative,
  countMode,
}: {
  label: string;
  stat?: MemberStat | null;
  emptyText: string;
  positive?: boolean;
  negative?: boolean;
  countMode?: boolean;
}) {
  const colors = useDashboardTheme();
  const styles = createStyles(colors);
  const toneStyle = positive ? styles.positive : negative ? styles.negative : styles.neutral;

  return (
    <View style={styles.memberRow}>
      <Text style={styles.memberLabel}>{label}</Text>
      {stat ? (
        <View style={styles.memberContent}>
          <Text style={styles.memberName}>{stat.member.name}</Text>
          <Text style={[styles.memberValue, toneStyle]}>
            {countMode ? `${stat.eventCount} Events` : formatEuro(stat.amountCents, { signed: positive })}
          </Text>
        </View>
      ) : (
        <Text style={styles.memberEmpty}>{emptyText}</Text>
      )}
    </View>
  );
}

function StatBox({ label, value, hint }: { label: string; value: string; hint: string }) {
  const colors = useDashboardTheme();
  const styles = createStyles(colors);

  return (
    <View style={styles.statBox}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statHint}>{hint}</Text>
    </View>
  );
}

function createStyles(colors: DashboardColors) {
  return StyleSheet.create({
    card: {
      gap: 18,
      marginHorizontal: 20,
    },
    header: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 12,
      justifyContent: 'space-between',
    },
    headerText: {
      flex: 1,
      gap: 2,
    },
    title: {
      color: colors.text,
      fontSize: 22,
      fontWeight: '900',
      letterSpacing: -0.5,
    },
    subtitle: {
      color: colors.textMuted,
      fontSize: 13,
      fontWeight: '700',
      lineHeight: 18,
    },
    actionButton: {
      backgroundColor: colors.card,
      borderRadius: 999,
      minHeight: 38,
      justifyContent: 'center',
      paddingHorizontal: 14,
    },
    actionText: {
      color: colors.text,
      fontSize: 13,
      fontWeight: '900',
    },
    metricGrid: {
      flexDirection: 'row',
      gap: 12,
    },
    statBox: {
      backgroundColor: colors.card,
      borderRadius: 22,
      flex: 1,
      gap: 4,
      padding: 16,
    },
    statLabel: {
      color: colors.textSubtle,
      fontSize: 12,
      fontWeight: '800',
      textTransform: 'uppercase',
    },
    statValue: {
      color: colors.text,
      fontSize: 24,
      fontWeight: '900',
      letterSpacing: -0.6,
    },
    statHint: {
      color: colors.textMuted,
      fontSize: 12,
      fontWeight: '700',
    },
    leaderboard: {
      gap: 12,
    },
    memberRow: {
      backgroundColor: colors.card,
      borderRadius: 22,
      gap: 8,
      padding: 16,
    },
    memberLabel: {
      color: colors.textSubtle,
      fontSize: 12,
      fontWeight: '800',
      textTransform: 'uppercase',
    },
    memberContent: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 12,
      justifyContent: 'space-between',
    },
    memberName: {
      color: colors.text,
      flex: 1,
      fontSize: 16,
      fontWeight: '900',
    },
    memberValue: {
      fontSize: 15,
      fontWeight: '900',
    },
    memberEmpty: {
      color: colors.textMuted,
      fontSize: 14,
      fontWeight: '700',
    },
    positive: {
      color: colors.positive,
    },
    negative: {
      color: colors.negative,
    },
    neutral: {
      color: colors.text,
    },
    pressed: {
      opacity: 0.72,
    },
  });
}
