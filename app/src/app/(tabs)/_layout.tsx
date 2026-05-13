import { Slot } from 'expo-router';

import AppTabs from '@/components/app-tabs';
import { useDashboardStore } from '@/components/dashboard/DashboardStoreProvider';

export default function TabsLayout() {
  const { state } = useDashboardStore();

  if (state.isRestoringSession || !state.currentUserId) {
    return <Slot />;
  }

  return <AppTabs />;
}
