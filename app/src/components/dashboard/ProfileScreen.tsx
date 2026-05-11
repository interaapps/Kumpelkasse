import { useIsFocused } from '@react-navigation/native';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DashboardState, WebScreenShell } from '@/components/dashboard/DashboardSharedScreens';
import { MemberProfileModal } from '@/components/dashboard/MemberProfileModal';
import { useDashboardStore } from '@/components/dashboard/DashboardStoreProvider';
import { useDashboardTheme } from '@/components/dashboard/theme';

export function ProfileScreen() {
  const isFocused = useIsFocused();
  const colors = useDashboardTheme();
  const styles = createStyles(colors);
  const { state, actions } = useDashboardStore();
  const member = state.dashboard?.members.find((entry) => entry.id === state.currentUserId) ?? null;

  if (!isFocused) {
    return null;
  }

  if (state.isRestoringSession) {
    return <DashboardState title="Session wird geladen" text="Wir schauen kurz nach, ob du noch eingeloggt bist." />;
  }

  if (!state.currentUserId) {
    return <DashboardState title="Nicht eingeloggt" text="Melde dich an, um dein Profil zu sehen." />;
  }

  if (!state.dashboard) {
    return (
      <DashboardState
        title={state.isLoadingDashboard ? 'Profil wird geladen' : 'Backend nicht erreichbar'}
        text={state.errorMessage ?? 'Die App verbindet sich mit der Kumpelkasse-API.'}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <WebScreenShell>
        <MemberProfileModal
          visible
          member={member}
          groupId={state.dashboard.selectedGroupId ?? ''}
          currentUserId={state.currentUserId}
          onClose={() => {}}
          onSave={actions.handleSaveMember}
          onLogout={actions.handleLogout}
          presentation="screen"
        />
      </WebScreenShell>
    </SafeAreaView>
  );
}

function createStyles(colors: ReturnType<typeof useDashboardTheme>) {
  return StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
  });
}
