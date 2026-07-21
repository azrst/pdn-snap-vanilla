/**
 * Shared postMessage contract — loader ↔ checkout.
 */
(function (global) {
  'use strict';

  var PROTOCOL_VERSION = 1;

  var MessageType = {
    INIT: 'PDN_INIT',
    READY: 'PDN_READY',
    RESIZE: 'PDN_RESIZE',
    RESULT: 'PDN_RESULT',
    CLOSE_REQUEST: 'PDN_CLOSE_REQUEST',
    DESTROY: 'PDN_DESTROY',
  };

  global.PdnProtocol = {
    VERSION: PROTOCOL_VERSION,
    MessageType: MessageType,
  };
})(window);
