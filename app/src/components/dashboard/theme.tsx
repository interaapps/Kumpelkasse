import { createContext, useContext } from 'react';

export type DashboardColors = {
  background: string;
  card: string;
  cardMuted: string;
  text: string;
  textMuted: string;
  textSubtle: string;
  border: string;
  button: string;
  buttonText: string;
  positive: string;
  negative: string;
  shadow: string;
};

export const dashboardThemes: Record<'light' | 'dark', DashboardColors> = {
  light: {
    background: '#F7F8F4',
    card: '#FFFFFF',
    cardMuted: '#F2F4F3',
    text: '#101828',
    textMuted: '#667085',
    textSubtle: '#98A2B3',
    border: '#EEF0F2',
    button: '#18251E',
    buttonText: '#FFFFFF',
    positive: '#159447',
    negative: '#D64545',
    shadow: '#0F172A',
  },
  dark: {
    background: '#090D0B',
    card: '#141A17',
    cardMuted: '#202823',
    text: '#F5F7F5',
    textMuted: '#AEB8B1',
    textSubtle: '#7D887F',
    border: '#283129',
    button: '#DDEFE2',
    buttonText: '#0B120E',
    positive: '#50D17D',
    negative: '#FF6B6B',
    shadow: '#000000',
  },
};

export const DashboardThemeContext = createContext<DashboardColors>(dashboardThemes.light);

export function useDashboardTheme() {
  return useContext(DashboardThemeContext);
}
