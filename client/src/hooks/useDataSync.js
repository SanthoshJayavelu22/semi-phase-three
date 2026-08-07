import { useState, useEffect, useCallback, useRef } from 'react';
import socket from '../socket';

export const useDataSync = (entityType, fetcher, options = {}) => {
  const { immediate = true, debounceMs = 300 } = options;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);
  const [lastChange, setLastChange] = useState(0);

  const fetchCounterRef = useRef(0);
  const debounceTimerRef = useRef(null);
  const fetcherRef = useRef(fetcher);

  // Keep fetcherRef updated to avoid stale closures
  useEffect(() => {
    fetcherRef.current = fetcher;
  }, [fetcher]);

  const fetchData = useCallback((force = false) => {
    const token = localStorage.getItem('token') || localStorage.getItem('semi_token') || localStorage.getItem('semi_board_token') || localStorage.getItem('semi_institute_token');
    if (!token && immediate === false) return Promise.resolve(null);

    if (!force && debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    return new Promise((resolve, reject) => {
      const doFetch = async () => {
        const fetchId = ++fetchCounterRef.current;
        setLoading(true);
        try {
          const result = await fetcherRef.current();
          if (fetchId === fetchCounterRef.current) {
            setData(result);
            setError(null);
            resolve(result);
          }
        } catch (err) {
          if (fetchId === fetchCounterRef.current) {
            setError(err);
            reject(err);
          }
        } finally {
          if (fetchId === fetchCounterRef.current) {
            setLoading(false);
          }
        }
      };

      if (force) {
        doFetch();
      } else {
        debounceTimerRef.current = setTimeout(doFetch, debounceMs);
      }
    });
  }, [debounceMs, immediate]);

  // Initial immediate fetch
  useEffect(() => {
    if (immediate) {
      fetchData(true).catch(() => {});
    }
  }, [immediate, fetchData]);

  // Subscribe to socket events for entityType
  useEffect(() => {
    if (!socket || !entityType) return;

    // Subscribe to this entity type channel
    try {
      socket.emit('subscribe', { entityTypes: [entityType] });
    } catch (e) {}

    const handleTimestamps = (timestamps) => {
      if (timestamps && timestamps[entityType]) {
        const ts = timestamps[entityType];
        setLastChange(ts);
      }
    };

    const handleDataChanged = (payload) => {
      if (payload && (payload.entityType === entityType || payload.entityType === 'all')) {
        const newTs = payload.timestamp || Date.now();
        setLastChange(newTs);
        fetchData(false).catch(() => {});
      }
    };

    const handleRefreshRequired = (payload) => {
      if (payload && payload.entityType === entityType) {
        fetchData(true).catch(() => {});
      }
    };

    socket.on('timestamps', handleTimestamps);
    socket.on('DATA_CHANGED', handleDataChanged);
    socket.on('refresh_required', handleRefreshRequired);

    return () => {
      try {
        socket.emit('unsubscribe', { entityTypes: [entityType] });
      } catch (e) {}
      socket.off('timestamps', handleTimestamps);
      socket.off('DATA_CHANGED', handleDataChanged);
      socket.off('refresh_required', handleRefreshRequired);
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [entityType, fetchData]);

  return { data, loading, error, refetch: () => fetchData(true), lastChange };
};

export default useDataSync;
