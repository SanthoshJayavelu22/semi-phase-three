import { useEffect, useRef, useCallback } from 'react';
import { getRefreshToken, getAccessToken, setTokens } from '../api/apiClient';
import authService from '../api/auth';

// Refresh the token if it has less than this much time left (e.g., 5 minutes)
const REFRESH_THRESHOLD_MS = 5 * 60 * 1000; 

export const useTokenRefresh = () => {
  const refreshTimeoutRef = useRef(null);
  const refreshPromiseRef = useRef(null);
  const lastRefreshAttemptRef = useRef(0);

  const refreshTokens = useCallback(async (isUserInitiated = false) => {
    // If a refresh is already in-flight, return that same promise.
    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current;
    }
    
    // For user-initiated events, throttle to avoid spamming the refresh endpoint.
    const now = Date.now();
    if (isUserInitiated && now - lastRefreshAttemptRef.current < 60 * 1000) {
      // Don't refresh more than once per minute for user activity
      return;
    }

    const doRefresh = async () => {
      try {
        const refreshToken = getRefreshToken();
        if (!refreshToken) {
          return; // No token to refresh, nothing to do.
        }

        lastRefreshAttemptRef.current = Date.now();
        const response = await authService.refreshToken(refreshToken);
        const data = response.data?.data || response.data;

        if (data?.accessToken) {
          setTokens(data.accessToken, data.refreshToken);
        }
      } catch (error) {
        // Errors here are handled by the response interceptor. We don't want to force logout here.
        console.warn('Proactive token refresh failed:', error);
      } finally {
        refreshPromiseRef.current = null;
      }
    };

    refreshPromiseRef.current = doRefresh();
    return refreshPromiseRef.current;
  }, []);

  useEffect(() => {
    // The primary mechanism: refresh on user activity if the token is nearing expiry.
    const handleUserActivity = () => {
      const accessToken = getAccessToken();
      if (!accessToken) return;

      try {
        const payload = JSON.parse(atob(accessToken.split('.')[1]));
        const expiresAt = payload.exp * 1000;
        
        if (expiresAt - Date.now() < REFRESH_THRESHOLD_MS) {
          refreshTokens(true); // Pass true to indicate a user-initiated refresh
        }
      } catch {
        // Token is malformed, let the API interceptor handle it on the next request.
      }
    };

    // Throttle the event handler to avoid performance issues.
    let activityTimeout;
    const throttledActivityHandler = () => {
      if (activityTimeout) return;
      activityTimeout = setTimeout(() => {
        handleUserActivity();
        activityTimeout = null;
      }, 1000); // Check at most once per second
    };

    // Add event listeners for common user activities.
    window.addEventListener('mousemove', throttledActivityHandler);
    window.addEventListener('keydown', throttledActivityHandler);
    window.addEventListener('click', throttledActivityHandler);
    window.addEventListener('focus', throttledActivityHandler);
    window.addEventListener('visibilitychange', throttledActivityHandler);

    // Fallback: an interval timer to periodically check/refresh in case the user is completely idle.
    refreshTimeoutRef.current = setInterval(() => refreshTokens(false), 10 * 60 * 1000); // every 10 minutes

    return () => {
      window.removeEventListener('mousemove', throttledActivityHandler);
      window.removeEventListener('keydown', throttledActivityHandler);
      window.removeEventListener('click', throttledActivityHandler);
      window.removeEventListener('focus', throttledActivityHandler);
      window.removeEventListener('visibilitychange', throttledActivityHandler);
      if (refreshTimeoutRef.current) clearInterval(refreshTimeoutRef.current);
    };
  }, [refreshTokens]);

  return { refreshTokens };
};
