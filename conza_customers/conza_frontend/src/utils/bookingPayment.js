// Payment-state helpers for labour bookings.
//
// A labour booking is paid AFTER the work is completed, in exactly ONE of two
// ways: the customer pays online from Booking Details → Continue to Payment,
// or the labour collects cash and taps "Cash Collected" in the labour app.
// Once either has happened the booking is "settled" and the customer must
// never be offered (or able) to pay it again. This mirrors the server-side
// rules in conza_backend/controllers/bookingController.js (getPaymentState);
// the server remains the final authority when the payment is actually made.

const PAID_STATUS_VALUES = ['paid', 'collected', 'cash_collected', 'settled'];
const CASH_STATUS_VALUES = ['collected', 'cash_collected'];
const lc = (v) => String(v || '').toLowerCase();

const isCashCollectedUnit = (u) =>
  !!u && (
    u.cashCollected === true ||
    u.isCashCollected === true ||
    !!u.cashCollectedAt ||
    CASH_STATUS_VALUES.includes(lc(u.paymentStatus))
  );

const isSettledUnit = (u) =>
  !!u && (
    isCashCollectedUnit(u) ||
    u.isPaid === true ||
    !!u.paidAt ||
    PAID_STATUS_VALUES.includes(lc(u.paymentStatus))
  );

const usesPerWorkerBilling = (booking) =>
  !!booking && !!booking.isAutobook &&
  (booking.workerStatuses || []).some((w) => w.status === 'completed' && Number(w.total) > 0);

export const getBookingPaymentState = (booking) => {
  const none = { settled: false, paid: false, cashCollected: false, canPay: false, payableAmount: 0 };
  if (!booking || (booking.bookingType && booking.bookingType !== 'labour')) return none;

  // The server also sends its own verdict on every fetch; if it says the
  // booking is settled we trust that even if this device hasn't seen the
  // individual fields yet.
  const serverSettled = booking.paymentState?.settled === true;

  if (usesPerWorkerBilling(booking)) {
    const done = (booking.workerStatuses || []).filter((w) => w.status === 'completed' && Number(w.total) > 0);
    const open = done.filter((w) => !isSettledUnit(w));
    const openAmount = open.reduce((sum, w) => sum + (Number(w.total) || 0), 0);
    const settled = open.length === 0 || serverSettled;
    return {
      settled,
      paid: done.some((w) => lc(w.paymentStatus) === 'paid'),
      cashCollected: done.some(isCashCollectedUnit),
      canPay: booking.status === 'completed' && !settled && open.length > 0,
      payableAmount: settled ? 0 : openAmount,
    };
  }

  const completedEntries = (booking.workerStatuses || []).filter((w) => w.status === 'completed');
  const entriesAllSettled = !!booking.isAutobook && completedEntries.length > 0 && completedEntries.every(isSettledUnit);
  const settled = isSettledUnit(booking) || entriesAllSettled || serverSettled;
  const amount = Number(booking.total) || 0;
  return {
    settled,
    paid: lc(booking.paymentStatus) === 'paid',
    cashCollected:
      isCashCollectedUnit(booking) ||
      (entriesAllSettled && completedEntries.some(isCashCollectedUnit)) ||
      (serverSettled && booking.paymentState?.cashCollected === true),
    canPay: booking.status === 'completed' && !settled && amount > 0,
    payableAmount: settled ? 0 : amount,
  };
};

// 1.5 → "1 hr 30 mins", 0.25 → "15 mins"
export const formatWorkedDuration = (hours) => {
  if (hours == null || isNaN(Number(hours))) return '';
  const totalMinutes = Math.max(0, Math.round(Number(hours) * 60));
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m} min${m === 1 ? '' : 's'}`;
  if (m === 0) return `${h} hr${h === 1 ? '' : 's'}`;
  return `${h} hr${h === 1 ? '' : 's'} ${m} min${m === 1 ? '' : 's'}`;
};
