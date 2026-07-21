/*! pdnSnap loader — built 2026-07-20 */
/**
 * Shared postMessage contract — loader ↔ checkout.
 */
(function (global) {
  'use strict';

  var PROTOCOL_VERSION = 1;

  var MessageType = {
    INIT: 'PDN_INIT',
    READY: 'PDN_READY',
    RESIZE: 'PDN_RESIZE',
    RESULT: 'PDN_RESULT',
    CLOSE_REQUEST: 'PDN_CLOSE_REQUEST',
    DESTROY: 'PDN_DESTROY',
  };

  global.PdnProtocol = {
    VERSION: PROTOCOL_VERSION,
    MessageType: MessageType,
  };
})(window);

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

(function (global) {
  'use strict';

  var LOADER_STYLES =
    '.pdn-snap-overlay{position:fixed;inset:0;z-index:2147483646;display:flex;align-items:center;justify-content:center;background:rgba(15,23,42,.55);backdrop-filter:blur(2px)}' +
    '.pdn-snap-loading{display:flex;flex-direction:column;align-items:center;gap:16px;padding:32px 40px;border-radius:16px;background:#fff;box-shadow:0 25px 50px -12px rgba(0,0,0,.25)}' +
    '.pdn-snap-spinner{width:40px;height:40px;border:3px solid #e2e8f0;border-top-color:#2563eb;border-radius:50%;animation:pdn-spin .7s linear infinite}' +
    '.pdn-snap-loading-text{margin:0;font-family:system-ui,-apple-system,sans-serif;font-size:14px;color:#475569}' +
    '.pdn-snap-popup-shell{position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(15,23,42,.55)}' +
    '.pdn-snap-popup-frame{width:100%;max-width:420px;height:auto;border:none;border-radius:16px;background:#fff;box-shadow:0 25px 50px -12px rgba(0,0,0,.35);overflow:hidden}' +
    '.pdn-snap-embed-loading{display:flex;align-items:center;justify-content:center;width:100%;min-width:320px;min-height:560px;background:#fff;border-radius:12px}' +
    '.pdn-snap-embed-frame{width:100%;height:100%;min-width:320px;min-height:560px;border:none;border-radius:12px;background:#fff}' +
    '@keyframes pdn-spin{to{transform:rotate(360deg)}}';

  var styleInjected = false;

  function injectStyles() {
    if (styleInjected) return;
    var style = document.createElement('style');
    style.textContent = LOADER_STYLES;
    document.head.appendChild(style);
    styleInjected = true;
  }

  var LOADING_INNER =
    '<div class="pdn-snap-loading">' +
    '<div class="pdn-snap-spinner"></div>' +
    '<p class="pdn-snap-loading-text">Preparing payment...</p>' +
    '</div>';

  function createLoadingOverlay(variant) {
    injectStyles();
    var overlay = document.createElement('div');
    overlay.dataset.pdnSnap = 'loading';
    overlay.className = variant === 'embed' ? 'pdn-snap-embed-loading' : 'pdn-snap-overlay';
    overlay.innerHTML = LOADING_INNER;
    return overlay;
  }

  function createPopupShell(iframe) {
    injectStyles();
    var shell = document.createElement('div');
    shell.className = 'pdn-snap-popup-shell';
    shell.dataset.pdnSnap = 'popup';
    iframe.className = 'pdn-snap-popup-frame';
    shell.appendChild(iframe);
    return shell;
  }

  global.PdnSnapUI = {
    createLoadingOverlay: createLoadingOverlay,
    createPopupShell: createPopupShell,
    injectStyles: injectStyles,
  };
})(window);

