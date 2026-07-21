(function (global) {
  'use strict';

  global.PdnCheckoutConfig = {
    /** Base URL for charge + status APIs (no trailing slash). Must match loader SCRIPT_TOKEN_URL. */
    SCRIPT_TOKEN_URL: 'https://api.arcane-magus.site/',
    /**
     * Status poll interval in milliseconds.
     * GET {SCRIPT_TOKEN_URL}/v1/snap/transactions/{transaction_id}
     */
    POLL_INTERVAL_MS: 4000,
  };
})(window);
