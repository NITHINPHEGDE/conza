import { useState, useCallback } from 'react';
import useAppStore from '../store/useAppStore';
import { bookingAPI } from '../api/bookingAPI';

export const useBooking = (type) => {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const [success, setSuccess] = useState(false);

  const clearCart          = useAppStore((s) => s.clearCart);
  const userLat            = useAppStore((s) => s.userLat);
  const userLng            = useAppStore((s) => s.userLng);
  const userProfile        = useAppStore((s) => s.userProfile);
  const setActiveBookingId = useAppStore((s) => s.setActiveBookingId);
  const addSellerOrder     = useAppStore((s) => s.addSellerOrder);

  const submitBooking = useCallback(async (bookingData) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      const {
        houseNumber, houseName, street, area, city, district,
        state, pincode, paymentMethod, description,
        isImmediate, scheduledDate, latitude, longitude,
      } = bookingData;

      if (!city || !pincode) {
        throw new Error('Please provide at least city and pincode');
      }

      // ── Labour booking → unchanged path ─────────────────────────────────
      if (type === 'labour') {
        const { selectedWorkers, category, subtotal, platformFee, total } = bookingData;
        const sub = (selectedWorkers || []).reduce((s, w) => s + (Number(w.pricePerDay) || 0), 0);
        const fee = Math.round(sub * 0.05);
        const payload = {
          bookingType:   'labour',
          category,
          workers:        (selectedWorkers || []).map((w) => w._id || w.id),
          workerSnapshot: selectedWorkers || [],
          subtotal:       sub,
          platformFee:    fee,
          total:          sub + fee,
          houseNumber:    houseNumber || '',
          houseName:      houseName   || '',
          street:         street      || '',
          address:        street      || '',
          area:           area        || '',
          city,
          district:       district    || '',
          state:          state       || '',
          pincode,
          latitude:       latitude  || userLat,
          longitude:      longitude || userLng,
          paymentMethod:  paymentMethod || 'cod',
          description:    description   || '',
          isImmediate:    isImmediate !== undefined ? isImmediate : true,
          scheduledDate:  scheduledDate || null,
        };
        const result = await bookingAPI.createBooking(payload);
        if (result.success && result.booking?._id) {
          await setActiveBookingId(result.booking._id);
        }
        setSuccess(true);
        return true;
      }

      // ── Material order → seller order API ───────────────────────────────
      if (type === 'material') {
        const { items, subtotal, platformFee, total } = bookingData;

        // Group items by sellerId — each seller gets a separate order
        const bySellerMap = {};
        (items || []).forEach((item) => {
          const sid = item.sellerId || item.seller;
          if (!sid) return;
          if (!bySellerMap[sid]) bySellerMap[sid] = [];
          bySellerMap[sid].push(item);
        });

        const sellerIds = Object.keys(bySellerMap);
        if (!sellerIds.length) throw new Error('No seller information on cart items');

        let lastOrderId = null;
        for (const sellerId of sellerIds) {
          const sellerItems = bySellerMap[sellerId];
          const sellerSubtotal = sellerItems.reduce(
            (sum, i) => sum + (Number(i.price) * (Number(i.quantity) || 1)), 0
          );
          const sellerTotal = Math.round(sellerSubtotal * 1.05) + 99; // platform fee + delivery

          const payload = {
            sellerId,
            orderType:       'material',
            items:           sellerItems.map((i) => ({
              productId: i.id,
              qty:       Number(i.quantity) || 1,
              subtotal:  Number(i.price) * (Number(i.quantity) || 1),
            })),
            customerAddress: `${houseNumber || ''} ${houseName || ''} ${street || ''}`.trim(),
            city,
            pincode,
            latitude:        latitude  || userLat,
            longitude:       longitude || userLng,
            subtotal:        sellerSubtotal,
            deliveryCharge:  99,
            total:           sellerTotal,
            paymentMethod:   paymentMethod || 'cod',
            notes:           description   || '',
          };

          const result = await bookingAPI.placeSellerOrder(payload);
          if (result.success) {
            lastOrderId = result.order._id;
            addSellerOrder(result.order);
          }
        }

        if (lastOrderId) await setActiveBookingId(lastOrderId);
        clearCart();
        setSuccess(true);
        return true;
      }

      // ── Rental order → seller order API ─────────────────────────────────
      if (type === 'rental') {
        const { item, quantity, subtotal, platformFee, total } = bookingData;
        const sellerId = item?.sellerId;
        if (!sellerId) throw new Error('No seller information on rental item');

        const rentalSubtotal = Number(item.pricePerDay) * (Number(quantity) || 1);
        const rentalTotal    = Math.round(rentalSubtotal * 1.05) + 149;

        const payload = {
          sellerId,
          orderType:    'rental',
          items: [{
            productId: item.id,
            qty:       Number(quantity) || 1,
            days:      null,
            subtotal:  rentalSubtotal,
          }],
          customerAddress: `${houseNumber || ''} ${houseName || ''} ${street || ''}`.trim(),
          city,
          pincode,
          latitude:       latitude  || userLat,
          longitude:      longitude || userLng,
          subtotal:       rentalSubtotal,
          deliveryCharge: 149,
          total:          rentalTotal,
          depositAmount:  item.deposit || 0,
          paymentMethod:  paymentMethod || 'cod',
          notes:          description   || '',
        };

        const result = await bookingAPI.placeSellerOrder(payload);
        if (result.success) {
          addSellerOrder(result.order);
          await setActiveBookingId(result.order._id);
        }
        setSuccess(true);
        return true;
      }

    } catch (err) {
      setError(err.message || 'Something went wrong while booking');
      return false;
    } finally {
      setLoading(false);
    }
  }, [type, clearCart, userLat, userLng, userProfile]);

  return { submitBooking, loading, error, success };
};