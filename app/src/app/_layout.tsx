import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import React from 'react';
import { useColorScheme } from 'react-native';

import '@/background/dashboard-background-task';
import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { DashboardStoreProvider } from '@/components/dashboard/DashboardStoreProvider';
import { DashboardThemeContext, dashboardThemes } from '@/components/dashboard/theme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const dashboardColors = dashboardThemes[colorScheme === 'dark' ? 'dark' : 'light'];
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <DashboardThemeContext.Provider value={dashboardColors}>
        <DashboardStoreProvider>
          <AnimatedSplashOverlay />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="invite/[groupId]" />
          </Stack>
        </DashboardStoreProvider>
      </DashboardThemeContext.Provider>
    </ThemeProvider>
  );
}
