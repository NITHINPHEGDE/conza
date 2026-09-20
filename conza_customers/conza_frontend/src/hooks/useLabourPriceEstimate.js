import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { AppState } from 'react-native';
import { bookingAPI } from '../api/bookingAPI';

// How often the estimate is silently re-fetched while the payment step is
// open, so a change saved in Admin → Finance → Pricing → Labour shows up
// without the customer having to leave the screen.
const REFRESH_INTERVAL_MS = 20000;

export const useLabourPriceEstimate = ({
  enabled = true,
  workers = [],
  category = '',
  isImmediate = true,
  totalDays = 1,
  isAutobook = false,
  requiredWorkers = 0,
}) => {
  const [estimates, setEstimates] = useState(null);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const payload = useMemo(
    () => ({
      workers: (workers || []).map((w) => ({
        _id: w?._id || w?.id,
        pricePerDay: Number(w?.pricePerDay) || 0,
        minCharge: Number(w?.minCharge) || 0,
        baseCharge: Number(w?.baseCharge) || 0,
        perDayCharge: Number(w?.perDayCharge) || 0,
      })),
      category: category || '',
      isImmediate: !!isImmediate,
      totalDays: Number(totalDays) || 1,
      isAutobook: !!isAutobook,
      requiredWorkers: Number(requiredWorkers) || 0,
    }),
    [workers, category, isImmediate, totalDays, isAutobook, requiredWorkers]
  );
  const payloadKey = useMemo(() => JSON.stringify(payload), [payload]);

  const payloadRef = useRef(payload);
  const keyRef = useRef(payloadKey);
  payloadRef.current = payload;
  keyRef.current = payloadKey;

  const fetchEstimate = useCallback(async ({ silent = false } = {}) => {
    const keyAtCall = keyRef.current;
    if (!silent) {
      setLoading(true);
      setError(null);
    }
    try {
      const res = await bookingAPI.getLabourBillPreview(payloadRef.current);
      if (keyAtCall !== keyRef.current) return; // inputs changed mid-flight
      if (res && res.success && res.estimates) {
        setEstimates(res.estimates);
        setConfig(res.config || null);
        setError(null);
      } else {
        throw new Error((res && res.message) || 'Unable to load price estimate');
      }
    } catch (err) {
      if (keyAtCall !== keyRef.current) return;
      // A failed background refresh keeps showing the last good estimate.
      if (!silent) setError(err?.message || 'Unable to load price estimate');
    } finally {
      if (!silent && keyAtCall === keyRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return undefined;

    fetchEstimate();

    const timer = setInterval(() => fetchEstimate({ silent: true }), REFRESH_INTERVAL_MS);
    const appStateSub = AppState.addEventListener('change', (state) => {
      if (state === 'active') fetchEstimate({ silent: true });
    });

    return () => {
      clearInterval(timer);
      appStateSub.remove();
    };
  }, [enabled, payloadKey, fetchEstimate]);

  const refetch = useCallback(() => fetchEstimate(), [fetchEstimate]);

  return { estimates, config, loading, error, refetch };
};

export default useLabourPriceEstimate;
