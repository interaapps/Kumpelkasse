import { apiClient } from '@/api/client';
import {
  DashboardResponse,
  DebtEvent,
  EventDateRange,
  EventPageResponse,
  EventType,
  GameHistory,
  Group,
  GroupStats,
  LoginResponse,
  Member,
  normalizeDashboardResponse,
  RelationshipHistory,
} from '@/types/debt';

export async function login(email: string, password: string) {
  const response = await apiClient.post<LoginResponse>('/auth/login', { email, password });
  return response.data;
}

export async function register(email: string, password: string, name: string) {
  const response = await apiClient.post<LoginResponse>('/auth/register', { email, password, name });
  return response.data;
}

export async function loginWithInteraAppsOidc(code: string, redirectUri: string, codeVerifier: string) {
  const response = await apiClient.post<LoginResponse>('/auth/oidc/interaapps', {
    code,
    redirectUri,
    codeVerifier,
  });
  return response.data;
}

export async function restoreSession() {
  const response = await apiClient.get<LoginResponse>('/auth/session');
  return response.data;
}

export async function logout() {
  await apiClient.post('/auth/logout');
}

export async function fetchDashboard(groupId?: string | null) {
  const response = await apiClient.get<DashboardResponse>('/dashboard', {
    params: { groupId },
  });
  return normalizeDashboardResponse(response.data);
}

export async function fetchEventsPage(params: {
  groupId: string;
  page: number;
  size?: number;
  query?: string;
  type?: EventType | null;
  mine?: boolean;
  range?: EventDateRange;
}) {
  const response = await apiClient.get<EventPageResponse>('/events', {
    params: {
      groupId: params.groupId,
      page: params.page,
      size: params.size ?? 20,
      q: params.query?.trim() || undefined,
      type: params.type ?? undefined,
      mine: params.mine ? 'true' : undefined,
      range: params.range && params.range !== 'ALL' ? params.range : undefined,
    },
  });
  return response.data;
}

export async function createGroup(name: string) {
  const response = await apiClient.post<Group>('/groups', { name });
  return response.data;
}

export async function fetchGroupStats(groupId: string) {
  const response = await apiClient.get<GroupStats>(`/groups/${groupId}/stats`);
  return response.data;
}

export async function fetchRelationshipHistory(groupId: string, memberId: string) {
  const response = await apiClient.get<RelationshipHistory>(`/groups/${groupId}/members/${memberId}/history`);
  return response.data;
}

export async function fetchGameHistory(groupId: string) {
  const response = await apiClient.get<GameHistory>(`/groups/${groupId}/games/history`);
  return response.data;
}

export async function joinGroup(groupId: string) {
  const response = await apiClient.post<Group>(`/groups/${groupId}/join`);
  return response.data;
}

export async function leaveGroup(groupId: string) {
  await apiClient.delete(`/groups/${groupId}/members/me`);
}

export async function createEvent(event: DebtEvent) {
  const response = await apiClient.post<DebtEvent>('/events', event);
  return response.data;
}

export async function updateEvent(event: DebtEvent) {
  const response = await apiClient.put<DebtEvent>(`/events/${event.id}`, event);
  return response.data;
}

export async function deleteEvent(eventId: string) {
  await apiClient.delete(`/events/${eventId}`);
}

export async function updateMember(member: Member) {
  const response = await apiClient.patch<Member>(`/members/${member.id}`, member);
  return response.data;
}
