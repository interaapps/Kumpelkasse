import { RefreshControl, ScrollView, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DebtOverviewCard } from '@/components/dashboard/DebtOverviewCard';
import { EventDetailsModal } from '@/components/dashboard/EventDetailsModal';
import { EventList } from '@/components/dashboard/EventList';
import { EventModal } from '@/components/dashboard/EventModal';
import { GroupOnboardingScreen } from '@/components/dashboard/GroupOnboardingScreen';
import { useDashboardController } from '@/components/dashboard/hooks/useDashboardController';
import { InviteModal } from '@/components/dashboard/InviteModal';
import { JoinInviteModal } from '@/components/dashboard/JoinInviteModal';
import { LoginScreen } from '@/components/dashboard/LoginScreen';
import { MemberProfileModal } from '@/components/dashboard/MemberProfileModal';
import { QuickActionsBar } from '@/components/dashboard/QuickActionsBar';
import { SummaryCard } from '@/components/dashboard/SummaryCard';
import { DashboardThemeContext, dashboardThemes, useDashboardTheme } from '@/components/dashboard/theme';
import { TopGroupSelector } from '@/components/dashboard/TopGroupSelector';

export function DashboardScreen() {
  const scheme = useColorScheme();
  const colors = dashboardThemes[scheme === 'dark' ? 'dark' : 'light'];

  return (
    <DashboardThemeContext.Provider value={colors}>
      <DashboardContent />
    </DashboardThemeContext.Provider>
  );
}

