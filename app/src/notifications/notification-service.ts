import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { DashboardResponse, Member } from '@/types/debt';
import { formatEuro } from '@/utils/debt';

const DAILY_REMINDER_IDENTIFIER = 'kumpelkasse.daily-reminder';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function syncNotificationPreferences(member: Member, dashboard: DashboardResponse | null) {
  if (Platform.OS === 'web') {
    return;
  }

  if (!member.notificationsEnabled || !dashboard) {
    await cancelDebtReminderNotifications();
    return;
  }

  const granted = await ensureNotificationPermissions();
  if (!granted) {
    return;
  }

  await cancelDebtReminderNotifications();

  const body =
    dashboard.summary.netCents >= 0
      ? `Du bekommst aktuell ${formatEuro(dashboard.summary.owedToMeCents)}.`
      : `Du schuldest aktuell ${formatEuro(dashboard.summary.owedByMeCents)}.`;

  await Notifications.scheduleNotificationAsync({
    identifier: DAILY_REMINDER_IDENTIFIER,
    content: {
      title: 'Kumpelkasse Erinnerung',
      body,
      data: { screen: 'dashboard' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: member.notificationHour ?? 20,
      minute: 0,
    },
  });
}

async function ensureNotificationPermissions() {
  const existing = await Notifications.getPermissionsAsync();
  if (existing.granted || existing.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) {
    return true;
  }

  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted || requested.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
}

async function cancelDebtReminderNotifications() {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((entry) => entry.identifier === DAILY_REMINDER_IDENTIFIER)
      .map((entry) => Notifications.cancelScheduledNotificationAsync(entry.identifier)),
  );
}
