(function (global) {
  'use strict';

  var Api = global.PdnCheckoutApi;
  var Utils = global.PdnCheckoutUtils;
  var Result = global.PdnCheckoutResult;
  var Countdown = global.PdnCountdown;
  var StatusPoller = global.PdnStatusPoller;
  var PaymentResult = global.PdnSectionPaymentResult;

  var INFO_ICON =
    '<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
    '<circle cx="8" cy="8" r="6.67" stroke="#334155" stroke-width="1.33"/>' +
    '<path d="M8 7V11" stroke="#334155" stroke-width="1.33" stroke-linecap="round"/>' +
    '<circle cx="8" cy="5.33" r="0.67" fill="#334155"/>' +
    '</svg>';

  function renderQr(el, qrString) {
    el.innerHTML = '';
    if (!qrString) {
      el.innerHTML = '<div class="qris-qr-fallback"><small>No QR payload</small></div>';
      return false;
    }
    if (global.QRCode) {
      try {
        new global.QRCode(el, {
          text: String(qrString),
          width: 256,
          height: 256,
          correctLevel: global.QRCode.CorrectLevel
            ? global.QRCode.CorrectLevel.M
            : undefined,
        });
        return true;
      } catch (err) {
        console.warn('[qris] QRCode render failed:', err);
      }
    }
    el.innerHTML =
      '<div class="qris-qr-fallback"><small>QR payload:</small><code>' +
      qrString +
      '</code></div>';
    return false;
  }

  function getQrImageData(qrEl) {
    var canvas = qrEl.querySelector('canvas');
    if (canvas) {
      try {
        return canvas.toDataURL('image/png');
      } catch (err) {
        console.warn('[qris] canvas toDataURL failed:', err);
      }
    }

    var img = qrEl.querySelector('img');
    if (img && img.src) {
      try {
        var offscreen = document.createElement('canvas');
        offscreen.width = img.naturalWidth || img.width || 256;
        offscreen.height = img.naturalHeight || img.height || 256;
        var ctx = offscreen.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, offscreen.width, offscreen.height);
        ctx.drawImage(img, 0, 0, offscreen.width, offscreen.height);
        return offscreen.toDataURL('image/png');
      } catch (err) {
        console.warn('[qris] img toDataURL failed:', err);
      }
    }

    return null;
  }

  function downloadQr(qrEl, filename) {
    var dataUrl = getQrImageData(qrEl);
    if (!dataUrl) return false;

    var link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename || 'qris-payment.png';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
  }

  function renderQrisChannel(state, handlers) {
    var section = document.createElement('section');
    section.className = 'qris-payment';

    var selection = state.selectedChannel;
    var order = state.order;
    var sessionStopped = false;
    var poller = null;
    var countdown = null;
    var transactionId = null;
    var pendingSent = false;

    var amountText = Utils.formatCurrency(order.amount, order.currency);

    section.innerHTML =
      '<h2 class="qris-payment__title">QRIS Payment</h2>' +
      '<div class="qris-payment__card">' +
      '<div class="qris-payment__amount-wrap">' +
      '<p class="qris-payment__amount">' +
      amountText +
      '</p>' +
      '<div class="qris-payment__qr" data-field="qr"></div>' +
      '<div class="qris-payment__timer-wrap">' +
      '<p class="qris-payment__timer-label">Pay Within</p>' +
      '<div class="qris-payment__timer-pill"><span data-field="timer">—</span></div>' +
      '</div>' +
      '</div>' +
      '</div>' +
      '<div class="qris-payment__info">' +
      '<span class="qris-payment__info-icon">' +
      INFO_ICON +
      '</span>' +
      '<div class="qris-payment__info-content">' +
      '<p class="qris-payment__info-title">Scan to Pay</p>' +
      '<p class="qris-payment__info-desc">Scan QRIS using your Bank Apps or e-Wallet to pay</p>' +
      '</div>' +
      '</div>' +
      '<div class="qris-payment__actions">' +
      '<button type="button" class="btn btn--subtle" data-action="cancel">Cancel</button>' +
      '<button type="button" class="btn btn--primary" data-action="download-qr" disabled>Download QR</button>' +
      '</div>' +
      '<p class="qris-payment__status qris-payment__status--hidden" data-field="status">Creating payment...</p>';

    var statusEl = section.querySelector('[data-field="status"]');
    var timerEl = section.querySelector('[data-field="timer"]');
    var qrEl = section.querySelector('[data-field="qr"]');
    var downloadBtn = section.querySelector('[data-action="download-qr"]');

    statusEl.classList.remove('qris-payment__status--hidden');
    statusEl.textContent = 'Creating payment...';

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
      if (downloadBtn) downloadBtn.disabled = true;
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
            if (downloadBtn) downloadBtn.disabled = true;
            settle('success', 'success', 'settlement', '200', 'Success, transaction is found');
          } else if (result.status === 'FAILED') {
            if (downloadBtn) downloadBtn.disabled = true;
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
        var qrRendered = renderQr(qrEl, charge.qr_string);
        statusEl.textContent = 'Waiting for payment...';
        statusEl.classList.add('qris-payment__status--hidden');
        requestAnimationFrame(function () {
          Utils.notifyResize();
        });

        if (downloadBtn) {
          downloadBtn.disabled = !qrRendered;
        }

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
        statusEl.textContent = 'Failed to create payment';
        statusEl.classList.remove('qris-payment__status--hidden');
        if (downloadBtn) downloadBtn.disabled = true;
        settle('failed', 'error', 'deny', '500', e.message || 'Charge failed');
      }
    }

    section.querySelector('[data-action="cancel"]').addEventListener('click', function () {
      cleanup();
      Utils.notifyCloseRequest();
    });

    if (downloadBtn) {
      downloadBtn.addEventListener('click', function () {
        var filename = 'qris-' + (order.orderId || 'payment') + '.png';
        downloadQr(qrEl, filename);
      });
    }

    initPayment();
    return section;
  }

  global.PdnChannelQris = {
    render: renderQrisChannel,
  };
})(window);
