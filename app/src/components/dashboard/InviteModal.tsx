import { SymbolView } from 'expo-symbols';
import { Modal, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { toQR } from 'toqr';

import { Group } from '@/types/debt';

type InviteModalProps = {
  visible: boolean;
  group: Group;
  inviteLink: string;
  onClose: () => void;
};

export function InviteModal({ visible, group, inviteLink, onClose }: InviteModalProps) {
  async function handleShare() {
    await Share.share({
      message: `Komm in meine Gruppe "${group.name}" bei Wir schulden: ${inviteLink}`,
      url: inviteLink,
    });
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable style={({ pressed }) => [styles.roundButton, pressed && styles.pressed]} onPress={onClose}>
            <SymbolView name={{ ios: 'xmark', android: 'close', web: 'close' }} size={17} tintColor="#111827" />
          </Pressable>
          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>Einladen</Text>
            <Text style={styles.title}>{group.name}</Text>
          </View>
          <Pressable style={({ pressed }) => [styles.shareButton, pressed && styles.pressed]} onPress={handleShare}>
            <Text style={styles.shareText}>Teilen</Text>
          </Pressable>
        </View>

        <View style={styles.content}>
          <View style={styles.qrCard}>
            <QrCode value={inviteLink} />
            <Text style={styles.qrTitle}>Invite-Link</Text>
            <Text style={styles.qrHint}>Scanbar fur den lokalen Invite-Link</Text>
          </View>

          <View style={styles.linkCard}>
            <Text style={styles.linkLabel}>Link zum Teilen</Text>
            <Text style={styles.linkText}>{inviteLink}</Text>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

function QrCode({ value }: { value: string }) {
  const cells = Array.from(toQR(value));
  const size = Math.sqrt(cells.length);
  const cellSize = 220 / size;

  return (
    <View style={styles.qr}>
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

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#F7F8F4',
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
    fontSize: 22,
    fontWeight: '900',
  },
  shareButton: {
    backgroundColor: '#18251E',
    borderRadius: 999,
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  shareText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  content: {
    gap: 16,
    padding: 20,
  },
  qrCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    padding: 24,
  },
  qr: {
    backgroundColor: '#F4F6F5',
    borderRadius: 24,
    flexDirection: 'row',
    flexWrap: 'wrap',
    height: 252,
    padding: 16,
    width: 252,
  },
  qrCell: {
    backgroundColor: '#F4F6F5',
  },
  qrCellActive: {
    backgroundColor: '#111827',
  },
  qrTitle: {
    color: '#111827',
    fontSize: 22,
    fontWeight: '900',
    marginTop: 18,
  },
  qrHint: {
    color: '#98A2B3',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 4,
  },
  linkCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    gap: 6,
    padding: 18,
  },
  linkLabel: {
    color: '#98A2B3',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  linkText: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 22,
  },
  pressed: {
    opacity: 0.72,
  },
});
