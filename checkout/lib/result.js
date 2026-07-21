(function (global) {
  'use strict';

  function buildResult(order, selection, transactionStatus, statusCode, statusMessage, transactionId) {
    return {
      status_code: statusCode,
      status_message: statusMessage,
      order_id: order.orderId,
      gross_amount: String(order.amount),
      currency: order.currency || 'IDR',
      payment_type: selection ? (selection.payment_type || '').toLowerCase() : '',
      transaction_status: transactionStatus,
      transaction_id: transactionId || '',
      channel: selection ? selection.channel_code || '' : '',
    };
  }

  global.PdnCheckoutResult = {
    build: buildResult,
  };
})(window);
