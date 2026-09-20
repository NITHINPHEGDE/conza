// src/hooks/useEarningEstimate.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState } from 'react-native';
import { api } from '../services/apiClient';

// While the Request Details screen is open the estimate is silently
// re-fetched so a change saved in the admin panel (Finance → Categories)
// shows up without the worker having to leave the screen.
const REFRESH_INTERVAL_MS = 20000;

const describeError = (err) => {
  const msg = err?.message || 'Unable to load earning estimate';
  // The old backend has no such route, so it answers "Route … not found."
  if (/^Route .* not found/i.test(msg)) {
    return `${msg} Redeploy/restart the partner backend with the updated code.`;
  }
  return msg;
};

export const useEarningEstimate = (bookingId, enabled = true) => {
  const [estimate, setEstimate] = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);

  const idRef = useRef(bookingId);
  idRef.current = bookingId;

  const fetchEstimate = useCallback(async ({ silent = false } = {}) => {
    const idAtCall = idRef.current;
    if (!idAtCall) return;

    if (!silent) {
      setLoading(true);
      setError(null);
    }
    try {
      const res = await api.get(`/bookings/${idAtCall}/earning-estimate`);
      if (idAtCall !== idRef.current) return; // a different request is open now
      if (res && res.success && res.estimate) {
        setEstimate(res.estimate);
        setError(null);
      } else {
        throw new Error((res && res.message) || 'Unable to load earning estimate');
      }
    } catch (err) {
      if (idAtCall !== idRef.current) return;
      if (__DEV__) console.warn('[useEarningEstimate] failed:', describeError(err));
      // A failed background refresh keeps showing the last good estimate.
      if (!silent) setError(describeError(err));
    } finally {
      if (!silent && idAtCall === idRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled || !bookingId) return undefined;

    fetchEstimate();

    const timer = setInterval(() => fetchEstimate({ silent: true }), REFRESH_INTERVAL_MS);
    const appStateSub = AppState.addEventListener('change', (state) => {
      if (state === 'active') fetchEstimate({ silent: true });
    });

    return () => {
      clearInterval(timer);
      appStateSub.remove();
    };
  }, [enabled, bookingId, fetchEstimate]);

  const refetch = useCallback(() => fetchEstimate(), [fetchEstimate]);

  return { estimate, loading, error, refetch };
};

export default useEarningEstimate;
