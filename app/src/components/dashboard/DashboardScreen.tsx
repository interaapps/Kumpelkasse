import { useEffect, useRef, useState } from 'react';
import { Alert, AppState, Linking, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  createEvent,
  createGroup,
  deleteEvent,
  fetchDashboard,
  joinGroup,
  leaveGroup,
  login,
  logout,
  register,
  restoreSession,
  updateEvent,
  updateMember,
} from '@/api/debt-api';
import { setApiSessionToken } from '@/api/client';
import { clearStoredSessionToken, loadStoredSessionToken, storeSessionToken } from '@/api/session-storage';
import { DebtOverviewCard } from '@/components/dashboard/DebtOverviewCard';
import { EventDetailsModal } from '@/components/dashboard/EventDetailsModal';
import { EventList } from '@/components/dashboard/EventList';
import { EventModal, EventModalType } from '@/components/dashboard/EventModal';
import { GroupOnboardingScreen } from '@/components/dashboard/GroupOnboardingScreen';
import { InviteModal } from '@/components/dashboard/InviteModal';
import { LoginScreen } from '@/components/dashboard/LoginScreen';
import { MemberProfileModal } from '@/components/dashboard/MemberProfileModal';
import { QuickActionButton } from '@/components/dashboard/QuickActionButton';
import { SummaryCard } from '@/components/dashboard/SummaryCard';
import { DashboardThemeContext, dashboardThemes, useDashboardTheme } from '@/components/dashboard/theme';
import { TopGroupSelector } from '@/components/dashboard/TopGroupSelector';
import { DashboardResponse, DebtEvent } from '@/types/debt';

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
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isRestoringSession, setIsRestoringSession] = useState(true);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [groupSelectorVisible, setGroupSelectorVisible] = useState(false);
  const [inviteVisible, setInviteVisible] = useState(false);
  const [groupCreationVisible, setGroupCreationVisible] = useState(false);
  const [profileVisible, setProfileVisible] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [editingEvent, setEditingEvent] = useState<DebtEvent | null>(null);
  const [eventPreset, setEventPreset] = useState<{
    amountCents?: number;
    fromMemberId?: string;
    toMemberId?: string;
  } | null>(null);
  const [activeModal, setActiveModal] = useState<EventModalType | null>(null);
  const [pendingInviteGroupId, setPendingInviteGroupId] = useState<string | null>(null);
  const [joinPromptGroupId, setJoinPromptGroupId] = useState<string | null>(null);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    let active = true;

    async function restoreLogin() {
      try {
        const token = await loadStoredSessionToken();
        if (!token) {
          return;
        }

        setApiSessionToken(token);
        const session = await restoreSession();
        if (active) {
          setCurrentUserId(session.currentUserId);
          setSelectedMemberId(session.currentUserId);
        }
      } catch {
        setApiSessionToken(null);
        await clearStoredSessionToken();
      } finally {
        if (active) {
          setIsRestoringSession(false);
        }
      }
    }

    restoreLogin();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    async function loadInitialInvite() {
      const url = await Linking.getInitialURL();
      const groupId = parseInviteGroupId(url);
      if (groupId) {
        setPendingInviteGroupId(groupId);
      }
    }

    const subscription = Linking.addEventListener('url', ({ url }) => {
      const groupId = parseInviteGroupId(url);
      if (groupId) {
        setPendingInviteGroupId(groupId);
      }
    });

    loadInitialInvite();

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (!currentUserId || !pendingInviteGroupId) {
      return;
    }

    const groupId = pendingInviteGroupId;
    setPendingInviteGroupId(null);
    setJoinPromptGroupId(groupId);
  }, [currentUserId, pendingInviteGroupId]);

  useEffect(() => {
    if (!currentUserId) {
      return;
    }

    let active = true;

    async function load() {
      setIsLoadingDashboard(true);
      setErrorMessage(null);

      try {
        const nextDashboard = await fetchDashboard(selectedGroupId);
        if (active) {
          setDashboard(nextDashboard);
          setSelectedGroupId(nextDashboard.selectedGroupId);
          setSelectedMemberId((current) => current ?? nextDashboard.currentUserId);
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
  }, [currentUserId, selectedGroupId]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      const wasAway = appState.current === 'background' || appState.current === 'inactive';
      appState.current = nextState;

      if (wasAway && nextState === 'active' && currentUserId) {
        reloadDashboard().catch(() => {
          setErrorMessage('Aktualisierung fehlgeschlagen. Prüfe bitte, ob die API erreichbar ist.');
        });
      }
    });

    return () => subscription.remove();
  }, [currentUserId, selectedGroupId]);

  async function reloadDashboard(nextGroupId = selectedGroupId) {
    if (!currentUserId) {
      return;
    }
    const nextDashboard = await fetchDashboard(nextGroupId);
    setDashboard(nextDashboard);
    setSelectedGroupId(nextDashboard.selectedGroupId);
    setErrorMessage(null);
  }

  async function handleRefresh() {
    setIsRefreshing(true);
    try {
      await reloadDashboard();
    } catch {
      setErrorMessage('Aktualisierung fehlgeschlagen. Prüfe bitte, ob die API erreichbar ist.');
    } finally {
      setIsRefreshing(false);
    }
  }

  async function handleLogin(email: string, password: string) {
    const result = await login(email, password);
    setApiSessionToken(result.sessionToken);
    await storeSessionToken(result.sessionToken);
    setCurrentUserId(result.currentUserId);
    setSelectedMemberId(result.currentUserId);
    setSelectedGroupId(null);
  }

  async function handleRegister(email: string, password: string, name: string) {
    const result = await register(email, password, name);
    setApiSessionToken(result.sessionToken);
    await storeSessionToken(result.sessionToken);
    setCurrentUserId(result.currentUserId);
    setSelectedMemberId(result.currentUserId);
    setSelectedGroupId(null);
  }

  async function handleCreateGroup(name: string) {
    if (!currentUserId) {
      return;
    }
    const group = await createGroup(name);
    setSelectedGroupId(group.id);
    setGroupCreationVisible(false);
    await reloadDashboard(group.id);
  }

  async function handleJoinGroup(groupId: string) {
    const group = await joinGroup(groupId);
    setSelectedGroupId(group.id);
    await reloadDashboard(group.id);
  }

  function handleJoinGroupLink(link: string) {
    const groupId = parseInviteGroupId(link);
    if (!groupId) {
      Alert.alert('Ungültiger Link', 'Bitte füge einen Link wie https://owe.interaapps.de/invite/... ein.');
      return;
    }
    setJoinPromptGroupId(groupId);
  }

  async function handleLeaveSelectedGroup() {
    const groupId = dashboard?.selectedGroupId ?? selectedGroupId;
    if (!groupId) {
      return;
    }

    try {
      await leaveGroup(groupId);
      setInviteVisible(false);
      setSelectedGroupId(null);
      await reloadDashboard(null);
    } catch {
      Alert.alert('Verlassen fehlgeschlagen', 'Die Gruppe konnte nicht verlassen werden. Bitte versuche es erneut.');
    }
  }

  async function handleLogout() {
    try {
      await logout();
    } catch {
      // Local logout should still work if the API is temporarily unreachable.
    }
    setApiSessionToken(null);
    await clearStoredSessionToken();
    setCurrentUserId(null);
    setSelectedGroupId(null);
    setDashboard(null);
    setErrorMessage(null);
    setGroupSelectorVisible(false);
    setInviteVisible(false);
    setGroupCreationVisible(false);
    setProfileVisible(false);
    setSelectedMemberId(null);
    setSelectedEventId(null);
    setEditingEvent(null);
    setEventPreset(null);
    setActiveModal(null);
  }

  if (isRestoringSession) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.stateContainer}>
          <Text style={styles.stateTitle}>Session wird geladen</Text>
          <Text style={styles.stateText}>Wir schauen kurz nach, ob du noch eingeloggt bist.</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!currentUserId) {
    return <LoginScreen onLogin={handleLogin} onRegister={handleRegister} />;
  }

  if (!dashboard) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.stateContainer}>
          <Text style={styles.stateTitle}>{isLoadingDashboard ? 'Dashboard wird geladen' : 'Backend nicht erreichbar'}</Text>
          <Text style={styles.stateText}>{errorMessage ?? 'Die App verbindet sich mit der Wir-schulden-API.'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (dashboard.groups.length === 0) {
    const currentUser = dashboard.members.find((member) => member.id === currentUserId);
    return (
      <>
        <GroupOnboardingScreen userName={currentUser?.name ?? 'du'} onCreateGroup={handleCreateGroup} />
        <JoinInviteModal
          visible={Boolean(joinPromptGroupId)}
          groupId={joinPromptGroupId}
          onClose={() => setJoinPromptGroupId(null)}
          onJoin={async (groupId) => {
            try {
              await handleJoinGroup(groupId);
              setJoinPromptGroupId(null);
            } catch {
              Alert.alert('Beitritt fehlgeschlagen', 'Der Einladungslink ist ungültig oder die API ist nicht erreichbar.');
            }
          }}
        />
      </>
    );
  }

  if (groupCreationVisible) {
    const currentUser = dashboard.members.find((member) => member.id === currentUserId);
    return (
      <GroupOnboardingScreen
        userName={currentUser?.name ?? 'du'}
        onCancel={() => setGroupCreationVisible(false)}
        onCreateGroup={handleCreateGroup}
      />
    );
  }

  const activeUserId = currentUserId;
  const groups = dashboard.groups;
  const members = dashboard.members;
  const events = dashboard.events;
  const selectedGroup = groups.find((group) => group.id === dashboard.selectedGroupId) ?? groups[0];
  const currentUser = members.find((member) => member.id === currentUserId) ?? members[0];
  const selectedMember = members.find((member) => member.id === selectedMemberId) ?? null;
  const selectedEvent = events.find((event) => event.id === selectedEventId) ?? null;
  const sortedEvents = [...events].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  const inviteLink = dashboard.inviteLink ?? `https://owe.interaapps.de/invite/${selectedGroup.id}`;

  function openCreateModal(type: EventModalType) {
    setEditingEvent(null);
    setEventPreset(null);
    setActiveModal(type);
  }

  function openPaymentModal(toMemberId?: string, amountCents?: number) {
    setEditingEvent(null);
    setEventPreset({
      amountCents,
      fromMemberId: activeUserId,
      toMemberId: toMemberId ?? members.find((member) => member.id !== activeUserId)?.id,
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
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.positive}
            colors={[colors.positive]}
          />
        }
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
          onCreateGroup={() => setGroupCreationVisible(true)}
          onJoinGroupLink={handleJoinGroupLink}
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
          optimizedTransfers={dashboard.optimizedTransfers}
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
        onLogout={handleLogout}
      />

      <InviteModal
        visible={inviteVisible}
        group={selectedGroup}
        inviteLink={inviteLink}
        members={members}
        onClose={() => setInviteVisible(false)}
        onLeaveGroup={handleLeaveSelectedGroup}
      />

      <JoinInviteModal
        visible={Boolean(joinPromptGroupId)}
        groupId={joinPromptGroupId}
        onClose={() => setJoinPromptGroupId(null)}
        onJoin={async (groupId) => {
          try {
            await handleJoinGroup(groupId);
            setJoinPromptGroupId(null);
          } catch {
            Alert.alert('Beitritt fehlgeschlagen', 'Der Einladungslink ist ungültig oder die API ist nicht erreichbar.');
          }
        }}
      />
    </SafeAreaView>
  );
}

