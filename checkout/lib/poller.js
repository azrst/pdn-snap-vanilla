(function (global) {
  'use strict';

  /**
   * Poll payment status on an interval.
   * Interval ms: options.intervalMs || PdnCheckoutConfig.POLL_INTERVAL_MS (default 2000).
   * Always call stop() on modal close / back / destroy (clears the timer).
   */
  function createStatusPoller(options) {
    var transactionId = options.transactionId;
    var onUpdate = options.onUpdate;
    var onSettled = options.onSettled;
    var getStatus = options.getStatus;
    var config = global.PdnCheckoutConfig || {};
    var intervalMs = Number(options.intervalMs);
    if (!Number.isFinite(intervalMs) || intervalMs < 1) {
      intervalMs = Number(config.POLL_INTERVAL_MS) || 2000;
    }

    var stopped = false;
    var timer = null;
    var inFlight = false;

    function stop() {
      stopped = true;
      if (timer != null) {
        clearTimeout(timer);
        timer = null;
      }
    }

    function scheduleNext() {
      if (stopped) return;
      timer = setTimeout(tick, intervalMs);
    }

    async function tick() {
      if (stopped) return;
      if (inFlight) {
        scheduleNext();
        return;
      }

      inFlight = true;
      try {
        var result = await getStatus(transactionId);
        if (stopped) return;

        onUpdate && onUpdate(result);

        var terminal = ['SUCCESS', 'FAILED', 'EXPIRED'];
        if (terminal.indexOf(result.status) !== -1) {
          stop();
          onSettled && onSettled(result);
          return;
        }
      } catch (e) {
        if (!stopped) {
          console.warn('[pdn-checkout] poll error:', e && e.message ? e.message : e);
        }
      } finally {
        inFlight = false;
      }

      scheduleNext();
    }

    // First check after one interval (charge just succeeded as pending).
    // Set options.immediate = true to poll right away.
    if (options.immediate) {
      tick();
    } else {
      scheduleNext();
    }

    return {
      stop: stop,
      get intervalMs() {
        return intervalMs;
      },
    };
  }

  global.PdnStatusPoller = {
    create: createStatusPoller,
  };
})(window);
