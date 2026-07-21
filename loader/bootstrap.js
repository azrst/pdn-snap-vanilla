(function (global) {
  'use strict';

  function readClientKey() {
    var script = document.querySelector('script[pdn-snap-key]');
    if (!script) return null;
    return script.getAttribute('pdn-snap-key');
  }

  function getBaseUrl() {
    var base = (global.PdnSnapConfig && global.PdnSnapConfig.SCRIPT_TOKEN_URL) || '';
    return String(base).replace(/\/$/, '');
  }

  function parseErrorMessage(status, body) {
    if (!body || typeof body !== 'object') {
      return 'Transactions request failed (' + status + ')';
    }
    if (body.message) return String(body.message);
    if (body.response_message) return String(body.response_message);
    if (body.error) return String(body.error);
    return 'Transactions request failed (' + status + ')';
  }

  function makeError(message, code, statusCode) {
    var err = new Error(message);
    err.code = code || message;
    err.statusCode = statusCode || 500;
    return err;
  }

  /**
   * POST {SCRIPT_TOKEN_URL}/snap/transactions
   */
  async function fetchBootstrap(params) {
    var clientKey = readClientKey();
    if (!clientKey) {
      throw makeError('Missing pdn-snap-key on snap.js script tag', 'MISSING_CLIENT_KEY', 400);
    }

    var baseUrl = getBaseUrl();
    if (!baseUrl) {
      throw makeError('SCRIPT_TOKEN_URL is not set in loader/config.js', 'MISSING_CONFIG', 500);
    }

    var orderId = params.orderId;
    var amount = params.amount;
    var currency = params.currency || 'IDR';

    if (!orderId) {
      throw makeError('orderId is required', 'INVALID_ORDER', 400);
    }
    if (!Number.isFinite(amount) || amount < 1) {
      throw makeError('amount must be a positive number', 'INVALID_AMOUNT', 400);
    }

    var response = await fetch(baseUrl + '/snap/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_key: clientKey,
        order_id: orderId,
        amount: amount,
        currency: currency,
      }),
    });

    var body = null;
    try {
      body = await response.json();
    } catch (e) {
      body = null;
    }

    if (!response.ok) {
      var msg = parseErrorMessage(response.status, body);
      throw makeError(msg, msg === 'DUPLICATE_ORDER_ID' ? 'DUPLICATE_ORDER_ID' : 'TRANSACTIONS_FAILED', response.status);
    }

    if (!body || body.response_code !== 'SUCCESS' || !body.data || !body.data.token) {
      var invalidMsg = parseErrorMessage(response.status, body) || 'Invalid transactions response';
      throw makeError(invalidMsg, 'INVALID_RESPONSE', response.status || 500);
    }

    var methods = body.data.payment_methods;
    if (!Array.isArray(methods)) {
      methods = [];
    }

    return {
      token: body.data.token,
      payment_methods: methods,
      merchant: {
        name: 'Merchant',
        logo: '',
      },
      order: {
        orderId: orderId,
        amount: amount,
        currency: currency,
      },
      payment_method: params.payment_method || null,
    };
  }

  global.PdnSnapBootstrap = {
    readClientKey: readClientKey,
    fetchBootstrap: fetchBootstrap,
  };
})(window);
