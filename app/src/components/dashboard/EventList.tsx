import { StyleSheet, Text, View } from 'react-native';

import { EventCard } from '@/components/dashboard/EventCard';
import { DashboardColors, useDashboardTheme } from '@/components/dashboard/theme';
import { DebtEvent } from '@/types/debt';

type EventListProps = {
  events: DebtEvent[];
  currentUserId: string;
  onSelectEvent: (event: DebtEvent) => void;
};

export function EventList({ events, currentUserId, onSelectEvent }: EventListProps) {
  const colors = useDashboardTheme();
  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Events</Text>
      <View style={styles.list}>
        {events.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Noch keine Events</Text>
            <Text style={styles.emptyText}>Lege oben die erste Schuld, einen Split oder eine Poker-Runde an.</Text>
          </View>
        ) : (
          events.map((event) => (
            <EventCard key={event.id} event={event} currentUserId={currentUserId} onPress={onSelectEvent} />
          ))
        )}
      </View>
    </View>
  );
}

function createStyles(colors: DashboardColors) {
  return StyleSheet.create({
    container: {
      gap: 14,
      marginHorizontal: 20,
    },
    title: {
      color: colors.text,
      fontSize: 24,
      fontWeight: '900',
      letterSpacing: -0.4,
    },
    list: {
      gap: 12,
    },
    emptyCard: {
      backgroundColor: colors.card,
      borderRadius: 24,
      padding: 20,
    },
    emptyTitle: {
      color: colors.text,
      fontSize: 17,
      fontWeight: '900',
    },
    emptyText: {
      color: colors.textMuted,
      fontSize: 14,
      fontWeight: '700',
      lineHeight: 20,
      marginTop: 4,
    },
  });
}
