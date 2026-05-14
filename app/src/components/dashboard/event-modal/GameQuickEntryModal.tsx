import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FormField, MiniMoneyInput, SegmentButton, SegmentedControl } from '@/components/dashboard/event-modal/EventModalForm';
import { PersonSelect } from '@/components/dashboard/event-modal/MemberSelect';
import { DashboardColors, useDashboardTheme } from '@/components/dashboard/theme';
import { Member } from '@/types/debt';
import { parseEuroToCents } from '@/utils/debt';

type QuickActionKind = 'buyIn' | 'cashOut';

type GameQuickEntryModalProps = {
  visible: boolean;
  members: Member[];
  onClose: () => void;
  onApply: (payload: { memberId: string; kind: QuickActionKind; amountCents: number }) => void;
};

export function GameQuickEntryModal({
  visible,
  members,
  onClose,
  onApply,
}: GameQuickEntryModalProps) {
  const colors = useDashboardTheme();
  const styles = createStyles(colors);
  const [memberId, setMemberId] = useState(members[0]?.id ?? '');
  const [kind, setKind] = useState<QuickActionKind>('buyIn');
  const [amount, setAmount] = useState('');

  useEffect(() => {
    if (!visible) {
      return;
    }
    setMemberId((current) => (members.some((member) => member.id === current) ? current : members[0]?.id ?? ''));
    setKind('buyIn');
    setAmount('');
  }, [members, visible]);

  function handleApply() {
    const amountCents = parseEuroToCents(amount);
    if (!memberId || amountCents <= 0) {
      return;
    }
    onApply({ memberId, kind, amountCents });
    onClose();
  }

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheetWrap} pointerEvents="box-none">
          <KeyboardAvoidingView
            behavior={Platform.select({ ios: 'padding', default: undefined })}
            style={styles.keyboardWrap}>
            <View style={styles.sheet}>
              <ScrollView
                bounces={false}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.content}>
                <Text style={styles.title}>Schneller Eintrag</Text>
                <PersonSelect label="Person" members={members} selectedId={memberId} onSelect={setMemberId} />
                <FormField label="Aktion">
                  <SegmentedControl>
                    <SegmentButton label="Nachzahlen" selected={kind === 'buyIn'} onPress={() => setKind('buyIn')} />
                    <SegmentButton label="Rausgehen" selected={kind === 'cashOut'} onPress={() => setKind('cashOut')} />
                  </SegmentedControl>
                </FormField>
                <FormField label="Betrag">
                  <MiniMoneyInput value={amount} placeholder="0,00" onChangeText={setAmount} />
                </FormField>
                <View style={styles.footer}>
                  <Pressable style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]} onPress={onClose}>
                    <Text style={styles.secondaryButtonText}>Abbrechen</Text>
                  </Pressable>
                  <Pressable style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]} onPress={handleApply}>
                    <Text style={styles.primaryButtonText}>Hinzufügen</Text>
                  </Pressable>
                </View>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

function createStyles(colors: DashboardColors) {
  return StyleSheet.create({
    safeArea: {
      backgroundColor: 'rgba(15, 23, 42, 0.22)',
      flex: 1,
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
    },
    sheetWrap: {
      flex: 1,
      justifyContent: 'flex-end',
      padding: 16,
    },
    keyboardWrap: {
      maxHeight: '82%',
    },
    sheet: {
      backgroundColor: colors.background,
      borderRadius: 30,
      maxHeight: '100%',
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 14 },
      shadowOpacity: 0.18,
      shadowRadius: 30,
    },
    content: {
      gap: 16,
      padding: 18,
    },
    title: {
      color: colors.text,
      fontSize: 19,
      fontWeight: '900',
    },
    footer: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 4,
    },
    secondaryButton: {
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: 18,
      flex: 1,
      justifyContent: 'center',
      minHeight: 50,
    },
    secondaryButtonText: {
      color: colors.text,
      fontSize: 15,
      fontWeight: '900',
    },
    primaryButton: {
      alignItems: 'center',
      backgroundColor: colors.button,
      borderRadius: 18,
      flex: 1,
      justifyContent: 'center',
      minHeight: 50,
    },
    primaryButtonText: {
      color: colors.buttonText,
      fontSize: 15,
      fontWeight: '900',
    },
    pressed: {
      opacity: 0.76,
    },
  });
}
