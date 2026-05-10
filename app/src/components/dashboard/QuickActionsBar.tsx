import { ScrollView, StyleSheet } from 'react-native';

import { EventModalType } from '@/components/dashboard/EventModal';
import { QuickActionButton } from '@/components/dashboard/QuickActionButton';

type QuickActionsBarProps = {
  onCreateEvent: (type: EventModalType) => void;
  onCreatePayment: () => void;
};

export function QuickActionsBar({ onCreateEvent, onCreatePayment }: QuickActionsBarProps) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickActions} style={styles.scroll}>
      <QuickActionButton label="Erstellen" icon={{ ios: 'plus', android: 'add', web: 'add' }} onPress={() => onCreateEvent('direct')} />
      <QuickActionButton label="Split" icon={{ ios: 'shuffle', android: 'call_split', web: 'call_split' }} onPress={() => onCreateEvent('split')} />
      <QuickActionButton label="Einzeln" icon={{ ios: 'person.fill', android: 'person', web: 'person' }} onPress={() => onCreateEvent('single')} />
      <QuickActionButton label="Games" icon={{ ios: 'suit.club.fill', android: 'casino', web: 'casino' }} onPress={() => onCreateEvent('game')} />
      <QuickActionButton label="Bezahlt" icon={{ ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check_circle' }} onPress={onCreatePayment} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    marginTop: 2,
  },
  quickActions: {
    gap: 18,
    paddingHorizontal: 22,
    paddingVertical: 4,
  },
});
