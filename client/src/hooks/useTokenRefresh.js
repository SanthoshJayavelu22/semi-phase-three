import { useEffect, useRef, useCallback } from 'react';
import { getRefreshToken, setTokens } from '../api/apiClient';
import authService from '../api/auth';

export const useTokenRefresh = (intervalMs = 12 * 60 * 1000) => {
  const intervalRef = useRef(null);

  const refreshTokens = useCallback(async () => {
    try {
      const refreshToken = getRefreshToken();
      if (!refreshToken) return;

      const response = await authService.refreshToken(refreshToken);
      const data = response.data?.data || response.data;

      if (data.accessToken) {
        setTokens(data.accessToken, data.refreshToken);
      }
    } catch {
      // Ignore here — the response interceptor will handle a hard 401 redirect.
    }
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
