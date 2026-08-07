import { useEffect, useRef } from 'react';
import apiClient from '../api/apiClient';

/**
 * Custom hook to automatically trigger a data refresh ONLY when relevant database entities are updated.
 * Performs ultra-lightweight timestamp pings without heavy database queries or WebSockets.
 *
 * @param {Array<string>} entityTypes - Array of entity names to track (e.g., ['institutes', 'students', 'marks'])
 * @param {Function} onDataChange - Callback function to trigger data refetch
 * @param {number} intervalMs - Polling interval in ms (default: 5000ms)
 */
export const useDataSync = (entityTypes = [], onDataChange, intervalMs = 5000) => {
  const lastTimestampsRef = useRef({});
  const onDataChangeRef = useRef(onDataChange);

  useEffect(() => {
    onDataChangeRef.current = onDataChange;
  }, [onDataChange]);

  useEffect(() => {
    let isMounted = true;

    const checkChangeTimestamps = async () => {
      const token = localStorage.getItem('token') || localStorage.getItem('semi_token') || localStorage.getItem('semi_board_token') || localStorage.getItem('semi_institute_token');
      if (!token) return;

      try {
        const response = await apiClient.get('/sync/timestamps');
        if (!isMounted) return;

        const serverTimestamps = response.data?.data || response.data || {};
        let hasChanged = false;

        entityTypes.forEach((entity) => {
          const serverTime = serverTimestamps[entity] || 0;
          const lastTime = lastTimestampsRef.current[entity];

          if (lastTime !== undefined && serverTime > lastTime) {
            hasChanged = true;
          }
          lastTimestampsRef.current[entity] = serverTime;
        });

        if (hasChanged && typeof onDataChangeRef.current === 'function') {
          onDataChangeRef.current();
        }
      } catch (err) {
        // Silent catch for network hiccups
      }
    };

    // Initial timestamp check
    checkChangeTimestamps();

    // Periodic lightweight check
    const intervalId = setInterval(checkChangeTimestamps, intervalMs);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [entityTypes.join(','), intervalMs]);
};

export default useDataSync;
