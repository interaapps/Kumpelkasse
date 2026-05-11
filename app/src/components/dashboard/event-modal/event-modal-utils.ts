import { GamePlayerValue } from '@/components/dashboard/event-modal/GamePlayersEditor';
import { DebtEvent, EventType, GameMode, LedgerLine } from '@/types/debt';

export function hydrateFromEvent(
  event: DebtEvent,
  type: EventType,
  setters: {
    currentUserId: string;
    defaultParticipantIds: string[];
    setAmount: (value: string) => void;
    setFromMemberId: (value: string) => void;
    setGameValues: (value: Record<string, GamePlayerValue>) => void;
    setGameMode?: (value: GameMode) => void;
    setBankMemberId?: (value: string | null) => void;
    setManualShares?: (value: Record<string, string>) => void;
    setPayerId: (value: string) => void;
    setSelectedParticipantIds: (value: string[]) => void;
    setSplitMode?: (value: 'equal' | 'manual') => void;
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
    if (event.splitTotalCents && event.splitParticipantIds?.length) {
      const splitShares = event.splitShares ?? [];
      const allEqual =
        splitShares.length > 0 &&
        splitShares.every((share) => share.amountCents === splitShares[0]?.amountCents);
      setters.setPayerId(
        [...event.lines].filter((line) => line.amountCents > 0).sort((a, b) => b.amountCents - a.amountCents)[0]?.memberId ??
          setters.currentUserId,
      );
      setters.setAmount(centsToInput(event.splitTotalCents));
      setters.setSelectedParticipantIds(event.splitParticipantIds);
      setters.setSplitMode?.(allEqual ? 'equal' : 'manual');
      setters.setManualShares?.(
        Object.fromEntries(splitShares.map((share) => [share.memberId, centsToInput(share.amountCents)])),
      );
      return;
    }

    const positiveLine = [...event.lines]
      .filter((line) => line.amountCents > 0)
      .sort((a, b) => b.amountCents - a.amountCents)[0];
    const participantIds = event.lines.filter((line) => line.amountCents < 0).map((line) => line.memberId);

    setters.setPayerId(positiveLine?.memberId ?? setters.currentUserId);
    setters.setAmount(centsToInput(event.lines.filter((line) => line.amountCents < 0).reduce((total, line) => total + Math.abs(line.amountCents), 0)));
    setters.setSelectedParticipantIds(participantIds.length > 0 ? participantIds : setters.defaultParticipantIds);
    return;
  }

  if (type === 'game') {
    if (event.gameEntries?.length) {
      const selectedIds = event.gameEntries.map((entry) => entry.memberId);
      setters.setSelectedParticipantIds(selectedIds.length > 0 ? selectedIds : setters.defaultParticipantIds);
      setters.setGameMode?.(event.gameMode ?? 'poker');
      setters.setBankMemberId?.(event.bankMemberId ?? null);
      setters.setGameValues(
        Object.fromEntries(
          event.gameEntries.map((entry) => [
            entry.memberId,
            {
              buyIn: centsToInput(entry.buyInCents),
              cashOut: centsToInput(entry.cashOutCents),
            },
          ]),
        ),
      );
      return;
    }

    const selectedIds = event.lines.map((line) => line.memberId);
    setters.setSelectedParticipantIds(selectedIds.length > 0 ? selectedIds : setters.defaultParticipantIds);
    setters.setGameMode?.(event.gameMode ?? 'poker');
    setters.setBankMemberId?.(event.bankMemberId ?? null);
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

export function createEmptyGameValues(memberIds: string[]) {
  return Object.fromEntries(memberIds.map((memberId) => [memberId, { buyIn: '', cashOut: '' }]));
}

export function centsToInput(cents: number) {
  return cents > 0 ? String(cents / 100).replace('.', ',') : '';
}

export function getDefaultTitle(type: EventType) {
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

export function getModalTitle(type: EventType, editing: boolean) {
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

export function createEqualShares(memberIds: string[], totalCents: number) {
  const baseShare = Math.floor(totalCents / memberIds.length);
  let remainder = totalCents - baseShare * memberIds.length;

  return memberIds.map((memberId) => {
    const amountCents = baseShare + (remainder > 0 ? 1 : 0);
    remainder -= remainder > 0 ? 1 : 0;
    return { memberId, amountCents };
  });
}

export function normalizeLines(lines: LedgerLine[]) {
  const totals = new Map<string, number>();

  for (const line of lines) {
    totals.set(line.memberId, (totals.get(line.memberId) ?? 0) + line.amountCents);
  }

  return Array.from(totals.entries())
    .map(([memberId, amountCents]) => ({ memberId, amountCents }))
    .filter((line) => line.amountCents !== 0);
}
