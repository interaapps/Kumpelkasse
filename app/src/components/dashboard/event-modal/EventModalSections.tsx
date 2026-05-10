import { View } from 'react-native';

import { FormField, FormTextInput, MoneyField, SegmentButton, SegmentedControl } from '@/components/dashboard/event-modal/EventModalForm';
import { GamePlayerValue, GamePlayersEditor } from '@/components/dashboard/event-modal/GamePlayersEditor';
import { MemberMultiSelect, PersonSelect } from '@/components/dashboard/event-modal/MemberSelect';
import { EventType, Member } from '@/types/debt';

type DirectEventFieldsProps = {
  type: EventType;
  members: Member[];
  fromMemberId: string;
  toMemberId: string;
  amount: string;
  note: string;
  setFromMemberId: (memberId: string) => void;
  setToMemberId: (memberId: string) => void;
  setAmount: (amount: string) => void;
  setNote: (note: string) => void;
};

export function DirectEventFields({
  type,
  members,
  fromMemberId,
  toMemberId,
  amount,
  note,
  setFromMemberId,
  setToMemberId,
  setAmount,
  setNote,
}: DirectEventFieldsProps) {
  return (
    <>
      <PersonSelect
        label={type === 'payment' ? 'Bezahlt von' : type === 'single' ? 'Person schuldet' : 'Von Person'}
        members={members}
        selectedId={fromMemberId}
        onSelect={setFromMemberId}
      />
      <PersonSelect
        label={type === 'payment' ? 'Bezahlt an' : type === 'single' ? 'Person bekommt' : 'An Person'}
        members={members}
        selectedId={toMemberId}
        onSelect={setToMemberId}
      />
      <MoneyField value={amount} onChangeText={setAmount} label="Betrag" />
      {(type === 'direct' || type === 'payment') && (
        <FormTextInput label="Notiz optional" value={note} onChangeText={setNote} placeholder="Wofür war es?" multiline />
      )}
    </>
  );
}

type SplitEventFieldsProps = {
  members: Member[];
  payerId: string;
  amount: string;
  selectedParticipantIds: string[];
  splitMode: 'equal' | 'manual';
  manualShares: Record<string, string>;
  getMemberName: (memberId: string) => string;
  setPayerId: (memberId: string) => void;
  setAmount: (amount: string) => void;
  setSelectedParticipantIds: React.Dispatch<React.SetStateAction<string[]>>;
  setSplitMode: (mode: 'equal' | 'manual') => void;
  setManualShares: React.Dispatch<React.SetStateAction<Record<string, string>>>;
};

export function SplitEventFields({
  members,
  payerId,
  amount,
  selectedParticipantIds,
  splitMode,
  manualShares,
  getMemberName,
  setPayerId,
  setAmount,
  setSelectedParticipantIds,
  setSplitMode,
  setManualShares,
}: SplitEventFieldsProps) {
  return (
    <>
      <PersonSelect
        label="Bezahlt von"
        members={members}
        selectedId={payerId}
        onSelect={(memberId) => {
          setPayerId(memberId);
          setSelectedParticipantIds((current) => Array.from(new Set([memberId, ...current])));
        }}
      />
      <MoneyField value={amount} onChangeText={setAmount} label="Gesamtbetrag" />
      <FormField label="Split-Modus">
        <SegmentedControl>
          <SegmentButton label="gleichmäßig" selected={splitMode === 'equal'} onPress={() => setSplitMode('equal')} />
          <SegmentButton label="manuell" selected={splitMode === 'manual'} onPress={() => setSplitMode('manual')} />
        </SegmentedControl>
      </FormField>
      <MemberMultiSelect
        members={members}
        selectedIds={selectedParticipantIds}
        onToggle={(memberId) =>
          setSelectedParticipantIds((current) => {
            if (memberId === payerId) {
              return current;
            }

            return current.includes(memberId) ? current.filter((id) => id !== memberId) : [...current, memberId];
          })
        }
      />
      {splitMode === 'manual' && (
        <View style={{ gap: 12 }}>
          {selectedParticipantIds.map((memberId) => (
            <MoneyField
              key={memberId}
              value={manualShares[memberId] ?? ''}
              onChangeText={(value) => setManualShares((current) => ({ ...current, [memberId]: value }))}
              label={getMemberName(memberId)}
            />
          ))}
        </View>
      )}
    </>
  );
}

type GameEventFieldsProps = {
  members: Member[];
  gameMembers: Member[];
  selectedParticipantIds: string[];
  gameValues: Record<string, GamePlayerValue>;
  gameDeltaCents: number;
  setSelectedParticipantIds: React.Dispatch<React.SetStateAction<string[]>>;
  setGameValues: React.Dispatch<React.SetStateAction<Record<string, GamePlayerValue>>>;
};

export function GameEventFields({
  members,
  gameMembers,
  selectedParticipantIds,
  gameValues,
  gameDeltaCents,
  setSelectedParticipantIds,
  setGameValues,
}: GameEventFieldsProps) {
  return (
    <>
      <MemberMultiSelect
        label="Mitspieler"
        members={members}
        selectedIds={selectedParticipantIds}
        onToggle={(memberId) =>
          setSelectedParticipantIds((current) =>
            current.includes(memberId) ? current.filter((id) => id !== memberId) : [...current, memberId],
          )
        }
      />
      <GamePlayersEditor
        members={gameMembers}
        values={gameValues}
        deltaCents={gameDeltaCents}
        onChange={(memberId, value) =>
          setGameValues((current) => ({
            ...current,
            [memberId]: value,
          }))
        }
      />
    </>
  );
}
