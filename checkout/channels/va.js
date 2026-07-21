(function (global) {
  'use strict';

  var Api = global.PdnCheckoutApi;
  var Utils = global.PdnCheckoutUtils;
  var Result = global.PdnCheckoutResult;
  var Countdown = global.PdnCountdown;
  var StatusPoller = global.PdnStatusPoller;
  var PaymentResult = global.PdnSectionPaymentResult;

  function renderVaChannel(state, handlers) {
    var section = document.createElement('section');
    section.className = 'va-payment';

    var selection = state.selectedChannel;
    var order = state.order;
    var sessionStopped = false;
    var poller = null;
    var countdown = null;
    var transactionId = null;
    var pendingSent = false;
    var amountText = Utils.formatCurrency(order.amount, order.currency);

    section.innerHTML =
      '<div class="va-payment__header">' +
      '<button type="button" class="btn btn--link" data-action="back">Change method</button>' +
      '<p class="va-payment__label">Virtual Account</p>' +
      '<p class="va-payment__channel">' +
      (selection.name || selection.channel_code || 'VA') +
      '</p>' +
      '</div>' +
      '<div class="va-payment__number-wrap">' +
      '<p class="va-payment__number-label">VA Number</p>' +
      '<p class="va-payment__number" data-field="va-number">Creating...</p>' +
      '</div>' +
      '<p class="va-payment__countdown">Expires in <strong data-field="timer">—</strong></p>' +
      '<p class="va-payment__status" data-field="status">Creating payment...</p>';

    var statusEl = section.querySelector('[data-field="status"]');
    var timerEl = section.querySelector('[data-field="timer"]');
    var vaEl = section.querySelector('[data-field="va-number"]');

    function cleanup() {
      sessionStopped = true;
      if (poller) {
        poller.stop();
        poller = null;
      }
      if (countdown) {
        countdown.stop();
        countdown = null;
      }
    }

    section._pdnCleanup = cleanup;

    function settle(kind, callbackStatus, transactionStatus, statusCode, statusMessage) {
      if (sessionStopped) return;
      cleanup();
      var data = Result.build(
        order,
        selection,
        transactionStatus,
        statusCode,
        statusMessage,
        transactionId
      );
      Utils.notifyResult(callbackStatus, data);
      handlers.onComplete && handlers.onComplete();

      var resultView = PaymentResult.replaceWith(section, {
        kind: kind,
        amount: amountText,
        message: statusMessage,
        onClose: function () {
          Utils.notifyCloseRequest();
        },
      });

      var appRoot = document.getElementById('app');
      if (appRoot && appRoot._activeSection === section) {
        appRoot._activeSection = resultView;
      }
    }

    function onExpired() {
      if (timerEl) timerEl.textContent = '0:00';
      settle('expired', 'error', 'expire', '407', 'Payment expired');
    }

    function ensureCountdown(expiresAt) {
      if (expiresAt == null || !Number.isFinite(expiresAt)) return;
      if (!countdown) {
        countdown = Countdown.create(
          expiresAt,
          function (remaining) {
            timerEl.textContent = Countdown.formatRemaining(remaining);
          },
          onExpired
        );
      } else {
        countdown.setExpiresAt(expiresAt);
      }
    }

    function startPoller(initialExpiresAt) {
      var intervalMs =
        (global.PdnCheckoutConfig && global.PdnCheckoutConfig.POLL_INTERVAL_MS) || 2000;

      ensureCountdown(initialExpiresAt);

      poller = StatusPoller.create({
        transactionId: transactionId,
        getStatus: Api.getStatus,
        intervalMs: intervalMs,
        immediate: true,
        onUpdate: function (result) {
          if (sessionStopped) return;
          if (result.expires_at != null) {
            ensureCountdown(result.expires_at);
          }
        },
        onSettled: function (result) {
          if (sessionStopped) return;
          if (result.status === 'SUCCESS') {
            settle('success', 'success', 'settlement', '200', 'Success, transaction is found');
          } else if (result.status === 'FAILED') {
            settle('failed', 'error', 'deny', '400', 'Payment failed');
          } else if (result.status === 'EXPIRED') {
            onExpired();
          }
        },
      });
    }

    async function initPayment() {
      try {
        var charge = await Api.charge(state.token, selection);
        if (sessionStopped) return;

        transactionId = charge.transaction_id;
        if (charge.va_number) {
          vaEl.textContent = charge.va_number;
        } else {
          vaEl.textContent = 'VA details unavailable';
          vaEl.classList.add('va-payment__number--muted');
        }
        statusEl.textContent = 'Waiting for payment...';
        requestAnimationFrame(function () {
          Utils.notifyResize();
        });

        if (!pendingSent) {
          pendingSent = true;
          var pendingData = Result.build(
            order,
            selection,
            'pending',
            '201',
            'Transaction is pending',
            transactionId
          );
          Utils.notifyResult('pending', pendingData);
        }

        startPoller(charge.expires_at);
      } catch (e) {
        if (sessionStopped) return;
        settle('failed', 'error', 'deny', '500', e.message || 'Charge failed');
      }
    }

    section.querySelector('[data-action="back"]').addEventListener('click', function () {
      cleanup();
      handlers.onBack && handlers.onBack();
    });

    initPayment();
    return section;
  }

  global.PdnChannelVa = {
    render: renderVaChannel,
  };
})(window);
