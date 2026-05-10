import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';

import { DashboardColors, useDashboardTheme } from '@/components/dashboard/theme';

type LoginScreenProps = {
  onLogin: (email: string, password: string) => Promise<void>;
  onRegister: (email: string, password: string, name: string) => Promise<void>;
  onInteraAppsLogin: () => Promise<void>;
};

export function LoginScreen({ onLogin, onRegister, onInteraAppsLogin }: LoginScreenProps) {
  const colors = useDashboardTheme();
  const styles = createStyles(colors);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!email.trim() || !email.includes('@')) {
      setError('Bitte gib eine gültige E-Mail ein.');
      return;
    }
    if (password.trim().length < 6) {
      setError('Das Passwort braucht mindestens 6 Zeichen.');
      return;
    }
    if (mode === 'register' && !name.trim()) {
      setError('Bitte gib deinen Namen ein.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      if (mode === 'login') {
        await onLogin(email.trim(), password);
      } else {
        await onRegister(email.trim(), password, name.trim());
      }
    } catch (error) {
      setError(getAuthErrorMessage(error, mode));
    } finally {
      setLoading(false);
    }
  }

  async function handleInteraAppsLogin() {
    setLoading(true);
    setError(null);
    try {
      await onInteraAppsLogin();
    } catch {
      setError('InteraApps Login fehlgeschlagen oder abgebrochen.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.hero}>
          <Text style={styles.kicker}>Kumpelkasse</Text>
          <Text style={styles.title}>{mode === 'login' ? 'Willkommen zurück.' : 'Account erstellen.'}</Text>
          <Text style={styles.subtitle}>
            {mode === 'login'
              ? 'Logge dich mit E-Mail und Passwort ein. Deine Session bleibt lokal gespeichert.'
              : 'Erstelle einmalig deinen Nutzer. Name und Bezahlinfos hängen danach an deinem Profil.'}
          </Text>
        </View>

        <View style={styles.card}>
          <Pressable
            style={({ pressed }) => [styles.interaAppsButton, pressed && styles.pressed]}
            onPress={handleInteraAppsLogin}
            disabled={loading}>
            <Text style={styles.interaAppsText}>Mit InteraApps einloggen</Text>
          </Pressable>

        </View>
      </View>
    </SafeAreaView>
  );
}


/*
<View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>oder</Text>
            <View style={styles.dividerLine} />
          </View>
          <View style={styles.segment}>
            <Pressable
              style={[styles.segmentButton, mode === 'login' && styles.segmentButtonActive]}
              onPress={() => {
                setMode('login');
                setError(null);
              }}>
              <Text style={[styles.segmentText, mode === 'login' && styles.segmentTextActive]}>Einloggen</Text>
            </Pressable>
            <Pressable
              style={[styles.segmentButton, mode === 'register' && styles.segmentButtonActive]}
              onPress={() => {
                setMode('register');
                setError(null);
              }}>
              <Text style={[styles.segmentText, mode === 'register' && styles.segmentTextActive]}>Registrieren</Text>
            </Pressable>
          </View>
          <Text style={styles.label}>E-Mail</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="du@example.com"
            placeholderTextColor={colors.textSubtle}
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
          />
          <Text style={styles.label}>Passwort</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Mindestens 6 Zeichen"
            placeholderTextColor={colors.textSubtle}
            secureTextEntry
            style={styles.input}
          />
          {mode === 'register' && (
            <>
              <Text style={styles.label}>Name</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Dein Name"
                placeholderTextColor={colors.textSubtle}
                style={styles.input}
              />
            </>
          )}
          {error && <Text style={styles.error}>{error}</Text>}
          <Pressable style={({ pressed }) => [styles.button, pressed && styles.pressed]} onPress={handleSubmit} disabled={loading}>
            {loading ? (
              <ActivityIndicator color={colors.buttonText} />
            ) : (
              <Text style={styles.buttonText}>{mode === 'login' ? 'Einloggen' : 'Account erstellen'}</Text>
            )}
          </Pressable>
 */

function getAuthErrorMessage(error: unknown, mode: 'login' | 'register') {
  if (!axios.isAxiosError(error)) {
    return 'Die Anfrage ist fehlgeschlagen. Bitte versuche es nochmal.';
  }

  if (!error.response) {
    return 'Backend nicht erreichbar. Läuft die API auf Port 8080?';
  }

  if (error.response.status === 409) {
    return 'Diesen Nutzer gibt es schon. Bitte logge dich ein.';
  }

  if (error.response.status === 401) {
    return mode === 'login' ? 'E-Mail oder Passwort stimmt nicht.' : 'Registrierung nicht autorisiert. Bitte App neu laden und erneut versuchen.';
  }

  if (error.response.status === 400) {
    return 'Bitte prüfe E-Mail, Passwort und Name.';
  }

  return 'Registrierung/Login fehlgeschlagen. Bitte versuche es nochmal.';
}

function createStyles(colors: DashboardColors) {
  return StyleSheet.create({
    safeArea: {
      backgroundColor: colors.background,
      flex: 1,
    },
    container: {
      flex: 1,
      justifyContent: 'center',
      padding: 24,
    },
    hero: {
      marginBottom: 26,
    },
    kicker: {
      color: colors.positive,
      fontSize: 15,
      fontWeight: '900',
      letterSpacing: 0.8,
      textTransform: 'uppercase',
    },
    title: {
      color: colors.text,
      fontSize: 38,
      fontWeight: '900',
      letterSpacing: -1.2,
      lineHeight: 42,
      marginTop: 8,
    },
    subtitle: {
      color: colors.textMuted,
      fontSize: 16,
      fontWeight: '700',
      lineHeight: 23,
      marginTop: 12,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: 30,
      gap: 10,
      padding: 20,
    },
    interaAppsButton: {
      alignItems: 'center',
      backgroundColor: colors.button,
      borderRadius: 999,
      justifyContent: 'center',
      minHeight: 54,
    },
    interaAppsText: {
      color: colors.buttonText,
      fontSize: 16,
      fontWeight: '900',
    },
    dividerRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 10,
      marginVertical: 2,
    },
    dividerLine: {
      backgroundColor: colors.border,
      flex: 1,
      height: 1,
    },
    dividerText: {
      color: colors.textSubtle,
      fontSize: 12,
      fontWeight: '900',
      textTransform: 'uppercase',
    },
    segment: {
      backgroundColor: colors.cardMuted,
      borderRadius: 999,
      flexDirection: 'row',
      gap: 4,
      padding: 4,
    },
    segmentButton: {
      alignItems: 'center',
      borderRadius: 999,
      flex: 1,
      minHeight: 42,
      justifyContent: 'center',
    },
    segmentButtonActive: {
      backgroundColor: colors.card,
    },
    segmentText: {
      color: colors.textMuted,
      fontSize: 14,
      fontWeight: '900',
    },
    segmentTextActive: {
      color: colors.text,
    },
    label: {
      color: colors.textMuted,
      fontSize: 13,
      fontWeight: '900',
      marginTop: 6,
      textTransform: 'uppercase',
    },
    input: {
      backgroundColor: colors.cardMuted,
      borderRadius: 18,
      color: colors.text,
      fontSize: 17,
      fontWeight: '800',
      minHeight: 54,
      paddingHorizontal: 16,
    },
    error: {
      color: colors.negative,
      fontSize: 14,
      fontWeight: '800',
      lineHeight: 20,
    },
    button: {
      alignItems: 'center',
      backgroundColor: colors.button,
      borderRadius: 999,
      justifyContent: 'center',
      minHeight: 54,
      marginTop: 8,
    },
    buttonText: {
      color: colors.buttonText,
      fontSize: 16,
      fontWeight: '900',
    },
    pressed: {
      opacity: 0.72,
    },
  });
}
