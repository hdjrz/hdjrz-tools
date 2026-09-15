/**
 * Escalation Chrome Extension - Background Service Worker
 * Handles tab creation and focus for Zoom Workspace, and initializes defaults.
 */

// Initialize default settings on install or update
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.remove("hdjrzLicenseRole");
  chrome.storage.sync.get(["escalationSettings", "customTemplates"], (result) => {
    const settings = result.escalationSettings || {};
    let needsUpdate = false;
    if (!result.escalationSettings) {
      settings.agentName = "";
      settings.zoomUrl = "zoomus://";
      settings.autoOpenZoom = true;
      settings.autoPinNote = true;
      settings.autoCopyClipboard = true;
      settings.usersListUrl = "https://nano-admin.bet88.ph/users";
      settings.autoReturnToUsers = true;
      settings.autoFindAndView = false;
      needsUpdate = true;
    } else {
      if (settings.zoomUrl === "https://zoom.us/wc/join" || !settings.zoomUrl) {
        // Migrate old web link to Zoom PC desktop app protocol
        settings.zoomUrl = "zoomus://";
        needsUpdate = true;
      }
      if (settings.usersListUrl === undefined) {
        settings.usersListUrl = "https://nano-admin.bet88.ph/users";
        needsUpdate = true;
      }
      if (settings.autoReturnToUsers === undefined) {
        settings.autoReturnToUsers = true;
        needsUpdate = true;
      }
      // Auto Find User is off until Joshua asks to enable it
      if (settings.autoFindAndView !== false) {
        settings.autoFindAndView = false;
        needsUpdate = true;
      }
    }

    if (needsUpdate) {
      chrome.storage.sync.set({
        escalationSettings: settings,
        customTemplates: result.customTemplates || {}
      }, () => {
        console.log("Escalation Extension: Zoom desktop protocol configured.");
      });
    }
  });
});

// Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "OPEN_ZOOM") {
    handleOpenZoom(request.zoomUrl, sendResponse);
    return true; // async response
  }

  if (request.action === "OPEN_SETTINGS") {
    chrome.runtime.openOptionsPage();
    sendResponse({ success: true });
    return true;
  }

  if (request.action === "KYC_FIND_SIBLING") {
    handleKycFindSibling(sender, request, sendResponse);
    return true;
  }

  if (request.action === "KYC_INJECT_OLD_NOTE") {
    handleKycInjectOldNote(request, sendResponse);
    return true;
  }

  if (request.action === "KYC_INJECT_OLD_NOTES") {
    handleKycInjectOldNotes(request, sendResponse);
    return true;
  }
});

function isUserOverviewUrl(url) {
  if (!url) return false;
  try {
    const path = new URL(url).pathname || "";
    if (/\/users(\/|$)/i.test(path)) return false;
    return /\/user\/[^/]+/i.test(path);
  } catch (e) {
    return false;
  }
}

function kycPlainUidFromPlayer(player) {
  if (!player) return "";
  const raw = String(player.publicId || player.userId || "").replace(/[()]/g, "").trim();
  return raw;
}

function handleKycFindSibling(sender, request, sendResponse) {
  const senderTabId = sender && sender.tab && sender.tab.id;
  const senderUid = String((request && request.publicId) || "").replace(/[()]/g, "").trim().toLowerCase();

  chrome.tabs.query({}, (tabs) => {
    const candidates = (tabs || []).filter((t) => {
      if (!t || t.id === senderTabId) return false;
      return isUserOverviewUrl(t.url);
    });

    if (!candidates.length) {
      sendResponse({ sibling: null, others: [] });
      return;
    }

    const pending = candidates.map((t) => new Promise((resolve) => {
      chrome.tabs.sendMessage(t.id, { action: "GET_KYC_PLAYER" }, (res) => {
        if (chrome.runtime.lastError || !res) {
          resolve(null);
          return;
        }
        const publicId = kycPlainUidFromPlayer(res);
        if (!publicId) {
          resolve(null);
          return;
        }
        if (senderUid && publicId.toLowerCase() === senderUid) {
          resolve(null);
          return;
        }
        resolve({
          tabId: t.id,
          publicId,
          userId: res.userId || publicId,
          userCombined: res.userCombined || "",
          kycVerified: res.kycVerified || "",
          name: res.name || "",
          dob: res.dob || ""
        });
      });
    }));

    Promise.all(pending).then((results) => {
      const seen = {};
      const others = [];
      results.filter(Boolean).forEach((row) => {
        const key = String(row.publicId || "").toLowerCase();
        if (!key || seen[key]) return;
        seen[key] = true;
        others.push(row);
      });
      sendResponse({
        others,
        sibling: others.length === 1 ? others[0] : null
      });
    });
  });
}

