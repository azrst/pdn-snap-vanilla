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
