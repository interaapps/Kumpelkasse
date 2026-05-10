import { useEffect, useRef, useState } from 'react';
import { Alert, AppState, Linking } from 'react-native';

import {
  createEvent,
  createGroup,
  deleteEvent,
  fetchDashboard,
  joinGroup,
  leaveGroup,
  login,
  loginWithInteraAppsOidc,
  logout,
  register,
  restoreSession,
  updateEvent,
  updateMember,
} from '@/api/debt-api';
import { clearCachedDashboard, loadCachedDashboard, storeCachedDashboard } from '@/api/dashboard-cache';
import { authorizeWithInteraApps } from '@/api/interaapps-oidc';
import { setApiSessionToken } from '@/api/client';
import { clearStoredSessionToken, loadStoredSessionToken, storeSessionToken } from '@/api/session-storage';
import { syncBackgroundRefreshRegistration } from '@/background/dashboard-background-task';
import { EventModalType } from '@/components/dashboard/EventModal';
import { getInviteLink, parseInviteGroupId } from '@/components/dashboard/utils/invite-links';
import { DashboardResponse, DebtEvent, Member } from '@/types/debt';
import { syncNotificationPreferences } from '@/notifications/notification-service';

type EventPreset = {
  amountCents?: number;
  fromMemberId?: string;
  toMemberId?: string;
};

export function useDashboardController() {
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
  const [eventBrowserVisible, setEventBrowserVisible] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<DebtEvent | null>(null);
  const [editingEvent, setEditingEvent] = useState<DebtEvent | null>(null);
  const [eventPreset, setEventPreset] = useState<EventPreset | null>(null);
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
        const cachedDashboard = await loadCachedDashboard();
        if (active && cachedDashboard) {
          setDashboard(cachedDashboard);
          setCurrentUserId(cachedDashboard.currentUserId);
          setSelectedGroupId(cachedDashboard.selectedGroupId);
          setSelectedMemberId(cachedDashboard.currentUserId);
        }
        const session = await restoreSession();
        if (active) {
          setCurrentUserId(session.currentUserId);
          setSelectedMemberId(session.currentUserId);
        }
      } catch {
        setApiSessionToken(null);
        await clearStoredSessionToken();
        await clearCachedDashboard();
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
      const groupId = parseInviteGroupId(await Linking.getInitialURL());
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

    setJoinPromptGroupId(pendingInviteGroupId);
    setPendingInviteGroupId(null);
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
          await applyDashboard(nextDashboard);
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
    await applyDashboard(nextDashboard);
    setErrorMessage(null);
  }

  async function applyDashboard(nextDashboard: DashboardResponse) {
    setDashboard(nextDashboard);
    setSelectedGroupId(nextDashboard.selectedGroupId);
    setSelectedMemberId((current) => current ?? nextDashboard.currentUserId);
    await storeCachedDashboard(nextDashboard);

    const currentMember = nextDashboard.members.find((member) => member.id === nextDashboard.currentUserId);
    if (currentMember) {
      await Promise.allSettled([
        syncNotificationPreferences(currentMember, nextDashboard),
        syncBackgroundRefreshRegistration(currentMember.backgroundRefreshEnabled ?? false),
      ]);
    }
  }

  async function refresh() {
    setIsRefreshing(true);
    try {
      await reloadDashboard();
    } catch {
      setErrorMessage('Aktualisierung fehlgeschlagen. Prüfe bitte, ob die API erreichbar ist.');
    } finally {
      setIsRefreshing(false);
    }
  }

  async function completeLogin(result: { sessionToken: string; currentUserId: string }) {
    setApiSessionToken(result.sessionToken);
    await storeSessionToken(result.sessionToken);
    setCurrentUserId(result.currentUserId);
    setSelectedMemberId(result.currentUserId);
    setSelectedGroupId(null);
  }

  async function handleLogin(email: string, password: string) {
    await completeLogin(await login(email, password));
  }

  async function handleRegister(email: string, password: string, name: string) {
    await completeLogin(await register(email, password, name));
  }

  async function handleInteraAppsLogin() {
    const authorization = await authorizeWithInteraApps();
    await completeLogin(
      await loginWithInteraAppsOidc(authorization.code, authorization.redirectUri, authorization.codeVerifier),
    );
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
      Alert.alert('Ungültiger Link', 'Bitte füge einen Link wie https://kumpelkasse.interaapps.de/invite/... ein.');
      return;
    }
    setJoinPromptGroupId(groupId);
  }

  async function joinPendingGroup(groupId: string) {
    try {
      await handleJoinGroup(groupId);
      setJoinPromptGroupId(null);
    } catch {
      Alert.alert('Beitritt fehlgeschlagen', 'Der Einladungslink ist ungültig oder die API ist nicht erreichbar.');
    }
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
    await clearCachedDashboard();
    await syncBackgroundRefreshRegistration(false);
    setCurrentUserId(null);
    setSelectedGroupId(null);
    setDashboard(null);
    setErrorMessage(null);
    setGroupSelectorVisible(false);
    setInviteVisible(false);
    setGroupCreationVisible(false);
    setProfileVisible(false);
    setSelectedMemberId(null);
    setSelectedEvent(null);
    setEditingEvent(null);
    setEventPreset(null);
    setEventBrowserVisible(false);
    setActiveModal(null);
  }

  function openCreateModal(type: EventModalType) {
    setEditingEvent(null);
    setEventPreset(null);
    setActiveModal(type);
  }

  function openPaymentModal(activeUserId: string, members: Member[], toMemberId?: string, amountCents?: number) {
    setEditingEvent(null);
    setEventPreset({
      amountCents,
      fromMemberId: activeUserId,
      toMemberId: toMemberId ?? members.find((member) => member.id !== activeUserId)?.id,
    });
    setActiveModal('payment');
  }

  function handleEditEvent(event: DebtEvent) {
    setSelectedEvent(null);
    setEditingEvent(event);
    setActiveModal(event.type);
  }

  async function handleDeleteEvent(eventId: string) {
    await deleteEvent(eventId);
    await reloadDashboard();
    setSelectedEvent(null);
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

  async function handleSaveMember(member: Member) {
    await updateMember(member);
    await reloadDashboard();
  }

  return {
    state: {
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
      profileVisible,
      eventBrowserVisible,
      currentUserId,
      selectedEvent,
      selectedGroupId,
      selectedMemberId,
    },
    actions: {
      handleCreateGroup,
      handleDeleteEvent,
      handleEditEvent,
      handleInteraAppsLogin,
      handleJoinGroupLink,
      handleLeaveSelectedGroup,
      handleLogin,
      handleLogout,
      handleRegister,
      handleSaveMember,
      handleSubmitEvent,
      joinPendingGroup,
      openCreateModal,
      openPaymentModal,
      refresh,
      setActiveModal,
      setEditingEvent,
      setEventBrowserVisible,
      setEventPreset,
      setGroupCreationVisible,
      setGroupSelectorVisible,
      setInviteVisible,
      setJoinPromptGroupId,
      setProfileVisible,
      setSelectedEvent,
      setSelectedGroupId,
      setSelectedMemberId,
    },
    derived: {
      inviteLink: dashboard?.selectedGroupId ? (dashboard.inviteLink ?? getInviteLink(dashboard.selectedGroupId)) : null,
    },
  };
}
