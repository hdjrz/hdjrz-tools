/**
 * Escalation Chrome Extension - Popup Logic
 */

document.addEventListener("DOMContentLoaded", () => {
  const agentEl = document.getElementById("popup-agent");
  const zoomEl = document.getElementById("popup-zoom");
  const openOptsBtn = document.getElementById("btn-open-options");
  const toggleBarBtn = document.getElementById("btn-toggle-bar");

  // Check current tab's bar visibility
  if (typeof chrome !== "undefined" && chrome.tabs && chrome.tabs.query) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs[0] && tabs[0].id) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "GET_BAR_STATUS" }, (res) => {
          if (chrome.runtime.lastError || !res) return;
          if (toggleBarBtn) {
            toggleBarBtn.textContent = res.visible ? "Hide Floating Bar on This Tab" : "Show Floating Bar on This Tab";
          }
        });
      }
    });
  }

  if (toggleBarBtn) {
    toggleBarBtn.addEventListener("click", () => {
      if (typeof chrome !== "undefined" && chrome.tabs && chrome.tabs.query) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs && tabs[0] && tabs[0].id) {
            chrome.tabs.sendMessage(tabs[0].id, { action: "TOGGLE_BAR" }, (res) => {
              if (chrome.runtime.lastError || !res) {
                alert("Please refresh this tab to load the extension.");
                return;
              }
              toggleBarBtn.textContent = res.visible ? "Hide Floating Bar on This Tab" : "Show Floating Bar on This Tab";
              window.close();
            });
          }
        });
      }
    });
  }

  function applyPopupSettings(settings) {
    if (!settings) return;
    if (agentEl) {
      const name = String(settings.agentName || "").trim();
      agentEl.textContent = (!name || /^katherine\s+semana$/i.test(name)) ? "—" : name;
    }
    if (zoomEl && settings.zoomUrl) {
      const urlStr = (settings.zoomUrl || "").trim();
      if (urlStr.startsWith("zoomus:") || urlStr.startsWith("zoommtg:")) {
        zoomEl.textContent = "Zoom Desktop App";
      } else {
        try {
          const parsed = new URL(urlStr);
          zoomEl.textContent = parsed.hostname || "Zoom Desktop App";
        } catch (e) {
          zoomEl.textContent = "Zoom Desktop App";
        }
      }
    }
  }

  const localApi = (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) || null;
  const syncApi = (typeof chrome !== "undefined" && chrome.storage && chrome.storage.sync) || null;
  if (localApi) {
    localApi.get(["escalationSettings"], (localData) => {
      if (localData && localData.escalationSettings) {
        applyPopupSettings(localData.escalationSettings);
        return;
      }
      if (!syncApi) return;
      syncApi.get(["escalationSettings"], (syncData) => {
        applyPopupSettings(syncData && syncData.escalationSettings);
      });
    });
  } else if (syncApi) {
    syncApi.get(["escalationSettings"], (data) => {
      applyPopupSettings(data && data.escalationSettings);
    });
  }

  openOptsBtn.addEventListener("click", () => {
    if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    }
  });
});
