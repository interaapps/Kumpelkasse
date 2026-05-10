import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';

import { setApiSessionToken } from '@/api/client';
import { fetchDashboard } from '@/api/debt-api';
import { loadCachedDashboard, storeCachedDashboard } from '@/api/dashboard-cache';
import { loadStoredSessionToken } from '@/api/session-storage';

const DASHBOARD_BACKGROUND_TASK = 'kumpelkasse.dashboard-refresh';

TaskManager.defineTask(DASHBOARD_BACKGROUND_TASK, async () => {
  try {
    const token = await loadStoredSessionToken();
    if (!token) {
      return BackgroundTask.BackgroundTaskResult.Success;
    }

    setApiSessionToken(token);
    const cachedDashboard = await loadCachedDashboard();
    const dashboard = await fetchDashboard(cachedDashboard?.selectedGroupId);
    await storeCachedDashboard(dashboard);
    return BackgroundTask.BackgroundTaskResult.Success;
  } catch {
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

export async function syncBackgroundRefreshRegistration(enabled: boolean) {
  if (Platform.OS === 'web') {
    return;
  }

  const available = await TaskManager.isAvailableAsync();
  if (!available) {
    return;
  }

  if (!enabled) {
    await BackgroundTask.unregisterTaskAsync(DASHBOARD_BACKGROUND_TASK);
    return;
  }

  const status = await BackgroundTask.getStatusAsync();
  if (status !== BackgroundTask.BackgroundTaskStatus.Available) {
    return;
  }

  const isRegistered = await TaskManager.isTaskRegisteredAsync(DASHBOARD_BACKGROUND_TASK);
  if (!isRegistered) {
    await BackgroundTask.registerTaskAsync(DASHBOARD_BACKGROUND_TASK, {
      minimumInterval: 60,
    });
  }
}
