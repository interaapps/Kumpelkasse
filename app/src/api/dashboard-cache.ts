import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { DashboardResponse, normalizeDashboardResponse } from '@/types/debt';

const DASHBOARD_CACHE_KEY = 'kumpelkasse.dashboardCache';

export async function loadCachedDashboard() {
  const raw = await getStoredValue(DASHBOARD_CACHE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return normalizeDashboardResponse(JSON.parse(raw) as DashboardResponse);
  } catch {
    return null;
  }
}

export async function storeCachedDashboard(dashboard: DashboardResponse) {
  await setStoredValue(DASHBOARD_CACHE_KEY, JSON.stringify(normalizeDashboardResponse(dashboard)));
}

export async function clearCachedDashboard() {
  await removeStoredValue(DASHBOARD_CACHE_KEY);
}

async function getStoredValue(key: string) {
  if (Platform.OS === 'web') {
    return getWebStorage()?.getItem(key) ?? null;
  }

  return SecureStore.getItemAsync(key);
}

async function setStoredValue(key: string, value: string) {
  if (Platform.OS === 'web') {
    getWebStorage()?.setItem(key, value);
    return;
  }

  await SecureStore.setItemAsync(key, value);
}

async function removeStoredValue(key: string) {
  if (Platform.OS === 'web') {
    getWebStorage()?.removeItem(key);
    return;
  }

  await SecureStore.deleteItemAsync(key);
}

function getWebStorage(): Storage | null {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage;
}
