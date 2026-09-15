/**
 * Escalation Chrome Extension - Content Script
 * Floating horizontal escalation toolbar, dynamic player scraping,
 * accidental-click confirmation modal, and in-page settings modal.
 */

(function () {
  if (window.__ESCALATION_HELPER_LOADED__) return;
  window.__ESCALATION_HELPER_LOADED__ = true;

  const FALLBACK_ESCALATION_OPTIONS = [
    { code: "ACR", label: "ACR", meaning: "Account Closure Request", description: "Player requested to close/disable their account voluntarily.", group: "Account Closure", color: "#2563eb", chip: { text: "", color: "#dc2626" }, defaultReason: "Losing player", template: "{code} / {cid} / {reason}" },
    { code: "ACR-PAGCOR", label: "ACR-PAGCOR", meaning: "Account Closure Request (PAGCOR)", description: "Regulatory or formal self-exclusion mandated by PAGCOR.", group: "Account Closure", color: "#1d4ed8", chip: { text: "", color: "#dc2626" }, defaultReason: "PAGCOR exclusion list / regulatory compliance", template: "{code} / {cid} / {reason}" },
    { code: "ACR - PERMA", label: "ACR - PERMA", meaning: "Permanent Account Closure", description: "Account permanently banned or closed with zero chance of reopening.", group: "Account Closure", color: "#7f1d1d", chip: { text: "", color: "#dc2626" }, defaultReason: "Permanent closure requested / Non-negotiable ban", template: "{code} / {cid} / {reason}" },
    { code: "REACT", label: "REACT", meaning: "Account Reactivation Request", description: "Player reached out requesting to reopen a previously closed account.", group: "Reactivation", color: "#059669", chip: { text: "", color: "#dc2626" }, defaultReason: "Player requested account reactivation", template: "{code} / {cid} / {reason}" },
    { code: "REACT NOT", label: "REACT NOT", meaning: "Reactivation Not Allowed", description: "Reactivation declined due to permanent closure, policy, or unresolved flags.", group: "Reactivation", color: "#0f766e", chip: { text: "R.NOT", color: "#065f46" }, defaultReason: "Not eligible for reactivation / Permanent exclusion", template: "{code} / {cid} / {reason}" },
    { code: "NGP NON-X", label: "NGP NON-X", meaning: "NGP Non-Exclusive Player", description: "Escalation for players tagged under Non-Exclusive Next Gen Player program.", group: "Special Programs", color: "#d97706", chip: { text: "R.UA", color: "#b45309" }, defaultReason: "NGP Non-Exclusive review", template: "{code} / {cid} / {reason}" },
    { code: "NDRP", label: "NDRP", meaning: "Non-Deposit Reward Program", description: "Issues concerning free credits, vouchers, or no-deposit rewards.", group: "Financial & Rewards", color: "#6d28d9", chip: { text: "", color: "#dc2626" }, defaultReason: "Non-Deposit Reward credited / claim inquiry", template: "{code} / {cid} / {reason}" },
    { code: "UA W/FUNDS", label: "UA W/FUNDS", meaning: "Unauthorized Access with Funds", description: "Compromised or hacked account that currently holds a cash balance.", group: "Security & Fraud", color: "#7c3aed", chip: { text: "For escalation", color: "#b91c1c" }, defaultReason: "Suspected account takeover with remaining balance", template: "{code} / {cid} / {reason}" },
    { code: "UA WO/FUNDS", label: "UA WO/FUNDS", meaning: "Underage without funds", description: "Underage player with no remaining balance.", group: "Security & Fraud", color: "#6d28d9", chip: { text: "", color: "#dc2626" }, defaultReason: "Underage without funds", template: "{code} / {cid} / {reason}" },
    { code: "MANUAL KYC", label: "MANUAL KYC", meaning: "Manual KYC Document Review", description: "Automated verification failed; manual review of submitted IDs needed.", group: "KYC & Verification", color: "#db2777", chip: { text: "", color: "#dc2626" }, defaultReason: "Manual ID verification required", template: "{code} / {cid} / {reason}" },
    { code: "KYC SWITCH", label: "KYC SWITCH", meaning: "KYC Verification Switch", description: "Switching player's verification method (e.g. from SMS OTP to Manual or email).", group: "KYC & Verification", color: "#0891b2", chip: { text: "", color: "#0d9488" }, defaultReason: "Switch verification channel requested", template: "{code} / {cid} / {reason}" },
    { code: "GLIFE.1", label: "GLIFE.1", meaning: "GLife Escalation Tier 1", description: "First-level escalation for GCash GLife mini-app transactions or sync issues.", group: "GLife Partner", color: "#0d9488", chip: { text: "", color: "#dc2626" }, defaultReason: "GLife mini-app sync issue / Tier 1 inquiry", template: "{code} / {cid} / {reason}" },
    { code: "GLIFE.2", label: "GLIFE.2", meaning: "GLife Escalation Tier 2", description: "High-priority / urgent escalation for GLife payment failures or account locks.", group: "GLife Partner", color: "#115e59", chip: { text: "", color: "#dc2626" }, defaultReason: "GLife Tier 2 high-priority escalation", template: "{code} / {cid} / {reason}" },
    { code: "ABUSER", label: "ABUSER", meaning: "Bonus / Promo Abuse Flag", description: "System or manual flag for exploiting promotions, multi-accounting, or fraud.", group: "Risk & Compliance", color: "#334155", chip: { text: "", color: "#dc2626" }, defaultReason: "Bonus / Promotional abuse flagged", template: "{code} / {cid} / {reason}" }
  ];

  const DEFAULT_FALLBACK_SETTINGS = {
    agentName: "",
    zoomUrl: "zoomus://",
    autoOpenZoom: true,
    autoPinNote: true,
    autoCopyClipboard: true,
    usersListUrl: "https://nano-admin.bet88.ph/users",
    autoReturnToUsers: true,
    autoFindAndView: false,
    barLayout: "horizontal",
    customTemplates: {},
    customOptions: null,
    notesWordingVersion: 0
  };

  let currentSettings = {
    ...DEFAULT_FALLBACK_SETTINGS,
    ...((typeof window !== "undefined" && window.DefaultEscalationSettings) || (typeof globalThis !== "undefined" && globalThis.DefaultEscalationSettings) || {})
  };
  let detectedPlayer = null;
  let activeModal = null;
  let dockElement = null;
  let lastModalTrigger = null;
  let lastModalOriginX = typeof window !== "undefined" ? window.innerWidth / 2 : 0;
  let lastModalOriginY = typeof window !== "undefined" ? window.innerHeight / 2 : 0;
  let licenseRole = "";
  const LICENSE_ACTIVATE_URL = "https://hdjrz-license.rosechel05.workers.dev/";

  function isLicensed() {
    return licenseRole === "admin" || licenseRole === "guest" || licenseRole === "staff";
  }

  function isAdminLicense() {
    return licenseRole === "admin";
  }

  function localStorageApi() {
    return (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) || null;
  }

  function sessionStorageApi() {
    return (typeof chrome !== "undefined" && chrome.storage && chrome.storage.session) || null;
  }

  function markLicenseSessionAlive(cb) {
    const session = sessionStorageApi();
    if (!session) {
      if (cb) cb();
      return;
    }
    session.set({ hdjrzLicenseAlive: true }, () => { if (cb) cb(); });
  }

  function clearLicenseSession(cb) {
    const session = sessionStorageApi();
    if (!session) {
      if (cb) cb();
      return;
    }
    session.remove("hdjrzLicenseAlive", () => { if (cb) cb(); });
  }

  function newLicenseDeviceId() {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
    return "dev-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 12);
  }

  function ensureLicenseDeviceId(cb) {
    const api = localStorageApi();
    if (!api) {
      cb(newLicenseDeviceId());
      return;
    }
    api.get(["hdjrzLicenseDeviceId"], (data) => {
      const existing = data && String(data.hdjrzLicenseDeviceId || "").trim();
      if (existing) {
        cb(existing);
        return;
      }
      const id = newLicenseDeviceId();
      api.set({ hdjrzLicenseDeviceId: id }, () => cb(id));
    });
  }

  function persistLicenseRole(role, cb, licenseKey) {
    licenseRole = role === "admin" || role === "guest" ? role : "";
    const api = localStorageApi();
    if (!api) {
      if (cb) cb();
      return;
    }
    if (!licenseRole) {
      api.remove(["hdjrzLicenseRole", "hdjrzLicenseKey"], () => {
        clearLicenseSession(() => { if (cb) cb(); });
      });
      return;
    }
    const payload = { hdjrzLicenseRole: licenseRole };
    const savedKey = String(licenseKey || "").trim();
    if (savedKey) payload.hdjrzLicenseKey = savedKey;
    api.set(payload, () => {
      markLicenseSessionAlive(() => { if (cb) cb(); });
    });
  }

  function loadLicenseRole(cb) {
    const api = localStorageApi();
    if (!api) {
      if (cb) cb();
      return;
    }
    const done = () => {
      api.get(["hdjrzLicenseRole"], (data) => {
        const r = data && data.hdjrzLicenseRole;
        licenseRole = (r === "admin" || r === "guest") ? r : (r === "staff" ? "guest" : "");
        if (licenseRole) markLicenseSessionAlive(() => { if (cb) cb(); });
        else if (cb) cb();
      });
    };
    const session = sessionStorageApi();
    if (!session) {
      done();
      return;
    }
    session.get(["hdjrzLicenseAlive"], (s) => {
      if (s && s.hdjrzLicenseAlive) {
        done();
        return;
      }
      licenseRole = "";
      api.remove(["hdjrzLicenseRole"], () => { if (cb) cb(); });
    });
  }

  const LICENSE_FETCH_MS = 12000;

  function postLicenseServer(payload, cb) {
    let settled = false;
    const finish = (err, data) => {
      if (settled) return;
      settled = true;
      cb(err, data);
    };
    const ctrl = (typeof AbortController !== "undefined") ? new AbortController() : null;
    const timer = setTimeout(() => {
      try { if (ctrl) ctrl.abort(); } catch (e) {}
      finish("offline");
    }, LICENSE_FETCH_MS);
    fetch(LICENSE_ACTIVATE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: ctrl ? ctrl.signal : undefined
    }).then((res) => {
      return res.json().catch(() => ({})).then((data) => {
        if (!res.ok) {
          finish((data && data.error) || "offline");
          return;
        }
        finish(null, data || {});
      });
    }).catch(() => finish("offline")).finally(() => clearTimeout(timer));
  }

  function activateLicenseOnServer(key, cb) {
    ensureLicenseDeviceId((deviceId) => {
      postLicenseServer({ key, deviceId }, (err, data) => {
        if (err) {
          cb(err);
          return;
        }
        const role = data && data.role;
        if (data && data.ok && (role === "admin" || role === "guest")) {
          cb(null, role);
          return;
        }
        cb((data && data.error) || "invalid");
      });
    });
  }

  function releaseLicenseOnServer(cb) {
    const done = () => { if (cb) cb(); };
    const api = localStorageApi();
    if (!api) {
      done();
      return;
    }
    api.get(["hdjrzLicenseKey", "hdjrzLicenseDeviceId"], (data) => {
      const key = data && String(data.hdjrzLicenseKey || "").trim();
      const deviceId = data && String(data.hdjrzLicenseDeviceId || "").trim();
      if (!key || !deviceId) {
        done();
        return;
      }
      fetch(LICENSE_ACTIVATE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, deviceId, action: "release" })
      }).then(() => done()).catch(() => done());
    });
  }

  const CID_REQUIRED_CODES = {
    "ACR": true,
    "ACR-PAGCOR": true,
    "ACR - PERMA": true,
    "REACT": true,
    "REACT NOT": true,
    "NGP NON-X": true,
    "UA W/FUNDS": true,
    "UA WO/FUNDS": true,
    "NDRP": true,
    "ABUSER": true
  };

  function isCidRequired(code) {
    return !!CID_REQUIRED_CODES[String(code || "").trim()];
  }

  function rememberModalOrigin(el) {
    lastModalTrigger = el || null;
    refreshTriggerPoint();
  }

  function refreshTriggerPoint() {
    const el = lastModalTrigger;
    if (el && typeof el.getBoundingClientRect === "function" && el.isConnected !== false) {
      const r = el.getBoundingClientRect();
      lastModalOriginX = r.left + r.width / 2;
      lastModalOriginY = r.top + r.height / 2;
      return r;
    }
    return null;
  }

  function prefersReducedMotion() {
    return typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function mixNum(a, b, t) {
    return a + (b - a) * t;
  }

  function clamp01(t) {
    return t < 0 ? 0 : t > 1 ? 1 : t;
  }

  function cubicBezierY(t, x1, y1, x2, y2) {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    let u = t;
    for (let i = 0; i < 8; i++) {
      const x = (((1 - 3 * x2 + 3 * x1) * u + (3 * x2 - 6 * x1)) * u + 3 * x1) * u;
      const dx = (3 * (1 - 3 * x2 + 3 * x1) * u + 2 * (3 * x2 - 6 * x1)) * u + 3 * x1;
      if (Math.abs(dx) < 1e-6) break;
      u -= (x - t) / dx;
    }
    return (((1 - 3 * y2 + 3 * y1) * u + (3 * y2 - 6 * y1)) * u + 3 * y1) * u;
  }

  function isVerticalBar() {
    return String(currentSettings.barLayout || "horizontal") === "vertical";
  }

  function applyBarLayout() {
    if (!dockElement) return;
    const vertical = isVerticalBar();
    dockElement.classList.toggle("esc-bar-vertical", vertical);
    const minimized = dockElement.classList.contains("minimized");
    if (minimized && !vertical) return;
    if (vertical) {
      dockElement.style.left = "auto";
      dockElement.style.right = "8px";
    } else {
      dockElement.style.left = "8px";
      dockElement.style.right = "8px";
    }
  }

  function stripGenieCloneIds(root) {
    if (!root) return;
    if (root.removeAttribute) root.removeAttribute("id");
    root.querySelectorAll("[id]").forEach((el) => el.removeAttribute("id"));
    root.querySelectorAll("input, textarea, select, button").forEach((el) => {
      el.setAttribute("tabindex", "-1");
      el.disabled = true;
    });
  }

  function genieButtonSide(cardRect) {
    refreshTriggerPoint();
    const cx = cardRect.left + cardRect.width / 2;
    const cy = cardRect.top + cardRect.height / 2;
    const dx = lastModalOriginX - cx;
    const dy = lastModalOriginY - cy;
    if (Math.abs(dx) >= Math.abs(dy)) return dx >= 0 ? "right" : "left";
    return dy >= 0 ? "bottom" : "top";
  }

  function buildGenieMesh(card) {
    refreshTriggerPoint();
    const cr = card.getBoundingClientRect();
    const n = 32;
    const side = genieButtonSide(cr);
    const horizontal = side === "top" || side === "bottom";
    const stage = document.createElement("div");
    stage.className = "esc-genie-stage";
    stage.style.left = cr.left + "px";
    stage.style.top = cr.top + "px";
    stage.style.width = cr.width + "px";
    stage.style.height = cr.height + "px";

    const slices = [];
    for (let i = 0; i < n; i++) {
      const slice = document.createElement("div");
      slice.className = "esc-genie-slice";
      const inner = card.cloneNode(true);
      inner.classList.remove("esc-zoom-ready", "esc-zoom-in", "esc-zoom-out", "esc-fade-ready", "esc-fade-in");
      stripGenieCloneIds(inner);
      inner.classList.add("esc-genie-slice-inner");
      inner.style.width = cr.width + "px";
      inner.style.height = cr.height + "px";
      inner.style.maxWidth = "none";
      inner.style.maxHeight = "none";
      inner.style.margin = "0";
      inner.style.visibility = "visible";

      if (horizontal) {
        const sh = cr.height / n;
        slice.style.left = "0";
        slice.style.top = (i * sh) + "px";
        slice.style.width = cr.width + "px";
        slice.style.height = (sh + 1.25) + "px";
        inner.style.transform = "translateY(" + (-i * sh) + "px)";
      } else {
        const sw = cr.width / n;
        slice.style.top = "0";
        slice.style.left = (i * sw) + "px";
        slice.style.height = cr.height + "px";
        slice.style.width = (sw + 1.25) + "px";
        inner.style.transform = "translateX(" + (-i * sw) + "px)";
      }

      slice.appendChild(inner);
      stage.appendChild(slice);

      const midX = horizontal ? (cr.left + cr.width / 2) : (cr.left + ((i + 0.5) * cr.width) / n);
      const midY = horizontal ? (cr.top + ((i + 0.5) * cr.height) / n) : (cr.top + cr.height / 2);
      const t = n <= 1 ? 0 : i / (n - 1);
      const along = (side === "bottom" || side === "right") ? (1 - t) : t;

      const ox = lastModalOriginX - (cr.left + (horizontal ? 0 : (i * cr.width) / n));
      const oy = lastModalOriginY - (cr.top + (horizontal ? (i * cr.height) / n : 0));
      slice.style.transformOrigin = ox + "px " + oy + "px";

      slices.push({
        el: slice,
        tx: lastModalOriginX - midX,
        ty: lastModalOriginY - midY,
        along,
        horizontal
      });
    }
    return { stage, slices, horizontal };
  }

  function applyClothFrame(slices, openness, invertStagger) {
    const stagger = 0.22;
    slices.forEach((s) => {
      const delayAlong = invertStagger ? (1 - s.along) : s.along;
      const local = clamp01((openness - delayAlong * stagger) / (1 - stagger));
      const wave = Math.sin(s.along * Math.PI);
      const funnel = mixNum(0.04, 1, Math.pow(s.along, 1.6));
      const cross = mixNum(funnel, 1, local);
      const pull = (1 - local) * (1 - s.along * 0.28);
      const bow = wave * (1 - local) * 22;
      const sx = s.horizontal ? cross : mixNum(0.22, 1, local);
      const sy = s.horizontal ? mixNum(0.55, 1, local) : cross;
      const bx = s.horizontal ? bow * (s.tx >= 0 ? 1 : -1) * 0.15 : bow;
      const by = s.horizontal ? bow : bow * (s.ty >= 0 ? 1 : -1) * 0.15;
      s.el.style.transform = "translate(" + (s.tx * pull + bx) + "px, " + (s.ty * pull + by) + "px) scale(" + sx + ", " + sy + ")";
    });
  }

  function fadeModal(card, mode, thenFn) {
    card.style.visibility = "";
    card.classList.remove("esc-fade-ready", "esc-fade-in", "esc-fade-out");
    if (mode === "open") {
      card.classList.add("esc-fade-ready");
      void card.offsetWidth;
      card.classList.add("esc-fade-in");
      setTimeout(() => {
        card.classList.remove("esc-fade-ready", "esc-fade-in");
        if (thenFn) thenFn();
      }, 200);
      return;
    }
    card.classList.add("esc-fade-out");
    setTimeout(() => {
      if (thenFn) thenFn();
    }, 200);
  }

  function runGenie(overlay, card, mode, thenFn) {
    if (prefersReducedMotion()) {
      fadeModal(card, mode, thenFn);
      return;
    }
    refreshTriggerPoint();
    const mesh = buildGenieMesh(card);
    overlay.appendChild(mesh.stage);
    card.style.visibility = "hidden";
    applyClothFrame(mesh.slices, mode === "open" ? 0 : 1, mode === "close");

    const duration = 520;
    const t0 = (typeof performance !== "undefined" && performance.now) ? performance.now() : Date.now();
    let raf = 0;

    function frame(now) {
      const raw = clamp01(((now || Date.now()) - t0) / duration);
      const eased = mode === "open"
        ? cubicBezierY(raw, 0.16, 1, 0.3, 1)
        : cubicBezierY(raw, 0.32, 0, 0.67, 0);
      const openness = mode === "open" ? eased : (1 - eased);
      applyClothFrame(mesh.slices, openness, mode === "close");
      if (raw < 1) {
        raf = requestAnimationFrame(frame);
        return;
      }
      if (mesh.stage && mesh.stage.parentNode) mesh.stage.remove();
      if (mode === "open") card.style.visibility = "";
      if (thenFn) thenFn();
    }
    raf = requestAnimationFrame(frame);
    return raf;
  }

  function usesPopover(overlay) {
    return !!(overlay && (
      overlay.id === "esc-reason-pick-overlay" ||
      overlay.id === "esc-confirm-overlay" ||
      overlay.id === "esc-settings-overlay" ||
      overlay.id === "esc-audit-overlay" ||
      overlay.id === "esc-edit-option-overlay" ||
      overlay.id === "esc-add-option-overlay" ||
      overlay.id === "esc-license-overlay"
    ));
  }

  function popoverNudge(card) {
    refreshTriggerPoint();
    const cr = card.getBoundingClientRect();
    const cx = cr.left + cr.width / 2;
    const cy = cr.top + cr.height / 2;
    return {
      dx: (lastModalOriginX - cx) * 0.08,
      dy: (lastModalOriginY - cy) * 0.08
    };
  }

  function runPopover(overlay, card, mode, thenFn) {
    const backdrop = overlay && overlay.querySelector(".esc-popover-backdrop");
    if (prefersReducedMotion() || !card.animate) {
      if (backdrop) {
        backdrop.style.opacity = mode === "open" ? "1" : "0";
      }
      fadeModal(card, mode, thenFn);
      return;
    }

    card.style.visibility = "";
    card.classList.add("esc-popover-animating");
    card.style.willChange = "transform, opacity";
    const nudge = popoverNudge(card);
    const ease = "cubic-bezier(0.22, 1, 0.36, 1)";
    const shadowSmall = "0 8px 18px rgba(0, 0, 0, 0.28)";
    const shadowFull = "0 20px 50px rgba(0, 0, 0, 0.55)";

    const clearAnim = () => {
      card.classList.remove("esc-popover-animating");
      card.style.willChange = "";
      if (mode === "open") {
        card.style.transform = "";
        card.style.opacity = "";
        card.style.boxShadow = "";
      }
      if (thenFn) thenFn();
    };

    let cardAnim;
    if (mode === "open") {
      cardAnim = card.animate([
        { opacity: 0, transform: "translate(" + nudge.dx + "px, " + (nudge.dy + 6) + "px) scale(0.94)", boxShadow: shadowSmall },
        { opacity: 1, transform: "translate(0px, -1px) scale(1.02)", boxShadow: shadowFull, offset: 0.62 },
        { opacity: 1, transform: "translate(0px, 0px) scale(1)", boxShadow: shadowFull }
      ], { duration: 380, easing: ease, fill: "forwards" });
      if (backdrop && backdrop.animate) {
        backdrop.animate(
          [{ opacity: 0 }, { opacity: 1 }],
          { duration: 380, easing: ease, fill: "forwards" }
        );
      }
    } else {
      cardAnim = card.animate([
        { opacity: 1, transform: "translate(0px, 0px) scale(1)", boxShadow: shadowFull },
        { opacity: 0, transform: "translate(" + nudge.dx + "px, " + (nudge.dy + 4) + "px) scale(0.94)", boxShadow: shadowSmall }
      ], { duration: 260, easing: ease, fill: "forwards" });
      if (backdrop && backdrop.animate) {
        backdrop.animate(
          [{ opacity: 1 }, { opacity: 0 }],
          { duration: 260, easing: ease, fill: "forwards" }
        );
      }
    }
    cardAnim.onfinish = clearAnim;
  }

  function onEscLockedWheel(e) {
    if (!document.documentElement.classList.contains("esc-modal-scroll-lock")) return;
    if (e.target && e.target.closest && e.target.closest(".esc-modal-body, .esc-settings-body, .esc-reason-pick-card, .esc-modal, .esc-audit-list, .esc-edit-option-modal, .esc-license-card")) return;
    e.preventDefault();
  }
  document.addEventListener("wheel", onEscLockedWheel, { passive: false });
  document.addEventListener("touchmove", onEscLockedWheel, { passive: false });

  function lockPageScroll() {
    document.documentElement.classList.add("esc-modal-scroll-lock");
    document.body.classList.add("esc-modal-scroll-lock");
  }

  function syncPageScrollLock() {
    if (document.querySelector(".esc-modal-overlay")) {
      lockPageScroll();
      return;
    }
    document.documentElement.classList.remove("esc-modal-scroll-lock");
    document.body.classList.remove("esc-modal-scroll-lock");
  }

  function playModalOpen(overlay) {
    const card = overlay && overlay.querySelector(".esc-modal, .esc-reason-pick-card");
    if (!card) return;
    lockPageScroll();
    overlay.style.visibility = "";
    if (usesPopover(overlay)) {
      card.style.visibility = "";
      requestAnimationFrame(() => {
        runPopover(overlay, card, "open", () => {
          const first = overlay.querySelector("[data-pick], #esc-modal-user-id, #esc-settings-close, #esc-reason-pick-cancel, #esc-audit-close, #esc-edit-usernotes-0, #esc-edit-option-cancel, #esc-license-input, #esc-add-code");
          if (first && first.focus) first.focus();
        });
      });
      return;
    }
    card.style.visibility = "hidden";
    requestAnimationFrame(() => {
      runGenie(overlay, card, "open");
    });
  }

  function closeOverlayZoom(overlay, thenFn) {
    const finish = () => {
      if (!overlay || overlay.dataset.escClosed === "1") return;
      overlay.dataset.escClosed = "1";
      overlay.remove();
      if (activeModal === overlay) activeModal = null;
      syncPageScrollLock();
      if (thenFn) thenFn();
    };
    const card = overlay && overlay.querySelector(".esc-modal, .esc-reason-pick-card");
    if (!card) {
      finish();
      return;
    }
    if (usesPopover(overlay)) {
      runPopover(overlay, card, "close", finish);
      return;
    }
    runGenie(overlay, card, "close", finish);
  }

  const JET_LOGO_URL = (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.getURL)
    ? chrome.runtime.getURL("icons/icon48.png")
    : "https://raw.githubusercontent.com/hdjrz/hdjrz-tools/main/icons/icon48.png";

  function escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  /**
   * Safe renderer for User Notes: guarantees no crashes if external template script isn't loaded
   */
  function safeRenderEscalationNote(templateStr, data) {
    if (typeof window !== "undefined" && typeof window.renderEscalationNote === "function") {
      try {
        return window.renderEscalationNote(templateStr, data);
      } catch (err) {
        console.warn("window.renderEscalationNote error, using safe fallback:", err);
      }
    }
    if (typeof globalThis !== "undefined" && typeof globalThis.renderEscalationNote === "function") {
      try {
        return globalThis.renderEscalationNote(templateStr, data);
      } catch (err) {
        console.warn("globalThis.renderEscalationNote error, using safe fallback:", err);
      }
    }

    let text = String(templateStr || (data && data.code ? `${data.code} / [CID] / [Reason]` : "[Reason]"));
    const effectiveUserId = (data && (data.userId || data.targetId || data.publicId || data.numericId)) || "";
    const numericId = (data && data.numericId) || effectiveUserId;
    const publicId = (data && data.publicId) || "";
    const cidVal = (data && data.cid) ? String(data.cid).trim() : "";
    const combined = (data && data.userCombined) || (publicId ? `${numericId} (${publicId})` : numericId);
    const reasonVal = (data && data.reason) || "";
    const meaningVal = (data && data.meaning) || "";
    const codeVal = (data && data.code) || "";

    const replacements = {
      "[User ID]": combined || effectiveUserId,
      "[CID]": cidVal,
      "[Reason]": reasonVal,
      "[CODE]": codeVal,
      "[Meaning]": meaningVal,
      "[Name]": (data && data.name) || "",
      "[DOB]": (data && (data.dob || data.dateOfBirth)) || "",
      "[Dob]": (data && (data.dob || data.dateOfBirth)) || "",
      "[Verified UID]": (data && data.verifiedUid) || "",
      "[New Account UID]": (data && data.newAccountUid) || "",
      "[AGE]": (data && data.age) || ageFromDob((data && (data.dob || data.dateOfBirth)) || ""),
      "[Rejected accounts]": (data && data.rejectedAccounts) || "",
      "[Note Date]": (data && data.noteDate) || "",
      "[Date]": (data && data.noteDate) || "",
      "[GLife ID]": (data && data.gLifeUserId) || "",
      "{code}": codeVal,
      "{meaning}": meaningVal,
      "{userId}": effectiveUserId,
      "{targetId}": effectiveUserId,
      "{numericId}": numericId,
      "{publicId}": publicId,
      "{userCombined}": combined,
      "{username}": (data && data.username) || "N/A",
      "{affiliate}": (data && data.affiliate) || "N/A",
      "{createdDate}": (data && data.createdDate) || "",
      "{agentName}": (data && data.agentName) || "",
      "{name}": (data && data.name) || "",
      "{dob}": (data && (data.dob || data.dateOfBirth)) || "",
      "{reason}": reasonVal,
      "{cid}": cidVal,
      "{CID}": cidVal,
      "{date}": new Date().toISOString().split("T")[0],
      "{timestamp}": new Date().toISOString().replace("T", " ").substring(0, 19) + " UTC"
    };

    for (const [token, val] of Object.entries(replacements)) {
      text = text.split(token).join(String(val !== undefined && val !== null ? val : ""));
    }

    if (cidVal) {
      text = text.replace(/\/\s*CID\s*\//g, `/ ${cidVal} /`);
      text = text.replace(/^CID:\s*$/m, `CID: ${cidVal}`);
    }

    return text.trim();
  }

  /**
   * Safe renderer for final 5-line Zoom note
   */
  function safeRenderFinalEscalationNote(data, customTemplate) {
    if (typeof window !== "undefined" && typeof window.renderFinalEscalationNote === "function") {
      try {
        return window.renderFinalEscalationNote(data, customTemplate);
      } catch (err) {
        console.warn("window.renderFinalEscalationNote error, using safe fallback:", err);
      }
    }
    if (typeof globalThis !== "undefined" && typeof globalThis.renderFinalEscalationNote === "function") {
      try {
        return globalThis.renderFinalEscalationNote(data, customTemplate);
      } catch (err) {
        console.warn("globalThis.renderFinalEscalationNote error, using safe fallback:", err);
      }
    }
    const tpl = customTemplate || (typeof window !== "undefined" && window.DEFAULT_FINAL_NOTE_TEMPLATE) || `{meaning}\n\nUser ID: {userCombined}\nReason: {reason}\nCID: {cid}\nNotes/tracker added`;
    return safeRenderEscalationNote(tpl, data);
  }

  function defaultZoomTextForOption(opt) {
    const meaning = (opt && (opt.meaning || opt.code)) || "";
    return `${meaning}\n\nUser ID: [User ID]\nReason: [Reason]\nCID: [CID]\nNotes/tracker added`;
  }

  function defaultUserNotesTextForOption(opt) {
    const code = (opt && opt.code) || "NOTE";
    return `${code} / [CID] / [Reason]`;
  }

  function normalizeChoiceList(list, valueKey, fallbackValue, fallbackLabel) {
    const raw = Array.isArray(list) ? list : [];
    const cleaned = raw.map((entry, i) => {
      if (!entry) return null;
      if (typeof entry === "string") {
        return { label: i === 0 ? fallbackLabel : `${fallbackLabel} ${i + 1}`, [valueKey]: entry };
      }
      const label = String(entry.label || fallbackLabel).trim() || fallbackLabel;
      const value = entry[valueKey] != null ? String(entry[valueKey]) : "";
      return { label, [valueKey]: value };
    }).filter(Boolean);
    if (!cleaned.length) {
      return [{ label: fallbackLabel, [valueKey]: fallbackValue != null ? String(fallbackValue) : "" }];
    }
    return cleaned;
  }

  function normalizeEscalationOption(opt) {
    if (!opt) return opt;
    const copy = { ...opt };
    if (copy.chip) copy.chip = { ...copy.chip };
    if (copy.userNotesText == null) {
      if (copy.template && String(copy.template).indexOf("{") !== -1) {
        copy.userNotesText = String(copy.template)
          .replace(/\{code\}/gi, copy.code || "")
          .replace(/\{cid\}/gi, "[CID]")
          .replace(/\{CID\}/g, "[CID]")
          .replace(/\{reason\}/gi, "[Reason]")
          .replace(/\{userCombined\}/gi, "[User ID]")
          .replace(/\{userId\}/gi, "[User ID]")
          .replace(/\{meaning\}/gi, copy.meaning || "");
      } else {
        copy.userNotesText = defaultUserNotesTextForOption(copy);
      }
    }
    if (copy.zoomText == null || copy.zoomText === "") {
      if (!copy.zoomChoices || !copy.zoomChoices.length) {
        copy.zoomText = defaultZoomTextForOption(copy);
      }
    }
    copy.reasons = (Array.isArray(copy.reasons) ? copy.reasons : [])
      .map(r => String(r || "").trim())
      .filter(Boolean);
    if (!copy.reasons.length) {
      copy.reasons = [copy.defaultReason || "Escalation requested"];
    }
    if (!copy.defaultReason) copy.defaultReason = copy.reasons[0];
    copy.noteChoices = normalizeChoiceList(copy.noteChoices, "userNotesText", copy.userNotesText, "User Notes");
    copy.zoomChoices = normalizeChoiceList(copy.zoomChoices, "zoomText", copy.zoomText, "Zoom");
    copy.userNotesText = copy.noteChoices[0].userNotesText;
    copy.zoomText = copy.zoomChoices[0].zoomText;
    return copy;
  }

  function getOptionUserNotesText(item, choiceIndex) {
    const n = normalizeEscalationOption(item);
    const idx = Math.max(0, parseInt(choiceIndex, 10) || 0);
    if (n && n.noteChoices && n.noteChoices[idx]) {
      return n.noteChoices[idx].userNotesText;
    }
    return (n && n.userNotesText) || defaultUserNotesTextForOption(item);
  }

  function getOptionZoomText(item, choiceIndex) {
    const n = normalizeEscalationOption(item);
    const idx = Math.max(0, parseInt(choiceIndex, 10) || 0);
    if (n && n.zoomChoices && n.zoomChoices[idx]) {
      return n.zoomChoices[idx].zoomText;
    }
    return (n && n.zoomText) || defaultZoomTextForOption(item);
  }

  /**
   * Helper to retrieve active options (custom or default presets)
   */
  function overlayGuestImportedOptions(presets) {
    const saved = Array.isArray(currentSettings.customOptions) ? currentSettings.customOptions : [];
    if (!saved.length) return presets.map((opt) => JSON.parse(JSON.stringify(opt)));
    const byCode = {};
    saved.forEach((opt) => {
      if (opt && opt.code) byCode[opt.code] = opt;
    });
    return presets.map((preset) => {
      const copy = JSON.parse(JSON.stringify(preset));
      const imported = byCode[preset.code];
      if (!imported) return copy;
      const reasons = (imported.reasons || []).map((r) => String(r || "").trim()).filter(Boolean);
      if (reasons.length) {
        copy.reasons = reasons.slice();
        copy.defaultReason = String(imported.defaultReason || reasons[0]).trim() || reasons[0];
      }
      if (imported.userNotesText != null) copy.userNotesText = imported.userNotesText;
      if (imported.zoomText != null) copy.zoomText = imported.zoomText;
      if (Array.isArray(imported.noteChoices) && imported.noteChoices.length) {
        copy.noteChoices = JSON.parse(JSON.stringify(imported.noteChoices));
        copy.userNotesText = copy.noteChoices[0].userNotesText;
      }
      if (Array.isArray(imported.zoomChoices) && imported.zoomChoices.length) {
        copy.zoomChoices = JSON.parse(JSON.stringify(imported.zoomChoices));
        copy.zoomText = copy.zoomChoices[0].zoomText;
      }
      return copy;
    });
  }

  function getActiveOptions() {
    let list = [];
    if (licenseRole === "guest") {
      list = overlayGuestImportedOptions(getPresetOptionsList());
    } else if (Array.isArray(currentSettings.customOptions) && currentSettings.customOptions.length > 0) {
      list = currentSettings.customOptions;
    } else if (typeof window !== "undefined" && Array.isArray(window.DEFAULT_ESCALATION_OPTIONS) && window.DEFAULT_ESCALATION_OPTIONS.length > 0) {
      list = window.DEFAULT_ESCALATION_OPTIONS;
    } else if (typeof globalThis !== "undefined" && Array.isArray(globalThis.DEFAULT_ESCALATION_OPTIONS) && globalThis.DEFAULT_ESCALATION_OPTIONS.length > 0) {
      list = globalThis.DEFAULT_ESCALATION_OPTIONS;
    } else {
      const dict = (typeof window !== "undefined" && window.EscalationDictionary)
        || (typeof globalThis !== "undefined" && globalThis.EscalationDictionary)
        || {};
      const dictValues = Object.values(dict);
      list = dictValues.length > 0 ? dictValues : FALLBACK_ESCALATION_OPTIONS;
    }
    return list.map(normalizeEscalationOption);
  }

  const BIT88_NOTES_WORDING_VERSION = 20;

  function getPresetOptionsList() {
    if (typeof window !== "undefined" && Array.isArray(window.DEFAULT_ESCALATION_OPTIONS) && window.DEFAULT_ESCALATION_OPTIONS.length) {
      return window.DEFAULT_ESCALATION_OPTIONS;
    }
    if (typeof globalThis !== "undefined" && Array.isArray(globalThis.DEFAULT_ESCALATION_OPTIONS) && globalThis.DEFAULT_ESCALATION_OPTIONS.length) {
      return globalThis.DEFAULT_ESCALATION_OPTIONS;
    }
    return FALLBACK_ESCALATION_OPTIONS;
  }

  function applyBit88UserNotesToSavedOptions() {
    if (Number(currentSettings.notesWordingVersion) === BIT88_NOTES_WORDING_VERSION) return false;
    const presets = getPresetOptionsList();
    const byCode = {};
    presets.forEach(opt => {
      if (opt && opt.code) byCode[opt.code] = opt;
    });
    const saved = Array.isArray(currentSettings.customOptions) ? currentSettings.customOptions : [];
    if (saved.length) {
      currentSettings.customOptions = saved.map(opt => {
        const preset = byCode[opt && opt.code];
        if (!preset) return opt;
        const copy = { ...opt };
        if (preset.noteChoices && preset.noteChoices.length) {
          copy.noteChoices = JSON.parse(JSON.stringify(preset.noteChoices));
          copy.userNotesText = copy.noteChoices[0].userNotesText;
        } else {
          copy.userNotesText = preset.userNotesText != null ? preset.userNotesText : (copy.userNotesText || "");
          copy.noteChoices = [{ label: "User Notes", userNotesText: copy.userNotesText }];
        }
        if (preset.zoomChoices && preset.zoomChoices.length) {
          copy.zoomChoices = JSON.parse(JSON.stringify(preset.zoomChoices));
          copy.zoomText = copy.zoomChoices[0].zoomText;
        } else if (preset.zoomText != null) {
          copy.zoomText = preset.zoomText;
          copy.zoomChoices = [{ label: "Zoom", zoomText: preset.zoomText }];
        }
        const factoryReasons = (preset.reasons || []).map((r) => String(r || "").trim()).filter(Boolean);
        if (factoryReasons.length) {
          copy.reasons = factoryReasons.slice();
          copy.defaultReason = String(preset.defaultReason || factoryReasons[0]).trim() || factoryReasons[0];
        }
        return copy;
      });
      const have = new Set(currentSettings.customOptions.map(o => o && o.code));
      presets.forEach((preset, i) => {
        if (!preset || !preset.code || have.has(preset.code)) return;
        const copy = JSON.parse(JSON.stringify(preset));
        let insertAt = currentSettings.customOptions.length;
        for (let j = i - 1; j >= 0; j--) {
          const prev = presets[j] && presets[j].code;
          const idx = currentSettings.customOptions.findIndex(o => o && o.code === prev);
          if (idx >= 0) {
            insertAt = idx + 1;
            break;
          }
        }
        currentSettings.customOptions.splice(insertAt, 0, copy);
        have.add(preset.code);
      });
    }
    currentSettings.notesWordingVersion = BIT88_NOTES_WORDING_VERSION;
    return true;
  }

  /**
   * Load user settings from chrome.storage.local (sync is a one-time migrate).
   */
  function settingsPayload() {
    return {
      escalationSettings: {
        agentName: currentSettings.agentName,
        zoomUrl: currentSettings.zoomUrl,
        autoCopyClipboard: currentSettings.autoCopyClipboard,
        autoPinNote: currentSettings.autoPinNote,
        autoOpenZoom: currentSettings.autoOpenZoom,
        usersListUrl: currentSettings.usersListUrl,
        autoReturnToUsers: currentSettings.autoReturnToUsers,
        autoFindAndView: currentSettings.autoFindAndView,
        barLayout: currentSettings.barLayout === "vertical" ? "vertical" : "horizontal",
        notesWordingVersion: currentSettings.notesWordingVersion || 0
      },
      customTemplates: currentSettings.customTemplates || {},
      customOptions: currentSettings.customOptions
    };
  }

  function buildSettingsExportFile() {
    const payload = settingsPayload();
    return {
      kind: "hdjrzTools-settings",
      version: 1,
      exportedAt: new Date().toISOString(),
      escalationSettings: payload.escalationSettings,
      customTemplates: payload.customTemplates,
      customOptions: payload.customOptions
    };
  }

  function parseSettingsImportFile(raw) {
    let data;
    try {
      data = typeof raw === "string" ? JSON.parse(raw) : raw;
    } catch (e) {
      return null;
    }
    if (!data || data.kind !== "hdjrzTools-settings" || !Array.isArray(data.customOptions)) return null;
    return data;
  }

  function downloadSettingsExportJson(obj) {
    const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "hdjrzTools-settings.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function applyStoredSettings(data) {
    if (data && data.escalationSettings) {
      currentSettings = { ...currentSettings, ...data.escalationSettings };
    }
    if (/^katherine\s+semana$/i.test(String(currentSettings.agentName || "").trim())) {
      currentSettings.agentName = "";
    }
    currentSettings.barLayout = currentSettings.barLayout === "vertical" ? "vertical" : "horizontal";
    if (data && data.customTemplates) {
      currentSettings.customTemplates = { ...currentSettings.customTemplates, ...data.customTemplates };
    }
    if (data && Array.isArray(data.customOptions)) {
      currentSettings.customOptions = data.customOptions;
    }
  }

  function hasStoredSettings(data) {
    return !!(data && (data.escalationSettings || (Array.isArray(data.customOptions) && data.customOptions.length)));
  }

  function finishLoadSettings(callback) {
    const shouldPersist = applyBit88UserNotesToSavedOptions();
    if (shouldPersist) {
      saveSettings({}, null, currentSettings.customOptions, callback);
      return;
    }
    if (callback) callback();
  }

  function loadSettings(callback) {
    const localApi = (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) || null;
    const syncApi = (typeof chrome !== "undefined" && chrome.storage && chrome.storage.sync) || null;
    if (localApi) {
      localApi.get(["escalationSettings", "customTemplates", "customOptions"], (localData) => {
        if (hasStoredSettings(localData)) {
          applyStoredSettings(localData);
          finishLoadSettings(callback);
          return;
        }
        if (!syncApi) {
          currentSettings.barLayout = currentSettings.barLayout === "vertical" ? "vertical" : "horizontal";
          finishLoadSettings(callback);
          return;
        }
        syncApi.get(["escalationSettings", "customTemplates", "customOptions"], (syncData) => {
          applyStoredSettings(syncData);
          applyBit88UserNotesToSavedOptions();
          saveSettings({}, currentSettings.customTemplates || {}, currentSettings.customOptions, callback);
        });
      });
      return;
    }
    currentSettings.barLayout = currentSettings.barLayout === "vertical" ? "vertical" : "horizontal";
    applyBit88UserNotesToSavedOptions();
    if (callback) callback();
  }

  /**
   * Save user settings to chrome.storage.local so Zoom/User Notes wording is not dropped.
   */
  function saveSettings(newSettings, newTemplates, newOptions, callback) {
    currentSettings = { ...currentSettings, ...newSettings };
    if (newTemplates) currentSettings.customTemplates = { ...newTemplates };
    if (newOptions) currentSettings.customOptions = [...newOptions];

    const after = () => {
      applyBarLayout();
      updateHorizontalDockButtons();
      if (callback) callback();
    };

    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set(settingsPayload(), () => {
        if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.lastError) {
          console.warn("Escalation settings save:", chrome.runtime.lastError.message);
        }
        after();
      });
      return;
    }
    after();
  }

  const AUDIT_CAP = 200;

  function appendEscalationAudit(entry) {
    if (typeof chrome === "undefined" || !chrome.storage || !chrome.storage.local) return;
    chrome.storage.local.get(["escalationAudit"], (data) => {
      const list = Array.isArray(data.escalationAudit) ? data.escalationAudit : [];
      list.unshift(entry);
      chrome.storage.local.set({ escalationAudit: list.slice(0, AUDIT_CAP) });
    });
  }

  function loadEscalationAudit(callback) {
    if (typeof chrome === "undefined" || !chrome.storage || !chrome.storage.local) {
      callback([]);
      return;
    }
    chrome.storage.local.get(["escalationAudit"], (data) => {
      callback(Array.isArray(data.escalationAudit) ? data.escalationAudit : []);
    });
  }

  /**
   * Helper to parse any User ID string from the screen.
   * If the ID contains parentheses like "15511274 (4LG14LGG)", the parenthetical ID is prioritized.
   * If there are no parentheses like "1172031960185783" or "98765432", that ID is used directly.
   */
  function parseUserIdValue(raw) {
    if (!raw) return null;
    let str = String(raw).trim();
    if (!str) return null;

    // Strip leading labels if present
    str = str.replace(/^(?:User|Player|Client|Account)\s*ID\s*[:\s-]*/i, "").trim();

    // 1. Number + (Parentheses ID) e.g. "15511274 (4LG14LGG)"
    const numParen = str.match(/([0-9a-zA-Z_-]+)\s*\(([^)]+)\)/);
    if (numParen) {
      const num = numParen[1].trim();
      const parenthetical = numParen[2].trim();
      return {
        userId: parenthetical,
        targetId: parenthetical,
        publicId: parenthetical,
        numericId: num,
        userCombined: `${num} (${parenthetical})`
      };
    }

    // 2. Standalone parentheses e.g. "(4LG14LGG)"
    const onlyParen = str.match(/\(([^)]+)\)/);
    if (onlyParen) {
      const parenthetical = onlyParen[1].trim();
      return {
        userId: parenthetical,
        targetId: parenthetical,
        publicId: parenthetical,
        numericId: parenthetical,
        userCombined: `(${parenthetical})`
      };
    }

    // 3. Plain ID without parentheses e.g. "1172031960185783" or "15511274"
    const single = str.match(/[0-9a-zA-Z_-]+/);
    if (single && single[0].length >= 2) {
      const val = single[0].trim();
      return {
        userId: val,
        targetId: val,
        publicId: "",
        numericId: val,
        userCombined: val
      };
    }

    return null;
  }

  /**
   * Check if current page is the backoffice User Overview screen
   */
  function isUserOverviewPage() {
    const text = document.body ? document.body.innerText : "";
    const hasOverviewHeading = /User\s+Overview/i.test(text);
    const hasUserIdField = /(?:User|Player|Account)\s*ID/i.test(text);
    const hasUserNotes = /User\s+Notes/i.test(text);

    return hasUserIdField || (hasOverviewHeading && hasUserNotes);
  }

  /**
   * Scrape player credentials dynamically from the page DOM.
   * Completely dynamic: takes whatever User ID is currently on screen for the active client.
   * Zero hardcoded sample IDs or fallbacks.
   */
  function scrapePlayerCredentials() {
    const data = {
      userId: "",
      numericId: "",
      publicId: "",
      targetId: "",
      userCombined: "",
      username: "N/A",
      affiliate: "N/A",
      createdDate: "",
      phone: "",
      country: "",
      blocked: "",
      kycVerified: "",
      cid: "",
      name: "",
      dob: ""
    };

    const allText = document.body ? document.body.innerText : "";

    // Step 1: Scan line by line in page text
    const textLines = allText.split("\n");
    for (let i = 0; i < textLines.length; i++) {
      const line = textLines[i].trim();
      if (/^(?:User|Player|Client|Account)\s*ID\b/i.test(line)) {
        let parsed = parseUserIdValue(line);
        if (parsed && parsed.userId) {
          Object.assign(data, parsed);
          break;
        }
        // Value might be on the next line
        if (i + 1 < textLines.length) {
          parsed = parseUserIdValue(textLines[i + 1].trim());
          if (parsed && parsed.userId) {
            Object.assign(data, parsed);
            break;
          }
        }
      }
    }

    // Step 2: Full text regex search across page
    if (!data.userId) {
      const regexPatterns = [
        /(?:User|Player|Client|Account)\s*ID\s*[:\s-]+\s*([0-9a-zA-Z_-]+(?:\s*\([^)]+\))?)/i,
        /(?:User|Player|Client|Account)\s*ID\s*[:\s-]+\s*(\([^)]+\))/i
      ];
      for (const pat of regexPatterns) {
        const m = allText.match(pat);
        if (m && m[1]) {
          const parsed = parseUserIdValue(m[1]);
          if (parsed && parsed.userId) {
            Object.assign(data, parsed);
            break;
          }
        }
      }
    }

    // Step 3: Scan DOM elements specifically (table cells, definition lists, cards)
    if (!data.userId) {
      const candidates = document.querySelectorAll("tr, th, td, dt, dd, div, span, p, label, b, strong, h1, h2, h3, h4");
      for (const el of candidates) {
        // Exclude our own extension UI elements from scraping
        if (el.closest && el.closest("#escalation-helper-dock, .esc-modal-overlay, .esc-toast")) continue;

        const txt = (el.innerText || el.textContent || "").trim();
        if (!/(?:User|Player|Client|Account)\s*ID/i.test(txt)) continue;

        // A. Direct text of this element
        let parsed = parseUserIdValue(txt);
        if (parsed && parsed.userId) {
          Object.assign(data, parsed);
          break;
        }

        // B. Next element sibling
        if (el.nextElementSibling) {
          const sibText = (el.nextElementSibling.innerText || el.nextElementSibling.textContent || "").trim();
          parsed = parseUserIdValue(sibText);
          if (parsed && parsed.userId) {
            Object.assign(data, parsed);
            break;
          }
        }

        // C. Next cell in table row
        const row = el.closest("tr");
        if (row) {
          const cells = Array.from(row.querySelectorAll("td, th"));
          const myCell = el.closest("td, th");
          const idx = cells.indexOf(myCell);
          if (idx >= 0 && idx + 1 < cells.length) {
            const nextCellText = (cells[idx + 1].innerText || cells[idx + 1].textContent || "").trim();
            parsed = parseUserIdValue(nextCellText);
            if (parsed && parsed.userId) {
              Object.assign(data, parsed);
              break;
            }
          }
        }
      }
    }

    // Step 4: Check form inputs or search boxes
    if (!data.userId) {
      const inputs = document.querySelectorAll("input, select");
      for (const inp of inputs) {
        if (inp.closest && inp.closest("#escalation-helper-dock, .esc-modal-overlay, .esc-toast")) continue;
        const attr = ((inp.name || "") + " " + (inp.id || "") + " " + (inp.placeholder || "")).toLowerCase();
        if (attr.includes("user") || attr.includes("player")) {
          if (inp.value && inp.value.trim()) {
            const parsed = parseUserIdValue(inp.value.trim());
            if (parsed && parsed.userId) {
              Object.assign(data, parsed);
              break;
            }
          }
        }
      }
    }

    // Step 5: Check URL parameters
    if (!data.userId && window.location) {
      try {
        const params = new URLSearchParams(window.location.search);
        const val = params.get("userId") || params.get("user_id") || params.get("playerId") || params.get("player_id") || params.get("id");
        if (val) {
          const parsed = parseUserIdValue(val);
          if (parsed && parsed.userId) {
            Object.assign(data, parsed);
          }
        }
      } catch (e) {}
    }

    // Step 6: Extract tabular attributes (Affiliate, Username, Created Date, KYC, Phone)
    const elements = document.querySelectorAll("tr, div, dl, .row, [class*='info'], [class*='field']");
    elements.forEach((el) => {
      if (el.closest && el.closest("#escalation-helper-dock, .esc-modal-overlay, .esc-toast")) return;
      const text = el.innerText || "";

      // Affiliate Name
      if (/Affiliate\s+Name/i.test(text) && (!data.affiliate || data.affiliate === "N/A")) {
        const parts = text.split(/Affiliate\s+Name\s*:?/i);
        if (parts[1]) data.affiliate = parts[1].trim().split("\n")[0].trim();
      }

      // Username
      if (/Username\s*:/i.test(text) && data.username === "N/A") {
        const parts = text.split(/Username\s*:\s*/i);
        if (parts[1]) {
          const val = parts[1].trim().split("\n")[0].trim();
          if (val) data.username = val;
        }
      }

      // Created Date
      if (/Created\s*:/i.test(text) && !data.createdDate) {
        const parts = text.split(/Created\s*:\s*/i);
        if (parts[1]) data.createdDate = parts[1].trim().split("\n")[0].trim();
      }

      // Phone Number
      if (/Phone\s+Number\s*:/i.test(text) && !data.phone) {
        const parts = text.split(/Phone\s+Number\s*:\s*/i);
        if (parts[1]) data.phone = parts[1].trim().split("\n")[0].trim();
      }

      // KYC Verified
      if (/KYC\s*Verified/i.test(text) && !data.kycVerified) {
        const parts = text.split(/KYC\s*Verified\s*:?\s*/i);
        if (parts[1]) {
          const val = parts[1].trim().split("\n")[0].trim();
          if (val && !/^KYC/i.test(val)) data.kycVerified = val;
        }
      }
    });

    if (!data.kycVerified) {
      const kycLabel = Array.from(document.querySelectorAll("th, td, dt, dd, label, div, span, strong, b"))
        .find((el) => {
          if (el.closest && el.closest("#escalation-helper-dock, .esc-modal-overlay, .esc-toast")) return false;
          return /^KYC\s*Verified\s*:?\s*$/i.test((el.textContent || "").trim());
        });
      if (kycLabel) {
        let nextText = "";
        if (kycLabel.nextElementSibling) {
          nextText = (kycLabel.nextElementSibling.innerText || kycLabel.nextElementSibling.textContent || "").trim();
        }
        const row = kycLabel.closest("tr");
        if (!nextText && row) {
          const cells = Array.from(row.querySelectorAll("td, th"));
          const cell = kycLabel.closest("td, th");
          const idx = cells.indexOf(cell);
          if (idx >= 0 && idx + 1 < cells.length) {
            nextText = (cells[idx + 1].innerText || cells[idx + 1].textContent || "").trim();
          }
        }
        if (nextText) data.kycVerified = nextText.split("\n")[0].trim();
      }
    }

    if (!data.affiliate || data.affiliate === "N/A") {
      const affMatch = allText.match(/Affiliate\s+Name\s*[:\s]\s*([^\n\r]+)/i);
      if (affMatch && affMatch[1]) {
        data.affiliate = affMatch[1].trim();
      }
    }

    data.cid = scrapeCidFromUserNotes() || "";

    const attrs = scrapeUserAttributes();
    if (attrs.name) data.name = attrs.name;
    if (attrs.dob) data.dob = attrs.dob;

    return (data.userId || data.numericId) ? data : null;
  }

  function isBlankPersonValue(value) {
    const s = String(value || "").replace(/\s+/g, " ").trim();
    if (!s) return true;
    if (/^(null)(\s+null)*$/i.test(s)) return true;
    if (/^n\/?a$/i.test(s)) return true;
    if (/^—$|^-$/.test(s)) return true;
    return false;
  }

  function isExtensionChrome(el) {
    return !!(el && el.closest && el.closest("#escalation-helper-dock, .esc-modal-overlay, .esc-toast"));
  }

  function applyUserAttributePair(out, rawKey, rawValue) {
    const key = String(rawKey || "").replace(/\s+/g, " ").replace(/[:：]+$/g, "").trim();
    const value = String(rawValue || "").replace(/\s+/g, " ").trim();
    if (!key || /^user\s*name$/i.test(key) || /^username$/i.test(key)) return;
    const isGlife = /^glife[-_\s]/i.test(key);
    if (/^(glife[-_\s])?first\s*name$/i.test(key)) {
      if (!isBlankPersonValue(value)) {
        if (isGlife) out.firstName = out.firstName || value;
        else out.firstName = value;
      }
      return;
    }
    if (/^(glife[-_\s])?middle\s*name$/i.test(key)) {
      if (!isBlankPersonValue(value)) {
        if (isGlife) out.middleName = out.middleName || value;
        else out.middleName = value;
      }
      return;
    }
    if (/^(glife[-_\s])?last\s*name$/i.test(key)) {
      if (!isBlankPersonValue(value)) {
        if (isGlife) out.lastName = out.lastName || value;
        else out.lastName = value;
      }
      return;
    }
    if (/^(full\s*name|fullname)$/i.test(key) || /^name$/i.test(key)) {
      if (!isBlankPersonValue(value)) out.fullName = out.fullName || value;
      return;
    }
    if (/^(glife[-_\s])?(date\s*of\s*birth|dateofbirth|dob)$/i.test(key)) {
      if (!isBlankPersonValue(value)) {
        if (isGlife) out.dob = out.dob || value;
        else out.dob = value;
      }
      return;
    }
    if (/^gLifeUserId$/i.test(key) || /^glife\s*user\s*id$/i.test(key)) {
      out.gLifeUserId = value;
    }
  }

  /**
   * Name and DOB from Nano User Attributes (firstName, lastName, dateOfBirth).
   */
  function scrapeUserAttributes() {
    const out = { firstName: "", middleName: "", lastName: "", fullName: "", name: "", dob: "", gLifeUserId: "" };
    if (typeof document === "undefined") return out;

    const rows = document.querySelectorAll("table tr");
    rows.forEach((row) => {
      if (isExtensionChrome(row)) return;
      const cells = Array.from(row.querySelectorAll("th, td"));
      if (cells.length < 2) return;
      applyUserAttributePair(out, cells[0].textContent, cells[1].textContent);
    });

    document.querySelectorAll("dt").forEach((dt) => {
      if (isExtensionChrome(dt)) return;
      const dd = dt.nextElementSibling;
      if (!dd || String(dd.tagName || "").toLowerCase() !== "dd") return;
      applyUserAttributePair(out, dt.textContent, dd.textContent);
    });

    document.querySelectorAll("label").forEach((label) => {
      if (isExtensionChrome(label)) return;
      let value = "";
      const forId = label.htmlFor || label.getAttribute("for");
      if (forId) {
        const bound = document.getElementById(forId);
        if (bound && !isExtensionChrome(bound)) {
          value = bound.value || bound.innerText || bound.textContent || "";
        }
      }
      if (!value && label.nextElementSibling && !isExtensionChrome(label.nextElementSibling)) {
        value = label.nextElementSibling.innerText || label.nextElementSibling.textContent || "";
      }
      applyUserAttributePair(out, label.textContent, value);
    });

    out.name = [out.firstName, out.middleName, out.lastName].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
    if (!out.name && out.fullName) out.name = String(out.fullName).replace(/\s+/g, " ").trim();
    return out;
  }

  /**
   * Helper to dispatch full pointer/mouse/click events on an element
   */
  function dispatchFullClick(element) {
    if (!element) return false;
    const target = element.closest("button, a, [role='button']") || element;
    const eventTypes = ["pointerdown", "mousedown", "pointerup", "mouseup", "click"];
    eventTypes.forEach((type) => {
      try {
        const ev = new MouseEvent(type, {
          bubbles: true,
          cancelable: true,
          view: window
        });
        target.dispatchEvent(ev);
      } catch (e) {}
    });
    if (typeof target.click === "function") {
      try { target.click(); } catch (e) {}
    }
    return true;
  }

  // Re-entrancy guard to prevent recursive event loops
  let isInjectingNote = false;

  /**
   * Set native value of input / textarea with React/Vue prototype setter bypass
   */
  function setNativeInputValue(inputEl, value) {
    if (!inputEl) return false;
    if (isInjectingNote) return false;

    // Ignore if target belongs to our extension UI
    if (inputEl.closest && inputEl.closest("#escalation-helper-dock, .esc-modal-overlay, .esc-toast")) {
      return false;
    }

    // If value is already identical, no need to trigger event chain
    if (inputEl.value === value) {
      return true;
    }

    isInjectingNote = true;
    try {
      try {
        inputEl.focus();
      } catch (e) {}

      const isTextarea = inputEl.tagName === "TEXTAREA";
      const proto = isTextarea
        ? (window.HTMLTextAreaElement ? window.HTMLTextAreaElement.prototype : Object.getPrototypeOf(inputEl))
        : (window.HTMLInputElement ? window.HTMLInputElement.prototype : Object.getPrototypeOf(inputEl));
      const descriptor = Object.getOwnPropertyDescriptor(proto, "value");

      if (descriptor && descriptor.set) {
        descriptor.set.call(inputEl, value);
      } else {
        inputEl.value = value;
      }

      inputEl.dispatchEvent(new Event("input", { bubbles: true }));
      inputEl.dispatchEvent(new Event("change", { bubbles: true }));
      try {
        inputEl.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Enter" }));
        inputEl.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true, key: "Enter" }));
      } catch (e) {}

      // Check "Pin Note" checkbox if present in the card (strictly exclude extension UI)
      const container = inputEl.closest(".card, .panel, .widget, .box, [class*='note'], form, section");
      if (container && !(container.closest && container.closest("#escalation-helper-dock, .esc-modal-overlay, .esc-toast"))) {
        const pinCheckbox = container.querySelector("input[type='checkbox']");
        if (pinCheckbox && !pinCheckbox.checked && !(pinCheckbox.closest && pinCheckbox.closest("#escalation-helper-dock, .esc-modal-overlay, .esc-toast"))) {
          pinCheckbox.checked = true;
          pinCheckbox.dispatchEvent(new Event("change", { bubbles: true }));
        }
      }
    } finally {
      isInjectingNote = false;
    }

    return true;
  }

  /**
   * Locate the User Notes title and card container on the page
   */
  function findUserNotesElements() {
    const titleCandidates = Array.from(document.querySelectorAll(
      "h1, h2, h3, h4, h5, h6, .card-title, .panel-title, .box-title, .title, strong, b, [class*='title'], [class*='header']"
    )).filter(el => !(el.closest && el.closest("#escalation-helper-dock, .esc-modal-overlay, .esc-toast")));

    let titleEl = titleCandidates.find((el) => {
      const txt = (el.textContent || "").trim();
      return /^User\s+Notes/i.test(txt) && txt.length < 40;
    });

    if (!titleEl) {
      const allTextNodes = Array.from(document.querySelectorAll("span, div, p, a"))
        .filter(el => !(el.closest && el.closest("#escalation-helper-dock, .esc-modal-overlay, .esc-toast")));
      titleEl = allTextNodes.find((el) => {
        if (el.children.length > 3) return false;
        const txt = (el.textContent || "").trim();
        return /^User\s+Notes(\s*[\d\(\)]+)?$/i.test(txt) && txt.length < 30;
      });
    }

    if (!titleEl) return null;

    const card = titleEl.closest(".card, .panel, .widget, .box, [class*='card'], [class*='panel'], [class*='widget'], [class*='box'], section")
              || (titleEl.parentElement && titleEl.parentElement.parentElement && titleEl.parentElement.parentElement.parentElement)
              || (titleEl.parentElement && titleEl.parentElement.parentElement)
              || titleEl.parentElement;

    if (card && card.closest && card.closest("#escalation-helper-dock, .esc-modal-overlay, .esc-toast")) {
      return null;
    }

    return { titleEl, card };
  }

  function looksLikeCidToken(token) {
    const t = String(token || "").trim();
    if (!t || t.length < 4) return false;
    if (/^cid$/i.test(t)) return false;
    return /^[0-9]{6,}$/.test(t) || /^[0-9A-Za-z_-]{6,}$/.test(t);
  }

  /**
   * Read the player CID from existing User Notes (middle value in CODE / CID / reason).
   * Newest notes are typically at the top of the card — first match wins.
   */
  function scrapeCidFromUserNotes() {
    if (typeof document === "undefined") return "";

    const found = findUserNotesElements();
    const scope = (found && found.card) ? found.card : null;
    if (!scope || (scope.closest && scope.closest("#escalation-helper-dock, .esc-modal-overlay, .esc-toast"))) {
      return "";
    }

    const text = (scope.innerText || scope.textContent || "");
    const lines = text.split(/\n/);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const labeled = line.match(/\bCID\s*[:\-]\s*([0-9A-Za-z_-]{6,})/i);
      if (labeled && looksLikeCidToken(labeled[1])) {
        return labeled[1].trim();
      }

      const parts = line.split(/\s*\/\s*/);
      if (parts.length >= 3 && looksLikeCidToken(parts[1])) {
        return parts[1].trim();
      }
    }

    return "";
  }

  function isPlainUserIdToken(value) {
    const t = String(value || "").trim();
    return /^[A-Za-z0-9]+$/.test(t) && t.length >= 4 && !/^(DUP|ID|IDS|UID|UIDS|S|USER|USERS|OLD|ACCOUNT|KYC|SWITCH|CID|NAME|DOB)$/i.test(t);
  }

  function getUserNoteParagraphs() {
    const found = findUserNotesElements();
    const card = found && found.card;
    if (!card) return [];
    const list = card.querySelector(".conversation-list") || card;
    const nodes = Array.from(list.querySelectorAll("p, li, .chat-message, .message, [class*='comment']"));
    const texts = nodes
      .map(el => String(el.innerText || el.textContent || "").replace(/\s+/g, " ").trim())
      .filter(t => t && t.length > 2 && !/^User\s+Notes/i.test(t));
    if (texts.length) return texts;
    return String(card.innerText || "")
      .split(/\n/)
      .map(t => t.trim())
      .filter(t => t && !/^User\s+Notes/i.test(t) && t.length > 2);
  }

  function splitPipeNameDob(text) {
    const parts = String(text || "").split("|");
    if (parts.length < 3) return { name: "", dob: "" };
    const name = String(parts[1] || "").replace(/\s+/g, " ").trim();
    let dob = parts.slice(2).join("|").replace(/\s+/g, " ").trim();
    dob = dob.replace(/^Date\s+of\s+birth(?:\s*\(\s*age\s*\))?\s*[:\-–—]?\s*/i, "").replace(/^DOB\s*[:\-–—]?\s*/i, "").trim();
    dob = dob.replace(/\s*\(\s*\d{1,3}\s*\)\s*$/g, "").replace(/\s*\/\s*UA\s*$/i, "").trim();
    return { name, dob };
  }

  function stripNgpUaNotePrefix(text) {
    return String(text || "")
      .replace(/NOT\s*OK\s+for\s+RETAKE\s*:\s*/gi, " ")
      .replace(/\bDoc-?UA\b\s*/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function noteHasDateToken(text) {
    return /[0-9]{1,2}\s+[A-Za-z]{3,9},?\s+[0-9]{4}/.test(String(text || ""));
  }

  function isBareNotOkNote(text) {
    const t = stripNoteTimestamp(text).replace(/\s+/g, " ").trim();
    if (!/NOT\s*OK/i.test(t)) return false;
    if (noteHasDateToken(t) || /\|/.test(t)) return false;
    const stripped = stripNgpUaNotePrefix(t);
    if (looksLikePersonName(stripped)) return false;
    return true;
  }

  function splitTwoPartNameDob(text) {
    const raw = stripNgpUaNotePrefix(stripNoteTimestamp(text)).replace(/\s+/g, " ").trim();
    const dobAt = raw.match(/\|\s*([0-9]{1,2}\s+[A-Za-z]{3,9},?\s+[0-9]{4})/i);
    if (!dobAt || typeof dobAt.index !== "number") return { name: "", dob: "" };
    const dob = dobAt[1].replace(/\s+/g, " ").trim();
    const before = raw.slice(0, dobAt.index).replace(/[\s|\/\-–—]+$/g, "").trim();
    const words = before.split(/\s+/).filter(Boolean);
    const caps = [];
    for (let i = words.length - 1; i >= 0; i--) {
      const w = words[i];
      if (/^(JR|SR|II|III|IV)\.?$/i.test(w) || /^[A-ZÁÉÍÓÚÜÑ][A-ZÁÉÍÓÚÜÑ'\-]{1,}$/.test(w)) {
        caps.unshift(w);
      } else {
        break;
      }
    }
    let name = "";
    if (caps.length >= 2) name = caps.join(" ");
    else if (looksLikePersonName(before)) name = before;
    if (/^(name|ua|doc-?ua)$/i.test(name) || name.split(/\s+/).length < 2) name = "";
    return { name, dob };
  }

  function parseLabeledNameDob(text) {
    const raw = String(text || "").replace(/\s+/g, " ").trim();
    let name = "";
    let dob = "";
    const nameMatch = raw.match(/\bName\s*[:\-–—]\s*([^|]+?)(?=\s+(?:DOB|Date\s+of\s+Birth)\b|$)/i);
    if (nameMatch) name = nameMatch[1].replace(/\s+/g, " ").trim();
    const dobMatch = raw.match(/\b(?:DOB|Date\s+of\s+Birth)(?:\s*\(\s*age\s*\))?\s*[:\-–—]?\s*([0-9]{1,2}\s+[A-Za-z]{3,9},?\s+[0-9]{4}|\d{4}-\d{2}-\d{2}|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i);
    if (dobMatch) dob = dobMatch[1].replace(/\s+/g, " ").trim();
    return { name, dob };
  }

  function looksLikePersonName(value) {
    const words = String(value || "").split(/\s+/).filter(Boolean);
    if (words.length < 2) return false;
    if (/^(name|ua|doc-?ua)$/i.test(value)) return false;
    return words.every((w) => (
      /^(JR|SR|II|III|IV)\.?$/i.test(w)
      || /^[A-ZÁÉÍÓÚÜÑ][A-Za-záéíóúüñ'\-]{1,}$/.test(w)
    ));
  }

  function parseInlineNameBeforeDob(text) {
    const raw = stripNoteTimestamp(text).replace(/[ \t]+/g, " ").replace(/\s*\n\s*/g, "\n").trim();
    const marker = raw.match(/\b(?:Date\s+of\s+[Bb]irth|DOB)\b/i);
    if (!marker) return { name: "", dob: "" };
    const before = raw.slice(0, marker.index).replace(/\/\s*UA\s*$/i, "").replace(/[\s|\/\-–—]+$/g, "").trim();
    const priorLines = before.split(/\n/).map((l) => l.replace(/[,;:]+$/g, "").replace(/\s+/g, " ").trim()).filter(Boolean);
    let name = priorLines.length ? priorLines[priorLines.length - 1] : before.replace(/\s+/g, " ").trim();
    name = name.replace(/[,;:]+$/g, "").replace(/\s+/g, " ").trim();
    if (name.includes(",")) {
      const parts = name.split(",").map(p => p.replace(/\s+/g, " ").trim()).filter(Boolean);
      name = parts[parts.length - 1] || name;
    }
    const words = name.split(/\s+/).filter(Boolean);
    const caps = [];
    for (let i = words.length - 1; i >= 0; i--) {
      const w = words[i];
      if (/^(JR|SR|II|III|IV)\.?$/i.test(w) || /^[A-ZÁÉÍÓÚÜÑ][A-ZÁÉÍÓÚÜÑ'\-]{1,}$/.test(w)) {
        caps.unshift(w);
      } else {
        break;
      }
    }
    if (caps.length >= 2) name = caps.join(" ");
    else if (!looksLikePersonName(name)) name = "";
    if (/^(name|ua|doc-?ua)$/i.test(name) || name.split(/\s+/).length < 2) name = "";
    const after = raw.slice(marker.index);
    const dobMatch = after.match(/(?:Date\s+of\s+[Bb]irth|DOB)(?:\s*\(\s*age\s*\))?\s*[:\-–—]?\s*([0-9]{1,2}\s+[A-Za-z]{3,9},?\s+[0-9]{4})/i);
    let dob = dobMatch ? dobMatch[1].replace(/\s+/g, " ").trim() : "";
    if (!dob) {
      const nextLine = after.split(/\n/).map((l) => l.replace(/\s+/g, " ").trim()).filter(Boolean)[1] || "";
      const nextDob = nextLine.match(/^([0-9]{1,2}\s+[A-Za-z]{3,9},?\s+[0-9]{4})/);
      if (nextDob) dob = nextDob[1].replace(/\s+/g, " ").trim();
    }
    dob = dob.replace(/\s*\(\s*\d{1,3}\s*\)\s*$/g, "").replace(/\s*\/\s*UA\s*$/i, "").trim();
    return { name, dob };
  }

  function takeParsedNameDob(found, parsed) {
    if (!found.name && parsed.name && !isBlankPersonValue(parsed.name)) found.name = parsed.name;
    if (!found.dob && parsed.dob && !isBlankPersonValue(parsed.dob)) found.dob = parsed.dob;
  }

  function parseNameDobFromUserNotes(notes) {
    const found = { name: "", dob: "" };
    const list = notes || [];
    function applyNoteParsers(cleaned) {
      takeParsedNameDob(found, splitPipeNameDob(cleaned));
      takeParsedNameDob(found, splitTwoPartNameDob(cleaned));
      takeParsedNameDob(found, parseLabeledNameDob(cleaned));
      takeParsedNameDob(found, parseInlineNameBeforeDob(cleaned));
    }
    list.forEach((line) => {
      if (found.name && found.dob) return;
      if (isBareNotOkNote(line)) return;
      applyNoteParsers(stripNoteTimestamp(line));
    });
    if (!found.name || !found.dob) {
      const usable = list.filter((t) => t && !isBareNotOkNote(t)).map((t) => stripNoteTimestamp(t));
      for (let i = 0; i < usable.length && (!found.name || !found.dob); i++) {
        const windowText = [usable[i - 1], usable[i], usable[i + 1]].filter(Boolean).join("\n");
        takeParsedNameDob(found, parseInlineNameBeforeDob(windowText));
        takeParsedNameDob(found, splitTwoPartNameDob(windowText.replace(/\s*\n\s*/g, " ")));
      }
      if (!found.name || !found.dob) {
        takeParsedNameDob(found, parseInlineNameBeforeDob(usable.join("\n")));
        takeParsedNameDob(found, splitTwoPartNameDob(usable.join(" ")));
      }
    }
    return found;
  }

  function extractKycUidList(uidSection) {
    if (!uidSection) return [];
    let section = String(uidSection).replace(/\s+/g, " ").trim();
    section = section.replace(/^\s*DUP\s*(?:ID|UID)(?:['’]?S)?\b\s*[:\-–—]?\s*/i, "");
    const result = [];
    const paren = /\(\s*([A-Za-z0-9]+)\s*\)/g;
    let m;
    while ((m = paren.exec(section)) !== null) {
      if (isPlainUserIdToken(m[1])) result.push(m[1]);
    }
    if (result.length) return Array.from(new Set(result));
    section.split(/\s*(?:,|\||\/|\+|;)\s*/).forEach(piece => {
      const tokens = String(piece || "").match(/[A-Za-z0-9]+/g) || [];
      for (let i = tokens.length - 1; i >= 0; i--) {
        if (isPlainUserIdToken(tokens[i])) {
          result.push(tokens[i]);
          break;
        }
      }
    });
    return Array.from(new Set(result));
  }

  function ageFromDob(dobStr) {
    const raw = String(dobStr || "").trim();
    if (!raw) return "";
    let d = new Date(raw);
    if (isNaN(d.getTime())) {
      const m = raw.match(/^(\d{1,2})\s+([A-Za-z]{3,9}),?\s+(\d{4})$/);
      if (m) d = new Date(`${m[2]} ${m[1]}, ${m[3]}`);
    }
    if (isNaN(d.getTime())) return "";
    const today = new Date();
    let age = today.getFullYear() - d.getFullYear();
    const monthDiff = today.getMonth() - d.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < d.getDate())) age -= 1;
    if (age < 0 || age > 120) return "";
    return String(age);
  }

  function formatKycNoteDob(dobStr) {
    const raw = String(dobStr || "").trim();
    if (!raw) return "";
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (iso) {
      const day = parseInt(iso[3], 10);
      const month = parseInt(iso[2], 10) - 1;
      if (month >= 0 && month < 12) return `${day} ${months[month]}, ${iso[1]}`;
    }
    let d = new Date(raw);
    if (isNaN(d.getTime())) {
      const m = raw.match(/^(\d{1,2})\s+([A-Za-z]{3,9}),?\s+(\d{4})$/);
      if (m) return `${parseInt(m[1], 10)} ${m[2].slice(0, 3)}, ${m[3]}`;
      return raw;
    }
    return `${d.getDate()} ${months[d.getMonth()]}, ${d.getFullYear()}`;
  }

  function kycPlainUid(raw) {
    const parsed = parseUserIdValue(raw);
    if (parsed) {
      const id = parsed.publicId || parsed.userId || "";
      return String(id).replace(/[()]/g, "").trim();
    }
    return String(raw || "").replace(/[()]/g, "").trim();
  }

  function requestKycOthers(publicId, callback) {
    if (typeof chrome === "undefined" || !chrome.runtime || !chrome.runtime.sendMessage) {
      callback({ others: [], sibling: null });
      return;
    }
    chrome.runtime.sendMessage({
      action: "KYC_FIND_SIBLING",
      publicId: kycPlainUid(publicId)
    }, (res) => {
      if (chrome.runtime.lastError) {
        callback({ others: [], sibling: null });
        return;
      }
      const others = (res && Array.isArray(res.others)) ? res.others : [];
      const sibling = (res && res.sibling) || (others.length === 1 ? others[0] : null);
      callback({ others, sibling });
    });
  }

  function kycOtherPublicIds(others) {
    return (others || [])
      .map((row) => kycPlainUid(row && (row.publicId || row.userId)))
      .filter(Boolean);
  }

  function kycSlashDupUids(others, verifiedUid) {
    const first = kycPlainUid(verifiedUid);
    const list = [];
    if (first) list.push(first);
    kycOtherPublicIds(others).forEach((id) => {
      if (!list.some((existing) => existing.toLowerCase() === id.toLowerCase())) list.push(id);
    });
    return list.join("/");
  }

  function isKycStatusVerified(raw) {
    const s = String(raw || "").toLowerCase();
    if (!s) return false;
    if (/\bnot\s*verified\b/.test(s)) return false;
    if (/\brejected\b/.test(s) && !/\bverified\b/.test(s)) return false;
    if (/^no\b/.test(s) && !/\bverified\b/.test(s)) return false;
    return /\bverified\b/.test(s) || /\byes\b/.test(s);
  }

  function kycZoomDisplayId(row) {
    return String((row && (row.userCombined || row.publicId || row.userId)) || "").trim();
  }

  function kycSamePlayerId(a, b) {
    const left = kycPlainUid(a).toLowerCase();
    const right = kycPlainUid(b).toLowerCase();
    return !!(left && right && left === right);
  }

  function kycRowMatchesUid(row, uid) {
    const want = kycPlainUid(uid).toLowerCase();
    if (!want || !row) return false;
    return [row.userCombined, row.publicId, row.userId, row.numericId]
      .some((val) => kycPlainUid(val).toLowerCase() === want);
  }

  function kycZoomAssessmentUserLines(thisDisplayId, others, verifiedUidHint) {
    const lines = [];
    const thisId = String(thisDisplayId || "").trim();
    if (thisId) lines.push(`User ID: ${thisId} Rejected wants to verify.`);
    const rows = (others || []).filter((row) => {
      const display = kycZoomDisplayId(row);
      if (!display) return false;
      if (thisId && kycSamePlayerId(display, thisId)) return false;
      return true;
    });
    let verifiedRow = rows.find((row) => isKycStatusVerified(row && row.kycVerified));
    if (!verifiedRow && verifiedUidHint) {
      verifiedRow = rows.find((row) => kycRowMatchesUid(row, verifiedUidHint));
    }
    if (!verifiedRow && rows.length === 1) verifiedRow = rows[0];
    if (verifiedRow) {
      lines.push(`User ID: ${kycZoomDisplayId(verifiedRow)} Verified to rejected.`);
    }
    rows.forEach((row) => {
      if (row === verifiedRow) return;
      const display = kycZoomDisplayId(row);
      if (!display) return;
      lines.push(`User ID: ${display} Rejected.`);
    });
    return lines.join("\n");
  }

  function kycRejectedFromOthers(others, verifiedUid) {
    const verified = kycPlainUid(verifiedUid).toLowerCase();
    return kycOtherPublicIds(others)
      .filter((id) => id && id.toLowerCase() !== verified)
      .join("\n");
  }

  function ensureKycNoteParens(text, noteIndex) {
    let out = String(text || "");
    if (Number(noteIndex) === 1) {
      if (/\([^)]*$/.test(out) && !/\)\s*$/.test(out)) out += ")";
      return out;
    }
    out = out.replace(/\(\s*\)/g, "");
    out = out.replace(/\((\d{1,3})\s*-\s*DUP/i, "($1) - DUP");
    out = out.replace(/\s+\(\s*(?=-\s*DUP)/i, " ");
    const openAge = out.search(/\(\d{1,3}(?!\))/);
    if (openAge !== -1 && out.indexOf(")", openAge) === -1) out += ")";
    return out;
  }

  function stripNoteTimestamp(text) {
    return String(text || "")
      .replace(/\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|\s*UTC)?/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function stripZoomStampLines(text) {
    return String(text || "").split("\n").filter((line) => {
      const t = line.trim();
      if (/^Date\s+of\s+Birth/i.test(t)) return true;
      if (/^Date\s*:/i.test(t)) {
        const rest = t.replace(/^Date\s*:\s*/i, "");
        const isClock = /\d{4}-\d{2}-\d{2}/.test(rest) || /\d{2}:\d{2}:\d{2}/.test(rest) || /\bUTC\b/i.test(rest);
        if (isClock) return false;
      }
      if (/^Agent(\s*Name)?\s*:/i.test(t)) return false;
      return true;
    }).map((line) => stripNoteTimestamp(line)).join("\n").replace(/\n{3,}/g, "\n\n").replace(/^\s+|\s+$/g, "");
  }

  function stripEmptyDobZoomLine(text) {
    return String(text || "").split("\n").filter((line) => {
      const t = line.trim();
      if (/^DOB\s*:?\s*$/i.test(t)) return false;
      if (/^Date\s+of\s+[Bb]irth\s*:?\s*$/i.test(t)) return false;
      return true;
    }).join("\n").replace(/\n{3,}/g, "\n\n").replace(/^\s+|\s+$/g, "");
  }

  function buildKycOldAccountNote(newAccountUid) {
    const preset = getKycSwitchPreset();
    const tpl = (preset.noteChoices && preset.noteChoices[1] && preset.noteChoices[1].userNotesText)
      || "The Old account: KYC switch - New account UID:([New Account UID])";
    return ensureKycNoteParens(safeRenderEscalationNote(tpl, { newAccountUid: kycPlainUid(newAccountUid) }), 1);
  }

  function extractKycOldAccountUid() {
    const notes = getUserNoteParagraphs();
    for (const text of notes) {
      if (!/Old\s+account/i.test(text) || !/KYC\s*switch/i.test(text)) continue;
      const uidLabeled = text.match(/New\s+account\s+UID\s*:\s*\(?([A-Za-z0-9]+)\)?/i);
      if (uidLabeled && isPlainUserIdToken(uidLabeled[1])) return uidLabeled[1];
      const direct = text.match(/KYC\s*switch\s*[-:–—]\s*([A-Za-z0-9]+)/i);
      if (direct && isPlainUserIdToken(direct[1])) return direct[1];
      const tokens = text.match(/[A-Za-z0-9]+/g) || [];
      for (let i = tokens.length - 1; i >= 0; i--) {
        if (isPlainUserIdToken(tokens[i])) return tokens[i];
      }
    }
    return "";
  }

  function extractKycSwitchDetails() {
    const notes = getUserNoteParagraphs();
    const text = notes.find(t => /KYC\s*switch/i.test(t) && /DUP/i.test(t)) || notes[0] || "";
    if (!text) return { name: "", dob: "", uids: [], verifiedUid: "", rejectedAccounts: "" };
    const dupMatch = text.match(/\bDUP\s*(?:ID|UID)(?:['’]?S)?\b\s*[:\-–—]?\s*/i);
    let personal = text;
    let uidSection = "";
    if (dupMatch && typeof dupMatch.index === "number") {
      personal = text.substring(0, dupMatch.index);
      uidSection = text.substring(dupMatch.index + dupMatch[0].length);
    }
    personal = personal.replace(/^.*?New\s+Verified\s+account\s*:\s*KYC\s*switch\s*[-:–—]?\s*/i, "").trim();
    const dobMatch = personal.match(/(\d{1,2}\s+[A-Za-z]{3,9},?\s+\d{4})/);
    const dob = dobMatch ? dobMatch[1].trim() : "";
    let name = personal;
    if (dobMatch) name = personal.substring(0, dobMatch.index).replace(/[-+]+/g, " ").replace(/\s+/g, " ").trim();
    name = name.replace(/\bAGE\b/ig, "").replace(/\s+/g, " ").trim();
    const uids = extractKycUidList(uidSection);
    const verifiedUid = uids.length ? uids[uids.length - 1] : extractKycOldAccountUid();
    const rejectedAccounts = uids.length > 1 ? uids.slice(0, -1).join("\n") : "";
    return { name, dob, uids, verifiedUid, rejectedAccounts };
  }

  function scrapeNoteFillExtras(code) {
    const extras = { name: "", dob: "", noteDate: "", gLifeUserId: "", verifiedUid: "", rejectedAccounts: "" };
    const attrs = scrapeUserAttributes();
    extras.name = attrs.name || "";
    extras.dob = attrs.dob || "";
    extras.gLifeUserId = attrs.gLifeUserId || "";
    const notes = getUserNoteParagraphs();

    if (code === "KYC SWITCH") {
      extras.verifiedUid = "";
      extras.rejectedAccounts = "";
    }

    if (code === "NDRP") {
      const hit = notes.find(t => /NDRP/i.test(t));
      if (hit) {
        const exclusion = hit.match(/Exclusion\s+Period\s*[:\-–—]?\s*(.+)$/i);
        const range = hit.match(/(\d{1,2}\s+[A-Za-z]{3,9},?\s+\d{4}\s*(?:-|–|—|to)\s*\d{1,2}\s+[A-Za-z]{3,9},?\s+\d{4})/i);
        extras.noteDate = (exclusion && exclusion[1] ? exclusion[1].trim() : "") || (range ? range[1] : "");
        let name = hit.replace(/NDRP/gi, "").replace(/Exclusion\s+Period\s*[:\-–—]?.*$/i, "");
        if (extras.noteDate) name = name.replace(extras.noteDate, "");
        name = stripNoteTimestamp(name).replace(/^[\s|\/\-–—:]+/, "").replace(/[\s|\/\-–—:]+$/, "").replace(/\s+/g, " ").trim();
        if (name) extras.name = name;
      }
      extras.name = stripNoteTimestamp(extras.name);
      return extras;
    }

    if (isBlankPersonValue(extras.name) || isBlankPersonValue(extras.dob)) {
      const fromNotes = parseNameDobFromUserNotes(notes);
      if (isBlankPersonValue(extras.name) && fromNotes.name) extras.name = fromNotes.name;
      if (isBlankPersonValue(extras.dob) && fromNotes.dob) extras.dob = fromNotes.dob;
    }

    if ((code === "GLIFE.1" || code === "GLIFE.2") && (isBlankPersonValue(extras.name) || isBlankPersonValue(extras.dob))) {
      const hit = notes.find(t => /GLIFE\s+Override/i.test(t) && !/NOT\s*OK/i.test(t));
      const piped = splitPipeNameDob(hit || "");
      if (isBlankPersonValue(extras.name) && piped.name) extras.name = piped.name;
      if (isBlankPersonValue(extras.dob) && piped.dob) extras.dob = piped.dob;
    }

    if (code === "REACT" && isBlankPersonValue(extras.name) && extras.gLifeUserId && !isBlankPersonValue(extras.gLifeUserId)) {
      extras.name = extras.gLifeUserId;
    }

    return extras;
  }

  /**
   * Find the 'Enter your text' input field if already visible
   */
  function findNotesInputField(card) {
    const scopes = card ? [card] : [];

    for (const scope of scopes) {
      if (scope.closest && scope.closest("#escalation-helper-dock, .esc-modal-overlay, .esc-toast")) continue;

      const inputs = Array.from(scope.querySelectorAll("input, textarea"))
        .filter(el => !(el.closest && el.closest("#escalation-helper-dock, .esc-modal-overlay, .esc-toast")));

      // 1. Placeholder contains "enter your text"
      const byPlaceholder = inputs.find((el) => {
        if (el.offsetParent === null) return false;
        const ph = (el.placeholder || "").trim().toLowerCase();
        return ph.includes("enter your text");
      });
      if (byPlaceholder) return byPlaceholder;

      // 2. Look for input adjacent to "Add Comment" button
      const buttons = Array.from(scope.querySelectorAll("button, a, input[type='submit'], [role='button']"))
        .filter(el => !(el.closest && el.closest("#escalation-helper-dock, .esc-modal-overlay, .esc-toast")));
      const addCommentBtn = buttons.find((b) => {
        const txt = (b.textContent || b.value || "").trim().toLowerCase();
        return txt.includes("add comment") || txt.includes("add note") || txt === "comment";
      });
      if (addCommentBtn && addCommentBtn.offsetParent !== null) {
        const parent = addCommentBtn.parentElement || addCommentBtn.closest("form, div");
        if (parent && !(parent.closest && parent.closest("#escalation-helper-dock, .esc-modal-overlay, .esc-toast"))) {
          const adj = parent.querySelector("input:not([type='button']):not([type='submit']), textarea");
          if (adj && adj.offsetParent !== null && !(adj.closest && adj.closest("#escalation-helper-dock, .esc-modal-overlay, .esc-toast"))) {
            return adj;
          }
        }
      }

      // 3. Fallback: visible text input inside the card
      if (scope === card) {
        const visibleInput = inputs.find((el) => {
          if (el.offsetParent === null) return false;
          if (["button", "submit", "checkbox", "radio", "color", "file", "hidden"].includes(el.type)) return false;
          const ph = (el.placeholder || "").toLowerCase();
          return ph.includes("note") || ph.includes("text") || ph.includes("comment") || !el.type || el.type === "text";
        });
        if (visibleInput) return visibleInput;
      }
    }

    return null;
  }

  /**
   * Find the '+' button in the User Notes card or header
   */
  function findPlusButton(card, titleEl) {
    const scopes = [];
    if (titleEl) {
      if (titleEl.parentElement) scopes.push(titleEl.parentElement);
      const headerRow = titleEl.closest(".card-header, .panel-heading, [class*='header'], header, div");
      if (headerRow && !scopes.includes(headerRow)) scopes.push(headerRow);
    }
    if (card && !scopes.includes(card)) scopes.push(card);

    for (const scope of scopes) {
      if (scope.closest && scope.closest("#escalation-helper-dock, .esc-modal-overlay, .esc-toast")) continue;

      const elements = Array.from(scope.querySelectorAll("button, a, span, i, div, svg, path, [role='button']"))
        .filter(el => !(el.closest && el.closest("#escalation-helper-dock, .esc-modal-overlay, .esc-toast")));

      // Exact '+' text
      const textPlus = elements.find((el) => {
        const txt = (el.textContent || "").trim();
        return txt === "+" || txt === "＋" || txt === "\u002B" || txt === "+ Add";
      });
      if (textPlus) {
        return textPlus.closest("button, a, [role='button']") || textPlus;
      }

      // Class or title indicating plus/add
      const iconPlus = elements.find((el) => {
        if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") return false;
        const cls = (el.className && typeof el.className === "string") ? el.className.toLowerCase() : "";
        const title = (el.getAttribute("title") || "").toLowerCase();
        const aria = (el.getAttribute("aria-label") || "").toLowerCase();
        return cls.includes("plus") || cls.includes("fa-plus") || cls.includes("add-note")
            || title.includes("add") || title.includes("plus")
            || aria.includes("add") || aria.includes("plus");
      });
      if (iconPlus) {
        return iconPlus.closest("button, a, [role='button']") || iconPlus;
      }

      // SVG icon in header
      const svgs = Array.from(scope.querySelectorAll("svg"));
      if (svgs.length > 0) {
        return svgs[0].closest("button, a, [role='button']") || svgs[0];
      }
    }

    // Fallback: look anywhere in the document (excluding extension UI)
    const allPluses = Array.from(document.querySelectorAll("button, a, .fa-plus, [class*='plus'], [class*='add']"))
      .filter(el => !(el.closest && el.closest("#escalation-helper-dock, .esc-modal-overlay, .esc-toast")));
    const fallback = allPluses.find((el) => {
      const txt = (el.textContent || "").trim();
      return txt === "+" || (el.className && el.className.toString().toLowerCase().includes("plus"));
    });
    return fallback || null;
  }

  // Cache for actively targeted input field
  let activeNotesInputField = null;

  /**
   * Inject note into backoffice "User Notes" widget on page.
   * Auto-clicks '+' if the composer is not open, then inputs note using React setter.
   */
  function injectUserNoteOnPage(noteText, callback) {
    if (!noteText) {
      if (callback) callback(false);
      return;
    }

    // Check if we already have the active input field and it is still in DOM & visible
    if (activeNotesInputField && activeNotesInputField.isConnected && (activeNotesInputField.offsetParent !== null || activeNotesInputField === document.activeElement)) {
      setNativeInputValue(activeNotesInputField, noteText);
      if (callback) callback(true);
      return;
    }

    const elements = findUserNotesElements();
    const card = elements ? elements.card : null;
    const titleEl = elements ? elements.titleEl : null;

    // 1. Check if input field is ALREADY open and visible!
    let inputField = findNotesInputField(card);
    if (inputField) {
      activeNotesInputField = inputField;
      setNativeInputValue(inputField, noteText);
      if (callback) callback(true);
      return;
    }

    // 2. If not visible yet, find and click the '+' button
    const plusBtn = findPlusButton(card, titleEl);
    if (plusBtn) {
      dispatchFullClick(plusBtn);
    }

    // 3. Poll for the input field to appear (up to 2500ms, checking every 60ms)
    let attempts = 0;
    const maxAttempts = 40;
    let pollInterval = null;
    pollInterval = setInterval(() => {
      attempts++;
      inputField = findNotesInputField(card);
      if (inputField) {
        if (pollInterval) clearInterval(pollInterval);
        activeNotesInputField = inputField;
        setNativeInputValue(inputField, noteText);
        if (callback) callback(true);
        return;
      }

      if (attempts >= maxAttempts) {
        if (pollInterval) clearInterval(pollInterval);
        // Fallback: check any textarea or text input on the page (excluding extension UI)
        const candidates = Array.from(document.querySelectorAll("textarea, input[placeholder*='text'], input[placeholder*='note']"));
        const anyInput = candidates.find(inp => !(inp.closest && inp.closest("#escalation-helper-dock, .esc-modal-overlay, .esc-toast")) && (inp.offsetParent !== null || inp === document.activeElement));
        if (anyInput) {
          activeNotesInputField = anyInput;
          setNativeInputValue(anyInput, noteText);
          if (callback) callback(true);
        } else {
          if (callback) callback(false);
        }
      }
    }, 60);
  }

  /**
   * Display a sleek toast notification (compact or rich template card)
   */
  function showToast(message, isSuccess = true, templateText = "") {
    const existing = document.querySelector(".esc-toast");
    if (existing) existing.remove();

    const toast = document.createElement("div");
    toast.className = templateText ? "esc-toast esc-toast-card" : "esc-toast";
    if (!isSuccess) toast.style.borderLeftColor = "#f59e0b";

    let dismissTimeout = null;
    const startDismissTimer = (duration = templateText ? 5500 : 3500) => {
      if (typeof clearTimeout !== "undefined" && dismissTimeout) {
        clearTimeout(dismissTimeout);
      }
      dismissTimeout = setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateY(8px)";
        toast.style.transition = "opacity 0.25s, transform 0.25s";
        setTimeout(() => toast.remove(), 250);
      }, duration);
    };

    if (templateText) {
      toast.innerHTML = `
        <div class="esc-toast-header">
          <div class="esc-toast-header-left">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="${isSuccess ? '#10b981' : '#f59e0b'}" stroke-width="2.5">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <span>${escapeHtml(message || "Copied to Clipboard!")}</span>
          </div>
          <div style="display: flex; align-items: center; gap: 6px;">
            <span class="esc-toast-badge">Zoom App</span>
            <button type="button" class="esc-toast-close" title="Dismiss">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>
        <div class="esc-toast-sub">
          <span>Copied Template &bull; Ready to paste (Ctrl+V) in Zoom:</span>
        </div>
        <pre class="esc-toast-preview">${escapeHtml(templateText)}</pre>
      `;

      const closeBtn = toast.querySelector(".esc-toast-close");
      if (closeBtn) {
        closeBtn.addEventListener("click", () => {
          if (typeof clearTimeout !== "undefined" && dismissTimeout) {
            clearTimeout(dismissTimeout);
          }
          toast.remove();
        });
      }

      // Pause auto-dismiss on hover
      toast.addEventListener("mouseenter", () => {
        if (typeof clearTimeout !== "undefined" && dismissTimeout) {
          clearTimeout(dismissTimeout);
        }
      });
      toast.addEventListener("mouseleave", () => startDismissTimer(3000));
    } else {
      toast.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${isSuccess ? '#10b981' : '#f59e0b'}" stroke-width="2.5">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
        <span>${escapeHtml(message)}</span>
      `;
    }

    document.body.appendChild(toast);
    startDismissTimer();
  }

  /**
   * Launch Zoom PC Desktop App (zoomus://) or open web workspace
   */
  function launchZoomApp(zoomUrl) {
    const target = (zoomUrl || currentSettings.zoomUrl || "zoomus://").trim();

    // If desktop protocol (zoomus:// or zoommtg://)
    if (target.startsWith("zoomus:") || target.startsWith("zoommtg:")) {
      try {
        const a = document.createElement("a");
        a.href = target;
        a.style.display = "none";
        document.body.appendChild(a);
        a.click();
        setTimeout(() => a.remove(), 1000);
      } catch (e) {
        console.warn("Direct protocol click error:", e);
      }
      return;
    }

    // Web URL fallback via Chrome runtime
    if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({
        action: "OPEN_ZOOM",
        zoomUrl: target
      });
    } else {
      window.open(target, "_blank");
    }
  }

  /**
   * Navigate current tab back to the Users search page (https://nano-admin.bet88.ph/users)
   */
  function returnToUsersList(modal) {
    if (!isAdminLicense() || currentSettings.autoReturnToUsers === false) return;
    const target = (currentSettings.usersListUrl || "https://nano-admin.bet88.ph/users").trim();
    if (!target) return;

    // Check if we are already strictly on that clean search page
    const currentLoc = (typeof window !== "undefined" && window.location) ? window.location.href : "";
    if (currentLoc === target || currentLoc === target + "/") {
      return;
    }

    if (modal && typeof modal.remove === "function") {
      modal.remove();
      activeModal = null;
    }

    showToast("Escalation completed! Returning to Users list...", true);
    setTimeout(() => {
      try {
        if (typeof window !== "undefined" && window.location) {
          window.location.href = target;
        }
      } catch (e) {
        console.warn("Direct navigation error:", e);
      }
    }, 700);
  }

  /**
   * Dynamic update of buttons on the horizontal bar
   */
  function updateHorizontalDockButtons() {
    if (!dockElement) return;
    const columnsRow = dockElement.querySelector(".esc-columns-row");
    if (!columnsRow) return;

    applyBarLayout();
    const activeOptions = getActiveOptions();
    dockElement.style.setProperty("--esc-columns-count", Math.max(activeOptions.length, 1));
    columnsRow.style.gridTemplateColumns = isVerticalBar()
      ? "1fr"
      : `repeat(${Math.max(activeOptions.length, 1)}, minmax(0, 1fr))`;

    let columnsHtml = "";
    activeOptions.forEach(item => {
      const chip = item.chip || { text: "", color: "#dc2626" };
      const chipText = chip.text || "";

      columnsHtml += `
        <div class="esc-col" data-code="${escapeHtml(item.code)}">
          <button type="button" class="esc-action-btn" data-code="${escapeHtml(item.code)}" style="background-color: ${item.color || '#2563eb'}">
            ${escapeHtml(item.label || item.code)}
          </button>
          <div class="esc-tooltip-text">
            <strong>${escapeHtml(item.meaning || item.label || item.code)}</strong><br>
            ${chipText ? `<span style="display:inline-block; margin-top:2px; margin-bottom:3px; background:${chip.color || '#dc2626'}; color:#fff; font-size:9px; font-weight:800; padding:1px 5px; border-radius:3px; text-transform:uppercase;">${escapeHtml(chipText)}</span><br>` : ''}
            <span style="color: #cbd5e1;">${escapeHtml(item.description || '')}</span>
            ${item.defaultReason ? `<div style="margin-top:4px; color:#38bdf8; font-size:10px;">Reason: ${escapeHtml(item.defaultReason)}</div>` : ''}
          </div>
        </div>
      `;
    });

    columnsRow.innerHTML = columnsHtml;

    // Re-bind action button events
    columnsRow.querySelectorAll(".esc-action-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        rememberModalOrigin(btn);
        const code = btn.getAttribute("data-code");
        askReasonThenConfirm(code);
      });
    });
  }

  /**
   * Render the floating horizontal bar matching Image 2
   */
  function hideEscalationDock() {
    const dock = document.getElementById("escalation-helper-dock") || dockElement;
    if (dock && dock.remove) dock.remove();
    dockElement = null;
  }

  function renderHorizontalDock() {
    if (document.getElementById("escalation-helper-dock")) {
      dockElement = document.getElementById("escalation-helper-dock");
      updateHorizontalDockButtons();
      return;
    }

    const dock = document.createElement("div");
    dock.id = "escalation-helper-dock";
    dockElement = dock;

    dock.innerHTML = `
      <div class="esc-bar-header" id="esc-bar-drag-header">
        <div class="esc-header-left">
          <span class="esc-brand">
            ${JET_LOGO_URL ? `<img class="esc-brand-logo" src="${JET_LOGO_URL}" alt="JET">` : `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
            </svg>`}
            <span class="esc-brand-text">hdjrzTools</span>
          </span>
          <span class="esc-player-badge empty" id="esc-player-status">Searching player...</span>
        </div>
        <div class="esc-header-controls">
          <button type="button" class="esc-icon-btn" id="esc-btn-refresh" title="Re-scan current player">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M23 4v6h-6"></path><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
            </svg>
          </button>
          <button type="button" class="esc-icon-btn" id="esc-btn-settings" title="Extension Settings, Options & Meanings">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
          </button>
          <button type="button" class="esc-icon-btn" id="esc-btn-toggle" title="Minimize / Expand bar">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
          <button type="button" class="esc-icon-btn esc-btn-close" id="esc-btn-close" title="Hide floating bar on this page">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>

      <div class="esc-bar-main">
        <div class="esc-columns-row"></div>
      </div>
    `;

    document.body.appendChild(dock);

    applyBarLayout();
    updateHorizontalDockButtons();
    bindDockEvents(dock);
    updatePlayerStatusBadge();
  }

  /**
   * Bind dragging, buttons, and minimize controls
   */
  function bindDockEvents(dock) {
    const header = dock.querySelector("#esc-bar-drag-header");
    let isDragging = false;
    let startX, startY, origX, origY;

    header.addEventListener("mousedown", (e) => {
      if (e.target.closest("button")) return;
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      const rect = dock.getBoundingClientRect();
      origX = rect.left;
      origY = rect.top;
      header.style.cursor = "grabbing";
    });

    window.addEventListener("mousemove", (e) => {
      if (!isDragging) return;
      const dy = e.clientY - startY;
      dock.style.top = `${Math.max(0, origY + dy)}px`;
      if (dock.classList.contains("esc-bar-vertical")) {
        dock.style.left = "auto";
        dock.style.right = "8px";
      } else if (dock.classList.contains("minimized")) {
        const dx = e.clientX - startX;
        dock.style.left = `${Math.max(8, origX + dx)}px`;
        dock.style.right = "auto";
      } else {
        dock.style.left = "8px";
        dock.style.right = "8px";
      }
    });

    window.addEventListener("mouseup", () => {
      isDragging = false;
      header.style.cursor = "grab";
    });

    // Minimize toggle
    const toggleBtn = dock.querySelector("#esc-btn-toggle");
    toggleBtn.addEventListener("click", () => {
      dock.classList.toggle("minimized");
      const isMin = dock.classList.contains("minimized");
      toggleBtn.innerHTML = isMin 
        ? `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect></svg>`
        : `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"></line></svg>`;
      if (isMin && !dock.classList.contains("esc-bar-vertical")) {
        dock.style.left = "";
        dock.style.right = "";
      } else {
        applyBarLayout();
      }
      updatePlayerStatusBadge();
    });

    // Close button
    const closeBtn = dock.querySelector("#esc-btn-close");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        dock.classList.add("hidden-bar");
        showToast("Floating bar hidden. Re-open anytime via the extension icon in Chrome toolbar.");
      });
    }

    // In-page Settings Modal button
    const settingsBtn = dock.querySelector("#esc-btn-settings");
    settingsBtn.addEventListener("click", () => {
      rememberModalOrigin(settingsBtn);
      openSettingsModal();
    });

    // Refresh button
    const refreshBtn = dock.querySelector("#esc-btn-refresh");
    refreshBtn.addEventListener("click", () => {
      detectedPlayer = scrapePlayerCredentials();
      updatePlayerStatusBadge();
      if (detectedPlayer && detectedPlayer.userId) {
        showToast(`Scraped Client User ID: ${detectedPlayer.userId}`);
      } else {
        showToast("No User ID detected on this page. You can type or paste it when clicking any button.", false);
      }
    });
  }

  /**
   * Update header player badge with active client User ID
   */
  function updatePlayerStatusBadge() {
    const badge = document.getElementById("esc-player-status");
    if (!badge) return;
    const compact = !!(dockElement && dockElement.classList.contains("minimized") && !dockElement.classList.contains("esc-bar-vertical"));

    if (detectedPlayer && detectedPlayer.userId) {
      const shortId = detectedPlayer.publicId || detectedPlayer.numericId || detectedPlayer.userId;
      const displayLabel = detectedPlayer.publicId 
        ? `${detectedPlayer.numericId} <strong style="color:#60a5fa; text-decoration: underline;">(${detectedPlayer.publicId})</strong>` 
        : detectedPlayer.numericId || detectedPlayer.userId;
      badge.innerHTML = compact ? escapeHtml(shortId) : `Player: ${displayLabel}`;
      badge.className = "esc-player-badge";
      badge.title = `Active Client User ID: ${detectedPlayer.userId} (Full: ${detectedPlayer.userCombined}) | Affiliate: ${detectedPlayer.affiliate || 'N/A'}`;
    } else {
      badge.innerHTML = compact ? "—" : `<span style="opacity: 0.85;">No Player Detected</span>`;
      badge.className = "esc-player-badge empty";
      badge.title = "No client User ID found on this page. Click refresh or click any button to enter User ID.";
    }
  }

  /**
   * Confirmation Modal (Prevent accidental misclicks)
   * Uses whatever User ID is currently on screen for the active client.
   * Also provides an interactive User ID field so agents can verify or edit it.
   */
  function presetReasonsForCode(code) {
    const preset = getPresetOptionsList().find((o) => o && o.code === code);
    if (!preset) return [];
    return (preset.reasons || []).map((r) => String(r || "").trim()).filter(Boolean);
  }

  function resolveReasonsList(item) {
    const code = String((item && item.code) || "").trim();
    const saved = (item && Array.isArray(item.reasons) ? item.reasons : [])
      .map((r) => String(r || "").trim())
      .filter(Boolean);
    const preset = presetReasonsForCode(code);
    if (saved.length) return saved;
    if (preset.length) return preset;
    const fallback = (item && item.defaultReason) || "Escalation requested";
    return [fallback];
  }

  function getOptionReasons(code) {
    const activeOptions = getActiveOptions();
    let item = activeOptions.find(o => o.code === code);
    if (!item) {
      const dict = (typeof window !== "undefined" && window.EscalationDictionary) || {};
      item = dict[code];
    }
    item = normalizeEscalationOption(item || { code: code, reasons: [] });
    const list = resolveReasonsList(item);
    item.reasons = list;
    item.defaultReason = item.defaultReason || list[0];
    return { item, reasons: list };
  }

  function showChoicePopup(title, subtitle, buttons, onPick) {
    if (activeModal) activeModal.remove();

    const overlay = document.createElement("div");
    overlay.className = "esc-modal-overlay";
    overlay.id = "esc-reason-pick-overlay";

    const buttonHtml = (buttons || []).map((btn, i) => `
      <button type="button" class="esc-reason-pick-btn ${escapeHtml(btn.extraClass || "")}" data-pick="${i}">
        ${escapeHtml(btn.label)}
      </button>
    `).join("");

    overlay.innerHTML = `
      <div class="esc-popover-backdrop" aria-hidden="true"></div>
      <div class="esc-reason-pick-card" role="dialog" aria-modal="true" aria-label="${escapeHtml(subtitle || title || "Choose")}">
        <div class="esc-reason-pick-title">${escapeHtml(title || "")}</div>
        ${subtitle ? `<div class="esc-reason-pick-sub">${escapeHtml(subtitle)}</div>` : ""}
        ${buttonHtml}
        <button type="button" class="esc-reason-pick-cancel" id="esc-reason-pick-cancel">Cancel</button>
      </div>
    `;

    const closePick = (animate) => {
      document.removeEventListener("keydown", pickKey);
      if (animate === false) {
        overlay.remove();
        if (activeModal === overlay) activeModal = null;
        syncPageScrollLock();
        return;
      }
      closeOverlayZoom(overlay);
    };

    const pickKey = (e) => {
      if (e.key === "Escape") closePick();
    };
    document.addEventListener("keydown", pickKey);

    overlay.querySelectorAll("[data-pick]").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        rememberModalOrigin(btn);
        const idx = parseInt(btn.getAttribute("data-pick"), 10);
        const picked = buttons[idx];
        closePick(false);
        if (onPick) onPick(picked && picked.value);
      });
    });

    overlay.querySelector("#esc-reason-pick-cancel").addEventListener("click", (e) => {
      e.stopPropagation();
      closePick();
    });

    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closePick();
    });

    document.body.appendChild(overlay);
    activeModal = overlay;
    playModalOpen(overlay);
  }

  function getKycSwitchPreset() {
    const fromSaved = getActiveOptions().find(o => o && o.code === "KYC SWITCH");
    const list = (typeof window !== "undefined" && window.DEFAULT_ESCALATION_OPTIONS) || [];
    const fromList = list.find(o => o && o.code === "KYC SWITCH");
    const dict = (typeof window !== "undefined" && window.EscalationDictionary) || {};
    const preset = fromSaved || fromList || dict["KYC SWITCH"] || {};
    const noteChoices = (preset.noteChoices && preset.noteChoices.length >= 2) ? preset.noteChoices : [
      { label: "New Verified account", userNotesText: "New Verified account: KYC switch - [Name] / [DOB] ([AGE]) - DUP ID's: [Verified UID]" },
      { label: "Old account", userNotesText: "The Old account: KYC switch - New account UID:([New Account UID])" }
    ];
    const zoomChoices = (preset.zoomChoices && preset.zoomChoices.length >= 2) ? preset.zoomChoices : [
      { label: "2 accounts", zoomText: preset.zoomText || "" },
      { label: "3 or more", zoomText: preset.zoomText || "" }
    ];
    return {
      userNotesText: preset.userNotesText || noteChoices[0].userNotesText,
      zoomText: preset.zoomText || (zoomChoices[0] && zoomChoices[0].zoomText) || "",
      noteChoices,
      zoomChoices
    };
  }

  function applyKycZoomTitle(text, zoomIndex) {
    const title = Number(zoomIndex) === 1 ? "FOR KYC ASSESSMENT" : "FOR KYC SWITCH";
    const lines = String(text || "").split("\n");
    const idx = lines.findIndex((ln) => ln.trim());
    if (idx === -1) return title;
    if (/^FOR KYC\s+(ASSESSMENT|ASSESMENT|SWITCH)\s*$/i.test(lines[idx].trim())) {
      lines[idx] = title;
    }
    return lines.join("\n");
  }

  function askKycSwitchThenConfirm(code) {
    const info = getOptionReasons(code);
    const title = (info.item && (info.item.label || info.item.code)) || "KYC SWITCH";
    showChoicePopup(title, "", [
      { label: "2 ACCOUNTS", value: 0 },
      { label: "3 OR MORE", value: 1, extraClass: "esc-reason-pick-btn-purple" }
    ], (zoomIndex) => {
      if (info.reasons.length < 2) {
        openConfirmationModal(code, info.reasons[0], 0, zoomIndex);
        return;
      }
      showChoicePopup(
        title,
        "Which reason?",
        info.reasons.map((reason) => ({ label: reason, value: reason })),
        (reason) => openConfirmationModal(code, reason, 0, zoomIndex)
      );
    });
  }

  function openLicenseModal(afterUnlock) {
    const existing = document.getElementById("esc-license-overlay");
    if (existing) {
      existing.remove();
    }

    const overlay = document.createElement("div");
    overlay.className = "esc-modal-overlay";
    overlay.id = "esc-license-overlay";
    overlay.innerHTML = `
      <div class="esc-popover-backdrop" aria-hidden="true"></div>
      <div class="esc-modal esc-license-card" role="dialog" aria-modal="true" aria-label="License key">
        <div class="esc-modal-title"><span>hdjrzTools</span></div>
        <p class="esc-settings-intro" style="margin:0;">Enter your license key to use the bar.</p>
        <div class="esc-form-row">
          <label class="esc-form-label" for="esc-license-input">License key</label>
          <div class="esc-license-field">
            <input type="text" class="esc-input" id="esc-license-input" autocomplete="off" spellcheck="false">
            <span class="esc-license-spinner" aria-hidden="true"></span>
          </div>
        </div>
        <div class="esc-license-actions">
          <button type="button" class="esc-btn-secondary" id="esc-license-cancel">Cancel</button>
          <button type="button" class="esc-btn-primary" id="esc-license-unlock">Unlock</button>
        </div>
      </div>
    `;

    const closeLicense = () => closeOverlayZoom(overlay);

    const tryUnlock = () => {
      const input = overlay.querySelector("#esc-license-input");
      const unlockBtn = overlay.querySelector("#esc-license-unlock");
      const fieldWrap = overlay.querySelector(".esc-license-field");
      const key = String((input && input.value) || "").trim();
      if (!key) {
        showToast("Wrong license key.", false);
        if (input) input.focus();
        return;
      }
      if (unlockBtn && unlockBtn.disabled) return;
      if (unlockBtn) unlockBtn.disabled = true;
      if (fieldWrap) fieldWrap.classList.add("is-loading");
      activateLicenseOnServer(key, (err, role) => {
        if (unlockBtn) unlockBtn.disabled = false;
        if (fieldWrap) fieldWrap.classList.remove("is-loading");
        if (err === "already_used") {
          showToast("This key is already used on another PC.", false);
          if (input) input.focus();
          return;
        }
        if (err === "offline") {
          showToast("Could not reach license server.", false);
          if (input) input.focus();
          return;
        }
        if (err || !role) {
          showToast("Wrong license key.", false);
          if (input) input.focus();
          return;
        }
        persistLicenseRole(role, () => {
          closeLicense();
          renderHorizontalDock();
          showToast(role === "admin" ? "Admin unlocked." : "Guest unlocked.");
          if (typeof afterUnlock === "function") afterUnlock();
        }, key);
      });
    };

    overlay.querySelector("#esc-license-unlock").addEventListener("click", tryUnlock);
    overlay.querySelector("#esc-license-input").addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        tryUnlock();
      }
    });
    overlay.querySelector("#esc-license-cancel").addEventListener("click", closeLicense);
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeLicense();
    });
    const licenseKey = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        document.removeEventListener("keydown", licenseKey, true);
        closeLicense();
      }
    };
    document.addEventListener("keydown", licenseKey, true);

    document.body.appendChild(overlay);
    activeModal = overlay;
    playModalOpen(overlay);
    const first = overlay.querySelector("#esc-license-input");
    if (first && first.focus) setTimeout(() => first.focus(), 50);
  }

  function closeEscalationOverlaysExceptLicense() {
    Array.from(document.querySelectorAll(".esc-modal-overlay")).forEach((el) => {
      if (el.id === "esc-license-overlay") return;
      closeOverlayZoom(el);
    });
  }

  function lockLicenseOnThisTab() {
    licenseRole = "";
    hideEscalationDock();
    closeEscalationOverlaysExceptLicense();
    openLicenseModal();
  }

  if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.onChanged) {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== "local" || !changes.hdjrzLicenseRole) return;
      const next = changes.hdjrzLicenseRole.newValue;
      if (next === "admin" || next === "guest") {
        licenseRole = next;
        renderHorizontalDock();
        return;
      }
      lockLicenseOnThisTab();
    });
  }

  function requireLicense(thenFn) {
    if (isLicensed()) {
      if (typeof thenFn === "function") thenFn();
      return;
    }
    openLicenseModal(thenFn);
  }

  function askReasonThenConfirm(code) {
    requireLicense(() => runAskReasonThenConfirm(code));
  }

  function runAskReasonThenConfirm(code) {
    if (String(code) === "KYC SWITCH") {
      askKycSwitchThenConfirm(code);
      return;
    }

    const info = getOptionReasons(code);
    if (info.reasons.length < 2) {
      openConfirmationModal(code, info.reasons[0]);
      return;
    }

    showChoicePopup(
      info.item.label || info.item.code || code,
      "Which reason?",
      info.reasons.map(reason => ({ label: reason, value: reason })),
      (reason) => {
        const idx = (info.reasons || []).findIndex((r) => String(r).trim() === String(reason || "").trim());
        const pair = idx >= 0 ? idx : 0;
        const noteIdx = (info.item.noteChoices && info.item.noteChoices[pair]) ? pair : 0;
        const zoomIdx = (info.item.zoomChoices && info.item.zoomChoices[pair]) ? pair : 0;
        openConfirmationModal(code, reason, noteIdx, zoomIdx);
      }
    );
  }

  /**
   * Confirmation Modal (Prevent accidental misclicks)
   * Uses whatever User ID is currently on screen for the active client.
   * Also provides an interactive User ID field so agents can verify or edit it.
   */
  function openConfirmationModal(code, preselectedReason, preselectedNoteChoice, preselectedZoomChoice) {
    if (activeModal) activeModal.remove();

    // Re-scrape player info dynamically from current screen
    detectedPlayer = scrapePlayerCredentials();
    updatePlayerStatusBadge();

    let activePlayer = detectedPlayer || {
      userId: "",
      targetId: "",
      numericId: "",
      publicId: "",
      userCombined: "",
      username: "N/A",
      affiliate: "N/A",
      createdDate: "",
      cid: "",
      name: "",
      dob: ""
    };
    if (!activePlayer.name || !activePlayer.dob) {
      const attrs = scrapeUserAttributes();
      if (!activePlayer.name && attrs.name) activePlayer.name = attrs.name;
      if (!activePlayer.dob && attrs.dob) activePlayer.dob = attrs.dob;
    }

    let enteredUserId = activePlayer.userCombined || activePlayer.userId || "";
    let enteredCid = (activePlayer.cid || scrapeCidFromUserNotes() || "").trim();
    let enteredVerifiedUid = "";
    let kycSibling = null;
    let kycOthers = [];

    const activeOptions = getActiveOptions();
    let item = activeOptions.find(o => o.code === code);
    if (!item) {
      const dict = window.EscalationDictionary || {};
      item = dict[code] || {
        code: code,
        label: code,
        meaning: code,
        defaultReason: "Escalation requested",
        reasons: ["Escalation requested"],
        color: "#2563eb"
      };
    }
    item = normalizeEscalationOption(item);
    item.reasons = resolveReasonsList(item);
    if (String(item.code) === "KYC SWITCH") {
      const preset = getKycSwitchPreset();
      if (preset.noteChoices && preset.noteChoices.length >= 2) item.noteChoices = preset.noteChoices;
      if (preset.zoomChoices && preset.zoomChoices.length >= 2) item.zoomChoices = preset.zoomChoices;
      if (preset.userNotesText) item.userNotesText = preset.userNotesText;
      if (preset.zoomText) item.zoomText = preset.zoomText;
    }

    const notePerson = scrapeNoteFillExtras(item.code);
    if (isBlankPersonValue(activePlayer.name) && notePerson.name) activePlayer.name = notePerson.name;
    if (isBlankPersonValue(activePlayer.dob) && notePerson.dob) activePlayer.dob = notePerson.dob;

    function formatNameDobSummary(name, dob) {
      const n = isBlankPersonValue(name) ? "" : String(name).trim();
      const d = isBlankPersonValue(dob) ? "" : String(dob).trim();
      if (!n && !d) return "—";
      return `${n || "—"}${d ? " / " + d : ""}`;
    }

    // Default reason configured for this option ("Reason when clicked")
    const configuredClickReason = (preselectedReason && String(preselectedReason).trim())
      || (item.reasons && item.reasons[0])
      || item.defaultReason
      || "Escalation requested";
    let selectedReason = configuredClickReason;
    const noteChoices = item.noteChoices || [{ label: "User Notes", userNotesText: getOptionUserNotesText(item, 0) }];
    const zoomChoices = item.zoomChoices || [{ label: "Zoom", zoomText: getOptionZoomText(item, 0) }];
    let selectedNoteChoice = Number.isFinite(preselectedNoteChoice) ? preselectedNoteChoice : parseInt(preselectedNoteChoice, 10);
    if (!Number.isFinite(selectedNoteChoice) || selectedNoteChoice < 0 || selectedNoteChoice >= noteChoices.length) selectedNoteChoice = 0;
    let selectedZoomChoice = Number.isFinite(preselectedZoomChoice) ? preselectedZoomChoice : parseInt(preselectedZoomChoice, 10);
    if (!Number.isFinite(selectedZoomChoice) || selectedZoomChoice < 0 || selectedZoomChoice >= zoomChoices.length) selectedZoomChoice = 0;

    function pickKycPersonFields(localName, localDob) {
      let name = isBlankPersonValue(localName) ? "" : String(localName || "").trim();
      let dob = isBlankPersonValue(localDob) ? "" : String(localDob || "").trim();
      if (name && dob) return { name, dob };
      const pool = [];
      if (kycSibling) pool.push(kycSibling);
      (kycOthers || []).forEach((row) => {
        if (row) pool.push(row);
      });
      const verified = pool.find((r) => isKycStatusVerified(r.kycVerified) && !isBlankPersonValue(r.name));
      const anyNamed = pool.find((r) => !isBlankPersonValue(r.name));
      const src = verified || anyNamed || null;
      if (!name && src && !isBlankPersonValue(src.name)) name = String(src.name).trim();
      if (!dob && src && !isBlankPersonValue(src.dob)) dob = String(src.dob).trim();
      return { name, dob };
    }

    function noteFillData(extra) {
      const currentInput = (enteredUserId || "").trim();
      const parsed = parseUserIdValue(currentInput);
      const effectiveUserId = (parsed && parsed.userId) || currentInput || activePlayer.userId || "";
      const finalCombined = (parsed && parsed.userCombined) || activePlayer.userCombined || currentInput || "";
      const cidVal = (enteredCid || activePlayer.cid || "").trim();
      const extras = scrapeNoteFillExtras(item.code);
      const person = String(item.code) === "KYC SWITCH"
        ? pickKycPersonFields(extras.name, extras.dob)
        : { name: extras.name || activePlayer.name || "", dob: extras.dob || activePlayer.dob || "" };
      if (String(item.code) === "KYC SWITCH") {
        person.dob = formatKycNoteDob(person.dob || "") || person.dob;
      }
      return Object.assign({
        code: item.code,
        label: item.label,
        meaning: item.meaning,
        userId: effectiveUserId,
        targetId: effectiveUserId,
        numericId: (parsed && parsed.numericId) || activePlayer.numericId || effectiveUserId,
        publicId: (parsed && parsed.publicId) || activePlayer.publicId || "",
        userCombined: finalCombined,
        username: activePlayer.username || "N/A",
        affiliate: activePlayer.affiliate || "N/A",
        createdDate: activePlayer.createdDate || "",
        agentName: currentSettings.agentName || "",
        reason: selectedReason,
        cid: cidVal,
        name: person.name,
        dob: person.dob,
        verifiedUid: enteredVerifiedUid || "",
        rejectedAccounts: extras.rejectedAccounts || "",
        noteDate: extras.noteDate || "",
        gLifeUserId: extras.gLifeUserId || "",
        age: ageFromDob(person.dob || "")
      }, extra || {});
    }

    function computeUserNotesText() {
      const extra = {};
      if (String(item.code) === "KYC SWITCH") {
        const extras = scrapeNoteFillExtras("KYC SWITCH");
        const person = pickKycPersonFields(extras.name, extras.dob);
        extra.name = person.name;
        extra.dob = formatKycNoteDob(person.dob || "");
        extra.age = ageFromDob(person.dob || extra.dob);
        extra.verifiedUid = kycPlainUid(enteredVerifiedUid || "");
        extra.newAccountUid = selectedNoteChoice === 1
          ? kycPlainUid(enteredVerifiedUid || (kycSibling && (kycSibling.publicId || kycSibling.userId)) || (kycOthers[0] && (kycOthers[0].publicId || kycOthers[0].userId)) || "")
          : kycPlainUid(enteredUserId || activePlayer.publicId || activePlayer.userId || "");
        if (selectedZoomChoice === 1 && kycOthers.length) {
          extra.verifiedUid = kycSlashDupUids(kycOthers, extra.verifiedUid);
        }
        return ensureKycNoteParens(safeRenderEscalationNote(getOptionUserNotesText(item, selectedNoteChoice), noteFillData(extra)), selectedNoteChoice);
      }
      return safeRenderEscalationNote(getOptionUserNotesText(item, selectedNoteChoice), noteFillData(extra));
    }

    function computeFinalNote() {
      const currentInput = (enteredUserId || "").trim();
      let finalCombined = "";
      let finalUserId = currentInput;

      const parsed = parseUserIdValue(currentInput);
      if (parsed && parsed.userCombined && parsed.numericId && parsed.publicId && parsed.numericId !== parsed.publicId) {
        finalCombined = parsed.userCombined;
        finalUserId = parsed.userId || parsed.publicId || currentInput;
      } else if (activePlayer && activePlayer.userCombined) {
        if (!currentInput || currentInput === activePlayer.userId || currentInput === activePlayer.publicId || currentInput === activePlayer.userCombined) {
          finalCombined = activePlayer.userCombined;
          finalUserId = activePlayer.userId || activePlayer.publicId || currentInput;
        } else if (activePlayer.numericId) {
          finalCombined = `${activePlayer.numericId} (${currentInput})`;
          finalUserId = currentInput;
        } else {
          finalCombined = currentInput;
        }
      } else {
        finalCombined = currentInput || "";
      }

      if (String(item.code) === "KYC SWITCH") {
        const kycId = finalCombined || currentInput || "";
        const kycExtra = {
          userId: kycId,
          targetId: kycId,
          userCombined: kycId,
          numericId: (parsed && parsed.numericId) || activePlayer.numericId || kycId,
          verifiedUid: kycPlainUid(enteredVerifiedUid)
        };
        const othersForZoom = selectedZoomChoice === 1
          ? (kycOthers || [])
          : (kycSibling ? [kycSibling] : ((kycOthers && kycOthers[0]) ? [kycOthers[0]] : []));
        kycExtra.rejectedAccounts = kycZoomAssessmentUserLines(
          kycId,
          othersForZoom,
          enteredVerifiedUid
        );
        return applyKycZoomTitle(
          stripZoomStampLines(safeRenderEscalationNote(getOptionZoomText(item, selectedZoomChoice), noteFillData(kycExtra))),
          selectedZoomChoice
        );
      }

      let finalZoom = stripZoomStampLines(safeRenderEscalationNote(getOptionZoomText(item, selectedZoomChoice), noteFillData({
        userId: finalUserId || finalCombined,
        targetId: finalUserId || finalCombined,
        userCombined: finalCombined,
        numericId: (parsed && parsed.numericId) || activePlayer.numericId || finalUserId
      })));
      if (String(item.code) === "REACT") finalZoom = stripEmptyDobZoomLine(finalZoom);
      return finalZoom;
    }

    const overlay = document.createElement("div");
    overlay.className = "esc-modal-overlay";
    overlay.id = "esc-confirm-overlay";

    // Build Reasons list with configured "Reason when clicked" as the default preselected option!
    const reasonList = (item.reasons && item.reasons.length) ? item.reasons : [configuredClickReason];
    const pickedReasonIndex = reasonList.findIndex((r) => String(r).trim() === String(configuredClickReason).trim());

    const hidePairedPickers = String(item.code) !== "KYC SWITCH";
    const showNotePicker = !hidePairedPickers && noteChoices.length > 1;
    const showZoomPicker = !hidePairedPickers && zoomChoices.length > 1;

    let notePickerHtml = "";
    if (showNotePicker) {
      const noteLabel = item.code === "KYC SWITCH" ? "New Verified or Old account:" : "Which User Notes:";
      notePickerHtml = `
          <div class="esc-form-row">
            <label class="esc-form-label" for="esc-note-choice">${noteLabel}</label>
            <select class="esc-select" id="esc-note-choice">
              ${noteChoices.map((c, i) => `<option value="${i}" ${i === selectedNoteChoice ? "selected" : ""}>${escapeHtml(c.label || "User Notes")}</option>`).join("")}
            </select>
          </div>`;
    }

    let kycVerifiedHtml = "";
    if (String(item.code) === "KYC SWITCH") {
      kycVerifiedHtml = `
          <div class="esc-form-row" id="esc-kyc-verified-row" style="background: #09111e; padding: 10px 12px; border-radius: 6px; border: 1px solid #1e293b;${selectedZoomChoice === 1 ? " display:none;" : ""}">
            <label class="esc-form-label" for="esc-modal-verified-uid" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <span><strong>Verified to rejected</strong> (from DUP / Old account):</span>
              <span id="esc-verified-status" style="font-size: 11px; font-weight: 500; color: ${enteredVerifiedUid ? '#34d399' : '#f59e0b'};">
                ${enteredVerifiedUid ? '✓ Other player tab (edit if needed)' : '⚠️ Paste the other User ID'}
              </span>
            </label>
            <input type="text" class="esc-input" id="esc-modal-verified-uid"
              value="${escapeHtml(enteredVerifiedUid)}"
              placeholder="Enter Verified User ID"
              style="font-family: monospace; font-size: 13.5px; font-weight: 700; color: #fde68a; background: #060c16; border-color: #ca8a04;">
          </div>`;
    }

    let zoomPickerHtml = "";
    if (showZoomPicker) {
      const zoomLabel = item.code === "KYC SWITCH" ? "2 accounts or 3 or more:" : "Which Zoom text to copy:";
      zoomPickerHtml = `
          <div class="esc-form-row">
            <label class="esc-form-label" for="esc-zoom-choice">${zoomLabel}</label>
            <select class="esc-select" id="esc-zoom-choice">
              ${zoomChoices.map((c, i) => `<option value="${i}" ${i === selectedZoomChoice ? "selected" : ""}>${escapeHtml(c.label || "Zoom")}</option>`).join("")}
            </select>
          </div>`;
    }

    const isKycSwitch = String(item.code) === "KYC SWITCH";
    const hideUserNotesPreview = !String(computeUserNotesText() || "").trim();
    const needsCid = isCidRequired(item.code);
    const cidFieldHtml = needsCid ? `
          <div class="esc-form-row" style="background: #09111e; padding: 10px 12px; border-radius: 6px; border: 1px solid #1e293b;">
            <label class="esc-form-label" for="esc-modal-cid" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <span><strong>Player CID</strong> (from User Notes):</span>
              <span id="esc-cid-status" style="font-size: 11px; font-weight: 500; color: ${enteredCid ? '#34d399' : '#f59e0b'};">
                ${enteredCid ? '✓ Taken from existing User Notes (edit if needed)' : '⚠️ No CID in User Notes yet — type it once'}
              </span>
            </label>
            <input type="text" class="esc-input" id="esc-modal-cid"
              value="${escapeHtml(enteredCid)}"
              placeholder="Player CID"
              style="font-family: monospace; font-size: 13.5px; font-weight: 700; color: #a7f3d0; background: #060c16; border-color: #0d9488;">
          </div>` : "";
    const cidSummaryHtml = isKycSwitch ? `
            <div class="esc-summary-item">
              <span>Verified UID:</span>
              <span id="esc-summary-display-verified" style="font-weight:700; color:#fde68a;">${escapeHtml(enteredVerifiedUid || '(Not entered)')}</span>
            </div>` : (needsCid ? `
            <div class="esc-summary-item">
              <span>CID:</span>
              <span id="esc-summary-display-cid" style="font-weight:700; color:#a7f3d0;">${escapeHtml(enteredCid || '(Not entered)')}</span>
            </div>` : "");

    overlay.innerHTML = `
      <div class="esc-popover-backdrop" aria-hidden="true"></div>
      <div class="esc-modal esc-confirm-modal" role="dialog" aria-modal="true" aria-label="Confirm Escalation">
        <div class="esc-modal-header">
          <div class="esc-modal-title">
            ${JET_LOGO_URL ? `<img class="esc-brand-logo" src="${JET_LOGO_URL}" alt="JET" style="width:18px;height:18px;">` : ""}
            <span>Confirm Escalation</span>
            <span class="esc-modal-badge" style="background-color: ${item.color}">${escapeHtml(item.label || item.code)}</span>
          </div>
          <button type="button" class="esc-icon-btn" id="esc-modal-close" title="Close (Esc)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div class="esc-modal-body">
          <div class="esc-form-row" style="background: #09111e; padding: 10px 12px; border-radius: 6px; border: 1px solid #1e293b;">
            <label class="esc-form-label" for="esc-modal-user-id" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <span><strong>Client User ID</strong> (used in escalation note):</span>
              <span id="esc-user-id-status" style="font-size: 11px; font-weight: 500; color: ${activePlayer.userId ? '#34d399' : '#f59e0b'};">
                ${activePlayer.userId ? '✓ Scraped from screen (edit if needed)' : '⚠️ Enter or paste client User ID below'}
              </span>
            </label>
            <input type="text" class="esc-input" id="esc-modal-user-id" 
              value="${escapeHtml(enteredUserId)}" 
              placeholder="Enter Client User ID"
              style="font-family: monospace; font-size: 13.5px; font-weight: 700; color: #38bdf8; background: #060c16; border-color: #2563eb;">
          </div>

          ${cidFieldHtml}

          ${kycVerifiedHtml}

          <div class="esc-player-summary">
            <div class="esc-summary-item">
              <span>Category:</span>
              <span>${escapeHtml(item.meaning || item.label || item.code)}</span>
            </div>
            <div class="esc-summary-item">
              <span>Target User ID:</span>
              <span id="esc-summary-display-id" style="font-weight:700; color:#38bdf8;">${escapeHtml(enteredUserId || '(Not entered)')}</span>
            </div>
            ${cidSummaryHtml}
            <div class="esc-summary-item">
              <span>Affiliate:</span>
              <span>${escapeHtml(activePlayer.affiliate || 'N/A')}</span>
            </div>
            <div class="esc-summary-item">
              <span>Agent Name:</span>
              <span>${escapeHtml(currentSettings.agentName || "—")}</span>
            </div>
            <div class="esc-summary-item">
              <span>Name / DOB:</span>
              <span id="esc-summary-display-namedob">${escapeHtml(formatNameDobSummary(activePlayer.name, activePlayer.dob))}</span>
            </div>
          </div>

          ${notePickerHtml}
          ${zoomPickerHtml}

          ${hideUserNotesPreview ? "" : `
          <div class="esc-form-row">
            <label class="esc-form-label" style="display: flex; justify-content: space-between; align-items: center;">
              <span>1. In-Page User Notes (Injected via <strong>+</strong> in User Notes):</span>
              <span style="font-size: 11px; color: #38bdf8; font-weight: 600;">User Notes text for this button</span>
            </label>
            <div class="esc-preview-box" id="esc-preview-usernote" style="font-weight: 700; color: #38bdf8; padding: 8px 10px;">${escapeHtml(computeUserNotesText())}</div>
          </div>`}

          <div class="esc-form-row">
            <label class="esc-form-label" style="display: flex; justify-content: space-between; align-items: center;">
              <span>${hideUserNotesPreview ? "Final Escalation Note (Copied to Clipboard for Zoom):" : "2. Final Escalation Note (Copied to Clipboard for Zoom):"}</span>
              <span style="font-size: 11px; color: #34d399; font-weight: 600;">Zoom Tracker Output</span>
            </label>
            <pre class="esc-preview-box" id="esc-preview-final" style="white-space: pre-wrap; line-height: 1.45; color: #f1f5f9; padding: 9px 10px; margin: 0; font-family: monospace; font-size: 12.5px;">${escapeHtml(computeFinalNote())}</pre>
          </div>
        </div>

        <div class="esc-modal-footer">
          <button type="button" class="esc-btn-secondary" id="esc-btn-cancel">Cancel</button>
          <button type="button" class="esc-btn-primary" id="esc-btn-confirm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            Confirm & Execute
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    activeModal = overlay;
    playModalOpen(overlay);

    const userIdInput = overlay.querySelector("#esc-modal-user-id");
    const cidInput = overlay.querySelector("#esc-modal-cid");
    const verifiedUidInput = overlay.querySelector("#esc-modal-verified-uid");
    const verifiedStatus = overlay.querySelector("#esc-verified-status");
    const kycVerifiedRow = overlay.querySelector("#esc-kyc-verified-row");
    const summaryDisplayId = overlay.querySelector("#esc-summary-display-id");
    const summaryDisplayCid = overlay.querySelector("#esc-summary-display-cid");
    const summaryDisplayVerified = overlay.querySelector("#esc-summary-display-verified");
    const summaryDisplayNameDob = overlay.querySelector("#esc-summary-display-namedob");
    const userIdStatus = overlay.querySelector("#esc-user-id-status");
    const cidStatus = overlay.querySelector("#esc-cid-status");
    const reasonSelect = overlay.querySelector("#esc-reason-select");
    const customReasonInput = overlay.querySelector("#esc-custom-reason");
    const noteChoiceSelect = overlay.querySelector("#esc-note-choice");
    const zoomChoiceSelect = overlay.querySelector("#esc-zoom-choice");
    const previewUserNote = overlay.querySelector("#esc-preview-usernote");
    const previewFinal = overlay.querySelector("#esc-preview-final");

    function applyReasonFromSelect() {
      if (!reasonSelect) return;
      if (reasonSelect.value === "__CUSTOM__") {
        if (customReasonInput) customReasonInput.style.display = "block";
        selectedReason = (customReasonInput && customReasonInput.value.trim()) || "Escalation requested";
        return;
      }
      if (customReasonInput) customReasonInput.style.display = "none";
      const idx = parseInt(reasonSelect.value, 10);
      if (Number.isFinite(idx) && reasonList[idx]) selectedReason = reasonList[idx];
    }

    selectedReason = configuredClickReason;
    if (reasonSelect) {
      const want = pickedReasonIndex;
      if (want >= 0) {
        reasonSelect.value = String(want);
      } else if (configuredClickReason) {
        reasonSelect.value = "__CUSTOM__";
        if (customReasonInput) {
          customReasonInput.style.display = "block";
          customReasonInput.value = configuredClickReason;
        }
      }
    }

    function applyKycSiblingPrefill() {
      if (selectedZoomChoice === 1) {
        const firstOther = kycOthers[0] && kycPlainUid(kycOthers[0].publicId || kycOthers[0].userId);
        if (firstOther) enteredVerifiedUid = firstOther;
        return;
      }
      if (!verifiedUidInput) return;
      if (!kycSibling) return;
      const uid = kycPlainUid(kycSibling.publicId || kycSibling.userId);
      if (!uid) return;
      if (String(verifiedUidInput.value || "").trim()) return;
      verifiedUidInput.value = uid;
    }

    function updatePreview() {
      enteredUserId = userIdInput.value.trim();
      enteredCid = cidInput ? cidInput.value.trim() : enteredCid;
      if (noteChoiceSelect) selectedNoteChoice = parseInt(noteChoiceSelect.value, 10) || 0;
      if (zoomChoiceSelect) selectedZoomChoice = parseInt(zoomChoiceSelect.value, 10) || 0;
      if (kycVerifiedRow) kycVerifiedRow.style.display = selectedZoomChoice === 1 ? "none" : "";
      applyKycSiblingPrefill();
      if (selectedZoomChoice !== 1 && verifiedUidInput) enteredVerifiedUid = verifiedUidInput.value.trim();
      if (verifiedStatus) {
        if (enteredVerifiedUid) {
          const fromTabs = (selectedZoomChoice === 0 && kycSibling)
            || (selectedZoomChoice === 1 && kycOthers.length);
          verifiedStatus.textContent = fromTabs
            ? "✓ From the other player tab (edit if needed)"
            : "✓ Verified UID ready";
          verifiedStatus.style.color = "#34d399";
        } else {
          verifiedStatus.textContent = "⚠️ Paste the other User ID";
          verifiedStatus.style.color = "#f59e0b";
        }
      }
      if (summaryDisplayId) {
        summaryDisplayId.textContent = enteredUserId || "(Not entered)";
      }
      if (summaryDisplayCid) {
        summaryDisplayCid.textContent = enteredCid || "(Not entered)";
      }
      if (summaryDisplayVerified) {
        const slashUids = selectedZoomChoice === 1 && kycOthers.length
          ? kycSlashDupUids(kycOthers, enteredVerifiedUid)
          : "";
        summaryDisplayVerified.textContent = slashUids || enteredVerifiedUid || "(Not entered)";
      }
      if (summaryDisplayNameDob) {
        const extras = scrapeNoteFillExtras(item.code);
        const person = String(item.code) === "KYC SWITCH"
          ? pickKycPersonFields(extras.name, extras.dob)
          : { name: extras.name || activePlayer.name || "", dob: extras.dob || activePlayer.dob || "" };
        summaryDisplayNameDob.textContent = formatNameDobSummary(person.name, person.dob);
      }
      if (cidStatus) {
        if (enteredCid) {
          cidStatus.textContent = "✓ CID ready";
          cidStatus.style.color = "#34d399";
        } else {
          cidStatus.textContent = "⚠️ No CID in User Notes yet — type it once";
          cidStatus.style.color = "#f59e0b";
        }
      }
      if (userIdStatus) {
        if (enteredUserId) {
          userIdStatus.textContent = "✓ User ID ready";
          userIdStatus.style.color = "#34d399";
        } else {
          userIdStatus.textContent = "⚠️ Enter or paste client User ID below";
          userIdStatus.style.color = "#f59e0b";
        }
      }

      if (reasonSelect) applyReasonFromSelect();
      const liveUserNote = computeUserNotesText();
      if (previewUserNote) previewUserNote.textContent = liveUserNote;
      previewFinal.textContent = computeFinalNote();
    }

    let previewDebounceTimer = null;
    const debouncedUpdatePreview = () => {
      if (previewDebounceTimer) clearTimeout(previewDebounceTimer);
      previewDebounceTimer = setTimeout(updatePreview, 60);
    };

    userIdInput.addEventListener("input", debouncedUpdatePreview);
    if (cidInput) cidInput.addEventListener("input", debouncedUpdatePreview);
    if (verifiedUidInput) verifiedUidInput.addEventListener("input", debouncedUpdatePreview);
    if (reasonSelect) reasonSelect.addEventListener("change", () => {
      applyReasonFromSelect();
      if (reasonSelect.value !== "__CUSTOM__") {
        const idx = parseInt(reasonSelect.value, 10);
        if (Number.isFinite(idx)) {
          if (noteChoiceSelect && noteChoices[idx]) {
            noteChoiceSelect.value = String(idx);
            selectedNoteChoice = idx;
          }
          if (zoomChoiceSelect && zoomChoices[idx]) {
            zoomChoiceSelect.value = String(idx);
            selectedZoomChoice = idx;
          }
        }
      }
      updatePreview();
    });
    if (customReasonInput) customReasonInput.addEventListener("input", debouncedUpdatePreview);
    if (noteChoiceSelect) noteChoiceSelect.addEventListener("change", updatePreview);
    if (zoomChoiceSelect) zoomChoiceSelect.addEventListener("change", updatePreview);

    if (String(item.code) === "KYC SWITCH") {
      requestKycOthers(activePlayer.publicId || activePlayer.userId || enteredUserId, (found) => {
        kycOthers = found.others || [];
        kycSibling = found.sibling || null;
        updatePreview();
      });
    }

    updatePreview();

    const closeModal = () => {
      document.removeEventListener("keydown", keyHandler);
      closeOverlayZoom(overlay);
    };

    const keyHandler = (e) => {
      if (e.key === "Escape") closeModal();
      if (e.key === "Enter" && !e.shiftKey) {
        const tag = (e.target && e.target.tagName) || "";
        const id = (e.target && e.target.id) || "";
        if (tag === "TEXTAREA" || tag === "INPUT" || id === "esc-modal-user-id" || id === "esc-modal-cid" || id === "esc-modal-verified-uid" || id === "esc-custom-reason") {
          return;
        }
        e.preventDefault();
        executeEscalation();
      }
    };
    document.addEventListener("keydown", keyHandler);

    overlay.querySelector("#esc-modal-close").addEventListener("click", closeModal);
    overlay.querySelector("#esc-btn-cancel").addEventListener("click", closeModal);

    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeModal();
    });

    const executeEscalation = () => {
      const currentId = userIdInput.value.trim();
      enteredCid = cidInput ? cidInput.value.trim() : enteredCid;

      if (needsCid && !enteredCid) {
        showToast("Player CID is required. Type it before Confirm & Execute.", false);
        if (cidInput) cidInput.focus();
        return;
      }

      if (!currentId) {
        const hasConfirm = typeof window !== "undefined" && typeof window.confirm === "function";
        if (hasConfirm && !window.confirm("No User ID was specified. Do you want to proceed anyway with '[User ID]' in the note?")) {
          userIdInput.focus();
          return;
        }
      }

      if (currentId) {
        if (!detectedPlayer) detectedPlayer = {};
        const parsed = parseUserIdValue(currentId);
        if (parsed) {
          detectedPlayer.userId = parsed.userId;
          detectedPlayer.targetId = parsed.targetId;
          detectedPlayer.publicId = parsed.publicId;
          detectedPlayer.numericId = parsed.numericId;
          detectedPlayer.userCombined = parsed.userCombined;
        } else {
          detectedPlayer.userId = currentId;
          detectedPlayer.targetId = currentId;
          if (!detectedPlayer.userCombined) detectedPlayer.userCombined = currentId;
        }
        if (enteredCid) detectedPlayer.cid = enteredCid;
        updatePlayerStatusBadge();
      }

      if (noteChoiceSelect) selectedNoteChoice = parseInt(noteChoiceSelect.value, 10) || 0;
      if (zoomChoiceSelect) selectedZoomChoice = parseInt(zoomChoiceSelect.value, 10) || 0;
      applyReasonFromSelect();
      enteredUserId = userIdInput.value.trim();
      if (selectedZoomChoice !== 1 && verifiedUidInput) enteredVerifiedUid = verifiedUidInput.value.trim();

      const finishExecute = (found) => {
        if (found) {
          kycOthers = found.others || [];
          kycSibling = found.sibling || null;
        }
        if (selectedZoomChoice === 1 && kycOthers[0]) {
          enteredVerifiedUid = kycPlainUid(kycOthers[0].publicId || kycOthers[0].userId);
        }

        const userNoteToInject = computeUserNotesText();
        const finalNoteForZoom = computeFinalNote();
        appendEscalationAudit({
          at: Date.now(),
          userId: kycPlainUid(enteredUserId || activePlayer.userId || activePlayer.publicId || ""),
          userCombined: enteredUserId || activePlayer.userCombined || "",
          code: item.code || "",
          reason: selectedReason || "",
          userNotes: userNoteToInject || "",
          zoom: finalNoteForZoom || ""
        });
        const shouldPin = currentSettings.autoPinNote !== false;
        const shouldCopy = currentSettings.autoCopyClipboard !== false;
        const shouldZoom = currentSettings.autoOpenZoom !== false;
        const shouldReturn = isAdminLicense() && currentSettings.autoReturnToUsers !== false;
        const newUidForOldTab = kycPlainUid(enteredUserId || activePlayer.publicId || activePlayer.userId || "");
        const isKycNewVerified = String(item.code) === "KYC SWITCH" && selectedNoteChoice === 0 && shouldPin;
        const pairTwo = isKycNewVerified && selectedZoomChoice === 0 && kycSibling && kycSibling.tabId;
        const pairMany = isKycNewVerified && selectedZoomChoice === 1 && kycOthers.length > 0;
        const injectTabIds = pairTwo
          ? [kycSibling.tabId]
          : (pairMany ? kycOthers.map((row) => row && row.tabId).filter(Boolean) : []);

        const nav = (typeof navigator !== "undefined") ? navigator : (typeof window !== "undefined" ? window.navigator : null);
        if (shouldCopy && nav && nav.clipboard && nav.clipboard.writeText) {
          nav.clipboard.writeText(finalNoteForZoom).catch(err => {
            console.warn("Clipboard copy fallback:", err);
          });
        }

        if (shouldPin) {
          injectUserNoteOnPage(userNoteToInject, (injected) => {
            if (injected) {
              showToast(injectTabIds.length
                ? (injectTabIds.length === 1
                  ? "User Notes set here. Old account note filled in the other tab — pin it there."
                  : "User Notes set here. Old account notes filled in the other tabs — pin them there.")
                : "Copied to clipboard successfully!", true, finalNoteForZoom);
            } else {
              showToast("Copied to clipboard for Zoom (User Notes box not found)", false, finalNoteForZoom);
            }
          });
        } else {
          showToast("Copied to clipboard successfully!", true, finalNoteForZoom);
        }

        if (shouldZoom) {
          launchZoomApp(currentSettings.zoomUrl);
        }

        closeModal();

        if (injectTabIds.length && newUidForOldTab && typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.sendMessage) {
          chrome.runtime.sendMessage({
            action: "KYC_INJECT_OLD_NOTES",
            targetTabIds: injectTabIds,
            newAccountUid: newUidForOldTab
          });
        } else if (shouldReturn) {
          returnToUsersList();
        }
      };

      if (String(item.code) === "KYC SWITCH" && selectedNoteChoice === 0) {
        requestKycOthers(enteredUserId || activePlayer.publicId || activePlayer.userId || "", finishExecute);
      } else {
        finishExecute();
      }
    };

    overlay.querySelector("#esc-btn-confirm").addEventListener("click", executeEscalation);
  }

  function formatAuditTime(at) {
    const d = new Date(Number(at) || Date.now());
    if (isNaN(d.getTime())) return "";
    return d.toLocaleString();
  }

  function openAuditModal() {
    const existing = document.getElementById("esc-audit-overlay");
    if (existing) existing.remove();

    loadEscalationAudit((all) => {
      const rows = Array.isArray(all) ? all : [];
      const overlay = document.createElement("div");
      overlay.className = "esc-modal-overlay";
      overlay.id = "esc-audit-overlay";
      const items = rows.length
        ? rows.map((row, i) => `
            <article class="esc-audit-item" data-audit-index="${i}" role="button" tabindex="0">
              <div class="esc-audit-summary">
                <span class="esc-audit-uid">${escapeHtml(row.userCombined || row.userId || "—")}</span>
                <span class="esc-audit-process">${escapeHtml(row.code || "")}</span>
                <span class="esc-audit-time">${escapeHtml(formatAuditTime(row.at))}</span>
              </div>
              <div class="esc-audit-full" hidden>
                ${row.reason ? `<div class="esc-audit-reason">Reason: ${escapeHtml(row.reason)}</div>` : ""}
                ${row.userNotes ? `<pre class="esc-audit-notes">${escapeHtml(row.userNotes)}</pre>` : ""}
                ${row.zoom ? `<pre class="esc-audit-zoom">${escapeHtml(row.zoom)}</pre>` : ""}
              </div>
            </article>`).join("")
        : `<p class="esc-audit-empty">No Confirm &amp; Execute yet.</p>`;

      overlay.innerHTML = `
        <div class="esc-popover-backdrop" aria-hidden="true"></div>
        <div class="esc-modal esc-audit-modal" role="dialog" aria-modal="true" aria-label="Audit">
          <div class="esc-modal-header">
            <div class="esc-modal-title">
              <span>Audit</span>
              <span class="esc-modal-badge">All processes</span>
            </div>
            <button type="button" class="esc-icon-btn" id="esc-audit-close" title="Close (Esc)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          <div class="esc-modal-body esc-audit-list">${items}</div>
        </div>`;

      document.body.appendChild(overlay);
      playModalOpen(overlay);

      overlay.querySelectorAll(".esc-audit-item").forEach((item) => {
        const toggle = () => {
          const wasOpen = item.classList.contains("is-open");
          overlay.querySelectorAll(".esc-audit-item.is-open").forEach((openItem) => {
            openItem.classList.remove("is-open");
            const full = openItem.querySelector(".esc-audit-full");
            if (full) full.hidden = true;
          });
          if (!wasOpen) {
            item.classList.add("is-open");
            const full = item.querySelector(".esc-audit-full");
            if (full) full.hidden = false;
          }
        };
        item.addEventListener("click", toggle);
        item.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            toggle();
          }
        });
      });

      const closeAudit = () => closeOverlayZoom(overlay);
      overlay.querySelector("#esc-audit-close").addEventListener("click", closeAudit);
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) closeAudit();
      });
      const auditKey = (e) => {
        if (e.key === "Escape") {
          e.stopPropagation();
          document.removeEventListener("keydown", auditKey, true);
          closeAudit();
        }
      };
      document.addEventListener("keydown", auditKey, true);
    });
  }

  /**
   * In-Page Settings Modal (triggered from gear icon on the bar)
   * Includes full Add Option, Remove Option, and "Reason when clicked" customization.
   */
  function openSettingsModal() {
    requireLicense(() => runOpenSettingsModal());
  }

  function runOpenSettingsModal() {
    if (activeModal) activeModal.remove();

    let workingOptions = JSON.parse(JSON.stringify(getActiveOptions()));
    const staffView = !isAdminLicense();

    const overlay = document.createElement("div");
    overlay.className = "esc-modal-overlay";
    overlay.id = "esc-settings-overlay";

    overlay.innerHTML = `
      <div class="esc-modal esc-settings-modal" role="dialog" aria-modal="true" aria-label="Settings">
        <div class="esc-modal-header">
          <div class="esc-modal-title">
            ${JET_LOGO_URL ? `<img class="esc-brand-logo" src="${JET_LOGO_URL}" alt="JET" style="width:20px;height:20px;">` : ""}
            <span>Settings</span>
          </div>
          <button type="button" class="esc-icon-btn" id="esc-settings-close" title="Close (Esc)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div class="esc-settings-body">
          <div class="esc-settings-main">
          <p class="esc-settings-intro">${staffView ? "Factory 14 buttons. View only. Change Defaults on the right." : "Each row stays one line. Edit opens User Notes, Zoom, and Reasons. First reason is the default."}</p>
          <div class="esc-options-mgr-header">
            <span class="esc-options-count-badge" id="esc-options-count-badge"></span>
            ${staffView ? "" : `
            <div class="esc-options-mgr-actions">
              <button type="button" class="esc-btn-small" id="esc-add-toggle">+ Add a button</button>
              <button type="button" class="esc-btn-small esc-btn-danger-outline" id="esc-btn-restore-presets">Restore 14 Presets</button>
            </div>`}
          </div>
          <div class="esc-options-cards-list" id="esc-options-cards-list"></div>

          </div>
          <div class="esc-settings-defaults">
            <div class="esc-form-row">
              <label class="esc-form-label" for="esc-set-agent">Agent name</label>
              <input type="text" class="esc-input" id="esc-set-agent" value="${escapeHtml(currentSettings.agentName || "")}" placeholder="Agent name">
            </div>
            <div class="esc-form-row">
              <label class="esc-form-label" for="esc-set-zoom-url">Zoom URL</label>
              <input type="text" class="esc-input" id="esc-set-zoom-url" value="${escapeHtml(currentSettings.zoomUrl || "zoomus://")}" placeholder="zoomus://">
            </div>
            <div class="esc-form-row">
              <span class="esc-form-label">Bar layout</span>
              <div class="esc-layout-toggle">
                <label class="esc-layout-choice">
                  <input type="radio" name="esc-bar-layout" value="horizontal" ${currentSettings.barLayout !== "vertical" ? "checked" : ""}>
                  <span>Horizontal</span>
                </label>
                <label class="esc-layout-choice">
                  <input type="radio" name="esc-bar-layout" value="vertical" ${currentSettings.barLayout === "vertical" ? "checked" : ""}>
                  <span>Vertical</span>
                </label>
              </div>
            </div>
            <label class="esc-checkbox-label">
              <input type="checkbox" id="esc-set-open-zoom" ${currentSettings.autoOpenZoom !== false ? "checked" : ""}>
              <span>Open Zoom on Confirm &amp; Execute</span>
            </label>
            <label class="esc-checkbox-label">
              <input type="checkbox" id="esc-set-pin-note" ${currentSettings.autoPinNote !== false ? "checked" : ""}>
              <span>Insert User Notes on Confirm</span>
            </label>
            <label class="esc-checkbox-label">
              <input type="checkbox" id="esc-set-copy" ${currentSettings.autoCopyClipboard !== false ? "checked" : ""}>
              <span>Copy Zoom text to clipboard</span>
            </label>
            ${staffView ? "" : `
            <label class="esc-checkbox-label">
              <input type="checkbox" id="esc-set-return" ${currentSettings.autoReturnToUsers !== false ? "checked" : ""}>
              <span>Return to Users list</span>
            </label>
            `}
            <button type="button" class="esc-btn-small esc-btn-audit" id="esc-btn-audit">Audit</button>
          </div>
        </div>

        <div class="esc-modal-footer">
          <div class="esc-settings-footer-left">
            ${staffView ? `
            <button type="button" class="esc-btn-secondary" id="esc-settings-import">Import</button>
            <input type="file" id="esc-settings-import-file" accept=".json,application/json" hidden>
            ` : `
            <button type="button" class="esc-btn-secondary" id="esc-settings-export">Export</button>
            <button type="button" class="esc-btn-secondary" id="esc-settings-import">Import</button>
            <input type="file" id="esc-settings-import-file" accept=".json,application/json" hidden>
            `}
            <button type="button" class="esc-btn-secondary" id="esc-settings-signout">Sign out</button>
          </div>
          <div class="esc-settings-footer-right">
            <button type="button" class="esc-btn-secondary" id="esc-settings-cancel">Cancel</button>
            <button type="button" class="esc-btn-primary" id="esc-settings-save">Save Changes</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    activeModal = overlay;
    playModalOpen(overlay);

    function insertChipsHtml(targetId) {
      return `
                <div class="esc-insert-chips" data-target="${targetId}">
                  <span class="esc-insert-hint">Insert:</span>
                  <button type="button" class="esc-insert-chip" data-insert="[User ID]">Insert User ID</button>
                  <button type="button" class="esc-insert-chip" data-insert="[CID]">Insert CID</button>
                  <button type="button" class="esc-insert-chip" data-insert="[Reason]">Insert Reason</button>
                  <button type="button" class="esc-insert-chip" data-insert="[Name]">Insert Name</button>
                  <button type="button" class="esc-insert-chip" data-insert="[DOB]">Insert DOB</button>
                  <button type="button" class="esc-insert-chip" data-insert="[AGE]">Insert Age</button>
                  <button type="button" class="esc-insert-chip" data-insert="[GLife ID]">Insert GLife ID</button>
                </div>`;
    }

    function insertAtCursor(el, text) {
      if (!el || !text) return;
      const start = typeof el.selectionStart === "number" ? el.selectionStart : String(el.value || "").length;
      const end = typeof el.selectionEnd === "number" ? el.selectionEnd : start;
      const value = String(el.value || "");
      el.value = value.slice(0, start) + text + value.slice(end);
      const pos = start + text.length;
      el.focus();
      try {
        el.setSelectionRange(pos, pos);
      } catch (err) {
        /* ignore */
      }
      el.dispatchEvent(new Event("input", { bubbles: true }));
    }

    function openAddOptionModal() {
      if (!isAdminLicense()) return;
      const existing = document.getElementById("esc-add-option-overlay");
      if (existing) {
        if (typeof existing._escClose === "function") existing._escClose();
        else existing.remove();
      }

      const addOverlay = document.createElement("div");
      addOverlay.className = "esc-modal-overlay";
      addOverlay.id = "esc-add-option-overlay";
      addOverlay.innerHTML = `
        <div class="esc-popover-backdrop" aria-hidden="true"></div>
        <div class="esc-modal esc-edit-option-modal" role="dialog" aria-modal="true" aria-label="Add a button">
          <div class="esc-modal-header">
            <div class="esc-modal-title"><span>Add a button</span></div>
            <button type="button" class="esc-icon-btn" id="esc-add-option-close" title="Close (Esc)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          <div class="esc-modal-body esc-edit-option-body">
            <div class="esc-form-row">
              <label class="esc-form-label" for="esc-add-code">Button name</label>
              <input type="text" class="esc-input" id="esc-add-code" placeholder="e.g. UA WO/FUNDS">
            </div>
            <p class="esc-add-fields-hint">Choose which fields this button has:</p>
            <div class="esc-add-field-picks">
              <label class="esc-checkbox-label">
                <input type="checkbox" id="esc-add-field-reason" checked>
                <span>Reason</span>
              </label>
              <label class="esc-checkbox-label">
                <input type="checkbox" id="esc-add-field-notes" checked>
                <span>User Notes</span>
              </label>
              <label class="esc-checkbox-label">
                <input type="checkbox" id="esc-add-field-zoom" checked>
                <span>Zoom copy</span>
              </label>
            </div>
            <div class="esc-form-row" id="esc-add-reason-wrap">
              <label class="esc-form-label">Reasons (first is default)</label>
              <div class="esc-reason-list" id="esc-add-reasons-wrap"></div>
              <button type="button" class="esc-btn-tiny" id="esc-add-reason-row-btn">+ Add reason</button>
            </div>
            <div class="esc-form-row" id="esc-add-notes-wrap">
              <label class="esc-form-label" for="esc-add-usernotes">User Notes</label>
              <textarea class="esc-input esc-plain-textarea" id="esc-add-usernotes" rows="3"></textarea>
              ${insertChipsHtml("esc-add-usernotes")}
            </div>
            <div class="esc-form-row" id="esc-add-zoom-wrap">
              <label class="esc-form-label" for="esc-add-zoomtext">Zoom copy</label>
              <textarea class="esc-input esc-plain-textarea" id="esc-add-zoomtext" rows="5"></textarea>
              ${insertChipsHtml("esc-add-zoomtext")}
            </div>
          </div>
          <div class="esc-modal-footer">
            <button type="button" class="esc-btn-secondary" id="esc-add-option-cancel">Cancel</button>
            <button type="button" class="esc-btn-primary" id="esc-btn-add-option-submit">Add to bar</button>
          </div>
        </div>`;

      document.body.appendChild(addOverlay);
      playModalOpen(addOverlay);

      const codeInput = addOverlay.querySelector("#esc-add-code");
      const userNotesAddInput = addOverlay.querySelector("#esc-add-usernotes");
      const zoomAddInput = addOverlay.querySelector("#esc-add-zoomtext");
      const addFieldReason = addOverlay.querySelector("#esc-add-field-reason");
      const addFieldNotes = addOverlay.querySelector("#esc-add-field-notes");
      const addFieldZoom = addOverlay.querySelector("#esc-add-field-zoom");
      const addReasonWrap = addOverlay.querySelector("#esc-add-reason-wrap");
      const addReasonsList = addOverlay.querySelector("#esc-add-reasons-wrap");
      const addReasonRowBtn = addOverlay.querySelector("#esc-add-reason-row-btn");
      const addNotesWrap = addOverlay.querySelector("#esc-add-notes-wrap");
      const addZoomWrap = addOverlay.querySelector("#esc-add-zoom-wrap");

      function addReasonRowHtml(value, index) {
        return `
                  <div class="esc-reason-row">
                    <input type="text" class="esc-input esc-add-reason-row" placeholder="Reason" value="${escapeHtml(value || "")}">
                    ${index > 0 ? `<button type="button" class="esc-btn-tiny esc-btn-remove-add-reason" data-reason-index="${index}">Remove</button>` : ""}
                  </div>`;
      }

      function collectAddReasons(keepEmpty) {
        const rows = addOverlay.querySelectorAll(".esc-add-reason-row");
        const mapped = Array.from(rows).map((inp) => inp.value);
        return keepEmpty ? mapped : mapped.map((r) => r.trim()).filter(Boolean);
      }

      function renderAddReasonRows(values) {
        if (!addReasonsList) return;
        const list = values && values.length ? values : [""];
        addReasonsList.innerHTML = list.map((value, index) => addReasonRowHtml(value, index)).join("");
        addReasonsList.querySelectorAll(".esc-btn-remove-add-reason").forEach((btn) => {
          btn.addEventListener("click", () => {
            const ri = parseInt(btn.getAttribute("data-reason-index"), 10);
            const next = collectAddReasons(true);
            next.splice(ri, 1);
            renderAddReasonRows(next.length ? next : [""]);
          });
        });
      }

      function syncAddFieldEditors() {
        if (addReasonWrap) addReasonWrap.style.display = addFieldReason && addFieldReason.checked ? "" : "none";
        if (addNotesWrap) addNotesWrap.style.display = addFieldNotes && addFieldNotes.checked ? "" : "none";
        if (addZoomWrap) addZoomWrap.style.display = addFieldZoom && addFieldZoom.checked ? "" : "none";
      }

      renderAddReasonRows([""]);
      if (addReasonRowBtn) {
        addReasonRowBtn.addEventListener("click", () => {
          const next = collectAddReasons(true);
          next.push("");
          renderAddReasonRows(next);
        });
      }
      syncAddFieldEditors();
      [addFieldReason, addFieldNotes, addFieldZoom].forEach((box) => {
        if (box) box.addEventListener("change", syncAddFieldEditors);
      });

      addOverlay.addEventListener("click", (e) => {
        const chip = e.target.closest(".esc-insert-chip");
        if (!chip || !addOverlay.contains(chip)) return;
        e.preventDefault();
        const wrap = chip.closest(".esc-insert-chips");
        const targetId = wrap && wrap.getAttribute("data-target");
        if (!targetId) return;
        const field = addOverlay.querySelector("#" + targetId);
        insertAtCursor(field, chip.getAttribute("data-insert") || "");
      });

      const addKey = (e) => {
        if (e.key !== "Escape") return;
        e.stopPropagation();
        closeAdd();
      };
      const closeAdd = () => {
        document.removeEventListener("keydown", addKey, true);
        closeOverlayZoom(addOverlay);
      };
      addOverlay._escClose = closeAdd;
      addOverlay.querySelector("#esc-add-option-close").addEventListener("click", closeAdd);
      addOverlay.querySelector("#esc-add-option-cancel").addEventListener("click", closeAdd);
      addOverlay.addEventListener("click", (e) => {
        if (e.target === addOverlay) closeAdd();
      });
      document.addEventListener("keydown", addKey, true);

      addOverlay.querySelector("#esc-btn-add-option-submit").addEventListener("click", () => {
        syncCardInputsToWorkingOptions();
        const code = (codeInput ? codeInput.value.trim().toUpperCase() : "");
        if (!code) {
          alert("Please enter a Button name.");
          if (codeInput) codeInput.focus();
          return;
        }
        const reasons = (addFieldReason && addFieldReason.checked)
          ? collectAddReasons(false)
          : [];
        const defaultReason = reasons[0] || "";
        const userNotesText = (addFieldNotes && addFieldNotes.checked)
          ? ((userNotesAddInput && userNotesAddInput.value) || "")
          : "";
        const zoomText = (addFieldZoom && addFieldZoom.checked)
          ? ((zoomAddInput && zoomAddInput.value) || "")
          : "";
        const optionPayload = {
          label: code,
          meaning: code,
          defaultReason,
          reasons,
          color: "#2563eb",
          userNotesText,
          zoomText,
          noteChoices: [{ label: "User Notes", userNotesText }],
          zoomChoices: [{ label: "Zoom", zoomText }]
        };
        const existingIndex = workingOptions.findIndex(o => o.code.toUpperCase() === code);
        if (existingIndex >= 0) {
          workingOptions[existingIndex] = { ...workingOptions[existingIndex], ...optionPayload };
        } else {
          workingOptions.push({ code, group: "Custom", chip: { text: "", color: "#dc2626" }, ...optionPayload });
        }
        renderOptionsList();
        closeAdd();
        showToast(`Added "${code}". Click Save Changes.`);
      });
    }

    overlay.addEventListener("click", (e) => {
      const chip = e.target.closest(".esc-insert-chip");
      if (!chip || !overlay.contains(chip)) return;
      e.preventDefault();
      const wrap = chip.closest(".esc-insert-chips");
      const targetId = wrap && wrap.getAttribute("data-target");
      if (!targetId) return;
      const field = overlay.querySelector("#" + targetId);
      insertAtCursor(field, chip.getAttribute("data-insert") || "");
    });

    function syncCardInputsToWorkingOptions() {
      const container = overlay.querySelector("#esc-options-cards-list");
      if (!container) return;
      container.querySelectorAll(".esc-option-mgr-card").forEach(card => {
        const idx = parseInt(card.getAttribute("data-index"), 10);
        if (!workingOptions[idx]) return;

        const reasonRows = card.querySelectorAll(".esc-opt-reason-row");
        if (reasonRows.length) {
          workingOptions[idx].reasons = Array.from(reasonRows).map(inp => inp.value.trim()).filter(Boolean);
          workingOptions[idx].defaultReason = workingOptions[idx].reasons[0] || "";
        } else {
          const reasonInput = card.querySelector(".esc-opt-reason-input");
          if (reasonInput) {
            workingOptions[idx].defaultReason = reasonInput.value.trim();
            workingOptions[idx].reasons = workingOptions[idx].defaultReason ? [workingOptions[idx].defaultReason] : [];
          }
        }

        const colorInput = card.querySelector(".esc-opt-color-input");
        if (colorInput) workingOptions[idx].color = colorInput.value;

        const chipInput = card.querySelector(".esc-opt-chip-text");
        if (chipInput) {
          if (!workingOptions[idx].chip) workingOptions[idx].chip = { text: "", color: "#dc2626" };
          workingOptions[idx].chip.text = chipInput.value.trim();
        }

        const notesInput = card.querySelector(".esc-opt-usernotes");
        const noteChoiceBlocks = card.querySelectorAll(".esc-note-choice-block");
        if (noteChoiceBlocks.length) {
          workingOptions[idx].noteChoices = Array.from(noteChoiceBlocks).map((block, i) => ({
            label: (block.querySelector(".esc-choice-label-input") && block.querySelector(".esc-choice-label-input").value.trim()) || `User Notes ${i + 1}`,
            userNotesText: (block.querySelector(".esc-opt-usernotes") && block.querySelector(".esc-opt-usernotes").value) || ""
          }));
          workingOptions[idx].userNotesText = workingOptions[idx].noteChoices[0].userNotesText;
        } else if (notesInput) {
          workingOptions[idx].userNotesText = notesInput.value;
          workingOptions[idx].noteChoices = [{ label: "User Notes", userNotesText: notesInput.value }];
        }

        const zoomInput = card.querySelector(".esc-opt-zoomtext");
        const zoomChoiceBlocks = card.querySelectorAll(".esc-zoom-choice-block");
        if (zoomChoiceBlocks.length) {
          workingOptions[idx].zoomChoices = Array.from(zoomChoiceBlocks).map((block, i) => ({
            label: (block.querySelector(".esc-choice-label-input") && block.querySelector(".esc-choice-label-input").value.trim()) || `Zoom ${i + 1}`,
            zoomText: (block.querySelector(".esc-opt-zoomtext") && block.querySelector(".esc-opt-zoomtext").value) || ""
          }));
          workingOptions[idx].zoomText = workingOptions[idx].zoomChoices[0].zoomText;
        } else if (zoomInput) {
          workingOptions[idx].zoomText = zoomInput.value;
          workingOptions[idx].zoomChoices = [{ label: "Zoom", zoomText: zoomInput.value }];
        }
      });
    }

    function collectEditFields(editRoot, opt, keepEmptyReasons) {
      const reasonRows = editRoot.querySelectorAll(".esc-opt-reason-row");
      if (reasonRows.length) {
        const mapped = Array.from(reasonRows).map((inp) => inp.value);
        opt.reasons = keepEmptyReasons ? mapped : mapped.map((r) => r.trim()).filter(Boolean);
        opt.defaultReason = (opt.reasons.map((r) => r.trim()).find(Boolean) || "");
      }

      const noteChoiceBlocks = editRoot.querySelectorAll(".esc-note-choice-block");
      const notesInput = editRoot.querySelector(".esc-opt-usernotes");
      if (noteChoiceBlocks.length) {
        opt.noteChoices = Array.from(noteChoiceBlocks).map((block, i) => ({
          label: (block.querySelector(".esc-choice-label-input") && block.querySelector(".esc-choice-label-input").value.trim()) || `User Notes ${i + 1}`,
          userNotesText: (block.querySelector(".esc-opt-usernotes") && block.querySelector(".esc-opt-usernotes").value) || ""
        }));
        opt.userNotesText = opt.noteChoices[0].userNotesText;
      } else if (notesInput) {
        opt.userNotesText = notesInput.value;
        opt.noteChoices = [{ label: "User Notes", userNotesText: notesInput.value }];
      }

      const zoomChoiceBlocks = editRoot.querySelectorAll(".esc-zoom-choice-block");
      const zoomInput = editRoot.querySelector(".esc-opt-zoomtext");
      if (zoomChoiceBlocks.length) {
        opt.zoomChoices = Array.from(zoomChoiceBlocks).map((block, i) => ({
          label: (block.querySelector(".esc-choice-label-input") && block.querySelector(".esc-choice-label-input").value.trim()) || `Zoom ${i + 1}`,
          zoomText: (block.querySelector(".esc-opt-zoomtext") && block.querySelector(".esc-opt-zoomtext").value) || ""
        }));
        opt.zoomText = opt.zoomChoices[0].zoomText;
      } else if (zoomInput) {
        opt.zoomText = zoomInput.value;
        opt.zoomChoices = [{ label: "Zoom", zoomText: zoomInput.value }];
      }
    }

    function openEditOptionModal(idx) {
      if (!isAdminLicense()) return;
      const opt = workingOptions[idx];
      if (!opt) return;
      const existing = document.getElementById("esc-edit-option-overlay");
      if (existing) {
        if (typeof existing._escClose === "function") existing._escClose();
        else existing.remove();
      }

      const editOverlay = document.createElement("div");
      editOverlay.className = "esc-modal-overlay";
      editOverlay.id = "esc-edit-option-overlay";
      editOverlay.setAttribute("data-index", String(idx));

      function editFieldsHtml(source) {
        const noteChoices = source.noteChoices && source.noteChoices.length
          ? source.noteChoices
          : [{ label: "User Notes", userNotesText: getOptionUserNotesText(source, 0) }];
        const zoomChoices = source.zoomChoices && source.zoomChoices.length
          ? source.zoomChoices
          : [{ label: "Zoom", zoomText: getOptionZoomText(source, 0) }];
        const reasons = Array.isArray(source.reasons) && source.reasons.length
          ? source.reasons
          : (resolveReasonsList(source).length ? resolveReasonsList(source) : [""]);
        return `
              <div class="esc-reason-input-group">
                <label class="esc-form-label">User Notes</label>
                ${noteChoices.map((choice, ci) => `
                  <div class="esc-note-choice-block" data-choice="${ci}">
                    ${noteChoices.length > 1 ? `<div class="esc-choice-caption">${escapeHtml(choice.label || "User Notes")}</div>` : ""}
                    <input type="hidden" class="esc-choice-label-input" value="${escapeHtml(choice.label || "User Notes")}">
                    <textarea class="esc-input esc-plain-textarea esc-opt-usernotes" id="esc-edit-usernotes-${ci}" rows="3">${escapeHtml(choice.userNotesText || "")}</textarea>
                    ${insertChipsHtml(`esc-edit-usernotes-${ci}`)}
                  </div>
                `).join("")}
              </div>
              <div class="esc-reason-input-group">
                <label class="esc-form-label">Zoom copy</label>
                ${zoomChoices.map((choice, ci) => `
                  <div class="esc-zoom-choice-block" data-choice="${ci}">
                    ${zoomChoices.length > 1 ? `<div class="esc-choice-caption">${escapeHtml(choice.label || "Zoom")}</div>` : ""}
                    <input type="hidden" class="esc-choice-label-input" value="${escapeHtml(choice.label || "Zoom")}">
                    <textarea class="esc-input esc-plain-textarea esc-opt-zoomtext" id="esc-edit-zoomtext-${ci}" rows="5">${escapeHtml(choice.zoomText || "")}</textarea>
                    ${insertChipsHtml(`esc-edit-zoomtext-${ci}`)}
                  </div>
                `).join("")}
              </div>
              <div class="esc-reason-input-group">
                <label class="esc-form-label">Reasons (first is default)</label>
                <div class="esc-reason-list">
                  ${reasons.map((r, ri) => `
                    <div class="esc-reason-row">
                      <input type="text" class="esc-input esc-opt-reason-row" value="${escapeHtml(r)}">
                      ${ri > 0 ? `<button type="button" class="esc-btn-tiny esc-btn-remove-reason" data-reason-index="${ri}">Remove</button>` : ""}
                    </div>
                  `).join("")}
                </div>
                <button type="button" class="esc-btn-tiny esc-btn-add-reason">+ Add reason</button>
              </div>`;
      }

      editOverlay.innerHTML = `
        <div class="esc-popover-backdrop" aria-hidden="true"></div>
        <div class="esc-modal esc-edit-option-modal" role="dialog" aria-modal="true" aria-label="Edit ${escapeHtml(opt.code)}">
          <div class="esc-modal-header">
            <div class="esc-modal-title">
              <span>${escapeHtml(opt.code)}</span>
            </div>
            <button type="button" class="esc-icon-btn" id="esc-edit-option-close" title="Close (Esc)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          <div class="esc-modal-body esc-edit-option-body">${editFieldsHtml(opt)}</div>
          <div class="esc-modal-footer">
            <button type="button" class="esc-btn-secondary" id="esc-edit-option-cancel">Cancel</button>
            <button type="button" class="esc-btn-primary" id="esc-edit-option-apply">Apply</button>
          </div>
        </div>`;

      document.body.appendChild(editOverlay);
      playModalOpen(editOverlay);

      const bodyEl = () => editOverlay.querySelector(".esc-edit-option-body");

      function bindEditBody() {
        const root = bodyEl();
        if (!root) return;
        const addBtn = root.querySelector(".esc-btn-add-reason");
        if (addBtn) {
          addBtn.addEventListener("click", () => {
            const draft = JSON.parse(JSON.stringify(workingOptions[idx]));
            collectEditFields(root, draft, true);
            if (!draft.reasons) draft.reasons = [];
            draft.reasons.push("");
            root.innerHTML = editFieldsHtml(draft);
            bindEditBody();
          });
        }
        root.querySelectorAll(".esc-btn-remove-reason").forEach((btn) => {
          btn.addEventListener("click", () => {
            const ri = parseInt(btn.getAttribute("data-reason-index"), 10);
            const draft = JSON.parse(JSON.stringify(workingOptions[idx]));
            collectEditFields(root, draft, true);
            draft.reasons.splice(ri, 1);
            draft.defaultReason = draft.reasons[0] || "";
            root.innerHTML = editFieldsHtml(draft);
            bindEditBody();
          });
        });
      }

      bindEditBody();

      editOverlay.addEventListener("click", (e) => {
        const chip = e.target.closest(".esc-insert-chip");
        if (!chip || !editOverlay.contains(chip)) return;
        e.preventDefault();
        const wrap = chip.closest(".esc-insert-chips");
        const targetId = wrap && wrap.getAttribute("data-target");
        if (!targetId) return;
        const field = editOverlay.querySelector("#" + targetId);
        insertAtCursor(field, chip.getAttribute("data-insert") || "");
      });

      const editKey = (e) => {
        if (e.key !== "Escape") return;
        e.stopPropagation();
        closeEdit();
      };
      const closeEdit = () => {
        document.removeEventListener("keydown", editKey, true);
        closeOverlayZoom(editOverlay);
      };
      editOverlay._escClose = closeEdit;
      editOverlay.querySelector("#esc-edit-option-close").addEventListener("click", closeEdit);
      editOverlay.querySelector("#esc-edit-option-cancel").addEventListener("click", closeEdit);
      editOverlay.addEventListener("click", (e) => {
        if (e.target === editOverlay) closeEdit();
      });
      document.addEventListener("keydown", editKey, true);

      editOverlay.querySelector("#esc-edit-option-apply").addEventListener("click", () => {
        collectEditFields(bodyEl(), workingOptions[idx]);
        closeEdit();
        renderOptionsList();
        showToast(`Updated "${workingOptions[idx].code}". Click Save Changes.`);
      });
    }

    function renderOptionsList() {
      const container = overlay.querySelector("#esc-options-cards-list");
      const countBadge = overlay.querySelector("#esc-options-count-badge");
      if (!container) return;

      if (countBadge) {
        countBadge.textContent = `${workingOptions.length} Active Button${workingOptions.length === 1 ? '' : 's'}`;
      }

      if (workingOptions.length === 0) {
        container.innerHTML = `
          <div style="text-align:center; padding: 24px; color: #94a3b8; background: #090e1a; border-radius: 6px; border: 1px dashed #334155;">
            No buttons currently on toolbar. Click <strong>+ Add New Option</strong> below or restore presets.
          </div>
        `;
        return;
      }

      let html = "";
      workingOptions.forEach((opt, idx) => {
        html += `
          <div class="esc-option-mgr-card" data-index="${idx}">
            <span class="esc-option-mgr-badge" style="background-color: ${opt.color || '#2563eb'}">${escapeHtml(opt.label || opt.code)}</span>
            <span class="esc-acc-title">${escapeHtml(opt.code)}</span>
            ${staffView ? "" : `
            <div class="esc-option-mgr-actions">
              <button type="button" class="esc-btn-edit-opt" data-index="${idx}">Edit</button>
              <button type="button" class="esc-btn-remove-opt" data-index="${idx}">Remove</button>
            </div>
            `}
          </div>
        `;
      });

      container.innerHTML = html;

      container.querySelectorAll(".esc-btn-edit-opt").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          rememberModalOrigin(btn);
          openEditOptionModal(parseInt(btn.getAttribute("data-index"), 10));
        });
      });

      container.querySelectorAll(".esc-btn-remove-opt").forEach((btn) => {
        btn.addEventListener("click", () => {
          const idx = parseInt(btn.getAttribute("data-index"), 10);
          const removedItem = workingOptions[idx];
          const openEdit = document.getElementById("esc-edit-option-overlay");
          if (openEdit && parseInt(openEdit.getAttribute("data-index"), 10) === idx) {
            openEdit.remove();
          }
          workingOptions.splice(idx, 1);
          renderOptionsList();
          showToast(`Removed "${removedItem.code}" from options.`);
        });
      });
    }

    renderOptionsList();

    const addToggle = overlay.querySelector("#esc-add-toggle");
    if (addToggle) {
      addToggle.addEventListener("click", (e) => {
        e.preventDefault();
        rememberModalOrigin(addToggle);
        openAddOptionModal();
      });
    }

    const restoreBtn = overlay.querySelector("#esc-btn-restore-presets");
    if (restoreBtn) restoreBtn.addEventListener("click", () => {
      if (confirm("Restore all 14 standard buttons?")) {
        const presets = (typeof window !== "undefined" && window.DEFAULT_ESCALATION_OPTIONS)
          || (typeof globalThis !== "undefined" && globalThis.DEFAULT_ESCALATION_OPTIONS)
          || FALLBACK_ESCALATION_OPTIONS;
        workingOptions = JSON.parse(JSON.stringify(presets)).map(normalizeEscalationOption);
        renderOptionsList();
        showToast("Presets restored. Click Save Changes.");
      }
    });

    const auditBtn = overlay.querySelector("#esc-btn-audit");
    if (auditBtn) {
      auditBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        rememberModalOrigin(auditBtn);
        openAuditModal();
      });
    }

    const closeSettings = () => {
      document.removeEventListener("keydown", keyHandler);
      const audit = document.getElementById("esc-audit-overlay");
      if (audit) audit.remove();
      const edit = document.getElementById("esc-edit-option-overlay");
      if (edit) {
        if (typeof edit._escClose === "function") edit._escClose();
        else edit.remove();
      }
      const add = document.getElementById("esc-add-option-overlay");
      if (add) {
        if (typeof add._escClose === "function") add._escClose();
        else add.remove();
      }
      closeOverlayZoom(overlay);
    };

    const keyHandler = (e) => {
      if (e.key !== "Escape") return;
      if (document.getElementById("esc-audit-overlay")) return;
      if (document.getElementById("esc-edit-option-overlay")) return;
      if (document.getElementById("esc-add-option-overlay")) return;
      closeSettings();
    };
    document.addEventListener("keydown", keyHandler);

    function fillSettingsDefaultsForm() {
      const agentInput = overlay.querySelector("#esc-set-agent");
      const zoomUrlInput = overlay.querySelector("#esc-set-zoom-url");
      if (agentInput) agentInput.value = currentSettings.agentName || "";
      if (zoomUrlInput) zoomUrlInput.value = currentSettings.zoomUrl || "zoomus://";
      const horiz = overlay.querySelector('input[name="esc-bar-layout"][value="horizontal"]');
      const vert = overlay.querySelector('input[name="esc-bar-layout"][value="vertical"]');
      if (horiz) horiz.checked = currentSettings.barLayout !== "vertical";
      if (vert) vert.checked = currentSettings.barLayout === "vertical";
      const setCheck = (id, on) => {
        const el = overlay.querySelector(id);
        if (el) el.checked = !!on;
      };
      setCheck("#esc-set-open-zoom", currentSettings.autoOpenZoom !== false);
      setCheck("#esc-set-pin-note", currentSettings.autoPinNote !== false);
      setCheck("#esc-set-copy", currentSettings.autoCopyClipboard !== false);
      setCheck("#esc-set-return", currentSettings.autoReturnToUsers !== false);
    }

    const exportBtn = overlay.querySelector("#esc-settings-export");
    if (exportBtn) exportBtn.addEventListener("click", () => {
      downloadSettingsExportJson(buildSettingsExportFile());
      showToast("Exported hdjrzTools-settings.json.");
    });

    const importBtn = overlay.querySelector("#esc-settings-import");
    if (importBtn) importBtn.addEventListener("click", () => {
      const picker = overlay.querySelector("#esc-settings-import-file");
      if (picker) picker.click();
    });

    const importFile = overlay.querySelector("#esc-settings-import-file");
    if (importFile) importFile.addEventListener("change", (ev) => {
      const file = ev.target.files && ev.target.files[0];
      ev.target.value = "";
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const parsed = parseSettingsImportFile(String(reader.result || ""));
        if (!parsed) {
          showToast("Not an hdjrzTools settings file.");
          return;
        }
        applyStoredSettings({
          escalationSettings: parsed.escalationSettings || {},
          customTemplates: parsed.customTemplates || {},
          customOptions: parsed.customOptions
        });
        const importedOptions = (Array.isArray(currentSettings.customOptions) ? currentSettings.customOptions : [])
          .map(normalizeEscalationOption);
        saveSettings({}, currentSettings.customTemplates || {}, importedOptions, () => {
          workingOptions = JSON.parse(JSON.stringify(getActiveOptions()));
          fillSettingsDefaultsForm();
          renderOptionsList();
          showToast("Imported. Settings restored.");
        });
      };
      reader.onerror = () => showToast("Not an hdjrzTools settings file.");
      reader.readAsText(file);
    });

    overlay.querySelector("#esc-settings-close").addEventListener("click", closeSettings);
    overlay.querySelector("#esc-settings-cancel").addEventListener("click", closeSettings);
    overlay.querySelector("#esc-settings-signout").addEventListener("click", () => {
      releaseLicenseOnServer(() => {
        persistLicenseRole("", () => {
          closeSettings();
          showToast("Signed out.");
          openLicenseModal();
        });
      });
    });

    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeSettings();
    });

    overlay.querySelector("#esc-settings-save").addEventListener("click", () => {
      if (isAdminLicense()) syncCardInputsToWorkingOptions();
      const agentInput = overlay.querySelector("#esc-set-agent");
      const zoomUrlInput = overlay.querySelector("#esc-set-zoom-url");
      const updatedSettings = {
        agentName: (agentInput && agentInput.value.trim()) || "",
        zoomUrl: (zoomUrlInput && zoomUrlInput.value.trim()) || "zoomus://",
        usersListUrl: currentSettings.usersListUrl || "https://nano-admin.bet88.ph/users",
        autoCopyClipboard: !!(overlay.querySelector("#esc-set-copy") && overlay.querySelector("#esc-set-copy").checked),
        autoPinNote: !!(overlay.querySelector("#esc-set-pin-note") && overlay.querySelector("#esc-set-pin-note").checked),
        autoOpenZoom: !!(overlay.querySelector("#esc-set-open-zoom") && overlay.querySelector("#esc-set-open-zoom").checked),
        autoReturnToUsers: isAdminLicense()
          ? !!(overlay.querySelector("#esc-set-return") && overlay.querySelector("#esc-set-return").checked)
          : (currentSettings.autoReturnToUsers !== false),
        autoFindAndView: false,
        barLayout: (overlay.querySelector('input[name="esc-bar-layout"]:checked') && overlay.querySelector('input[name="esc-bar-layout"]:checked').value === "vertical") ? "vertical" : "horizontal"
      };
      const optionsToSave = isAdminLicense() ? workingOptions : currentSettings.customOptions;
      saveSettings(updatedSettings, currentSettings.customTemplates || {}, optionsToSave, () => {
        showToast("Saved.");
        closeSettings();
      });
    });
  }

  /**
   * Listen for messages from popup or background worker
   */
  if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === "TRIGGER_ESCALATION") {
        askReasonThenConfirm(request.code);
        sendResponse({ success: true });
      } else if (request.action === "OPEN_SETTINGS") {
        openSettingsModal();
        sendResponse({ success: true });
      } else if (request.action === "TOGGLE_BAR") {
        if (!isLicensed()) {
          sendResponse({ visible: false });
          return true;
        }
        if (!dockElement) {
          renderHorizontalDock();
        }
        if (dockElement) {
          dockElement.classList.toggle("hidden-bar");
          const isHidden = dockElement.classList.contains("hidden-bar");
          sendResponse({ visible: !isHidden });
        } else {
          sendResponse({ visible: false });
        }
      } else if (request.action === "GET_BAR_STATUS") {
        const isHidden = dockElement ? dockElement.classList.contains("hidden-bar") : false;
        sendResponse({ visible: !!dockElement && !isHidden });
      } else if (request.action === "GET_KYC_PLAYER") {
        const p = scrapePlayerCredentials() || {};
        const attrs = scrapeUserAttributes();
        sendResponse({
          publicId: kycPlainUid(p.publicId || p.userId),
          userId: p.userId || "",
          userCombined: p.userCombined || "",
          kycVerified: p.kycVerified || "",
          name: attrs.name || p.name || "",
          dob: attrs.dob || p.dob || ""
        });
      } else if (request.action === "INJECT_KYC_OLD_NOTE") {
        const note = buildKycOldAccountNote(request && request.newAccountUid);
        injectUserNoteOnPage(note, (injected) => {
          sendResponse({ success: !!injected });
        });
        return true;
      }
    });
  }

  /**
   * Auto Find User & View on Users Search Screen (https://nano-admin.bet88.ph/users)
   */
  let isAutoSearchingUser = false;
  let boundSearchInput = null;
  let searchDebounceTimer = null;

  function isUsersSearchPage() {
    const loc = (typeof window !== "undefined") ? window.location : null;
    if (!loc) return false;
    const path = loc.pathname || "";
    // Match /users or /users/... but NOT single /user/12345
    return /^\/users(\/|$)/i.test(path) || path.includes("/users");
  }

  function normalizeSearchId(raw) {
    return String(raw || "").trim().toLowerCase();
  }

  function rowMatchesSearchedId(row, searchedId) {
    const needle = normalizeSearchId(searchedId);
    if (!needle || !row) return false;
    const text = ((row.textContent || row.innerText || "") + "").toLowerCase();
    if (!text) return false;
    if (text.includes(needle)) return true;
    const compactNeedle = needle.replace(/\s+/g, "");
    return compactNeedle.length >= 2 && text.replace(/\s+/g, "").includes(compactNeedle);
  }

  function findSearchUserIdInput() {
    if (typeof document === "undefined") return null;

    // Strategy 1: Find card/container with heading "Find By Id Or Uid"
    const headings = Array.from(document.querySelectorAll("h1, h2, h3, h4, h5, h6, .card-title, .title, strong, b, div, span, label, p"))
      .filter(el => !(el.closest && el.closest("#escalation-helper-dock, .esc-modal-overlay, .esc-toast")));

    const targetHeading = headings.find(h => {
      const txt = (h.textContent || "").trim();
      return /^Find\s+By\s+Id\s+Or\s+Uid$/i.test(txt);
    });

    if (targetHeading) {
      const card = targetHeading.closest(".card, .panel, .widget, .box, [class*='card'], [class*='panel'], form, div") || targetHeading.parentElement;
      if (card) {
        const inp = card.querySelector("input:not([type='button']):not([type='submit'])");
        if (inp && !(inp.closest && inp.closest("#escalation-helper-dock, .esc-modal-overlay, .esc-toast"))) {
          return inp;
        }
      }
    }

    // Strategy 2: Find the "Find User" button and get the input in its card/container
    const findBtn = findSearchFindUserButton();
    if (findBtn) {
      const container = findBtn.closest(".card, .panel, .widget, .box, form, div") || findBtn.parentElement;
      if (container) {
        const inp = container.querySelector("input:not([type='button']):not([type='submit'])");
        if (inp && !(inp.closest && inp.closest("#escalation-helper-dock, .esc-modal-overlay, .esc-toast"))) {
          return inp;
        }
      }
    }

    // Strategy 3: Check input attributes
    const inputs = Array.from(document.querySelectorAll("input:not([type='button']):not([type='submit'])"))
      .filter(el => !(el.closest && el.closest("#escalation-helper-dock, .esc-modal-overlay, .esc-toast")));
    return inputs.find(inp => {
      const str = `${inp.id || ''} ${inp.name || ''} ${inp.placeholder || ''}`.toLowerCase();
      return str.includes("useridoruid") || str.includes("userid_or_uid") || str.includes("find by id");
    }) || null;
  }

  function findSearchFindUserButton() {
    if (typeof document === "undefined") return null;
    const buttons = Array.from(document.querySelectorAll("button, a, input[type='submit'], [role='button']"))
      .filter(el => !(el.closest && el.closest("#escalation-helper-dock, .esc-modal-overlay, .esc-toast")));
    return buttons.find(b => {
      const txt = (b.textContent || b.value || "").trim().toLowerCase();
      return txt === "find user" || txt.startsWith("find user");
    }) || null;
  }

  function isEscUi(el) {
    return !!(el && el.closest && el.closest("#escalation-helper-dock, .esc-modal-overlay, .esc-toast"));
  }

  function getSiteOrigin() {
    if (typeof window !== "undefined" && window.location && window.location.origin) {
      return window.location.origin;
    }
    return "https://nano-admin.bet88.ph";
  }

  function resolveUserOverviewUrl(href) {
    if (!href) return null;
    const raw = String(href).trim();
    if (!raw || raw === "#" || raw.toLowerCase().startsWith("javascript:")) return null;

    let pathname = raw;
    try {
      pathname = new URL(raw, getSiteOrigin()).pathname;
    } catch (e) {}

    // Overview is /user/1754988 — never /users/...
    const match = pathname.match(/^\/user\/(\d+)(?:\/|$)/i);
    if (!match) return null;
    return getSiteOrigin() + "/user/" + match[1];
  }

  function extractNumericUserId(text) {
    const matches = String(text || "").match(/\b(\d{4,})\b/g);
    if (!matches || !matches.length) return null;
    matches.sort((a, b) => b.length - a.length);
    return matches[0];
  }

  function collectResultRows() {
    if (typeof document === "undefined") return [];
    const rows = [];

    function pushRow(row) {
      if (!row || isEscUi(row) || rows.indexOf(row) !== -1) return;
      const text = (row.textContent || row.innerText || "").trim();
      if (!text) return;
      const lower = text.toLowerCase();
      if (lower === "id" || lower === "actions" || lower === "action") return;
      if (/^(id|uid|user id|actions?)\b/i.test(text) && !/\d{4,}/.test(text)) return;
      rows.push(row);
    }

    Array.from(document.querySelectorAll("table"))
      .filter((el) => !isEscUi(el))
      .forEach((table) => {
        Array.from(table.querySelectorAll("tbody tr, tr")).forEach(pushRow);
      });

    Array.from(document.querySelectorAll(".results, #results, [class*='result'], .table-responsive, [class*='table']"))
      .filter((el) => !isEscUi(el))
      .forEach((root) => {
        Array.from(root.querySelectorAll("tr, [role='row']")).forEach(pushRow);
      });

    return rows;
  }

  function findMatchingResultRow(searchedId) {
    const rows = collectResultRows();
    if (!rows.length) return null;
    if (searchedId) {
      const matched = rows.find((row) => rowMatchesSearchedId(row, searchedId));
      if (matched) return matched;
    }
    // Find User already filtered to one player — use first data row
    return rows.find((row) => /\d{4,}/.test(row.textContent || "")) || rows[0] || null;
  }

  function findUserOverviewHrefIn(scope) {
    if (!scope || !scope.querySelectorAll) return null;
    const links = Array.from(scope.querySelectorAll("a[href]")).filter((el) => !isEscUi(el));
    for (let i = 0; i < links.length; i++) {
      const resolved = resolveUserOverviewUrl(links[i].getAttribute("href") || links[i].href);
      if (resolved) return resolved;
    }
    return null;
  }

  function findLastResortViewControl(row) {
    const scope = row || document.body;
    if (!scope || !scope.querySelectorAll) return null;
    const nodes = Array.from(scope.querySelectorAll("a, button, [role='button']")).filter((el) => !isEscUi(el));
    return nodes.find((el) => {
      const href = resolveUserOverviewUrl(el.getAttribute && (el.getAttribute("href") || el.href));
      if (href) return true;
      const txt = (el.textContent || el.value || "").trim().toLowerCase();
      return txt === "view" || txt.startsWith("view");
    }) || null;
  }

  function openUserOverview(url) {
    if (!url) return false;
    try {
      if (typeof window !== "undefined" && window.location) {
        window.location.href = url;
        return true;
      }
    } catch (e) {
      console.warn("Overview navigation error:", e);
    }
    return false;
  }

  function tryOpenOverviewFromResults(searchedId) {
    const row = findMatchingResultRow(searchedId);
    if (!row) return false;

    const hrefFromRow = findUserOverviewHrefIn(row);
    if (hrefFromRow) {
      return openUserOverview(hrefFromRow);
    }

    const numericFromRow = extractNumericUserId(row.textContent || row.innerText || "");
    if (numericFromRow) {
      return openUserOverview(getSiteOrigin() + "/user/" + numericFromRow);
    }

    const numericFromSearch = extractNumericUserId(searchedId);
    if (numericFromSearch) {
      return openUserOverview(getSiteOrigin() + "/user/" + numericFromSearch);
    }

    const lastResort = findLastResortViewControl(row);
    if (lastResort) {
      const href = resolveUserOverviewUrl(lastResort.getAttribute && (lastResort.getAttribute("href") || lastResort.href));
      if (href) return openUserOverview(href);
      if (typeof lastResort.click === "function") {
        try { lastResort.click(); return true; } catch (e) {}
      }
      return dispatchFullClick(lastResort);
    }

    return false;
  }

  function waitForAndOpenUserOverview(searchedId, maxWaitMs = 8000) {
    const settleMs = 700;
    const intervalMs = 150;
    let elapsed = 0;
    let opened = false;
    let timer = null;

    setTimeout(() => {
      timer = setInterval(() => {
        elapsed += intervalMs;
        if (opened) {
          if (timer) clearInterval(timer);
          return;
        }

        if (tryOpenOverviewFromResults(searchedId)) {
          opened = true;
          if (timer) clearInterval(timer);
          showToast("Player found! Opening overview...", true);
          isAutoSearchingUser = false;
          return;
        }

        if (elapsed >= maxWaitMs) {
          if (timer) clearInterval(timer);
          isAutoSearchingUser = false;
          showToast("Could not open the player overview. Check the Results row and try again.", false);
        }
      }, intervalMs);
    }, settleMs);
  }

  function runAutoFindAndView(searchInput) {
    if (isAutoSearchingUser) return;
    if (currentSettings.autoFindAndView === false) return;

    const newVal = (searchInput && searchInput.value ? searchInput.value : "").trim();
    if (!newVal || newVal.length < 2) return;

    const findBtn = findSearchFindUserButton();
    if (!findBtn) return;

    isAutoSearchingUser = true;
    showToast(`Searching User ID (${newVal})...`, true);

    dispatchFullClick(findBtn);
    waitForAndOpenUserOverview(newVal, 8000);

    setTimeout(() => {
      isAutoSearchingUser = false;
    }, 10000);
  }

  function checkAutoFindAndView() {
    if (currentSettings.autoFindAndView === false) return;
    if (!isUsersSearchPage()) return;

    const searchInput = findSearchUserIdInput();
    if (!searchInput) return;

    // First paint: bind listeners only. Do not auto-click Find User until the agent types, pastes, or presses Enter.
    if (boundSearchInput === searchInput) return;
    boundSearchInput = searchInput;

    function scheduleUserInitiatedSearch() {
      if (currentSettings.autoFindAndView === false) return;
      const val = (searchInput.value || "").trim();
      if (!val || val.length < 2) return;

      if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
      searchDebounceTimer = setTimeout(() => {
        runAutoFindAndView(searchInput);
      }, 900);
    }

    searchInput.addEventListener("input", scheduleUserInitiatedSearch);
    searchInput.addEventListener("change", scheduleUserInitiatedSearch);
    searchInput.addEventListener("paste", () => {
      setTimeout(scheduleUserInitiatedSearch, 60);
    });
    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
        setTimeout(() => runAutoFindAndView(searchInput), 50);
      }
    });
  }

  /**
   * Monitor page for player info and SPA navigation
   */
  function startPageMonitor() {
    function checkPage() {
      if (isLicensed()) {
        if (!dockElement || !document.getElementById("escalation-helper-dock")) {
          renderHorizontalDock();
        }
      } else {
        hideEscalationDock();
      }

      checkAutoFindAndView();

      const freshPlayer = scrapePlayerCredentials();
      if (freshPlayer && (!detectedPlayer || freshPlayer.userId !== detectedPlayer.userId)) {
        detectedPlayer = freshPlayer;
        updatePlayerStatusBadge();
      } else if (!freshPlayer && detectedPlayer) {
        detectedPlayer = null;
        updatePlayerStatusBadge();
      }
    }

    checkPage();

    // DOM Observer for SPA page transitions / dynamic player rendering
    const observer = new MutationObserver(() => {
      checkPage();
    });

    if (document.body) {
      observer.observe(document.body, { childList: true, subtree: true });
    }
  }

  // Initialize
  loadSettings(() => {
    loadLicenseRole(() => {
      startPageMonitor();
      if (!isLicensed()) {
        setTimeout(() => openLicenseModal(), 300);
      }
    });
  });
})();
