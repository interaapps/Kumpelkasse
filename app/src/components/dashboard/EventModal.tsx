import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';

import { FormTextInput } from '@/components/dashboard/event-modal/EventModalForm';
import { EventModalHeader } from '@/components/dashboard/event-modal/EventModalHeader';
import { type GamePlayerValue } from '@/components/dashboard/event-modal/GamePlayersEditor';
import { GameQuickEntryModal } from '@/components/dashboard/event-modal/GameQuickEntryModal';
import { DirectEventFields, GameEventFields, SplitEventFields } from '@/components/dashboard/event-modal/EventModalSections';
import {
  centsToInput,
  createEmptyGameValues,
  createEqualShares,
  getDefaultTitle,
  getModalTitle,
  hydrateFromEvent,
  normalizeLines,
} from '@/components/dashboard/event-modal/event-modal-utils';
import { DashboardColors, useDashboardTheme } from '@/components/dashboard/theme';
import { DebtEvent, EventType, GameMode, Member, OptimizedPaymentChain } from '@/types/debt';
import { formatEuro, parseEuroToCents } from '@/utils/debt';

export type EventModalType = EventType;

type EventModalProps = {
  visible: boolean;
  type: EventModalType;
  groupId: string;
  members: Member[];
  currentUserId: string;
  initialEvent?: DebtEvent;
  preset?: {
    amountCents?: number;
    fromMemberId?: string;
    toMemberId?: string;
    optimizedPaymentChains?: OptimizedPaymentChain[];
    optimizedAmountCents?: number;
  };
  onClose: () => void;
  onSubmit: (event: DebtEvent) => void | Promise<void>;
};

