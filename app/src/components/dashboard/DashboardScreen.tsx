import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { createEvent, deleteEvent, fetchDashboard, updateEvent, updateMember } from '@/api/debt-api';
import { DebtOverviewCard } from '@/components/dashboard/DebtOverviewCard';
import { EventDetailsModal } from '@/components/dashboard/EventDetailsModal';
import { EventList } from '@/components/dashboard/EventList';
import { EventModal, EventModalType } from '@/components/dashboard/EventModal';
import { InviteModal } from '@/components/dashboard/InviteModal';
import { MemberProfileModal } from '@/components/dashboard/MemberProfileModal';
import { QuickActionButton } from '@/components/dashboard/QuickActionButton';
import { SummaryCard } from '@/components/dashboard/SummaryCard';
import { TopGroupSelector } from '@/components/dashboard/TopGroupSelector';
import { currentUserId, mockGroups } from '@/data/mockDebtData';
import { DashboardResponse, DebtEvent } from '@/types/debt';

export function DashboardScreen() {
  const [selectedGroupId, setSelectedGroupId] = useState(mockGroups[0].id);
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [groupSelectorVisible, setGroupSelectorVisible] = useState(false);
  const [inviteVisible, setInviteVisible] = useState(false);
  const [profileVisible, setProfileVisible] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState(currentUserId);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [editingEvent, setEditingEvent] = useState<DebtEvent | null>(null);
  const [eventPreset, setEventPreset] = useState<{
    amountCents?: number;
    fromMemberId?: string;
    toMemberId?: string;
  } | null>(null);
  const [activeModal, setActiveModal] = useState<EventModalType | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      setIsLoadingDashboard(true);
      setErrorMessage(null);

      try {
        const nextDashboard = await fetchDashboard(selectedGroupId, currentUserId);
        if (active) {
          setDashboard(nextDashboard);
        }
      } catch {
        if (active) {
          setErrorMessage('Backend nicht erreichbar. Starte die Spring-Boot-API auf Port 8080.');
        }
      } finally {
        if (active) {
          setIsLoadingDashboard(false);
        }
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [selectedGroupId]);

  async function reloadDashboard() {
    const nextDashboard = await fetchDashboard(selectedGroupId, currentUserId);
    setDashboard(nextDashboard);
    setErrorMessage(null);
  }

  if (!dashboard) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.stateContainer}>
          <Text style={styles.stateTitle}>{isLoadingDashboard ? 'Dashboard wird geladen' : 'Backend nicht erreichbar'}</Text>
          <Text style={styles.stateText}>
            {errorMessage ?? 'Die App verbindet sich mit der Wir-schulden-API.'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const groups = dashboard.groups;
  const members = dashboard.members;
  const events = dashboard.events;
  const selectedGroup = groups.find((group) => group.id === selectedGroupId) ?? groups[0];
  const currentUser = members.find((member) => member.id === dashboard.currentUserId) ?? members[0];
  const selectedMember = members.find((member) => member.id === selectedMemberId) ?? null;
  const selectedEvent = events.find((event) => event.id === selectedEventId) ?? null;
  const sortedEvents = [...events].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  const inviteLink = dashboard.inviteLink;

  function openCreateModal(type: EventModalType) {
    setEditingEvent(null);
    setEventPreset(null);
    setActiveModal(type);
  }

  function openPaymentModal(toMemberId?: string, amountCents?: number) {
    setEditingEvent(null);
    setEventPreset({
      amountCents,
      fromMemberId: currentUserId,
      toMemberId: toMemberId ?? members.find((member) => member.id !== currentUserId)?.id,
    });
    setActiveModal('payment');
  }

  function handleEditEvent(event: DebtEvent) {
    setSelectedEventId(null);
    setEditingEvent(event);
    setActiveModal(event.type);
  }

  async function handleDeleteEvent(eventId: string) {
    await deleteEvent(eventId);
    await reloadDashboard();
    setSelectedEventId(null);
  }

  async function handleSubmitEvent(event: DebtEvent) {
    if (editingEvent) {
      await updateEvent(event);
    } else {
      await createEvent(event);
    }
    await reloadDashboard();
    setEditingEvent(null);
    setEventPreset(null);
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}>
        <TopGroupSelector
          groups={groups}
          selectedGroup={selectedGroup}
          currentUser={currentUser}
          visible={groupSelectorVisible}
          onOpen={() => setGroupSelectorVisible(true)}
          onClose={() => setGroupSelectorVisible(false)}
          onOpenInvite={() => setInviteVisible(true)}
          onOpenProfile={() => {
            setSelectedMemberId(currentUserId);
            setProfileVisible(true);
          }}
          onSelectGroup={setSelectedGroupId}
        />

        <SummaryCard
          netCents={dashboard.summary.netCents}
          owedByMeCents={dashboard.summary.owedByMeCents}
          owedToMeCents={dashboard.summary.owedToMeCents}
        />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickActions}
          style={styles.quickActionsScroll}>
          <QuickActionButton
            label="Erstellen"
            icon={{ ios: 'plus', android: 'add', web: 'add' }}
            onPress={() => openCreateModal('direct')}
          />
          <QuickActionButton
            label="Split"
            icon={{ ios: 'shuffle', android: 'call_split', web: 'call_split' }}
            onPress={() => openCreateModal('split')}
          />
          <QuickActionButton
            label="Einzeln"
            icon={{ ios: 'person.fill', android: 'person', web: 'person' }}
            onPress={() => openCreateModal('single')}
          />
          <QuickActionButton
            label="Games"
            icon={{ ios: 'suit.club.fill', android: 'casino', web: 'casino' }}
            onPress={() => openCreateModal('game')}
          />
          <QuickActionButton
            label="Bezahlt"
            icon={{ ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check_circle' }}
            onPress={() => openPaymentModal()}
          />
        </ScrollView>

        <DebtOverviewCard
          owedByMe={dashboard.owedByMe}
          owedToMe={dashboard.owedToMe}
          onSelectMember={(memberId) => {
            setSelectedMemberId(memberId);
            setProfileVisible(true);
          }}
          onCreatePayment={(memberId, amountCents) => openPaymentModal(memberId, amountCents)}
        />
        <EventList events={sortedEvents} currentUserId={currentUserId} onSelectEvent={(event) => setSelectedEventId(event.id)} />
      </ScrollView>

      {activeModal && (
        <EventModal
          visible={Boolean(activeModal)}
          type={activeModal}
          groupId={selectedGroup.id}
          members={members}
          currentUserId={currentUserId}
          initialEvent={editingEvent ?? undefined}
          preset={eventPreset ?? undefined}
          onClose={() => {
            setActiveModal(null);
            setEditingEvent(null);
            setEventPreset(null);
          }}
          onSubmit={handleSubmitEvent}
        />
      )}

      <EventDetailsModal
        event={selectedEvent}
        members={members}
        visible={Boolean(selectedEvent)}
        onClose={() => setSelectedEventId(null)}
        onEdit={handleEditEvent}
        onDelete={handleDeleteEvent}
        onSelectMember={(memberId) => {
          setSelectedEventId(null);
          setSelectedMemberId(memberId);
          setProfileVisible(true);
        }}
      />

      <MemberProfileModal
        visible={profileVisible}
        member={selectedMember}
        currentUserId={currentUserId}
        onClose={() => setProfileVisible(false)}
        onSave={async (updatedMember) => {
          await updateMember(updatedMember);
          await reloadDashboard();
        }}
      />

      <InviteModal
        visible={inviteVisible}
        group={selectedGroup}
        inviteLink={inviteLink}
        onClose={() => setInviteVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#F7F8F4',
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    gap: 22,
    paddingBottom: 110,
  },
  quickActionsScroll: {
    marginTop: 2,
  },
  quickActions: {
    gap: 18,
    paddingHorizontal: 22,
    paddingVertical: 4,
  },
  stateContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 28,
  },
  stateTitle: {
    color: '#101828',
    fontSize: 26,
    fontWeight: '900',
    marginBottom: 8,
    textAlign: 'center',
  },
  stateText: {
    color: '#667085',
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 22,
    textAlign: 'center',
  },
});
