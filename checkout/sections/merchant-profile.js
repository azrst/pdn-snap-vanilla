(function (global) {
  'use strict';

  var formatCurrency = global.PdnCheckoutUtils.formatCurrency;

  function renderMerchantProfile(merchant, order) {
    var section = document.createElement('header');
    section.className = 'merchant-profile';

    var logoHtml = merchant.logo
      ? '<img class="merchant-profile__logo" src="' + merchant.logo + '" alt="" />'
      : '<span class="merchant-profile__logo merchant-profile__logo--badge" aria-hidden="true">M</span>';

    section.innerHTML =
      '<div class="merchant-profile__row">' +
      logoHtml +
      '<div class="merchant-profile__info">' +
      '<p class="merchant-profile__name">' +
      (merchant.name || 'Merchant') +
      '</p>' +
      '<p class="merchant-profile__amount">' +
      formatCurrency(order.amount, order.currency) +
      '</p>' +
      '<p class="merchant-profile__order">Order: ' +
      order.orderId +
      '</p>' +
      '</div>' +
      '</div>';
    return section;
  }

  global.PdnSectionMerchantProfile = {
    render: renderMerchantProfile,
  };
})(window);
