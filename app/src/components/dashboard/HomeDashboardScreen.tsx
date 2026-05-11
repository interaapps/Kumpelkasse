import { useIsFocused } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { Platform, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { DebtOverviewCard } from '@/components/dashboard/DebtOverviewCard';
import { DashboardAuthGate, WebScreenShell } from '@/components/dashboard/DashboardSharedScreens';
import { DashboardPageHeader } from '@/components/dashboard/DashboardPageHeader';
import { EventDetailsModal } from '@/components/dashboard/EventDetailsModal';
import { EventList } from '@/components/dashboard/EventList';
import { EventModal } from '@/components/dashboard/EventModal';
import { InviteModal } from '@/components/dashboard/InviteModal';
import { JoinInviteModal } from '@/components/dashboard/JoinInviteModal';
import { MemberProfileModal } from '@/components/dashboard/MemberProfileModal';
import { QuickActionsBar } from '@/components/dashboard/QuickActionsBar';
import { SummaryCard } from '@/components/dashboard/SummaryCard';
import { TopGroupSelector } from '@/components/dashboard/TopGroupSelector';
import { useDashboardStore } from '@/components/dashboard/DashboardStoreProvider';
import { useDashboardTheme } from '@/components/dashboard/theme';
import { BottomTabInset } from '@/constants/theme';

export function HomeDashboardScreen() {
  const isFocused = useIsFocused();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useDashboardTheme();
  const styles = createStyles(colors);
  const { state, actions, derived } = useDashboardStore();

  if (!isFocused) {
    return null;
  }

  return (
    <DashboardAuthGate>
      {state.dashboard && state.currentUserId ? (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <WebScreenShell>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={[
                styles.scrollContent,
                { paddingBottom: Platform.OS === 'web' ? 40 : insets.bottom + BottomTabInset + 24 },
              ]}
              refreshControl={
                <RefreshControl
                  refreshing={state.isRefreshing}
                  onRefresh={actions.refresh}
                  tintColor={colors.positive}
                  colors={[colors.positive]}
                />
              }
              style={styles.scrollView}>
              <View style={styles.contentInner}>
                <DashboardPageHeader>
                  <TopGroupSelector
                    groups={state.dashboard.groups}
                    selectedGroup={state.dashboard.groups.find((group) => group.id === state.dashboard?.selectedGroupId) ?? state.dashboard.groups[0]}
                    currentUser={state.dashboard.members.find((member) => member.id === state.currentUserId) ?? state.dashboard.members[0]}
                    visible={state.groupSelectorVisible}
                    onOpen={() => actions.setGroupSelectorVisible(true)}
                    onClose={() => actions.setGroupSelectorVisible(false)}
                    onOpenInvite={() => actions.setInviteVisible(true)}
                    onOpenProfile={() => {
                      actions.setSelectedMemberId(state.currentUserId!);
                      actions.setProfileVisible(true);
                    }}
                    onCreateGroup={() => actions.setGroupCreationVisible(true)}
                    onJoinGroupLink={actions.handleJoinGroupLink}
                    onSelectGroup={actions.setSelectedGroupId}
                  />
                </DashboardPageHeader>

                <SummaryCard
                  netCents={state.dashboard.summary.netCents}
                  owedByMeCents={state.dashboard.summary.owedByMeCents}
                  owedToMeCents={state.dashboard.summary.owedToMeCents}
                />

                <QuickActionsBar
                  onCreateEvent={actions.openCreateModal}
                  onCreatePayment={() => actions.openPaymentModal(state.currentUserId!, state.dashboard!.members)}
                />

                <DebtOverviewCard
                  owedByMe={state.dashboard.owedByMe}
                  owedToMe={state.dashboard.owedToMe}
                  optimizedTransfers={state.dashboard.optimizedTransfers}
                  onSelectMember={(memberId) => {
                    actions.setSelectedMemberId(memberId);
                    actions.setProfileVisible(true);
                  }}
                  onCreatePayment={(memberId, amountCents) =>
                    actions.openPaymentModal(state.currentUserId!, state.dashboard!.members, memberId, amountCents)
                  }
                />

                <EventList
                  events={[...state.dashboard.events].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())}
                  currentUserId={state.currentUserId}
                  onSelectEvent={actions.setSelectedEvent}
                  onShowAll={() => router.navigate('/events')}
                />
              </View>
            </ScrollView>
          </WebScreenShell>

          {isFocused && state.activeModal && (
            <EventModal
              visible={Boolean(state.activeModal)}
              type={state.activeModal}
              groupId={state.dashboard.selectedGroupId ?? state.dashboard.groups[0]?.id ?? ''}
              members={state.dashboard.members}
              currentUserId={state.currentUserId}
              initialEvent={state.editingEvent ?? undefined}
              preset={state.eventPreset ?? undefined}
              onClose={() => {
                actions.setActiveModal(null);
                actions.setEditingEvent(null);
                actions.setEventPreset(null);
              }}
              onSubmit={actions.handleSubmitEvent}
            />
          )}

          <EventDetailsModal
            event={state.selectedEvent}
            members={state.dashboard.members}
            visible={isFocused && Boolean(state.selectedEvent)}
            onClose={() => actions.setSelectedEvent(null)}
            onEdit={actions.handleEditEvent}
            onDelete={actions.handleDeleteEvent}
            onSelectMember={(memberId) => {
              actions.setSelectedEvent(null);
              actions.setSelectedMemberId(memberId);
              actions.setProfileVisible(true);
            }}
          />

          <MemberProfileModal
            visible={isFocused && state.profileVisible}
            member={state.dashboard.members.find((member) => member.id === state.selectedMemberId) ?? null}
            groupId={state.dashboard.selectedGroupId ?? ''}
            currentUserId={state.currentUserId}
            onClose={() => actions.setProfileVisible(false)}
            onSave={actions.handleSaveMember}
            onLogout={actions.handleLogout}
          />

          <InviteModal
            visible={isFocused && state.inviteVisible}
            group={state.dashboard.groups.find((group) => group.id === state.dashboard?.selectedGroupId) ?? state.dashboard.groups[0]}
            inviteLink={derived.inviteLink ?? ''}
            members={state.dashboard.members}
            onClose={() => actions.setInviteVisible(false)}
            onLeaveGroup={actions.handleLeaveSelectedGroup}
          />

          <JoinInviteModal
            visible={isFocused && Boolean(state.joinPromptGroupId)}
            groupId={state.joinPromptGroupId}
            onClose={() => actions.setJoinPromptGroupId(null)}
            onJoin={actions.joinPendingGroup}
          />
        </SafeAreaView>
      ) : null}
    </DashboardAuthGate>
  );
}

function createStyles(colors: ReturnType<typeof useDashboardTheme>) {
  return StyleSheet.create({
    safeArea: {
      backgroundColor: colors.background,
      flex: 1,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {},
    contentInner: {
      gap: 26,
      paddingTop: 2,
    },
  });
}
