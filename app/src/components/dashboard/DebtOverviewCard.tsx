import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';

import { Avatar } from '@/components/dashboard/Avatar';
import { DashboardColors, useDashboardTheme } from '@/components/dashboard/theme';
import { SettlementRow, SettlementTransfer } from '@/types/debt';
import { formatEuro } from '@/utils/debt';

type DebtOverviewCardProps = {
  owedByMe: SettlementRow[];
  owedToMe: SettlementRow[];
  optimizedTransfers?: SettlementTransfer[];
  onCreatePayment?: (memberId: string, amountCents: number) => void;
  onSelectMember?: (memberId: string) => void;
};

export function DebtOverviewCard({
  owedByMe,
  owedToMe,
  optimizedTransfers = [],
  onCreatePayment,
  onSelectMember,
}: DebtOverviewCardProps) {
  const colors = useDashboardTheme();
  const styles = createStyles(colors);
  const [selectedTransfer, setSelectedTransfer] = useState<SettlementTransfer | null>(null);

  return (
    <>
      <View style={styles.card}>
        <DebtSection
          title="Du schuldest"
          rows={owedByMe}
          tone="negative"
          emptyText="Gerade nichts offen."
          onCreatePayment={onCreatePayment}
          onSelectMember={onSelectMember}
          styles={styles}
          colors={colors}
        />
        <View style={styles.separator} />
        <DebtSection
          title="Du bekommst"
          rows={owedToMe}
          tone="positive"
          emptyText="Noch keine Forderungen."
          onSelectMember={onSelectMember}
          styles={styles}
          colors={colors}
        />
        <View style={styles.separator} />
        <OptimizedTransfers
          transfers={optimizedTransfers}
          onSelectTransfer={setSelectedTransfer}
          styles={styles}
          colors={colors}
        />
      </View>
      <TransferExplanationModal
        transfer={selectedTransfer}
        visible={Boolean(selectedTransfer)}
        onClose={() => setSelectedTransfer(null)}
        styles={styles}
        colors={colors}
      />
    </>
  );
}

function OptimizedTransfers({
  transfers,
  onSelectTransfer,
  styles,
  colors,
}: {
  transfers: SettlementTransfer[];
  onSelectTransfer: (transfer: SettlementTransfer) => void;
  styles: ReturnType<typeof createStyles>;
  colors: DashboardColors;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.title}>Optimierte Überweisungen</Text>
      {transfers.length === 0 ? (
        <Text style={styles.empty}>Alles ist ausgeglichen.</Text>
      ) : (
        transfers.map((transfer) => (
          <Pressable
            key={`${transfer.from.id}-${transfer.to.id}-${transfer.amountCents}`}
            style={({ pressed }) => [styles.transferRow, pressed && styles.pressed]}
            onPress={() => onSelectTransfer(transfer)}>
            <View style={styles.optimizedRowAvatars}>
              <View style={styles.transferPerson}>
                <Avatar initials={transfer.from.initials} avatarUrl={transfer.from.avatarUrl} size={34} backgroundColor={`${colors.negative}22`} color={colors.negative} />
              </View>
              <Text style={styles.transferArrow}>→</Text>
              <View style={styles.transferPerson}>
                <Avatar initials={transfer.to.initials} avatarUrl={transfer.to.avatarUrl} size={34} backgroundColor={`${colors.positive}22`} color={colors.positive} />
              </View>
            </View>

            <Text style={styles.amount}>{formatEuro(transfer.amountCents)}</Text>
          </Pressable>
        ))
      )}
    </View>
  );
}

