import { SymbolView } from 'expo-symbols';
import { StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/dashboard/Avatar';
import { MiniMoneyInput } from '@/components/dashboard/event-modal/EventModalForm';
import { Member } from '@/types/debt';
import { formatEuro, parseEuroToCents } from '@/utils/debt';

export type GamePlayerValue = {
  buyIn: string;
  cashOut: string;
};

type GamePlayersEditorProps = {
  members: Member[];
  values: Record<string, GamePlayerValue>;
  deltaCents: number;
  bankMemberId?: string | null;
  autoBalancedCents?: number;
  onChange: (memberId: string, value: GamePlayerValue) => void;
};

export function GamePlayersEditor({ members, values, deltaCents, bankMemberId, autoBalancedCents, onChange }: GamePlayersEditorProps) {
  return (
    <>
      <Text style={styles.sectionTitle}>Spieler</Text>
      <View style={styles.gameList}>
        {members.map((member) => {
          const isBank = bankMemberId === member.id;
          const buyIn = values[member.id]?.buyIn ?? '';
          const cashOut = values[member.id]?.cashOut ?? '';
          const netCents = isBank ? autoBalancedCents ?? 0 : parseEuroToCents(cashOut) - parseEuroToCents(buyIn);

          return (
            <View key={member.id} style={styles.gameRow}>
              <View style={styles.gamePerson}>
                <Avatar initials={member.initials} avatarUrl={member.avatarUrl} size={38} />
                <Text style={styles.gameName}>{member.name}</Text>
                {isBank && <Text style={styles.bankBadge}>Bank</Text>}
              </View>
              <View style={styles.gameInputs}>
                {isBank ? (
                  <View style={styles.bankAutoBox}>
                    <Text style={styles.bankAutoText}>automatisch</Text>
                  </View>
                ) : (
                  <>
                    <MiniMoneyInput
                      value={buyIn}
                      placeholder="Buy-in"
                      onChangeText={(value) => onChange(member.id, { buyIn: value, cashOut })}
                    />
                    <MiniMoneyInput
                      value={cashOut}
                      placeholder="Cash-out"
                      onChangeText={(value) => onChange(member.id, { buyIn, cashOut: value })}
                    />
                  </>
                )}
                <Text
                  style={[
                    styles.netValue,
                    netCents > 0 ? styles.positive : netCents < 0 ? styles.negative : styles.muted,
                  ]}>
                  {formatEuro(netCents, { signed: true })}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
      {deltaCents !== 0 && (
        <View style={styles.warningBox}>
          <SymbolView
            name={{ ios: 'exclamationmark.triangle.fill', android: 'warning', web: 'warning' }}
            size={18}
            tintColor="#B45309"
          />
          <Text style={styles.warningText}>
            Einzahlungen und Auszahlungen sind noch nicht ausgeglichen ({formatEuro(deltaCents, { signed: true })}).
          </Text>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    color: '#101828',
    fontSize: 18,
    fontWeight: '900',
  },
  gameList: {
    gap: 12,
  },
  gameRow: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    gap: 12,
    padding: 14,
  },
  gamePerson: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  gameName: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '900',
  },
  bankBadge: {
    color: '#2563EB',
    fontSize: 12,
    fontWeight: '900',
    marginLeft: 'auto',
  },
  gameInputs: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  bankAutoBox: {
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 14,
    justifyContent: 'center',
    minHeight: 42,
    minWidth: 106,
    paddingHorizontal: 12,
  },
  bankAutoText: {
    color: '#1D4ED8',
    fontSize: 12,
    fontWeight: '900',
  },
  netValue: {
    fontSize: 14,
    fontWeight: '900',
    minWidth: 68,
    textAlign: 'right',
  },
  positive: {
    color: '#159447',
  },
  negative: {
    color: '#D64545',
  },
  muted: {
    color: '#98A2B3',
  },
  warningBox: {
    alignItems: 'flex-start',
    backgroundColor: '#FFF7ED',
    borderRadius: 20,
    flexDirection: 'row',
    gap: 10,
    padding: 14,
  },
  warningText: {
    color: '#92400E',
    flex: 1,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 19,
  },
});
