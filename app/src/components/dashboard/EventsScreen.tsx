import { useIsFocused } from '@react-navigation/native';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { DashboardAuthGate, WebScreenShell } from '@/components/dashboard/DashboardSharedScreens';
import { DashboardPageHeader } from '@/components/dashboard/DashboardPageHeader';
import { EventCard } from '@/components/dashboard/EventCard';
import { EventDetailsModal } from '@/components/dashboard/EventDetailsModal';
import { InviteModal } from '@/components/dashboard/InviteModal';
import { JoinInviteModal } from '@/components/dashboard/JoinInviteModal';
import { MemberProfileModal } from '@/components/dashboard/MemberProfileModal';
import { TopGroupSelector } from '@/components/dashboard/TopGroupSelector';
import { useDashboardStore } from '@/components/dashboard/DashboardStoreProvider';
import { useEventFeed } from '@/components/dashboard/hooks/useEventFeed';
import { DashboardColors, useDashboardTheme } from '@/components/dashboard/theme';
import { BottomTabInset } from '@/constants/theme';
import { EventDateRange, EventType } from '@/types/debt';

const typeFilters: Array<{ value: EventType | 'all'; label: string }> = [
  { value: 'all', label: 'Alle' },
  { value: 'split', label: 'Splits' },
  { value: 'payment', label: 'Zahlungen' },
  { value: 'direct', label: 'Schulden' },
  { value: 'game', label: 'Games' },
];

const rangeFilters: Array<{ value: EventDateRange; label: string }> = [
  { value: 'LAST_7_DAYS', label: '7 Tage' },
  { value: 'LAST_30_DAYS', label: '30 Tage' },
  { value: 'THIS_YEAR', label: 'Dieses Jahr' },
  { value: 'ALL', label: 'Alles' },
];

