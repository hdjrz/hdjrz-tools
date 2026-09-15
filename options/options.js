/**
 * Escalation Chrome Extension - Options Page Logic
 */

document.addEventListener("DOMContentLoaded", () => {
  const tabs = document.querySelectorAll(".nav-tab");
  const tabPanes = document.querySelectorAll(".tab-pane");
  const dictTableBody = document.getElementById("dictionary-table-body");
  const dictSearch = document.getElementById("dictionary-search");
  const templatesContainer = document.getElementById("templates-list-container");
  const toast = document.getElementById("toast-message");

  const agentNameInput = document.getElementById("agent-name");
  const zoomUrlInput = document.getElementById("zoom-url");
  const usersUrlInput = document.getElementById("users-url");
  const autoCopyInput = document.getElementById("auto-copy");
  const autoPinInput = document.getElementById("auto-pin");
  const autoOpenZoomInput = document.getElementById("auto-open-zoom");
  const autoReturnInput = document.getElementById("auto-return");
  const autoFindAndViewInput = document.getElementById("auto-find-view");

  const btnSave = document.getElementById("btn-save-settings");
  const btnRestore = document.getElementById("btn-restore-defaults");

  const dict = window.EscalationDictionary || {};
  let currentSettings = { ...window.DefaultEscalationSettings };
  let currentCustomTemplates = {};

  // Tab Navigation
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      tabPanes.forEach(p => p.classList.remove("active"));

      tab.classList.add("active");
      const targetId = tab.getAttribute("data-tab");
      document.getElementById(targetId).classList.add("active");
    });
  });

  // Load Settings
  function loadStoredSettings() {
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.sync) {
      chrome.storage.sync.get(["escalationSettings", "customTemplates"], (data) => {
        if (data && data.escalationSettings) {
          currentSettings = { ...currentSettings, ...data.escalationSettings };
        }
        if (data && data.customTemplates) {
          currentCustomTemplates = { ...data.customTemplates };
        }
        populateGeneralForm();
        renderTemplatesEditor();
      });
    } else {
      populateGeneralForm();
      renderTemplatesEditor();
    }
  }

  function populateGeneralForm() {
    agentNameInput.value = currentSettings.agentName || "";
    zoomUrlInput.value = currentSettings.zoomUrl || "zoomus://";
    if (usersUrlInput) usersUrlInput.value = currentSettings.usersListUrl || "https://nano-admin.bet88.ph/users";
    autoCopyInput.checked = currentSettings.autoCopyClipboard !== false;
    autoPinInput.checked = currentSettings.autoPinNote !== false;
    autoOpenZoomInput.checked = currentSettings.autoOpenZoom !== false;
    if (autoReturnInput) autoReturnInput.checked = currentSettings.autoReturnToUsers !== false;
    if (autoFindAndViewInput) autoFindAndViewInput.checked = currentSettings.autoFindAndView === true;
  }

  // Render Dictionary Table
  function renderDictionaryTable(filter = "") {
    dictTableBody.innerHTML = "";
    const term = filter.toLowerCase().trim();

    Object.values(dict).forEach(item => {
      const match = !term || 
        item.code.toLowerCase().includes(term) ||
        item.meaning.toLowerCase().includes(term) ||
        item.group.toLowerCase().includes(term) ||
        item.description.toLowerCase().includes(term);

      if (!match) return;

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><span class="badge-tag" style="background-color: ${item.color}">${item.code}</span></td>
        <td><strong>${item.meaning}</strong></td>
        <td><span class="group-tag">${item.group}</span></td>
        <td style="color: #cbd5e1;">${item.description}</td>
      `;
      dictTableBody.appendChild(tr);
    });
  }

  dictSearch.addEventListener("input", (e) => {
    renderDictionaryTable(e.target.value);
  });

  // Render Templates Editor
  function renderTemplatesEditor() {
    templatesContainer.innerHTML = "";

    Object.values(dict).forEach(item => {
      const defaultReason = item.defaultReason || "Losing player";
      const sample = {
        code: item.code,
        meaning: item.meaning || item.code,
        userCombined: "1754988 (N3633P6)",
        userId: "N3633P6",
        cid: "1172031960185783",
        reason: defaultReason
      };
      const notesTpl = item.userNotesText || `${item.code} / [CID] / [Reason]`;
      const zoomTpl = item.zoomText || `${item.meaning || item.code}\n\nUser ID: [User ID]\nReason: [Reason]\nCID: [CID]\nNotes/tracker added`;
      const notePreview = typeof window.renderEscalationNote === "function"
        ? window.renderEscalationNote(notesTpl, sample)
        : notesTpl;
      const zoomPreview = typeof window.renderEscalationNote === "function"
        ? window.renderEscalationNote(zoomTpl, sample)
        : zoomTpl;

      const div = document.createElement("div");
      div.className = "template-item";
      div.innerHTML = `
        <div class="template-item-header">
          <div class="template-badge-title">
            <span class="badge-tag" style="background-color: ${item.color}">${item.code}</span>
            <strong>${item.meaning}</strong>
          </div>
          <span class="group-tag">${item.group}</span>
        </div>
        <div class="form-group" style="margin-bottom: 0;">
          <div class="form-input" style="background:#090e1a; color:#38bdf8; font-weight:600; white-space:pre-wrap;">${notePreview}</div>
          <pre style="margin:8px 0 0 0; font-size:11px; color:#a7f3d0; background:#060c16; padding:8px; border-radius:6px; white-space:pre-wrap;">${zoomPreview}</pre>
          <span class="help-text">Default Reason: <em>"${defaultReason}"</em> — edit wording from the in-page Settings gear.</span>
        </div>
      `;
      templatesContainer.appendChild(div);
    });
  }

  // Save Settings
  btnSave.addEventListener("click", () => {
    const updatedSettings = {
      agentName: agentNameInput.value.trim() || "",
      zoomUrl: zoomUrlInput.value.trim() || "zoomus://",
      usersListUrl: usersUrlInput ? (usersUrlInput.value.trim() || "https://nano-admin.bet88.ph/users") : "https://nano-admin.bet88.ph/users",
      autoCopyClipboard: autoCopyInput.checked,
      autoPinNote: autoPinInput.checked,
      autoOpenZoom: autoOpenZoomInput.checked,
      autoReturnToUsers: autoReturnInput ? autoReturnInput.checked : true,
      autoFindAndView: autoFindAndViewInput ? autoFindAndViewInput.checked : false
    };

    const updatedTemplates = { ...currentCustomTemplates };
    document.querySelectorAll(".template-input").forEach(input => {
      const code = input.getAttribute("data-code");
      const val = input.value.trim();
      const defaultTpl = dict[code] ? dict[code].template : "";
      if (val && val !== defaultTpl) {
        updatedTemplates[code] = val;
      }
    });

    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.sync) {
      chrome.storage.sync.set({
        escalationSettings: updatedSettings,
        customTemplates: updatedTemplates
      }, () => {
        currentSettings = updatedSettings;
        currentCustomTemplates = updatedTemplates;
        showToast("Settings and templates saved successfully!");
      });
    } else {
      showToast("Saved locally (Chrome storage unavailable in test)");
    }
  });

  // Restore Defaults
  btnRestore.addEventListener("click", () => {
    if (confirm("Reset all settings and templates back to factory defaults?")) {
      currentSettings = { ...window.DefaultEscalationSettings };
      currentCustomTemplates = {};

      if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.sync) {
        chrome.storage.sync.set({
          escalationSettings: currentSettings,
          customTemplates: currentCustomTemplates
        }, () => {
          populateGeneralForm();
          renderTemplatesEditor();
          showToast("Defaults restored!");
        });
      } else {
        populateGeneralForm();
        renderTemplatesEditor();
        showToast("Defaults restored!");
      }
    }
  });

  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add("show");
    setTimeout(() => {
      toast.classList.remove("show");
    }, 2800);
  }

  // Initial calls
  renderDictionaryTable();
  loadStoredSettings();
});
