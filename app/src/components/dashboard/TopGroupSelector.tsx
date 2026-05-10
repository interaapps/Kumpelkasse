import { SymbolView } from 'expo-symbols';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/dashboard/Avatar';
import { Group, Member } from '@/types/debt';

type TopGroupSelectorProps = {
  groups: Group[];
  selectedGroup: Group;
  currentUser: Member;
  visible: boolean;
  onOpen: () => void;
  onClose: () => void;
  onOpenInvite: () => void;
  onOpenProfile: () => void;
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
  onSelectGroup,
}: TopGroupSelectorProps) {
  return (
    <View style={styles.container}>
      <Pressable style={({ pressed }) => pressed && styles.pressed} onPress={onOpenProfile}>
        <Avatar initials={currentUser.initials} size={48} />
      </Pressable>
      <Pressable style={({ pressed }) => [styles.groupButton, pressed && styles.pressed]} onPress={onOpen}>
        <Text style={styles.groupName}>{selectedGroup.name}</Text>
        <SymbolView
          name={{ ios: 'chevron.down', android: 'keyboard_arrow_down', web: 'keyboard_arrow_down' }}
          size={14}
          tintColor="#334155"
        />
      </Pressable>
      <Pressable style={({ pressed }) => [styles.inviteButton, pressed && styles.pressed]} onPress={onOpenInvite}>
        <SymbolView name={{ ios: 'person.badge.plus', android: 'person_add', web: 'person_add' }} size={22} tintColor="#172033" />
      </Pressable>

      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <Pressable style={styles.backdrop} onPress={onClose}>
          <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
            <SafeAreaView edges={['bottom']} style={styles.sheetSafeArea}>
              <View style={styles.handle} />
              <Text style={styles.sheetTitle}>Gruppe wechseln</Text>
              {groups.map((group) => {
                const selected = group.id === selectedGroup.id;
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
                        tintColor="#168A43"
                      />
                    )}
                  </Pressable>
                );
              })}
            </SafeAreaView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingTop: 8,
  },
  groupButton: {
    alignItems: 'center',
    backgroundColor: '#F2F4F3',
    borderRadius: 999,
    flexDirection: 'row',
    gap: 8,
    minHeight: 46,
    paddingHorizontal: 18,
  },
  groupName: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '800',
  },
  inviteButton: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  pressed: {
    opacity: 0.72,
  },
  backdrop: {
    backgroundColor: 'rgba(15, 23, 42, 0.32)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  sheetSafeArea: {
    gap: 10,
    paddingBottom: 10,
  },
  handle: {
    alignSelf: 'center',
    backgroundColor: '#D6D9DE',
    borderRadius: 999,
    height: 5,
    marginBottom: 8,
    width: 44,
  },
  sheetTitle: {
    color: '#111827',
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 6,
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
    backgroundColor: '#EFF8F1',
  },
  groupRowText: {
    color: '#334155',
    fontSize: 17,
    fontWeight: '700',
  },
  groupRowTextSelected: {
    color: '#14532D',
  },
});
