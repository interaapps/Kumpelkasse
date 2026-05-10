import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FormTextInput } from '@/components/dashboard/event-modal/EventModalForm';
import { EventModalHeader } from '@/components/dashboard/event-modal/EventModalHeader';
import { type GamePlayerValue } from '@/components/dashboard/event-modal/GamePlayersEditor';
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
import { DebtEvent, EventType, Member } from '@/types/debt';
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

  useEffect(() => {
    if (!visible) {
      return;
    }

    const defaultParticipantIds = Array.from(new Set([currentUserId, ...members.slice(0, 4).map((member) => member.id)]));

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

    if (!initialEvent) {
      return;
    }

    hydrateFromEvent(initialEvent, type, {
      currentUserId,
      defaultParticipantIds,
      setAmount,
      setFromMemberId,
      setGameValues,
      setPayerId,
      setSelectedParticipantIds,
      setToMemberId,
    });
  }, [currentUserId, initialEvent, members, preset, type, visible]);

  useEffect(() => {
    if (!visible || type !== 'split') {
      return;
    }

    setSelectedParticipantIds((current) => (current.includes(payerId) ? current : [payerId, ...current]));
  }, [payerId, type, visible]);

  const gameMembers = members.filter((member) => selectedParticipantIds.includes(member.id));
  const gameLines = gameMembers
    .map((member) => ({
      memberId: member.id,
      amountCents:
        parseEuroToCents(gameValues[member.id]?.cashOut ?? '') -
        parseEuroToCents(gameValues[member.id]?.buyIn ?? ''),
    }))
    .filter((line) => line.amountCents !== 0);
  const gameDeltaCents = gameLines.reduce((total, line) => total + line.amountCents, 0);
  const canSave = type !== 'game' || (gameLines.length > 0 && gameDeltaCents === 0);

  async function handleSubmit() {
    const event = buildEvent();
    if (!event) {
      return;
    }

    try {
      await onSubmit(event);
      onClose();
    } catch {
      Alert.alert('Speichern fehlgeschlagen', 'Die API konnte das Event nicht speichern. Bitte versuche es erneut.');
    }
  }

  function buildEvent(): DebtEvent | null {
    const id = initialEvent?.id ?? `event-${type}-${Date.now()}`;
    const createdAt = initialEvent?.createdAt ?? new Date().toISOString();

    if (type === 'direct' || type === 'single' || type === 'payment') {
      const amountCents = parseEuroToCents(amount);
      if (!title.trim() || amountCents <= 0 || fromMemberId === toMemberId) {
        Alert.alert('Fast geschafft', 'Bitte Titel, zwei unterschiedliche Personen und einen Betrag eintragen.');
        return null;
      }

      const payerAmountCents = type === 'payment' ? amountCents : -amountCents;
      const receiverAmountCents = type === 'payment' ? -amountCents : amountCents;

      return {
        id,
        groupId,
        type,
        title: title.trim(),
        description:
          note.trim() ||
          (type === 'payment'
            ? `${getMemberName(fromMemberId)} hat ${getMemberName(toMemberId)} bezahlt`
            : `${getMemberName(fromMemberId)} schuldet ${getMemberName(toMemberId)}`),
        createdAt,
        lines: [
          { memberId: fromMemberId, amountCents: payerAmountCents },
          { memberId: toMemberId, amountCents: receiverAmountCents },
        ],
      };
    }

    if (type === 'split') {
      const totalCents = parseEuroToCents(amount);
      const participantIds = Array.from(new Set([payerId, ...selectedParticipantIds]));
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

      return {
        id,
        groupId,
        type: 'split',
        title: title.trim(),
        description: `${getMemberName(payerId)} hat bezahlt · ${participantIds.length} Teilnehmer`,
        createdAt,
        lines: normalizeLines([
          { memberId: payerId, amountCents: totalCents },
          ...shares.map((share) => ({ memberId: share.memberId, amountCents: -share.amountCents })),
        ]),
      };
    }

    if (type === 'game') {
      if (!title.trim() || gameLines.length === 0) {
        Alert.alert('Fast geschafft', 'Bitte Titel und mindestens einen Spieler mit Werten eintragen.');
        return null;
      }

      if (gameDeltaCents !== 0) {
        Alert.alert('Noch nicht ausgeglichen', 'Einzahlungen und Auszahlungen müssen in Summe 0 ergeben.');
        return null;
      }

      return {
        id,
        groupId,
        type: 'game',
        title: title.trim(),
        description: gameLines
          .map((line) => `${getMemberName(line.memberId)} ${formatEuro(line.amountCents, { signed: true })}`)
          .join(', '),
        createdAt,
        lines: gameLines,
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

            {(type === 'direct' || type === 'single' || type === 'payment') && (
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
                setSelectedParticipantIds={setSelectedParticipantIds}
                setGameValues={setGameValues}
              />
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
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
    paddingBottom: 36,
  },
  });
}
