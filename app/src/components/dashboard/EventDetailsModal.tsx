import { SymbolView } from 'expo-symbols';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/dashboard/Avatar';
import { DashboardColors, useDashboardTheme } from '@/components/dashboard/theme';
import { DebtEvent, Member } from '@/types/debt';
import { formatEuro, getEventAccent } from '@/utils/debt';

type EventDetailsModalProps = {
  event: DebtEvent | null;
  members: Member[];
  visible: boolean;
  onClose: () => void;
  onEdit: (event: DebtEvent) => void;
  onDelete: (eventId: string) => void | Promise<void>;
  onSelectMember?: (memberId: string) => void;
};

export function EventDetailsModal({
  event,
  members,
  visible,
  onClose,
  onEdit,
  onDelete,
  onSelectMember,
}: EventDetailsModalProps) {
  const colors = useDashboardTheme();
  const styles = createStyles(colors);
  if (!event) {
    return null;
  }

  const currentEvent = event;
  const accent = getEventAccent(event.type);

  function handleDelete() {
    Alert.alert('Event löschen?', 'Das Event wird nur lokal aus den Mock-Daten entfernt.', [
      { text: 'Abbrechen', style: 'cancel' },
      {
        text: 'Löschen',
        style: 'destructive',
        onPress: async () => {
          try {
            await onDelete(currentEvent.id);
          } catch {
            Alert.alert('Löschen fehlgeschlagen', 'Die API konnte das Event nicht löschen. Bitte versuche es erneut.');
          }
        },
      },
    ]);
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable style={({ pressed }) => [styles.roundButton, pressed && styles.pressed]} onPress={onClose}>
            <SymbolView name={{ ios: 'xmark', android: 'close', web: 'close' }} size={17} tintColor={colors.text} />
          </Pressable>
          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>{getTypeLabel(event.type)}</Text>
            <Text style={styles.title}>{event.title}</Text>
          </View>
          <Pressable style={({ pressed }) => [styles.editButton, pressed && styles.pressed]} onPress={() => onEdit(event)}>
            <Text style={styles.editText}>Bearbeiten</Text>
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <View style={styles.heroCard}>
            <View style={[styles.iconCircle, { backgroundColor: `${accent}14` }]}>
              <SymbolView name={getIconName(event.type)} size={28} tintColor={accent} />
            </View>
            <Text style={styles.heroTitle}>{event.title}</Text>
            <Text style={styles.heroDescription}>{event.description ?? 'Keine Beschreibung'}</Text>
            <Text style={styles.date}>{formatDate(event.createdAt)}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ledger</Text>
            {event.lines.map((line) => {
              const member = members.find((item) => item.id === line.memberId);
              return (
                <Pressable
                  key={line.memberId}
                  style={({ pressed }) => [styles.lineRow, pressed && styles.pressed]}
                  onPress={() => onSelectMember?.(line.memberId)}>
                  <Avatar initials={member?.initials ?? '?'} avatarUrl={member?.avatarUrl} size={42} />
                  <View style={styles.lineText}>
                    <Text style={styles.memberName}>{member?.name ?? 'Unbekannt'}</Text>
                    <Text style={styles.memberMeta}>{line.amountCents >= 0 ? 'bekommt Geld' : 'schuldet Geld'}</Text>
                  </View>
                  <Text style={[styles.lineAmount, line.amountCents >= 0 ? styles.positive : styles.negative]}>
                    {formatEuro(line.amountCents, { signed: true })}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Pressable style={({ pressed }) => [styles.deleteButton, pressed && styles.pressed]} onPress={handleDelete}>
            <SymbolView name={{ ios: 'trash.fill', android: 'delete', web: 'delete' }} size={18} tintColor={colors.negative} />
            <Text style={styles.deleteText}>Event löschen</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function getTypeLabel(type: DebtEvent['type']) {
  switch (type) {
    case 'direct':
      return 'Direkte Schuld';
    case 'split':
      return 'Split-Ausgabe';
    case 'single':
      return 'Einzel-Ausgabe';
    case 'game':
      return 'Game';
    case 'payment':
      return 'Zahlung';
  }
}

function getIconName(type: DebtEvent['type']) {
  switch (type) {
    case 'direct':
      return { ios: 'arrow.left.arrow.right', android: 'swap_horiz', web: 'swap_horiz' } as const;
    case 'split':
      return { ios: 'shuffle', android: 'call_split', web: 'call_split' } as const;
    case 'single':
      return { ios: 'person.fill', android: 'person', web: 'person' } as const;
    case 'game':
      return { ios: 'suit.club.fill', android: 'casino', web: 'casino' } as const;
    case 'payment':
      return { ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check_circle' } as const;
  }
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: 'long',
    year: 'numeric',
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
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  roundButton: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 999,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  headerText: {
    flex: 1,
  },
  eyebrow: {
    color: colors.textSubtle,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
  },
  editButton: {
    backgroundColor: colors.button,
    borderRadius: 999,
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 15,
  },
  editText: {
    color: colors.buttonText,
    fontSize: 14,
    fontWeight: '900',
  },
  content: {
    gap: 16,
    padding: 20,
    paddingBottom: 34,
  },
  heroCard: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 30,
    padding: 24,
  },
  iconCircle: {
    alignItems: 'center',
    borderRadius: 24,
    height: 60,
    justifyContent: 'center',
    width: 60,
  },
  heroTitle: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '900',
    marginTop: 14,
    textAlign: 'center',
  },
  heroDescription: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 21,
    marginTop: 6,
    textAlign: 'center',
  },
  date: {
    color: colors.textSubtle,
    fontSize: 13,
    fontWeight: '800',
    marginTop: 14,
  },
  section: {
    backgroundColor: colors.card,
    borderRadius: 26,
    gap: 12,
    padding: 18,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 19,
    fontWeight: '900',
  },
  lineRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  lineText: {
    flex: 1,
  },
  memberName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
  },
  memberMeta: {
    color: colors.textSubtle,
    fontSize: 12,
    fontWeight: '800',
    marginTop: 2,
  },
  lineAmount: {
    fontSize: 16,
    fontWeight: '900',
  },
  positive: {
    color: colors.positive,
  },
  negative: {
    color: colors.negative,
  },
  deleteButton: {
    alignItems: 'center',
    backgroundColor: `${colors.negative}18`,
    borderRadius: 22,
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
    minHeight: 56,
  },
  deleteText: {
    color: colors.negative,
    fontSize: 16,
    fontWeight: '900',
  },
  pressed: {
    opacity: 0.72,
  },
  });
}
