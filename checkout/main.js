(function (global) {
  'use strict';

  var MessageType = global.PdnProtocol.MessageType;
  var Utils = global.PdnCheckoutUtils;

  var root = document.getElementById('app');
  var app = global.PdnCheckoutApp.create(root);

  window.addEventListener('message', function (event) {
    var data = event.data;
    if (!data || !data.type) return;

    if (data.type === MessageType.INIT) {
      app.init(data);
      return;
    }

    app.handleMessage(data);
  });

  Utils.notifyReady();
})(window);
