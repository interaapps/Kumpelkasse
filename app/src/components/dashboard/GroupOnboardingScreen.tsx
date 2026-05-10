import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DashboardColors, useDashboardTheme } from '@/components/dashboard/theme';

type GroupOnboardingScreenProps = {
  userName: string;
  onCancel?: () => void;
  onCreateGroup: (name: string) => Promise<void>;
};

export function GroupOnboardingScreen({ userName, onCancel, onCreateGroup }: GroupOnboardingScreenProps) {
  const colors = useDashboardTheme();
  const styles = createStyles(colors);
  const [name, setName] = useState('Freundesgruppe');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    if (!name.trim()) {
      setError('Bitte gib deiner Gruppe einen Namen.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await onCreateGroup(name.trim());
    } catch {
      setError('Die Gruppe konnte nicht erstellt werden.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {onCancel && (
        <Pressable style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]} onPress={onCancel}>
          <Text style={styles.cancelText}>Abbrechen</Text>
        </Pressable>
      )}
      <View style={styles.container}>
        <Text style={styles.kicker}>Willkommen, {userName}</Text>
        <Text style={styles.title}>Erstelle deine erste Gruppe.</Text>
        <Text style={styles.subtitle}>Danach kannst du Freunde einladen, Events erfassen und alle Salden aus der Datenbank berechnen lassen.</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Gruppenname</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="z.B. WG, Pokerabend, Urlaub Spanien"
            placeholderTextColor={colors.textSubtle}
            style={styles.input}
          />
          {error && <Text style={styles.error}>{error}</Text>}
          <Pressable style={({ pressed }) => [styles.button, pressed && styles.pressed]} onPress={handleCreate} disabled={loading}>
            {loading ? <ActivityIndicator color={colors.buttonText} /> : <Text style={styles.buttonText}>Gruppe erstellen</Text>}
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
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
    kicker: {
      color: colors.positive,
      fontSize: 15,
      fontWeight: '900',
    },
    title: {
      color: colors.text,
      fontSize: 40,
      fontWeight: '900',
      letterSpacing: -1.2,
      lineHeight: 44,
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
      marginTop: 28,
      padding: 20,
    },
    label: {
      color: colors.textMuted,
      fontSize: 13,
      fontWeight: '900',
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
    cancelButton: {
      alignSelf: 'flex-end',
      paddingHorizontal: 22,
      paddingTop: 14,
      paddingVertical: 10,
    },
    cancelText: {
      color: colors.textMuted,
      fontSize: 15,
      fontWeight: '900',
    },
    pressed: {
      opacity: 0.72,
    },
  });
}
