import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EventCard } from '@/components/dashboard/EventCard';
import { useEventFeed } from '@/components/dashboard/hooks/useEventFeed';
import { DashboardColors, useDashboardTheme } from '@/components/dashboard/theme';
import { DebtEvent, EventDateRange, EventType } from '@/types/debt';

type EventBrowserModalProps = {
  visible: boolean;
  groupId: string;
  currentUserId: string;
  onClose: () => void;
  onSelectEvent: (event: DebtEvent) => void;
};

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

export function EventBrowserModal({
  visible,
  groupId,
  currentUserId,
  onClose,
  onSelectEvent,
}: EventBrowserModalProps) {
  const insets = useSafeAreaInsets();
  const colors = useDashboardTheme();
  const styles = createStyles(colors);
  const [searchDraft, setSearchDraft] = useState('');
  const [query, setQuery] = useState('');
  const [type, setType] = useState<EventType | 'all'>('all');
  const [range, setRange] = useState<EventDateRange>('LAST_30_DAYS');
  const [mineOnly, setMineOnly] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setQuery(searchDraft);
    }, 250);

    return () => clearTimeout(timeout);
  }, [searchDraft]);

  const feed = useEventFeed(groupId, visible, { query, type, range, mineOnly });

  const summaryText = useMemo(() => {
    if (feed.totalCount === 0) {
      return 'Keine passenden Events';
    }

    const suffix = feed.totalCount === 1 ? 'Event' : 'Events';
    return `${feed.totalCount} ${suffix}`;
  }, [feed.totalCount]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <View style={[styles.safeArea, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>Event-Archiv</Text>
            <Text style={styles.title}>Alle Events</Text>
          </View>
          <Pressable style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]} onPress={onClose}>
            <Text style={styles.closeText}>Fertig</Text>
          </Pressable>
        </View>

        <FlatList
          data={feed.events}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <EventCard
              event={item}
              currentUserId={currentUserId}
              onPress={(event) => {
                onClose();
                onSelectEvent(event);
              }}
            />
          )}
          onEndReachedThreshold={0.35}
          onEndReached={feed.loadMore}
          refreshControl={
            <RefreshControl refreshing={feed.isRefreshing} onRefresh={feed.refresh} tintColor={colors.positive} />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
          ListHeaderComponent={
            <View style={styles.headerStack}>
              <View style={styles.searchCard}>
                <TextInput
                  value={searchDraft}
                  onChangeText={setSearchDraft}
                  placeholder="Titel oder Notiz durchsuchen"
                  placeholderTextColor={colors.textSubtle}
                  style={styles.searchInput}
                />
              </View>

              <View style={styles.statsRow}>
                <Pressable
                  style={({ pressed }) => [styles.statCard, mineOnly && styles.statCardActive, pressed && styles.pressed]}
                  onPress={() => setMineOnly((current) => !current)}>
                  <Text style={[styles.statLabel, mineOnly && styles.statLabelActive]}>Fokus</Text>
                  <Text style={[styles.statValue, mineOnly && styles.statValueActive]}>
                    {mineOnly ? 'Nur mit mir' : 'Alle Mitglieder'}
                  </Text>
                </Pressable>
              </View>

              <FilterSection
                title="Zeitraum"
                values={rangeFilters}
                selectedValue={range}
                onSelect={setRange}
              />

              <FilterSection
                title="Typ"
                values={typeFilters}
                selectedValue={type}
                onSelect={setType}
              />

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
          }
          ListEmptyComponent={
            feed.isLoadingInitial ? (
              <View style={styles.emptyCard}>
                <ActivityIndicator color={colors.positive} />
                <Text style={styles.emptyText}>Events werden geladen…</Text>
              </View>
            ) : (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>Nichts gefunden</Text>
                <Text style={styles.emptyText}>Passe Suche oder Filter an, um weitere Events zu sehen.</Text>
              </View>
            )
          }
          ListFooterComponent={
            feed.events.length === 0 ? null : (
              <View style={styles.footer}>
                {feed.isLoadingMore ? (
                  <ActivityIndicator color={colors.positive} />
                ) : (
                  <Text style={styles.footerText}>
                    {feed.hasMore ? 'Beim Scrollen laden wir weitere Events nach.' : 'Du hast alle passenden Events gesehen.'}
                  </Text>
                )}
              </View>
            )
          }
        />
      </View>
    </Modal>
  );
}

