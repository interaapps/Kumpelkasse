import { SymbolView } from 'expo-symbols';
import { Alert, Modal, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { toQR } from 'toqr';

import { Avatar } from '@/components/dashboard/Avatar';
import { DashboardColors, useDashboardTheme } from '@/components/dashboard/theme';
import { Group, Member } from '@/types/debt';

type InviteModalProps = {
  visible: boolean;
  group: Group;
  inviteLink: string;
  members: Member[];
  onClose: () => void;
  onLeaveGroup: () => void | Promise<void>;
};

export function InviteModal({ visible, group, inviteLink, members, onClose, onLeaveGroup }: InviteModalProps) {
  const colors = useDashboardTheme();
  const styles = createStyles(colors);

  async function handleShare() {
    await Share.share({
      message: `Komm in meine Gruppe "${group.name}" bei Kumpelkasse: ${inviteLink}`,
      url: inviteLink,
    });
  }

  async function handleCopy() {
    const clipboard = globalThis.navigator?.clipboard;
    if (clipboard?.writeText) {
      await clipboard.writeText(inviteLink);
      Alert.alert('Kopiert', 'Der Einladungslink wurde kopiert.');
      return;
    }

    await Share.share({ message: inviteLink, url: inviteLink });
  }

  function handleLeave() {
    Alert.alert('Gruppe verlassen?', `Du verlässt "${group.name}". Du kannst später über einen Invite-Link wieder beitreten.`, [
      { text: 'Abbrechen', style: 'cancel' },
      {
        text: 'Verlassen',
        style: 'destructive',
        onPress: async () => {
          await onLeaveGroup();
        },
      },
    ]);
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable style={({ pressed }) => [styles.roundButton, pressed && styles.pressed]} onPress={onClose}>
            <SymbolView name={{ ios: 'xmark', android: 'close', web: 'close' }} size={17} tintColor={colors.text} />
          </Pressable>
          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>Einladen</Text>
            <Text style={styles.title}>{group.name}</Text>
          </View>
          <Pressable style={({ pressed }) => [styles.shareButton, pressed && styles.pressed]} onPress={handleShare}>
            <Text style={styles.shareText}>Teilen</Text>
          </Pressable>
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.qrCard}>
            <QrCode value={inviteLink} />
            <Text style={styles.qrTitle}>Invite-Link</Text>
            <Text style={styles.qrHint}>Scanbar für {inviteLink}</Text>
          </View>

          <View style={styles.linkCard}>
            <Text style={styles.linkLabel}>Link zum Teilen</Text>
            <Text style={styles.linkText}>{inviteLink}</Text>
            <Pressable style={({ pressed }) => [styles.copyButton, pressed && styles.pressed]} onPress={handleCopy}>
              <Text style={styles.copyText}>Link kopieren</Text>
            </Pressable>
          </View>

          <View style={styles.linkCard}>
            <Text style={styles.linkLabel}>Mitglieder</Text>
            {members.map((member) => (
              <View key={member.id} style={styles.memberRow}>
                <Avatar initials={member.initials} avatarUrl={member.avatarUrl} size={38} />
                <View style={styles.memberText}>
                  <Text style={styles.memberName}>{member.name}</Text>
                  {member.email && <Text style={styles.memberEmail}>{member.email}</Text>}
                </View>
              </View>
            ))}
          </View>

          <Pressable style={({ pressed }) => [styles.leaveButton, pressed && styles.pressed]} onPress={handleLeave}>
            <SymbolView name={{ ios: 'rectangle.portrait.and.arrow.right', android: 'logout', web: 'logout' }} size={18} tintColor={colors.negative} />
            <Text style={styles.leaveText}>Gruppe verlassen</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function QrCode({ value }: { value: string }) {
  const colors = useDashboardTheme();
  const styles = createStyles(colors);
  const rawCells = Array.from(toQR(value));
  const rawSize = Math.sqrt(rawCells.length);
  const quietZone = 4;
  const size = rawSize + quietZone * 2;
  const cellSize = Math.max(4, Math.floor(244 / size));
  const qrSize = size * cellSize;
  const cells = Array.from({ length: size * size }, (_, index) => {
    const row = Math.floor(index / size);
    const column = index % size;
    const rawRow = row - quietZone;
    const rawColumn = column - quietZone;

    if (rawRow < 0 || rawColumn < 0 || rawRow >= rawSize || rawColumn >= rawSize) {
      return false;
    }

    return Boolean(rawCells[rawRow * rawSize + rawColumn]);
  });

  return (
    <View style={[styles.qr, { height: qrSize, width: qrSize }]}>
      {cells.map((active, index) => (
        <View
          key={index}
          style={[
            styles.qrCell,
            { height: cellSize, width: cellSize },
            Boolean(active) && styles.qrCellActive,
          ]}
        />
      ))}
    </View>
  );
}

function createStyles(colors: DashboardColors) {
return StyleSheet.create({
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  roundButton: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 999,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  headerText: {
    flex: 1,
  },
  eyebrow: {
    color: colors.textSubtle,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
  },
  shareButton: {
    backgroundColor: colors.button,
    borderRadius: 999,
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  shareText: {
    color: colors.buttonText,
    fontSize: 14,
    fontWeight: '900',
  },
  content: {
    gap: 16,
    padding: 20,
    paddingBottom: 34,
  },
  scrollView: {
    flex: 1,
  },
  qrCard: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 32,
    padding: 24,
  },
  qr: {
    backgroundColor: colors.card,
    borderRadius: 18,
    flexDirection: 'row',
    flexWrap: 'wrap',
    overflow: 'hidden',
  },
  qrCell: {
    backgroundColor: colors.card,
  },
  qrCellActive: {
    backgroundColor: colors.text,
  },
  qrTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
    marginTop: 18,
  },
  qrHint: {
    color: colors.textSubtle,
    fontSize: 13,
    fontWeight: '800',
    marginTop: 4,
  },
  linkCard: {
    backgroundColor: colors.card,
    borderRadius: 24,
    gap: 6,
    padding: 18,
  },
  linkLabel: {
    color: colors.textSubtle,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  linkText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 22,
  },
  copyButton: {
    alignItems: 'center',
    backgroundColor: colors.button,
    borderRadius: 999,
    minHeight: 46,
    justifyContent: 'center',
    marginTop: 8,
  },
  copyText: {
    color: colors.buttonText,
    fontSize: 14,
    fontWeight: '900',
  },
  memberRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    minHeight: 48,
  },
  memberText: {
    flex: 1,
  },
  memberName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '900',
  },
  memberEmail: {
    color: colors.textSubtle,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  leaveButton: {
    alignItems: 'center',
    backgroundColor: `${colors.negative}18`,
    borderRadius: 24,
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
    minHeight: 56,
  },
  leaveText: {
    color: colors.negative,
    fontSize: 16,
    fontWeight: '900',
  },
  pressed: {
    opacity: 0.72,
  },
});
}
