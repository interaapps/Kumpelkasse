import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DashboardColors, useDashboardTheme } from '@/components/dashboard/theme';

type JoinInviteModalProps = {
  visible: boolean;
  groupId: string | null;
  onClose: () => void;
  onJoin: (groupId: string) => void | Promise<void>;
};

export function JoinInviteModal({ visible, groupId, onClose, onJoin }: JoinInviteModalProps) {
  const colors = useDashboardTheme();
  const styles = createStyles(colors);

  if (!groupId) {
    return null;
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.joinPrompt}>
          <Text style={styles.eyebrow}>Einladung</Text>
          <Text style={styles.title}>Gruppe beitreten?</Text>
          <Text style={styles.text}>
            Du wurdest zu einer Kumpelkasse-Gruppe eingeladen. Möchtest du dieser Gruppe beitreten?
          </Text>
          <View style={styles.actions}>
            <Pressable style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]} onPress={onClose}>
              <Text style={styles.cancelText}>Abbrechen</Text>
            </Pressable>
            <Pressable style={({ pressed }) => [styles.confirmButton, pressed && styles.pressed]} onPress={() => onJoin(groupId)}>
              <Text style={styles.confirmText}>Beitreten</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

function createStyles(colors: DashboardColors) {
  return StyleSheet.create({
    safeArea: {
      backgroundColor: colors.background,
      flex: 1,
    },
    joinPrompt: {
      backgroundColor: colors.card,
      borderRadius: 32,
      gap: 14,
      margin: 20,
      marginTop: 80,
      padding: 22,
    },
    eyebrow: {
      color: colors.positive,
      fontSize: 13,
      fontWeight: '900',
      letterSpacing: 0.7,
      textTransform: 'uppercase',
    },
    title: {
      color: colors.text,
      fontSize: 30,
      fontWeight: '900',
      letterSpacing: -0.8,
    },
    text: {
      color: colors.textMuted,
      fontSize: 16,
      fontWeight: '700',
      lineHeight: 23,
    },
    actions: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 8,
    },
    cancelButton: {
      alignItems: 'center',
      backgroundColor: colors.cardMuted,
      borderRadius: 999,
      flex: 1,
      justifyContent: 'center',
      minHeight: 52,
    },
    confirmButton: {
      alignItems: 'center',
      backgroundColor: colors.button,
      borderRadius: 999,
      flex: 1,
      justifyContent: 'center',
      minHeight: 52,
    },
    cancelText: {
      color: colors.text,
      fontSize: 15,
      fontWeight: '900',
    },
    confirmText: {
      color: colors.buttonText,
      fontSize: 15,
      fontWeight: '900',
    },
    pressed: {
      opacity: 0.72,
    },
  });
}
