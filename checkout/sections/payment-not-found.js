(function (global) {
  'use strict';

  function renderPaymentNotFound(paymentMethod) {
    var section = document.createElement('section');
    section.className = 'payment-not-found';
    section.innerHTML =
      '<h2 class="payment-not-found__title">Payment method not found</h2>' +
      '<p class="payment-not-found__text">The channel <code>' +
      (paymentMethod || '') +
      '</code> is not available.</p>' +
      '<button type="button" class="btn btn--secondary" data-action="close">Close</button>';

    section.querySelector('[data-action="close"]').addEventListener('click', function () {
      global.PdnCheckoutUtils.notifyCloseRequest();
    });

    return section;
  }

  global.PdnSectionPaymentNotFound = {
    render: renderPaymentNotFound,
  };
})(window);
