(function (global) {
  'use strict';

  global.PdnSnapConfig = {
    /** Base URL for session + charge APIs (no trailing slash). Use proxy locally for CORS. */
    SCRIPT_TOKEN_URL: 'https://api.arcane-magus.site/',
    CHECKOUT_URL: 'https://cdn.jsdelivr.net/gh/azrst/pdn-snap-vanilla/checkout/',
    /** Mirrored for docs; checkout uses checkout/config.js POLL_INTERVAL_MS */
    POLL_INTERVAL_MS: 4000,
  };
})(window);
