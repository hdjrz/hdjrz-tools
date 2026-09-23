// ==UserScript==
// @name         hdjrzTools
// @namespace    https://github.com/hdjrz/hdjrz-tools
// @version      1.8.5
// @description  Streamlines player escalations: extracts player info, formats User Notes, pins them, copies to clipboard, and opens Zoom workspace.
// @author       hdjrz
// @match        *://nano-admin.bet88.ph/*
// @match        *://nano-admin.bet88.ph/
// @match        *://nano-admin.bet88.ph
// @match        https://nano-admin.bet88.ph/*
// @match        https://nano-admin.bet88.ph/
// @match        https://nano-admin.bet88.ph
// @match        http://nano-admin.bet88.ph/*
// @match        http://nano-admin.bet88.ph/
// @match        http://nano-admin.bet88.ph
// @include      *nano-admin.bet88.ph*
// @icon         https://raw.githubusercontent.com/hdjrz/hdjrz-tools/main/icons/icon48.png
// @updateURL    https://hdjrz-license.rosechel05.workers.dev/script.meta.js
// @downloadURL  https://hdjrz-license.rosechel05.workers.dev/script.user.js
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_listValues
// @grant        GM_setClipboard
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @connect      hdjrz-license.rosechel05.workers.dev
// @connect      workers.dev
// @connect      *
// @run-at       document-end
// ==/UserScript==

(function () {
  'use strict';
  var BUNDLE_URL = 'https://hdjrz-license.rosechel05.workers.dev/bundle.js?ts=' + Date.now();
  var CACHE_KEY = 'HDJRZ_REMOTE_BUNDLE_CACHE';
  var booted = false;

  function runCode(src) {
    if (booted || !src) return;
    booted = true;
    try {
      (new Function(src))();
    } catch (e) {
      console.error('[hdjrzTools Loader] Error executing bundle:', e);
    }
  }

  // 1. Instant cold-start from offline cache if available
  var cached = null;
  try {
    cached = GM_getValue(CACHE_KEY) || (typeof localStorage !== 'undefined' ? localStorage.getItem(CACHE_KEY) : null);
  } catch (e) {}

  // 2. Fetch fresh bundle from Cloudflare Worker
  if (typeof GM_xmlhttpRequest === 'function') {
    GM_xmlhttpRequest({
      method: 'GET',
      url: BUNDLE_URL,
      timeout: 10000,
      onload: function (res) {
        if (res.status === 200 && res.responseText && res.responseText.length > 500) {
          try {
            GM_setValue(CACHE_KEY, res.responseText);
            if (typeof localStorage !== 'undefined') localStorage.setItem(CACHE_KEY, res.responseText);
          } catch (e) {}
          runCode(res.responseText);
        } else if (cached) {
          runCode(cached);
        }
      },
      onerror: function () {
        if (cached) runCode(cached);
      },
      ontimeout: function () {
        if (cached) runCode(cached);
      }
    });
  } else if (cached) {
    runCode(cached);
  }
})();
