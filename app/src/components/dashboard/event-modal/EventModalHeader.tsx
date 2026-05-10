import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DashboardColors, useDashboardTheme } from '@/components/dashboard/theme';

type EventModalHeaderProps = {
  eyebrow?: string;
  title: string;
  canSave: boolean;
  onClose: () => void;
  onSave: () => void;
};

export function EventModalHeader({ eyebrow, title, canSave, onClose, onSave }: EventModalHeaderProps) {
  const colors = useDashboardTheme();
  const styles = createStyles(colors);

  return (
    <View style={styles.header}>
      <Pressable style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]} onPress={onClose}>
        <SymbolView name={{ ios: 'xmark', android: 'close', web: 'close' }} size={17} tintColor={colors.text} />
      </Pressable>
      <View style={styles.headerText}>
        {eyebrow && <Text style={styles.eyebrow}>{eyebrow}</Text>}
        <Text style={styles.title}>{title}</Text>
      </View>
      <Pressable
        disabled={!canSave}
        style={({ pressed }) => [styles.saveButton, !canSave && styles.saveButtonDisabled, pressed && styles.pressed]}
        onPress={onSave}>
        <Text style={styles.saveText}>Speichern</Text>
      </Pressable>
    </View>
  );
}

function createStyles(colors: DashboardColors) {
  return StyleSheet.create({
    header: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 12,
      paddingHorizontal: 18,
      paddingVertical: 12,
    },
    closeButton: {
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: 999,
      height: 44,
      justifyContent: 'center',
      width: 44,
    },
    headerText: {
      flex: 1,
    },
    eyebrow: {
      color: colors.textSubtle,
      fontSize: 12,
      fontWeight: '900',
      letterSpacing: 0.6,
      textTransform: 'uppercase',
    },
    title: {
      color: colors.text,
      fontSize: 24,
      fontWeight: '900',
      letterSpacing: -0.4,
    },
    saveButton: {
      backgroundColor: colors.button,
      borderRadius: 999,
      justifyContent: 'center',
      minHeight: 44,
      paddingHorizontal: 16,
    },
    saveButtonDisabled: {
      backgroundColor: colors.textSubtle,
    },
    saveText: {
      color: colors.buttonText,
      fontSize: 14,
      fontWeight: '900',
    },
    pressed: {
      opacity: 0.72,
    },
  });
}
