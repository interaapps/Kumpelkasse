export type EventType = 'direct' | 'split' | 'single' | 'game' | 'payment' | 'optimized_payment';
export type EventDateRange = 'LAST_7_DAYS' | 'LAST_30_DAYS' | 'THIS_YEAR' | 'ALL';
export type GameMode = 'poker' | 'bank';

export type LedgerLine = {
  memberId: string;
  amountCents: number;
};

export type SplitShare = {
  memberId: string;
  amountCents: number;
};

export type GameEntry = {
  memberId: string;
  buyInCents: number;
  cashOutCents: number;
};

export type OptimizedPaymentChain = {
  memberIds: string[];
  amountCents: number;
  eventIds: string[];
  eventTitles: string[];
};

export type DebtEvent = {
  id: string;
  groupId: string;
  type: EventType;
  title: string;
  description?: string;
  createdAt: string;
  lines: LedgerLine[];
  gameMode?: GameMode | null;
  bankMemberId?: string | null;
  splitTotalCents?: number | null;
  splitParticipantIds?: string[];
  splitShares?: SplitShare[];
  gameEntries?: GameEntry[];
  gameSettled?: boolean;
  optimizedPaymentChains?: OptimizedPaymentChain[];
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
  notificationsEnabled?: boolean;
  notificationHour?: number;
  backgroundRefreshEnabled?: boolean;
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
  routeChains: OptimizedPaymentChain[];
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
  stats: GroupStats;
  directOwedByMe: SettlementRow[];
  directOwedToMe: SettlementRow[];
  optimizedOwedByMe: SettlementRow[];
  optimizedOwedToMe: SettlementRow[];
  owedByMe: SettlementRow[];
  owedToMe: SettlementRow[];
  optimizedTransfers: SettlementTransfer[];
};

export const EMPTY_GROUP_STATS: GroupStats = {
  totalEvents: 0,
  totalVolumeCents: 0,
  activeMembers: 0,
  biggestCreditor: null,
  biggestDebtor: null,
  mostActiveMember: null,
  biggestGameWinner: null,
  biggestGameLoser: null,
  splitEventCount: 0,
  paymentEventCount: 0,
  gameEventCount: 0,
};

export type LoginResponse = {
  sessionToken: string;
  currentUserId: string;
  member: Member;
};

export type EventPageResponse = {
  items: DebtEvent[];
  page: number;
  size: number;
  totalCount: number;
  hasMore: boolean;
};

export type MemberStat = {
  member: Member;
  amountCents: number;
  eventCount: number;
};

export type GroupStats = {
  totalEvents: number;
  totalVolumeCents: number;
  activeMembers: number;
  biggestCreditor?: MemberStat | null;
  biggestDebtor?: MemberStat | null;
  mostActiveMember?: MemberStat | null;
  biggestGameWinner?: MemberStat | null;
  biggestGameLoser?: MemberStat | null;
  splitEventCount: number;
  paymentEventCount: number;
  gameEventCount: number;
};

export type RelationshipSummary = {
  otherMember: Member;
  eventCount: number;
  netCents: number;
  youOweCents: number;
  owesYouCents: number;
};

export type RelationshipHistory = {
  summary: RelationshipSummary;
  events: DebtEvent[];
};

export type GameHistory = {
  leaderboard: MemberStat[];
  events: DebtEvent[];
};

export function normalizeDashboardResponse(dashboard: DashboardResponse): DashboardResponse {
  return {
    ...dashboard,
    stats: dashboard.stats ?? EMPTY_GROUP_STATS,
    directOwedByMe: dashboard.directOwedByMe ?? dashboard.owedByMe ?? [],
    directOwedToMe: dashboard.directOwedToMe ?? dashboard.owedToMe ?? [],
    optimizedOwedByMe: dashboard.optimizedOwedByMe ?? dashboard.owedByMe ?? [],
    optimizedOwedToMe: dashboard.optimizedOwedToMe ?? dashboard.owedToMe ?? [],
    optimizedTransfers: (dashboard.optimizedTransfers ?? []).map((transfer) => ({
      ...transfer,
      routeChains: transfer.routeChains ?? [],
    })),
  };
}