export function EventsScreen() {
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();
  const { state, actions } = useDashboardStore();
  const colors = useDashboardTheme();
  const styles = createStyles(colors);
  const [searchDraft, setSearchDraft] = useState('');
  const [query, setQuery] = useState('');
  const [type, setType] = useState<EventType | 'all'>('all');
  const [range, setRange] = useState<EventDateRange>('LAST_30_DAYS');
  const [mineOnly, setMineOnly] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setQuery(searchDraft), 250);
    return () => clearTimeout(timeout);
  }, [searchDraft]);

  const dashboard = state.dashboard;
  const currentUserId = state.currentUserId;
  const selectedGroup = dashboard?.groups.find((group) => group.id === dashboard.selectedGroupId) ?? dashboard?.groups[0];
  const currentUser = dashboard?.members.find((member) => member.id === currentUserId) ?? dashboard?.members[0];
  const feed = useEventFeed(selectedGroup?.id ?? '', Boolean(selectedGroup), { query, type, range, mineOnly });

  const summaryText = useMemo(() => {
    if (feed.totalCount === 0) {
      return 'Keine passenden Events';
    }
    return `${feed.totalCount} ${feed.totalCount === 1 ? 'Event' : 'Events'}`;
  }, [feed.totalCount]);

  if (!isFocused) {
    return null;
  }

  return (
    <DashboardAuthGate>
      {dashboard && currentUserId && selectedGroup && currentUser ? (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <WebScreenShell>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={[
                styles.content,
                { paddingBottom: insets.bottom + BottomTabInset + 28 },
              ]}
              refreshControl={
                <RefreshControl refreshing={feed.isRefreshing} onRefresh={feed.refresh} tintColor={colors.positive} />
              }>
              <View style={styles.headerStack}>
                <DashboardPageHeader>
                    <TopGroupSelector
                      groups={dashboard.groups}
                      selectedGroup={selectedGroup}
                      currentUser={currentUser}
                      visible={state.groupSelectorVisible}
                      onOpen={() => actions.setGroupSelectorVisible(true)}
                      onClose={() => actions.setGroupSelectorVisible(false)}
                      onOpenInvite={() => actions.setInviteVisible(true)}
                      onOpenProfile={() => {
                        actions.setSelectedMemberId(currentUserId);
                        actions.setProfileVisible(true);
                      }}
                      onCreateGroup={() => actions.setGroupCreationVisible(true)}
                      onJoinGroupLink={actions.handleJoinGroupLink}
                      onSelectGroup={actions.setSelectedGroupId}
                    />
                  </DashboardPageHeader>
                <View style={styles.pageSection}>
                  <View style={styles.titleBlock}>
                    <Text style={styles.title}>Events</Text>
                    <Text style={styles.subtitle}>{summaryText}</Text>
                  </View>
                  <View style={styles.searchCard}>
                    <TextInput
                      value={searchDraft}
                      onChangeText={setSearchDraft}
                      placeholder="Titel oder Notiz durchsuchen"
                      placeholderTextColor={colors.textSubtle}
                      style={styles.searchInput}
                    />
                  </View>
                  <Pressable
                    style={({ pressed }) => [styles.focusCard, mineOnly && styles.focusCardActive, pressed && styles.pressed]}
                    onPress={() => setMineOnly((current) => !current)}>
                    <Text style={[styles.focusLabel, mineOnly && styles.focusLabelActive]}>Fokus</Text>
                    <Text style={[styles.focusValue, mineOnly && styles.focusValueActive]}>
                      {mineOnly ? 'Nur mit mir' : 'Alle Mitglieder'}
                    </Text>
                  </Pressable>
                  <FilterSection title="Zeitraum" values={rangeFilters} selectedValue={range} onSelect={setRange} />
                  <FilterSection title="Typ" values={typeFilters} selectedValue={type} onSelect={setType} />
                </View>

                {feed.error ? (
                  <View style={styles.errorCard}>
                    <Text style={styles.errorTitle}>Laden fehlgeschlagen</Text>
                    <Text style={styles.errorText}>{feed.error}</Text>
                  </View>
                ) : null}
                {feed.isLoadingInitial && feed.events.length > 0 ? (
                  <View style={styles.inlineLoadingCard}>
                    <ActivityIndicator color={colors.positive} />
                    <Text style={styles.inlineLoadingText}>Filter werden angewendet…</Text>
                  </View>
                ) : null}
              </View>

              {feed.isLoadingInitial && feed.events.length === 0 ? (
                <View style={styles.emptyCard}>
                  <ActivityIndicator color={colors.positive} />
                  <Text style={styles.emptyText}>Events werden geladen…</Text>
                </View>
              ) : feed.events.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyTitle}>Nichts gefunden</Text>
                  <Text style={styles.emptyText}>Passe Suche oder Filter an, um weitere Events zu sehen.</Text>
                </View>
              ) : (
                <View style={styles.eventList}>
                  {feed.events.map((item) => (
                    <EventCard key={item.id} event={item} currentUserId={currentUserId} onPress={actions.setSelectedEvent} />
                  ))}
                  <View style={styles.footer}>
                    {feed.isLoadingMore ? (
                      <ActivityIndicator color={colors.positive} />
                    ) : feed.hasMore ? (
                      <Pressable style={({ pressed }) => [styles.loadMoreButton, pressed && styles.pressed]} onPress={feed.loadMore}>
                        <Text style={styles.loadMoreText}>Weitere Events laden</Text>
                      </Pressable>
                    ) : (
                      <Text style={styles.footerText}>Du hast alle passenden Events gesehen.</Text>
                    )}
                  </View>
                </View>
              )}
            </ScrollView>
          </WebScreenShell>

          <EventDetailsModal
            event={state.selectedEvent}
            members={dashboard.members}
            visible={isFocused && Boolean(state.selectedEvent)}
            onClose={() => actions.setSelectedEvent(null)}
            onEdit={actions.handleEditEvent}
            onDelete={actions.handleDeleteEvent}
            onSelectMember={(memberId) => {
              actions.setSelectedEvent(null);
              actions.setSelectedMemberId(memberId);
              actions.setProfileVisible(true);
            }}
          />

          <MemberProfileModal
            visible={isFocused && state.profileVisible}
            member={dashboard.members.find((member) => member.id === state.selectedMemberId) ?? null}
            groupId={dashboard.selectedGroupId ?? ''}
            currentUserId={currentUserId}
            onClose={() => actions.setProfileVisible(false)}
            onSave={actions.handleSaveMember}
            onLogout={actions.handleLogout}
          />

          <InviteModal
            visible={isFocused && state.inviteVisible}
            group={selectedGroup}
            inviteLink={dashboard.inviteLink ?? ''}
            members={dashboard.members}
            onClose={() => actions.setInviteVisible(false)}
            onLeaveGroup={actions.handleLeaveSelectedGroup}
          />

          <JoinInviteModal
            visible={isFocused && Boolean(state.joinPromptGroupId)}
            groupId={state.joinPromptGroupId}
            onClose={() => actions.setJoinPromptGroupId(null)}
            onJoin={actions.joinPendingGroup}
          />
        </SafeAreaView>
      ) : null}
    </DashboardAuthGate>
  );
}

