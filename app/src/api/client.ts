import axios from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

function getDefaultBaseUrl() {
  const expoHost = getExpoHost();

  if (expoHost && isLocalNetworkHost(expoHost)) {
    return `http://${expoHost}:8080/api`;
  }

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8080/api';
  }

  return 'http://localhost:8080/api';
}

function getExpoHost() {
  const hostUri =
    Constants.expoConfig?.hostUri ??
    (Constants as unknown as { manifest?: { debuggerHost?: string; hostUri?: string } }).manifest?.hostUri ??
    (Constants as unknown as { manifest?: { debuggerHost?: string; hostUri?: string } }).manifest?.debuggerHost;

  return hostUri?.split(':')[0];
}

function isLocalNetworkHost(host: string) {
  return (
    /^10\.\d+\.\d+\.\d+$/.test(host) ||
    /^172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+$/.test(host) ||
    /^192\.168\.\d+\.\d+$/.test(host) ||
    host.endsWith('.local')
  );
}

export const apiClient = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL ?? getDefaultBaseUrl(),
  timeout: 10_000,
});