function TransferExplanationModal({
  transfer,
  visible,
  onClose,
  styles,
  colors,
}: {
  transfer: SettlementTransfer | null;
  visible: boolean;
  onClose: () => void;
  styles: ReturnType<typeof createStyles>;
  colors: DashboardColors;
}) {
  if (!transfer) {
    return null;
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.modalSafeArea} edges={['top', 'bottom']}>
        <View style={styles.modalHeader}>
          <View>
            <Text style={styles.modalTitle}>
              Optimierung erklärt
            </Text>
          </View>
          <Pressable style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]} onPress={onClose}>
            <Text style={styles.closeText}>Schließen</Text>
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.modalContent} showsVerticalScrollIndicator={false}>
          <View style={styles.explanationHero}>
            <Text style={styles.explanationAmount}>{formatEuro(transfer.amountCents)}</Text>
            <Text style={styles.explanationText}>
              {transfer.from.name} hat insgesamt {formatEuro(Math.abs(transfer.fromBalanceCents))} Schulden in der Gruppe.
              {transfer.to.name} bekommt insgesamt {formatEuro(transfer.toBalanceCents)}. Deshalb wird die Zahlung direkt verbunden.
            </Text>
          </View>

          <View style={styles.formulaCard}>
            <Text style={styles.formulaTitle}>Berechnung</Text>
            <Text style={styles.formulaLine}>Zahler-Saldo: {formatSignedEuro(transfer.fromBalanceCents)}</Text>
            <Text style={styles.formulaLine}>Empfänger-Saldo: {formatSignedEuro(transfer.toBalanceCents)}</Text>
            <Text style={styles.formulaResult}>
              Überweisung = min({formatEuro(Math.abs(transfer.fromBalanceCents))}, {formatEuro(transfer.toBalanceCents)}) ={' '}
              {formatEuro(transfer.amountCents)}
            </Text>
          </View>

          <View style={styles.formulaCard}>
            <Text style={styles.formulaTitle}>Aus diesen Events</Text>
            {transfer.explanationLines.map((line) => (
              <View key={`${line.eventId}-${line.member.id}-${line.amountCents}`} style={styles.explanationRow}>
                <Avatar initials={line.member.initials} avatarUrl={line.member.avatarUrl} size={34} />
                <View style={styles.explanationRowText}>
                  <Text style={styles.explanationEvent}>{line.eventTitle}</Text>
                  <Text style={styles.explanationMember}>{line.member.name}</Text>
                </View>
                <Text style={[styles.explanationLineAmount, line.amountCents >= 0 ? styles.positive : styles.negative]}>
                  {formatSignedEuro(line.amountCents)}
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function formatSignedEuro(amountCents: number) {
  const prefix = amountCents > 0 ? '+' : amountCents < 0 ? '-' : '';
  return `${prefix}${formatEuro(Math.abs(amountCents))}`;
}

function DebtSection({
  title,
  rows,
  tone,
  emptyText,
  onSelectMember,
  onCreatePayment,
  styles,
  colors,
}: {
  title: string;
  rows: SettlementRow[];
  tone: 'negative' | 'positive';
  emptyText: string;
  onSelectMember?: (memberId: string) => void;
  onCreatePayment?: (memberId: string, amountCents: number) => void;
  styles: ReturnType<typeof createStyles>;
  colors: DashboardColors;
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
                avatarUrl={row.member.avatarUrl}
                size={42}
              backgroundColor={tone === 'positive' ? `${colors.positive}22` : `${colors.negative}22`}
              color={tone === 'positive' ? colors.positive : colors.negative}
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

function createStyles(colors: DashboardColors) {
  return StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 28,
    marginHorizontal: 20,
    padding: 20,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.06,
    shadowRadius: 22,
  },
  section: {
    gap: 13,
  },
  title: {
    color: colors.text,
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
  transferRow: {
    alignItems: 'center',
    borderRadius: 18,
    justifyContent: 'space-between',
    flexDirection: 'row',
    gap: 8,
    minHeight: 48,
    paddingVertical: 4,
  },
  transferPerson: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 7,
    minWidth: 0,
  },
  transferName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
    maxWidth: 76,
  },
  transferArrow: {
    color: colors.textMuted,
    fontSize: 16,
    fontWeight: '900',
  },
  name: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  subline: {
    color: colors.textSubtle,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  amount: {
    fontSize: 17,
    fontWeight: '900',
  },
  payButton: {
    backgroundColor: colors.button,
    borderRadius: 999,
    minHeight: 34,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  payButtonText: {
    color: colors.buttonText,
    fontSize: 12,
    fontWeight: '900',
  },
  positive: {
    color: colors.positive,
  },
  negative: {
    color: colors.negative,
  },
  empty: {
    color: colors.textSubtle,
    fontSize: 14,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.72,
  },
  separator: {
    backgroundColor: colors.border,
    height: 1,
    marginVertical: 18,
  },
  modalSafeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
  modalHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 14,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  modalEyebrow: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  modalTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  closeButton: {
    backgroundColor: colors.card,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  closeText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '900',
  },
  modalContent: {
    gap: 14,
    padding: 20,
    paddingBottom: 36,
  },
  explanationHero: {
    backgroundColor: colors.card,
    borderRadius: 30,
    padding: 22,
  },
  explanationAmount: {
    color: colors.positive,
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: -1.2,
  },
  explanationText: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 22,
    marginTop: 10,
  },
  formulaCard: {
    backgroundColor: colors.card,
    borderRadius: 26,
    gap: 10,
    padding: 18,
  },
  formulaTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  formulaLine: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: '800',
  },
  formulaResult: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '900',
    lineHeight: 22,
  },
  explanationRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    minHeight: 48,
  },
  explanationRowText: {
    flex: 1,
  },
  explanationEvent: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '900',
  },
  explanationMember: {
    color: colors.textSubtle,
    fontSize: 12,
    fontWeight: '800',
    marginTop: 2,
  },
  explanationLineAmount: {
    fontSize: 15,
    fontWeight: '900',
  },
  optimizedRowAvatars: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center'
  }
  });
}
