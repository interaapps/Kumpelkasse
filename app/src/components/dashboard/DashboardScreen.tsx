import { Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DebtOverviewCard } from '@/components/dashboard/DebtOverviewCard';
import { EventBrowserModal } from '@/components/dashboard/EventBrowserModal';
import { EventDetailsModal } from '@/components/dashboard/EventDetailsModal';
import { EventList } from '@/components/dashboard/EventList';
import { EventModal } from '@/components/dashboard/EventModal';
import { GameHistoryModal } from '@/components/dashboard/GameHistoryModal';
import { GroupStatsCard } from '@/components/dashboard/GroupStatsCard';
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
import { Member } from '@/types/debt';

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
  const [gameHistoryVisible, setGameHistoryVisible] = useState(false);
  const [hasSkippedGroupOnboarding, setHasSkippedGroupOnboarding] = useState(false);
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
    selectedEvent,
    eventBrowserVisible,
    selectedMemberId,
  } = state;

  if (isRestoringSession) {
    return <DashboardState title="Session wird geladen" text="Wir schauen kurz nach, ob du noch eingeloggt bist." />;
  }

  if (!currentUserId) {
    return (
      <WebScreenShell>
        <LoginScreen
          onLogin={actions.handleLogin}
          onRegister={actions.handleRegister}
          onInteraAppsLogin={actions.handleInteraAppsLogin}
        />
      </WebScreenShell>
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
        <WebScreenShell>
          {hasSkippedGroupOnboarding && currentUser ? (
            <EmptyGroupsState
              user={currentUser}
              selectorVisible={groupSelectorVisible}
              onOpenSelector={() => actions.setGroupSelectorVisible(true)}
              onCloseSelector={() => actions.setGroupSelectorVisible(false)}
              onOpenProfile={() => {
                actions.setSelectedMemberId(currentUserId);
                actions.setProfileVisible(true);
              }}
              onCreateGroup={() => setHasSkippedGroupOnboarding(false)}
              onJoinGroupLink={actions.handleJoinGroupLink}
            />
          ) : (
            <GroupOnboardingScreen
              userName={currentUser?.name ?? 'du'}
              onCreateGroup={actions.handleCreateGroup}
              onSkip={() => setHasSkippedGroupOnboarding(true)}
            />
          )}
        </WebScreenShell>
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
      <WebScreenShell>
        <GroupOnboardingScreen
          userName={currentUser?.name ?? 'du'}
          onCancel={() => actions.setGroupCreationVisible(false)}
          onCreateGroup={actions.handleCreateGroup}
        />
      </WebScreenShell>
    );
  }

  const groups = dashboard.groups;
  const members = dashboard.members;
  const events = dashboard.events;
  const selectedGroup = groups.find((group) => group.id === dashboard.selectedGroupId) ?? groups[0];
  const currentUser = members.find((member) => member.id === currentUserId) ?? members[0];
  const selectedMember = members.find((member) => member.id === selectedMemberId) ?? null;
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
        <View style={styles.contentInner}>
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
          <EventList
            events={sortedEvents}
            currentUserId={currentUserId}
            onSelectEvent={actions.setSelectedEvent}
            onShowAll={() => actions.setEventBrowserVisible(true)}
          />

          <GroupStatsCard stats={dashboard.stats} onOpenGameHistory={() => setGameHistoryVisible(true)} />
        </View>
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
        onClose={() => actions.setSelectedEvent(null)}
        onEdit={actions.handleEditEvent}
        onDelete={actions.handleDeleteEvent}
        onSelectMember={(memberId) => {
          actions.setSelectedEvent(null);
          actions.setSelectedMemberId(memberId);
          actions.setProfileVisible(true);
        }}
      />

      <EventBrowserModal
        visible={eventBrowserVisible}
        groupId={selectedGroup.id}
        currentUserId={currentUserId}
        onClose={() => actions.setEventBrowserVisible(false)}
        onSelectEvent={actions.setSelectedEvent}
      />

      <GameHistoryModal
        visible={gameHistoryVisible}
        groupId={selectedGroup.id}
        currentUserId={currentUserId}
        onClose={() => setGameHistoryVisible(false)}
      />

      <MemberProfileModal
        visible={state.profileVisible}
        member={selectedMember}
        groupId={selectedGroup.id}
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
      <WebScreenShell>
        <View style={styles.stateContainer}>
          <Text style={styles.stateTitle}>{title}</Text>
          <Text style={styles.stateText}>{text}</Text>
        </View>
      </WebScreenShell>
    </SafeAreaView>
  );
}

function EmptyGroupsState({
  user,
  selectorVisible,
  onOpenSelector,
  onCloseSelector,
  onOpenProfile,
  onCreateGroup,
  onJoinGroupLink,
}: {
  user: Member;
  selectorVisible: boolean;
  onOpenSelector: () => void;
  onCloseSelector: () => void;
  onOpenProfile: () => void;
  onCreateGroup: () => void;
  onJoinGroupLink: (link: string) => void;
}) {
  const colors = useDashboardTheme();
  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.emptyStateLayout}>
        <View style={styles.emptyHeader}>
          <TopGroupSelector
            groups={[]}
            selectedGroup={null}
            currentUser={user}
            visible={selectorVisible}
            onOpen={onOpenSelector}
            onClose={onCloseSelector}
            onOpenInvite={onCreateGroup}
            onOpenProfile={onOpenProfile}
            onCreateGroup={onCreateGroup}
            onJoinGroupLink={onJoinGroupLink}
            onSelectGroup={() => {}}
          />
        </View>
        <View style={styles.emptyContent}>
          <Text style={styles.stateTitle}>Noch keine Gruppe, {user.name}.</Text>
          <Text style={styles.stateText}>
            Du kannst Kumpelkasse auch erstmal ohne eigene Gruppe starten. Sobald du einen Einladungslink öffnest oder
            doch selbst loslegen willst, geht es hier weiter.
          </Text>
          <Pressable style={({ pressed }) => [styles.primaryStateButton, pressed && styles.pressed]} onPress={onCreateGroup}>
            <Text style={styles.primaryStateButtonText}>Jetzt Gruppe erstellen</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

function WebScreenShell({ children }: { children: React.ReactNode }) {
  return <View style={stylesStatic.webShell}>{children}</View>;
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
      alignItems: 'center',
      gap: 22,
      paddingBottom: 110,
    },
    contentInner: {
      gap: 22,
      maxWidth: Platform.OS === 'web' ? 920 : '100%',
      width: '100%',
    },
    stateContainer: {
      flex: 1,
      justifyContent: 'center',
      padding: 28,
      width: '100%',
    },
    emptyStateLayout: {
      flex: 1,
      width: '100%',
    },
    emptyHeader: {
      zIndex: 2,
    },
    emptyContent: {
      flex: 1,
      justifyContent: 'center',
      padding: 28,
      width: '100%',
      zIndex: 1,
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
    primaryStateButton: {
      alignItems: 'center',
      alignSelf: 'center',
      backgroundColor: colors.button,
      borderRadius: 999,
      justifyContent: 'center',
      marginTop: 18,
      minHeight: 52,
      minWidth: 220,
      paddingHorizontal: 24,
    },
    primaryStateButtonText: {
      color: colors.buttonText,
      fontSize: 15,
      fontWeight: '900',
    },
    pressed: {
      opacity: 0.72,
    },
  });
}

const stylesStatic = StyleSheet.create({
  webShell: {
    alignSelf: 'center',
    flex: 1,
    maxWidth: Platform.OS === 'web' ? 920 : '100%',
    width: '100%',
  },
});
