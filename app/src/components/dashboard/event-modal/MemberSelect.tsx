import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/dashboard/Avatar';
import { FormField } from '@/components/dashboard/event-modal/EventModalForm';
import { DashboardColors, useDashboardTheme } from '@/components/dashboard/theme';
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
  const colors = useDashboardTheme();
  const styles = createStyles(colors);
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
              backgroundColor={selectedId === member.id ? colors.card : colors.cardMuted}
              color={selectedId === member.id ? colors.positive : colors.textMuted}
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
  const colors = useDashboardTheme();
  const styles = createStyles(colors);
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
                backgroundColor={selected ? colors.card : colors.cardMuted}
                color={selected ? colors.positive : colors.textMuted}
              />
              <Text style={[styles.participantName, selected && styles.participantNameSelected]}>{member.name}</Text>
            </Pressable>
          );
        })}
      </View>
    </FormField>
  );
}

function createStyles(colors: DashboardColors) {
return StyleSheet.create({
  chipRow: {
    gap: 10,
    paddingRight: 20,
  },
  personChip: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 999,
    flexDirection: 'row',
    gap: 9,
    minHeight: 48,
    paddingHorizontal: 10,
    paddingRight: 15,
  },
  personChipSelected: {
    backgroundColor: colors.button,
  },
  personChipText: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: '800',
  },
  personChipTextSelected: {
    color: colors.buttonText,
  },
  participantGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  participantChip: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 999,
    flexDirection: 'row',
    gap: 8,
    minHeight: 48,
    paddingHorizontal: 10,
    paddingRight: 14,
  },
  participantChipSelected: {
    backgroundColor: `${colors.positive}18`,
  },
  participantName: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '800',
  },
  participantNameSelected: {
    color: colors.positive,
  },
  pressed: {
    opacity: 0.72,
  },
});
}
