import { useState, useCallback } from 'react';
import useAppStore from '../store/useAppStore';

/**
 * Custom hook to handle booking submissions for Labour, Materials, and Rental.
 * @param {string} type - 'labour', 'material', or 'rental'
 */
export const useBooking = (type) => {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [success, setSuccess] = useState(false);

  const clearCart = useAppStore((s) => s.clearCart);

  const submitBooking = useCallback(async (bookingData) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      // ── Simulate API delay ──
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // ── Validation (example) ──
      if (!bookingData.address || !bookingData.city || !bookingData.pincode) {
        throw new Error('Please provide complete delivery details');
      }

      // ── Success ──
      console.log(`[useBooking] Submitted ${type} booking:`, bookingData);
      
      if (type === 'material') {
        clearCart();
      }

      setSuccess(true);
      return true;

    } catch (err) {
      setError(err.message || 'Something went wrong while booking');
      return false;
    } finally {
      setLoading(false);
    }
  }, [type, clearCart]);

  return { submitBooking, loading, error, success };
};
