import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GroupOnboardingScreen } from '@/components/dashboard/GroupOnboardingScreen';
import { JoinInviteModal } from '@/components/dashboard/JoinInviteModal';
import { LoginScreen } from '@/components/dashboard/LoginScreen';
import { MemberProfileModal } from '@/components/dashboard/MemberProfileModal';
import { DashboardPageHeader } from '@/components/dashboard/DashboardPageHeader';
import { TopGroupSelector } from '@/components/dashboard/TopGroupSelector';
import { useDashboardStore } from '@/components/dashboard/DashboardStoreProvider';
import { DashboardColors, useDashboardTheme } from '@/components/dashboard/theme';
import { Member } from '@/types/debt';

export function DashboardAuthGate({ children }: { children: React.ReactNode }) {
  const { state, actions, uiState, uiActions } = useDashboardStore();
  const { currentUserId, dashboard, isLoadingDashboard, isRestoringSession, errorMessage, groupSelectorVisible } = state;

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
          {uiState.hasSkippedGroupOnboarding && currentUser ? (
            <EmptyGroupsState
              user={currentUser}
              selectorVisible={groupSelectorVisible}
              onOpenSelector={() => actions.setGroupSelectorVisible(true)}
              onCloseSelector={() => actions.setGroupSelectorVisible(false)}
              onOpenProfile={() => {
                actions.setSelectedMemberId(currentUserId);
                actions.setProfileVisible(true);
              }}
              onCreateGroup={() => uiActions.setHasSkippedGroupOnboarding(false)}
              onJoinGroupLink={actions.handleJoinGroupLink}
            />
          ) : (
            <GroupOnboardingScreen
              userName={currentUser?.name ?? 'du'}
              onCreateGroup={actions.handleCreateGroup}
              onSkip={() => uiActions.setHasSkippedGroupOnboarding(true)}
            />
          )}
        </WebScreenShell>
        <JoinInviteModal
          visible={Boolean(state.joinPromptGroupId)}
          groupId={state.joinPromptGroupId}
          onClose={() => actions.setJoinPromptGroupId(null)}
          onJoin={actions.joinPendingGroup}
        />
        <MemberProfileModal
          visible={state.profileVisible}
          member={currentUser ?? null}
          groupId=""
          currentUserId={currentUserId}
          onClose={() => actions.setProfileVisible(false)}
          onSave={actions.handleSaveMember}
          onLogout={actions.handleLogout}
        />
      </>
    );
  }

  if (state.groupCreationVisible) {
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

  return <>{children}</>;
}

export function DashboardState({ title, text }: { title: string; text: string }) {
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
            <DashboardPageHeader>
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
            </DashboardPageHeader>
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

export function WebScreenShell({ children }: { children: React.ReactNode }) {
  return <View style={stylesStatic.webShell}>{children}</View>;
}

function createStyles(colors: DashboardColors) {
  return StyleSheet.create({
    safeArea: {
      backgroundColor: colors.background,
      flex: 1,
    },
    stateContainer: {
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: 28,
      paddingVertical: 32,
    },
    stateTitle: {
      color: colors.text,
      fontSize: 28,
      fontWeight: '900',
      letterSpacing: -0.8,
    },
    stateText: {
      color: colors.textMuted,
      fontSize: 15,
      fontWeight: '700',
      lineHeight: 22,
      marginTop: 8,
    },
    emptyStateLayout: {
      flex: 1,
    },
    emptyHeader: {
      paddingTop: 2,
    },
    emptyContent: {
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: 28,
      paddingBottom: 48,
    },
    primaryStateButton: {
      alignItems: 'center',
      backgroundColor: colors.positive,
      borderRadius: 999,
      marginTop: 22,
      minHeight: 52,
      justifyContent: 'center',
      paddingHorizontal: 24,
      alignSelf: 'flex-start',
    },
    primaryStateButtonText: {
      color: '#ffffff',
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
    flex: 1,
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 920 : undefined,
    alignSelf: 'center',
  },
});
