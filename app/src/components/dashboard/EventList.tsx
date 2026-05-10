import { StyleSheet, Text, View } from 'react-native';

import { EventCard } from '@/components/dashboard/EventCard';
import { DebtEvent } from '@/types/debt';

type EventListProps = {
  events: DebtEvent[];
  currentUserId: string;
  onSelectEvent: (event: DebtEvent) => void;
};

export function EventList({ events, currentUserId, onSelectEvent }: EventListProps) {
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

const styles = StyleSheet.create({
  container: {
    gap: 14,
    marginHorizontal: 20,
  },
  title: {
    color: '#101828',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  list: {
    gap: 12,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
  },
  emptyTitle: {
    color: '#111827',
    fontSize: 17,
    fontWeight: '900',
  },
  emptyText: {
    color: '#667085',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
    marginTop: 4,
  },
});
