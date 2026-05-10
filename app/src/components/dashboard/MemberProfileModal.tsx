import { SymbolView, SymbolViewProps } from 'expo-symbols';
import { useEffect, useState } from 'react';
import { Alert, Linking, Modal, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/dashboard/Avatar';
import { FormTextInput } from '@/components/dashboard/event-modal/EventModalForm';
import { Member } from '@/types/debt';
import { getInitials } from '@/utils/debt';

type MemberProfileModalProps = {
  visible: boolean;
  member: Member | null;
  currentUserId: string;
  onClose: () => void;
  onSave: (member: Member) => void | Promise<void>;
  onLogout?: () => void | Promise<void>;
};

type PaymentCardAction = {
  label: string;
  onPress: () => void;
  icon: SymbolViewProps['name'];
};

export function MemberProfileModal({
  visible,
  member,
  currentUserId,
  onClose,
  onSave,
  onLogout,
}: MemberProfileModalProps) {
  const [draft, setDraft] = useState<Member | null>(member);

  useEffect(() => {
    setDraft(member);
  }, [member, visible]);

  if (!member || !draft) {
    return null;
  }

  const isOwnProfile = member.id === currentUserId;

  async function handleSave() {
    if (!draft) {
      return;
    }

    try {
      await onSave({
        ...draft,
        initials: getInitials(draft.name) || draft.initials,
      });
      onClose();
    } catch {
      Alert.alert('Speichern fehlgeschlagen', 'Die API konnte dein Profil nicht speichern. Bitte versuche es erneut.');
    }
  }

  async function handleLogout() {
    await onLogout?.();
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable style={({ pressed }) => [styles.roundButton, pressed && styles.pressed]} onPress={onClose}>
            <SymbolView name={{ ios: 'xmark', android: 'close', web: 'close' }} size={17} tintColor="#111827" />
          </Pressable>
          <View style={styles.headerText}>
            <Text style={styles.title}>{member.name}</Text>
          </View>
          {isOwnProfile && (
            <Pressable style={({ pressed }) => [styles.saveButton, pressed && styles.pressed]} onPress={handleSave}>
              <Text style={styles.saveText}>Sichern</Text>
            </Pressable>
          )}
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <View style={styles.profileCard}>
            <Avatar initials={draft.initials} avatarUrl={draft.avatarUrl} size={78} />
            <Text style={styles.profileName}>{draft.name}</Text>
            <Text style={styles.profileMeta}>
              {isOwnProfile ? 'Zahlungsinfos lokal bearbeiten' : 'Kontakt- und Zahlungsinfos'}
            </Text>
          </View>

          {isOwnProfile ? (
            <ProfileEditCards draft={draft} setDraft={setDraft} onLogout={handleLogout} />
          ) : (
            <PaymentInfoCards member={member} />
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function ProfileEditCards({
  draft,
  setDraft,
  onLogout,
}: {
  draft: Member;
  setDraft: React.Dispatch<React.SetStateAction<Member | null>>;
  onLogout: () => void;
}) {
  return (
    <View style={styles.cardStack}>
      <View style={styles.formCard}>
        <Text style={styles.sectionTitle}>Basis</Text>
        <FormTextInput
          label="Name"
          value={draft.name}
          onChangeText={(name) => setDraft((current) => current && { ...current, name, initials: getInitials(name) })}
          placeholder="Dein Name"
        />
      </View>

      <View style={styles.formCard}>
        <Text style={styles.sectionTitle}>Payment Links</Text>
        <FormTextInput
          label="Paypal Link"
          value={draft.paypalUrl ?? ''}
          onChangeText={(paypalUrl) => setDraft((current) => current && { ...current, paypalUrl })}
          placeholder="paypal.me/deinname"
          autoCapitalize="none"
        />
        <FormTextInput
          label="CashApp"
          value={draft.cashAppTag ?? ''}
          onChangeText={(cashAppTag) => setDraft((current) => current && { ...current, cashAppTag })}
          placeholder="$username"
          autoCapitalize="none"
        />
        <FormTextInput
          label="Venmo"
          value={draft.venmoHandle ?? ''}
          onChangeText={(venmoHandle) => setDraft((current) => current && { ...current, venmoHandle })}
          placeholder="@username"
          autoCapitalize="none"
        />
        <FormTextInput
          label="Revolut"
          value={draft.revolutHandle ?? ''}
          onChangeText={(revolutHandle) => setDraft((current) => current && { ...current, revolutHandle })}
          placeholder="@username"
          autoCapitalize="none"
        />
        <FormTextInput
          label="Wise Link"
          value={draft.wiseUrl ?? ''}
          onChangeText={(wiseUrl) => setDraft((current) => current && { ...current, wiseUrl })}
          placeholder="wise.com/pay/me/username"
          autoCapitalize="none"
        />
      </View>

      <View style={styles.formCard}>
        <Text style={styles.sectionTitle}>Direkte Zahlung</Text>
        <FormTextInput
          label="Apple Pay Kontakt"
          value={draft.applePayContact ?? ''}
          onChangeText={(applePayContact) => setDraft((current) => current && { ...current, applePayContact })}
          placeholder="Telefonnummer oder E-Mail"
          autoCapitalize="none"
        />
        <FormTextInput
          label="Bankdaten"
          value={draft.bankDetails ?? ''}
          onChangeText={(bankDetails) => setDraft((current) => current && { ...current, bankDetails })}
          placeholder="IBAN oder kurze Zahlungsinfo"
          autoCapitalize="characters"
        />
        <FormTextInput
          label="Notiz"
          value={draft.note ?? ''}
          onChangeText={(note) => setDraft((current) => current && { ...current, note })}
          placeholder="z.B. bevorzugte Zahlungsart"
          multiline
        />
      </View>

      <Pressable style={({ pressed }) => [styles.logoutButton, pressed && styles.pressed]} onPress={onLogout}>
        <SymbolView name={{ ios: 'rectangle.portrait.and.arrow.right', android: 'logout', web: 'logout' }} size={19} tintColor="#B42318" />
        <Text style={styles.logoutText}>Ausloggen</Text>
      </Pressable>
    </View>
  );
}

function PaymentInfoCards({ member }: { member: Member }) {
  const cards = getPaymentCards(member);

  return (
    <View style={styles.cardStack}>
      <Text style={styles.sectionTitle}>Zahlungsarten</Text>
      {cards.filter(c => c.value).map((card) => (
        <PaymentInfoCard key={card.label} label={card.label} value={card.value} action={card.action} />
      ))}
      {member.note && <PaymentInfoCard label="Notiz" value={member.note} />}
    </View>
  );
}

function PaymentInfoCard({
  label,
  value,
  action,
}: {
  label: string;
  value?: string;
  action?: PaymentCardAction;
}) {
  const content = (
    <>
      <View style={styles.paymentIcon}>
        <SymbolView
          name={action?.icon ?? { ios: 'info.circle.fill', android: 'info', web: 'info' }}
          size={20}
          tintColor="#172033"
        />
      </View>
      <View style={styles.paymentText}>
        <Text style={styles.paymentLabel}>{label}</Text>
        <Text style={[styles.paymentValue, !value && styles.emptyValue]} numberOfLines={2}>
          {value || 'Nicht hinterlegt'}
        </Text>
      </View>
      {action && value && <Text style={styles.actionText}>{action.label}</Text>}
    </>
  );

  if (!action || !value) {
    return <View style={styles.paymentCard}>{content}</View>;
  }

  return (
    <Pressable style={({ pressed }) => [styles.paymentCard, pressed && styles.pressed]} onPress={action.onPress}>
      {content}
    </Pressable>
  );
}

function getPaymentCards(member: Member) {
  return [
    {
      label: 'Paypal',
      value: member.paypalUrl,
      action: member.paypalUrl
        ? createOpenAction('Offnen', normalizeUrl(member.paypalUrl), { ios: 'link', android: 'link', web: 'link' })
        : undefined,
    },
    {
      label: 'CashApp',
      value: member.cashAppTag,
      action: member.cashAppTag
        ? createOpenAction('Offnen', `https://cash.app/${stripHandlePrefix(member.cashAppTag)}`, {
            ios: 'dollarsign.circle.fill',
            android: 'attach_money',
            web: 'attach_money',
          })
        : undefined,
    },
    {
      label: 'Venmo',
      value: member.venmoHandle,
      action: member.venmoHandle
        ? createOpenAction('Offnen', `https://venmo.com/${stripHandlePrefix(member.venmoHandle)}`, {
            ios: 'v.circle.fill',
            android: 'payments',
            web: 'payments',
          })
        : undefined,
    },
    {
      label: 'Revolut',
      value: member.revolutHandle,
      action: member.revolutHandle
        ? createOpenAction('Offnen', `https://revolut.me/${stripHandlePrefix(member.revolutHandle)}`, {
            ios: 'arrow.up.right.circle.fill',
            android: 'open_in_new',
            web: 'open_in_new',
          })
        : undefined,
    },
    {
      label: 'Wise',
      value: member.wiseUrl,
      action: member.wiseUrl
        ? createOpenAction('Offnen', normalizeUrl(member.wiseUrl), {
            ios: 'globe',
            android: 'public',
            web: 'public',
          })
        : undefined,
    },
    {
      label: 'Apple Pay Kontakt',
      value: member.applePayContact,
      action: member.applePayContact
        ? createCopyAction(member.applePayContact, {
            ios: 'apple.logo',
            android: 'phone_iphone',
            web: 'phone_iphone',
          })
        : undefined,
    },
    {
      label: 'Bankdaten',
      value: member.bankDetails,
      action: member.bankDetails
        ? createCopyAction(member.bankDetails, {
            ios: 'doc.on.doc.fill',
            android: 'content_copy',
            web: 'content_copy',
          })
        : undefined,
    },
  ];
}

function createOpenAction(label: string, url: string, icon: SymbolViewProps['name']): PaymentCardAction {
  return {
    label,
    icon,
    onPress: async () => {
      const supported = await Linking.canOpenURL(url);
      if (!supported) {
        Alert.alert('Link kann nicht geoffnet werden', url);
        return;
      }

      await Linking.openURL(url);
    },
  };
}

function createCopyAction(value: string, icon: SymbolViewProps['name']): PaymentCardAction {
  return {
    label: 'Kopieren',
    icon,
    onPress: () => copyText(value),
  };
}

async function copyText(value: string) {
  const clipboard = globalThis.navigator?.clipboard;

  if (clipboard?.writeText) {
    await clipboard.writeText(value);
    Alert.alert('Kopiert', 'Die Zahlungsinfo wurde in die Zwischenablage kopiert.');
    return;
  }

  await Share.share({ message: value });
}

function normalizeUrl(value: string) {
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

function stripHandlePrefix(value: string) {
  return value.trim().replace(/^[@$]/, '');
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
  saveButton: {
    backgroundColor: '#18251E',
    borderRadius: 999,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 16,
  },
  saveText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  content: {
    gap: 16,
    padding: 20,
    paddingBottom: 34,
  },
  profileCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    padding: 24,
  },
  profileName: {
    color: '#111827',
    fontSize: 26,
    fontWeight: '900',
    marginTop: 12,
  },
  profileMeta: {
    color: '#98A2B3',
    fontSize: 14,
    fontWeight: '800',
    marginTop: 4,
    textAlign: 'center',
  },
  cardStack: {
    gap: 14,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    gap: 16,
    padding: 18,
  },
  logoutButton: {
    alignItems: 'center',
    backgroundColor: '#FFF1F0',
    borderRadius: 24,
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
    minHeight: 56,
    paddingHorizontal: 18,
  },
  logoutText: {
    color: '#B42318',
    fontSize: 16,
    fontWeight: '900',
  },
  sectionTitle: {
    color: '#101828',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  paymentCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    flexDirection: 'row',
    gap: 12,
    minHeight: 72,
    padding: 14,
  },
  paymentIcon: {
    alignItems: 'center',
    backgroundColor: '#F1F4F2',
    borderRadius: 18,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  paymentText: {
    flex: 1,
  },
  paymentLabel: {
    color: '#98A2B3',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  paymentValue: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 22,
    marginTop: 3,
  },
  actionText: {
    color: '#159447',
    fontSize: 13,
    fontWeight: '900',
  },
  emptyValue: {
    color: '#A0A8B3',
  },
  pressed: {
    opacity: 0.72,
  },
});