export function EventModal({
  visible,
  type,
  groupId,
  members,
  currentUserId,
  initialEvent,
  preset,
  onClose,
  onSubmit,
}: EventModalProps) {
  const colors = useDashboardTheme();
  const styles = createStyles(colors);
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [fromMemberId, setFromMemberId] = useState(currentUserId);
  const [toMemberId, setToMemberId] = useState(members[1]?.id ?? currentUserId);
  const [payerId, setPayerId] = useState(currentUserId);
  const [amount, setAmount] = useState('');
  const [selectedParticipantIds, setSelectedParticipantIds] = useState<string[]>(
    members.slice(0, 4).map((member) => member.id),
  );
  const [splitMode, setSplitMode] = useState<'equal' | 'manual'>('equal');
  const [manualShares, setManualShares] = useState<Record<string, string>>({});
  const [gameValues, setGameValues] = useState<Record<string, GamePlayerValue>>({});
  const [gameMode, setGameMode] = useState<GameMode>('poker');
  const [gameSettled, setGameSettled] = useState(false);
  const [bankMemberId, setBankMemberId] = useState<string | null>(null);
  const [quickGameEntryVisible, setQuickGameEntryVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!visible) {
      setQuickGameEntryVisible(false);
      setIsSubmitting(false);
      return;
    }

    const defaultParticipantIds =
      type === 'split'
        ? [currentUserId]
        : Array.from(new Set([currentUserId, ...members.slice(0, 4).map((member) => member.id)]));

    setTitle(initialEvent?.title ?? getDefaultTitle(type));
    setNote(initialEvent?.description ?? '');
    setFromMemberId(preset?.fromMemberId ?? (type === 'split' || type === 'game' ? currentUserId : members[1]?.id ?? currentUserId));
    setToMemberId(preset?.toMemberId ?? currentUserId);
    setPayerId(currentUserId);
    setAmount(centsToInput(preset?.amountCents ?? 0));
    setSelectedParticipantIds(defaultParticipantIds);
    setSplitMode('equal');
    setManualShares({});
    setGameValues(createEmptyGameValues(defaultParticipantIds));
    setGameMode(initialEvent?.gameMode ?? 'poker');
    setGameSettled(initialEvent?.gameSettled ?? false);
    setBankMemberId(initialEvent?.bankMemberId ?? defaultParticipantIds[0] ?? null);

    if (!initialEvent) {
      return;
    }

    hydrateFromEvent(initialEvent, type, {
      currentUserId,
      defaultParticipantIds,
      setAmount,
      setFromMemberId,
      setBankMemberId,
      setGameValues,
      setGameMode,
      setGameSettled,
      setManualShares,
      setPayerId,
      setSelectedParticipantIds,
      setSplitMode,
      setToMemberId,
    });
    // Intentionally initialize only when the modal is opened.
    // Background dashboard refreshes may replace `members` / event objects and should not reset in-progress input.
  }, [visible]);

  useEffect(() => {
    if (!visible || type !== 'game' || gameMode !== 'bank' || !bankMemberId) {
      return;
    }

    setSelectedParticipantIds((current) => (current.includes(bankMemberId) ? current : [bankMemberId, ...current]));
  }, [bankMemberId, gameMode, type, visible]);

  useEffect(() => {
    if (!visible || type !== 'game' || gameMode !== 'bank' || bankMemberId) {
      return;
    }

    setBankMemberId(selectedParticipantIds[0] ?? currentUserId);
  }, [bankMemberId, currentUserId, gameMode, selectedParticipantIds, type, visible]);

  const gameMembers = members.filter((member) => selectedParticipantIds.includes(member.id));
  const quickGameEntryMembers = gameMembers.filter((member) => gameMode !== 'bank' || member.id !== bankMemberId);
  const nonBankGameMembers = gameMembers.filter((member) => gameMode !== 'bank' || member.id !== bankMemberId);
  const enteredGameLines = nonBankGameMembers
    .map((member) => ({
      memberId: member.id,
      amountCents:
        parseEuroToCents(gameValues[member.id]?.cashOut ?? '') -
        parseEuroToCents(gameValues[member.id]?.buyIn ?? ''),
    }))
    .filter((line) => line.amountCents !== 0);
  const enteredGameDeltaCents = enteredGameLines.reduce((total, line) => total + line.amountCents, 0);
  const bankBalanceCents = -enteredGameDeltaCents;
  const settledGameLines = normalizeLines([
    ...enteredGameLines,
    ...(gameMode === 'bank' && bankMemberId ? [{ memberId: bankMemberId, amountCents: bankBalanceCents }] : []),
  ]);
  const gameDeltaCents = gameMode === 'bank' ? 0 : enteredGameDeltaCents;
  const gameHasEntries = gameMembers.some((member) => {
    const value = gameValues[member.id];
    return parseEuroToCents(value?.buyIn ?? '') > 0 || parseEuroToCents(value?.cashOut ?? '') > 0;
  });
  const canSave =
    type !== 'game' ||
    (gameSettled
      ? settledGameLines.length > 0 && (gameMode === 'bank' || gameDeltaCents === 0)
      : gameMembers.length > 0);

  function applyQuickGameEntry({
    memberId,
    kind,
    amountCents,
  }: {
    memberId: string;
    kind: 'buyIn' | 'cashOut';
    amountCents: number;
  }) {
    setGameValues((current) => {
      const existingValue = current[memberId] ?? { buyIn: '', cashOut: '' };
      const nextBuyInCents =
        kind === 'buyIn'
          ? parseEuroToCents(existingValue.buyIn) + amountCents
          : parseEuroToCents(existingValue.buyIn);
      const nextCashOutCents =
        kind === 'cashOut'
          ? parseEuroToCents(existingValue.cashOut) + amountCents
          : parseEuroToCents(existingValue.cashOut);

      return {
        ...current,
        [memberId]: {
          buyIn: centsToEditorInput(nextBuyInCents),
          cashOut: centsToEditorInput(nextCashOutCents),
        },
      };
    });
  }

  async function handleSubmit() {
    if (isSubmitting) {
      return;
    }

    const event = buildEvent();
    if (!event) {
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit(event);
      onClose();
    } catch {
      Alert.alert('Speichern fehlgeschlagen', 'Die API konnte das Event nicht speichern. Bitte versuche es erneut.');
    } finally {
      setIsSubmitting(false);
    }
  }

  function buildEvent(): DebtEvent | null {
    const id = initialEvent?.id ?? `event-${type}-${Date.now()}`;
    const createdAt = initialEvent?.createdAt ?? new Date().toISOString();

    if (type === 'direct' || type === 'single' || type === 'payment' || type === 'optimized_payment') {
      const amountCents = parseEuroToCents(amount);
      if (!title.trim() || amountCents <= 0 || fromMemberId === toMemberId) {
        Alert.alert('Fast geschafft', 'Bitte Titel, zwei unterschiedliche Personen und einen Betrag eintragen.');
        return null;
      }

      const isPaymentType = type === 'payment' || type === 'optimized_payment';
      const payerAmountCents = isPaymentType ? amountCents : -amountCents;
      const receiverAmountCents = isPaymentType ? -amountCents : amountCents;
      const baseOptimizedChains = preset?.optimizedPaymentChains ?? initialEvent?.optimizedPaymentChains ?? [];
      const baseOptimizedAmountCents =
        preset?.optimizedAmountCents ??
        initialEvent?.optimizedPaymentChains?.reduce((total, chain) => total + chain.amountCents, 0) ??
        0;
      const optimizedPaymentChains =
        type === 'optimized_payment'
          ? buildOptimizedPaymentChains(amountCents, baseOptimizedAmountCents, baseOptimizedChains)
          : isPaymentType
            ? baseOptimizedChains
            : [];

      if (type === 'optimized_payment' && optimizedPaymentChains.length === 0) {
        Alert.alert('Optimierte Zahlung nicht moeglich', 'Diese Zahlung braucht einen gueltigen Shortcut-Weg aus der Optimierung.');
        return null;
      }

      return {
        id,
        groupId,
        type,
        title: title.trim(),
        description:
          note.trim() ||
          (isPaymentType
            ? buildPaymentDescription(getMemberName(fromMemberId), getMemberName(toMemberId), optimizedPaymentChains, getMemberName)
            : `${getMemberName(fromMemberId)} schuldet ${getMemberName(toMemberId)}`),
        createdAt,
        lines: [
          { memberId: fromMemberId, amountCents: payerAmountCents },
          { memberId: toMemberId, amountCents: receiverAmountCents },
        ],
        optimizedPaymentChains: isPaymentType ? optimizedPaymentChains : [],
      };
    }

    if (type === 'split') {
      const totalCents = parseEuroToCents(amount);
      const participantIds = Array.from(new Set(selectedParticipantIds));
      if (!title.trim() || totalCents <= 0 || participantIds.length === 0) {
        Alert.alert('Fast geschafft', 'Bitte Titel, Betrag und mindestens einen Teilnehmer eintragen.');
        return null;
      }

      const shares =
        splitMode === 'equal'
          ? createEqualShares(participantIds, totalCents)
          : participantIds.map((memberId) => ({
              memberId,
              amountCents: parseEuroToCents(manualShares[memberId] ?? ''),
            }));

      const shareTotal = shares.reduce((total, share) => total + share.amountCents, 0);
      if (shareTotal !== totalCents) {
        Alert.alert('Split noch nicht ausgeglichen', 'Die Teilnehmer-Anteile müssen zusammen dem Gesamtbetrag entsprechen.');
        return null;
      }

      const normalizedSplitLines = normalizeLines([
        { memberId: payerId, amountCents: totalCents },
        ...shares.map((share) => ({ memberId: share.memberId, amountCents: -share.amountCents })),
      ]);

      if (normalizedSplitLines.length === 0) {
        Alert.alert(
          'Split ohne offene Schuld',
          'So bleibt nach dem Entfernen kein offener Betrag mehr übrig. Füge mindestens eine weitere beteiligte Person hinzu oder lösche das Event stattdessen.',
        );
        return null;
      }

      return {
        id,
        groupId,
        type: 'split',
        title: title.trim(),
        description: `${getMemberName(payerId)} hat bezahlt · ${participantIds.length} Teilnehmer`,
        createdAt,
        lines: normalizedSplitLines,
        splitTotalCents: totalCents,
        splitParticipantIds: participantIds,
        splitShares: shares,
      };
    }

    if (type === 'game') {
      if (!title.trim() || gameMembers.length === 0) {
        Alert.alert('Fast geschafft', 'Bitte Titel und mindestens einen Spieler eintragen.');
        return null;
      }

      if (gameMode === 'bank' && !bankMemberId) {
        Alert.alert('Bank fehlt', 'Bitte waehle aus, welcher Spieler die Bank ist.');
        return null;
      }

      if (gameSettled && gameMode !== 'bank' && gameDeltaCents !== 0) {
        Alert.alert('Noch nicht ausgeglichen', 'Einzahlungen und Auszahlungen müssen in Summe 0 ergeben.');
        return null;
      }

      if (!gameSettled && !gameHasEntries) {
        Alert.alert('Fast geschafft', 'Bitte erfasse mindestens ein Buy-in, Nachzahlen oder einen Cash-out.');
        return null;
      }

      const description = gameSettled
        ? settledGameLines
            .map((line) => `${getMemberName(line.memberId)} ${formatEuro(line.amountCents, { signed: true })}`)
            .join(', ') + (gameMode === 'bank' && bankMemberId ? ` · Bank: ${getMemberName(bankMemberId)}` : '')
        : `Laufende Session · ${gameMembers.length} Spieler · Buy-ins ${formatEuro(
            gameMembers.reduce((total, member) => total + parseEuroToCents(gameValues[member.id]?.buyIn ?? ''), 0),
          )} · Cash-outs ${formatEuro(
            gameMembers.reduce((total, member) => total + parseEuroToCents(gameValues[member.id]?.cashOut ?? ''), 0),
          )}`;

      return {
        id,
        groupId,
        type: 'game',
        title: title.trim(),
        description,
        createdAt,
        lines: gameSettled ? settledGameLines : [],
        gameMode,
        gameSettled,
        bankMemberId,
        gameEntries: gameMembers.map((member) => ({
          memberId: member.id,
          buyInCents: parseEuroToCents(gameValues[member.id]?.buyIn ?? ''),
          cashOutCents: parseEuroToCents(gameValues[member.id]?.cashOut ?? ''),
        })),
      };
    }

    return null;
  }

  function getMemberName(memberId: string) {
    return members.find((member) => member.id === memberId)?.name ?? 'Unbekannt';
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.select({ ios: 'padding', default: undefined })}
          style={styles.keyboardView}>
          <EventModalHeader
            title={getModalTitle(type, Boolean(initialEvent))}
            canSave={canSave}
            isSaving={isSubmitting}
            onClose={onClose}
            onSave={handleSubmit}
          />

          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.content}>
            <FormTextInput
              label="Titel"
              value={title}
              onChangeText={setTitle}
              placeholder="z.B. Pokerabend"
            />

            {(type === 'direct' || type === 'single' || type === 'payment' || type === 'optimized_payment') && (
              <DirectEventFields
                type={type}
                members={members}
                fromMemberId={fromMemberId}
                toMemberId={toMemberId}
                amount={amount}
                note={note}
                setFromMemberId={setFromMemberId}
                setToMemberId={setToMemberId}
                setAmount={setAmount}
                setNote={setNote}
              />
            )}

            {type === 'split' && (
              <SplitEventFields
                members={members}
                payerId={payerId}
                amount={amount}
                selectedParticipantIds={selectedParticipantIds}
                splitMode={splitMode}
                manualShares={manualShares}
                getMemberName={getMemberName}
                setPayerId={setPayerId}
                setAmount={setAmount}
                setSelectedParticipantIds={setSelectedParticipantIds}
                setSplitMode={setSplitMode}
                setManualShares={setManualShares}
              />
            )}

            {type === 'game' && (
              <GameEventFields
                members={members}
                gameMembers={gameMembers}
                selectedParticipantIds={selectedParticipantIds}
                gameValues={gameValues}
                gameDeltaCents={gameDeltaCents}
                gameMode={gameMode}
                gameSettled={gameSettled}
                bankMemberId={bankMemberId}
                bankBalanceCents={bankBalanceCents}
                setSelectedParticipantIds={setSelectedParticipantIds}
                setGameValues={setGameValues}
                setGameMode={setGameMode}
                setGameSettled={setGameSettled}
                setBankMemberId={setBankMemberId}
              />
            )}
          </ScrollView>
          {type === 'game' && quickGameEntryMembers.length > 0 ? (
            <Pressable
              style={({ pressed }) => [styles.floatingFab, pressed && styles.pressed]}
              onPress={() => setQuickGameEntryVisible(true)}>
              <SymbolView
                name={{ ios: 'plus', android: 'add', web: 'add' }}
                size={22}
                tintColor={colors.buttonText}
              />
            </Pressable>
          ) : null}
        </KeyboardAvoidingView>
        {type === 'game' ? (
          <GameQuickEntryModal
            visible={quickGameEntryVisible}
            members={quickGameEntryMembers}
            onClose={() => setQuickGameEntryVisible(false)}
            onApply={applyQuickGameEntry}
          />
        ) : null}
      </SafeAreaView>
    </Modal>
  );
}

