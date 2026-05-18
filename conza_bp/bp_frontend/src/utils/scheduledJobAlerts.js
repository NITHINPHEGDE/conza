// src/utils/scheduledJobAlerts.js
// Manages in-memory timers for scheduled job alerts (ring 45 min before)

const scheduledTimers = new Map(); // requestId → timeoutId

// ── Schedule an alert 45 minutes before a scheduled job ───────────────────
export const scheduleLocalAlert = (request, onRingCallback) => {
  if (!request.id) return;

  // Cancel existing timer for this request if any
  cancelLocalAlert(request.id);

  const scheduledDate = new Date(request.scheduledDate || request.scheduledTime);
  if (isNaN(scheduledDate.getTime())) return;

  const fireAt  = scheduledDate.getTime() - 45 * 60 * 1000;
  const msUntil = fireAt - Date.now();

  if (msUntil <= 0) return; // Already past

  const timerId = setTimeout(() => {
    scheduledTimers.delete(request.id);
    onRingCallback(request);
  }, msUntil);

  scheduledTimers.set(request.id, timerId);
  console.log(`[ScheduledAlert] Will ring for ${request.id} in ${Math.round(msUntil / 60000)} min`);
};

// ── Cancel a scheduled alert (when job is accepted/declined/cancelled) ────
export const cancelLocalAlert = (requestId) => {
  const timerId = scheduledTimers.get(requestId);
  if (timerId) {
    clearTimeout(timerId);
    scheduledTimers.delete(requestId);
  }
};

// ── Cancel all scheduled alerts ───────────────────────────────────────────
export const cancelAllLocalAlerts = () => {
  scheduledTimers.forEach((timerId) => clearTimeout(timerId));
  scheduledTimers.clear();
};