function handleKycInjectOldNote(request, sendResponse) {
  const targetTabId = request && request.targetTabId;
  const newAccountUid = String((request && request.newAccountUid) || "").replace(/[()]/g, "").trim();
  if (!targetTabId || !newAccountUid) {
    sendResponse({ success: false });
    return;
  }

  chrome.tabs.sendMessage(targetTabId, {
    action: "INJECT_KYC_OLD_NOTE",
    newAccountUid
  }, (res) => {
    const ok = !chrome.runtime.lastError && res && res.success;
    chrome.tabs.update(targetTabId, { active: true }, () => {
      if (chrome.runtime.lastError) {}
    });
    sendResponse({ success: !!ok });
  });
}

function handleKycInjectOldNotes(request, sendResponse) {
  const ids = (request && request.targetTabIds ? request.targetTabIds : []).filter(Boolean);
  const newAccountUid = String((request && request.newAccountUid) || "").replace(/[()]/g, "").trim();
  if (!ids.length || !newAccountUid) {
    sendResponse({ success: false });
    return;
  }

  const pending = ids.map((tabId) => new Promise((resolve) => {
    chrome.tabs.sendMessage(tabId, {
      action: "INJECT_KYC_OLD_NOTE",
      newAccountUid
    }, (res) => {
      resolve(!chrome.runtime.lastError && res && res.success);
    });
  }));

  Promise.all(pending).then((results) => {
    chrome.tabs.update(ids[0], { active: true }, () => {
      if (chrome.runtime.lastError) {}
    });
    sendResponse({ success: results.some(Boolean) });
  });
}

/**
 * Focus an existing Zoom tab or launch Zoom Desktop App
 */
function handleOpenZoom(zoomUrl, sendResponse) {
  const targetUrl = zoomUrl || "zoomus://";

  // If desktop protocol (zoomus:// or zoommtg://), trigger without leaving a blank tab
  if (targetUrl.startsWith("zoomus:") || targetUrl.startsWith("zoommtg:")) {
    chrome.tabs.create({ url: targetUrl, active: false }, (newTab) => {
      setTimeout(() => {
        if (newTab && newTab.id) {
          chrome.tabs.remove(newTab.id, () => {
            if (chrome.runtime.lastError) {}
          });
        }
      }, 1500);
      if (sendResponse) sendResponse({ success: true, status: "desktop_app_opened" });
    });
    return;
  }

  // Web URL fallback
  chrome.tabs.query({}, (tabs) => {
    // Check if a Zoom tab is already open
    const existingTab = tabs.find(t => t.url && (t.url.includes("zoom.us") || t.url.includes(targetUrl)));

    if (existingTab && existingTab.id) {
      chrome.tabs.update(existingTab.id, { active: true }, () => {
        if (existingTab.windowId) {
          chrome.windows.update(existingTab.windowId, { focused: true });
        }
        if (sendResponse) sendResponse({ success: true, status: "focused" });
      });
    } else {
      chrome.tabs.create({ url: targetUrl, active: true }, (newTab) => {
        if (sendResponse) sendResponse({ success: true, status: "created", tabId: newTab.id });
      });
    }
  });
}
