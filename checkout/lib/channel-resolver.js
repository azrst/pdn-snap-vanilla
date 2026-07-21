(function (global) {
  'use strict';

  function normalizeSelection(method, channel) {
    if (!method || !channel) return null;
    return {
      payment_type: method.code,
      channel_code: channel.code,
      name: channel.name || method.name || channel.code,
      icon_url: channel.icon_url || null,
      method: method,
      channel: channel,
    };
  }

  /**
   * Match merchant payment_method against method.code or nested channels[].code.
   * Method-only match with a single channel (e.g. QRIS) selects that leaf.
   */
  function findSelection(paymentMethods, paymentMethod) {
    if (!paymentMethod || !paymentMethods || !paymentMethods.length) return null;
    var needle = String(paymentMethod);

    for (var i = 0; i < paymentMethods.length; i++) {
      var method = paymentMethods[i];
      var channels = method.channels || [];

      if (method.code === needle) {
        if (channels.length === 1) {
          return normalizeSelection(method, channels[0]);
        }
        if (channels.length > 1) {
          for (var j = 0; j < channels.length; j++) {
            if (channels[j].code === needle) {
              return normalizeSelection(method, channels[j]);
            }
          }
        }
        if (channels.length === 0) {
          return {
            payment_type: method.code,
            channel_code: method.code,
            name: method.name || method.code,
            icon_url: null,
            method: method,
            channel: null,
          };
        }
        return null;
      }

      for (var k = 0; k < channels.length; k++) {
        if (channels[k].code === needle) {
          return normalizeSelection(method, channels[k]);
        }
      }
    }

    return null;
  }

  function listGroups(paymentMethods) {
    if (!paymentMethods || !paymentMethods.length) return [];

    return paymentMethods
      .map(function (method) {
        if (!method) return null;
        var channels = method.channels;
        // Support hierarchical API shape; also tolerate a flat channel object.
        if (!Array.isArray(channels)) {
          if (method.code) {
            channels = [{ code: method.code, name: method.name, icon_url: method.icon_url || null }];
          } else {
            channels = [];
          }
        }
        var normalized = channels
          .map(function (ch) {
            return normalizeSelection(method, ch);
          })
          .filter(Boolean);
        return {
          code: method.code,
          label: method.name || method.code,
          channels: normalized,
        };
      })
      .filter(function (group) {
        return group && group.channels && group.channels.length > 0;
      });
  }

  global.PdnChannelResolver = {
    findSelection: findSelection,
    normalizeSelection: normalizeSelection,
    listGroups: listGroups,
  };
})(window);
