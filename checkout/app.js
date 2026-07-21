(function (global) {
  'use strict';

  var Utils = global.PdnCheckoutUtils;
  var findSelection = global.PdnChannelResolver.findSelection;
  // var renderMerchant = global.PdnSectionMerchantProfile.render;
  var renderList = global.PdnSectionPaymentList.render;
  var renderNotFound = global.PdnSectionPaymentNotFound.render;
  var renderChannel = global.PdnChannelRegistry.render;
  var MessageType = Utils.MessageType;

  function createApp(root) {
    var state = {
      step: 'loading',
      token: null,
      // merchant: null,
      order: null,
      payment_methods: [],
      payment_method: null,
      selectedChannel: null,
      mode: 'popup',
    };

    var activeCleanup = null;

    function cleanupActiveView() {
      if (activeCleanup) {
        activeCleanup();
        activeCleanup = null;
      }
      if (root._activeSection && root._activeSection._pdnCleanup) {
        root._activeSection._pdnCleanup();
      }
      root._activeSection = null;
    }

    function setState(patch) {
      Object.assign(state, patch);
      render();
    }

    function goToPayment(selection) {
      setState({ step: 'payment', selectedChannel: selection });
    }

    function goToList() {
      setState({ step: 'list', selectedChannel: null });
    }

    function render() {
      cleanupActiveView();
      root.replaceChildren();

      if (state.step === 'loading') {
        root.innerHTML =
          '<div class="checkout-loading"><div class="spinner"></div><p>Loading...</p></div>';
        Utils.notifyResize();
        return;
      }

      var wrapper = document.createElement('div');
      wrapper.className = 'checkout';

      // if (state.mode === 'popup') {
      //   var closeBtn = document.createElement('button');
      //   closeBtn.type = 'button';
      //   closeBtn.className = 'checkout-close';
      //   closeBtn.setAttribute('aria-label', 'Close');
      //   closeBtn.innerHTML = '&times;';
      //   closeBtn.addEventListener('click', function () {
      //     Utils.notifyCloseRequest();
      //   });
      //   wrapper.appendChild(closeBtn);
      // }

      // if (state.merchant && state.order) {
      //   wrapper.appendChild(renderMerchant(state.merchant, state.order));
      // }

      if (state.step === 'not-found') {
        wrapper.appendChild(renderNotFound(state.payment_method));
      }

      if (state.step === 'list') {
        wrapper.appendChild(
          renderList(state, {
            onSelect: goToPayment,
            onCancel: Utils.notifyCloseRequest,
          })
        );
      }

      if (state.step === 'payment' && state.selectedChannel) {
        var paymentEl = renderChannel(state.selectedChannel.payment_type, state, {
          onComplete: function () {},
          onBack: goToList,
        });
        root._activeSection = paymentEl;
        wrapper.appendChild(paymentEl);
      }

      root.appendChild(wrapper);
      requestAnimationFrame(function () {
        Utils.notifyResize();
      });
    }

    return {
      init: function (payload) {
        var paymentMethod = payload.payment_method || null;
        var methods = payload.payment_methods || payload.paymentChannels || [];
        if (!Array.isArray(methods)) methods = [];

        var selection = paymentMethod ? findSelection(methods, paymentMethod) : null;
        var step = 'list';

        if (paymentMethod && !selection) {
          step = 'not-found';
        } else if (selection) {
          step = 'payment';
        }

        setState({
          step: step,
          token: payload.token || null,
          // merchant: payload.merchant || { name: 'Merchant', logo: '' },
          order: payload.order,
          payment_methods: methods,
          payment_method: paymentMethod,
          selectedChannel: selection,
          mode: payload.mode || 'popup',
        });
      },
      destroy: function () {
        cleanupActiveView();
        setState({ step: 'loading', selectedChannel: null, token: null });
      },
      handleMessage: function (data) {
        if (data.type === MessageType.DESTROY) {
          this.destroy();
        }
      },
    };
  }

  global.PdnCheckoutApp = {
    create: createApp,
  };
})(window);
