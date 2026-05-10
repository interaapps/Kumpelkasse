import { SymbolView, SymbolViewProps } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DashboardColors, useDashboardTheme } from '@/components/dashboard/theme';

type QuickActionButtonProps = {
  label: string;
  icon: SymbolViewProps['name'];
  onPress: () => void;
};

export function QuickActionButton({ label, icon, onPress }: QuickActionButtonProps) {
  const colors = useDashboardTheme();
  const styles = createStyles(colors);

  return (
    <Pressable style={({ pressed }) => [styles.container, pressed && styles.pressed]} onPress={onPress}>
      <View style={styles.circle}>
        <SymbolView name={icon} size={25} tintColor={colors.text} />
      </View>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

function createStyles(colors: DashboardColors) {
  return StyleSheet.create({
    container: {
      alignItems: 'center',
      gap: 10,
      minWidth: 76,
    },
    circle: {
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: 999,
      height: 62,
      justifyContent: 'center',
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.08,
      shadowRadius: 16,
      width: 62,
    },
    label: {
      color: colors.textMuted,
      fontSize: 13,
      fontWeight: '800',
    },
    pressed: {
      opacity: 0.68,
      transform: [{ scale: 0.97 }],
    },
  });
}
