(function (global) {
  'use strict';

  var COPY = {
    success: {
      title: 'Payment Successful',
      description: 'Your payment has been received. You can close this window.',
      action: 'Done',
    },
    expired: {
      title: 'Payment Expired',
      description: 'The payment window has expired. Please try again with a new payment.',
      action: 'Close',
    },
    failed: {
      title: 'Payment Failed',
      description: 'We could not complete this payment. Please try again.',
      action: 'Close',
    },
  };

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /**
   * @param {object} options
   * @param {'success'|'expired'|'failed'} options.kind
   * @param {string} [options.title]
   * @param {string} [options.description]
   * @param {string} [options.amount]
   * @param {string} [options.message] - optional API/status message
   * @param {function} [options.onClose]
   */
  function renderPaymentResult(options) {
    options = options || {};
    var kind = options.kind === 'success' || options.kind === 'expired' ? options.kind : 'failed';
    var copy = COPY[kind];
    var title = options.title || copy.title;
    var description = options.description || copy.description;
    var actionLabel = options.actionLabel || copy.action;

    var section = document.createElement('section');
    section.className = 'payment-result payment-result--' + kind;

    var amountHtml = options.amount
      ? '<p class="payment-result__amount">' + escapeHtml(options.amount) + '</p>'
      : '';
    var messageHtml = options.message
      ? '<p class="payment-result__message">' + escapeHtml(options.message) + '</p>'
      : '';

    section.innerHTML =
      '<div class="payment-result__icon" aria-hidden="true"></div>' +
      '<h2 class="payment-result__title">' +
      escapeHtml(title) +
      '</h2>' +
      amountHtml +
      '<p class="payment-result__description">' +
      escapeHtml(description) +
      '</p>' +
      messageHtml +
      '<div class="payment-result__actions">' +
      '<button type="button" class="btn btn--primary" data-action="close">' +
      escapeHtml(actionLabel) +
      '</button>' +
      '</div>';

    section.querySelector('[data-action="close"]').addEventListener('click', function () {
      options.onClose && options.onClose();
    });

    section._pdnCleanup = function () {};

    return section;
  }

  /**
   * Replace a channel section with the result view and keep DOM parent intact.
   */
  function replaceWithResult(hostEl, options) {
    var resultView = renderPaymentResult(options);
    if (hostEl && hostEl.parentNode) {
      hostEl.parentNode.replaceChild(resultView, hostEl);
    }
    if (global.PdnCheckoutUtils && global.PdnCheckoutUtils.notifyResize) {
      requestAnimationFrame(function () {
        global.PdnCheckoutUtils.notifyResize();
      });
    }
    return resultView;
  }

  global.PdnSectionPaymentResult = {
    render: renderPaymentResult,
    replaceWith: replaceWithResult,
  };
})(window);
