import { DebtEvent, EventType, Member, SettlementRow } from '@/types/debt';

export function formatEuro(cents: number, options?: { signed?: boolean }) {
  const sign = options?.signed && cents > 0 ? '+' : '';
  const value = cents / 100;
  const formatted = new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: Number.isInteger(value) ? 0 : 2,
  }).format(value);

  return `${sign}${formatted}`;
}

export function parseEuroToCents(value: string) {
  const normalized = value.replace(',', '.').replace(/[^\d.-]/g, '');
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? Math.round(parsed * 100) : 0;
}

export function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export function getGroupEvents(events: DebtEvent[], groupId: string) {
  return events.filter((event) => event.groupId === groupId);
}

export function getMemberBalance(events: DebtEvent[], memberId: string) {
  return events.reduce((total, event) => {
    const line = event.lines.find((item) => item.memberId === memberId);
    return total + (line?.amountCents ?? 0);
  }, 0);
}

export function getEventTotal(event: DebtEvent) {
  return event.lines
    .filter((line) => line.amountCents > 0)
    .reduce((total, line) => total + line.amountCents, 0);
}

export function getEventAmountForMember(event: DebtEvent, memberId: string) {
  return event.lines.find((line) => line.memberId === memberId)?.amountCents ?? 0;
}

export function calculateSettlements(
  events: DebtEvent[],
  members: Member[],
  currentUserId: string,
) {
  const memberMap = new Map(members.map((member) => [member.id, member]));
  const owedByMe = new Map<string, { amountCents: number; eventIds: Set<string> }>();
  const owedToMe = new Map<string, { amountCents: number; eventIds: Set<string> }>();

  for (const event of events) {
    const currentUserAmount = getEventAmountForMember(event, currentUserId);

    if (currentUserAmount < 0) {
      const totalPositive = event.lines
        .filter((line) => line.amountCents > 0)
        .reduce((total, line) => total + line.amountCents, 0);

      for (const line of event.lines) {
        if (line.memberId === currentUserId || line.amountCents <= 0 || totalPositive === 0) {
          continue;
        }
        const amountCents = Math.round((line.amountCents / totalPositive) * Math.abs(currentUserAmount));
        addSettlement(owedByMe, line.memberId, amountCents, event.id);
      }
    }

    if (currentUserAmount > 0) {
      const totalNegative = event.lines
        .filter((line) => line.amountCents < 0)
        .reduce((total, line) => total + Math.abs(line.amountCents), 0);

      for (const line of event.lines) {
        if (line.memberId === currentUserId || line.amountCents >= 0 || totalNegative === 0) {
          continue;
        }
        const amountCents = Math.round((Math.abs(line.amountCents) / totalNegative) * currentUserAmount);
        addSettlement(owedToMe, line.memberId, amountCents, event.id);
      }
    }
  }

  return {
    owedByMe: toSettlementRows(owedByMe, memberMap),
    owedToMe: toSettlementRows(owedToMe, memberMap),
  };
}

export function getEventAccent(type: EventType) {
  switch (type) {
    case 'direct':
      return '#111827';
    case 'split':
      return '#2563EB';
    case 'single':
      return '#F97316';
    case 'game':
      return '#16A34A';
    case 'payment':
      return '#64748B';
  }
}

function addSettlement(
  map: Map<string, { amountCents: number; eventIds: Set<string> }>,
  memberId: string,
  amountCents: number,
  eventId: string,
) {
  const current = map.get(memberId) ?? { amountCents: 0, eventIds: new Set<string>() };
  current.amountCents += amountCents;
  current.eventIds.add(eventId);
  map.set(memberId, current);
}

function toSettlementRows(
  map: Map<string, { amountCents: number; eventIds: Set<string> }>,
  memberMap: Map<string, Member>,
): SettlementRow[] {
  return Array.from(map.entries())
    .map(([memberId, value]) => {
      const member = memberMap.get(memberId);
      if (!member) {
        return null;
      }

      return {
        member,
        amountCents: value.amountCents,
        eventCount: value.eventIds.size,
      };
    })
    .filter((row): row is SettlementRow => Boolean(row))
    .filter((row) => row.amountCents > 0)
    .sort((a, b) => b.amountCents - a.amountCents);
}
