import { useState, useCallback } from 'react';
import useAppStore from '../store/useAppStore';
import { bookingAPI } from '../api/bookingAPI';

export const useBooking = (type) => {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const [success, setSuccess] = useState(false);

  const clearCart  = useAppStore((s) => s.clearCart);
  const userLat    = useAppStore((s) => s.userLat);
  const userLng    = useAppStore((s) => s.userLng);
  const userProfile = useAppStore((s) => s.userProfile);

  const submitBooking = useCallback(async (bookingData) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      const { address, city, pincode, paymentMethod, area, state, latitude, longitude } = bookingData;

      if (!address || !city || !pincode) {
        throw new Error('Please provide complete delivery details');
      }

      // Build payload based on type
      let payload = {
        bookingType:   type,
        address,
        area:          area    || '',
        city,
        state:         state   || '',
        pincode,
        latitude:      latitude  || userLat,
        longitude:     longitude || userLng,
        paymentMethod: paymentMethod || 'cod',
      };

      if (type === 'labour') {
        const { selectedWorkers, category } = bookingData;
        const subtotal    = (selectedWorkers || []).reduce((s, w) => s + (Number(w.pricePerDay) || 0), 0);
        const platformFee = Math.round(subtotal * 0.05);
        payload = {
          ...payload,
          category,
          workers:        (selectedWorkers || []).map((w) => w._id || w.id),
          workerSnapshot: selectedWorkers || [],
          subtotal,
          platformFee,
          total: subtotal + platformFee,
        };
      }

      if (type === 'material') {
        const { items, subtotal, platformFee, total } = bookingData;
        payload = { ...payload, items, subtotal, platformFee, total };
      }

      if (type === 'rental') {
        const { items, subtotal, platformFee, total, scheduledDate, notes } = bookingData;
        payload = { ...payload, items, subtotal, platformFee, total, scheduledDate, notes };
      }

      await bookingAPI.createBooking(payload);

      if (type === 'material') clearCart();

      setSuccess(true);
      return true;

    } catch (err) {
      setError(err.message || 'Something went wrong while booking');
      return false;
    } finally {
      setLoading(false);
    }
  }, [type, clearCart, userLat, userLng]);

  return { submitBooking, loading, error, success };
};