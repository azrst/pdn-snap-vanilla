(function (global) {
  'use strict';

  var listGroups = global.PdnChannelResolver.listGroups;
  var Utils = global.PdnCheckoutUtils;
  var IMPLEMENTED = { QRIS: true, VA: true };
  var LOGO_STRIP_MAX = 5;

  var ASSET_BASE = 'assets/';
  var METHOD_ICON_SRC = {
    QRIS: ASSET_BASE + 'qr.svg',
    VA: ASSET_BASE + 'va.svg',
    CC: ASSET_BASE + 'card.svg',
  };
  var CHEVRON_SRC = ASSET_BASE + 'chevron-right.svg';

  function badgeLabel(selection) {
    var code = selection.channel_code || selection.payment_type || '';
    if (code.indexOf('VA_') === 0) {
      return code.replace(/^VA_/, '').slice(0, 4);
    }
    if (code.indexOf('CC_') === 0) {
      return 'CC';
    }
    return (code || 'PAY').slice(0, 4);
  }

  function methodIconSrc(code) {
    return METHOD_ICON_SRC[code] || METHOD_ICON_SRC.CC;
  }

  function isPillShape(code) {
    return code === 'QRIS';
  }

  function createMethodIcon(code) {
    var iconEl = document.createElement('span');
    iconEl.className = 'payment-method__icon';
    var img = document.createElement('img');
    img.className = 'payment-method__icon-img';
    img.src = methodIconSrc(code);
    img.alt = '';
    img.width = 36;
    img.height = 36;
    iconEl.appendChild(img);
    return iconEl;
  }

  function createChevron() {
    var chevronEl = document.createElement('span');
    chevronEl.className = 'payment-method__chevron';
    chevronEl.setAttribute('aria-hidden', 'true');
    var img = document.createElement('img');
    img.src = CHEVRON_SRC;
    img.alt = '';
    img.width = 16;
    img.height = 16;
    chevronEl.appendChild(img);
    return chevronEl;
  }

  function createChannelLogoElement(selection) {
    var slot = document.createElement('div');
    slot.className = 'payment-method__logo-slot';

    if (selection.icon_url) {
      var img = document.createElement('img');
      img.className = 'payment-method__logo-img';
      img.src = selection.icon_url;
      img.alt = '';
      img.addEventListener('error', function onError() {
        img.removeEventListener('error', onError);
        var badge = document.createElement('span');
        badge.className = 'payment-method__logo-badge';
        badge.textContent = badgeLabel(selection);
        slot.replaceChildren(badge);
      });
      slot.appendChild(img);
    } else {
      var badge = document.createElement('span');
      badge.className = 'payment-method__logo-badge';
      badge.textContent = badgeLabel(selection);
      slot.appendChild(badge);
    }

    return slot;
  }

  function renderLogoStrip(channels) {
    var strip = document.createElement('div');
    strip.className = 'payment-method__logos';

    var visible = channels.slice(0, LOGO_STRIP_MAX);
    visible.forEach(function (selection) {
      strip.appendChild(createChannelLogoElement(selection));
    });

    if (channels.length > LOGO_STRIP_MAX) {
      var more = document.createElement('span');
      more.className = 'payment-method__more';
      more.textContent = '+more';
      strip.appendChild(more);
    }

    return strip;
  }

  function createChannelButton(selection, onSelect) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'payment-channel';
    btn.setAttribute('data-channel-code', selection.channel_code || '');

    if (selection.icon_url) {
      var img = document.createElement('img');
      img.className = 'payment-channel__logo';
      img.src = selection.icon_url;
      img.alt = '';
      img.addEventListener('error', function onError() {
        img.removeEventListener('error', onError);
        var badge = document.createElement('span');
        badge.className = 'payment-channel__logo payment-channel__logo--badge';
        badge.textContent = badgeLabel(selection);
        img.replaceWith(badge);
      });
      btn.appendChild(img);
    } else {
      var badge = document.createElement('span');
      badge.className = 'payment-channel__logo payment-channel__logo--badge';
      badge.textContent = badgeLabel(selection);
      btn.appendChild(badge);
    }

    var name = document.createElement('span');
    name.className = 'payment-channel__name';
    name.textContent = selection.name || selection.channel_code || '';
    btn.appendChild(name);

    btn.addEventListener('click', function () {
      onSelect(selection);
    });

    return btn;
  }

  function renderPaymentList(state, handlers) {
    var onSelect = handlers && handlers.onSelect;
    var onCancel = handlers && handlers.onCancel;

    var section = document.createElement('section');
    section.className = 'payment-list';
    section.innerHTML =
      '<header class="payment-list__header">' +
      '<h2 class="payment-list__title">Payment Method</h2>' +
      '<p class="payment-list__subtitle">Choose method to continue payment</p>' +
      '</header>';

    var groups = listGroups(state.payment_methods || []);

    if (!groups.length) {
      var empty = document.createElement('p');
      empty.className = 'payment-list__empty';
      empty.textContent = 'No payment methods available.';
      section.appendChild(empty);
      return section;
    }

    var methodsEl = document.createElement('div');
    methodsEl.className = 'payment-list__methods';

    groups.forEach(function (group) {
      var enabled = Boolean(IMPLEMENTED[group.code]);
      var multiChannel = group.channels.length > 1;
      var showLogoStrip = multiChannel;

      var methodEl = document.createElement('div');
      methodEl.className =
        'payment-method' +
        (isPillShape(group.code) ? ' payment-method--pill' : ' payment-method--card') +
        (enabled ? '' : ' payment-method--disabled');
      methodEl.setAttribute('data-method', group.code || '');

      var rowBtn = document.createElement('button');
      rowBtn.type = 'button';
      rowBtn.className = 'payment-method__row';
      rowBtn.disabled = !enabled;

      var bodyEl = document.createElement('span');
      bodyEl.className = 'payment-method__body';

      var nameEl = document.createElement('span');
      nameEl.className = 'payment-method__name';
      nameEl.textContent = group.label;

      bodyEl.appendChild(nameEl);
      bodyEl.appendChild(createChevron());

      rowBtn.appendChild(createMethodIcon(group.code));
      rowBtn.appendChild(bodyEl);
      methodEl.appendChild(rowBtn);

      var channelsEl = document.createElement('div');
      channelsEl.className = 'payment-method__channels';
      channelsEl.hidden = true;

      if (showLogoStrip) {
        methodEl.appendChild(renderLogoStrip(group.channels));
        group.channels.forEach(function (selection) {
          channelsEl.appendChild(createChannelButton(selection, onSelect));
        });
        methodEl.appendChild(channelsEl);
      }

      if (enabled) {
        rowBtn.addEventListener('click', function () {
          if (!multiChannel) {
            onSelect && onSelect(group.channels[0]);
            return;
          }
          var expanded = !channelsEl.hidden;
          channelsEl.hidden = expanded;
          methodEl.classList.toggle('payment-method--expanded', !expanded);
          if (Utils && Utils.notifyResize) {
            requestAnimationFrame(function () {
              Utils.notifyResize();
            });
          }
        });
      }

      methodsEl.appendChild(methodEl);
    });

    section.appendChild(methodsEl);

    var footer = document.createElement('div');
    footer.className = 'payment-list__footer';
    var cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'btn btn--subtle';
    cancelBtn.setAttribute('data-action', 'cancel');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.addEventListener('click', function () {
      onCancel && onCancel();
    });
    footer.appendChild(cancelBtn);
    section.appendChild(footer);

    return section;
  }

  global.PdnSectionPaymentList = {
    render: renderPaymentList,
  };
})(window);
