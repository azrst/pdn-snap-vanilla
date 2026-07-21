(function (global) {
  'use strict';

  global.PdnSnapConfig = {
    /** Base URL for session + charge APIs (no trailing slash). Use proxy locally for CORS. */
    SCRIPT_TOKEN_URL: 'http://localhost:8082',
    CHECKOUT_URL: 'http://localhost:8081/checkout/',
    /** Mirrored for docs; checkout uses checkout/config.js POLL_INTERVAL_MS */
    POLL_INTERVAL_MS: 2000,
  };
})(window);
