import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { fetchGameHistory } from '@/api/debt-api';
import { DashboardColors, useDashboardTheme } from '@/components/dashboard/theme';
import { DebtEvent, GameHistory, MemberStat } from '@/types/debt';
import { formatEuro, getEventAmountForMember } from '@/utils/debt';

type GameHistoryModalProps = {
  visible: boolean;
  groupId: string;
  currentUserId: string;
  onClose: () => void;
};

export function GameHistoryModal({ visible, groupId, currentUserId, onClose }: GameHistoryModalProps) {
  const insets = useSafeAreaInsets();
  const colors = useDashboardTheme();
  const styles = createStyles(colors);
  const [history, setHistory] = useState<GameHistory | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) {
      return;
    }

    let active = true;
    setLoading(true);
    setError(null);

    fetchGameHistory(groupId)
      .then((result) => {
        if (active) {
          setHistory(result);
        }
      })
      .catch(() => {
        if (active) {
          setError('Die Spielhistorie konnte nicht geladen werden.');
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [groupId, visible]);

  const memberLabels = useMemo(() => {
    return new Map((history?.leaderboard ?? []).map((entry) => [entry.member.id, entry.member.name]));
  }, [history?.leaderboard]);

  const series = useMemo(
    () => buildCumulativeSeries(history?.events ?? [], memberLabels),
    [history?.events, memberLabels],
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <View style={[styles.safeArea, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>Games</Text>
            <Text style={styles.title}>Spielhistorie</Text>
          </View>
          <Pressable style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]} onPress={onClose}>
            <Text style={styles.closeText}>Fertig</Text>
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          {loading ? (
            <View style={styles.centerCard}>
              <ActivityIndicator color={colors.positive} />
              <Text style={styles.centerText}>Game-Verlauf wird geladen…</Text>
            </View>
          ) : error ? (
            <View style={styles.centerCard}>
              <Text style={styles.errorTitle}>Laden fehlgeschlagen</Text>
              <Text style={styles.centerText}>{error}</Text>
            </View>
          ) : history ? (
            <>
              <LeaderboardCard leaderboard={history.leaderboard} />
              <SeriesCard series={series} />
              <View style={styles.listBlock}>
                <Text style={styles.sectionTitle}>Sessions</Text>
                {history.events.length === 0 ? (
                  <View style={styles.emptyCard}>
                    <Text style={styles.centerText}>Noch keine Game-Events vorhanden.</Text>
                  </View>
                ) : (
                  history.events.map((event) => (
                    <GameEventCard
                      key={event.id}
                      event={event}
                      currentUserId={currentUserId}
                      bankMemberName={event.bankMemberId ? memberLabels.get(event.bankMemberId) ?? event.bankMemberId : null}
                    />
                  ))
                )}
              </View>
            </>
          ) : null}
        </ScrollView>
      </View>
    </Modal>
  );
}

function LeaderboardCard({ leaderboard }: { leaderboard: MemberStat[] }) {
  const colors = useDashboardTheme();
  const styles = createStyles(colors);

  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>Leaderboard</Text>
      <View style={styles.stack}>
        {leaderboard.slice(0, 5).map((entry) => (
          <View key={entry.member.id} style={styles.row}>
            <Text style={styles.rowName}>{entry.member.name}</Text>
            <Text style={[styles.rowValue, entry.amountCents >= 0 ? styles.positive : styles.negative]}>
              {formatEuro(entry.amountCents, { signed: true })}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function SeriesCard({
  series,
}: {
  series: Array<{ memberId: string; label: string; amountCents: number }>;
}) {
  const colors = useDashboardTheme();
  const styles = createStyles(colors);
  const max = Math.max(...series.map((item) => Math.abs(item.amountCents)), 1);

  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>Verlauf</Text>
      <Text style={styles.sectionSubtitle}>Kumulierte Gewinne und Verluste ueber alle Game-Sessions.</Text>
      <View style={styles.stack}>
        {series.map((item) => (
          <View key={item.memberId} style={styles.barRow}>
            <Text style={styles.barLabel}>{item.label}</Text>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.barFill,
                  item.amountCents >= 0 ? styles.barPositive : styles.barNegative,
                  { width: `${Math.max((Math.abs(item.amountCents) / max) * 100, 6)}%` },
                ]}
              />
            </View>
            <Text style={[styles.barValue, item.amountCents >= 0 ? styles.positive : styles.negative]}>
              {formatEuro(item.amountCents, { signed: true })}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function GameEventCard({
  event,
  currentUserId,
  bankMemberName,
}: {
  event: DebtEvent;
  currentUserId: string;
  bankMemberName?: string | null;
}) {
  const colors = useDashboardTheme();
  const styles = createStyles(colors);
  const ownAmount = getEventAmountForMember(event, currentUserId);

  return (
    <View style={styles.sessionCard}>
      <View style={styles.row}>
        <View style={styles.sessionHeader}>
          <Text style={styles.sessionTitle}>{event.title}</Text>
          <Text style={styles.sessionMeta}>{formatDate(event.createdAt)}</Text>
        </View>
        <Text style={[styles.sessionAmount, ownAmount >= 0 ? styles.positive : styles.negative]}>
          {formatEuro(ownAmount, { signed: true })}
        </Text>
      </View>
      <Text style={styles.sessionDescription}>{event.description || 'Game-Session'}</Text>
      {!!bankMemberName && <Text style={styles.sessionHint}>Bank-Spiel mit {bankMemberName}</Text>}
    </View>
  );
}

function buildCumulativeSeries(events: DebtEvent[], labels: Map<string, string>) {
  const totals = new Map<string, { label: string; amountCents: number }>();
  [...events].reverse().forEach((event) => {
    event.lines.forEach((line) => {
      const current = totals.get(line.memberId) ?? { label: labels.get(line.memberId) ?? line.memberId, amountCents: 0 };
      totals.set(line.memberId, { ...current, amountCents: current.amountCents + line.amountCents });
    });
  });

  return Array.from(totals.entries())
    .map(([memberId, value]) => ({ memberId, ...value }))
    .sort((a, b) => b.amountCents - a.amountCents);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function createStyles(colors: DashboardColors) {
  return StyleSheet.create({
    safeArea: {
      backgroundColor: colors.background,
      flex: 1,
    },
    header: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingTop: 10,
      paddingBottom: 12,
    },
    eyebrow: {
      color: colors.textSubtle,
      fontSize: 12,
      fontWeight: '800',
      textTransform: 'uppercase',
    },
    title: {
      color: colors.text,
      fontSize: 30,
      fontWeight: '900',
      letterSpacing: -0.8,
    },
    closeButton: {
      backgroundColor: colors.cardMuted,
      borderRadius: 999,
      minHeight: 42,
      justifyContent: 'center',
      paddingHorizontal: 16,
    },
    closeText: {
      color: colors.text,
      fontSize: 15,
      fontWeight: '900',
    },
    content: {
      gap: 14,
      paddingHorizontal: 20,
      paddingBottom: 32,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: 28,
      gap: 14,
      padding: 20,
    },
    centerCard: {
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: 28,
      gap: 10,
      padding: 24,
    },
    centerText: {
      color: colors.textMuted,
      fontSize: 14,
      fontWeight: '700',
      textAlign: 'center',
    },
    errorTitle: {
      color: colors.negative,
      fontSize: 16,
      fontWeight: '900',
    },
    sectionTitle: {
      color: colors.text,
      fontSize: 20,
      fontWeight: '900',
    },
    sectionSubtitle: {
      color: colors.textMuted,
      fontSize: 13,
      fontWeight: '700',
      lineHeight: 18,
      marginTop: -8,
    },
    stack: {
      gap: 10,
    },
    row: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 12,
      justifyContent: 'space-between',
    },
    rowName: {
      color: colors.text,
      flex: 1,
      fontSize: 15,
      fontWeight: '900',
    },
    rowValue: {
      fontSize: 15,
      fontWeight: '900',
    },
    barRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 10,
    },
    barLabel: {
      color: colors.text,
      fontSize: 13,
      fontWeight: '800',
      width: 68,
    },
    barTrack: {
      backgroundColor: colors.cardMuted,
      borderRadius: 999,
      flex: 1,
      height: 12,
      overflow: 'hidden',
    },
    barFill: {
      borderRadius: 999,
      height: '100%',
    },
    barPositive: {
      backgroundColor: colors.positive,
    },
    barNegative: {
      backgroundColor: colors.negative,
    },
    barValue: {
      fontSize: 12,
      fontWeight: '900',
      minWidth: 74,
      textAlign: 'right',
    },
    listBlock: {
      gap: 12,
    },
    sessionCard: {
      backgroundColor: colors.card,
      borderRadius: 24,
      gap: 8,
      padding: 18,
    },
    sessionHeader: {
      flex: 1,
      gap: 4,
    },
    sessionTitle: {
      color: colors.text,
      fontSize: 17,
      fontWeight: '900',
    },
    sessionMeta: {
      color: colors.textSubtle,
      fontSize: 12,
      fontWeight: '800',
    },
    sessionAmount: {
      fontSize: 15,
      fontWeight: '900',
    },
    sessionDescription: {
      color: colors.textMuted,
      fontSize: 14,
      fontWeight: '700',
      lineHeight: 19,
    },
    sessionHint: {
      color: colors.textSubtle,
      fontSize: 12,
      fontWeight: '700',
    },
    emptyCard: {
      backgroundColor: colors.card,
      borderRadius: 24,
      padding: 20,
    },
    positive: {
      color: colors.positive,
    },
    negative: {
      color: colors.negative,
    },
    pressed: {
      opacity: 0.72,
    },
  });
}
