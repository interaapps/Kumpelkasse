import { apiClient } from '@/api/client';
import { DashboardResponse, DebtEvent, Group, LoginResponse, Member } from '@/types/debt';

export async function login(email: string, password: string) {
  const response = await apiClient.post<LoginResponse>('/auth/login', { email, password });
  return response.data;
}

export async function register(email: string, password: string, name: string) {
  const response = await apiClient.post<LoginResponse>('/auth/register', { email, password, name });
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
  return response.data;
}

export async function createGroup(name: string) {
  const response = await apiClient.post<Group>('/groups', { name });
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
