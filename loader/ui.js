(function (global) {
  'use strict';

  var LOADER_STYLES =
    '.pdn-snap-overlay{position:fixed;inset:0;z-index:2147483646;display:flex;align-items:center;justify-content:center;background:rgba(15,23,42,.55);backdrop-filter:blur(2px)}' +
    '.pdn-snap-loading{display:flex;flex-direction:column;align-items:center;gap:16px;padding:32px 40px;border-radius:16px;background:#fff;box-shadow:0 25px 50px -12px rgba(0,0,0,.25)}' +
    '.pdn-snap-spinner{width:40px;height:40px;border:3px solid #e2e8f0;border-top-color:#2563eb;border-radius:50%;animation:pdn-spin .7s linear infinite}' +
    '.pdn-snap-loading-text{margin:0;font-family:system-ui,-apple-system,sans-serif;font-size:14px;color:#475569}' +
    '.pdn-snap-popup-shell{position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(15,23,42,.55)}' +
    '.pdn-snap-popup-frame{width:100%;max-width:420px;height:auto;border:none;border-radius:16px;background:#fff;box-shadow:0 25px 50px -12px rgba(0,0,0,.35);overflow:hidden}' +
    '.pdn-snap-embed-loading{display:flex;align-items:center;justify-content:center;width:100%;min-width:320px;min-height:560px;background:#fff;border-radius:12px}' +
    '.pdn-snap-embed-frame{width:100%;height:100%;min-width:320px;min-height:560px;border:none;border-radius:12px;background:#fff}' +
    '@keyframes pdn-spin{to{transform:rotate(360deg)}}';

  var styleInjected = false;

  function injectStyles() {
    if (styleInjected) return;
    var style = document.createElement('style');
    style.textContent = LOADER_STYLES;
    document.head.appendChild(style);
    styleInjected = true;
  }

  var LOADING_INNER =
    '<div class="pdn-snap-loading">' +
    '<div class="pdn-snap-spinner"></div>' +
    '<p class="pdn-snap-loading-text">Preparing payment...</p>' +
    '</div>';

  function createLoadingOverlay(variant) {
    injectStyles();
    var overlay = document.createElement('div');
    overlay.dataset.pdnSnap = 'loading';
    overlay.className = variant === 'embed' ? 'pdn-snap-embed-loading' : 'pdn-snap-overlay';
    overlay.innerHTML = LOADING_INNER;
    return overlay;
  }

  function createPopupShell(iframe) {
    injectStyles();
    var shell = document.createElement('div');
    shell.className = 'pdn-snap-popup-shell';
    shell.dataset.pdnSnap = 'popup';
    iframe.className = 'pdn-snap-popup-frame';
    shell.appendChild(iframe);
    return shell;
  }

  global.PdnSnapUI = {
    createLoadingOverlay: createLoadingOverlay,
    createPopupShell: createPopupShell,
    injectStyles: injectStyles,
  };
})(window);