function FilterSection<T extends string>({
  title,
  values,
  selectedValue,
  onSelect,
}: {
  title: string;
  values: Array<{ value: T; label: string }>;
  selectedValue: T;
  onSelect: (value: T) => void;
}) {
  const colors = useDashboardTheme();
  const styles = createStyles(colors);

  return (
    <View style={styles.filterBlock}>
      <Text style={styles.filterTitle}>{title}</Text>
      <View style={styles.filterRow}>
        {values.map((item) => {
          const selected = item.value === selectedValue;
          return (
            <Pressable
              key={item.value}
              style={({ pressed }) => [styles.filterChip, selected && styles.filterChipActive, pressed && styles.pressed]}
              onPress={() => onSelect(item.value)}>
              <Text style={[styles.filterChipText, selected && styles.filterChipTextActive]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function createStyles(colors: DashboardColors) {
  return StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
    content: { gap: 12, paddingTop: 2 },
    headerStack: { gap: 14, paddingBottom: 10 },
    pageSection: { gap: 14, paddingHorizontal: 20 },
    titleBlock: { gap: 4 },
    title: { color: colors.text, fontSize: 28, fontWeight: '900', letterSpacing: -0.8 },
    subtitle: { color: colors.textMuted, fontSize: 14, fontWeight: '700' },
    searchCard: { backgroundColor: colors.card, borderRadius: 28, padding: 18 },
    searchInput: { color: colors.text, fontSize: 16, fontWeight: '800' },
    focusCard: { backgroundColor: colors.card, borderRadius: 24, gap: 6, padding: 16 },
    focusCardActive: { backgroundColor: `${colors.positive}18` },
    focusLabel: { color: colors.textSubtle, fontSize: 12, fontWeight: '800', textTransform: 'uppercase' },
    focusLabelActive: { color: colors.positive },
    focusValue: { color: colors.text, fontSize: 17, fontWeight: '900' },
    focusValueActive: { color: colors.positive },
    filterBlock: { gap: 10 },
    filterTitle: { color: colors.text, fontSize: 15, fontWeight: '900' },
    filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    filterChip: { backgroundColor: colors.card, borderRadius: 999, minHeight: 42, justifyContent: 'center', paddingHorizontal: 16 },
    filterChipActive: { backgroundColor: `${colors.positive}18` },
    filterChipText: { color: colors.textMuted, fontSize: 14, fontWeight: '800' },
    filterChipTextActive: { color: colors.positive },
    errorCard: { backgroundColor: `${colors.negative}16`, borderRadius: 22, padding: 16 },
    errorTitle: { color: colors.negative, fontSize: 15, fontWeight: '900' },
    errorText: { color: colors.textMuted, fontSize: 14, fontWeight: '700', marginTop: 4 },
    inlineLoadingCard: { alignItems: 'center', backgroundColor: colors.card, borderRadius: 22, flexDirection: 'row', gap: 10, padding: 14 },
    inlineLoadingText: { color: colors.textMuted, fontSize: 14, fontWeight: '700' },
    eventList: { gap: 12, paddingHorizontal: 20 },
    emptyCard: { alignItems: 'center', backgroundColor: colors.card, borderRadius: 24, gap: 10, padding: 24, marginHorizontal: 20, marginTop: 8 },
    emptyTitle: { color: colors.text, fontSize: 17, fontWeight: '900' },
    emptyText: { color: colors.textMuted, fontSize: 14, fontWeight: '700', textAlign: 'center' },
    footer: { alignItems: 'center', paddingVertical: 12 },
    loadMoreButton: { backgroundColor: colors.card, borderRadius: 999, minHeight: 44, justifyContent: 'center', paddingHorizontal: 18 },
    loadMoreText: { color: colors.text, fontSize: 14, fontWeight: '900' },
    footerText: { color: colors.textMuted, fontSize: 13, fontWeight: '700', textAlign: 'center' },
    pressed: { opacity: 0.72 },
  });
}