function parseInviteGroupId(value?: string | null) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();

  try {
    const url = new URL(trimmed);
    const pathMatch = url.pathname.match(/\/?invite\/([^/?#]+)/i);
    if (pathMatch?.[1]) {
      return decodeURIComponent(pathMatch[1]);
    }
  } catch {
    // Fall through to relaxed matching for pasted partial links.
  }

  const match = trimmed.match(/(?:^|\/)invite\/([^/?#]+)/i);
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

function JoinInviteModal({
  visible,
  groupId,
  onClose,
  onJoin,
}: {
  visible: boolean;
  groupId: string | null;
  onClose: () => void;
  onJoin: (groupId: string) => void | Promise<void>;
}) {
  const colors = useDashboardTheme();
  const styles = createStyles(colors);

  if (!groupId) {
    return null;
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.joinPrompt}>
          <Text style={styles.joinPromptEyebrow}>Einladung</Text>
          <Text style={styles.joinPromptTitle}>Gruppe beitreten?</Text>
          <Text style={styles.joinPromptText}>
            Du wurdest zu einer Wir-schulden-Gruppe eingeladen. Möchtest du dieser Gruppe beitreten?
          </Text>
          <View style={styles.joinPromptActions}>
            <Pressable style={({ pressed }) => [styles.joinCancelButton, pressed && styles.pressed]} onPress={onClose}>
              <Text style={styles.joinCancelText}>Abbrechen</Text>
            </Pressable>
            <Pressable style={({ pressed }) => [styles.joinConfirmButton, pressed && styles.pressed]} onPress={() => onJoin(groupId)}>
              <Text style={styles.joinConfirmText}>Beitreten</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
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
    pressed: {
      opacity: 0.72,
    },
    joinPrompt: {
      backgroundColor: colors.card,
      borderRadius: 32,
      gap: 14,
      margin: 20,
      marginTop: 80,
      padding: 22,
    },
    joinPromptEyebrow: {
      color: colors.positive,
      fontSize: 13,
      fontWeight: '900',
      letterSpacing: 0.7,
      textTransform: 'uppercase',
    },
    joinPromptTitle: {
      color: colors.text,
      fontSize: 30,
      fontWeight: '900',
      letterSpacing: -0.8,
    },
    joinPromptText: {
      color: colors.textMuted,
      fontSize: 16,
      fontWeight: '700',
      lineHeight: 23,
    },
    joinPromptActions: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 8,
    },
    joinCancelButton: {
      alignItems: 'center',
      backgroundColor: colors.cardMuted,
      borderRadius: 999,
      flex: 1,
      justifyContent: 'center',
      minHeight: 52,
    },
    joinConfirmButton: {
      alignItems: 'center',
      backgroundColor: colors.button,
      borderRadius: 999,
      flex: 1,
      justifyContent: 'center',
      minHeight: 52,
    },
    joinCancelText: {
      color: colors.text,
      fontSize: 15,
      fontWeight: '900',
    },
    joinConfirmText: {
      color: colors.buttonText,
      fontSize: 15,
      fontWeight: '900',
    },
  });
}
