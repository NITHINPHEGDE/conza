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
        isImmediate, scheduledDate, scheduledEndDate, scheduledDates, totalDays,
        latitude, longitude,
      } = bookingData;

      if (!city || !pincode) {
        throw new Error('Please provide at least city and pincode');
      }

      // ── Labour booking: Quick Auto Book ─────────────────────────────────
      if (type === 'labour' && bookingData.isAutobook) {
        const { category, requiredWorkers } = bookingData;
        const payload = {
          category,
          requiredWorkers,
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
          scheduledDate:    scheduledDate    || null,
          scheduledEndDate: scheduledEndDate || null,
          scheduledDates:   scheduledDates   || [],
          totalDays:        totalDays        || 1,
        };
        const result = await bookingAPI.createAutobookBooking(payload);
        if (result.success && result.booking?._id) {
          await setActiveBookingId(result.booking._id);
        }
        setSuccess(true);
        return result.success && result.booking?._id
          ? { refModel: 'Booking', refId: result.booking._id, title: category ? `${category} Booking` : 'Labour Booking' }
          : null;
      }

      // ── Labour booking (manual selection) → ONE booking per worker ────
      // Bug fix: previously every selected worker (A, B, C) was bundled
      // into a single shared Booking document (workers: [a,b,c]) with one
      // shared status/total/checkInTime/etc. Since every status-mutating
      // endpoint (accept, checkIn, complete...) treats a booking as
      // belonging to a single worker, whichever worker acted first (A)
      // silently took over the entire document — flipping status away
      // from 'pending' for B and C (so their copy of the request
      // disappeared), collecting the full combined total (₹600 instead
      // of ₹200 each), and leaving only one status card for the customer.
      //
      // Fix: mirror the existing "group by seller → one order per seller"
      // pattern already used for material orders above. Each selected
      // worker gets their own independent Booking document with their
      // own price, so each worker gets their own request, their own
      // accept/status lifecycle, their own payment, and the customer gets
      // one status card per worker.
      if (type === 'labour') {
        const { selectedWorkers, category } = bookingData;
        const workersList = selectedWorkers || [];
        if (!workersList.length) {
          throw new Error('Please select at least one worker');
        }
        const isMultiDay = !isImmediate && totalDays && totalDays > 1;

        const createdBookings = [];
        for (const worker of workersList) {
          const sub = isMultiDay
            ? (Number(worker.perDayCharge) || Number(worker.pricePerDay) || 0) * totalDays
            : (Number(worker.pricePerDay) || 0);
          const fee = Math.round(sub * 0.05);

          const payload = {
            bookingType:   'labour',
            category,
            workers:        [worker._id || worker.id],
            workerSnapshot: [worker],
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
            scheduledDate:    scheduledDate    || null,
            scheduledEndDate: scheduledEndDate || null,
            scheduledDates:   scheduledDates   || [],
            totalDays:        totalDays        || 1,
          };

          const result = await bookingAPI.createBooking(payload);
          if (result.success && result.booking?._id) {
            createdBookings.push({
              refModel: 'Booking',
              refId:    result.booking._id,
              title:    category
                ? `${category} Booking — ${worker.fullName || worker.name || 'Worker'}`
                : 'Labour Booking',
            });
          }
        }

        if (createdBookings.length) {
          // "Resume tracking" banner can only point at one job at a time —
          // point it at the most recently created one. The Status tab
          // (which lists every booking document independently) is the
          // real source of truth for all of them, not just this pointer.
          await setActiveBookingId(createdBookings[createdBookings.length - 1].refId);
        }

        setSuccess(true);
        return createdBookings.length ? createdBookings : null;
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

        const createdOrders = [];
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
            addSellerOrder(result.order);
            createdOrders.push({
              refModel: 'SellerOrder',
              refId: result.order._id,
              title: (result.order.items || []).map((i) => i.title).filter(Boolean).join(', ') || 'Material Order',
            });
          }
        }

        clearCart();
        setSuccess(true);
        return createdOrders.length ? createdOrders : null;
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
        }
        setSuccess(true);
        return result.success
          ? {
              refModel: 'SellerOrder',
              refId: result.order._id,
              title: (result.order.items || []).map((i) => i.title).filter(Boolean).join(', ') || 'Equipment Rental',
            }
          : null;
      }

    } catch (err) {
      setError(err.message || 'Something went wrong while booking');
      return null;
    } finally {
      setLoading(false);
    }
  }, [type, clearCart, userLat, userLng, userProfile]);

  return { submitBooking, loading, error, success };
};