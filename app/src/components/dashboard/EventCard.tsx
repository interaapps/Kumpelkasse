import { SymbolView, SymbolViewProps } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/dashboard/Avatar';
import { DashboardColors, useDashboardTheme } from '@/components/dashboard/theme';
import { DebtEvent, Member } from '@/types/debt';
import { formatEuro, getEventAccent, getEventAmountForMember, getEventTotal } from '@/utils/debt';

type EventCardProps = {
  event: DebtEvent;
  members: Member[];
  currentUserId: string;
  onPress: (event: DebtEvent) => void;
};

const MAX_VISIBLE_PARTICIPANTS = 3;

export function EventCard({ event, members, currentUserId, onPress }: EventCardProps) {
  const colors = useDashboardTheme();
  const styles = createStyles(colors);
  const memberAmount = getEventAmountForMember(event, currentUserId);
  const displayAmount = memberAmount === 0 ? getEventTotal(event) : memberAmount;
  const amountTone = memberAmount > 0 ? styles.positive : memberAmount < 0 ? styles.negative : styles.neutral;
  const accent = getEventAccent(event.type);
  const involvedMembers = event.lines
    .map((line) => members.find((member) => member.id === line.memberId))
    .filter((member): member is Member => Boolean(member));
  const visibleMembers = involvedMembers.slice(0, MAX_VISIBLE_PARTICIPANTS);
  const remainingCount = involvedMembers.length - visibleMembers.length;

  return (
    <Pressable style={({ pressed }) => [styles.card, pressed && styles.pressed]} onPress={() => onPress(event)}>
      <View style={styles.iconWrap}>
        <View style={[styles.iconCircle, { backgroundColor: `${accent}24` }]}>
          <SymbolView name={getIconName(event.type)} size={22} tintColor={accent} />
        </View>
        {involvedMembers.length > 0 ? (
          <View style={styles.iconParticipantsCluster}>
            {visibleMembers.map((member, index) => (
              <View key={member.id} style={[styles.iconParticipantAvatar, index > 0 && styles.iconParticipantOverlap]}>
                <Avatar initials={member.initials} avatarUrl={member.avatarUrl} size={18} />
              </View>
            ))}
            {remainingCount > 0 ? (
              <View style={[styles.iconMoreBadge, visibleMembers.length > 0 && styles.iconParticipantOverlap]}>
                <Text style={styles.iconMoreBadgeText}>+{remainingCount}</Text>
              </View>
            ) : null}
          </View>
        ) : null}
      </View>
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>
            {event.title}
          </Text>
          <Text style={[styles.amount, amountTone]}>{formatEuro(displayAmount, { signed: memberAmount !== 0 })}</Text>
        </View>
        <Text style={styles.date}>{formatDate(event.createdAt)}</Text>
        {!!event.description && (
          <Text style={styles.description} numberOfLines={2}>
            {event.description}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

function getIconName(type: DebtEvent['type']): SymbolViewProps['name'] {
  switch (type) {
    case 'direct':
      return { ios: 'arrow.left.arrow.right', android: 'swap_horiz', web: 'swap_horiz' };
    case 'split':
      return { ios: 'shuffle', android: 'call_split', web: 'call_split' };
    case 'single':
      return { ios: 'person.fill', android: 'person', web: 'person' };
    case 'game':
      return { ios: 'suit.club.fill', android: 'casino', web: 'casino' };
    case 'payment':
      return { ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check_circle' };
    case 'optimized_payment':
      return { ios: 'arrow.trianglehead.branch', android: 'alt_route', web: 'alt_route' };
  }
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
    card: {
      alignItems: 'flex-start',
      backgroundColor: colors.card,
      borderRadius: 24,
      flexDirection: 'row',
      gap: 14,
      padding: 16,
    },
    iconCircle: {
      alignItems: 'center',
      borderRadius: 18,
      height: 48,
      justifyContent: 'center',
      width: 48,
    },
    iconWrap: {
      alignItems: 'flex-start',
      justifyContent: 'flex-start',
      position: 'relative',
      width: 48,
    },
    iconParticipantsCluster: {
      alignItems: 'center',
      flexDirection: 'row',
      left: -4,
      position: 'absolute',
      bottom: -4,
    },
    iconParticipantAvatar: {
      borderColor: colors.card,
      borderRadius: 999,
      borderWidth: 1.5,
      overflow: 'hidden',
    },
    iconParticipantOverlap: {
      marginLeft: -6,
    },
    iconMoreBadge: {
      alignItems: 'center',
      backgroundColor: colors.cardMuted,
      borderColor: colors.card,
      borderRadius: 999,
      borderWidth: 1.5,
      height: 18,
      justifyContent: 'center',
      minWidth: 18,
      paddingHorizontal: 4,
    },
    iconMoreBadgeText: {
      color: colors.textMuted,
      fontSize: 8,
      fontWeight: '900',
    },
    content: {
      flex: 1,
      gap: 4,
    },
    titleRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 10,
    },
    title: {
      color: colors.text,
      flex: 1,
      fontSize: 17,
      fontWeight: '900',
    },
    amount: {
      fontSize: 16,
      fontWeight: '900',
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
    date: {
      color: colors.textSubtle,
      fontSize: 12,
      fontWeight: '800',
    },
    description: {
      color: colors.textMuted,
      fontSize: 14,
      fontWeight: '700',
      lineHeight: 20,
      marginTop: 2,
    },
    pressed: {
      opacity: 0.72,
      transform: [{ scale: 0.99 }],
    },
  });
}