type FilterSectionProps<T extends string> = {
  title: string;
  values: Array<{ value: T; label: string }>;
  selectedValue: T;
  onSelect: (value: T) => void;
};

function FilterSection<T extends string>({ title, values, selectedValue, onSelect }: FilterSectionProps<T>) {
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
    safeArea: {
      backgroundColor: colors.background,
      flex: 1,
    },
    header: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingTop: 8,
      paddingBottom: 12,
    },
    eyebrow: {
      color: colors.textSubtle,
      fontSize: 12,
      fontWeight: '800',
      textTransform: 'uppercase',
    },
    title: {
      color: colors.text,
      fontSize: 28,
      fontWeight: '900',
      letterSpacing: -0.8,
      marginTop: 4,
    },
    closeButton: {
      backgroundColor: colors.cardMuted,
      borderRadius: 999,
      minHeight: 42,
      justifyContent: 'center',
      paddingHorizontal: 16,
    },
    closeText: {
      color: colors.text,
      fontSize: 15,
      fontWeight: '900',
    },
    content: {
      gap: 12,
      paddingHorizontal: 20,
      paddingBottom: 36,
    },
    headerStack: {
      gap: 14,
      paddingBottom: 10,
    },
    searchCard: {
      backgroundColor: colors.card,
      borderRadius: 28,
      gap: 8,
      padding: 18,
    },
    searchInput: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '800',
    },
    searchHint: {
      color: colors.textMuted,
      fontSize: 13,
      fontWeight: '700',
      lineHeight: 18,
    },
    statsRow: {
      flexDirection: 'row',
      gap: 12,
    },
    statCard: {
      backgroundColor: colors.card,
      borderRadius: 24,
      flex: 1,
      gap: 6,
      padding: 16,
    },
    statCardActive: {
      backgroundColor: `${colors.positive}18`,
    },
    statLabel: {
      color: colors.textSubtle,
      fontSize: 12,
      fontWeight: '800',
      textTransform: 'uppercase',
    },
    statLabelActive: {
      color: colors.positive,
    },
    statValue: {
      color: colors.text,
      fontSize: 17,
      fontWeight: '900',
    },
    statValueActive: {
      color: colors.positive,
    },
    filterBlock: {
      gap: 10,
    },
    filterTitle: {
      color: colors.text,
      fontSize: 15,
      fontWeight: '900',
    },
    filterRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    filterChip: {
      backgroundColor: colors.card,
      borderRadius: 999,
      minHeight: 42,
      justifyContent: 'center',
      paddingHorizontal: 16,
    },
    filterChipActive: {
      backgroundColor: colors.text,
    },
    filterChipText: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '800',
    },
    filterChipTextActive: {
      color: colors.background,
    },
    errorCard: {
      backgroundColor: `${colors.negative}14`,
      borderRadius: 24,
      padding: 16,
    },
    inlineLoadingCard: {
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: 18,
      flexDirection: 'row',
      gap: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    inlineLoadingText: {
      color: colors.textMuted,
      fontSize: 13,
      fontWeight: '700',
    },
    errorTitle: {
      color: colors.negative,
      fontSize: 15,
      fontWeight: '900',
    },
    errorText: {
      color: colors.textMuted,
      fontSize: 14,
      fontWeight: '700',
      lineHeight: 20,
      marginTop: 4,
    },
    emptyCard: {
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: 24,
      gap: 8,
      marginTop: 8,
      padding: 24,
    },
    emptyTitle: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '900',
    },
    emptyText: {
      color: colors.textMuted,
      fontSize: 14,
      fontWeight: '700',
      lineHeight: 20,
      textAlign: 'center',
    },
    footer: {
      alignItems: 'center',
      paddingVertical: 20,
    },
    footerText: {
      color: colors.textSubtle,
      fontSize: 13,
      fontWeight: '700',
      textAlign: 'center',
    },
    pressed: {
      opacity: 0.72,
    },
  });
}
