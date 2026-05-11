import React, { createContext, useContext, useMemo, useState } from 'react';

import { useDashboardController } from '@/components/dashboard/hooks/useDashboardController';

type DashboardStoreValue = ReturnType<typeof useDashboardController> & {
  uiState: {
    hasSkippedGroupOnboarding: boolean;
  };
  uiActions: {
    setHasSkippedGroupOnboarding: React.Dispatch<React.SetStateAction<boolean>>;
  };
};

const DashboardStoreContext = createContext<DashboardStoreValue | null>(null);

export function DashboardStoreProvider({ children }: { children: React.ReactNode }) {
  const controller = useDashboardController();
  const [hasSkippedGroupOnboarding, setHasSkippedGroupOnboarding] = useState(false);

  const value = useMemo(
    () => ({
      ...controller,
      uiState: {
        hasSkippedGroupOnboarding,
      },
      uiActions: {
        setHasSkippedGroupOnboarding,
      },
    }),
    [controller, hasSkippedGroupOnboarding],
  );

  return <DashboardStoreContext.Provider value={value}>{children}</DashboardStoreContext.Provider>;
}

export function useDashboardStore() {
  const value = useContext(DashboardStoreContext);
  if (!value) {
    throw new Error('useDashboardStore must be used inside DashboardStoreProvider');
  }
  return value;
}
