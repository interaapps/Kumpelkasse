import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  FormField,
  FormTextInput,
  MoneyField,
  SegmentButton,
  SegmentedControl,
} from '@/components/dashboard/event-modal/EventModalForm';
import { EventModalHeader } from '@/components/dashboard/event-modal/EventModalHeader';
import {
  GamePlayersEditor,
  type GamePlayerValue,
} from '@/components/dashboard/event-modal/GamePlayersEditor';
import { MemberMultiSelect, PersonSelect } from '@/components/dashboard/event-modal/MemberSelect';
import { DashboardColors, useDashboardTheme } from '@/components/dashboard/theme';
import { DebtEvent, EventType, LedgerLine, Member } from '@/types/debt';
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
              <>
                <PersonSelect
                  label={type === 'payment' ? 'Bezahlt von' : type === 'single' ? 'Person schuldet' : 'Von Person'}
                  members={members}
                  selectedId={fromMemberId}
                  onSelect={setFromMemberId}
                />
                <PersonSelect
                  label={type === 'payment' ? 'Bezahlt an' : type === 'single' ? 'Person bekommt' : 'An Person'}
                  members={members}
                  selectedId={toMemberId}
                  onSelect={setToMemberId}
                />
                <MoneyField value={amount} onChangeText={setAmount} label="Betrag" />
                {(type === 'direct' || type === 'payment') && (
                  <FormTextInput
                    label="Notiz optional"
                    value={note}
                    onChangeText={setNote}
                    placeholder="Wofür war es?"
                    multiline
                  />
                )}
              </>
            )}

            {type === 'split' && (
              <>
                <PersonSelect
                  label="Bezahlt von"
                  members={members}
                  selectedId={payerId}
                  onSelect={(memberId) => {
                    setPayerId(memberId);
                    setSelectedParticipantIds((current) => Array.from(new Set([memberId, ...current])));
                  }}
                />
                <MoneyField value={amount} onChangeText={setAmount} label="Gesamtbetrag" />
                <FormField label="Split-Modus">
                  <SegmentedControl>
                    <SegmentButton label="gleichmäßig" selected={splitMode === 'equal'} onPress={() => setSplitMode('equal')} />
                    <SegmentButton label="manuell" selected={splitMode === 'manual'} onPress={() => setSplitMode('manual')} />
                  </SegmentedControl>
                </FormField>
                <MemberMultiSelect
                  members={members}
                  selectedIds={selectedParticipantIds}
                  onToggle={(memberId) =>
                    setSelectedParticipantIds((current) => {
                      if (memberId === payerId) {
                        return current;
                      }

                      return current.includes(memberId)
                        ? current.filter((id) => id !== memberId)
                        : [...current, memberId];
                    })
                  }
                />
                {splitMode === 'manual' && (
                  <View style={styles.manualList}>
                    {selectedParticipantIds.map((memberId) => (
                      <MoneyField
                        key={memberId}
                        value={manualShares[memberId] ?? ''}
                        onChangeText={(value) => setManualShares((current) => ({ ...current, [memberId]: value }))}
                        label={getMemberName(memberId)}
                      />
                    ))}
                  </View>
                )}
              </>
            )}

            {type === 'game' && (
              <>
                <MemberMultiSelect
                  label="Mitspieler"
                  members={members}
                  selectedIds={selectedParticipantIds}
                  onToggle={(memberId) =>
                    setSelectedParticipantIds((current) =>
                      current.includes(memberId)
                        ? current.filter((id) => id !== memberId)
                        : [...current, memberId],
                    )
                  }
                />
                <GamePlayersEditor
                  members={gameMembers}
                  values={gameValues}
                  deltaCents={gameDeltaCents}
                  onChange={(memberId, value) =>
                    setGameValues((current) => ({
                      ...current,
                      [memberId]: value,
                    }))
                  }
                />
              </>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

function hydrateFromEvent(
  event: DebtEvent,
  type: EventModalType,
  setters: {
    currentUserId: string;
    defaultParticipantIds: string[];
    setAmount: (value: string) => void;
    setFromMemberId: (value: string) => void;
    setGameValues: (value: Record<string, GamePlayerValue>) => void;
    setPayerId: (value: string) => void;
    setSelectedParticipantIds: (value: string[]) => void;
    setToMemberId: (value: string) => void;
  },
) {
  if (type === 'direct' || type === 'single' || type === 'payment') {
    const fromLine =
      type === 'payment'
        ? event.lines.find((line) => line.amountCents > 0)
        : event.lines.find((line) => line.amountCents < 0);
    const toLine =
      type === 'payment'
        ? event.lines.find((line) => line.amountCents < 0)
        : event.lines.find((line) => line.amountCents > 0);
    setters.setFromMemberId(fromLine?.memberId ?? setters.currentUserId);
    setters.setToMemberId(toLine?.memberId ?? setters.currentUserId);
    setters.setAmount(centsToInput(Math.abs(fromLine?.amountCents ?? toLine?.amountCents ?? 0)));
    return;
  }

  if (type === 'split') {
    const positiveLine = [...event.lines]
      .filter((line) => line.amountCents > 0)
      .sort((a, b) => b.amountCents - a.amountCents)[0];
    const participantIds = event.lines.filter((line) => line.amountCents < 0).map((line) => line.memberId);
    const selectedIds = positiveLine ? Array.from(new Set([positiveLine.memberId, ...participantIds])) : participantIds;

    setters.setPayerId(positiveLine?.memberId ?? setters.currentUserId);
    setters.setAmount(centsToInput(event.lines.filter((line) => line.amountCents > 0).reduce((total, line) => total + line.amountCents, 0)));
    setters.setSelectedParticipantIds(selectedIds.length > 0 ? selectedIds : setters.defaultParticipantIds);
    return;
  }

  if (type === 'game') {
    const selectedIds = event.lines.map((line) => line.memberId);
    setters.setSelectedParticipantIds(selectedIds.length > 0 ? selectedIds : setters.defaultParticipantIds);
    setters.setGameValues(
      Object.fromEntries(
        event.lines.map((line) => [
          line.memberId,
          line.amountCents >= 0
            ? { buyIn: '', cashOut: centsToInput(line.amountCents) }
            : { buyIn: centsToInput(Math.abs(line.amountCents)), cashOut: '' },
        ]),
      ),
    );
  }
}

function createEmptyGameValues(memberIds: string[]) {
  return Object.fromEntries(memberIds.map((memberId) => [memberId, { buyIn: '', cashOut: '' }]));
}

function centsToInput(cents: number) {
  return cents > 0 ? String(cents / 100).replace('.', ',') : '';
}

function getDefaultTitle(type: EventModalType) {
  switch (type) {
    case 'direct':
      return 'Direkte Schuld';
    case 'split':
      return 'Gemeinsame Ausgabe';
    case 'single':
      return 'Einzel-Ausgabe';
    case 'game':
      return 'Pokerabend';
    case 'payment':
      return 'Zahlung';
  }
}

function getModalTitle(type: EventModalType, editing: boolean) {
  if (editing) {
    return 'Event bearbeiten';
  }

  switch (type) {
    case 'direct':
      return 'Erstellen';
    case 'split':
      return 'Split-Ausgabe';
    case 'single':
      return 'Einzeln';
    case 'game':
      return 'Game erfassen';
    case 'payment':
      return 'Zahlung';
  }
}

function getModalEyebrow(type: EventModalType, editing: boolean) {
  if (editing) {
    return 'Bearbeiten';
  }

  switch (type) {
    case 'direct':
      return 'Erstellen';
    case 'split':
      return 'Kosten teilen';
    case 'single':
      return 'Person zu Person';
    case 'game':
      return 'Poker Session';
    case 'payment':
      return 'Zahlung';
  }
}

function createEqualShares(memberIds: string[], totalCents: number) {
  const baseShare = Math.floor(totalCents / memberIds.length);
  let remainder = totalCents - baseShare * memberIds.length;

  return memberIds.map((memberId) => {
    const amountCents = baseShare + (remainder > 0 ? 1 : 0);
    remainder -= remainder > 0 ? 1 : 0;
    return { memberId, amountCents };
  });
}

function normalizeLines(lines: LedgerLine[]) {
  const totals = new Map<string, number>();

  for (const line of lines) {
    totals.set(line.memberId, (totals.get(line.memberId) ?? 0) + line.amountCents);
  }

  return Array.from(totals.entries())
    .map(([memberId, amountCents]) => ({ memberId, amountCents }))
    .filter((line) => line.amountCents !== 0);
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
  manualList: {
    gap: 12,
  },
  });
}
