import { useEffect, useRef, useCallback } from 'react';
import { getRefreshToken, setTokens } from '../api/apiClient';
import authService from '../api/auth';

export const useTokenRefresh = (intervalMs = 12 * 60 * 1000) => {
  const intervalRef = useRef(null);
  // Use a Promise-based lock instead of a simple boolean to correctly
  // serialise concurrent refresh calls from multiple tab-focus events or
  // interval ticks that fire while a refresh is already in-flight.
  const refreshPromiseRef = useRef(null);

  const refreshTokens = useCallback(async () => {
    // If a refresh is already in-flight return that same promise so callers
    // share the result instead of triggering a second request.
    if (refreshPromiseRef.current) return refreshPromiseRef.current;

    const doRefresh = async () => {
      try {
        const refreshToken = getRefreshToken();
        if (!refreshToken) return;

        const response = await authService.refreshToken(refreshToken);
        const data = response.data?.data || response.data;

        if (data?.accessToken) {
          setTokens(data.accessToken, data.refreshToken);
        }
      } catch {
        // Ignore — response interceptor handles auth errors cleanly
      } finally {
        refreshPromiseRef.current = null;
      }
    };

    refreshPromiseRef.current = doRefresh();
    return refreshPromiseRef.current;
  }, []);

  useEffect(() => {
    intervalRef.current = setInterval(refreshTokens, intervalMs);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshTokens();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [intervalMs, refreshTokens]);

  return { refreshTokens };
};
