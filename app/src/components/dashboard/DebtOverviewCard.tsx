import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/dashboard/Avatar';
import { DashboardColors, useDashboardTheme } from '@/components/dashboard/theme';
import { Member, OptimizedPaymentChain, SettlementRow, SettlementTransfer } from '@/types/debt';
import { formatEuro } from '@/utils/debt';

type DebtOverviewCardProps = {
  currentUserId: string;
  members: Member[];
  directOwedByMe: SettlementRow[];
  directOwedToMe: SettlementRow[];
  optimizedOwedByMe: SettlementRow[];
  optimizedOwedToMe: SettlementRow[];
  optimizedTransfers?: SettlementTransfer[];
  onCreateDirectPayment?: (memberId: string, amountCents: number) => void;
  onCreateOptimizedPayment?: (transfer: SettlementTransfer) => void;
  onSelectMember?: (memberId: string) => void;
};

type DebtMode = 'direct' | 'optimized';

export function DebtOverviewCard({
  currentUserId,
  members,
  directOwedByMe,
  directOwedToMe,
  optimizedOwedByMe,
  optimizedOwedToMe,
  optimizedTransfers = [],
  onCreateDirectPayment,
  onCreateOptimizedPayment,
  onSelectMember,
}: DebtOverviewCardProps) {
  const colors = useDashboardTheme();
  const styles = createStyles(colors);
  const [mode, setMode] = useState<DebtMode>('direct');
  const [selectedTransfer, setSelectedTransfer] = useState<SettlementTransfer | null>(null);
  const memberNameById = new Map(members.map((member) => [member.id, member.name]));

  const owedByMeRows = mode === 'direct' ? directOwedByMe : optimizedOwedByMe;
  const owedToMeRows = mode === 'direct' ? directOwedToMe : optimizedOwedToMe;

  return (
    <>
      <View style={styles.wrapper}>
        <View style={styles.modeHeader}>
          <Text style={styles.cardTitle}>Wer schuldet wem?</Text>
          <View style={styles.modeSwitch}>
            <ModeButton
              label="Direkt"
              selected={mode === 'direct'}
              styles={styles}
              onPress={() => setMode('direct')}
            />
            <ModeButton
              label="Optimiert"
              selected={mode === 'optimized'}
              styles={styles}
              onPress={() => setMode('optimized')}
            />
          </View>
        </View>

        <View style={styles.card}>
          <DebtSection
            title="Du schuldest"
            rows={owedByMeRows}
            tone="negative"
            emptyText="Gerade nichts offen."
            onSelectMember={onSelectMember}
            onCreatePayment={(row) => {
              if (mode === 'optimized') {
                const transfer = optimizedTransfers.find(
                  (candidate) =>
                    candidate.from.id === currentUserId &&
                    candidate.to.id === row.member.id &&
                    candidate.amountCents === row.amountCents,
                );
                if (transfer) {
                  onCreateOptimizedPayment?.(transfer);
                }
                return;
              }

              onCreateDirectPayment?.(row.member.id, row.amountCents);
            }}
            styles={styles}
            colors={colors}
          />

          <View style={styles.separator} />

          <DebtSection
            title="Du bekommst"
            rows={owedToMeRows}
            tone="positive"
            emptyText="Noch keine Forderungen."
            onSelectMember={onSelectMember}
            styles={styles}
            colors={colors}
          />

          {mode === 'optimized' && (
            <>
              <View style={styles.separator} />
              <OptimizedTransfers
                currentUserId={currentUserId}
                memberNameById={memberNameById}
                transfers={optimizedTransfers}
                onSelectTransfer={setSelectedTransfer}
                onCreateOptimizedPayment={onCreateOptimizedPayment}
                styles={styles}
                colors={colors}
              />
            </>
          )}
        </View>
      </View>

      <TransferExplanationModal
        transfer={selectedTransfer}
        memberNameById={memberNameById}
        visible={Boolean(selectedTransfer)}
        onClose={() => setSelectedTransfer(null)}
        styles={styles}
        colors={colors}
      />
    </>
  );
}

function ModeButton({
  label,
  selected,
  styles,
  onPress,
}: {
  label: string;
  selected: boolean;
  styles: ReturnType<typeof createStyles>;
  onPress: () => void;
}) {
  return (
    <Pressable style={({ pressed }) => [styles.modeButton, selected && styles.modeButtonSelected, pressed && styles.pressed]} onPress={onPress}>
      <Text style={[styles.modeButtonText, selected && styles.modeButtonTextSelected]}>{label}</Text>
    </Pressable>
  );
}

