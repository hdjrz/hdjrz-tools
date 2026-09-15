/**
 * Build script for hdjrzTools Userscript
 * Bundles templates.js, content.css, and content.js into hdjrzTools.user.js
 */

const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const templatesPath = path.join(rootDir, 'content', 'templates.js');
const cssPath = path.join(rootDir, 'content', 'content.css');
const contentJsPath = path.join(rootDir, 'content', 'content.js');
const outputPath = path.join(rootDir, 'hdjrzTools.user.js');

console.log('Reading source files...');
const templatesCode = fs.readFileSync(templatesPath, 'utf8');
const cssCode = fs.readFileSync(cssPath, 'utf8');
const contentJsCode = fs.readFileSync(contentJsPath, 'utf8');

// Userscript header metadata
const userscriptHeader = `// ==UserScript==
// @name         hdjrzTools
// @namespace    https://github.com/hdjrz/hdjrz-tools
// @version      1.0.0
// @description  Streamlines player escalations: extracts player info, formats User Notes, pins them, copies to clipboard, and opens Zoom workspace.
// @author       hdjrz
// @match        https://nano-admin.bet88.ph/*
// @match        http://nano-admin.bet88.ph/*
// @icon         https://raw.githubusercontent.com/hdjrz/hdjrz-tools/main/icons/icon48.png
// @updateURL    https://raw.githubusercontent.com/hdjrz/hdjrz-tools/main/hdjrzTools.user.js
// @downloadURL  https://raw.githubusercontent.com/hdjrz/hdjrz-tools/main/hdjrzTools.user.js
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_listValues
// @grant        GM_setClipboard
// @grant        GM_addStyle
// @run-at       document-idle
// ==/UserScript==
`;

