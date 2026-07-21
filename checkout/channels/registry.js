(function (global) {
  'use strict';

  var renderers = {
    QRIS: global.PdnChannelQris,
    VA: global.PdnChannelVa,
    CC: null,
    CARD: null,
  };

  function renderChannel(code, state, handlers) {
    var renderer = renderers[code];
    if (!renderer || !renderer.render) {
      var el = document.createElement('section');
      el.className = 'channel-stub';
      el.innerHTML =
        '<p>Payment type <strong>' +
        code +
        '</strong> is not implemented yet.</p>' +
        '<button type="button" class="btn btn--secondary" data-action="back">Back</button>';
      el.querySelector('[data-action="back"]').addEventListener('click', handlers.onBack);
      return el;
    }
    return renderer.render(state, handlers);
  }

  global.PdnChannelRegistry = {
    render: renderChannel,
  };
})(window);