function OptimizedTransfers({
  currentUserId,
  memberNameById,
  transfers,
  onSelectTransfer,
  onCreateOptimizedPayment,
  styles,
  colors,
}: {
  currentUserId: string;
  memberNameById: Map<string, string>;
  transfers: SettlementTransfer[];
  onSelectTransfer: (transfer: SettlementTransfer) => void;
  onCreateOptimizedPayment?: (transfer: SettlementTransfer) => void;
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
            style={({ pressed }) => [styles.transferCard, pressed && styles.pressed]}
            onPress={() => onSelectTransfer(transfer)}>
            <View style={styles.transferTopRow}>
              <View style={styles.optimizedRowAvatars}>
                <Avatar
                  initials={transfer.from.initials}
                  avatarUrl={transfer.from.avatarUrl}
                  size={34}
                  backgroundColor={`${colors.negative}22`}
                  color={colors.negative}
                />
                <Text style={styles.transferArrow}>→</Text>
                <Avatar
                  initials={transfer.to.initials}
                  avatarUrl={transfer.to.avatarUrl}
                  size={34}
                  backgroundColor={`${colors.positive}22`}
                  color={colors.positive}
                />
              </View>
              <Text style={[styles.amount, styles.positive]}>{formatEuro(transfer.amountCents)}</Text>
            </View>
            <Text style={styles.transferSummaryText}>{describeRouteChains(transfer.routeChains, memberNameById)}</Text>
            <View style={styles.transferFooter}>
              <Text style={styles.transferHint}>Basiert auf {transfer.eventCount} Event{transfer.eventCount === 1 ? '' : 's'}</Text>
              {transfer.from.id === currentUserId ? (
                <Pressable
                  style={({ pressed }) => [styles.payButton, pressed && styles.pressed]}
                  onPress={(event) => {
                    event.stopPropagation();
                    onCreateOptimizedPayment?.(transfer);
                  }}>
                  <Text style={styles.payButtonText}>Bezahlt</Text>
                </Pressable>
              ) : null}
            </View>
          </Pressable>
        ))
      )}
    </View>
  );
}

