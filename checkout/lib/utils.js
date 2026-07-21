(function (global) {
  'use strict';

  var MessageType = global.PdnProtocol.MessageType;

  function formatCurrency(amount, currency) {
    currency = currency || 'IDR';
    try {
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: currency,
        maximumFractionDigits: 0,
      }).format(amount);
    } catch (_) {
      return currency + ' ' + amount;
    }
  }

  function postToParent(message) {
    if (window.parent === window) return;
    window.parent.postMessage(message, '*');
  }

  function notifyResize() {
    var content =
      document.querySelector('.checkout') ||
      document.getElementById('app') ||
      document.body;
    var height = Math.ceil(
      Math.max(
        content.offsetHeight || 0,
        content.scrollHeight || 0,
        content.getBoundingClientRect().height || 0
      )
    );
    if (height > 0) {
      postToParent({ type: MessageType.RESIZE, height: height });
    }
  }

  function notifyResult(status, data) {
    postToParent({ type: MessageType.RESULT, status: status, data: data });
  }

  function notifyReady() {
    postToParent({ type: MessageType.READY });
  }

  function notifyCloseRequest() {
    postToParent({ type: MessageType.CLOSE_REQUEST });
  }

  global.PdnCheckoutUtils = {
    MessageType: MessageType,
    formatCurrency: formatCurrency,
    notifyResize: notifyResize,
    notifyResult: notifyResult,
    notifyReady: notifyReady,
    notifyCloseRequest: notifyCloseRequest,
  };
})(window);
