import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/dashboard/Avatar';
import { SettlementRow } from '@/types/debt';
import { formatEuro } from '@/utils/debt';

type DebtOverviewCardProps = {
  owedByMe: SettlementRow[];
  owedToMe: SettlementRow[];
  onCreatePayment?: (memberId: string, amountCents: number) => void;
  onSelectMember?: (memberId: string) => void;
};

export function DebtOverviewCard({
  owedByMe,
  owedToMe,
  onCreatePayment,
  onSelectMember,
}: DebtOverviewCardProps) {
  return (
    <View style={styles.card}>
      <DebtSection
        title="Du schuldest"
        rows={owedByMe}
        tone="negative"
        emptyText="Gerade nichts offen."
        onCreatePayment={onCreatePayment}
        onSelectMember={onSelectMember}
      />
      <View style={styles.separator} />
      <DebtSection
        title="Du bekommst"
        rows={owedToMe}
        tone="positive"
        emptyText="Noch keine Forderungen."
        onSelectMember={onSelectMember}
      />
    </View>
  );
}

function DebtSection({
  title,
  rows,
  tone,
  emptyText,
  onSelectMember,
  onCreatePayment,
}: {
  title: string;
  rows: SettlementRow[];
  tone: 'negative' | 'positive';
  emptyText: string;
  onSelectMember?: (memberId: string) => void;
  onCreatePayment?: (memberId: string, amountCents: number) => void;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.title}>{title}</Text>
      {rows.length === 0 ? (
        <Text style={styles.empty}>{emptyText}</Text>
      ) : (
        rows.map((row) => (
          <Pressable
            key={row.member.id}
            style={({ pressed }) => [styles.row, pressed && styles.pressed]}
            onPress={() => onSelectMember?.(row.member.id)}>
            <Avatar
              initials={row.member.initials}
              size={42}
              backgroundColor={tone === 'positive' ? '#EAF8EF' : '#FFF0F0'}
              color={tone === 'positive' ? '#167A3C' : '#BC3434'}
            />
            <View style={styles.rowText}>
              <Text style={styles.name}>{row.member.name}</Text>
              <Text style={styles.subline}>aus {row.eventCount} Event{row.eventCount === 1 ? '' : 's'}</Text>
            </View>
            <Text style={[styles.amount, tone === 'positive' ? styles.positive : styles.negative]}>
              {formatEuro(row.amountCents)}
            </Text>
            {tone === 'negative' && (
              <Pressable
                style={({ pressed }) => [styles.payButton, pressed && styles.pressed]}
                onPress={(event) => {
                  event.stopPropagation();
                  onCreatePayment?.(row.member.id, row.amountCents);
                }}>
                <Text style={styles.payButtonText}>Bezahlt</Text>
              </Pressable>
            )}
          </Pressable>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    marginHorizontal: 20,
    padding: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.06,
    shadowRadius: 22,
  },
  section: {
    gap: 13,
  },
  title: {
    color: '#101828',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    minHeight: 50,
  },
  rowText: {
    flex: 1,
  },
  name: {
    color: '#1F2937',
    fontSize: 16,
    fontWeight: '800',
  },
  subline: {
    color: '#98A2B3',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  amount: {
    fontSize: 17,
    fontWeight: '900',
  },
  payButton: {
    backgroundColor: '#18251E',
    borderRadius: 999,
    minHeight: 34,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  payButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  positive: {
    color: '#159447',
  },
  negative: {
    color: '#D64545',
  },
  empty: {
    color: '#98A2B3',
    fontSize: 14,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.72,
  },
  separator: {
    backgroundColor: '#EEF0F2',
    height: 1,
    marginVertical: 18,
  },
});
