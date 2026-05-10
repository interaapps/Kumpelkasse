import { useEffect, useMemo, useState } from 'react';

import { fetchEventsPage } from '@/api/debt-api';
import { DebtEvent, EventDateRange, EventType } from '@/types/debt';

type Filters = {
  query: string;
  type: EventType | 'all';
  range: EventDateRange;
  mineOnly: boolean;
};

export function useEventFeed(groupId: string, visible: boolean, filters: Filters) {
  const [events, setEvents] = useState<DebtEvent[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoadingInitial, setIsLoadingInitial] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const normalizedFilters = useMemo(
    () => ({
      query: filters.query.trim(),
      type: filters.type === 'all' ? null : filters.type,
      range: filters.range,
      mineOnly: filters.mineOnly,
    }),
    [filters.mineOnly, filters.query, filters.range, filters.type],
  );

  useEffect(() => {
    if (!visible) {
      return;
    }

    let active = true;

    async function loadFirstPage() {
      setIsLoadingInitial(true);
      setError(null);

      try {
        const response = await fetchEventsPage({
          groupId,
          page: 0,
          query: normalizedFilters.query,
          type: normalizedFilters.type,
          mine: normalizedFilters.mineOnly,
          range: normalizedFilters.range,
        });

        if (!active) {
          return;
        }

        setEvents(response.items);
        setPage(response.page);
        setHasMore(response.hasMore);
        setTotalCount(response.totalCount);
      } catch {
        if (active) {
          setError('Die Events konnten gerade nicht geladen werden.');
        }
      } finally {
        if (active) {
          setIsLoadingInitial(false);
        }
      }
    }

    loadFirstPage();

    return () => {
      active = false;
    };
  }, [groupId, normalizedFilters, visible]);

  async function loadMore() {
    if (!visible || isLoadingInitial || isLoadingMore || !hasMore) {
      return;
    }

    setIsLoadingMore(true);
    try {
      const nextPage = page + 1;
      const response = await fetchEventsPage({
        groupId,
        page: nextPage,
        query: normalizedFilters.query,
        type: normalizedFilters.type,
        mine: normalizedFilters.mineOnly,
        range: normalizedFilters.range,
      });

      setEvents((current) => {
        const knownIds = new Set(current.map((event) => event.id));
        const appended = response.items.filter((event) => !knownIds.has(event.id));
        return [...current, ...appended];
      });
      setPage(response.page);
      setHasMore(response.hasMore);
      setTotalCount(response.totalCount);
    } catch {
      setError('Weitere Events konnten nicht geladen werden.');
    } finally {
      setIsLoadingMore(false);
    }
  }

  async function refresh() {
    if (!visible) {
      return;
    }

    setIsRefreshing(true);
    setError(null);

    try {
      const response = await fetchEventsPage({
        groupId,
        page: 0,
        query: normalizedFilters.query,
        type: normalizedFilters.type,
        mine: normalizedFilters.mineOnly,
        range: normalizedFilters.range,
      });

      setEvents(response.items);
      setPage(response.page);
      setHasMore(response.hasMore);
      setTotalCount(response.totalCount);
    } catch {
      setError('Die Event-Liste konnte nicht aktualisiert werden.');
    } finally {
      setIsRefreshing(false);
    }
  }

  return {
    events,
    totalCount,
    hasMore,
    isLoadingInitial,
    isLoadingMore,
    isRefreshing,
    error,
    loadMore,
    refresh,
  };
}