function TransferExplanationModal({
  transfer,
  memberNameById,
  visible,
  onClose,
  styles,
}: {
  transfer: SettlementTransfer | null;
  memberNameById: Map<string, string>;
  visible: boolean;
  onClose: () => void;
  styles: ReturnType<typeof createStyles>;
  colors: DashboardColors;
}) {
  if (!transfer) {
    return null;
  }

  const fromBalanceAfter = transfer.fromBalanceCents + transfer.amountCents;
  const toBalanceAfter = transfer.toBalanceCents - transfer.amountCents;
  const groupedLines = groupExplanationLines(transfer);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.modalSafeArea} edges={['top', 'bottom']}>
        <View style={styles.modalHeader}>
          <View>
            <Text style={styles.modalTitle}>Optimierung erklärt</Text>
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
              {' '}{transfer.to.name} bekommt insgesamt {formatEuro(transfer.toBalanceCents)}. Deshalb wird die Zahlung direkt verbunden.
            </Text>
          </View>

          <View style={styles.formulaCard}>
            <Text style={styles.formulaTitle}>Shortcut über diese Personen</Text>
            {transfer.routeChains.length === 0 ? (
              <Text style={styles.formulaLine}>Für diese Überweisung gibt es keinen zusätzlichen Zwischenschritt.</Text>
            ) : (
              transfer.routeChains.map((chain, index) => (
                <View key={`${chain.memberIds.join('-')}-${index}`} style={styles.chainRow}>
                  <Text style={styles.chainAmount}>{formatEuro(chain.amountCents)}</Text>
                  <Text style={styles.chainText}>{formatChain(chain, memberNameById)}</Text>
                </View>
              ))
            )}
          </View>

          <View style={styles.formulaCard}>
            <Text style={styles.formulaTitle}>Berechnung dieses Schritts</Text>
            <Text style={styles.formulaLine}>Zahler-Saldo: {formatSignedEuro(transfer.fromBalanceCents)}</Text>
            <Text style={styles.formulaLine}>Empfänger-Saldo: {formatSignedEuro(transfer.toBalanceCents)}</Text>
            <Text style={styles.formulaResult}>
              Überweisung = min({formatEuro(Math.abs(transfer.fromBalanceCents))}, {formatEuro(transfer.toBalanceCents)}) = {formatEuro(transfer.amountCents)}
            </Text>
          </View>

          <View style={styles.formulaCard}>
            <Text style={styles.formulaTitle}>Zwischenstand danach</Text>
            <Text style={styles.formulaLine}>
              {transfer.from.name}: {formatSignedEuro(transfer.fromBalanceCents)} → {formatSignedEuro(fromBalanceAfter)}
            </Text>
            <Text style={styles.formulaLine}>
              {transfer.to.name}: {formatSignedEuro(transfer.toBalanceCents)} → {formatSignedEuro(toBalanceAfter)}
            </Text>
          </View>

          <View style={styles.formulaCard}>
            <Text style={styles.formulaTitle}>Welche Events stecken dahinter?</Text>
            {groupedLines.map((group) => (
              <View key={group.member.id} style={styles.explanationGroup}>
                <View style={styles.explanationGroupHeader}>
                  <Avatar initials={group.member.initials} avatarUrl={group.member.avatarUrl} size={34} />
                  <View style={styles.explanationRowText}>
                    <Text style={styles.explanationEvent}>{group.member.name}</Text>
                    <Text style={styles.explanationMember}>Netto in dieser Optimierung: {formatSignedEuro(group.totalCents)}</Text>
                  </View>
                </View>
                {group.lines.map((line) => (
                  <View key={`${line.eventId}-${line.member.id}-${line.amountCents}`} style={styles.explanationRow}>
                    <View style={styles.explanationRowText}>
                      <Text style={styles.explanationEvent}>{line.eventTitle}</Text>
                    </View>
                    <Text style={[styles.explanationLineAmount, line.amountCents >= 0 ? styles.positive : styles.negative]}>
                      {formatSignedEuro(line.amountCents)}
                    </Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
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
  onCreatePayment?: (row: SettlementRow) => void;
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
                  onCreatePayment?.(row);
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

function formatSignedEuro(amountCents: number) {
  const prefix = amountCents > 0 ? '+' : amountCents < 0 ? '-' : '';
  return `${prefix}${formatEuro(Math.abs(amountCents))}`;
}

function describeRouteChains(chains: OptimizedPaymentChain[], memberNameById: Map<string, string>) {
  const middleNames = Array.from(
    new Set(
      chains.flatMap((chain) => chain.memberIds.slice(1, -1)).map((memberId) => memberNameById.get(memberId) ?? memberId),
    ),
  );

  if (middleNames.length === 0) {
    return 'Direkter Shortcut ohne Zwischenperson';
  }

  return `Bezahlt durch ${middleNames.join(', ')}`;
}

function formatChain(chain: OptimizedPaymentChain, memberNameById: Map<string, string>) {
  const memberNames = chain.memberIds.map((memberId) => memberNameById.get(memberId) ?? memberId);
  if (chain.memberIds.length <= 2) {
    return memberNames.join(' → ');
  }
  return `${memberNames.join(' → ')} · ${chain.eventTitles.length} Grund${chain.eventTitles.length === 1 ? '' : 'e'}`;
}

function groupExplanationLines(transfer: SettlementTransfer) {
  const grouped = new Map<string, { member: SettlementTransfer['from']; totalCents: number; lines: SettlementTransfer['explanationLines'] }>();

  transfer.explanationLines.forEach((line) => {
    const existing = grouped.get(line.member.id);
    if (existing) {
      existing.totalCents += line.amountCents;
      existing.lines.push(line);
      return;
    }

    grouped.set(line.member.id, {
      member: line.member,
      totalCents: line.amountCents,
      lines: [line],
    });
  });

  return Array.from(grouped.values());
}

function createStyles(colors: DashboardColors) {
  return StyleSheet.create({
    wrapper: {
      gap: 12,
      marginHorizontal: 20,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: 28,
      padding: 20,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.06,
      shadowRadius: 22,
    },
    cardTitle: {
      color: colors.text,
      fontSize: 20,
      fontWeight: '900',
      letterSpacing: -0.3,
    },
    modeHeader: {
      gap: 14,
    },
    modeSwitch: {
      backgroundColor: colors.cardMuted,
      borderRadius: 999,
      flexDirection: 'row',
      width: '100%',
      padding: 4,
    },
    modeButton: {
      borderRadius: 999,
      flex: 1,
      paddingHorizontal: 16,
      paddingVertical: 9,
    },
    modeButtonSelected: {
      backgroundColor: colors.button,
    },
    modeButtonText: {
      color: colors.textSubtle,
      fontSize: 13,
      fontWeight: '900',
      textAlign: 'center',
    },
    modeButtonTextSelected: {
      color: colors.buttonText,
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
    transferCard: {
      backgroundColor: colors.cardMuted,
      borderRadius: 22,
      gap: 10,
      padding: 14,
    },
    transferTopRow: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 10,
    },
    optimizedRowAvatars: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 12,
    },
    transferArrow: {
      color: colors.textMuted,
      fontSize: 16,
      fontWeight: '900',
    },
    transferSummaryText: {
      color: colors.textMuted,
      fontSize: 13,
      fontWeight: '700',
      lineHeight: 18,
    },
    transferFooter: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 12,
    },
    transferHint: {
      color: colors.textSubtle,
      flex: 1,
      fontSize: 12,
      fontWeight: '800',
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
    chainRow: {
      gap: 4,
    },
    chainAmount: {
      color: colors.positive,
      fontSize: 16,
      fontWeight: '900',
    },
    chainText: {
      color: colors.textMuted,
      fontSize: 14,
      fontWeight: '700',
      lineHeight: 20,
    },
    explanationRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 10,
      minHeight: 48,
    },
    explanationGroup: {
      gap: 8,
      paddingTop: 4,
    },
    explanationGroupHeader: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 10,
      minHeight: 40,
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
  });
}