function DashboardContent() {
  const colors = useDashboardTheme();
  const styles = createStyles(colors);
  const { state, actions, derived } = useDashboardController();
  const {
    activeModal,
    dashboard,
    editingEvent,
    errorMessage,
    eventPreset,
    groupCreationVisible,
    groupSelectorVisible,
    inviteVisible,
    isLoadingDashboard,
    isRefreshing,
    isRestoringSession,
    joinPromptGroupId,
    currentUserId,
    selectedEventId,
    selectedMemberId,
  } = state;

  if (isRestoringSession) {
    return <DashboardState title="Session wird geladen" text="Wir schauen kurz nach, ob du noch eingeloggt bist." />;
  }

  if (!currentUserId) {
    return (
      <LoginScreen
        onLogin={actions.handleLogin}
        onRegister={actions.handleRegister}
        onInteraAppsLogin={actions.handleInteraAppsLogin}
      />
    );
  }

  if (!dashboard) {
    return (
      <DashboardState
        title={isLoadingDashboard ? 'Dashboard wird geladen' : 'Backend nicht erreichbar'}
        text={errorMessage ?? 'Die App verbindet sich mit der Kumpelkasse-API.'}
      />
    );
  }

  if (dashboard.groups.length === 0) {
    const currentUser = dashboard.members.find((member) => member.id === currentUserId);
    return (
      <>
        <GroupOnboardingScreen userName={currentUser?.name ?? 'du'} onCreateGroup={actions.handleCreateGroup} />
        <JoinInviteModal
          visible={Boolean(joinPromptGroupId)}
          groupId={joinPromptGroupId}
          onClose={() => actions.setJoinPromptGroupId(null)}
          onJoin={actions.joinPendingGroup}
        />
      </>
    );
  }

  if (groupCreationVisible) {
    const currentUser = dashboard.members.find((member) => member.id === currentUserId);
    return (
      <GroupOnboardingScreen
        userName={currentUser?.name ?? 'du'}
        onCancel={() => actions.setGroupCreationVisible(false)}
        onCreateGroup={actions.handleCreateGroup}
      />
    );
  }

  const groups = dashboard.groups;
  const members = dashboard.members;
  const events = dashboard.events;
  const selectedGroup = groups.find((group) => group.id === dashboard.selectedGroupId) ?? groups[0];
  const currentUser = members.find((member) => member.id === currentUserId) ?? members[0];
  const selectedMember = members.find((member) => member.id === selectedMemberId) ?? null;
  const selectedEvent = events.find((event) => event.id === selectedEventId) ?? null;
  const sortedEvents = [...events].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={actions.refresh} tintColor={colors.positive} colors={[colors.positive]} />
        }
        style={styles.scrollView}>
        <TopGroupSelector
          groups={groups}
          selectedGroup={selectedGroup}
          currentUser={currentUser}
          visible={groupSelectorVisible}
          onOpen={() => actions.setGroupSelectorVisible(true)}
          onClose={() => actions.setGroupSelectorVisible(false)}
          onOpenInvite={() => actions.setInviteVisible(true)}
          onOpenProfile={() => {
            actions.setSelectedMemberId(currentUserId);
            actions.setProfileVisible(true);
          }}
          onCreateGroup={() => actions.setGroupCreationVisible(true)}
          onJoinGroupLink={actions.handleJoinGroupLink}
          onSelectGroup={actions.setSelectedGroupId}
        />

        <SummaryCard
          netCents={dashboard.summary.netCents}
          owedByMeCents={dashboard.summary.owedByMeCents}
          owedToMeCents={dashboard.summary.owedToMeCents}
        />

        <QuickActionsBar
          onCreateEvent={actions.openCreateModal}
          onCreatePayment={() => actions.openPaymentModal(currentUserId, members)}
        />

        <DebtOverviewCard
          owedByMe={dashboard.owedByMe}
          owedToMe={dashboard.owedToMe}
          optimizedTransfers={dashboard.optimizedTransfers}
          onSelectMember={(memberId) => {
            actions.setSelectedMemberId(memberId);
            actions.setProfileVisible(true);
          }}
          onCreatePayment={(memberId, amountCents) => actions.openPaymentModal(currentUserId, members, memberId, amountCents)}
        />
        <EventList events={sortedEvents} currentUserId={currentUserId} onSelectEvent={(event) => actions.setSelectedEventId(event.id)} />
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
            actions.setActiveModal(null);
            actions.setEditingEvent(null);
            actions.setEventPreset(null);
          }}
          onSubmit={actions.handleSubmitEvent}
        />
      )}

      <EventDetailsModal
        event={selectedEvent}
        members={members}
        visible={Boolean(selectedEvent)}
        onClose={() => actions.setSelectedEventId(null)}
        onEdit={actions.handleEditEvent}
        onDelete={actions.handleDeleteEvent}
        onSelectMember={(memberId) => {
          actions.setSelectedEventId(null);
          actions.setSelectedMemberId(memberId);
          actions.setProfileVisible(true);
        }}
      />

      <MemberProfileModal
        visible={state.profileVisible}
        member={selectedMember}
        currentUserId={currentUserId}
        onClose={() => actions.setProfileVisible(false)}
        onSave={actions.handleSaveMember}
        onLogout={actions.handleLogout}
      />

      <InviteModal
        visible={inviteVisible}
        group={selectedGroup}
        inviteLink={derived.inviteLink ?? ''}
        members={members}
        onClose={() => actions.setInviteVisible(false)}
        onLeaveGroup={actions.handleLeaveSelectedGroup}
      />

      <JoinInviteModal
        visible={Boolean(joinPromptGroupId)}
        groupId={joinPromptGroupId}
        onClose={() => actions.setJoinPromptGroupId(null)}
        onJoin={actions.joinPendingGroup}
      />
    </SafeAreaView>
  );
}

function DashboardState({ title, text }: { title: string; text: string }) {
  const colors = useDashboardTheme();
  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.stateContainer}>
        <Text style={styles.stateTitle}>{title}</Text>
        <Text style={styles.stateText}>{text}</Text>
      </View>
    </SafeAreaView>
  );
}

function createStyles(colors: ReturnType<typeof useDashboardTheme>) {
  return StyleSheet.create({
    safeArea: {
      backgroundColor: colors.background,
      flex: 1,
    },
    scrollView: {
      backgroundColor: colors.background,
      flex: 1,
    },
    scrollContent: {
      gap: 22,
      paddingBottom: 110,
    },
    stateContainer: {
      flex: 1,
      justifyContent: 'center',
      padding: 28,
    },
    stateTitle: {
      color: colors.text,
      fontSize: 26,
      fontWeight: '900',
      marginBottom: 8,
      textAlign: 'center',
    },
    stateText: {
      color: colors.textMuted,
      fontSize: 15,
      fontWeight: '700',
      lineHeight: 22,
      textAlign: 'center',
    },
  });
}
