(function (global) {
  'use strict';

  /**
   * Countdown driven by absolute expiry timestamp (from data.expiry_at).
   * Call setExpiresAt(ms) if status poll returns an updated expiry_at.
   */
  function createCountdown(expiresAt, onTick, onExpired) {
    var timer = null;
    var stopped = false;
    var target = typeof expiresAt === 'number' && Number.isFinite(expiresAt) ? expiresAt : null;

    function stop() {
      stopped = true;
      if (timer) clearTimeout(timer);
      timer = null;
    }

    function tick() {
      if (stopped) return;
      if (target == null) {
        onTick(null);
        return;
      }
      var remaining = Math.max(0, target - Date.now());
      onTick(remaining);
      if (remaining <= 0) {
        stop();
        onExpired && onExpired();
        return;
      }
      timer = setTimeout(tick, 250);
    }

    function setExpiresAt(nextExpiresAt) {
      if (stopped) return;
      if (typeof nextExpiresAt !== 'number' || !Number.isFinite(nextExpiresAt)) return;
      // Ignore no-op / same second updates
      if (target != null && Math.abs(target - nextExpiresAt) < 500) return;
      target = nextExpiresAt;
      if (timer) clearTimeout(timer);
      timer = null;
      tick();
    }

    tick();
    return {
      stop: stop,
      setExpiresAt: setExpiresAt,
    };
  }

  function formatRemaining(ms) {
    if (ms == null || !Number.isFinite(ms)) return '—';
    var totalSec = Math.max(0, Math.ceil(ms / 1000));
    var h = Math.floor(totalSec / 3600);
    var m = Math.floor((totalSec % 3600) / 60);
    var s = totalSec % 60;
    if (h > 0) {
      return h + ':' + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
    }
    return m + ':' + String(s).padStart(2, '0');
  }

  global.PdnCountdown = {
    create: createCountdown,
    formatRemaining: formatRemaining,
  };
})(window);
