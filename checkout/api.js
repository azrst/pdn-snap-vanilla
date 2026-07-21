(function (global) {
  'use strict';

  var Config = global.PdnCheckoutConfig;

  function getBaseUrl() {
    var base = Config.SCRIPT_TOKEN_URL || '';
    return String(base).replace(/\/$/, '');
  }

  function parseErrorMessage(status, body) {
    if (!body || typeof body !== 'object') {
      return 'Request failed (' + status + ')';
    }
    if (body.message) return String(body.message);
    if (body.response_message) return String(body.response_message);
    if (body.error) return String(body.error);
    return 'Request failed (' + status + ')';
  }

  /**
   * QRIS: { token, payment_type } — omit channel_code even when channels.code is QRIS.
   * VA (and others): include channel_code from channels[].code.
   */
  function buildChargeBody(token, selection) {
    var body = {
      token: token,
      payment_type: selection.payment_type,
    };
    if (selection.payment_type !== 'QRIS' && selection.channel_code) {
      body.channel_code = selection.channel_code;
    }
    return body;
  }

  /**
   * Parse data.expiry_at → epoch ms. Returns null if missing/invalid (no fake fallback).
   */
  function parseExpiryAt(expiryAt) {
    if (expiryAt == null || expiryAt === '') return null;
    if (typeof expiryAt === 'number' && Number.isFinite(expiryAt)) {
      // Already epoch ms (or seconds — treat small values as seconds)
      return expiryAt < 1e12 ? expiryAt * 1000 : expiryAt;
    }
    var ms = Date.parse(String(expiryAt));
    if (Number.isNaN(ms)) return null;
    return ms;
  }

  /**
   * Normalize API data.status → SUCCESS | FAILED | EXPIRED | REQUEST
   */
  function normalizeStatus(raw) {
    if (raw == null) return 'REQUEST';
    var s = String(raw).toUpperCase();

    if (s === 'SUCCESS' || s === 'PAID' || s === 'SETTLEMENT') {
      return 'SUCCESS';
    }
    if (s === 'FAILED' || s === 'DENY' || s === 'DENIED') {
      return 'FAILED';
    }
    if (s === 'EXPIRED' || s === 'EXPIRE') {
      return 'EXPIRED';
    }
    return 'REQUEST';
  }

  async function charge(token, selection) {
    var baseUrl = getBaseUrl();
    if (!baseUrl) {
      throw new Error('SCRIPT_TOKEN_URL is not set in checkout/config.js');
    }
    if (!token) {
      throw new Error('Missing session token');
    }
    if (!selection || !selection.payment_type) {
      throw new Error('Missing payment selection');
    }

    var response = await fetch(baseUrl + '/v1/snap/charge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildChargeBody(token, selection)),
    });

    var body = null;
    try {
      body = await response.json();
    } catch (e) {
      body = null;
    }

    if (!response.ok) {
      throw new Error(parseErrorMessage(response.status, body));
    }

    if (!body || body.response_code !== 'SUCCESS' || !body.data) {
      throw new Error(parseErrorMessage(response.status, body) || 'Invalid charge response');
    }

    var data = body.data;
    var expiryAtRaw = data.expiry_at;
    var expiresAt = parseExpiryAt(expiryAtRaw);
    var transactionId = data.transaction_id;

    if (!transactionId) {
      throw new Error('Charge response missing transaction_id');
    }

    return {
      transaction_id: transactionId,
      payment_type: data.payment_type || selection.payment_type,
      status: normalizeStatus(data.status || 'REQUEST'),
      qr_string: data.qr_string || null,
      va_number:
        data.va_number ||
        data.virtual_account_number ||
        data.account_number ||
        null,
      expiry_at: expiryAtRaw || null,
      expires_at: expiresAt,
      expires_in_ms: expiresAt != null ? Math.max(0, expiresAt - Date.now()) : null,
      raw: data,
    };
  }

  /**
   * GET {SCRIPT_TOKEN_URL}/v1/snap/transactions/{transaction_id}
   */
  async function getStatus(transactionId) {
    var baseUrl = getBaseUrl();
    if (!baseUrl) {
      throw new Error('SCRIPT_TOKEN_URL is not set in checkout/config.js');
    }
    if (!transactionId) {
      throw new Error('transaction_id is required');
    }

    var response = await fetch(
      baseUrl + '/v1/snap/transactions/' + encodeURIComponent(transactionId),
      {
        method: 'GET',
        headers: { Accept: 'application/json' },
      }
    );

    var body = null;
    try {
      body = await response.json();
    } catch (e) {
      body = null;
    }

    if (!response.ok) {
      throw new Error(parseErrorMessage(response.status, body));
    }

    var data = body && body.data ? body.data : body;
    if (!data) {
      throw new Error('Invalid status response');
    }

    var expiryAtRaw = data.expiry_at;
    var expiresAt = parseExpiryAt(expiryAtRaw);
    var rawStatus = data.status || data.transaction_status || data.payment_status;

    return {
      transaction_id: data.transaction_id || transactionId,
      status: normalizeStatus(rawStatus),
      payment_type: data.payment_type || '',
      expiry_at: expiryAtRaw || null,
      expires_at: expiresAt,
      expires_in_ms: expiresAt != null ? Math.max(0, expiresAt - Date.now()) : null,
      raw: data,
      response_code: body && body.response_code,
    };
  }

  global.PdnCheckoutApi = {
    buildChargeBody: buildChargeBody,
    parseExpiryAt: parseExpiryAt,
    charge: charge,
    getStatus: getStatus,
    normalizeStatus: normalizeStatus,
  };
})(window);
