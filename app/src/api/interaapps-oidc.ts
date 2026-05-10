import * as AuthSession from 'expo-auth-session';
import { CodeChallengeMethod, ResponseType } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

const discovery = {
  authorizationEndpoint: 'https://accounts.interaapps.de/auth/oauth2',
  tokenEndpoint: 'https://accounts.interaapps.de/api/v2/authorization/oauth2/access_token',
  revocationEndpoint: 'https://accounts.interaapps.de/api/v2/authorization/oauth2/revoke',
};

export async function authorizeWithInteraApps() {
  const redirectUri = AuthSession.makeRedirectUri({
    scheme: 'kumpelkasse',
    path: 'auth/interaapps',
  });
  const request = await AuthSession.loadAsync(
    {
      clientId: process.env.EXPO_PUBLIC_INTERAAPPS_CLIENT_ID ?? '09njrvu6mntgkte',
      redirectUri,
      responseType: ResponseType.Code,
      scopes: ['openid', 'profile', 'email'],
      usePKCE: true,
      codeChallengeMethod: CodeChallengeMethod.S256,
    },
    discovery,
  );
  const result = await request.promptAsync(discovery);

  if (result.type !== 'success' || !result.params.code || !request.codeVerifier) {
    throw new Error('InteraApps login was cancelled or failed.');
  }

  return {
    code: result.params.code,
    codeVerifier: request.codeVerifier,
    redirectUri,
  };
}
