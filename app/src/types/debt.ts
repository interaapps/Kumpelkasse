export type EventType = 'direct' | 'split' | 'single' | 'game' | 'payment';

export type LedgerLine = {
  memberId: string;
  amountCents: number;
};

export type DebtEvent = {
  id: string;
  groupId: string;
  type: EventType;
  title: string;
  description?: string;
  createdAt: string;
  lines: LedgerLine[];
};

export type Group = {
  id: string;
  name: string;
};

export type Member = {
  id: string;
  name: string;
  initials: string;
  email?: string;
  avatarUrl?: string;
  paypalUrl?: string;
  cashAppTag?: string;
  venmoHandle?: string;
  revolutHandle?: string;
  wiseUrl?: string;
  applePayContact?: string;
  bankDetails?: string;
  note?: string;
};

export type SettlementRow = {
  member: Member;
  amountCents: number;
  eventCount: number;
};

export type SettlementTransfer = {
  from: Member;
  to: Member;
  amountCents: number;
  eventCount: number;
  fromBalanceCents: number;
  toBalanceCents: number;
  explanationLines: SettlementExplanationLine[];
};

export type SettlementExplanationLine = {
  eventId: string;
  eventTitle: string;
  member: Member;
  amountCents: number;
};

export type Summary = {
  netCents: number;
  owedByMeCents: number;
  owedToMeCents: number;
};

export type DashboardResponse = {
  currentUserId: string;
  selectedGroupId: string | null;
  inviteLink: string | null;
  groups: Group[];
  members: Member[];
  events: DebtEvent[];
  summary: Summary;
  owedByMe: SettlementRow[];
  owedToMe: SettlementRow[];
  optimizedTransfers: SettlementTransfer[];
};

export type LoginResponse = {
  sessionToken: string;
  currentUserId: string;
  member: Member;
};
