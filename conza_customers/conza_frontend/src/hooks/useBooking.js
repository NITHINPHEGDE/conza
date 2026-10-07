import { useState, useCallback } from 'react';
import useAppStore from '../store/useAppStore';
import { bookingAPI } from '../api/bookingAPI';

export const useBooking = (type) => {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const [success, setSuccess] = useState(false);

  const clearCart          = useAppStore((s) => s.clearCart);
  const clearRentalCart    = useAppStore((s) => s.clearRentalCart);
  const userLat            = useAppStore((s) => s.userLat);
  const userLng            = useAppStore((s) => s.userLng);
  const userProfile        = useAppStore((s) => s.userProfile);
  const setActiveBookingId     = useAppStore((s) => s.setActiveBookingId);
  const addSellerOrder         = useAppStore((s) => s.addSellerOrder);
  const addAttachmentToProject = useAppStore((s) => s.addAttachmentToProject);

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

      const targetProjectId = bookingData.projectId || bookingData.selectedProject?._id || null;

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
          if (targetProjectId) {
            try {
              await addAttachmentToProject(targetProjectId, {
                refModel: 'Booking',
                refId: result.booking._id,
              });
            } catch (attErr) {
              console.warn('[useBooking] Auto-attach labour booking failed:', attErr?.message || attErr);
            }
          }
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
          // These are a display-only estimate sent along with the request —
          // the backend always recomputes the authoritative bill from the
          // admin panel's Finance → Pricing → Labour settings and ignores
          // any client-supplied figures for the actual charge.
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
            if (targetProjectId) {
              try {
                await addAttachmentToProject(targetProjectId, {
                  refModel: 'Booking',
                  refId: result.booking._id,
                });
              } catch (attErr) {
                console.warn('[useBooking] Auto-attach labour booking failed:', attErr?.message || attErr);
              }
            }
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

      // ── Material order → atomic seller checkout API ─────────────────────
      if (type === 'material') {
        const { items } = bookingData;

        // Group items by sellerId — each seller gets an entry in the checkout
        const bySellerMap = {};
        (items || []).forEach((item) => {
          const sid = item.sellerId || (item.seller && typeof item.seller === 'object' ? item.seller._id : null);
          if (!sid) return;
          const key = String(sid);
          if (!bySellerMap[key]) bySellerMap[key] = [];
          bySellerMap[key].push(item);
        });

        const sellerIds = Object.keys(bySellerMap);
        if (!sellerIds.length) throw new Error('No seller information on cart items');

        const orderSpecs = sellerIds.map((sellerId) => {
          const sellerItems = bySellerMap[sellerId];
          return {
            sellerId,
            orderType: 'material',
            items: sellerItems.map((i) => ({
              productId: i.id || i._id,
              qty:       Number(i.quantity) || 1,
            })),
            deliveryCharge: 99,
            notes: description || '',
          };
        });

        const checkoutPayload = {
          orders:          orderSpecs,
          customerAddress: `${houseNumber || ''} ${houseName || ''} ${street || ''}`.trim(),
          city,
          pincode,
          latitude:        latitude  || userLat,
          longitude:       longitude || userLng,
          paymentMethod:   paymentMethod || 'cod',
          notes:           description   || '',
        };

        const result = await bookingAPI.checkoutSellerOrders(checkoutPayload);
        if (result.success && result.orders?.length) {
          const createdOrders = [];
          for (const order of result.orders) {
            addSellerOrder(order);
            if (targetProjectId) {
              try {
                await addAttachmentToProject(targetProjectId, {
                  refModel: 'SellerOrder',
                  refId: order._id,
                });
              } catch (attErr) {
                console.warn('[useBooking] Auto-attach material order failed:', attErr?.message || attErr);
              }
            }
            createdOrders.push({
              refModel: 'SellerOrder',
              refId: order._id,
              title: (order.items || []).map((i) => i.title).filter(Boolean).join(', ') || 'Material Order',
            });
          }

          clearCart();
          setSuccess(true);
          return createdOrders.length ? createdOrders : null;
        } else {
          throw new Error(result.message || 'Material checkout failed');
        }
      }

      // ── Rental order → atomic seller checkout API ───────────────────────
      if (type === 'rental') {
        const { items: rentalItemsParam, item, quantity } = bookingData;

        // Normalise to an array so the rest of the logic is uniform.
        const rentalItems = rentalItemsParam && rentalItemsParam.length
          ? rentalItemsParam
          : (item ? [{ ...item, _qty: Number(quantity) || 1 }] : []);

        if (!rentalItems.length) throw new Error('No rental items to order');

        // Group by sellerId
        const bySellerMap = {};
        rentalItems.forEach((it) => {
          const sid = it.sellerId || (it.seller && typeof it.seller === 'object' ? it.seller._id : null);
          if (!sid) return;
          const key = String(sid);
          if (!bySellerMap[key]) bySellerMap[key] = [];
          bySellerMap[key].push(it);
        });

        const sellerIds = Object.keys(bySellerMap);
        if (!sellerIds.length) throw new Error('No seller information on rental items');

        const orderSpecs = sellerIds.map((sellerId) => {
          const sellerItems = bySellerMap[sellerId];
          return {
            sellerId,
            orderType: 'rental',
            items: sellerItems.map((it) => ({
              productId: it.id || it._id,
              qty:       it._qty !== undefined ? it._qty : 1,
              days:      null,
            })),
            deliveryCharge: 149,
            notes: description || '',
          };
        });

        const checkoutPayload = {
          orders:          orderSpecs,
          customerAddress: `${houseNumber || ''} ${houseName || ''} ${street || ''}`.trim(),
          city,
          pincode,
          latitude:        latitude  || userLat,
          longitude:       longitude || userLng,
          paymentMethod:   paymentMethod || 'cod',
          notes:           description   || '',
        };

        const result = await bookingAPI.checkoutSellerOrders(checkoutPayload);
        if (result.success && result.orders?.length) {
          const createdOrders = [];
          for (const order of result.orders) {
            addSellerOrder(order);
            if (targetProjectId) {
              try {
                await addAttachmentToProject(targetProjectId, {
                  refModel: 'SellerOrder',
                  refId: order._id,
                });
              } catch (attErr) {
                console.warn('[useBooking] Auto-attach rental order failed:', attErr?.message || attErr);
              }
            }
            createdOrders.push({
              refModel: 'SellerOrder',
              refId: order._id,
              title: (order.items || []).map((i) => i.title).filter(Boolean).join(', ') || 'Equipment Rental',
            });
          }

          setSuccess(true);
          if (rentalItemsParam && rentalItemsParam.length) {
            clearRentalCart();
          }
          if (!createdOrders.length) return null;
          return createdOrders.length === 1 ? createdOrders[0] : createdOrders;
        } else {
          throw new Error(result.message || 'Rental checkout failed');
        }
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