(function (global) {
  'use strict';

  var MessageType = global.PdnProtocol.MessageType;

  function getCheckoutUrl() {
    return global.PdnSnapConfig.CHECKOUT_URL;
  }

  function getCheckoutOrigin() {
    return new URL(getCheckoutUrl()).origin;
  }

  function createCheckoutIframe() {
    var iframe = document.createElement('iframe');
    // Cache-bust so checkout scripts (payment list, etc.) always reload in local demo.
    var url = new URL(getCheckoutUrl(), window.location.href);
    url.searchParams.set('_ts', String(Date.now()));
    iframe.src = url.toString();
    iframe.title = 'pdnSnap Checkout';
    iframe.allow = 'payment';
    return iframe;
  }

  function buildEmbedErrorResult(params) {
    return {
      status_code: '400',
      status_message: 'embedId is required',
      order_id: (params && params.orderId) || '',
      gross_amount: String((params && params.amount) || 0),
      currency: (params && params.currency) || 'IDR',
      payment_type: '',
      transaction_status: 'deny',
      transaction_id: '',
      channel: params && params.payment_method ? params.payment_method : '',
    };
  }

  function dispatchResult(result, status, callbacks) {
    if (!callbacks) return;
    if (status === 'success') callbacks.onSuccess && callbacks.onSuccess(result);
    else if (status === 'pending') callbacks.onPending && callbacks.onPending(result);
    else callbacks.onError && callbacks.onError(result);
  }

  function waitForReady(iframe, initMessage, handlers) {
    var checkoutOrigin = getCheckoutOrigin();
    var callbacks = handlers.callbacks;
    var onCloseRequest = handlers.onCloseRequest;
    var onSettled = handlers.onSettled;
    var pendingFired = false;

    function onMessage(event) {
      if (event.origin !== checkoutOrigin) return;
      if (event.source !== iframe.contentWindow) return;

      var data = event.data;
      if (!data || !data.type) return;

      switch (data.type) {
        case MessageType.READY:
          iframe.contentWindow.postMessage(initMessage, checkoutOrigin);
          break;

        case MessageType.RESIZE:
          if (typeof data.height === 'number' && data.height > 0) {
            iframe.style.height = data.height + 'px';
          }
          break;

        case MessageType.RESULT:
          if (data.status === 'pending' && !pendingFired) {
            pendingFired = true;
            dispatchResult(data.data, 'pending', callbacks);
            return;
          }
          if (data.status !== 'pending') {
            dispatchResult(data.data, data.status, callbacks);
            // Keep Snap open — checkout renders result UI; user closes via CLOSE_REQUEST
            onSettled && onSettled(data);
          }
          break;

        case MessageType.CLOSE_REQUEST:
          onCloseRequest && onCloseRequest();
          break;
      }
    }

    window.addEventListener('message', onMessage);
    return function cleanup() {
      window.removeEventListener('message', onMessage);
    };
  }

  function sendDestroy(iframe) {
    var checkoutOrigin = getCheckoutOrigin();
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage({ type: MessageType.DESTROY }, checkoutOrigin);
    }
  }

  global.PdnSnapMessaging = {
    getCheckoutUrl: getCheckoutUrl,
    getCheckoutOrigin: getCheckoutOrigin,
    createCheckoutIframe: createCheckoutIframe,
    waitForReady: waitForReady,
    sendDestroy: sendDestroy,
    buildEmbedErrorResult: buildEmbedErrorResult,
  };
})(window);

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

