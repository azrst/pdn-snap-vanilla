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
