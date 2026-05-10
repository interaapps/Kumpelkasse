import { SymbolView, SymbolViewProps } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type QuickActionButtonProps = {
  label: string;
  icon: SymbolViewProps['name'];
  onPress: () => void;
};

export function QuickActionButton({ label, icon, onPress }: QuickActionButtonProps) {
  return (
    <Pressable style={({ pressed }) => [styles.container, pressed && styles.pressed]} onPress={onPress}>
      <View style={styles.circle}>
        <SymbolView name={icon} size={25} tintColor="#172033" />
      </View>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 10,
    minWidth: 76,
  },
  circle: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    height: 62,
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    width: 62,
  },
  label: {
    color: '#374151',
    fontSize: 13,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.68,
    transform: [{ scale: 0.97 }],
  },
});