(function (global) {
  'use strict';

  var PROTOCOL_VERSION = global.PdnProtocol.VERSION;
  var MessageType = global.PdnProtocol.MessageType;
  var UI = global.PdnSnapUI;
  var Bootstrap = global.PdnSnapBootstrap;
  var Messaging = global.PdnSnapMessaging;

  var state = {
    loadingEl: null,
    activeShell: null,
    activeIframe: null,
    cleanupMessage: null,
    activeCallbacks: null,
    completed: false,
  };

  function show() {
    clearLoading();
    state.loadingEl = UI.createLoadingOverlay('popup');
    document.body.appendChild(state.loadingEl);
  }

  function hide() {
    var hadActiveCheckout = Boolean(state.activeShell || state.activeIframe);
    var onClose = state.activeCallbacks && state.activeCallbacks.onClose;
    var completed = state.completed;

    Messaging.sendDestroy(state.activeIframe);
    clearLoading();
    clearCheckout();

    if (hadActiveCheckout && !completed && onClose) {
      onClose();
    }

    state.activeCallbacks = null;
    state.completed = false;
  }

  function clearLoading() {
    if (state.loadingEl) {
      state.loadingEl.remove();
      state.loadingEl = null;
    }
  }

  /** Tear down checkout UI without firing onClose. */
  function clearCheckout() {
    if (state.cleanupMessage) {
      state.cleanupMessage();
      state.cleanupMessage = null;
    }

    if (state.activeIframe) {
      state.activeIframe.remove();
      state.activeIframe = null;
    }

    if (state.activeShell && state.activeShell.dataset.pdnSnap === 'popup') {
      state.activeShell.remove();
    } else if (state.activeShell) {
      state.activeShell.innerHTML = '';
    }

    state.activeShell = null;
  }

  function dismissCheckout() {
    state.completed = true;
    clearLoading();
    clearCheckout();
    state.activeCallbacks = null;
  }

  function showEmbedLoading(embedId) {
    var container = document.getElementById(embedId);
    if (!container) {
      throw new Error('Container #' + embedId + ' not found');
    }
    clearLoading();
    state.loadingEl = UI.createLoadingOverlay('embed');
    container.replaceChildren(state.loadingEl);
    return container;
  }

  function mountPopup(iframe) {
    var shell = UI.createPopupShell(iframe);
    state.activeShell = shell;
    state.activeIframe = iframe;
    document.body.appendChild(shell);

    shell.addEventListener('click', function (event) {
      if (event.target === shell) hide();
    });
  }

  function mountEmbed(iframe, embedId) {
    var container = document.getElementById(embedId);
    if (!container) {
      throw new Error('Container #' + embedId + ' not found');
    }
    clearLoading();
    iframe.className = 'pdn-snap-embed-frame';
    container.replaceChildren(iframe);
    state.activeShell = container;
    state.activeIframe = iframe;
  }

  function buildBootstrapErrorResult(params, error) {
    var message = error instanceof Error ? error.message : 'Failed to open checkout';
    var code = (error && error.code) || message;
    var isDuplicate = code === 'DUPLICATE_ORDER_ID' || message === 'DUPLICATE_ORDER_ID';
    return {
      status_code: String((error && error.statusCode) || (isDuplicate ? 400 : 500)),
      status_message: message,
      error_code: isDuplicate ? 'DUPLICATE_ORDER_ID' : code,
      order_id: params.orderId || '',
      gross_amount: String(params.amount || 0),
      currency: params.currency || 'IDR',
      payment_type: '',
      transaction_status: 'deny',
      transaction_id: '',
      channel: params.payment_method || '',
    };
  }

  async function openCheckout(mode, params, callbacks) {
    callbacks = callbacks || {};
    state.activeCallbacks = callbacks;
    state.completed = false;

    // Loading only — do not hide an existing snap until bootstrap succeeds.
    if (mode === 'embed') {
      showEmbedLoading(params.embedId);
    } else {
      clearLoading();
      state.loadingEl = UI.createLoadingOverlay('popup');
      document.body.appendChild(state.loadingEl);
    }

    var bootstrap;
    try {
      bootstrap = await Bootstrap.fetchBootstrap(params);
    } catch (error) {
      clearLoading();
      if (mode === 'embed' && params.embedId) {
        var embedContainer = document.getElementById(params.embedId);
        if (embedContainer) embedContainer.innerHTML = '';
      }
      callbacks.onError && callbacks.onError(buildBootstrapErrorResult(params, error));
      state.activeCallbacks = null;
      return;
    }

    // Bootstrap OK — replace any previous checkout without treating it as user onClose.
    if (state.activeShell || state.activeIframe) {
      Messaging.sendDestroy(state.activeIframe);
      clearCheckout();
    }

    try {
      var iframe = Messaging.createCheckoutIframe();
      var initMessage = {
        type: MessageType.INIT,
        version: PROTOCOL_VERSION,
        mode: mode,
        token: bootstrap.token,
        merchant: bootstrap.merchant,
        payment_methods: bootstrap.payment_methods || [],
        order: bootstrap.order,
        payment_method: bootstrap.payment_method,
      };

      state.cleanupMessage = Messaging.waitForReady(iframe, initMessage, {
        callbacks: callbacks,
        onSettled: function () {
          // Terminal result delivered — do not fire onClose when user dismisses result UI
          state.completed = true;
        },
        onCloseRequest: function () {
          hide();
        },
      });

      if (mode === 'popup') {
        mountPopup(iframe);
      } else {
        mountEmbed(iframe, params.embedId);
      }

      iframe.addEventListener('load', function () {
        clearLoading();
      });
    } catch (error) {
      clearLoading();
      clearCheckout();
      callbacks.onError && callbacks.onError(buildBootstrapErrorResult(params, error));
      state.activeCallbacks = null;
    }
  }

  function pay(params, callbacks) {
    openCheckout('popup', params, callbacks || {});
  }

  function embed(params, callbacks) {
    callbacks = callbacks || {};
    if (!params || !params.embedId) {
      var errResult = Messaging.buildEmbedErrorResult(params);
      callbacks.onError && callbacks.onError(errResult);
      return null;
    }
    openCheckout('embed', params, callbacks);
    return { hide: hide };
  }

  global.pdnSnap = {
    pay: pay,
    embed: embed,
    show: show,
    hide: hide,
  };
})(window);
