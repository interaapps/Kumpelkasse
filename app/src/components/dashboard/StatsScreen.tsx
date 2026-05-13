import { useIsFocused } from '@react-navigation/native';
import { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { DashboardAuthGate, WebScreenShell } from '@/components/dashboard/DashboardSharedScreens';
import { DashboardPageHeader } from '@/components/dashboard/DashboardPageHeader';
import { GameHistoryModal } from '@/components/dashboard/GameHistoryModal';
import { GroupStatsCard } from '@/components/dashboard/GroupStatsCard';
import { InviteModal } from '@/components/dashboard/InviteModal';
import { JoinInviteModal } from '@/components/dashboard/JoinInviteModal';
import { MemberProfileModal } from '@/components/dashboard/MemberProfileModal';
import { TopGroupSelector } from '@/components/dashboard/TopGroupSelector';
import { useDashboardStore } from '@/components/dashboard/DashboardStoreProvider';
import { useDashboardTheme } from '@/components/dashboard/theme';
import { BottomTabInset } from '@/constants/theme';

export function StatsScreen() {
  const [gameHistoryVisible, setGameHistoryVisible] = useState(false);
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();
  const colors = useDashboardTheme();
  const styles = createStyles(colors);
  const { state, actions } = useDashboardStore();
  const dashboard = state.dashboard;
  const currentUserId = state.currentUserId;

  if (!isFocused) {
    return null;
  }

  return (
    <DashboardAuthGate>
      {dashboard && currentUserId ? (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <WebScreenShell>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + BottomTabInset + 28 }]}
              refreshControl={
                <RefreshControl
                  refreshing={state.isRefreshing}
                  onRefresh={actions.refresh}
                  tintColor={colors.positive}
                  colors={[colors.positive]}
                />
              }>
              <DashboardPageHeader>
                <TopGroupSelector
                  groups={dashboard.groups}
                  selectedGroup={dashboard.groups.find((group) => group.id === dashboard.selectedGroupId) ?? dashboard.groups[0]}
                  currentUser={dashboard.members.find((member) => member.id === currentUserId) ?? dashboard.members[0]}
                  visible={state.groupSelectorVisible}
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
              </DashboardPageHeader>
              <View style={styles.body}>
                <GroupStatsCard
                  stats={dashboard.stats}
                  members={dashboard.members}
                  events={dashboard.events}
                  onOpenGameHistory={() => setGameHistoryVisible(true)}
                />
              </View>
            </ScrollView>
          </WebScreenShell>

          <GameHistoryModal
            visible={isFocused && gameHistoryVisible}
            groupId={dashboard.selectedGroupId ?? dashboard.groups[0]?.id ?? ''}
            currentUserId={currentUserId}
            onClose={() => setGameHistoryVisible(false)}
          />

          <MemberProfileModal
            visible={isFocused && state.profileVisible}
            member={dashboard.members.find((member) => member.id === state.selectedMemberId) ?? null}
            groupId={dashboard.selectedGroupId ?? ''}
            currentUserId={currentUserId}
            onClose={() => actions.setProfileVisible(false)}
            onSave={actions.handleSaveMember}
            onLogout={actions.handleLogout}
          />

          <InviteModal
            visible={isFocused && state.inviteVisible}
            group={dashboard.groups.find((group) => group.id === dashboard.selectedGroupId) ?? dashboard.groups[0]}
            inviteLink={dashboard.inviteLink ?? ''}
            members={dashboard.members}
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
    safeArea: { flex: 1, backgroundColor: colors.background },
    content: { paddingTop: 2 },
    body: { gap: 24, paddingTop: 26 },
  });
}
