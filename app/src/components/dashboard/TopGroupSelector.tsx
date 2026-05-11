import { GlassView, isGlassEffectAPIAvailable } from 'expo-glass-effect';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/dashboard/Avatar';
import { DashboardColors, useDashboardTheme } from '@/components/dashboard/theme';
import { Group, Member } from '@/types/debt';

type TopGroupSelectorProps = {
  groups: Group[];
  selectedGroup?: Group | null;
  currentUser: Member;
  visible: boolean;
  onOpen: () => void;
  onClose: () => void;
  onOpenInvite: () => void;
  onOpenProfile: () => void;
  onCreateGroup: () => void;
  onJoinGroupLink: (link: string) => void;
  onSelectGroup: (groupId: string) => void;
};

export function TopGroupSelector({
  groups,
  selectedGroup,
  currentUser,
  visible,
  onOpen,
  onClose,
  onOpenInvite,
  onOpenProfile,
  onCreateGroup,
  onJoinGroupLink,
  onSelectGroup,
}: TopGroupSelectorProps) {
  const colors = useDashboardTheme();
  const styles = createStyles(colors);
  const useGlass = Platform.OS === 'ios' && isGlassEffectAPIAvailable();

  return (
    <View style={styles.container}>
      <Pressable style={({ pressed }) => pressed && styles.pressed} onPress={onOpenProfile}>
        <Avatar initials={currentUser.initials} avatarUrl={currentUser.avatarUrl} size={48} />
      </Pressable>
      <Pressable style={({ pressed }) => [styles.flexTouch, pressed && styles.pressed]} onPress={onOpen}>
        <TopBarSurface useGlass={useGlass} style={styles.groupButton}>
          <Text style={styles.groupName}>{selectedGroup?.name ?? 'Gruppe waehlen'}</Text>
          <SymbolView
            name={{ ios: 'chevron.down', android: 'keyboard_arrow_down', web: 'keyboard_arrow_down' }}
            size={14}
            tintColor={colors.textMuted}
          />
        </TopBarSurface>
      </Pressable>
      <Pressable style={({ pressed }) => [styles.iconTouch, pressed && styles.pressed]} onPress={onOpenInvite}>
        <TopBarSurface useGlass={useGlass} style={styles.inviteButton}>
          <SymbolView name={{ ios: 'person.badge.plus', android: 'person_add', web: 'person_add' }} size={22} tintColor={colors.text} />
        </TopBarSurface>
      </Pressable>

      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
        <SafeAreaView edges={['top', 'bottom']} style={styles.sheet}>
          <KeyboardAvoidingView
            behavior={Platform.select({ ios: 'padding', default: undefined })}
            style={styles.keyboardView}>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.sheetContent}>
              <View style={styles.handle} />
              <View style={styles.sheetHeader}>
                <Text style={styles.sheetTitle}>Gruppe wechseln</Text>
                <Pressable style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]} onPress={onClose}>
                  <SymbolView name={{ ios: 'xmark', android: 'close', web: 'close' }} size={16} tintColor={colors.text} />
                </Pressable>
              </View>
              {groups.map((group) => {
                const selected = group.id === selectedGroup?.id;
                return (
                  <Pressable
                    key={group.id}
                    style={({ pressed }) => [
                      styles.groupRow,
                      selected && styles.groupRowSelected,
                      pressed && styles.pressed,
                    ]}
                    onPress={() => {
                      onSelectGroup(group.id);
                      onClose();
                    }}>
                    <Text style={[styles.groupRowText, selected && styles.groupRowTextSelected]}>
                      {group.name}
                    </Text>
                    {selected && (
                      <SymbolView
                        name={{ ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check_circle' }}
                        size={22}
                        tintColor={colors.positive}
                      />
                    )}
                  </Pressable>
                );
              })}
              <Pressable
                style={({ pressed }) => [styles.groupRow, styles.createGroupRow, pressed && styles.pressed]}
                onPress={() => {
                  onClose();
                  onCreateGroup();
                }}>
                <Text style={[styles.groupRowText, styles.createGroupText]}>Neue Gruppe erstellen</Text>
                <SymbolView name={{ ios: 'plus.circle.fill', android: 'add_circle', web: 'add_circle' }} size={22} tintColor={colors.positive} />
              </Pressable>
              <JoinByLinkForm
                onSubmit={(link) => {
                  onClose();
                  onJoinGroupLink(link);
                }}
                styles={styles}
                colors={colors}
              />
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

function TopBarSurface({
  children,
  style,
  tintColor,
  useGlass,
}: {
  children: React.ReactNode;
  style: object;
  tintColor?: string;
  useGlass: boolean;
}) {
  if (useGlass) {
    return (
      <GlassView glassEffectStyle="regular" tintColor={tintColor} isInteractive style={style}>
        {children}
      </GlassView>
    );
  }

  return <View style={[style, { backgroundColor: tintColor }]}>{children}</View>;
}

function JoinByLinkForm({
  onSubmit,
  styles,
  colors,
}: {
  onSubmit: (link: string) => void;
  styles: ReturnType<typeof createStyles>;
  colors: DashboardColors;
}) {
  const [link, setLink] = useState('');

  return (
    <View style={styles.joinCard}>
      <Text style={styles.joinTitle}>Per Einladungslink beitreten</Text>
      <TextInput
        value={link}
        onChangeText={setLink}
        placeholder="https://kumpelkasse.interaapps.de/invite/..."
        placeholderTextColor={colors.textSubtle}
        autoCapitalize="none"
        style={styles.joinInput}
      />
      <Pressable
        style={({ pressed }) => [styles.joinButton, pressed && styles.pressed]}
        onPress={() => {
          if (link.trim()) {
            onSubmit(link.trim());
            setLink('');
          }
        }}>
        <Text style={styles.joinButtonText}>Beitreten</Text>
      </Pressable>
    </View>
  );
}

function createStyles(colors: DashboardColors) {
  return StyleSheet.create({
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  flexTouch: {
    flex: 1,
    marginHorizontal: 16,
  },
  iconTouch: {
    width: 48,
    height: 48,
  },
  groupButton: {
    alignItems: 'center',
    borderRadius: 999,
    flexDirection: 'row',
    gap: 8,
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  groupName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  inviteButton: {
    alignItems: 'center',
    borderRadius: 999,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  pressed: {
    opacity: 0.72,
  },
  sheet: {
    flex: 1,
    backgroundColor: colors.card,
  },
  keyboardView: {
    flex: 1,
  },
  sheetContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 22,
    gap: 10,
  },
  handle: {
    alignSelf: 'center',
    backgroundColor: colors.border,
    borderRadius: 999,
    height: 5,
    marginBottom: 8,
    width: 44,
  },
  sheetTitle: {
    flex: 1,
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
  },
  sheetHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    marginBottom: 6,
  },
  closeButton: {
    alignItems: 'center',
    backgroundColor: colors.cardMuted,
    borderRadius: 999,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  groupRow: {
    alignItems: 'center',
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 58,
    paddingHorizontal: 16,
  },
  groupRowSelected: {
    backgroundColor: `${colors.positive}18`,
  },
  groupRowText: {
    color: colors.textMuted,
    fontSize: 17,
    fontWeight: '700',
  },
  groupRowTextSelected: {
    color: colors.positive,
  },
  createGroupRow: {
    backgroundColor: `${colors.positive}12`,
    marginTop: 6,
  },
  createGroupText: {
    color: colors.positive,
  },
  joinCard: {
    backgroundColor: colors.cardMuted,
    borderRadius: 24,
    gap: 10,
    marginTop: 8,
    padding: 14,
  },
  joinTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
  },
  joinInput: {
    backgroundColor: colors.card,
    borderRadius: 16,
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
    minHeight: 46,
    paddingHorizontal: 12,
  },
  joinButton: {
    alignItems: 'center',
    backgroundColor: colors.button,
    borderRadius: 999,
    justifyContent: 'center',
    minHeight: 44,
  },
  joinButtonText: {
    color: colors.buttonText,
    fontSize: 14,
    fontWeight: '900',
  },
  });
}