// Compatibility shim for Tampermonkey environment
const polyfillCode = `
/* --- hdjrzTools Tampermonkey Compatibility Shim --- */
(function() {
  if (typeof window === "undefined") return;

  // Polyfill clipboard if GM_setClipboard exists
  if (typeof GM_setClipboard === "function" && navigator.clipboard) {
    const origWriteText = navigator.clipboard.writeText ? navigator.clipboard.writeText.bind(navigator.clipboard) : null;
    navigator.clipboard.writeText = function(text) {
      try {
        GM_setClipboard(text);
        if (origWriteText) return origWriteText(text).catch(function() { return Promise.resolve(); });
        return Promise.resolve();
      } catch (e) {
        if (origWriteText) return origWriteText(text);
        return Promise.reject(e);
      }
    };
  }

  // Cross-Tab BroadcastChannel for multi-tab KYC SWITCH support
  var kycChannel = null;
  try {
    if (typeof BroadcastChannel !== "undefined") {
      kycChannel = new BroadcastChannel("hdjrz_kyc_channel");
    }
  } catch (e) {
    console.warn("hdjrzTools: BroadcastChannel unavailable:", e);
  }

  // Initialize chrome shim if running in userscript environment
  if (typeof window.chrome === "undefined" || !window.chrome.storage) {
    var getStored = function(key) {
      if (typeof GM_getValue === "function") {
        try { return GM_getValue(key); } catch (e) {}
      }
      try {
        var raw = localStorage.getItem("hdjrz_" + key);
        return raw ? JSON.parse(raw) : null;
      } catch (e) {
        return null;
      }
    };

    var setStored = function(key, val) {
      if (typeof GM_setValue === "function") {
        try { GM_setValue(key, val); return; } catch (e) {}
      }
      try {
        localStorage.setItem("hdjrz_" + key, JSON.stringify(val));
      } catch (e) {}
    };

    var removeStored = function(key) {
      if (typeof GM_deleteValue === "function") {
        try { GM_deleteValue(key); return; } catch (e) {}
      }
      try {
        localStorage.removeItem("hdjrz_" + key);
      } catch (e) {}
    };

    var messageListeners = [];

    window.chrome = window.chrome || {};

    window.chrome.storage = {
      local: {
        get: function(keys, cb) {
          var res = {};
          var list = Array.isArray(keys) ? keys : (typeof keys === "string" ? [keys] : Object.keys(keys || {}));
          for (var i = 0; i < list.length; i++) {
            var k = list[i];
            var v = getStored(k);
            if (v !== undefined && v !== null) res[k] = v;
          }
          if (cb) setTimeout(function() { cb(res); }, 0);
        },
        set: function(obj, cb) {
          if (obj) {
            for (var k in obj) {
              if (Object.prototype.hasOwnProperty.call(obj, k)) {
                setStored(k, obj[k]);
              }
            }
          }
          if (cb) setTimeout(function() { cb(); }, 0);
        },
        remove: function(keys, cb) {
          var list = Array.isArray(keys) ? keys : (typeof keys === "string" ? [keys] : Object.keys(keys || {}));
          for (var i = 0; i < list.length; i++) {
            removeStored(list[i]);
          }
          if (cb) setTimeout(function() { cb(); }, 0);
        }
      },
      session: {
        get: function(keys, cb) {
          var res = {};
          var list = Array.isArray(keys) ? keys : (typeof keys === "string" ? [keys] : Object.keys(keys || {}));
          for (var i = 0; i < list.length; i++) {
            var k = list[i];
            try {
              var v = sessionStorage.getItem("hdjrz_" + k);
              if (v !== null && v !== undefined) res[k] = JSON.parse(v);
            } catch (e) {}
          }
          if (cb) setTimeout(function() { cb(res); }, 0);
        },
        set: function(obj, cb) {
          if (obj) {
            for (var k in obj) {
              if (Object.prototype.hasOwnProperty.call(obj, k)) {
                try { sessionStorage.setItem("hdjrz_" + k, JSON.stringify(obj[k])); } catch (e) {}
              }
            }
          }
          if (cb) setTimeout(function() { cb(); }, 0);
        },
        remove: function(keys, cb) {
          var list = Array.isArray(keys) ? keys : (typeof keys === "string" ? [keys] : Object.keys(keys || {}));
          for (var i = 0; i < list.length; i++) {
            try { sessionStorage.removeItem("hdjrz_" + list[i]); } catch (e) {}
          }
          if (cb) setTimeout(function() { cb(); }, 0);
        }
      },
      onChanged: {
        addListener: function(cb) {
          window.addEventListener("storage", function(e) {
            if (e.key && e.key.indexOf("hdjrz_") === 0) {
              var realKey = e.key.substring(6);
              var nv = null, ov = null;
              try { nv = JSON.parse(e.newValue); } catch(err){}
              try { ov = JSON.parse(e.oldValue); } catch(err){}
              cb({ [realKey]: { newValue: nv, oldValue: ov } }, "local");
            }
          });
        }
      }
    };

    window.chrome.runtime = window.chrome.runtime || {};

    window.chrome.runtime.getURL = function(path) {
      return "https://raw.githubusercontent.com/hdjrz/hdjrz-tools/main/" + path;
    };

    window.chrome.runtime.onMessage = {
      addListener: function(listener) {
        messageListeners.push(listener);
      }
    };

    window.chrome.runtime.sendMessage = function(request, cb) {
      if (!request) {
        if (cb) cb({});
        return;
      }

      if (request.action === "OPEN_ZOOM") {
        var target = request.zoomUrl || "zoomus://";
        try {
          var a = document.createElement("a");
          a.href = target;
          a.style.display = "none";
          document.body.appendChild(a);
          a.click();
          setTimeout(function() { a.remove(); }, 1000);
        } catch (e) {
          window.open(target, "_blank");
        }
        if (cb) cb({ success: true, status: "desktop_app_opened" });
        return;
      }

      if (request.action === "KYC_FIND_SIBLING" && kycChannel) {
        var senderUid = String(request.publicId || "").replace(/[()]/g, "").trim().toLowerCase();
        var reqId = "req_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7);
        var others = [];

        var onReply = function(ev) {
          if (ev.data && ev.data.action === "KYC_PONG" && ev.data.requestId === reqId) {
            var player = ev.data.player;
            if (player && player.publicId) {
              var pKey = String(player.publicId).toLowerCase();
              if ((!senderUid || pKey !== senderUid) && !others.some(function(o) { return String(o.publicId).toLowerCase() === pKey; })) {
                others.push(player);
              }
            }
          }
        };

        kycChannel.addEventListener("message", onReply);
        kycChannel.postMessage({ action: "KYC_PING", requestId: reqId, senderUid: senderUid });

        setTimeout(function() {
          kycChannel.removeEventListener("message", onReply);
          var sibling = others.length === 1 ? others[0] : null;
          if (cb) cb({ others: others, sibling: sibling });
        }, 350);
        return;
      }

      if (request.action === "KYC_INJECT_OLD_NOTES" && kycChannel) {
        kycChannel.postMessage({
          action: "KYC_INJECT_COMMAND",
          newAccountUid: request.newAccountUid
        });
        if (cb) cb({ success: true });
        return;
      }

      if (cb) cb({});
    };

    // Cross-tab broadcast listener for KYC queries
    if (kycChannel) {
      kycChannel.addEventListener("message", function(ev) {
        var data = ev.data;
        if (!data) return;

        if (data.action === "KYC_PING") {
          for (var i = 0; i < messageListeners.length; i++) {
            try {
              messageListeners[i]({ action: "GET_KYC_PLAYER" }, {}, function(res) {
                if (res && res.publicId) {
                  kycChannel.postMessage({
                    action: "KYC_PONG",
                    requestId: data.requestId,
                    player: res
                  });
                }
              });
            } catch (err) {}
          }
        } else if (data.action === "KYC_INJECT_COMMAND") {
          for (var j = 0; j < messageListeners.length; j++) {
            try {
              messageListeners[j]({
                action: "INJECT_KYC_OLD_NOTE",
                newAccountUid: data.newAccountUid
              }, {}, function() {});
            } catch (err) {}
          }
        }
      });
    }
  }
})();
`;

// CSS injection code
const cssInjectionCode = `
/* --- Embedded CSS Injection --- */
(function() {
  const css = ${JSON.stringify(cssCode)};
  if (typeof GM_addStyle === "function") {
    GM_addStyle(css);
  } else {
    const style = document.createElement("style");
    style.id = "hdjrz-tools-styles";
    style.textContent = css;
    (document.head || document.documentElement).appendChild(style);
  }
})();
`;

// Combine into single userscript
const fullBundle = [
  userscriptHeader,
  '/* ==========================================================================',
  ' * hdjrzTools Userscript Bundle for Tampermonkey',
  ' * Auto-generated by build-userscript.js',
  ' * ========================================================================== */',
  '',
  polyfillCode,
  '',
  cssInjectionCode,
  '',
  '/* --- Templates & Presets --- */',
  templatesCode,
  '',
  '/* --- Main Content Script --- */',
  contentJsCode
].join('\n');

console.log('Writing userscript to ' + outputPath + '...');
fs.writeFileSync(outputPath, fullBundle, 'utf8');

console.log('✅ Build successful: hdjrzTools.user.js created (' + Math.round(fullBundle.length / 1024) + ' KB)');
