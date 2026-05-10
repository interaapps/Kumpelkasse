import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type EventModalHeaderProps = {
  eyebrow: string;
  title: string;
  canSave: boolean;
  onClose: () => void;
  onSave: () => void;
};

export function EventModalHeader({ eyebrow, title, canSave, onClose, onSave }: EventModalHeaderProps) {
  return (
    <View style={styles.header}>
      <Pressable style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]} onPress={onClose}>
        <SymbolView name={{ ios: 'xmark', android: 'close', web: 'close' }} size={17} tintColor="#111827" />
      </Pressable>
      <View style={styles.headerText}>
        <Text style={styles.eyebrow}>{eyebrow}</Text>
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

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  closeButton: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  headerText: {
    flex: 1,
  },
  eyebrow: {
    color: '#8A93A1',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  title: {
    color: '#101828',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  saveButton: {
    backgroundColor: '#18251E',
    borderRadius: 999,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 16,
  },
  saveButtonDisabled: {
    backgroundColor: '#B8C0C8',
  },
  saveText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  pressed: {
    opacity: 0.72,
  },
});
