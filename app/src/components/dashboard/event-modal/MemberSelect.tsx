import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/dashboard/Avatar';
import { FormField } from '@/components/dashboard/event-modal/EventModalForm';
import { Member } from '@/types/debt';

type PersonSelectProps = {
  label: string;
  members: Member[];
  selectedId: string;
  onSelect: (memberId: string) => void;
};

type MemberMultiSelectProps = {
  label?: string;
  members: Member[];
  selectedIds: string[];
  onToggle: (memberId: string) => void;
};

export function PersonSelect({ label, members, selectedId, onSelect }: PersonSelectProps) {
  return (
    <FormField label={label}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
        {members.map((member) => (
          <Pressable
            key={member.id}
            style={({ pressed }) => [
              styles.personChip,
              selectedId === member.id && styles.personChipSelected,
              pressed && styles.pressed,
            ]}
            onPress={() => onSelect(member.id)}>
            <Avatar
              initials={member.initials}
              avatarUrl={member.avatarUrl}
              size={32}
              backgroundColor={selectedId === member.id ? '#FFFFFF' : '#E9ECEF'}
              color={selectedId === member.id ? '#14532D' : '#475467'}
            />
            <Text style={[styles.personChipText, selectedId === member.id && styles.personChipTextSelected]}>
              {member.name}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </FormField>
  );
}

export function MemberMultiSelect({
  label = 'Teilnehmer',
  members,
  selectedIds,
  onToggle,
}: MemberMultiSelectProps) {
  return (
    <FormField label={label}>
      <View style={styles.participantGrid}>
        {members.map((member) => {
          const selected = selectedIds.includes(member.id);
          return (
            <Pressable
              key={member.id}
              style={({ pressed }) => [
                styles.participantChip,
                selected && styles.participantChipSelected,
                pressed && styles.pressed,
              ]}
              onPress={() => onToggle(member.id)}>
              <Avatar
                initials={member.initials}
                avatarUrl={member.avatarUrl}
                size={34}
                backgroundColor={selected ? '#FFFFFF' : '#EEF1F4'}
                color={selected ? '#14532D' : '#475467'}
              />
              <Text style={[styles.participantName, selected && styles.participantNameSelected]}>{member.name}</Text>
            </Pressable>
          );
        })}
      </View>
    </FormField>
  );
}

const styles = StyleSheet.create({
  chipRow: {
    gap: 10,
    paddingRight: 20,
  },
  personChip: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    flexDirection: 'row',
    gap: 9,
    minHeight: 48,
    paddingHorizontal: 10,
    paddingRight: 15,
  },
  personChipSelected: {
    backgroundColor: '#1D3D2A',
  },
  personChipText: {
    color: '#475467',
    fontSize: 15,
    fontWeight: '800',
  },
  personChipTextSelected: {
    color: '#FFFFFF',
  },
  participantGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  participantChip: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    flexDirection: 'row',
    gap: 8,
    minHeight: 48,
    paddingHorizontal: 10,
    paddingRight: 14,
  },
  participantChipSelected: {
    backgroundColor: '#E5F6EA',
  },
  participantName: {
    color: '#475467',
    fontSize: 14,
    fontWeight: '800',
  },
  participantNameSelected: {
    color: '#14532D',
  },
  pressed: {
    opacity: 0.72,
  },
});
