import { apiClient } from '@/api/client';
import { DashboardResponse, DebtEvent, Member } from '@/types/debt';

export async function fetchDashboard(groupId: string, currentUserId: string) {
  const response = await apiClient.get<DashboardResponse>('/dashboard', {
    params: { groupId, currentUserId },
  });
  return response.data;
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