function buildOptimizedPaymentChains(
  amountCents: number,
  originalAmountCents: number,
  chains: OptimizedPaymentChain[],
) {
  if (chains.length === 0 || originalAmountCents <= 0 || amountCents > originalAmountCents) {
    return [];
  }

  let remaining = amountCents;
  const allocated: OptimizedPaymentChain[] = [];

  for (const chain of chains) {
    if (remaining <= 0) {
      break;
    }
    const nextAmount = Math.min(chain.amountCents, remaining);
    if (nextAmount <= 0) {
      continue;
    }
    allocated.push({
      ...chain,
      amountCents: nextAmount,
    });
    remaining -= nextAmount;
  }

  return remaining === 0 ? allocated : [];
}

function buildPaymentDescription(
  fromMemberName: string,
  toMemberName: string,
  chains: OptimizedPaymentChain[],
  getMemberName: (memberId: string) => string,
) {
  const viaMemberNames = Array.from(new Set(chains.flatMap((chain) => chain.memberIds.slice(1, -1)).map(getMemberName)));
  const base = `${fromMemberName} hat ${toMemberName} bezahlt`;
  if (viaMemberNames.length === 0) {
    return base;
  }
  return `${base} · Bezahlt durch ${viaMemberNames.join(', ')}`;
}

function centsToEditorInput(cents: number) {
  return cents > 0 ? String(cents / 100).replace('.', ',') : '';
}

function createStyles(colors: DashboardColors) {
  return StyleSheet.create({
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    gap: 18,
    padding: 20,
    paddingBottom: 110,
  },
  floatingFab: {
    alignItems: 'center',
    backgroundColor: colors.button,
    borderRadius: 999,
    bottom: 28,
    height: 58,
    justifyContent: 'center',
    position: 'absolute',
    right: 22,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 22,
    width: 58,
  },
  pressed: {
    opacity: 0.78,
  },
  });
}
