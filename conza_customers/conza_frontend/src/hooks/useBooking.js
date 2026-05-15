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
  const setActiveBookingId = useAppStore((s) => s.setActiveBookingId);

  const submitBooking = useCallback(async (bookingData) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      const { houseNumber, houseName, street, area, city, district, state, pincode, paymentMethod, description, isImmediate, scheduledDate, latitude, longitude } = bookingData;

      if (!city || !pincode) {
        throw new Error('Please provide at least city and pincode');
      }

      // Build payload based on type
      let payload = {
        bookingType:   type,
        houseNumber:   houseNumber || '',
        houseName:     houseName   || '',
        street:        street      || '',
        address:       bookingData.address || street || '',
        area:          area        || '',
        city,
        district:      district    || '',
        state:         state       || '',
        pincode,
        description:   description || '',
        isImmediate:   isImmediate !== undefined ? isImmediate : true,
        scheduledDate: scheduledDate || null,
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

      const result = await bookingAPI.createBooking(payload);

      if (result.success && result.booking?._id) {
        await setActiveBookingId(result.booking._id);
      }

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