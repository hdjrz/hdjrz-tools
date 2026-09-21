/**
 * Escalation Chrome Extension - Content Script
 * Floating horizontal escalation toolbar, dynamic player scraping,
 * accidental-click confirmation modal, and in-page settings modal.
 */

(function () {
  if (window.__ESCALATION_HELPER_LOADED__) return;
  window.__ESCALATION_HELPER_LOADED__ = true;
  try {
    sessionStorage.removeItem("esc_update_initiated");
    if (typeof GM_deleteValue === "function") {
      GM_deleteValue("HDJRZ_DYNAMIC_BUNDLE");
      GM_deleteValue("HDJRZ_DYNAMIC_VERSION");
    }
    localStorage.removeItem("hdjrz_dynamic_bundle");
    localStorage.removeItem("hdjrz_dynamic_version");
  } catch (e) {}

  const FALLBACK_BUTTON_COLOR_PALETTES = {
    classic_dark: {
      id: "classic_dark",
      name: "Classic Dark",
      description: "Deep saturated originals with high-contrast clarity",
      swatch: ["#1E40AF", "#991B1B", "#065F46", "#5B21B6"],
      colors: {
        "ACR": "#1E40AF",
        "ACR-PAGCOR": "#0369A1",
        "ACR - PERMA": "#991B1B",
        "REACT": "#065F46",
        "REACT NOT": "#0F766E",
        "NGP NON-X": "#92400E",
        "NDRP": "#5B21B6",
        "UA W/FUNDS": "#4338CA",
        "UA WO/FUNDS": "#6B21A8",
        "MANUAL KYC": "#9F1239",
        "KYC SWITCH": "#0E7490",
        "GLIFE.1": "#065F46",
        "GLIFE.2": "#115E59",
        "ABUSER": "#334155",
        "DISCONNECT": "#1D4ED8"
      }
    },
    midnight_abyss: {
      id: "midnight_abyss",
      name: "Midnight Abyss",
      description: "Deep midnight blues, navy obsidian, and steel",
      swatch: ["#0B132B", "#1C2541", "#3A506B", "#1F4068"],
      colors: {
        "ACR": "#1C2541",
        "ACR-PAGCOR": "#0B132B",
        "ACR - PERMA": "#781428",
        "REACT": "#0E4438",
        "REACT NOT": "#1B3B4B",
        "NGP NON-X": "#6B4210",
        "NDRP": "#2B2D6E",
        "UA W/FUNDS": "#5A1830",
        "UA WO/FUNDS": "#162447",
        "MANUAL KYC": "#611C35",
        "KYC SWITCH": "#1F4068",
        "GLIFE.1": "#134E5E",
        "GLIFE.2": "#0B2545",
        "ABUSER": "#1F2430",
        "DISCONNECT": "#23376B"
      }
    },
    crimson_wine: {
      id: "crimson_wine",
      name: "Crimson Wine",
      description: "Deep burgundy, dark merlot, and cherry noir",
      swatch: ["#3D0C11", "#5E131D", "#800E13", "#4A1521"],
      colors: {
        "ACR": "#5E131D",
        "ACR-PAGCOR": "#3D0C11",
        "ACR - PERMA": "#800E13",
        "REACT": "#124230",
        "REACT NOT": "#381F26",
        "NGP NON-X": "#693D15",
        "NDRP": "#4C1C52",
        "UA W/FUNDS": "#6E1320",
        "UA WO/FUNDS": "#380B10",
        "MANUAL KYC": "#66182B",
        "KYC SWITCH": "#1B3847",
        "GLIFE.1": "#1B473A",
        "GLIFE.2": "#4A1521",
        "ABUSER": "#261418",
        "DISCONNECT": "#4E1A2B"
      }
    }
  };

  const FALLBACK_ESCALATION_OPTIONS = [
    { code: "ACR", label: "ACR", meaning: "Account Closure Request", description: "Player requested to close/disable their account voluntarily.", group: "Account Closure", color: "#2563eb", chip: { text: "", color: "#dc2626" }, defaultReason: "Losing player", template: "{code} / {cid} / {reason}" },
    { code: "ACR-PAGCOR", label: "ACR-PAGCOR", meaning: "Account Closure Request (PAGCOR)", description: "Regulatory or formal self-exclusion mandated by PAGCOR.", group: "Account Closure", color: "#0284c7", chip: { text: "", color: "#dc2626" }, defaultReason: "PAGCOR exclusion list / regulatory compliance", template: "{code} / {cid} / {reason}" },
    { code: "ACR - PERMA", label: "ACR - PERMA", meaning: "Permanent Account Closure", description: "Account permanently banned or closed with zero chance of reopening.", group: "Account Closure", color: "#dc2626", chip: { text: "", color: "#dc2626" }, defaultReason: "Permanent closure requested / Non-negotiable ban", template: "{code} / {cid} / {reason}" },
    { code: "REACT", label: "REACT", meaning: "Account Reactivation Request", description: "Player reached out requesting to reopen a previously closed account.", group: "Reactivation", color: "#059669", chip: { text: "", color: "#dc2626" }, defaultReason: "Player requested account reactivation", template: "{code} / {cid} / {reason}" },
    { code: "REACT NOT", label: "REACT NOT", meaning: "Reactivation Not Allowed", description: "Reactivation declined due to permanent closure, policy, or unresolved flags.", group: "Reactivation", color: "#0d9488", chip: { text: "R.NOT", color: "#065f46" }, defaultReason: "Not eligible for reactivation / Permanent exclusion", template: "{code} / {cid} / {reason}" },
    { code: "NGP NON-X", label: "NGP NON-X", meaning: "NGP Non-Exclusive Player", description: "Escalation for players tagged under Non-Exclusive Next Gen Player program.", group: "Special Programs", color: "#d97706", chip: { text: "R.UA", color: "#b45309" }, defaultReason: "NGP Non-Exclusive review", template: "{code} / {cid} / {reason}" },
    { code: "NDRP", label: "NDRP", meaning: "Non-Deposit Reward Program", description: "Issues concerning free credits, vouchers, or no-deposit rewards.", group: "Financial & Rewards", color: "#7c3aed", chip: { text: "", color: "#dc2626" }, defaultReason: "Non-Deposit Reward credited / claim inquiry", template: "{code} / {cid} / {reason}" },
    { code: "UA W/FUNDS", label: "UA W/FUNDS", meaning: "Unauthorized Access with Funds", description: "Compromised or hacked account that currently holds a cash balance.", group: "Security & Fraud", color: "#6366f1", chip: { text: "For escalation", color: "#b91c1c" }, defaultReason: "Suspected account takeover with remaining balance", template: "{code} / {cid} / {reason}" },
    { code: "UA WO/FUNDS", label: "UA WO/FUNDS", meaning: "Underage without funds", description: "Underage player with no remaining balance.", group: "Security & Fraud", color: "#8b5cf6", chip: { text: "", color: "#dc2626" }, defaultReason: "Underage without funds", template: "{code} / {cid} / {reason}" },
    { code: "MANUAL KYC", label: "MANUAL KYC", meaning: "Manual KYC Document Review", description: "Automated verification failed; manual review of submitted IDs needed.", group: "KYC & Verification", color: "#e11d48", chip: { text: "", color: "#dc2626" }, defaultReason: "Review Needed", template: "{code} / {cid} / {reason}" },
    { code: "KYC SWITCH", label: "KYC SWITCH", meaning: "KYC Verification Switch", description: "Switching player's verification method (e.g. from SMS OTP to Manual or email).", group: "KYC & Verification", color: "#0891b2", chip: { text: "", color: "#0d9488" }, defaultReason: "Switch verification channel requested", template: "{code} / {cid} / {reason}" },
    { code: "GLIFE.1", label: "GLIFE.1", meaning: "GLife Escalation Tier 1", description: "First-level escalation for GCash GLife mini-app transactions or sync issues.", group: "GLife Partner", color: "#059669", chip: { text: "", color: "#dc2626" }, defaultReason: "GLife mini-app sync issue / Tier 1 inquiry", template: "{code} / {cid} / {reason}" },
    { code: "GLIFE.2", label: "GLIFE.2", meaning: "GLife Escalation Tier 2", description: "High-priority / urgent escalation for GLife payment failures or account locks.", group: "GLife Partner", color: "#0f766e", chip: { text: "", color: "#dc2626" }, defaultReason: "GLife Tier 2 high-priority escalation", template: "{code} / {cid} / {reason}" },
    { code: "ABUSER", label: "ABUSER", meaning: "Bonus / Promo Abuse Flag", description: "System or manual flag for exploiting promotions, multi-accounting, or fraud.", group: "Risk & Compliance", color: "#475569", chip: { text: "", color: "#dc2626" }, defaultReason: "Bonus / Promotional abuse flagged", template: "{code} / {cid} / {reason}" },
    { code: "DISCONNECT", label: "DISCONNECT", meaning: "Disconnect / Session Kill Request", description: "Request to terminate active game or provider session due to freeze or sync error.", group: "Technical & Game", color: "#3b82f6", chip: { text: "", color: "#dc2626" }, defaultReason: "Session freeze / Disconnect requested", template: "{code} / {cid} / {reason}" }
  ];

  let currentSettings = {
    quickSelectMode: "click",
    closeOnCopy: false,
    autoCloseTimeout: 0,
    toastDuration: 2.5,
    autoFindAndView: false,
    dockPosition: "middle-right",
    dockOrientation: "horizontal",
    dockMinimized: false,
    customTemplates: {},
    customOptions: null,
    remoteTemplatesVersion: 0,
    theme: "dark",
    barTheme: "minimal-glass",
    tlMentions: "@Jetro",
    successSound: "voice"
  };

  let workingOptions = [];
  let optionToEditIndex = null;
  let optionToDeleteIndex = null;
  let detectedPlayer = null;
  let activeModal = null;
  let dockElement = null;
  let lastModalTrigger = null;
  let lastModalOriginX = typeof window !== "undefined" ? window.innerWidth / 2 : 0;
  let lastModalOriginY = typeof window !== "undefined" ? window.innerHeight / 2 : 0;
  let licenseRole = "";
  let lastKnownActiveUsers = [];
  const safeEsc = (s) => String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  function parseSemver(v) {
    const parts = String(v || "").replace(/[^0-9.]/g, "").split(".").map(n => parseInt(n, 10) || 0);
    while (parts.length < 3) parts.push(0);
    return parts;
  }

  function isVersionBelow(clientVer, minVer) {
    if (!clientVer || !minVer) return false;
    if (clientVer === "1.9.0" || clientVer === "1.9") return true;
    const a = parseSemver(clientVer);
    const b = parseSemver(minVer);
    for (let i = 0; i < 3; i++) {
      if (a[i] < b[i]) return true;
      if (a[i] > b[i]) return false;
    }
    return false;
  }

  const HARDCODED_VERSION = "1.8.0";
  const DYNAMIC_VER = (typeof GM_getValue === "function" && GM_getValue("HDJRZ_DYNAMIC_VERSION"))
    || (typeof localStorage !== "undefined" && localStorage.getItem("hdjrz_dynamic_version"))
    || null;
  const TM_VER = (typeof GM_info !== "undefined" && GM_info && GM_info.script && GM_info.script.version)
    || (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.getManifest && chrome.runtime.getManifest() && chrome.runtime.getManifest().version)
    || null;

  let activeScriptVer = HARDCODED_VERSION;
  if (TM_VER && !isVersionBelow(TM_VER, activeScriptVer)) {
    activeScriptVer = TM_VER;
  }
  if (DYNAMIC_VER && DYNAMIC_VER !== "999.0.0" && !isVersionBelow(DYNAMIC_VER, activeScriptVer)) {
    activeScriptVer = DYNAMIC_VER;
  }
  const SCRIPT_VERSION = activeScriptVer;
  const LICENSE_ACTIVATE_URL = "https://hdjrz-license.rosechel05.workers.dev/";

  const CHANGELOG_HISTORY = [
    {
      version: "1.8.0",
      title: "Admin Targeted Direct Chat & Live Active Agent Roster",
      date: "Latest",
      agentFeatures: [
        "🔔 Direct Admin Messages: Instantly receive direct messages initiated by Admin with immediate unread sound chime, badge indicators, and thread sync.",
        "⚡ Sub-Second Delivery: Seamless two-way conversational message delivery with zero delay."
      ],
      adminFeatures: [
        "🎯 Select Agent to Chat: Choose any fleet agent from a structured dropdown or clickable active agent chips to direct messages to.",
        "🟢 Live Active Fleet Roster: Real-time active agent status bar showing who is online now, installed version, and activity timing.",
        "💬 Smart Thread Jump: Automatically detects existing open conversation threads with selected agents and provides 1-click jump to active chat."
      ]
    },
    {
      version: "1.7.9",
      title: "Real-Time Zero-Queue Chat & Instant Edge Transport",
      date: "v1.7.9",
      agentFeatures: [
        "⚡ Instant Sub-500ms Two-Way Delivery: Eliminated Tampermonkey GM_xmlhttpRequest queue congestion by prioritizing native browser window.fetch with HTTP/2 multiplexing.",
        "🔄 Non-Stacking Self-Scheduling Poller: Replaced fixed setInterval with adaptive non-overlapping recursion, completely eliminating the 10-15s backlog delay.",
        "⚡ Non-Blocking D1 Read-Receipts: Database read-receipt operations now run asynchronously via ctx.waitUntil, returning instant responses with zero database write locks."
      ],
      adminFeatures: [
        "🚀 Instant Admin Polling: Admin portal upgraded with in-flight queue locks, guaranteeing messages are displayed instantly in both directions.",
        "🛡️ Zero DDL Overhead: Removed repeated D1 schema table creation from worker request paths for high-performance edge execution."
      ]
    },
    {
      version: "1.7.8",
      title: "Instant Agent-Side Chat Receiving & Lock-Free Polling",
      date: "v1.7.8",
      agentFeatures: [
        "⚡ Sub-Second Inbound Messages: Eliminated database write stalls so admin messages now appear on the agent screen immediately (<450ms).",
        "🚀 450ms Thread Polling: Continuous low-latency thread polling with zero delay or lag.",
        "🔔 1.2s Fast Badge & Toast Checker: Background notifications for new admin replies now trigger within 1.2 seconds."
      ],
      adminFeatures: [
        "⚡ Atomic Batch Replies: Combined message insert and ticket updates into a single round-trip D1 SQL transaction.",
        "🛡️ Lock-Free Polling: Agent thread requests are now 100% read-only, preventing write locks on the database."
      ]
    },
    {
      version: "1.7.7",
      title: "Real-Time D1 Migration & Zero-Lag Instant Chat",
      date: "v1.7.7",
      agentFeatures: [
        "⚡ 750ms Instant Messenger Polling: Sub-second conversational polling and in-memory credential caching for true real-time chat.",
        "📬 3-Second Unread Notifications: Dedicated background checker notifies agents of admin replies in near real-time.",
        "🚫 Edge Zero-Cache Headers: Worker responses explicitly bypass browser, proxy, and Cloudflare edge caches."
      ],
      adminFeatures: [
        "📥 Automated Inbox Auto-Refresh: Incoming agent chats and ticket updates pop up automatically every 1.5s without manual refresh.",
        "🗄️ Automated Remote D1 Migrations: Database schema executes directly into Cloudflare D1 with health diagnostics at /api/support/health.",
        "⚡ Sub-Second Two-Way Sync: Instant read-after-write SQL queries for instant communication between admin and staff."
      ]
    },
    {
      version: "1.7.6",
      title: "Cloudflare D1 SQL Chat Engine (Zero-Delay Consistency)",
      date: "v1.7.6",
      agentFeatures: [
        "⚡ Zero Edge Caching Lag: Upgraded backend support pipeline to Cloudflare D1 SQL, eliminating the 10-second KV edge caching delay.",
        "💬 Instant Message Receiving: Immediate read-after-write consistency ensures conversation replies appear instantly."
      ],
      adminFeatures: [
        "🚀 High-Performance D1 Database: Real-time SQL queries power both extension and web admin inboxes with sub-second message sync.",
        "🛡️ Automatic KV Fallback: Seamless automatic fallback architecture guarantees zero message loss or downtime."
      ]
    },
    {
      version: "1.7.5",
      title: "Real-Time Chat Optimization & Zero-Delay Messaging",
      date: "v1.7.5",
      agentFeatures: [
        "⚡ Instant Outgoing Chat: Optimistic UI rendering displays your reply with zero latency (0ms) immediately as you send.",
        "🚀 3x Faster Reply Delivery: Active conversation sync rate accelerated from 3.5s to 1.2s for near-instant message receipt.",
        "⌨️ Quick Send on Enter: Press Enter to send messages instantly, Shift+Enter for newlines."
      ],
      adminFeatures: [
        "⚡ Accelerated Fleet Conversation Polling: Admin inbox thread sync rate boosted to 1.2s across both toolbar extension and web portal.",
        "👁️ Tab Focus Auto-Sync: Switching back to the browser tab triggers an immediate zero-delay inbox refresh."
      ]
    },
    {
      version: "1.7.4",
      title: "Conversation Alignment & Bubble Color Redesign",
      date: "v1.7.4",
      agentFeatures: [
        "💬 Natural Chat Layout: Standardized conversational bubble placement (outgoing messages on the right in blue, incoming responses on the left in gray)."
      ],
      adminFeatures: [
        "👑 Admin Chat Layout Fix: In Admin Inbox, fleet agent messages appear on the left in gray, and admin replies appear on the right in blue.",
        "✨ Enhanced Contrast & Badges: Improved sender label visibility and distinct tail accents on message bubbles."
      ]
    },
    {
      version: "1.7.3",
      title: "In-Extension Admin Messages Inbox & Fleet Thread Management",
      date: "v1.7.3",
      agentFeatures: [
        "📬 Dedicated Agent Inbox: Full isolation of messages and seamless two-way replies with admin from the floating toolbar.",
        "📸 Instant Screenshot Lightbox: Zoom and inspect attached screenshots directly within any conversation bubble."
      ],
      adminFeatures: [
        "👑 Extension Admin Inbox: Admin accounts now directly view all fleet agent conversations within the browser extension toolbar.",
        "⚡ Direct Admin Replies & Status Control: Reply as Admin directly from the toolbar, mark threads resolved, or delete tickets with 1 click.",
        "🔴 Fleet-Wide Unread Counter: Admin dock badge dynamically lights up whenever any agent across the fleet sends a message."
      ]
    },
    {
      version: "1.7.2",
      title: "Real-Time Chat Auto-Refresh & Inbox Filter Sync",
      date: "v1.7.2",
      agentFeatures: [
        "⚡ Live Chat Auto-Refresh: Active conversation thread automatically updates every 3.5 seconds so admin replies appear instantly in real-time.",
        "🔄 Instant Thread Refresh Button: Added one-click refresh button directly in the conversation header for zero-delay message checks.",
        "💬 Persistent Active Messaging: Agent replies automatically reopen conversation threads so they always remain top-of-inbox for admin."
      ],
      adminFeatures: [
        "📬 Default 'All Conversations' Filter: Prevents in-progress or newly updated threads from disappearing under strict status filters.",
        "⚡ Real-Time Admin Thread Polling: Automatically syncs open conversation drawer every 3 seconds to show incoming agent replies live.",
        "🚀 Fast Inbox Sync: Shortened background portal sync interval to 6 seconds for instantaneous notification delivery."
      ]
    },
    {
      version: "1.7.1",
      title: "Agent Messages Inbox & Real-Time Communication Fix",
      date: "v1.7.1",
      agentFeatures: [
        "📬 Two-Way Agent Chat Inbox: Chat directly with admin, send feedback, paste screenshots (Ctrl+V), and view full conversation history.",
        "⚡ Guest & Staff Instant Connectivity: Fixed guest/unactivated session routing and persistent device identification for immediate messaging without setup hurdles.",
        "🔴 Live Unread Badge & Alerts: Instant alert when admin responds to your messages with real-time notification toasts."
      ],
      adminFeatures: [
        "📬 Agent Messages Inbox: Dedicated inbox in the Web Admin Portal (/admin) with live unread indicators, conversation threads, and quick response drawer.",
        "⚡ Worker Route Resolution: Fully resolved /api/support/my-tickets endpoints and worker script execution for flawless deployment."
      ]
    },
    {
      version: "1.7.0",
      title: "Real-Time Support Chat & Screenshot Bug Reporter",
      date: "v1.7.0",
      agentFeatures: [
        "💬 Direct Admin Support Chat: Open Support directly from the floating dock to ask questions, report bugs, and chat with admin in real-time.",
        "📸 Clipboard Screenshot Dropzone (Ctrl+V): Easily paste screenshots directly from your clipboard with automatic offscreen compression.",
        "🔴 Live Unread Badge & Toasts: Instant visual indicators on your floating dock when admin responds to your open tickets."
      ],
      adminFeatures: [
        "👑 Centralized Web Support Inbox: View agent tickets, inspect high-res screenshots with lightbox zoom, and reply instantly from /admin.",
        "⚡ Integrated Diagnostics: Each agent ticket automatically attaches agent name, device ID, script version, and page URL."
      ]
    },
    {
      version: "1.6.2",
      title: "KYC Switch Auto-Scan & Readonly Verified UID Field",
      date: "v1.6.2",
      agentFeatures: [
        "🔒 Readonly Verified-to-Rejected Field: The 'Verified to rejected' text field is now locked and protected from accidental manual typing or pasting.",
        "⚡ Automatic Cross-Tab Scanner: Instant automatic scanning pulls the duplicate/old account ID from your other open player tab with zero manual effort.",
        "✨ Streamlined Status Label: Clear indicator displays scanning status and tab sync feedback directly below the field."
      ],
      adminFeatures: [
        "🛡️ Automated Field Population: Enforces background tab query binding for KYC Switch escalations, eliminating operator entry typos."
      ]
    },
    {
      version: "1.6.1",
      title: "Legal Age Badge Display & 21+ Classification Fix",
      date: "v1.6.1",
      agentFeatures: [
        "🟢 Legal Age Badge (21+): Replaced glitchy 'undefined (age)' label on the dock toolbar with a clean, professional 'Legal Age (age)' badge.",
        "👁️ Instant Age Verification: Dock instantly shows glowing green 'Legal Age (38)' alongside player ID for clear compliance checks."
      ],
      adminFeatures: [
        "🛡️ Synchronized Age Bracket Metadata: Standardized bracket labels across templates and UI renderers with zero undefined fallback."
      ]
    },
    {
      version: "1.6.0",
      title: "KYC Switch Verified-to-Rejected UID & Scraper Fix",
      date: "v1.6.0",
      agentFeatures: [
        "🛡️ KYC Switch Zoom Accuracy: Fixed bug where 'Verified to rejected' displayed 'input (2)' instead of the real player ID. Now guarantees the entered Verified UID is reliably output.",
        "🧹 Scraper Counter Sanitization: Stripped form and tab counters (e.g. 'input (2)', 'notes (3)') from ID parsers, preventing phantom values across multiple tabs."
      ],
      adminFeatures: [
        "⚡ Cross-Tab KYC Synchronization: Background player sync now validates active player overview pages before broadcasting credentials."
      ]
    },
    {
      version: "1.5.9",
      title: "Manual KYC Age Integration in User Notes",
      date: "v1.5.9",
      agentFeatures: [
        "📝 Manual KYC User Notes Age: Added player age directly beside Date of Birth in User Notes (`For Manual Verification | [Name] | [DOB] ([AGE])`).",
        "🎂 Complete Age Synchronization: Both in-page User Notes and Zoom Final Escalation Note now carry the calculated player age for seamless KYC review."
      ],
      adminFeatures: [
        "🛡️ Automatic Template Sync: Promptly updates stored agent configurations across the entire team."
      ]
    },
    {
      version: "1.5.8",
      title: "Manual KYC Age Integration in Final Escalation Note",
      date: "v1.5.8",
      agentFeatures: [
        "🎂 Manual KYC Age Display: Automatically appends calculated player age beside Date of Birth in the Final Escalation Note (`Date of Birth: [DOB] ([AGE])`) for instant TL verification.",
        "✨ Clean Parentheses Sanitization: Intelligently omits empty parentheses when date of birth or age is not provided."
      ],
      adminFeatures: [
        "🛡️ Synchronized KYC Verification Templates: Automated cloud template migration ensures fleet-wide adoption across all agents."
      ]
    },
    {
      version: "1.5.7",
      title: "Streamlined 3 Dark Palette Options",
      date: "v1.5.7",
      agentFeatures: [
        "🎯 3 Streamlined Dark Options: Focused down to 3 curated dark palettes: Classic Dark (Multi-Color), Midnight Abyss (Deep Navy Blue), and Crimson Wine (Deep Burgundy Wine).",
        "⚡ Cleaner Settings Toolbar: Minimalist 3-button palette bar with instant 1-click styling."
      ],
      adminFeatures: [
        "🛡️ Simplified Fleet Theming: Exactly 3 distinct dark high-contrast themes for fast selection across all escalations."
      ]
    },
    {
      version: "1.5.6",
      title: "Exclusive Dark-Tone Button Color Palettes",
      date: "v1.5.6",
      agentFeatures: [
        "🌙 Exclusively Dark Color Palettes: Removed all light and pastel button options. Replaced with 7 deep, rich, high-contrast dark colorways (Midnight Abyss, Dark Forest, Crimson Wine, Dark Amethyst, Dark Espresso, Obsidian Slate, Classic Dark).",
        "👁️ High-Contrast Readability: Pure white text paired with moody dark-saturated buttons designed specifically for bet88 admin dark workflows."
      ],
      adminFeatures: [
        "🎨 7 Dark Curated Themes: Cohesive, non-glaring dark palettes across all 15 escalation buttons with real-time settings swatches."
      ]
    },
    {
      version: "1.5.5",
      title: "Curated Color Hunt Designer Palettes",
      date: "v1.5.5",
      agentFeatures: [
        "🎨 Color Hunt Themes: Replaced generic contrast variations with 7 authentic curated color schemes (Ocean Coral, Midnight Navy, Retro Crimson, Emerald Gold, Sunset Terracotta, Candy Pastel, Classic Pro).",
        "✨ 4-Stripe Palette Swatches: Instant visual preview of each designer palette right in the Settings Button Palette bar."
      ],
      adminFeatures: [
        "🎯 Multi-Color Palette Coordination: Harmonious color distribution across all escalation button groups with full 1-click styling."
      ]
    },
    {
      version: "1.5.4",
      title: "Admin Portal Script Syntax & Login Button Fix",
      date: "v1.5.4",
      agentFeatures: [
        "🛡️ Core API Handshake: Continuous edge connectivity without interruptions."
      ],
      adminFeatures: [
        "🚀 Unlock Portal Button Restoration: Resolved JavaScript syntax error in admin portal that was preventing the login button from firing.",
        "✨ Clean Attribute Escaping: Replaced escaped quotes with HTML entity quotes in table action handlers."
      ]
    },
    {
      version: "1.5.3",
      title: "Admin Portal Dual-Auth & Login Reliability",
      date: "v1.5.3",
      agentFeatures: [
        "🛡️ Enhanced Security Handshake: Smoother authentication verification against the Cloudflare Edge API.",
        "⚡ Session Stability: Prevents unexpected session expirations during long shifts."
      ],
      adminFeatures: [
        "🔑 Dual-Auth Support: Admins can log in using either the Master Admin Password or any active HDJRZ-ADMIN license key.",
        "👁️ Password Visibility Toggle: Added peek eye icon to verify complex passwords and avoid typo lockouts.",
        "🚫 System Key Isolation: Cleaned up the Issued Licenses table by filtering out internal configuration keys."
      ]
    },
    {
      version: "1.5.2",
      title: "Agent / Client Name Sync & Portal Resolution",
      date: "v1.5.2",
      agentFeatures: [
        "👤 Live Name Synchronization: Your configured Agent Name in Settings now syncs directly to the Admin Portal.",
        "⚡ Automatic License Binding: License ownership auto-attaches whenever settings are updated or heartbeats run."
      ],
      adminFeatures: [
        "👑 Real-time Agent Identification: Web Admin Portal dynamically resolves and displays the exact agent using each license key.",
        "✏️ Direct Inline Editing: Admins can manually update or rename license owners right from the Issued License Keys table."
      ]
    },
    {
      version: "1.5.1",
      title: "Direct Sound Trigger on Confirm & Execute",
      date: "Previous",
      agentFeatures: [
        "🔊 Instant Escalation Sound: Success sound effect now triggers immediately when you click 'Confirm & Execute'.",
        "🔇 No Update Sounds: Removed sound playback from extension updates and system notifications."
      ],
      adminFeatures: [
        "👑 Accurate Audio Activation: Direct user-gesture audio dispatch ensures 100% reliable sound playback."
      ]
    },
    {
      version: "1.5.0",
      title: "Settings Save & Execution Behavior Fix",
      date: "Previous",
      agentFeatures: [
        "⚙️ Seamless Preference Saving: Fixed execution behavior toggles and settings save handler.",
        "🔔 Responsive Feedback: Clear instant visual confirmation upon saving preferences."
      ],
      adminFeatures: [
        "👑 Reliable Configuration: Guaranteed saving of Team Leader mentions and fleet sound controls.",
        "🛡️ Error Resilient: Try-catch protected save flow prevents any UI lockups."
      ]
    },
    {
      version: "1.4.8",
      title: "Success Sound Customization & Fleet Control",
      date: "Latest",
      agentFeatures: [
        "🔊 Voice Shoutout Effect: Escalation confirmations now celebrate with the audio shoutout ('Arigathanks po').",
        "🔔 Audio Flexibility: Automatically adopts the sound effect configured and enforced by Admins."
      ],
      adminFeatures: [
        "👑 Fleet Success Sound Control: Admins can choose between Voice Shoutout ('Arigathanks') and Melodic Bell Chime directly in Settings or Web Admin Portal.",
        "📡 Fleet Sync: Instantly enforces the chosen sound across all agent workstations upon policy sync."
      ]
    },
    {
      version: "1.4.7",
      title: "TL Mentions Configuration",
      date: "Previous",
      agentFeatures: [
        "👥 Team Leader Mentions: Notes automatically include configured Team Leader handles (e.g. @Jetro) after 'Pasuyo po TLs'."
      ],
      adminFeatures: [
        "👑 Dynamic TL Mentions: Configure Team Leader handle(s) across all escalation templates in one setting."
      ]
    },
    {
      version: "1.4.5",
      title: "Centralized Publishing via Admin Portal",
      date: "Latest",
      agentFeatures: [
        "🔄 Clean Cloud Sync: Extension settings now sync directly from approved production templates with zero accidental publishes."
      ],
      adminFeatures: [
        "🌐 Centralized Pipeline: Publishing is strictly managed via Web Admin Portal (/admin) with full staging and validation.",
        "🛡️ Streamlined Settings: Centralized Web Admin Portal access in Account & License, eliminating duplicate actions in Cloud & Backup."
      ]
    },
    {
      version: "1.4.4",
      title: "Update Status & Requirement Transparency",
      date: "Previous",
      agentFeatures: [
        "📊 Version & Update Clarity: Instantly see installed version and whether an update is Required or Optional.",
        "🚀 Smart Update Indicators: Distinct badges and labels in Dock, Settings, and Notifications (⚠️ Required vs 🚀 Optional)."
      ],
      adminFeatures: [
        "🛡️ Compliance Visibility: Clear distinction between mandatory security/schema updates and optional feature releases."
      ]
    },
    {
      version: "1.4.3",
      title: "Maya Mini App Auto-Detection",
      date: "Previous",
      agentFeatures: [
        "📱 Maya Mini App Support: Auto-detects Name and DOB from Maya Mini App user attributes.",
        "🎂 Smart DOB Formatter: Formats dates cleanly (e.g. 04-23-1998 ➔ 23 Apr, 1998) for notes, Zoom, and age checks."
      ],
      adminFeatures: [
        "⚡ Cross-Platform: Unified support for standard Bet88, GLife, and Maya Mini App profiles."
      ]
    },
    {
      version: "1.4.2",
      title: "Pre-Publish Validation & Library",
      date: "Previous",
      agentFeatures: [
        "🛡️ Error-Free Templates: Guarantees zero broken tags or missing tokens reach workstations.",
        "📚 Escalation Library: Auto-syncs with backend-managed escalation codes."
      ],
      adminFeatures: [
        "🛡️ 8-Point Pre-Publish Validation: Automatic schema check in Extension Settings & Web Admin.",
        "🚀 Draft ➔ Publish Pipeline: Stage and preview templates safely before publishing live."
      ]
    },
    {
      version: "1.4.1",
      title: "Clean Confirmation Modal",
      date: "Previous",
      agentFeatures: [
        "✨ Decluttered Modal: Clean Name / DOB display without extra tag overlays."
      ],
      adminFeatures: [
        "⚡ Faster Review: Quicker visual scanning during escalation confirmation."
      ]
    },
    {
      version: "1.4.0",
      title: "Button Color Palettes",
      date: "Previous",
      agentFeatures: [
        "🎨 Designer Palettes: Modern Pro, Soft Pastel, and Jewel Rich color themes.",
        "🎛️ 1-Click Switcher: Change button themes instantly in Settings > Escalation Buttons."
      ],
      adminFeatures: [
        "👑 Team Styling: Easily customize button aesthetics with Cloud Sync."
      ]
    },
    {
      version: "1.3.9",
      title: "Minimalist Design",
      date: "Previous",
      agentFeatures: [
        "🪟 Minimalist Bar & Satin Buttons: Clean, glare-free dark design with crisp borders.",
        "🎨 Eye-Friendly Colors: Slate Steel, Forest Sage, Amber Bronze, and Royal Heather."
      ],
      adminFeatures: [
        "✨ SaaS Standard: Cohesive, professional visual identity."
      ]
    },
    {
      version: "1.3.8",
      title: "Layout & Theme Restoration",
      date: "Previous",
      agentFeatures: [
        "📐 Full-Width Grid: Escalation buttons stretch evenly across the entire bar.",
        "💾 Persistent Themes: Selected theme is permanently saved across browser sessions."
      ],
      adminFeatures: [
        "🛠️ Reliable Layout: Guaranteed layout stability across all browsers."
      ]
    }
  ];

  function openChangelogModal(forceRole) {
    const existing = document.getElementById("esc-changelog-overlay");
    if (existing) existing.remove();

    const isAdmin = forceRole ? forceRole === "admin" : isAdminLicense();
    const overlay = document.createElement("div");
    overlay.className = "esc-changelog-overlay";
    overlay.id = "esc-changelog-overlay";

    const roleBadgeHtml = isAdmin
      ? `<span class="esc-role-badge is-admin" title="Full Master Control View">👑 Admin View</span>`
      : `<span class="esc-role-badge is-agent" title="Escalation Tools View">⚡ Agent View</span>`;

    let cardsHtml = "";
    CHANGELOG_HISTORY.forEach(item => {
      let adminSecHtml = "";
      if (isAdmin && Array.isArray(item.adminFeatures) && item.adminFeatures.length > 0) {
        adminSecHtml = `
          <div class="esc-release-section">
            <div class="esc-release-section-title is-admin">
              <span>🛡️ Admin Updates</span>
            </div>
            <ul class="esc-release-list">
              ${item.adminFeatures.map(f => `<li>${safeEsc(f)}</li>`).join("")}
            </ul>
          </div>
        `;
      }

      let agentSecHtml = "";
      if (Array.isArray(item.agentFeatures) && item.agentFeatures.length > 0) {
        agentSecHtml = `
          <div class="esc-release-section">
            <div class="esc-release-section-title is-agent">
              <span>✨ Highlights</span>
            </div>
            <ul class="esc-release-list">
              ${item.agentFeatures.map(f => `<li>${safeEsc(f)}</li>`).join("")}
            </ul>
          </div>
        `;
      }

      cardsHtml += `
        <div class="esc-release-card">
          <div class="esc-release-header">
            <div class="esc-release-ver">
              <span>v${safeEsc(item.version)}</span>
              <span style="font-size: 13px; color: #94a3b8; font-weight: 600;">• ${safeEsc(item.title)}</span>
            </div>
            <span class="esc-release-tag">${safeEsc(item.date)}</span>
          </div>
          ${adminSecHtml}
          ${agentSecHtml}
        </div>
      `;
    });

    overlay.innerHTML = `
      <div class="esc-changelog-modal" role="dialog" aria-modal="true" aria-label="What's New">
        <div class="esc-changelog-header">
          <div class="esc-changelog-title-wrap">
            <div class="esc-changelog-title">
              <span>📜 What's New in hdjrzTools</span>
            </div>
            ${roleBadgeHtml}
          </div>
          <button type="button" class="esc-icon-btn" id="esc-changelog-close" title="Close (Esc)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div class="esc-changelog-body">
          ${cardsHtml}
        </div>
        <div class="esc-changelog-footer">
          <button type="button" class="esc-changelog-gotit-btn" id="esc-changelog-gotit">Got It, Let's Work! 🚀</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    activeModal = overlay;

    const close = () => {
      document.removeEventListener("keydown", onKeyDown, true);
      overlay.remove();
      if (activeModal === overlay) activeModal = null;
      syncPageScrollLock();
    };

    const onKeyDown = (e) => {
      if (e.key === "Escape" || e.key === "Enter") {
        e.preventDefault();
        e.stopPropagation();
        close();
      }
    };

    const closeBtn = overlay.querySelector("#esc-changelog-close");
    if (closeBtn) closeBtn.addEventListener("click", close);
    const gotItBtn = overlay.querySelector("#esc-changelog-gotit");
    if (gotItBtn) gotItBtn.addEventListener("click", close);
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) close();
    });
    document.addEventListener("keydown", onKeyDown, true);
  }

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
        if (cb) cb();
      });
      return;
    }
    const payload = { hdjrzLicenseRole: licenseRole };
    const savedKey = String(licenseKey || "").trim();
    if (savedKey) payload.hdjrzLicenseKey = savedKey;
    api.set(payload, () => {
      if (cb) cb();
    });
  }

  function loadLicenseRole(cb) {
    const api = localStorageApi();
    if (!api) {
      if (cb) cb();
      return;
    }
    api.get(["hdjrzLicenseRole"], (data) => {
      const r = data && data.hdjrzLicenseRole;
      licenseRole = (r === "admin" || r === "guest") ? r : (r === "staff" ? "guest" : "");
      if (cb) cb();
    });
  }

  const LICENSE_FETCH_MS = 10000;

  function sendWorkerRequest(opts, cb) {
    const url = opts.url;
    const method = opts.method || "GET";
    const data = opts.data || null;
    const headers = opts.headers || {};
    const timeout = opts.timeout || LICENSE_FETCH_MS;

    let settled = false;
    const finish = (err, respData, status) => {
      if (settled) return;
      settled = true;
      if (cb) cb(err, respData, status);
    };

    const hasGM = typeof GM_xmlhttpRequest !== "undefined" && typeof GM_xmlhttpRequest === "function";

    function execGM() {
      try {
        const payloadStr = data ? (typeof data === "string" ? data : JSON.stringify(data)) : undefined;
        const reqHeaders = { "Accept": "application/json", ...headers };
        if (payloadStr && !reqHeaders["Content-Type"]) reqHeaders["Content-Type"] = "application/json";

        GM_xmlhttpRequest({
          method,
          url,
          headers: reqHeaders,
          data: payloadStr,
          timeout,
          onload: (resp) => {
            try {
              const parsed = JSON.parse(resp.responseText);
              if (resp.status >= 400) {
                finish((parsed && (parsed.message || parsed.error)) || `HTTP ${resp.status}`, parsed, resp.status);
                return;
              }
              finish(null, parsed, resp.status);
            } catch (e) {
              finish(null, resp.responseText, resp.status);
            }
          },
          onerror: (err) => {
            finish(err && err.message ? err.message : "GM request failed", null, 0);
          },
          ontimeout: () => {
            finish("timeout", null, 0);
          }
        });
      } catch (e) {
        finish(e && e.message ? e.message : "GM exception", null, 0);
      }
    }

    // Direct native fetch (HTTP/2 persistent connection, 0ms Tampermonkey IPC overhead, bypasses MV3 background suspension)
    if (typeof fetch === "function") {
      const ctrl = (typeof AbortController !== "undefined") ? new AbortController() : null;
      const timer = setTimeout(() => {
        try { if (ctrl) ctrl.abort(); } catch (_) {}
        if (hasGM) execGM();
        else finish("timeout", null, 0);
      }, timeout);

      const reqHeaders = { "Accept": "application/json", ...headers };
      const body = data ? (typeof data === "string" ? data : JSON.stringify(data)) : undefined;
      if (body && !reqHeaders["Content-Type"]) reqHeaders["Content-Type"] = "application/json";

      fetch(url, {
        method,
        headers: reqHeaders,
        body,
        cache: "no-store",
        signal: ctrl ? ctrl.signal : undefined
      })
      .then(res => {
        clearTimeout(timer);
        return res.json().catch(() => ({})).then(json => {
          if (!res.ok) {
            finish((json && (json.message || json.error)) || `HTTP ${res.status}`, json, res.status);
            return;
          }
          finish(null, json, res.status);
        });
      })
      .catch((err) => {
        clearTimeout(timer);
        // Fallback to GM_xmlhttpRequest if native fetch encountered CORS or network restriction
        if (hasGM) {
          execGM();
        } else {
          finish(err && err.message ? err.message : "offline", null, 0);
        }
      });
      return;
    }

    if (hasGM) {
      execGM();
      return;
    }

    finish("No HTTP transport available", null, 0);
  }

  function postLicenseServer(payload, cb) {
    sendWorkerRequest({
      url: LICENSE_ACTIVATE_URL,
      method: "POST",
      data: payload
    }, (err, data) => {
      cb(err, data || {});
    });
  }

  function activateLicenseOnServer(key, cb) {
    ensureLicenseDeviceId((deviceId) => {
      postLicenseServer({ key, deviceId, version: SCRIPT_VERSION, agent: currentSettings.agentName || "" }, (err, data) => {
        if (err) {
          cb(err);
          return;
        }
        if (data && (data.error === "outdated_version" || data.error === "kill_switch")) {
          triggerEmergencyLockout({
            reason: data.error,
            minRequiredVersion: data.minRequiredVersion,
            latestVersion: data.latestVersion,
            message: data.message
          });
          cb(data.error);
          return;
        }
        if (data && data.latestVersion) {
          setLatestServerVersion(data);
        }
        const role = data && data.role;
        if (data && data.ok && (role === "admin" || role === "guest" || role === "staff")) {
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
      sendWorkerRequest({
        url: LICENSE_ACTIVATE_URL,
        method: "POST",
        data: { key, deviceId, action: "release" }
      }, () => done());
    });
  }

  const REMOTE_CONFIG_URL = "https://hdjrz-license.rosechel05.workers.dev/config/templates";

  function publishTemplatesToCloud(options, cb) {
    const api = localStorageApi();
    if (!api) {
      if (cb) cb("Storage API unavailable");
      return;
    }
    api.get(["hdjrzLicenseKey"], (data) => {
      const key = (data && String(data.hdjrzLicenseKey || "").trim()) || "";
      if (!key) {
        if (cb) cb("No license key found");
        return;
      }
      sendWorkerRequest({
        url: REMOTE_CONFIG_URL,
        method: "POST",
        data: { key, options }
      }, (err, json) => {
        if (!err && json && json.ok) {
          currentSettings.remoteTemplatesVersion = json.version;
          saveSettings({}, null, options, () => {
            if (cb) cb(null, json);
          });
        } else {
          if (cb) cb(err || (json && json.error) || "Publish failed");
        }
      });
    });
  }

  function openPrePublishValidationModal(options, cb) {
    const api = localStorageApi();
    if (!api) {
      if (cb) cb("Storage API unavailable");
      return;
    }

    api.get(["hdjrzLicenseKey"], (data) => {
      const key = (data && String(data.hdjrzLicenseKey || "").trim()) || "";
      if (!key) {
        showToast("Error: No admin license key found.");
        if (cb) cb("No license key");
        return;
      }

      const existing = document.getElementById("esc-val-modal-overlay");
      if (existing) existing.remove();

      const modalOverlay = document.createElement("div");
      modalOverlay.className = "esc-modal-overlay";
      modalOverlay.id = "esc-val-modal-overlay";
      modalOverlay.style.zIndex = "1000005";

      modalOverlay.innerHTML = `
        <div class="esc-modal esc-val-modal-card" role="dialog" aria-modal="true" aria-label="Template Validation">
          <div class="esc-val-header">
            <div>
              <div class="esc-val-title">VALIDATION</div>
              <div class="esc-val-sub">Pre-publishing system &amp; schema verification</div>
            </div>
            <span class="esc-val-candidate-badge" id="esc-val-candidate-tag">v... Candidate</span>
          </div>

          <div class="esc-val-checklist" id="esc-val-checklist">
            <div style="text-align: center; padding: 18px; color: #94a3b8;">
              <span class="esc-sync-icon is-spinning" style="display:inline-block; margin-right:6px;">🔄</span>
              Running 8-point pre-publish verification...
            </div>
          </div>

          <div id="esc-val-error-summary" class="esc-val-error-box" style="display: none;"></div>

          <div class="esc-val-footer">
            <button type="button" class="esc-val-btn esc-val-btn-cancel" id="esc-val-cancel-btn">Cancel</button>
            <button type="button" class="esc-val-btn esc-val-btn-publish" id="esc-val-publish-btn" disabled>Publish</button>
          </div>
        </div>
      `;

      document.body.appendChild(modalOverlay);

      const cancelBtn = modalOverlay.querySelector("#esc-val-cancel-btn");
      const publishBtn = modalOverlay.querySelector("#esc-val-publish-btn");
      const checklistContainer = modalOverlay.querySelector("#esc-val-checklist");
      const errorBox = modalOverlay.querySelector("#esc-val-error-summary");
      const candidateTag = modalOverlay.querySelector("#esc-val-candidate-tag");

      const closeModal = () => {
        modalOverlay.remove();
        if (cb) cb(null, { cancelled: true });
      };

      cancelBtn.addEventListener("click", closeModal);
      modalOverlay.addEventListener("click", (e) => {
        if (e.target === modalOverlay) closeModal();
      });

      // 1. Save draft to backend first
      sendWorkerRequest({
        url: "https://hdjrz-license.rosechel05.workers.dev/api/templates/draft",
        method: "POST",
        data: { key, options, notes: "Draft from extension settings" }
      }, (draftErr, draftRes) => {
        if (draftErr || !draftRes || !draftRes.ok) {
          checklistContainer.innerHTML = `<div style="color: #fca5a5; padding: 10px;">Failed saving draft: ${safeEsc(draftErr || (draftRes && draftRes.error) || "Network error")}</div>`;
          return;
        }

        // 2. Fetch preview to determine candidate version and run validation check
        sendWorkerRequest({
          url: "https://hdjrz-license.rosechel05.workers.dev/api/templates/preview?key=" + encodeURIComponent(key),
          method: "GET"
        }, (prevErr, prevRes) => {
          if (prevErr || !prevRes || !prevRes.ok) {
            checklistContainer.innerHTML = `<div style="color: #fca5a5; padding: 10px;">Validation request failed: ${safeEsc(prevErr || (prevRes && prevRes.error) || "Network error")}</div>`;
            return;
          }

          const prodVer = (prevRes.production && typeof prevRes.production.version === "number") ? prevRes.production.version : 0;
          const targetVer = prodVer + 1;
          candidateTag.textContent = `v${targetVer} Candidate`;
          publishBtn.textContent = `Publish v${targetVer}`;

          const checks = prevRes.draft && Array.isArray(prevRes.draft.validationChecks) ? prevRes.draft.validationChecks : [];
          const isValid = prevRes.draft && prevRes.draft.validated === true;

          if (!checks.length) {
            checklistContainer.innerHTML = `<div style="color: #cbd5e1; padding: 10px;">Validation checks completed.</div>`;
          } else {
            checklistContainer.innerHTML = checks.map(c => {
              const isPassed = c.passed === true;
              return `
                <div class="esc-val-item ${isPassed ? "passed" : "failed"}">
                  <span>${isPassed ? "✓" : "✗"} ${safeEsc(c.label)}</span>
                  <span class="esc-val-status">${isPassed ? "Verified" : "Failed"}</span>
                </div>
              `;
            }).join("");
          }

          if (isValid) {
            publishBtn.disabled = false;
            errorBox.style.display = "none";
          } else {
            publishBtn.disabled = true;
            errorBox.style.display = "block";
            const errList = prevRes.draft.validationErrors || [];
            errorBox.innerHTML = `<strong>Validation Blocking Release:</strong><br>${errList.map(e => "• " + safeEsc(e)).join("<br>")}`;
          }

          // 3. Handle Publish Click
          publishBtn.addEventListener("click", () => {
            publishBtn.disabled = true;
            publishBtn.textContent = `Publishing v${targetVer}...`;

            sendWorkerRequest({
              url: "https://hdjrz-license.rosechel05.workers.dev/api/templates/draft/publish",
              method: "POST",
              data: { key }
            }, (pubErr, pubRes) => {
              if (!pubErr && pubRes && pubRes.ok) {
                currentSettings.remoteTemplatesVersion = pubRes.version;
                currentSettings.customOptions = options;
                saveSettings({}, null, options, () => {
                  updateHorizontalDockButtons();
                  modalOverlay.remove();
                  const totalActive = (pubRes && typeof pubRes.totalActiveAgents === "number") ? pubRes.totalActiveAgents : 0;
                  showToast(`🚀 Published to Cloud (v${pubRes.version})! Broadcast sent to ${totalActive} active agent(s).`);
                  if (cb) cb(null, pubRes);
                });
              } else {
                publishBtn.disabled = false;
                publishBtn.textContent = `Publish v${targetVer}`;
                alert("Publish failed: " + (pubErr || (pubRes && pubRes.error) || "Unknown error"));
              }
            });
          });
        });
      });
    });
  }

  function updateEscalationDictionary(options) {
    const list = Array.isArray(options) ? options : [];
    list.forEach(opt => {
      if (opt && opt.code) {
        if (typeof window !== "undefined" && window.EscalationDictionary) {
          window.EscalationDictionary[opt.code] = opt;
        }
        if (typeof globalThis !== "undefined" && globalThis.EscalationDictionary) {
          globalThis.EscalationDictionary[opt.code] = opt;
        }
      }
    });
  }

  function applyRemoteOptionsLive(normalized, remoteVer, isBroadcast) {
    currentSettings.customOptions = normalized;
    currentSettings.remoteTemplatesVersion = remoteVer;
    updateEscalationDictionary(normalized);
    saveSettings({}, null, normalized, () => {
      updateHorizontalDockButtons();
      const modal = document.getElementById("esc-settings-overlay");
      if (modal && typeof modal._escRenderOptionsList === "function") {
        modal._escRenderOptionsList();
      }
    });
    if (!isBroadcast && typeof BroadcastChannel !== "undefined") {
      try {
        const ch = new BroadcastChannel("hdjrz_kyc_channel");
        ch.postMessage({ action: "SYNC_TEMPLATES_LIVE", version: remoteVer, options: normalized });
        setTimeout(() => ch.close(), 1000);
      } catch (e) {}
    }
  }

  if (typeof BroadcastChannel !== "undefined") {
    try {
      const syncBc = new BroadcastChannel("hdjrz_kyc_channel");
      syncBc.addEventListener("message", (ev) => {
        if (ev.data && ev.data.action === "SYNC_TEMPLATES_LIVE" && Array.isArray(ev.data.options)) {
          applyRemoteOptionsLive(ev.data.options, ev.data.version || 1, true);
        } else if (ev.data && ev.data.action === "EMERGENCY_LOCKOUT" && ev.data.payload) {
          triggerEmergencyLockout(ev.data.payload, true);
        } else if (ev.data && ev.data.action === "NEW_VERSION_ACTIVATED") {
          if (isLockedOut) {
            window.location.reload();
          }
        }
      });
    } catch (e) {}
  }

  let latestKnownServerVersion = null;
  let latestUpdateData = null;

  function setLatestServerVersion(data) {
    if (!data) return;
    let v = null;
    const isAdmin = isAdminLicense();
    if (isAdmin) {
      v = (data.systemConfig && data.systemConfig.adminLatestVersion) || data.adminLatestVersion || (data.systemConfig && data.systemConfig.latestVersion) || data.latestVersion;
    } else {
      v = (data.systemConfig && data.systemConfig.agentLatestVersion) || data.agentLatestVersion || (data.systemConfig && data.systemConfig.latestVersion) || data.latestVersion;
    }
    if (!v) return;
    latestKnownServerVersion = v;
    const defaultUpdateUrl = isAdmin
      ? "https://hdjrz-license.rosechel05.workers.dev/script.user.js?channel=admin"
      : "https://hdjrz-license.rosechel05.workers.dev/script.user.js";
    latestUpdateData = {
      latestVersion: v,
      adminLatestVersion: data.adminLatestVersion || (data.systemConfig && data.systemConfig.adminLatestVersion),
      agentLatestVersion: data.agentLatestVersion || (data.systemConfig && data.systemConfig.agentLatestVersion),
      releaseChannel: data.releaseChannel || (data.systemConfig && data.systemConfig.releaseChannel) || (isAdmin ? "admin" : "fleet"),
      minRequiredVersion: (data.systemConfig && data.systemConfig.minRequiredVersion) || data.minRequiredVersion || "1.1.4",
      updateUrl: data.updateUrl || defaultUpdateUrl
    };
    if (isVersionBelow(SCRIPT_VERSION, v)) {
      attachDockUpdatePill(latestUpdateData);
      renderSettingsUpdateControls();
    }
  }

  function attachDockUpdatePill(data) {
    const latestVer = (data && data.latestVersion) || latestKnownServerVersion;
    if (!latestVer || !isVersionBelow(SCRIPT_VERSION, latestVer)) return;
    const minReq = (data && data.minRequiredVersion) || (latestUpdateData && latestUpdateData.minRequiredVersion) || "1.1.4";
    const isRequired = isVersionBelow(SCRIPT_VERSION, minReq);

    const dock = document.getElementById("escalation-helper-dock");
    if (!dock) return;
    let pill = dock.querySelector("#esc-dock-update-pill");
    if (!pill) {
      const brand = dock.querySelector(".esc-brand");
      if (brand) {
        pill = document.createElement("span");
        pill.className = "esc-dock-update-pill";
        pill.id = "esc-dock-update-pill";
        pill.addEventListener("click", (e) => {
          e.stopPropagation();
          showNonBlockingUpdateNotification(data || latestUpdateData, true);
        });
        brand.appendChild(pill);
      }
    }
    if (pill) {
      pill.style.display = "inline-flex";
      if (isRequired) {
        pill.innerHTML = `⚠️ Required v${safeEsc(latestVer)}`;
        pill.style.background = "linear-gradient(135deg, #dc2626, #b91c1c)";
        pill.style.borderColor = "#f87171";
        pill.style.boxShadow = "0 0 10px rgba(239, 68, 68, 0.6)";
        pill.title = `CRITICAL: Required update to v${safeEsc(latestVer)} is mandatory`;
      } else {
        const isAdmin = isAdminLicense();
        pill.innerHTML = isAdmin ? `👑 Early Access v${safeEsc(latestVer)}` : `🚀 Update v${safeEsc(latestVer)}`;
        pill.style.background = isAdmin
          ? "linear-gradient(135deg, #d97706, #b45309)"
          : "linear-gradient(135deg, #0284c7, #2563eb)";
        pill.style.borderColor = isAdmin ? "#fbbf24" : "#38bdf8";
        pill.style.boxShadow = isAdmin ? "0 0 8px rgba(251, 191, 36, 0.4)" : "0 0 8px rgba(56, 189, 248, 0.4)";
        pill.title = `${isAdmin ? "Admin Early Access" : "Optional update"} to v${safeEsc(latestVer)} available`;
      }
    }
  }

  function checkScriptMetaVersion(cb) {
    const roleParam = isAdminLicense() ? "admin" : "guest";
    const channelParam = isAdminLicense() ? "&channel=admin" : "";
    sendWorkerRequest({
      url: `https://hdjrz-license.rosechel05.workers.dev/api/system/version?role=${roleParam}${channelParam}&ts=` + Date.now(),
      method: "GET"
    }, (err, res) => {
      let latestVer = null;
      let minReq = "1.1.4";
      let updateUrl = isAdminLicense()
        ? "https://hdjrz-license.rosechel05.workers.dev/script.user.js?channel=admin"
        : "https://hdjrz-license.rosechel05.workers.dev/script.user.js";
      if (!err && res && (res.latestVersion || (res.data && res.data.latestVersion))) {
        latestVer = res.latestVersion || res.data.latestVersion;
        minReq = res.minRequiredVersion || (res.data && res.data.minRequiredVersion) || "1.1.4";
        updateUrl = res.updateUrl || (res.data && res.data.updateUrl) || updateUrl;
        setLatestServerVersion({
          latestVersion: latestVer,
          adminLatestVersion: res.adminLatestVersion || (res.data && res.data.adminLatestVersion),
          agentLatestVersion: res.agentLatestVersion || (res.data && res.data.agentLatestVersion),
          minRequiredVersion: minReq,
          updateUrl: updateUrl
        });
        if (cb) cb(null, latestVer, minReq);
        return;
      }
      sendWorkerRequest({
        url: `https://hdjrz-license.rosechel05.workers.dev/script.meta.js?channel=${roleParam}&ts=` + Date.now(),
        method: "GET"
      }, (metaErr, text) => {
        if (metaErr || !text) {
          if (cb) cb(metaErr);
          return;
        }
        const match = String(text).match(/\/\/\s*@version\s+([0-9.]+)/i);
        if (match && match[1]) {
          const metaVer = match[1].trim();
          setLatestServerVersion({
            latestVersion: metaVer,
            minRequiredVersion: minReq,
            updateUrl: updateUrl
          });
          if (cb) cb(null, metaVer, minReq);
          return;
        }
        if (cb) cb(null, null, minReq);
      });
    });
  }

  function performInToolUpdate(targetVersion, updateUrl, onStatusUpdate) {
    if (typeof onStatusUpdate === "function") {
      onStatusUpdate(`🚀 Opening Tampermonkey update tab...`, true, false);
    }
    const defaultUrl = isAdminLicense()
      ? "https://hdjrz-license.rosechel05.workers.dev/script.user.js?channel=admin"
      : "https://hdjrz-license.rosechel05.workers.dev/script.user.js";
    const url = updateUrl || defaultUrl;
    try {
      if (typeof sessionStorage !== "undefined") {
        sessionStorage.setItem("esc_update_initiated", "true");
        sessionStorage.setItem("esc_just_updated", String(targetVersion));
        sessionStorage.setItem("esc_dismissed_update_ver", String(targetVersion));
      }
      window.__escUpdateInitiated = true;
    } catch (e) {}
    setTimeout(() => {
      window.open(url, "_blank");
    }, 400);
  }

  function renderSettingsUpdateControls() {
    const container = document.getElementById("esc-settings-update-container");
    if (!container) return;

    if (latestKnownServerVersion && isVersionBelow(SCRIPT_VERSION, latestKnownServerVersion)) {
      const minReq = (latestUpdateData && latestUpdateData.minRequiredVersion) || "1.1.4";
      const isRequired = isVersionBelow(SCRIPT_VERSION, minReq);

      const btnText = isRequired
        ? `⚠️ Required Update (v${safeEsc(latestKnownServerVersion)})`
        : `🚀 Optional Update (v${safeEsc(latestKnownServerVersion)})`;
      const btnBg = isRequired
        ? "linear-gradient(135deg, #ef4444, #dc2626)"
        : "linear-gradient(135deg, #0284c7, #2563eb)";
      const btnBorder = isRequired ? "#f87171" : "#38bdf8";
      const btnGlow = isRequired ? "rgba(239, 68, 68, 0.5)" : "rgba(56, 189, 248, 0.4)";

      container.innerHTML = `
        <button type="button" class="esc-settings-update-btn" id="esc-settings-update-now" style="margin-left: 8px; background: ${btnBg}; color: #fff; border: 1px solid ${btnBorder}; border-radius: 4px; padding: 2px 10px; font-size: 11px; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; box-shadow: 0 0 10px ${btnGlow};">
          ${btnText}
        </button>
      `;
      const btn = container.querySelector("#esc-settings-update-now");
      if (btn) {
        btn.addEventListener("click", () => {
          btn.disabled = true;
          const updateUrl = (latestUpdateData && latestUpdateData.updateUrl) || "https://hdjrz-license.rosechel05.workers.dev/script.user.js";
          performInToolUpdate(latestKnownServerVersion, updateUrl, (statusText, isDone, isError) => {
            btn.innerHTML = statusText;
            if (isDone) {
              btn.style.background = "linear-gradient(135deg, #10b981, #059669)";
              btn.style.borderColor = "#34d399";
            }
          });
        });
      }
    } else {
      container.innerHTML = `
        <button type="button" class="esc-btn-small" id="esc-settings-check-update" style="margin-left: 8px; background: rgba(148, 163, 184, 0.12); border: 1px solid rgba(148, 163, 184, 0.25); color: #94a3b8; border-radius: 4px; padding: 2px 8px; font-size: 11px; cursor: pointer;" title="Check server for newest version">
          🔄 Check for Update
        </button>
      `;
      const checkBtn = container.querySelector("#esc-settings-check-update");
      if (checkBtn) {
        checkBtn.addEventListener("click", () => {
          checkBtn.disabled = true;
          checkBtn.innerHTML = `⏳ Checking...`;
          fetchRemoteTemplates(() => {
            checkScriptMetaVersion(() => {
              if (latestKnownServerVersion && isVersionBelow(SCRIPT_VERSION, latestKnownServerVersion)) {
                renderSettingsUpdateControls();
                if (latestUpdateData) showNonBlockingUpdateNotification(latestUpdateData, true);
              } else {
                checkBtn.disabled = false;
                checkBtn.innerHTML = `✓ Up to date (v${safeEsc(SCRIPT_VERSION)})`;
                checkBtn.style.color = "#34d399";
                setTimeout(() => {
                  if (container && container.contains(checkBtn)) {
                    checkBtn.innerHTML = `🔄 Check for Update`;
                    checkBtn.style.color = "#94a3b8";
                  }
                }, 3000);
              }
            });
          });
        });
      }
    }
  }

  let activeUpdateBanner = null;
  function showNonBlockingUpdateNotification(data, isManual) {
    setLatestServerVersion(data);
    const latestVer = (data && data.latestVersion) || latestKnownServerVersion || "1.4.4";
    const updateUrl = (data && data.updateUrl) || (latestUpdateData && latestUpdateData.updateUrl) || "https://hdjrz-license.rosechel05.workers.dev/script.user.js";

    attachDockUpdatePill(data);

    // If installed version is already up to date, do not show banner
    if (!isVersionBelow(SCRIPT_VERSION, latestVer)) {
      return;
    }

    // If dismissed during this session, do not auto-popup unless manually clicked (dock pill or settings)
    try {
      if (!isManual && typeof sessionStorage !== "undefined" && sessionStorage.getItem("esc_dismissed_update_ver") === String(latestVer)) {
        return;
      }
    } catch (e) {}

    if (activeUpdateBanner && document.body && document.body.contains(activeUpdateBanner)) {
      return;
    }

    const minReq = (data && data.minRequiredVersion) || (latestUpdateData && latestUpdateData.minRequiredVersion) || "1.1.4";
    const isRequired = isVersionBelow(SCRIPT_VERSION, minReq);

    const bannerIcon = isRequired ? "⚠️" : "🚀";
    const bannerTitle = isRequired ? `Required Update: v${safeEsc(latestVer)}` : `Update Available: v${safeEsc(latestVer)}`;
    const bannerBadge = isRequired
      ? `<span style="font-size: 10px; font-weight: 800; background: rgba(239, 68, 68, 0.2); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.5); padding: 1px 6px; border-radius: 4px; margin-left: 6px;">REQUIRED</span>`
      : `<span style="font-size: 10px; font-weight: 800; background: rgba(56, 189, 248, 0.2); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.5); padding: 1px 6px; border-radius: 4px; margin-left: 6px;">OPTIONAL</span>`;
    const bannerDesc = isRequired
      ? `This update is required to ensure template compatibility and system stability. Please update as soon as possible.`
      : `A new optional version is ready! You can continue working uninterrupted and update whenever you have free time.`;

    const banner = document.createElement("div");
    banner.className = `esc-update-banner ${isRequired ? 'is-required' : ''}`;
    banner.id = "esc-update-banner";
    banner.innerHTML = `
      <div class="esc-banner-header">
        <div class="esc-banner-title-wrap">
          <span class="esc-banner-icon">${bannerIcon}</span>
          <div>
            <div class="esc-banner-title" style="display:flex;align-items:center;">${safeEsc(bannerTitle)} ${bannerBadge}</div>
            <div style="font-size: 11px; color: #64748b;">Current: v${safeEsc(SCRIPT_VERSION)}</div>
          </div>
        </div>
        <button type="button" class="esc-banner-close" id="esc-banner-dismiss" title="Dismiss for now">✕</button>
      </div>
      <div class="esc-banner-desc">
        ${safeEsc(bannerDesc)}
      </div>
      <div class="esc-banner-actions" id="esc-banner-actions">
        <button type="button" class="esc-banner-btn-primary" id="esc-banner-update-btn" style="${isRequired ? 'background: linear-gradient(135deg, #ef4444, #dc2626); border-color: #f87171;' : ''}">
          <span>${isRequired ? '⚠️ Update Now (Required)' : '🚀 Update Now'}</span>
        </button>
        <button type="button" class="esc-banner-btn-secondary" id="esc-banner-later-btn">Later</button>
      </div>
    `;

    document.body.appendChild(banner);
    activeUpdateBanner = banner;

    const dismissBanner = () => {
      try {
        if (typeof sessionStorage !== "undefined") {
          sessionStorage.setItem("esc_dismissed_update_ver", String(latestVer));
        }
      } catch (e) {}
      document.removeEventListener("keydown", onBannerKey, true);
      banner.classList.add("is-closing");
      setTimeout(() => {
        try { banner.remove(); } catch (e) {}
        if (activeUpdateBanner === banner) activeUpdateBanner = null;
      }, 250);
    };

    const onBannerKey = (e) => {
      if (e.key === "Escape") {
        if (document.querySelector(".esc-modal-overlay")) return;
        e.preventDefault();
        e.stopPropagation();
        dismissBanner();
      }
    };
    document.addEventListener("keydown", onBannerKey, true);

    const dismissBtn = banner.querySelector("#esc-banner-dismiss");
    if (dismissBtn) dismissBtn.addEventListener("click", dismissBanner);
    const laterBtn = banner.querySelector("#esc-banner-later-btn");
    if (laterBtn) laterBtn.addEventListener("click", dismissBanner);

    const updateBtn = banner.querySelector("#esc-banner-update-btn");
    if (updateBtn) {
      updateBtn.addEventListener("click", () => {
        updateBtn.disabled = true;
        performInToolUpdate(latestVer, updateUrl, (statusText, isDone, isError) => {
          updateBtn.innerHTML = `<span>${statusText}</span>`;
          if (isDone) {
            updateBtn.style.background = "linear-gradient(135deg, #10b981, #059669)";
          }
        });
      });
    }
  }

  let isLockedOut = false;
  function triggerEmergencyLockout(data, fromBroadcast) {
    if (data && data.reason === "outdated_version") {
      showNonBlockingUpdateNotification(data);
      return;
    }

    if (isLockedOut) return;
    isLockedOut = true;

    // Cross-tab synchronization: broadcast to sibling tabs immediately
    if (!fromBroadcast && typeof BroadcastChannel !== "undefined") {
      try {
        const ch = new BroadcastChannel("hdjrz_kyc_channel");
        ch.postMessage({ action: "EMERGENCY_LOCKOUT", payload: data });
        setTimeout(() => ch.close(), 1000);
      } catch (e) {}
    }

    // Remove toolbar dock from page
    if (dockElement) {
      try { dockElement.remove(); } catch (e) {}
      dockElement = null;
    }

    // Close any open overlays
    if (activeModal) {
      try { activeModal.remove(); } catch (e) {}
      activeModal = null;
    }
    const overlays = document.querySelectorAll(".esc-modal-overlay, #escalation-helper-dock");
    overlays.forEach(el => {
      try { el.remove(); } catch (e) {}
    });

    const isKill = data && data.reason === "kill_switch";
    const isDomain = data && data.reason === "unauthorized_domain";

    let title = "⚠️ Critical Update Required";
    let message = (data && data.message) || "Your version of hdjrzTools is out of date.";
    let icon = "⚠️";
    let actionBtnHtml = "";

    if (isKill) {
      title = "🛑 Emergency System Lock";
      icon = "🛑";
      message = (data && data.message) || "hdjrzTools is temporarily disabled for emergency maintenance.";
      actionBtnHtml = `<div class="esc-enforcement-help">Contact your system administrator if you believe this is an error.</div>`;
    } else if (isDomain) {
      title = "🚫 Unauthorized Domain";
      icon = "🚫";
      const host = (data && data.domain) || (typeof window !== "undefined" && window.location && window.location.hostname) || "this domain";
      message = `hdjrzTools is restricted to official authorized domains (${safeEsc(host)} is not permitted).`;
      actionBtnHtml = `<div class="esc-enforcement-help">Contact your system administrator for domain access.</div>`;
    } else {
      // Outdated version
      const minVer = (data && data.minRequiredVersion) || "1.1.6";
      const latestVer = (data && data.latestVersion) || "1.1.6";
      const updateUrl = (data && data.updateUrl) || "https://hdjrz-license.rosechel05.workers.dev/script.user.js";

      actionBtnHtml = `
        <div class="esc-enforcement-meta">
          <div class="esc-enforcement-meta-item">
            <span class="esc-enforcement-meta-label">Installed</span>
            <span class="esc-enforcement-meta-value is-bad">v${safeEsc(SCRIPT_VERSION)}</span>
          </div>
          <div class="esc-enforcement-meta-item">
            <span class="esc-enforcement-meta-label">Min Required</span>
            <span class="esc-enforcement-meta-value">v${safeEsc(minVer)}</span>
          </div>
          <div class="esc-enforcement-meta-item">
            <span class="esc-enforcement-meta-label">Latest</span>
            <span class="esc-enforcement-meta-value is-good">v${safeEsc(latestVer)}</span>
          </div>
        </div>
        <a href="${updateUrl}" target="_blank" rel="noopener noreferrer" class="esc-enforcement-btn" id="esc-enforce-update-btn">
          <span>🚀 Click Here to Update to v${safeEsc(latestVer)}</span>
        </a>
        <div class="esc-enforcement-help">Tampermonkey will open and prompt you to click "Update" with one click.</div>
      `;
    }

    const overlay = document.createElement("div");
    overlay.className = "esc-enforcement-overlay";
    overlay.id = "esc-enforcement-overlay";
    overlay.innerHTML = `
      <div class="esc-enforcement-modal ${isKill ? 'is-killswitch' : ''}" role="alertdialog" aria-modal="true">
        <div class="esc-enforcement-icon-wrap">${icon}</div>
        <div class="esc-enforcement-title">${safeEsc(title)}</div>
        <div class="esc-enforcement-text">${safeEsc(message)}</div>
        ${actionBtnHtml}
      </div>
    `;

    document.body.appendChild(overlay);

    const updateBtn = overlay.querySelector("#esc-enforce-update-btn");
    if (updateBtn) {
      updateBtn.addEventListener("click", () => {
        window.__escUpdateInitiated = true;
        try { sessionStorage.setItem("esc_update_initiated", "true"); } catch (e) {}

        const container = updateBtn.parentElement;
        if (container) {
          updateBtn.style.display = "none";
          const helpEl = container.querySelector(".esc-enforcement-help");
          if (helpEl) helpEl.style.display = "none";

          const reloadContainer = document.createElement("div");
          reloadContainer.className = "esc-update-progress-container";
          reloadContainer.id = "esc-update-progress-container";
          reloadContainer.innerHTML = `
            <div class="esc-update-step-card">
              <div class="esc-update-step-item">
                <span class="esc-step-icon">1️⃣</span>
                <span>Click <strong>"Update"</strong> in the Tampermonkey tab that just opened.</span>
              </div>
              <div class="esc-update-step-item is-active">
                <span class="esc-step-icon">2️⃣</span>
                <span>Click the button below to reload and activate <strong>v${safeEsc((data && data.latestVersion) || "1.1.9")}</strong>.</span>
              </div>
            </div>
            <button type="button" class="esc-enforcement-btn esc-reload-btn is-pulsing" id="esc-enforce-reload-btn">
              <span>🔄 Click Here to Reload Page</span>
            </button>
            <div class="esc-enforcement-help" id="esc-auto-reload-status" style="margin-top: 10px; color: #38bdf8; font-weight: 500;">
              (Or switch back to this tab after updating — it will reload automatically!)
            </div>
          `;
          container.appendChild(reloadContainer);

          const reloadBtn = reloadContainer.querySelector("#esc-enforce-reload-btn");
          if (reloadBtn) {
            reloadBtn.addEventListener("click", () => {
              reloadBtn.disabled = true;
              reloadBtn.innerHTML = `<span>⏳ Reloading...</span>`;
              window.location.reload();
            });
          }
        }
      });
    }

    // Stop keyboard shortcut triggers while locked out
    const blockKey = (e) => {
      e.stopImmediatePropagation();
    };
    window.addEventListener("keydown", blockKey, true);
  }

  let lastRemoteHeartbeatTime = 0;
  function fetchRemoteTemplates(cb) {
    if (isLockedOut) return;
    lastRemoteHeartbeatTime = Date.now();
    const api = localStorageApi();
    const getCreds = (done) => {
      if (!api) return done("", "");
      api.get(["hdjrzLicenseDeviceId", "hdjrzLicenseKey"], (d) => {
        done((d && d.hdjrzLicenseDeviceId) || "", (d && d.hdjrzLicenseKey) || "");
      });
    };

    getCreds((devId, key) => {
      const agent = encodeURIComponent(currentSettings.agentName || "");
      const v = encodeURIComponent(SCRIPT_VERSION);
      const tmplVer = currentSettings.remoteTemplatesVersion || 0;
      const domain = encodeURIComponent((typeof window !== "undefined" && window.location && window.location.hostname) || "");
      const k = encodeURIComponent(key || "");
      const roleParam = isAdminLicense() ? "admin" : "guest";
      const url = `${REMOTE_CONFIG_URL}?agent=${agent}&v=${v}&tmpl_v=${tmplVer}&dev=${encodeURIComponent(devId)}&key=${k}&role=${roleParam}&domain=${domain}&_t=${Date.now()}`;

      sendWorkerRequest({ url, method: "GET" }, (err, json) => {
        if (err || !json) {
          console.warn(`[hdjrzTools] Policy Heartbeat network error (Installed: v${SCRIPT_VERSION}):`, err);
          if (cb) cb(err || "Network error");
          return;
        }

        console.log(`[hdjrzTools] Policy Heartbeat (Installed: v${SCRIPT_VERSION}):`, json);
        if (Array.isArray(json.activeUsers)) {
          lastKnownActiveUsers = json.activeUsers;
          const userCountEl = document.getElementById("esc-active-users-count");
          if (userCountEl) userCountEl.textContent = String(lastKnownActiveUsers.length);
          const userListEl = document.getElementById("esc-active-users-list");
          if (userListEl && typeof renderActiveUsersListHtml === "function") {
            userListEl.innerHTML = renderActiveUsersListHtml();
          }
        }
        if (json.blocked) {
          if (json.reason === "outdated_version") {
            setLatestServerVersion(json);
            showNonBlockingUpdateNotification(json);
          } else {
            triggerEmergencyLockout(json);
          }
          if (cb) cb(json.message || "Execution blocked by remote policy", json);
          return;
        }

        setLatestServerVersion(json);
        const latestVer = latestKnownServerVersion;
        if (latestVer && isVersionBelow(SCRIPT_VERSION, latestVer)) {
          showNonBlockingUpdateNotification({
            latestVersion: latestVer,
            minRequiredVersion: (json.systemConfig && json.systemConfig.minRequiredVersion) || json.minRequiredVersion || "1.1.4",
            updateUrl: (latestUpdateData && latestUpdateData.updateUrl) || json.updateUrl || "https://hdjrz-license.rosechel05.workers.dev/script.user.js"
          });
        }

        const fleetSound = (json.systemConfig && json.systemConfig.fleetSuccessSound) || json.fleetSuccessSound;
        if (fleetSound && fleetSound !== currentSettings.successSound) {
          currentSettings.successSound = fleetSound;
          const api = localStorageApi();
          if (api) {
            api.get(["escalationSettings"], (st) => {
              const cur = (st && st.escalationSettings) || {};
              cur.successSound = fleetSound;
              api.set({ escalationSettings: cur });
            });
          }
        }

        if (!json.ok || !Array.isArray(json.options) || json.options.length === 0) {
          if (cb) cb((json && json.error) ? json.error : null, json);
          return;
        }

        const remoteVer = json.version || 1;
        const currentVer = currentSettings.remoteTemplatesVersion || 0;
        const normalized = json.options.map(normalizeEscalationOption);

        if (remoteVer > currentVer) {
          applyRemoteOptionsLive(normalized, remoteVer, false);
          if (cb) cb(null, { updated: true, version: remoteVer, telemetry: json });
        } else {
          if (cb) cb(null, { updated: false, version: currentVer, telemetry: json });
        }
      });
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

  function applyBarTheme() {
    const dock = dockElement || document.getElementById("escalation-helper-dock");
    if (!dock) return;
    dock.classList.remove(
      "esc-theme-minimal-glass", "esc-theme-obsidian-matte", "esc-theme-slate-nordic", "esc-theme-mocha-dark",
      "esc-theme-frosted", "esc-theme-cyber", "esc-theme-compact", "esc-theme-classic",
      "esc-accent-cyan", "esc-accent-purple", "esc-accent-emerald", "esc-accent-sunset"
    );
    let theme = String(currentSettings.barTheme || "minimal-glass").trim().toLowerCase();
    if (theme === "frosted" || theme === "frosted-cyan") theme = "minimal-glass";
    else if (theme === "frosted-purple") theme = "obsidian-matte";
    else if (theme === "frosted-emerald") theme = "slate-nordic";
    else if (theme === "frosted-sunset") theme = "mocha-dark";

    const validThemes = ["minimal-glass", "obsidian-matte", "slate-nordic", "mocha-dark"];
    if (!validThemes.includes(theme)) {
      theme = "minimal-glass";
    }
    currentSettings.barTheme = theme;
    dock.classList.add(`esc-theme-${theme}`);
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
      overlay.id === "esc-license-overlay" ||
      overlay.id === "esc-support-overlay"
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
    if (e.target && e.target.closest && e.target.closest(".esc-modal-body, .esc-settings-body, .esc-reason-pick-card, .esc-modal, .esc-audit-list, .esc-edit-option-modal, .esc-license-card, .esc-support-modal, .esc-support-body, .esc-support-thread-msgs")) return;
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

  function ageFromDob(dobStr) {
    if (typeof window !== "undefined" && typeof window.ageFromDob === "function") {
      return window.ageFromDob(dobStr);
    }
    const raw = String(dobStr || "").trim();
    if (!raw) return "";
    let d = new Date(raw);
    if (isNaN(d.getTime())) {
      const m = raw.match(/^(\d{1,2})\s+([A-Za-z]{3,9}),?\s+(\d{4})$/);
      if (m) d = new Date(`${m[2]} ${m[1]}, ${m[3]}`);
    }
    if (isNaN(d.getTime())) {
      const mdy = raw.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
      if (mdy) {
        let p1 = parseInt(mdy[1], 10);
        let p2 = parseInt(mdy[2], 10);
        const y = parseInt(mdy[3], 10);
        let month = p1 - 1;
        let day = p2;
        if (p1 > 12 && p2 <= 12) {
          day = p1;
          month = p2 - 1;
        }
        d = new Date(y, month, day);
      }
    }
    if (isNaN(d.getTime())) return "";
    const today = new Date();
    let age = today.getFullYear() - d.getFullYear();
    const monthDiff = today.getMonth() - d.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < d.getDate())) age -= 1;
    if (age < 0 || age > 120) return "";
    return String(age);
  }

  function getPagcorAgeInfo(dobStr) {
    if (typeof window !== "undefined" && typeof window.getPagcorAgeInfo === "function") {
      return window.getPagcorAgeInfo(dobStr);
    }
    const ageStr = ageFromDob(dobStr);
    if (!ageStr) return null;
    const age = parseInt(ageStr, 10);
    if (isNaN(age)) return null;

    if (age < 18) {
      return {
        age,
        status: "Minor (< 18)",
        bracketLabel: "Minor",
        badgeClass: "is-minor",
        badgeIcon: "🔴",
        badgeText: `Minor (${age})`,
        bracket: "Minor (< 18)",
        noteText: `${age} (Minor < 18)`
      };
    } else if (age < 21) {
      return {
        age,
        status: "PAGCOR Restricted (18 to 20)",
        bracketLabel: "Restricted",
        badgeClass: "is-pagcor-restricted",
        badgeIcon: "🟠",
        badgeText: `Restricted (${age})`,
        bracket: "PAGCOR Restricted (18 to 20)",
        noteText: `${age} (PAGCOR Restricted 18-20)`
      };
    } else {
      return {
        age,
        status: "Legal (21+)",
        bracketLabel: "Legal Age",
        badgeClass: "is-legal",
        badgeIcon: "🟢",
        badgeText: `Legal Age (${age})`,
        bracket: "Legal (21+)",
        noteText: `${age} (Legal Age)`
      };
    }
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
    const rawDob = (data && (data.dob || data.dateOfBirth)) || "";
    const pagcor = getPagcorAgeInfo(rawDob);

    const replacements = {
      "[User ID]": combined || effectiveUserId,
      "[CID]": cidVal,
      "[Reason]": reasonVal,
      "[CODE]": codeVal,
      "[Meaning]": meaningVal,
      "[Name]": (data && data.name) || "",
      "[DOB]": rawDob,
      "[Dob]": rawDob,
      "[AGE]": (data && data.age) || ageFromDob(rawDob),
      "[PAGCOR AGE]": pagcor ? pagcor.bracket : "",
      "[AGE BRACKET]": pagcor ? pagcor.bracket : "",
      "[AGE WITH STATUS]": pagcor ? pagcor.noteText : ((data && data.age) || ageFromDob(rawDob)),
      "[Verified UID]": (data && data.verifiedUid) || "",
      "[New Account UID]": (data && data.newAccountUid) || "",
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
      "{dob}": rawDob,
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

    text = text.replace(/\s*\(\s*\)/g, "");

    return text.trim();
  }

  function applyTlMentionsToZoomNote(text) {
    if (!text) return "";
    const m = (currentSettings.tlMentions != null ? String(currentSettings.tlMentions) : "@Jetro").trim();
    const pasuyoRegex = /(?:Pasuyo(?:\s+po)?\s+TLs?)(?:\s+@[^\r\n]*)?/i;
    if (pasuyoRegex.test(text)) {
      return text.replace(pasuyoRegex, m ? `Pasuyo po TLs ${m}` : "Pasuyo po TLs");
    } else if (m) {
      return text.trim() + `\n\nPasuyo po TLs ${m}`;
    }
    return text;
  }

  /**
   * Safe renderer for final 5-line Zoom note
   */
  function safeRenderFinalEscalationNote(data, customTemplate) {
    if (typeof window !== "undefined" && typeof window.renderFinalEscalationNote === "function") {
      try {
        return applyTlMentionsToZoomNote(window.renderFinalEscalationNote(data, customTemplate, currentSettings.tlMentions));
      } catch (err) {
        console.warn("window.renderFinalEscalationNote error, using safe fallback:", err);
      }
    }
    if (typeof globalThis !== "undefined" && typeof globalThis.renderFinalEscalationNote === "function") {
      try {
        return applyTlMentionsToZoomNote(globalThis.renderFinalEscalationNote(data, customTemplate, currentSettings.tlMentions));
      } catch (err) {
        console.warn("globalThis.renderFinalEscalationNote error, using safe fallback:", err);
      }
    }
    const tpl = customTemplate || (typeof window !== "undefined" && window.DEFAULT_FINAL_NOTE_TEMPLATE) || `{meaning}\n\nUser ID: {userCombined}\nReason: {reason}\nCID: {cid}\nNotes/tracker added`;
    return applyTlMentionsToZoomNote(safeRenderEscalationNote(tpl, data));
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

  const BIT88_NOTES_WORDING_VERSION = 29;
  let loadedWordingVersion = 0;

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
    const storedVer = currentSettings.notesWordingVersion || 0;
    if (storedVer >= BIT88_NOTES_WORDING_VERSION) {
      loadedWordingVersion = storedVer;
      return false;
    }
    if (loadedWordingVersion === BIT88_NOTES_WORDING_VERSION) return false;
    const presets = getPresetOptionsList();
    const byCode = {};
    presets.forEach(opt => {
      if (opt && opt.code) byCode[opt.code] = opt;
    });
    const saved = Array.isArray(currentSettings.customOptions) ? currentSettings.customOptions : [];
    if (saved.length) {
      const oldMutedOrLegacyColors = new Set([
        "#2b5278", "#1e3a5f", "#5c2429", "#1b5e43", "#234d47", "#6b4317",
        "#443566", "#522b6d", "#3f2757", "#692949", "#265261", "#1f534d",
        "#133d39", "#2d3748", "#334155", "#7f1d1d", "#db2777"
      ]);
      currentSettings.customOptions = saved.map(opt => {
        const preset = byCode[opt && opt.code];
        if (!preset) return opt;
        const copy = { ...opt };
        if (!copy.color || oldMutedOrLegacyColors.has(copy.color)) {
          copy.color = preset.color || copy.color;
        }
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
    loadedWordingVersion = BIT88_NOTES_WORDING_VERSION;
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
        barTheme: currentSettings.barTheme || "minimal-glass",
        soundFeedback: currentSettings.soundFeedback !== false,
        notesWordingVersion: currentSettings.notesWordingVersion || 0,
        remoteTemplatesVersion: currentSettings.remoteTemplatesVersion || 0,
        tlMentions: currentSettings.tlMentions != null ? currentSettings.tlMentions : "@Jetro",
        successSound: currentSettings.successSound || "voice"
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
    let theme = String(currentSettings.barTheme || "minimal-glass").trim().toLowerCase();
    if (theme === "frosted" || theme === "frosted-cyan") theme = "minimal-glass";
    else if (theme === "frosted-purple") theme = "obsidian-matte";
    else if (theme === "frosted-emerald") theme = "slate-nordic";
    else if (theme === "frosted-sunset") theme = "mocha-dark";
    const validThemes = ["minimal-glass", "obsidian-matte", "slate-nordic", "mocha-dark"];
    if (!validThemes.includes(theme)) {
      theme = "minimal-glass";
    }
    currentSettings.barTheme = theme;
    if (data && data.customTemplates) {
      currentSettings.customTemplates = { ...currentSettings.customTemplates, ...data.customTemplates };
    }
    if (data && Array.isArray(data.customOptions)) {
      currentSettings.customOptions = data.customOptions;
    }
    applyBarTheme();
  }

  function hasStoredSettings(data) {
    return !!(data && (data.escalationSettings || (Array.isArray(data.customOptions) && data.customOptions.length)));
  }

  function finishLoadSettings(callback) {
    const shouldPersist = applyBit88UserNotesToSavedOptions();
    if (shouldPersist) {
      saveSettings({}, null, currentSettings.customOptions, callback);
    } else if (callback) {
      callback();
    }

    try {
      if (sessionStorage.getItem("esc_update_initiated") === "true") {
        sessionStorage.removeItem("esc_update_initiated");
        showToast(`🎉 Successfully updated to v${SCRIPT_VERSION}!`, true);
        setTimeout(() => {
          openChangelogModal();
        }, 600);
      }
    } catch (e) {}

    const storage = localStorageApi();
    if (storage) {
      storage.get(["escLastSeenChangelogVer"], (d) => {
        const lastVer = d && d.escLastSeenChangelogVer;
        if (!lastVer || isVersionBelow(lastVer, SCRIPT_VERSION)) {
          storage.set({ escLastSeenChangelogVer: SCRIPT_VERSION });
          setTimeout(() => {
            openChangelogModal();
          }, 800);
        }
      });
    }

    // Announce to sibling tabs that new version has activated
    if (typeof BroadcastChannel !== "undefined") {
      try {
        const ch = new BroadcastChannel("hdjrz_kyc_channel");
        ch.postMessage({ action: "NEW_VERSION_ACTIVATED", version: SCRIPT_VERSION });
        setTimeout(() => ch.close(), 1000);
      } catch (e) {}
    }

    setTimeout(() => {
      fetchRemoteTemplates((err, res) => {
        if (!err && res && res.updated) {
          showToast(`✨ Templates updated from cloud (v${res.version})`);
        }
      });
    }, 400);
  }

  function getLicenseAuthData(cb) {
    ensureLicenseDeviceId((devId) => {
      const api = localStorageApi();
      if (!api) {
        cb({ devId, licenseKey: "", role: licenseRole || "" });
        return;
      }
      api.get(["hdjrzLicenseKey", "hdjrzLicenseRole"], (d) => {
        const key = (d && String(d.hdjrzLicenseKey || "").trim()) || "";
        const role = (d && d.hdjrzLicenseRole) || licenseRole || "";
        cb({ devId, licenseKey: key, role });
      });
    });
  }

  let lastSeenSupportUnread = 0;
  let isCheckingSupportUnread = false;
  function checkAgentSupportUnread(cb) {
    if (isLockedOut || !isLicensed()) {
      if (cb) cb();
      return;
    }
    // Skip redundant background polling if modal is currently open on an active thread
    const overlayEl = document.getElementById("esc-support-overlay");
    if (overlayEl) {
      const threadView = overlayEl.querySelector("#esc-support-view-thread");
      if (threadView && threadView.style.display === "flex") {
        if (cb) cb();
        return;
      }
    }
    if (isCheckingSupportUnread) {
      if (cb) cb();
      return;
    }
    isCheckingSupportUnread = true;

    getLicenseAuthData(({ devId, licenseKey, role }) => {
      const agentName = currentSettings.agentName || (role === "guest" ? "Guest User" : "Staff");
      const isAdmin = role === "admin";
      const url = `https://hdjrz-license.rosechel05.workers.dev/api/support/my-tickets?dev=${encodeURIComponent(devId || "")}&agent=${encodeURIComponent(agentName)}&role=${encodeURIComponent(role)}&key=${encodeURIComponent(licenseKey)}&_t=${Date.now()}`;
      sendWorkerRequest({ url, method: "GET" }, (err, json) => {
        isCheckingSupportUnread = false;
        if (!err && json && json.ok) {
          const unreadCount = Number(json.unreadCount) || 0;
          const badge = document.getElementById("esc-dock-support-badge");
          if (badge) {
            badge.style.display = unreadCount > 0 ? "block" : "none";
          }
          const tabBadge = document.getElementById("esc-support-tab-unread");
          if (tabBadge) {
            tabBadge.textContent = String(unreadCount);
            tabBadge.style.display = unreadCount > 0 ? "inline-block" : "none";
          }
          if (unreadCount > 0 && unreadCount > lastSeenSupportUnread) {
            const toastMsg = isAdmin
              ? `📬 New agent message in Inbox (${unreadCount} unread)!`
              : `💬 Admin replied to your message (${unreadCount} unread)!`;
            showToast(toastMsg, false);
          }
          lastSeenSupportUnread = unreadCount;
          if (cb) cb(null, json);
        } else {
          if (cb) cb(err || "Failed to check messages");
        }
      });
    });
  }

  // Fast background polling every 7 seconds for remote templates
  setInterval(() => {
    fetchRemoteTemplates((err, res) => {
      if (!err && res && res.updated) {
        showToast(`✨ Templates updated from cloud (v${res.version})`);
      }
    });
  }, 7000);

  // Dedicated high-frequency check for new support messages/replies every 1.2 seconds
  setInterval(() => {
    if (typeof document === "undefined" || !document.hidden) {
      checkAgentSupportUnread();
    }
  }, 1200);

  // Check immediately when agent switches back to the tab or visibility changes
  if (typeof document !== "undefined") {
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        if (window.__escUpdateInitiated || (function(){ try { return sessionStorage.getItem("esc_update_initiated") === "true"; } catch(e){ return false; } })()) {
          window.__escUpdateInitiated = false;
          try { sessionStorage.removeItem("esc_update_initiated"); } catch(e) {}
          const statusText = document.getElementById("esc-auto-reload-status");
          if (statusText) statusText.innerHTML = `⚡ <strong>Update detected! Reloading page now...</strong>`;
          setTimeout(() => {
            window.location.reload();
          }, 500);
          return;
        }
        fetchRemoteTemplates((err, res) => {
          if (!err && res && res.updated) {
            showToast(`✨ Templates updated from cloud (v${res.version})`);
          }
        });
        checkAgentSupportUnread();
      }
    });
  }

  if (typeof window !== "undefined") {
    window.addEventListener("focus", () => {
      if (window.__escUpdateInitiated || (function(){ try { return sessionStorage.getItem("esc_update_initiated") === "true"; } catch(e){ return false; } })()) {
        window.__escUpdateInitiated = false;
        try { sessionStorage.removeItem("esc_update_initiated"); } catch(e) {}
        const statusText = document.getElementById("esc-auto-reload-status");
        if (statusText) statusText.innerHTML = `⚡ <strong>Update detected! Reloading page now...</strong>`;
        setTimeout(() => {
          window.location.reload();
        }, 500);
        return;
      }
      fetchRemoteTemplates((err, res) => {
        if (!err && res && res.updated) {
          showToast(`✨ Templates updated from cloud (v${res.version})`);
        }
      });
      checkAgentSupportUnread();
    });

    // Throttled heartbeat check on user activity (mouse move, click, keystroke, touch)
    const onUserActivityHeartbeat = () => {
      if (Date.now() - lastRemoteHeartbeatTime >= 6000) {
        fetchRemoteTemplates((err, res) => {
          if (!err && res && res.updated) {
            showToast(`✨ Templates updated from cloud (v${res.version})`);
          }
        });
      }
    };
    ["mousemove", "keydown", "click", "scroll", "touchstart"].forEach(evtName => {
      window.addEventListener(evtName, onUserActivityHeartbeat, { passive: true });
    });
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
    currentSettings.notesWordingVersion = BIT88_NOTES_WORDING_VERSION;
    loadedWordingVersion = BIT88_NOTES_WORDING_VERSION;
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

    // Reject UI labels, counters, and navigation tabs like "input (2)", "notes (3)", "duplicates (2)"
    if (/^(?:input|inputs|tab|tabs|item|items|page|pages|note|notes|duplicate|duplicates|attachment|attachments|doc|docs|file|files|field|fields|select|button)\s*(?:\(\d+\))?$/i.test(str)) {
      return null;
    }

    // 1. Number + (Parentheses ID) e.g. "15511274 (4LG14LGG)" or "442954 (LM433PX)"
    const numParen = str.match(/([0-9a-zA-Z_-]+)\s*\(([^)]+)\)/);
    if (numParen) {
      const num = numParen[1].trim();
      const parenthetical = numParen[2].trim();
      const isUiCounter = /^(?:input|inputs|tab|tabs|item|items|page|pages|note|notes|duplicate|duplicates|attachment|attachments|doc|docs|file|files|field|fields|select|button)$/i.test(num) && /^\d{1,2}$/.test(parenthetical);
      if (!isUiCounter && (/\d/.test(num) || parenthetical.length >= 4)) {
        return {
          userId: parenthetical,
          targetId: parenthetical,
          publicId: parenthetical,
          numericId: num,
          userCombined: `${num} (${parenthetical})`
        };
      }
    }

    // 2. Standalone parentheses e.g. "(4LG14LGG)" or "(LM433PX)"
    const onlyParen = str.match(/\(([^)]+)\)/);
    if (onlyParen) {
      const parenthetical = onlyParen[1].trim();
      if (!/^\d{1,2}$/.test(parenthetical) && parenthetical.length >= 3) {
        return {
          userId: parenthetical,
          targetId: parenthetical,
          publicId: parenthetical,
          numericId: parenthetical,
          userCombined: `(${parenthetical})`
        };
      }
    }

    // 3. Plain ID without parentheses e.g. "1172031960185783" or "15511274"
    const single = str.match(/[0-9a-zA-Z_-]+/);
    if (single && single[0].length >= 3) {
      const val = single[0].trim();
      if (!/^(?:input|inputs|select|button|textarea|undefined|null|none|true|false)$/i.test(val)) {
        return {
          userId: val,
          targetId: val,
          publicId: "",
          numericId: val,
          userCombined: val
        };
      }
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

    const allText = (document.body && (document.body.innerText || document.body.textContent)) || "";

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
    const isSpecialApp = /^((glife|mayaminiapp|maya)[-_\s]*)/i.test(key);
    if (/^((glife|mayaminiapp|maya)[-_\s]*)?first[-_\s]*name$/i.test(key)) {
      if (!isBlankPersonValue(value)) {
        if (isSpecialApp) out.firstName = out.firstName || value;
        else out.firstName = value;
      }
      return;
    }
    if (/^((glife|mayaminiapp|maya)[-_\s]*)?middle[-_\s]*name$/i.test(key)) {
      if (!isBlankPersonValue(value)) {
        if (isSpecialApp) out.middleName = out.middleName || value;
        else out.middleName = value;
      }
      return;
    }
    if (/^((glife|mayaminiapp|maya)[-_\s]*)?last[-_\s]*name$/i.test(key)) {
      if (!isBlankPersonValue(value)) {
        if (isSpecialApp) out.lastName = out.lastName || value;
        else out.lastName = value;
      }
      return;
    }
    if (/^((glife|mayaminiapp|maya)[-_\s]*)?(full[-_\s]*name|fullname)$/i.test(key) || /^((glife|mayaminiapp|maya)[-_\s]+)?name$/i.test(key)) {
      if (!isBlankPersonValue(value)) out.fullName = out.fullName || value;
      return;
    }
    if (/^((glife|mayaminiapp|maya)[-_\s]*)?(date[-_\s]*(of[-_\s]*)?birth|dateofbirth|dob|birth[-_\s]*date|birthdate)$/i.test(key)) {
      if (!isBlankPersonValue(value)) {
        if (isSpecialApp) out.dob = out.dob || value;
        else out.dob = value;
      }
      return;
    }
    if (/^gLifeUserId$/i.test(key) || /^glife\s*user\s*id$/i.test(key)) {
      out.gLifeUserId = value;
    }
    if (/^(mayaMiniAppId|mayaminiapp[-_\s]*profileId|mayaminiapp[-_\s]*id)$/i.test(key)) {
      out.mayaMiniAppId = value;
      if (!out.gLifeUserId) out.gLifeUserId = value;
    }
  }

  /**
   * Name and DOB from Nano User Attributes (firstName, lastName, dateOfBirth).
   */
  function scrapeUserAttributes() {
    const out = { firstName: "", middleName: "", lastName: "", fullName: "", name: "", dob: "", gLifeUserId: "", mayaMiniAppId: "" };
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
    if (isNaN(d.getTime())) {
      const mdy = raw.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
      if (mdy) {
        let p1 = parseInt(mdy[1], 10);
        let p2 = parseInt(mdy[2], 10);
        const y = parseInt(mdy[3], 10);
        let month = p1 - 1;
        let day = p2;
        if (p1 > 12 && p2 <= 12) {
          day = p1;
          month = p2 - 1;
        }
        d = new Date(y, month, day);
      }
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
    const mdy = raw.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
    if (mdy) {
      let p1 = parseInt(mdy[1], 10);
      let p2 = parseInt(mdy[2], 10);
      const y = parseInt(mdy[3], 10);
      let month = p1 - 1;
      let day = p2;
      if (p1 > 12 && p2 <= 12) {
        day = p1;
        month = p2 - 1;
      }
      if (month >= 0 && month < 12) {
        return `${day} ${months[month]}, ${y}`;
      }
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
    const raw = String((row && (row.userCombined || row.publicId || row.userId)) || "").trim();
    if (/^(?:input|inputs|tab|tabs|item|items|page|pages|note|notes|duplicate|duplicates|attachment|attachments|doc|docs|file|files|field|fields|select|button)\s*(?:\(\d+\))?$/i.test(raw)) {
      return "";
    }
    return raw;
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

    const cleanHint = String(verifiedUidHint || "").trim();
    const rows = (others || []).filter((row) => {
      const display = kycZoomDisplayId(row);
      if (!display) return false;
      if (thisId && kycSamePlayerId(display, thisId)) return false;
      return true;
    });

    let verifiedRow = null;
    if (cleanHint) {
      verifiedRow = rows.find((row) => kycRowMatchesUid(row, cleanHint));
    }
    if (!verifiedRow) {
      verifiedRow = rows.find((row) => isKycStatusVerified(row && row.kycVerified));
    }
    if (!verifiedRow && rows.length === 1 && !cleanHint) {
      verifiedRow = rows[0];
    }

    let verifiedDisplay = "";
    if (cleanHint) {
      if (verifiedRow) {
        const rowDisplay = kycZoomDisplayId(verifiedRow);
        if (rowDisplay && rowDisplay.includes("(") && !cleanHint.includes("(")) {
          verifiedDisplay = rowDisplay;
        } else {
          verifiedDisplay = cleanHint;
        }
      } else {
        verifiedDisplay = cleanHint;
      }
    } else if (verifiedRow) {
      verifiedDisplay = kycZoomDisplayId(verifiedRow);
    }

    if (verifiedDisplay) {
      lines.push(`User ID: ${verifiedDisplay} Verified to rejected.`);
    }

    rows.forEach((row) => {
      if (row === verifiedRow) return;
      const display = kycZoomDisplayId(row);
      if (!display) return;
      if (cleanHint && kycSamePlayerId(display, cleanHint)) return;
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

  function resolveKycPairAccounts(active, sibling, enteredVerifiedUid, selectedNoteChoice) {
    let other = sibling || null;
    if (other && !kycZoomDisplayId(other)) {
      other = null;
    }
    const cleanOtherUid = String(enteredVerifiedUid || "").trim();
    if (other && cleanOtherUid && !kycRowMatchesUid(other, cleanOtherUid)) {
      other = null;
    }
    if (!other && cleanOtherUid) {
      const parsed = parseUserIdValue(cleanOtherUid) || {};
      other = {
        userId: parsed.userId || cleanOtherUid,
        numericId: parsed.numericId || "",
        publicId: parsed.publicId || cleanOtherUid,
        userCombined: parsed.userCombined || cleanOtherUid,
        name: (active && active.name) || "",
        kycVerified: selectedNoteChoice === 0 ? "Rejected" : "Verified",
        createdDate: ""
      };
    }

    const activeIsVerified = active && isKycStatusVerified(active.kycVerified);
    const otherIsVerified = other && isKycStatusVerified(other.kycVerified);

    if (activeIsVerified && !otherIsVerified) {
      return { newAcct: active, oldAcct: other };
    }
    if (!activeIsVerified && otherIsVerified) {
      return { newAcct: other, oldAcct: active };
    }

    if (selectedNoteChoice === 0) {
      return { newAcct: active, oldAcct: other };
    } else {
      return { newAcct: other, oldAcct: active };
    }
  }

  function renderKycComparatorHtml(newAcct, oldAcct) {
    const formatId = (a) => {
      if (!a) return '<span style="color: #64748b; font-style: italic;">(Awaiting ID)</span>';
      if (a.numericId && a.publicId) return `${escapeHtml(a.numericId)} <span style="color: #60a5fa; font-weight: 700;">(${escapeHtml(a.publicId)})</span>`;
      return escapeHtml(a.userCombined || a.userId || a.publicId || a.numericId || "—");
    };

    const formatStatus = (s, defaultVerified) => {
      const raw = String(s || "").trim();
      if (!raw) {
        return defaultVerified 
          ? '<span class="esc-kyc-status-badge verified">Verified</span>'
          : '<span class="esc-kyc-status-badge rejected">Rejected</span>';
      }
      const isVer = isKycStatusVerified(raw);
      if (isVer) return '<span class="esc-kyc-status-badge verified">Verified</span>';
      if (/reject/i.test(raw)) return '<span class="esc-kyc-status-badge rejected">Rejected</span>';
      return `<span class="esc-kyc-status-badge pending">${escapeHtml(raw)}</span>`;
    };

    const newName = (newAcct && newAcct.name) || (oldAcct && oldAcct.name) || "—";
    const oldName = (oldAcct && oldAcct.name) || (newAcct && newAcct.name) || "—";
    const newReg = (newAcct && newAcct.createdDate) || "—";
    const oldReg = (oldAcct && oldAcct.createdDate) || "—";

    return `
      <div class="esc-kyc-comparator" id="esc-kyc-comparator">
        <div class="esc-kyc-column is-new-verified">
          <div class="esc-kyc-column-title">
            <span>🟢 NEW VERIFIED ACCOUNT</span>
          </div>
          <div class="esc-kyc-row">
            <span class="esc-kyc-row-label">ID:</span>
            <span class="esc-kyc-row-val" id="esc-kyc-comp-new-id">${formatId(newAcct)}</span>
          </div>
          <div class="esc-kyc-row">
            <span class="esc-kyc-row-label">Name:</span>
            <span class="esc-kyc-row-val" id="esc-kyc-comp-new-name">${escapeHtml(newName.toUpperCase())}</span>
          </div>
          <div class="esc-kyc-row">
            <span class="esc-kyc-row-label">Status:</span>
            <span class="esc-kyc-row-val" id="esc-kyc-comp-new-status">${formatStatus(newAcct && newAcct.kycVerified, true)}</span>
          </div>
          <div class="esc-kyc-row">
            <span class="esc-kyc-row-label">Registered:</span>
            <span class="esc-kyc-row-val" id="esc-kyc-comp-new-reg">${escapeHtml(newReg)}</span>
          </div>
        </div>

        <div class="esc-kyc-column is-old-duplicate">
          <div class="esc-kyc-column-title">
            <span>🔴 OLD DUPLICATE ACCOUNT</span>
          </div>
          <div class="esc-kyc-row">
            <span class="esc-kyc-row-label">ID:</span>
            <span class="esc-kyc-row-val" id="esc-kyc-comp-old-id">${formatId(oldAcct)}</span>
          </div>
          <div class="esc-kyc-row">
            <span class="esc-kyc-row-label">Name:</span>
            <span class="esc-kyc-row-val" id="esc-kyc-comp-old-name">${escapeHtml(oldName.toUpperCase())}</span>
          </div>
          <div class="esc-kyc-row">
            <span class="esc-kyc-row-label">Status:</span>
            <span class="esc-kyc-row-val" id="esc-kyc-comp-old-status">${formatStatus(oldAcct && oldAcct.kycVerified, false)}</span>
          </div>
          <div class="esc-kyc-row">
            <span class="esc-kyc-row-label">Registered:</span>
            <span class="esc-kyc-row-val" id="esc-kyc-comp-old-reg">${escapeHtml(oldReg)}</span>
          </div>
        </div>
      </div>
    `;
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

  let audioCtx = null;
  function playSuccessChime() {
    if (currentSettings.soundFeedback === false) return;
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      if (!audioCtx || audioCtx.state === "closed") {
        audioCtx = new AudioContextClass();
      }
      if (audioCtx.state === "suspended") {
        audioCtx.resume();
      }

      const now = audioCtx.currentTime;

      // Note 1: 587.33 Hz (D5) - gentle melodic bell onset
      const osc1 = audioCtx.createOscillator();
      const gain1 = audioCtx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(587.33, now);

      gain1.gain.setValueAtTime(0.0001, now);
      gain1.gain.linearRampToValueAtTime(0.12, now + 0.015);
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);

      osc1.connect(gain1);
      gain1.connect(audioCtx.destination);
      osc1.start(now);
      osc1.stop(now + 0.3);

      // Note 2: 880 Hz (A5) - sweet, uplifting harmonic sparkle (delayed 70ms)
      const osc2 = audioCtx.createOscillator();
      const gain2 = audioCtx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(880, now + 0.07);

      gain2.gain.setValueAtTime(0.0001, now + 0.07);
      gain2.gain.linearRampToValueAtTime(0.15, now + 0.085);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.48);

      osc2.connect(gain2);
      gain2.connect(audioCtx.destination);
      osc2.start(now + 0.07);
      osc2.stop(now + 0.5);
    } catch (e) {
      console.warn("[hdjrzTools] Audio chime error:", e);
    }
  }

  function playSuccessSound(soundType) {
    if (currentSettings.soundFeedback === false) return;
    const type = soundType || currentSettings.successSound || "voice";
    if (type === "voice" || type === "custom") {
      try {
        const audioSrc = (typeof SUCCESS_SOUND_VOICE_BASE64 !== "undefined" && SUCCESS_SOUND_VOICE_BASE64)
          || (typeof window !== "undefined" && window.SUCCESS_SOUND_VOICE_BASE64)
          || (typeof globalThis !== "undefined" && globalThis.SUCCESS_SOUND_VOICE_BASE64);
        if (audioSrc) {
          const audio = new Audio(audioSrc);
          audio.volume = 0.85;
          const playPromise = audio.play();
          if (playPromise !== undefined) {
            playPromise.catch(err => {
              console.warn("[hdjrzTools] Audio playback fallback to chime:", err);
              playSuccessChime();
            });
          }
          return;
        }
      } catch (err) {
        console.warn("[hdjrzTools] Custom audio playback error, falling back to chime:", err);
      }
    }
    playSuccessChime();
  }

  function triggerSuccessRipple() {
    if (currentSettings.soundFeedback === false) return;
    try {
      const existing = document.querySelector(".esc-success-ripple");
      if (existing) existing.remove();
      const ripple = document.createElement("div");
      ripple.className = "esc-success-ripple";
      document.body.appendChild(ripple);
      setTimeout(() => {
        try { ripple.remove(); } catch (e) {}
      }, 750);
    } catch (e) {}
  }

  function notifyEscalationSuccess(force = false) {
    if (!force && currentSettings.soundFeedback === false) return;
    playSuccessSound();
    triggerSuccessRipple();
  }

  /**
   * Display a sleek toast notification (compact or rich template card)
   */
  function showToast(message, isSuccess = true, templateText = "") {
    const existing = document.querySelector(".esc-toast");
    if (existing) existing.remove();

    const toast = document.createElement("div");
    toast.className = templateText ? "esc-toast esc-toast-card is-success-animated" : "esc-toast";
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
    if (isLockedOut) return;
    if (document.getElementById("escalation-helper-dock")) {
      dockElement = document.getElementById("escalation-helper-dock");
      applyBarTheme();
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
            <span class="esc-brand-version" id="esc-brand-version" title="Installed Script Version">v${safeEsc(SCRIPT_VERSION)}</span>
          </span>
          <span class="esc-player-badge empty" id="esc-player-status">Searching player...</span>
          <span class="esc-pagcor-badge is-empty" id="esc-player-age-badge" title="Player compliance & age verification"><span class="esc-age-dot"></span><span class="esc-age-text">Age: —</span></span>
        </div>
        <div class="esc-header-controls">
          <button type="button" class="esc-icon-btn" id="esc-btn-refresh" title="Re-scan current player">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M23 4v6h-6"></path><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
            </svg>
          </button>
          <button type="button" class="esc-icon-btn" id="esc-btn-support" title="Contact Admin / Report Bug with Screenshot" style="position: relative;">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            <span class="esc-support-badge-dot" id="esc-dock-support-badge" style="display: none; position: absolute; top: -2px; right: -2px; width: 7px; height: 7px; background: #ef4444; border-radius: 50%; box-shadow: 0 0 6px #ef4444;"></span>
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
    applyBarTheme();
    updateHorizontalDockButtons();
    bindDockEvents(dock);
    updatePlayerStatusBadge();
    attachDockUpdatePill(latestUpdateData);
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

    // Support modal button
    const supportBtn = dock.querySelector("#esc-btn-support");
    if (supportBtn) {
      supportBtn.addEventListener("click", () => {
        rememberModalOrigin(supportBtn);
        openSupportModal();
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
    const ageBadge = document.getElementById("esc-player-age-badge");
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

      if (ageBadge) {
        let dob = detectedPlayer.dob;
        if (!dob) {
          const attrs = scrapeUserAttributes();
          if (attrs && attrs.dob) {
            dob = attrs.dob;
            detectedPlayer.dob = dob;
          }
        }
        const ageInfo = dob ? getPagcorAgeInfo(dob) : null;
        if (ageInfo) {
          ageBadge.className = `esc-pagcor-badge ${ageInfo.badgeClass}`;
          const label = ageInfo.bracketLabel || (ageInfo.age >= 21 ? "Legal Age" : (ageInfo.age < 18 ? "Minor" : "Restricted"));
          const displayStatus = ageInfo.age ? `${label} (${ageInfo.age})` : (ageInfo.status || label);
          ageBadge.innerHTML = compact 
            ? `<span class="esc-age-dot"></span><span>${ageInfo.age || "—"}</span>` 
            : `<span class="esc-age-dot"></span><span>${escapeHtml(displayStatus)}</span>`;
          ageBadge.title = `Legal Age Evaluation: ${ageInfo.status} (DOB: ${dob})`;
          ageBadge.style.display = "inline-flex";
        } else {
          ageBadge.className = "esc-pagcor-badge is-empty";
          ageBadge.innerHTML = compact 
            ? `<span class="esc-age-dot"></span><span>—</span>` 
            : `<span class="esc-age-dot"></span><span>Age: N/A</span>`;
          ageBadge.title = "Player detected, but Date of Birth is not visible on current screen";
          ageBadge.style.display = "inline-flex";
        }
      }
    } else {
      badge.innerHTML = compact ? "—" : `<span style="opacity: 0.85;">No Player Detected</span>`;
      badge.className = "esc-player-badge empty";
      badge.title = "No client User ID found on this page. Click refresh or click any button to enter User ID.";

      if (ageBadge) {
        ageBadge.className = "esc-pagcor-badge is-empty";
        ageBadge.innerHTML = compact 
          ? `<span class="esc-age-dot"></span><span>—</span>` 
          : `<span class="esc-age-dot"></span><span>Age: —</span>`;
        ageBadge.title = "No player detected on current screen";
        ageBadge.style.display = "inline-flex";
      }
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
      document.removeEventListener("keydown", pickKey, true);
      if (animate === false) {
        overlay.remove();
        if (activeModal === overlay) activeModal = null;
        syncPageScrollLock();
        return;
      }
      closeOverlayZoom(overlay);
    };

    const pickKey = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        closePick();
      }
    };
    document.addEventListener("keydown", pickKey, true);

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
    if (isLicensed()) return;
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
          showToast("Could not reach license server. Check network or retry.", false);
          if (input) input.focus();
          return;
        }
        if (err && err !== "invalid") {
          showToast(String(err), false);
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
        e.preventDefault();
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
    if (isLockedOut) return;
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
      return `${escapeHtml(n || "—")}${d ? " / " + escapeHtml(d) : ""}`;
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
        return applyTlMentionsToZoomNote(applyKycZoomTitle(
          stripZoomStampLines(safeRenderEscalationNote(getOptionZoomText(item, selectedZoomChoice), noteFillData(kycExtra))),
          selectedZoomChoice
        ));
      }

      let finalZoom = stripZoomStampLines(safeRenderEscalationNote(getOptionZoomText(item, selectedZoomChoice), noteFillData({
        userId: finalUserId || finalCombined,
        targetId: finalUserId || finalCombined,
        userCombined: finalCombined,
        numericId: (parsed && parsed.numericId) || activePlayer.numericId || finalUserId
      })));
      if (String(item.code) === "REACT") finalZoom = stripEmptyDobZoomLine(finalZoom);
      return applyTlMentionsToZoomNote(finalZoom);
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
              <span id="esc-verified-status" style="font-size: 11px; font-weight: 500; color: ${enteredVerifiedUid ? '#34d399' : '#94a3b8'};">
                ${enteredVerifiedUid ? '✓ Auto-scanned from other tab' : '🔍 Scanning other tab...'}
              </span>
            </label>
            <input type="text" class="esc-input" id="esc-modal-verified-uid"
              value="${escapeHtml(enteredVerifiedUid)}"
              placeholder="Scanning other open tab..."
              readonly
              disabled
              style="font-family: monospace; font-size: 13.5px; font-weight: 700; color: #fde68a; background: #070d18; border-color: #334155; cursor: not-allowed; opacity: 0.9;">
            <div style="font-size: 11px; color: #94a3b8; margin-top: 5px; display: flex; align-items: center; gap: 4px;">
              <span>⚡ Automatically scanned from the other account in your open tab.</span>
            </div>
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

    const initialPair = isKycSwitch ? resolveKycPairAccounts(activePlayer, kycSibling, enteredVerifiedUid, selectedNoteChoice) : null;
    const kycComparatorHtml = isKycSwitch && initialPair ? renderKycComparatorHtml(initialPair.newAcct, initialPair.oldAcct) : "";

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

          ${kycComparatorHtml}

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
              <span id="esc-summary-display-namedob">${formatNameDobSummary(activePlayer.name, activePlayer.dob)}</span>
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
        if (firstOther) {
          enteredVerifiedUid = firstOther;
          if (verifiedUidInput) verifiedUidInput.value = firstOther;
        }
        return;
      }
      if (!verifiedUidInput) return;
      if (!kycSibling) return;
      const uid = kycPlainUid(kycSibling.publicId || kycSibling.userId);
      if (!uid) return;
      verifiedUidInput.value = uid;
      enteredVerifiedUid = uid;
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
          verifiedStatus.textContent = "✓ Auto-scanned from other tab";
          verifiedStatus.style.color = "#34d399";
        } else {
          verifiedStatus.textContent = "🔍 Scanning other tab...";
          verifiedStatus.style.color = "#94a3b8";
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
        summaryDisplayNameDob.innerHTML = formatNameDobSummary(person.name, person.dob);
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

      if (isKycSwitch) {
        const pair = resolveKycPairAccounts(activePlayer, kycSibling, enteredVerifiedUid, selectedNoteChoice);
        const compEl = overlay.querySelector("#esc-kyc-comparator");
        if (compEl && pair) {
          const temp = document.createElement("div");
          temp.innerHTML = renderKycComparatorHtml(pair.newAcct, pair.oldAcct);
          const newComp = temp.firstElementChild;
          if (newComp) compEl.replaceWith(newComp);
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
      document.removeEventListener("keydown", keyHandler, true);
      closeOverlayZoom(overlay);
    };

    const keyHandler = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        closeModal();
        return;
      }
      if (e.key === "Enter" && !e.shiftKey) {
        const tag = (e.target && e.target.tagName) || "";
        const id = (e.target && e.target.id) || "";
        if (tag === "TEXTAREA") return;
        if (id === "esc-btn-cancel" || id === "esc-modal-close") {
          return;
        }
        e.preventDefault();
        e.stopPropagation();
        executeEscalation();
      }
    };
    document.addEventListener("keydown", keyHandler, true);

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

      // Play escalation success sound and ripple directly upon Confirm & Execute
      notifyEscalationSuccess();

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
        const pairTwo = isKycNewVerified && selectedZoomChoice === 0 && kycSibling && (kycSibling.tabId || kycSibling.publicId || kycSibling.userId);
        const pairMany = isKycNewVerified && selectedZoomChoice === 1 && kycOthers.length > 0;
        const injectTabIds = pairTwo
          ? [kycSibling.tabId || kycSibling.publicId || kycSibling.userId]
          : (pairMany ? kycOthers.map((row) => row && (row.tabId || row.publicId || row.userId)).filter(Boolean) : []);

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

      const closeAudit = () => {
        document.removeEventListener("keydown", auditKey, true);
        closeOverlayZoom(overlay);
      };
      overlay.querySelector("#esc-audit-close").addEventListener("click", closeAudit);
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) closeAudit();
      });
      const auditKey = (e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          e.stopPropagation();
          closeAudit();
        }
      };
      document.addEventListener("keydown", auditKey, true);
    });
  }

  function renderActiveUsersListHtml() {
    if (!Array.isArray(lastKnownActiveUsers) || lastKnownActiveUsers.length === 0) {
      return `<span style="color: #64748b; font-size: 11px; font-style: italic;">No other agents active in last 5m</span>`;
    }
    return lastKnownActiveUsers.map(u => {
      const name = safeEsc(u.agent || "Agent");
      const ver = safeEsc(u.version || "1.0.0");
      return `<span style="display: inline-flex; align-items: center; gap: 5px; background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.08); padding: 2px 8px; border-radius: 4px; font-size: 11px; color: #f1f5f9; white-space: nowrap;">
        <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #10b981; box-shadow: 0 0 6px #10b981;"></span>
        <strong style="color: #e2e8f0;">${name}</strong>
        <span style="font-size: 10px; color: #64748b; font-family: ui-monospace, monospace;">v${ver}</span>
      </span>`;
    }).join("");
  }

  /**
   * In-Page Settings Modal (triggered from gear icon on the bar)
   * Includes full Add Option, Remove Option, and "Reason when clicked" customization.
   */
  function openSettingsModal() {
    if (isLockedOut) return;
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
            <span style="font-size: 11px; background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3); padding: 1px 6px; border-radius: 4px; margin-left: 6px; font-weight: 700;">v${safeEsc(SCRIPT_VERSION)}</span>
            <button type="button" class="esc-btn-small" id="esc-settings-changelog-btn" title="View release notes and new features" style="margin-left: 8px; background: rgba(56, 189, 248, 0.15); border: 1px solid rgba(56, 189, 248, 0.3); color: #38bdf8; border-radius: 4px; padding: 2px 8px; font-size: 11px; font-weight: 700; cursor: pointer;">📜 What's New</button>
            <span id="esc-settings-update-container"></span>
          </div>
          <button type="button" class="esc-icon-btn" id="esc-settings-close" title="Close (Esc)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div class="esc-settings-body esc-settings-category-layout">
          <!-- Sidebar Navigation -->
          <div class="esc-settings-sidebar" role="tablist" aria-label="Settings Categories">
            <button type="button" class="esc-settings-tab-btn is-active" data-tab="general" role="tab" aria-selected="true">
              <span class="esc-tab-icon">⚙️</span>
              <span class="esc-tab-label">General &amp; Defaults</span>
            </button>
            <button type="button" class="esc-settings-tab-btn" data-tab="buttons" role="tab" aria-selected="false">
              <span class="esc-tab-icon">🎯</span>
              <span class="esc-tab-label">Escalation Buttons</span>
            </button>
            <button type="button" class="esc-settings-tab-btn" data-tab="cloud" role="tab" aria-selected="false">
              <span class="esc-tab-icon">☁️</span>
              <span class="esc-tab-label">Cloud &amp; Backup</span>
            </button>
            <button type="button" class="esc-settings-tab-btn" data-tab="audit" role="tab" aria-selected="false">
              <span class="esc-tab-icon">📜</span>
              <span class="esc-tab-label">Audit Logs</span>
            </button>
            <button type="button" class="esc-settings-tab-btn" data-tab="account" role="tab" aria-selected="false">
              <span class="esc-tab-icon">👤</span>
              <span class="esc-tab-label">Account &amp; License</span>
            </button>
          </div>

          <!-- Content Panels -->
          <div class="esc-settings-content">
            <!-- PANEL 1: GENERAL -->
            <div class="esc-settings-panel is-active" id="esc-panel-general" role="tabpanel">
              <div class="esc-panel-header">
                <h3 class="esc-panel-title">General &amp; Defaults</h3>
                <p class="esc-panel-desc">Configure agent credentials, Zoom URL handler, bar display mode, and execution options.</p>
              </div>

              <div class="esc-panel-grid">
                <div class="esc-panel-col">
                  <div class="esc-form-row">
                    <label class="esc-form-label" for="esc-set-agent">Agent Name</label>
                    <input type="text" class="esc-input" id="esc-set-agent" value="${escapeHtml(currentSettings.agentName || "")}" placeholder="e.g. Agent Name">
                    <span class="esc-field-hint">Used when stamping templates and audit entries.</span>
                  </div>

                  <div class="esc-form-row" style="margin-top: 10px;">
                    <label class="esc-form-label" for="esc-set-zoom-url">Zoom URL Scheme</label>
                    <input type="text" class="esc-input" id="esc-set-zoom-url" value="${escapeHtml(currentSettings.zoomUrl || "zoomus://")}" placeholder="zoomus://">
                    <span class="esc-field-hint">URL handler or desktop scheme to launch Zoom.</span>
                  </div>

                  <div class="esc-form-row" style="margin-top: 10px;">
                    <span class="esc-form-label">Escalation Bar Layout</span>
                    <div class="esc-layout-toggle">
                      <label class="esc-layout-choice">
                        <input type="radio" name="esc-bar-layout" value="horizontal" ${currentSettings.barLayout !== "vertical" ? "checked" : ""}>
                        <span>Horizontal Bar</span>
                      </label>
                      <label class="esc-layout-choice">
                        <input type="radio" name="esc-bar-layout" value="vertical" ${currentSettings.barLayout === "vertical" ? "checked" : ""}>
                        <span>Vertical Dock</span>
                      </label>
                    </div>
                  </div>

                  <div class="esc-form-row" style="margin-top: 12px;">
                    <span class="esc-form-label">Minimalist Bar Design &amp; Template</span>
                    <div class="esc-glass-palette-grid">
                      <label class="esc-glass-pill ${(!currentSettings.barTheme || currentSettings.barTheme === 'minimal-glass' || currentSettings.barTheme === 'frosted-cyan' || currentSettings.barTheme === 'frosted') ? 'is-selected' : ''}">
                        <input type="radio" name="esc-bar-theme" value="minimal-glass" ${(!currentSettings.barTheme || currentSettings.barTheme === 'minimal-glass' || currentSettings.barTheme === 'frosted' || currentSettings.barTheme === 'frosted-cyan') ? 'checked' : ''}>
                        <span class="esc-palette-dot" style="background:#38bdf8;box-shadow:0 0 6px #38bdf8;"></span>
                        <span>🪟 Minimal Glass</span>
                      </label>

                      <label class="esc-glass-pill ${(currentSettings.barTheme === 'obsidian-matte' || currentSettings.barTheme === 'frosted-purple') ? 'is-selected' : ''}">
                        <input type="radio" name="esc-bar-theme" value="obsidian-matte" ${(currentSettings.barTheme === 'obsidian-matte' || currentSettings.barTheme === 'frosted-purple') ? 'checked' : ''}>
                        <span class="esc-palette-dot" style="background:#94a3b8;box-shadow:0 0 6px #94a3b8;"></span>
                        <span>🌑 Obsidian Matte</span>
                      </label>

                      <label class="esc-glass-pill ${(currentSettings.barTheme === 'slate-nordic' || currentSettings.barTheme === 'frosted-emerald') ? 'is-selected' : ''}">
                        <input type="radio" name="esc-bar-theme" value="slate-nordic" ${(currentSettings.barTheme === 'slate-nordic' || currentSettings.barTheme === 'frosted-emerald') ? 'checked' : ''}>
                        <span class="esc-palette-dot" style="background:#60a5fa;box-shadow:0 0 6px #60a5fa;"></span>
                        <span>🌫️ Slate Nordic</span>
                      </label>

                      <label class="esc-glass-pill ${(currentSettings.barTheme === 'mocha-dark' || currentSettings.barTheme === 'frosted-sunset') ? 'is-selected' : ''}">
                        <input type="radio" name="esc-bar-theme" value="mocha-dark" ${(currentSettings.barTheme === 'mocha-dark' || currentSettings.barTheme === 'frosted-sunset') ? 'checked' : ''}>
                        <span class="esc-palette-dot" style="background:#d97706;box-shadow:0 0 6px #d97706;"></span>
                        <span>☕ Mocha Dark</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div class="esc-panel-col">
                  <span class="esc-form-label">Execution Behavior</span>
                  <div class="esc-checkbox-group">
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
                    <label class="esc-checkbox-label" style="display: flex; align-items: center; justify-content: space-between;">
                      <span style="display: inline-flex; align-items: center; gap: 6px;">
                        <input type="checkbox" id="esc-set-sound" ${currentSettings.soundFeedback !== false ? "checked" : ""}>
                        <span>🔔 Success Chime &amp; Green Ripple</span>
                      </span>
                      <button type="button" class="esc-btn-test-chime" id="esc-test-chime" title="Test Success Chime & Ripple">🔊 Test</button>
                    </label>
                    ${staffView ? "" : `
                    <label class="esc-checkbox-label">
                      <input type="checkbox" id="esc-set-return" ${currentSettings.autoReturnToUsers !== false ? "checked" : ""}>
                      <span>Return to Users list</span>
                    </label>

                    <div style="margin-top: 14px; padding: 12px; background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(56, 189, 248, 0.25); border-radius: 8px;">
                      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                        <span class="esc-form-label" style="margin-bottom: 0; font-size: 12px; font-weight: 700; color: #38bdf8;">👑 Team Leader(s) to Mention</span>
                        <span style="font-size: 10px; background: rgba(37, 99, 235, 0.2); color: #60a5fa; border: 1px solid rgba(37, 99, 235, 0.4); padding: 1px 6px; border-radius: 4px; font-weight: 700;">Admin Only</span>
                      </div>
                      <input type="text" class="esc-input" id="esc-set-tl-mentions" value="${escapeHtml(currentSettings.tlMentions || "@Jetro")}" placeholder="@Jetro" style="font-weight: 600;">
                      <span class="esc-field-hint" style="display: block; margin-top: 4px; font-size: 11px; color: #94a3b8;">Handle(s) appended after "Pasuyo po TLs" in all escalation notes.</span>
                    </div>

                    <div style="margin-top: 12px; padding: 12px; background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(56, 189, 248, 0.25); border-radius: 8px;">
                      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
                        <span class="esc-form-label" style="margin-bottom: 0; font-size: 12px; font-weight: 700; color: #38bdf8;">👑 Success Sound Effect (Fleet)</span>
                        <span style="font-size: 10px; background: rgba(37, 99, 235, 0.2); color: #60a5fa; border: 1px solid rgba(37, 99, 235, 0.4); padding: 1px 6px; border-radius: 4px; font-weight: 700;">Admin Only</span>
                      </div>
                      <p class="esc-field-hint" style="margin-top: 0; margin-bottom: 8px; font-size: 11px; color: #94a3b8;">Choose the sound played across all agent workstations upon escalation success.</p>

                      <div style="display: flex; flex-direction: column; gap: 6px;">
                        <label class="esc-radio-label" style="display: flex; align-items: center; justify-content: space-between; padding: 6px 10px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 6px; cursor: pointer;">
                          <span style="display: inline-flex; align-items: center; gap: 8px; font-size: 12px; color: #e2e8f0;">
                            <input type="radio" name="esc-set-success-sound" value="voice" ${(currentSettings.successSound !== 'chime') ? 'checked' : ''}>
                            <span>🔊 Voice Shoutout ("Arigathanks")</span>
                          </span>
                          <button type="button" class="esc-btn-test-chime" id="esc-preview-sound-voice" style="padding: 2px 8px; font-size: 11px;">▶ Test</button>
                        </label>

                        <label class="esc-radio-label" style="display: flex; align-items: center; justify-content: space-between; padding: 6px 10px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 6px; cursor: pointer;">
                          <span style="display: inline-flex; align-items: center; gap: 8px; font-size: 12px; color: #e2e8f0;">
                            <input type="radio" name="esc-set-success-sound" value="chime" ${(currentSettings.successSound === 'chime') ? 'checked' : ''}>
                            <span>🔔 Melodic Bell Chime (Standard)</span>
                          </span>
                          <button type="button" class="esc-btn-test-chime" id="esc-preview-sound-chime" style="padding: 2px 8px; font-size: 11px;">▶ Test</button>
                        </label>
                      </div>
                    </div>
                    `}
                  </div>
                </div>
              </div>
            </div>

            <!-- PANEL 2: BUTTONS -->
            <div class="esc-settings-panel" id="esc-panel-buttons" role="tabpanel">
              <div class="esc-panel-header" style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 8px;">
                <div>
                  <h3 class="esc-panel-title">Escalation Buttons</h3>
                  <p class="esc-panel-desc">${staffView ? "Standard presets (Read-only for Staff). Admins can modify button labels, colors, and templates." : "Each row stays one line. Edit opens User Notes, Zoom, and Reasons. First reason is the default."}</p>
                </div>
                <div class="esc-options-mgr-actions" style="display: flex; align-items: center; gap: 8px;">
                  <span class="esc-options-count-badge" id="esc-options-count-badge"></span>
                  ${staffView ? "" : `
                  <button type="button" class="esc-btn-small esc-btn-add" id="esc-add-toggle">+ Add a button</button>
                  <button type="button" class="esc-btn-small esc-btn-danger-outline" id="esc-btn-restore-presets">Restore 14 Presets</button>
                  `}
                </div>
              </div>

              <!-- Button Color Palette Bar -->
              <div class="esc-btn-palette-bar">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;">🌑 Dark Color Palettes:</span>
                  <span style="font-size: 11px; color: #64748b;">(Deep High-Contrast Themes)</span>
                </div>
                <div class="esc-btn-palette-selector" id="esc-btn-palette-selector">
                  <button type="button" class="esc-palette-pill" data-palette="classic_dark" title="Classic Dark: Deep saturated originals with high-contrast clarity">
                    <span class="esc-palette-swatch">
                      <span style="background:#1E40AF"></span><span style="background:#991B1B"></span><span style="background:#065F46"></span><span style="background:#5B21B6"></span>
                    </span>
                    <span>Classic Dark</span>
                  </button>
                  <button type="button" class="esc-palette-pill" data-palette="midnight_abyss" title="Midnight Abyss: Deep midnight blues, navy obsidian, and steel">
                    <span class="esc-palette-swatch">
                      <span style="background:#0B132B"></span><span style="background:#1C2541"></span><span style="background:#3A506B"></span><span style="background:#1F4068"></span>
                    </span>
                    <span>Midnight Abyss</span>
                  </button>
                  <button type="button" class="esc-palette-pill" data-palette="crimson_wine" title="Crimson Wine: Deep burgundy, dark merlot, and cherry noir">
                    <span class="esc-palette-swatch">
                      <span style="background:#3D0C11"></span><span style="background:#5E131D"></span><span style="background:#800E13"></span><span style="background:#4A1521"></span>
                    </span>
                    <span>Crimson Wine</span>
                  </button>
                </div>
              </div>

              <div class="esc-options-cards-list" id="esc-options-cards-list"></div>
            </div>

            <!-- PANEL 3: CLOUD & BACKUP -->
            <div class="esc-settings-panel" id="esc-panel-cloud" role="tabpanel">
              <div class="esc-panel-header">
                <h3 class="esc-panel-title">Cloud &amp; Backup</h3>
                <p class="esc-panel-desc">Synchronize button templates across your team or export/import configuration files.</p>
              </div>

              <div class="esc-cloud-section-card">
                <div class="esc-cloud-card-header">
                  <div class="esc-cloud-card-info">
                    <span class="esc-cloud-title">Cloud Templates Synchronization</span>
                    <span class="esc-cloud-subtitle">Pull the latest team templates published in the Web Admin Portal</span>
                  </div>
                  <button type="button" class="esc-btn-secondary esc-btn-sync" id="esc-settings-sync" title="Pull latest approved templates from Cloud">
                    <svg class="esc-sync-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
                    </svg>
                    <span>Sync from Cloud</span>
                  </button>
                </div>

                ${staffView ? "" : `
                <div class="esc-admin-active-box" style="margin-top: 12px; padding: 10px 12px; background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(56, 189, 248, 0.2); border-radius: 6px;">
                  <div style="display: flex; align-items: center; margin-bottom: 6px;">
                    <span style="font-weight: 700; color: #38bdf8; font-size: 11px;">
                      📋 Active Users Online <span id="esc-active-users-count" style="background: rgba(56, 189, 248, 0.2); padding: 1px 6px; border-radius: 10px; font-size: 10px; color: #7dd3fc;">${Array.isArray(lastKnownActiveUsers) ? lastKnownActiveUsers.length : 0}</span>
                    </span>
                  </div>
                  <div id="esc-active-users-list" style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                    ${renderActiveUsersListHtml()}
                  </div>
                </div>
                `}
              </div>

              <div class="esc-cloud-section-card" style="margin-top: 10px;">
                <div class="esc-cloud-card-header">
                  <div class="esc-cloud-card-info">
                    <span class="esc-cloud-title">Local Backup &amp; Restore</span>
                    <span class="esc-cloud-subtitle">Save a local copy of your settings or restore from a JSON file.</span>
                  </div>
                  <div style="display: flex; gap: 8px;">
                    ${staffView ? "" : `<button type="button" class="esc-btn-secondary" id="esc-settings-export">Export</button>`}
                    <button type="button" class="esc-btn-secondary" id="esc-settings-import">Import</button>
                    <input type="file" id="esc-settings-import-file" accept=".json,application/json" hidden>
                  </div>
                </div>
              </div>
            </div>

            <!-- PANEL 4: AUDIT -->
            <div class="esc-settings-panel" id="esc-panel-audit" role="tabpanel">
              <div class="esc-panel-header">
                <h3 class="esc-panel-title">Audit Logs</h3>
                <p class="esc-panel-desc">Review your recent shift escalation history and dispatched player details.</p>
              </div>

              <div class="esc-audit-panel-card" style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 36px 20px; background: #070b14; border: 1px dashed #334155; border-radius: 8px; text-align: center; gap: 12px; margin-top: 8px;">
                <div style="font-size: 32px;">📜</div>
                <div style="max-width: 440px;">
                  <h4 style="margin: 0 0 6px 0; color: #f8fafc; font-size: 14px;">Review Escalation History</h4>
                  <p style="margin: 0; color: #94a3b8; font-size: 12px; line-height: 1.4;">View all player escalations recorded during this session, including player IDs, reasons, generated User Notes, and Zoom messages.</p>
                </div>
                <button type="button" class="esc-btn-primary esc-btn-audit" id="esc-btn-audit" style="width: auto; padding: 8px 24px; margin-top: 4px;">
                  Open Audit Log
                </button>
              </div>
            </div>

            <!-- PANEL 5: ACCOUNT & LICENSE -->
            <div class="esc-settings-panel" id="esc-panel-account" role="tabpanel">
              <div class="esc-panel-header">
                <h3 class="esc-panel-title">Account &amp; License</h3>
                <p class="esc-panel-desc">Current device authorization tier, version status, and session control.</p>
              </div>

              <div class="esc-account-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; margin-top: 4px;">
                <div class="esc-account-stat-card">
                  <span class="esc-account-stat-label">License Role</span>
                  <span class="esc-account-stat-val" style="color: ${isAdminLicense() ? '#38bdf8' : '#34d399'};">
                    ${isAdminLicense() ? '👑 Administrator' : '🛡️ Staff Agent'}
                  </span>
                </div>

                <div class="esc-account-stat-card">
                  <span class="esc-account-stat-label">Installed Version</span>
                  <span class="esc-account-stat-val" style="color: #cbd5e1;">v${safeEsc(SCRIPT_VERSION)}</span>
                </div>

                <div class="esc-account-stat-card">
                  <span class="esc-account-stat-label">Server Version</span>
                  <span class="esc-account-stat-val" style="color: #38bdf8;">v${safeEsc(latestKnownServerVersion || SCRIPT_VERSION)}</span>
                </div>

                <div class="esc-account-stat-card">
                  <span class="esc-account-stat-label">Update Status</span>
                  <span class="esc-account-stat-val" style="font-size: 12px; font-weight: 700; color: ${
                    (latestKnownServerVersion && isVersionBelow(SCRIPT_VERSION, latestKnownServerVersion))
                      ? (isVersionBelow(SCRIPT_VERSION, (latestUpdateData && latestUpdateData.minRequiredVersion) || '1.1.4') ? '#ef4444' : '#38bdf8')
                      : '#34d399'
                  };">
                    ${
                      (latestKnownServerVersion && isVersionBelow(SCRIPT_VERSION, latestKnownServerVersion))
                        ? (isVersionBelow(SCRIPT_VERSION, (latestUpdateData && latestUpdateData.minRequiredVersion) || '1.1.4') ? '⚠️ Update Required' : '🚀 Optional Update')
                        : '✅ Up to Date'
                    }
                  </span>
                </div>

                <div class="esc-account-stat-card">
                  <span class="esc-account-stat-label">Release Channel</span>
                  <span class="esc-account-stat-val" style="color: ${isAdminLicense() ? '#60a5fa' : '#34d399'}; font-size: 11.5px; font-weight: 700;">
                    ${isAdminLicense() ? '👑 Admin Channel' : '🛡️ Production Fleet'}
                  </span>
                </div>

                <div class="esc-account-stat-card">
                  <span class="esc-account-stat-label">Device Status</span>
                  <span class="esc-account-stat-val" id="esc-account-device-id" style="font-size: 12px; color: #94a3b8; font-family: ui-monospace, monospace;">Authorized</span>
                </div>
              </div>

              <div class="esc-account-actions-card" style="margin-top: 14px; padding: 14px 16px; background: #070d18; border: 1px solid #1e293b; border-radius: 8px; display: flex; align-items: center; justify-content: space-between;">
                <div>
                  <span style="font-weight: 700; color: #e2e8f0; font-size: 12px; display: block;">Session &amp; License Management</span>
                  <span style="font-size: 11px; color: #94a3b8;">Manage seats, licenses, and cloud templates in the Web Admin Portal, or release this device.</span>
                </div>
                <div style="display: flex; gap: 8px; align-items: center;">
                  ${staffView ? "" : `
                  <a href="https://hdjrz-license.rosechel05.workers.dev/admin" target="_blank" rel="noopener noreferrer" class="esc-btn-secondary" style="text-decoration: none; display: inline-flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 600; color: #38bdf8; border-color: rgba(56, 189, 248, 0.35); background: rgba(56, 189, 248, 0.08); padding: 6px 12px;" title="Open Web Admin Portal to manage licenses, active seats, and templates">
                    🌐 Web Admin Portal ↗
                  </a>
                  `}
                  <button type="button" class="esc-btn-secondary esc-btn-danger-outline" id="esc-settings-signout" style="padding: 6px 14px;">Sign out</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="esc-modal-footer" style="display: flex; justify-content: space-between; align-items: center;">
          <div class="esc-settings-footer-info" style="font-size: 11px; color: #64748b;">
            Select any category to customize settings. Changes apply upon clicking Save.
          </div>
          <div class="esc-settings-footer-right" style="display: flex; gap: 8px;">
            <button type="button" class="esc-btn-secondary" id="esc-settings-cancel">Cancel</button>
            <button type="button" class="esc-btn-primary" id="esc-settings-save">Save Changes</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    activeModal = overlay;
    playModalOpen(overlay);
    renderSettingsUpdateControls();

    const tabButtons = overlay.querySelectorAll(".esc-settings-tab-btn");
    const panels = overlay.querySelectorAll(".esc-settings-panel");

    function switchSettingsTab(tabId) {
      tabButtons.forEach(btn => {
        const isActive = btn.getAttribute("data-tab") === tabId;
        btn.classList.toggle("is-active", isActive);
        btn.setAttribute("aria-selected", isActive ? "true" : "false");
      });
      panels.forEach(panel => {
        panel.classList.toggle("is-active", panel.id === `esc-panel-${tabId}`);
      });
      try {
        localStorage.setItem("hdjrz_active_settings_tab", tabId);
      } catch (e) {}
    }

    tabButtons.forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const tabId = btn.getAttribute("data-tab");
        if (tabId) switchSettingsTab(tabId);
      });
    });

    let initialTab = "general";
    try {
      initialTab = localStorage.getItem("hdjrz_active_settings_tab") || "general";
    } catch (e) {}
    switchSettingsTab(initialTab);

    const deviceIdEl = overlay.querySelector("#esc-account-device-id");
    if (deviceIdEl && typeof ensureLicenseDeviceId === "function") {
      ensureLicenseDeviceId((id) => {
        if (deviceIdEl) deviceIdEl.textContent = id ? id.substring(0, 16) + "..." : "Authorized";
      });
    }

    if (!staffView) {
      fetchRemoteTemplates(() => {});
    }

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
                  <button type="button" class="esc-insert-chip" data-insert="[PAGCOR AGE]">Insert PAGCOR Age</button>
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
    overlay._escRenderOptionsList = () => {
      workingOptions = JSON.parse(JSON.stringify(getActiveOptions()));
      renderOptionsList();
    };

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
        if (typeof updateHorizontalDockButtons === "function") updateHorizontalDockButtons();
        showToast("Presets restored. Click Save Changes.");
      }
    });

    const paletteSelector = overlay.querySelector("#esc-btn-palette-selector");
    if (paletteSelector) {
      const getPalettes = () => (typeof window !== "undefined" && window.BUTTON_COLOR_PALETTES)
        || (typeof globalThis !== "undefined" && globalThis.BUTTON_COLOR_PALETTES)
        || FALLBACK_BUTTON_COLOR_PALETTES;

      const highlightActivePalette = () => {
        const palettes = getPalettes();
        let matchedKey = "";
        let bestMatchCount = 0;
        Object.keys(palettes).forEach(key => {
          const pal = palettes[key];
          if (!pal || !pal.colors) return;
          let count = 0;
          workingOptions.forEach(opt => {
            if (opt && opt.code && pal.colors[opt.code]) {
              const palCol = pal.colors[opt.code].toLowerCase();
              const curCol = (opt.color || "").toLowerCase();
              if (palCol === curCol) count++;
            }
          });
          if (count > bestMatchCount && count >= 3) {
            bestMatchCount = count;
            matchedKey = key;
          }
        });
        paletteSelector.querySelectorAll(".esc-palette-pill").forEach(pill => {
          const isMatch = pill.getAttribute("data-palette") === matchedKey;
          pill.classList.toggle("active", isMatch);
        });
      };

      highlightActivePalette();

      paletteSelector.querySelectorAll(".esc-palette-pill").forEach(pill => {
        pill.addEventListener("click", () => {
          const palKey = pill.getAttribute("data-palette");
          const palettes = getPalettes();
          const targetPalette = palettes && palettes[palKey];
          if (!targetPalette || !targetPalette.colors) return;

          paletteSelector.querySelectorAll(".esc-palette-pill").forEach(p => p.classList.remove("active"));
          pill.classList.add("active");

          workingOptions.forEach(opt => {
            if (opt && opt.code && targetPalette.colors[opt.code]) {
              opt.color = targetPalette.colors[opt.code];
            }
          });

          currentSettings.customOptions = JSON.parse(JSON.stringify(workingOptions));
          renderOptionsList();
          if (typeof updateHorizontalDockButtons === "function") updateHorizontalDockButtons();
          saveSettings({}, null, currentSettings.customOptions, () => {
            showToast(`🎨 Applied ${targetPalette.name} Color Hunt palette!`, true);
          });
        });
      });
    }

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
      document.removeEventListener("keydown", keyHandler, true);
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
      e.preventDefault();
      e.stopPropagation();
      closeSettings();
    };
    document.addEventListener("keydown", keyHandler, true);

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
      setCheck("#esc-set-sound", currentSettings.soundFeedback !== false);
      setCheck("#esc-set-return", currentSettings.autoReturnToUsers !== false);
      let themeVal = currentSettings.barTheme || "minimal-glass";
      if (themeVal === "frosted" || themeVal === "frosted-cyan") themeVal = "minimal-glass";
      else if (themeVal === "frosted-purple") themeVal = "obsidian-matte";
      else if (themeVal === "frosted-emerald") themeVal = "slate-nordic";
      else if (themeVal === "frosted-sunset") themeVal = "mocha-dark";
      const themeRadio = overlay.querySelector(`input[name="esc-bar-theme"][value="${themeVal}"]`);
      if (themeRadio) {
        themeRadio.checked = true;
        overlay.querySelectorAll(".esc-glass-pill").forEach(c => c.classList.remove("is-selected"));
        const parentCard = themeRadio.closest(".esc-glass-pill");
        if (parentCard) parentCard.classList.add("is-selected");
      }
      if (!staffView) {
        const tlInput = overlay.querySelector("#esc-set-tl-mentions");
        if (tlInput) tlInput.value = currentSettings.tlMentions != null ? currentSettings.tlMentions : "@Jetro";
        const currentSound = currentSettings.successSound || "voice";
        const soundRadio = overlay.querySelector(`input[name="esc-set-success-sound"][value="${currentSound}"]`);
        if (soundRadio) soundRadio.checked = true;
      }
    }
    fillSettingsDefaultsForm();

    function selectBarTheme(themeVal) {
      if (!themeVal) return;
      currentSettings.barTheme = themeVal;
      overlay.querySelectorAll(".esc-glass-pill").forEach(c => c.classList.remove("is-selected"));
      const targetRadio = overlay.querySelector(`input[name="esc-bar-theme"][value="${themeVal}"]`);
      if (targetRadio) {
        targetRadio.checked = true;
        const parentPill = targetRadio.closest(".esc-glass-pill");
        if (parentPill) parentPill.classList.add("is-selected");
      }
      applyBarTheme();
    }

    overlay.querySelectorAll(".esc-glass-pill").forEach(pill => {
      pill.addEventListener("click", (e) => {
        const radio = pill.querySelector('input[name="esc-bar-theme"]');
        if (radio) {
          selectBarTheme(radio.value);
        }
      });
    });

    overlay.querySelectorAll('input[name="esc-bar-theme"]').forEach(radio => {
      radio.addEventListener("change", () => {
        selectBarTheme(radio.value);
      });
    });

    const testChimeBtn = overlay.querySelector("#esc-test-chime");
    if (testChimeBtn) {
      testChimeBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        notifyEscalationSuccess(true);
      });
    }

    const previewVoiceBtn = overlay.querySelector("#esc-preview-sound-voice");
    if (previewVoiceBtn) {
      previewVoiceBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        playSuccessSound("voice");
      });
    }

    const previewChimeBtn = overlay.querySelector("#esc-preview-sound-chime");
    if (previewChimeBtn) {
      previewChimeBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        playSuccessChime();
      });
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

    const syncBtn = overlay.querySelector("#esc-settings-sync");

    if (syncBtn) {
      syncBtn.addEventListener("click", () => {
        const icon = syncBtn.querySelector(".esc-sync-icon");
        if (icon) icon.classList.add("is-spinning");
        syncBtn.disabled = true;

        fetchRemoteTemplates((err, res) => {
          if (icon) icon.classList.remove("is-spinning");
          syncBtn.disabled = false;
          if (err) {
            showToast("Cloud sync: " + err);
          } else if (res && res.updated) {
            workingOptions = JSON.parse(JSON.stringify(getActiveOptions()));
            renderOptionsList();
            showToast(`✨ Synced with Cloud! (v${currentSettings.remoteTemplatesVersion || 'latest'})`);
          } else {
            showToast("Already up to date with Cloud.");
          }
        });
      });
    }

    overlay.querySelector("#esc-settings-signout").addEventListener("click", () => {
      releaseLicenseOnServer(() => {
        persistLicenseRole("", () => {
          closeSettings();
          showToast("Signed out.");
          openLicenseModal();
        });
      });
    });

    const changelogBtn = overlay.querySelector("#esc-settings-changelog-btn");
    if (changelogBtn) {
      changelogBtn.addEventListener("click", () => {
        openChangelogModal();
      });
    }

    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeSettings();
    });

    overlay.querySelector("#esc-settings-save").addEventListener("click", (e) => {
      e.preventDefault();
      try {
        if (isAdminLicense()) syncCardInputsToWorkingOptions();
        const agentInput = overlay.querySelector("#esc-set-agent");
        const zoomUrlInput = overlay.querySelector("#esc-set-zoom-url");
        const tlInput = overlay.querySelector("#esc-set-tl-mentions");
        const soundRadioChecked = overlay.querySelector('input[name="esc-set-success-sound"]:checked');
        const chosenSound = (!staffView && soundRadioChecked) ? soundRadioChecked.value : (currentSettings.successSound || "voice");

        const updatedSettings = {
          agentName: (agentInput && agentInput.value.trim()) || "",
          zoomUrl: (zoomUrlInput && zoomUrlInput.value.trim()) || "zoomus://",
          usersListUrl: currentSettings.usersListUrl || "https://nano-admin.bet88.ph/users",
          autoCopyClipboard: !!(overlay.querySelector("#esc-set-copy") && overlay.querySelector("#esc-set-copy").checked),
          autoPinNote: !!(overlay.querySelector("#esc-set-pin-note") && overlay.querySelector("#esc-set-pin-note").checked),
          autoOpenZoom: !!(overlay.querySelector("#esc-set-open-zoom") && overlay.querySelector("#esc-set-open-zoom").checked),
          soundFeedback: !!(overlay.querySelector("#esc-set-sound") && overlay.querySelector("#esc-set-sound").checked),
          autoReturnToUsers: isAdminLicense()
            ? !!(overlay.querySelector("#esc-set-return") && overlay.querySelector("#esc-set-return").checked)
            : (currentSettings.autoReturnToUsers !== false),
          autoFindAndView: false,
          barLayout: (overlay.querySelector('input[name="esc-bar-layout"]:checked') && overlay.querySelector('input[name="esc-bar-layout"]:checked').value === "vertical") ? "vertical" : "horizontal",
          barTheme: (overlay.querySelector('input[name="esc-bar-theme"]:checked') && overlay.querySelector('input[name="esc-bar-theme"]:checked').value) || currentSettings.barTheme || "minimal-glass",
          tlMentions: (!staffView && tlInput) ? tlInput.value.trim() : (currentSettings.tlMentions || "@Jetro"),
          successSound: chosenSound
        };
        const optionsToSave = isAdminLicense() ? workingOptions : currentSettings.customOptions;
        saveSettings(updatedSettings, currentSettings.customTemplates || {}, optionsToSave, () => {
          applyBarTheme();
          if (isAdminLicense()) {
            const api = localStorageApi();
            if (api) {
              api.get(["hdjrzLicenseKey"], (data) => {
                const key = (data && String(data.hdjrzLicenseKey || "").trim()) || "";
                if (key) {
                  sendWorkerRequest({
                    url: "https://hdjrz-license.rosechel05.workers.dev/config/system",
                    method: "POST",
                    data: { key, fleetSuccessSound: chosenSound }
                  }, () => {});
                }
              });
            }
          }
          showToast("Saved.");
          closeSettings();
          fetchRemoteTemplates(() => {});
        });
      } catch (err) {
        console.error("[hdjrzTools] Error saving settings:", err);
        showToast("Error saving: " + err.message);
      }
    });
  }

  /* =========================================================
   * Support & Screenshot Bug Reporter Module (v1.7.0)
   * ========================================================= */
  function compressImageFile(fileOrBlob, maxDim, quality, cb) {
    if (!fileOrBlob) return cb("No file provided");
    const dim = maxDim || 1600;
    const qual = quality || 0.82;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;
        if (width > dim || height > dim) {
          if (width > height) {
            height = Math.round((height * dim) / width);
            width = dim;
          } else {
            width = Math.round((width * dim) / height);
            height = dim;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        try {
          const base64 = canvas.toDataURL("image/jpeg", qual);
          cb(null, base64, { width, height });
        } catch (err) {
          cb((err && err.message) || "Failed to encode image");
        }
      };
      img.onerror = () => cb("Invalid image format");
      img.src = e.target.result;
    };
    reader.onerror = () => cb("Could not read file");
    reader.readAsDataURL(fileOrBlob);
  }

  function openScreenshotLightbox(src) {
    if (!src) return;
    const existing = document.getElementById("esc-support-lightbox");
    if (existing) existing.remove();

    const box = document.createElement("div");
    box.id = "esc-support-lightbox";
    box.innerHTML = `
      <img src="${safeEsc(src)}" alt="Screenshot Zoom">
      <button type="button" style="position:absolute;top:20px;right:20px;background:rgba(15,23,42,0.85);border:1px solid #334155;color:#fff;border-radius:50%;width:36px;height:36px;font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;">✕</button>
    `;
    box.addEventListener("click", () => box.remove());
    document.body.appendChild(box);
  }

  function openSupportModal() {
    if (isLockedOut) return;
    requireLicense(() => runOpenSupportModal());
  }

  function runOpenSupportModal() {
    if (activeModal) activeModal.remove();

    const isAdmin = isAdminLicense();
    let currentView = isAdmin ? "list" : "new"; // "new", "list", "thread"
    let newTicketImage = null;
    let threadReplyImage = null;
    let activeTicketId = null;
    let threadPollTimer = null;
    let listPollTimer = null;
    let currentThreadMsgCount = 0;
    let lastRenderedTicketsKey = "";
    let cachedAuth = null;
    getLicenseAuthData((a) => { cachedAuth = a; });

    const overlay = document.createElement("div");
    overlay.className = "esc-modal-overlay";
    overlay.id = "esc-support-overlay";

    const modalTitleText = isAdmin ? "📬 Agent Messages Inbox (Admin)" : "💬 Agent Messages & Support";
    const tabsHtml = isAdmin ? `
      <button type="button" class="esc-support-tab-btn is-active" id="esc-support-tab-list">
        <span>📬 Agent Chats (Inbox)</span>
        <span class="esc-support-badge-pill" id="esc-support-tab-unread" style="display:none;">0</span>
      </button>
      <button type="button" class="esc-support-tab-btn" id="esc-support-tab-new">
        <span>💬 Direct Chat / Message</span>
      </button>
    ` : `
      <button type="button" class="esc-support-tab-btn is-active" id="esc-support-tab-new">
        <span>💬 Send Message / Report</span>
      </button>
      <button type="button" class="esc-support-tab-btn" id="esc-support-tab-list">
        <span>📬 My Messages</span>
        <span class="esc-support-badge-pill" id="esc-support-tab-unread" style="display:none;">0</span>
      </button>
    `;

    overlay.innerHTML = `
      <div class="esc-popover-backdrop"></div>
      <div class="esc-modal esc-support-modal" role="dialog" aria-modal="true" aria-label="${safeEsc(modalTitleText)}">
        <div class="esc-modal-header">
          <div class="esc-modal-title">
            <span>${safeEsc(modalTitleText)}</span>
            <span style="font-size: 11px; background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3); padding: 1px 6px; border-radius: 4px; margin-left: 6px; font-weight: 700;">v${safeEsc(SCRIPT_VERSION)}</span>
          </div>
          <button type="button" class="esc-icon-btn" id="esc-support-close" title="Close (Esc)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div class="esc-support-tabs">
          ${tabsHtml}
        </div>

        <div class="esc-support-body">
          <!-- View 1: New Ticket / Direct Message -->
          <div id="esc-support-view-new" style="display: ${isAdmin ? 'none' : 'flex'}; flex-direction: column; gap: 12px;">
            ${isAdmin ? `
              <!-- Admin Header & Active Agents Roster -->
              <div class="esc-admin-active-card">
                <div class="esc-admin-card-header">
                  <div style="display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 700; color: #f1f5f9;">
                    <span class="esc-admin-pulse-dot"></span>
                    <span>Active Fleet Agents Online</span>
                    <span id="esc-admin-online-badge" style="background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); font-size: 10px; font-weight: 700; padding: 1px 6px; border-radius: 10px;">0 Online</span>
                  </div>
                  <button type="button" id="esc-admin-refresh-agents" style="background: transparent; border: 1px solid #334155; color: #94a3b8; border-radius: 4px; padding: 2px 8px; font-size: 11px; cursor: pointer; display: inline-flex; align-items: center; gap: 4px;">
                    🔄 Refresh
                  </button>
                </div>
                <div id="esc-admin-active-chips" class="esc-admin-chips-container">
                  <span style="font-size: 11px; color: #64748b;">Loading active agents...</span>
                </div>
              </div>

              <!-- Choose Who to Chat With -->
              <div style="display: flex; flex-direction: column; gap: 6px;">
                <div style="display: flex; align-items: center; justify-content: space-between;">
                  <label style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;">
                    🎯 Choose Agent to Chat With:
                  </label>
                  <span id="esc-admin-agent-status-tag" style="font-size: 11px; color: #38bdf8; font-weight: 600;"></span>
                </div>
                <div style="display: flex; gap: 8px;">
                  <select id="esc-admin-agent-select" class="esc-support-textarea" style="min-height: 38px; height: 38px; padding: 6px 10px; font-size: 13px; color: #f8fafc; background: #0b1329; border: 1px solid #334155; border-radius: 6px; cursor: pointer; flex: 1;">
                    <option value="">-- Choose an Agent to message --</option>
                  </select>
                  <input type="text" id="esc-admin-custom-name" placeholder="Enter custom agent name..." style="display: none; height: 38px; padding: 6px 10px; font-size: 13px; color: #fff; background: #0b1329; border: 1px solid #38bdf8; border-radius: 6px; flex: 1;">
                </div>
              </div>

              <!-- Existing Conversation Banner -->
              <div id="esc-admin-existing-banner" class="esc-admin-existing-banner" style="display: none;">
                <div style="display: flex; align-items: center; gap: 6px;">
                  <span style="font-size: 14px;">💬</span>
                  <span id="esc-admin-existing-text">Active conversation found with this agent.</span>
                </div>
                <button type="button" id="esc-admin-open-existing-btn" style="background: #0284c7; border: 1px solid #38bdf8; color: #fff; border-radius: 4px; padding: 4px 10px; font-size: 11px; font-weight: 700; cursor: pointer; white-space: nowrap;">
                  👉 Open Chat Thread
                </button>
              </div>
            ` : `
              <div style="font-size: 12px; color: #94a3b8; line-height: 1.4;">
                Encountered an issue or have a message/question for the admin? Describe it below and paste a screenshot directly.
              </div>
            `}

            <textarea class="esc-support-textarea" id="esc-support-text" placeholder="${isAdmin ? 'Type your direct message or instruction to agent (press Ctrl+Enter to send)...' : 'Explain the problem, what happened, or your message...'}"></textarea>

            <!-- Dropzone / Paste Screenshot -->
            <div class="esc-support-dropzone" id="esc-support-dropzone" title="Click to browse image or press Ctrl+V anywhere">
              <div class="esc-support-dropzone-icon">📸</div>
              <div class="esc-support-dropzone-text">
                <strong>Click to browse image</strong> or paste directly (<strong>Ctrl + V</strong>)
              </div>
              <input type="file" id="esc-support-file-input" accept="image/*" style="display: none;">
            </div>

            <!-- Image Preview Box -->
            <div class="esc-support-preview-box" id="esc-support-preview-wrap" style="display: none;">
              <img src="" class="esc-support-thumb" id="esc-support-preview-img" title="Click to zoom screenshot">
              <div class="esc-support-preview-info" id="esc-support-preview-info">Screenshot attached</div>
              <button type="button" class="esc-support-btn-remove" id="esc-support-preview-remove">✕ Remove</button>
            </div>

            <!-- Diagnostics Pill Info -->
            <div style="display: flex; flex-wrap: wrap; gap: 6px;">
              ${isAdmin ? `
                <span class="esc-support-diag-pill" id="esc-admin-pill-target">🎯 Recipient: <strong style="color: #38bdf8; margin-left: 2px;">(Select Agent)</strong></span>
                <span class="esc-support-diag-pill">🛡️ Sender: <strong style="color: #e2e8f0; margin-left: 2px;">${safeEsc(currentSettings.agentName || "Jetro (Admin)")}</strong></span>
                <span class="esc-support-diag-pill" id="esc-admin-pill-online">⚪ Offline</span>
              ` : `
                <span class="esc-support-diag-pill">👤 Agent: ${safeEsc(currentSettings.agentName || (licenseRole === "guest" ? "Guest User" : "Staff"))}</span>
                <span class="esc-support-diag-pill">🌐 ${safeEsc(window.location.pathname.slice(0, 26))}</span>
                <span class="esc-support-diag-pill">🎯 ${detectedPlayer && detectedPlayer.userId ? "UID: " + safeEsc(detectedPlayer.userId) : "No Player Scraped"}</span>
              `}
            </div>

            <!-- Submit Action -->
            <button type="button" class="esc-support-submit-btn" id="esc-support-submit">
              <span>${isAdmin ? '🚀 Send Direct Message' : '🚀 Send Message'}</span>
            </button>
          </div>

          <!-- View 2: List (Tickets / Inbox) -->
          <div id="esc-support-view-list" style="display: ${isAdmin ? 'flex' : 'none'}; flex-direction: column; gap: 10px;">
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <span style="font-size: 12px; color: #94a3b8;">${isAdmin ? "Incoming conversations from fleet agents:" : "Your message conversations with admin:"}</span>
              <button type="button" class="esc-btn-small" id="esc-support-list-refresh" style="background: rgba(56, 189, 248, 0.12); border: 1px solid rgba(56, 189, 248, 0.25); color: #38bdf8; border-radius: 4px; padding: 3px 8px; font-size: 11px; cursor: pointer;">
                🔄 Refresh
              </button>
            </div>
            <div class="esc-support-ticket-list" id="esc-support-tickets-container">
              <div style="text-align: center; padding: 20px; color: #64748b; font-size: 12px;">Loading messages...</div>
            </div>
          </div>

          <!-- View 3: Conversation Thread -->
          <div id="esc-support-view-thread" style="display: none; flex-direction: column; gap: 10px;">
            <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #1e293b; padding-bottom: 8px;">
              <button type="button" class="esc-btn-small" id="esc-support-thread-back" style="background: #1e293b; border: 1px solid #334155; color: #cbd5e1; border-radius: 4px; padding: 4px 10px; font-size: 11px; cursor: pointer;">
                ${isAdmin ? "← Back to Inbox" : "← Back to Messages"}
              </button>
              <div id="esc-support-thread-meta" style="font-size: 11px; color: #94a3b8; display: flex; align-items: center; gap: 6px; flex-wrap: wrap;"></div>
            </div>

            <div class="esc-support-thread-msgs" id="esc-support-thread-messages"></div>

            <div class="esc-support-reply-box">
              <textarea class="esc-support-textarea" id="esc-support-reply-text" placeholder="${isAdmin ? 'Type a reply to agent as Admin (or paste screenshot Ctrl+V)...' : 'Type a reply to admin (or paste screenshot Ctrl+V)...'}" style="min-height: 60px;"></textarea>

              <div class="esc-support-preview-box" id="esc-support-reply-preview-wrap" style="display: none;">
                <img src="" class="esc-support-thumb" id="esc-support-reply-preview-img" title="Click to zoom screenshot">
                <div class="esc-support-preview-info" id="esc-support-reply-preview-info">Screenshot attached</div>
                <button type="button" class="esc-support-btn-remove" id="esc-support-reply-preview-remove">✕ Remove</button>
              </div>

              <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
                <button type="button" class="esc-btn-small" id="esc-support-reply-attach-btn" style="background: rgba(148, 163, 184, 0.1); border: 1px solid #334155; color: #cbd5e1; border-radius: 4px; padding: 6px 12px; font-size: 11px; cursor: pointer; display: inline-flex; align-items: center; gap: 4px;">
                  📸 Attach Image
                </button>
                <input type="file" id="esc-support-reply-file-input" accept="image/*" style="display: none;">

                <button type="button" class="esc-support-submit-btn" id="esc-support-reply-submit" style="padding: 6px 18px; font-size: 12px;">
                  💬 Send Reply
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    activeModal = overlay;
    playModalOpen(overlay);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && currentView === "thread" && activeTicketId) {
        pollActiveThreadSilently(activeTicketId);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    const closeBtn = overlay.querySelector("#esc-support-close");
    const closeSupport = () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (threadPollTimer) {
        clearTimeout(threadPollTimer);
        threadPollTimer = null;
      }
      if (listPollTimer) {
        clearTimeout(listPollTimer);
        listPollTimer = null;
      }
      closeOverlayZoom(overlay, () => {
        overlay.remove();
        if (activeModal === overlay) activeModal = null;
      });
    };
    closeBtn.addEventListener("click", closeSupport);

    // Tab buttons & Views
    const tabNew = overlay.querySelector("#esc-support-tab-new");
    const tabList = overlay.querySelector("#esc-support-tab-list");
    const tabUnreadBadge = overlay.querySelector("#esc-support-tab-unread");
    const viewNew = overlay.querySelector("#esc-support-view-new");
    const viewList = overlay.querySelector("#esc-support-view-list");
    const viewThread = overlay.querySelector("#esc-support-view-thread");

    function switchView(viewName) {
      currentView = viewName;
      if (viewName !== "thread" && threadPollTimer) {
        clearTimeout(threadPollTimer);
        threadPollTimer = null;
      }
      if (viewName !== "list" && listPollTimer) {
        clearTimeout(listPollTimer);
        listPollTimer = null;
      }
      if (tabNew) tabNew.classList.toggle("is-active", viewName === "new");
      if (tabList) tabList.classList.toggle("is-active", viewName === "list" || viewName === "thread");

      viewNew.style.display = viewName === "new" ? "flex" : "none";
      viewList.style.display = viewName === "list" ? "flex" : "none";
      viewThread.style.display = viewName === "thread" ? "flex" : "none";

      if (viewName === "new" && isAdmin) {
        loadActiveAgentsForAdmin();
      }

      if (viewName === "list") {
        loadAgentTicketsList(false);
        if (listPollTimer) clearTimeout(listPollTimer);
        let isListPolling = false;
        const scheduleListTick = (delayMs = 1200) => {
          if (listPollTimer) clearTimeout(listPollTimer);
          listPollTimer = setTimeout(() => {
            if (currentView !== "list" || !document.getElementById("esc-support-overlay")) {
              listPollTimer = null;
              return;
            }
            if (isListPolling) {
              scheduleListTick(250);
              return;
            }
            isListPolling = true;
            loadAgentTicketsList(true, () => {
              isListPolling = false;
              scheduleListTick(1200);
            });
          }, delayMs);
        };
        scheduleListTick(1200);
      }
    }

    if (tabNew) tabNew.addEventListener("click", () => switchView("new"));
    if (tabList) tabList.addEventListener("click", () => switchView("list"));

    const threadBackBtn = overlay.querySelector("#esc-support-thread-back");
    threadBackBtn.addEventListener("click", () => switchView("list"));

    // Clipboard paste handler
    function handlePaste(e) {
      const clipboardData = e.clipboardData || window.clipboardData;
      if (!clipboardData || !clipboardData.items) return;
      for (let i = 0; i < clipboardData.items.length; i++) {
        const item = clipboardData.items[i];
        if (item.type && item.type.indexOf("image") !== -1) {
          const file = item.getAsFile();
          if (file) {
            e.preventDefault();
            if (currentView === "thread") {
              attachReplyScreenshot(file);
            } else {
              attachNewScreenshot(file);
            }
            break;
          }
        }
      }
    }
    overlay.addEventListener("paste", handlePaste);

    // View 1 (New Ticket) Image Handling
    const dropzone = overlay.querySelector("#esc-support-dropzone");
    const fileInput = overlay.querySelector("#esc-support-file-input");
    const previewWrap = overlay.querySelector("#esc-support-preview-wrap");
    const previewImg = overlay.querySelector("#esc-support-preview-img");
    const previewInfo = overlay.querySelector("#esc-support-preview-info");
    const previewRemove = overlay.querySelector("#esc-support-preview-remove");

    dropzone.addEventListener("click", () => fileInput.click());
    fileInput.addEventListener("change", () => {
      if (fileInput.files && fileInput.files[0]) {
        attachNewScreenshot(fileInput.files[0]);
      }
    });

    dropzone.addEventListener("dragover", (e) => {
      e.preventDefault();
      dropzone.classList.add("is-dragover");
    });
    dropzone.addEventListener("dragleave", () => dropzone.classList.remove("is-dragover"));
    dropzone.addEventListener("drop", (e) => {
      e.preventDefault();
      dropzone.classList.remove("is-dragover");
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
        attachNewScreenshot(e.dataTransfer.files[0]);
      }
    });

    previewImg.addEventListener("click", () => {
      if (newTicketImage) openScreenshotLightbox(newTicketImage);
    });

    previewRemove.addEventListener("click", () => {
      newTicketImage = null;
      fileInput.value = "";
      previewWrap.style.display = "none";
      dropzone.style.display = "flex";
    });

    function attachNewScreenshot(file) {
      showToast("Compressing screenshot...", false);
      compressImageFile(file, 1600, 0.82, (err, base64, info) => {
        if (err || !base64) {
          showToast("Failed to process image: " + err, false);
          return;
        }
        newTicketImage = base64;
        previewImg.src = base64;
        previewInfo.textContent = `Screenshot (${info.width}x${info.height}, ~${Math.round(base64.length / 1024)} KB)`;
        previewWrap.style.display = "flex";
        dropzone.style.display = "none";
        showToast("📸 Screenshot attached!");
      });
    }

    // Admin Active Agents & Recipient Selection Handling
    let adminAgentsData = { users: [], allAgents: [] };
    let selectedAgent = null;

    function formatTimeAgo(ts) {
      if (!ts) return "offline";
      const sec = Math.round((Date.now() - ts) / 1000);
      if (sec < 60) return "just now";
      const min = Math.round(sec / 60);
      if (min < 60) return `${min}m ago`;
      const hr = Math.round(min / 60);
      if (hr < 24) return `${hr}h ago`;
      const days = Math.round(hr / 24);
      return `${days}d ago`;
    }

    function loadActiveAgentsForAdmin(forceRefresh = false) {
      if (!isAdmin) return;
      const chipsWrap = overlay.querySelector("#esc-admin-active-chips");
      const badge = overlay.querySelector("#esc-admin-online-badge");
      const select = overlay.querySelector("#esc-admin-agent-select");
      if (!chipsWrap || !select) return;

      if (!forceRefresh && adminAgentsData.users.length > 0 && adminAgentsData.allAgents.length > 0) {
        renderAdminAgentsUi();
        return;
      }

      chipsWrap.innerHTML = `<span style="font-size: 11px; color: #64748b;">⏳ Fetching active agents...</span>`;

      const fetchRoster = ({ licenseKey }) => {
        const url = `https://hdjrz-license.rosechel05.workers.dev/api/agents/active?role=admin&key=${encodeURIComponent(licenseKey)}&_t=${Date.now()}`;
        sendWorkerRequest({
          url,
          method: "GET",
          headers: {
            "Authorization": "Bearer " + licenseKey,
            "X-Admin-Password": licenseKey
          }
        }, (err, res) => {
          if (err || !res || !res.ok) {
            chipsWrap.innerHTML = `<span style="font-size: 11px; color: #f87171;">Failed to load agents: ${safeEsc(err || (res && res.error) || 'Error')}</span>`;
            return;
          }
          adminAgentsData = {
            users: res.users || [],
            allAgents: res.allAgents || res.users || []
          };
          renderAdminAgentsUi();
        });
      };

      if (cachedAuth) {
        fetchRoster(cachedAuth);
      } else {
        getLicenseAuthData((auth) => {
          cachedAuth = auth;
          fetchRoster(auth);
        });
      }
    }

    function renderAdminAgentsUi() {
      if (!isAdmin) return;
      const chipsWrap = overlay.querySelector("#esc-admin-active-chips");
      const badge = overlay.querySelector("#esc-admin-online-badge");
      const select = overlay.querySelector("#esc-admin-agent-select");
      if (!chipsWrap || !select) return;

      const onlineUsers = adminAgentsData.users || [];
      const allAgents = adminAgentsData.allAgents || [];

      if (badge) {
        badge.textContent = `${onlineUsers.length} Online`;
        badge.style.color = onlineUsers.length > 0 ? "#34d399" : "#94a3b8";
      }

      // 1. Render active chips
      chipsWrap.innerHTML = "";
      if (onlineUsers.length === 0) {
        chipsWrap.innerHTML = `<span style="font-size: 11px; color: #64748b;">No agents active in the last 5 minutes. You can pick an agent from the roster below.</span>`;
      } else {
        onlineUsers.forEach((u) => {
          const chip = document.createElement("div");
          chip.className = "esc-admin-agent-chip" + (selectedAgent && selectedAgent.agent === u.agent ? " is-selected" : "");
          chip.innerHTML = `
            <span class="esc-admin-pulse-dot"></span>
            <strong>${safeEsc(u.agent || "Agent")}</strong>
            <span style="color: #60a5fa; font-family: monospace; font-size: 10px;">v${safeEsc(u.version || "1.0.0")}</span>
          `;
          chip.addEventListener("click", () => {
            selectAgentForAdmin({
              agent: u.agent,
              devId: u.devId || "",
              version: u.version || "",
              online: true,
              latestTicketId: u.latestTicketId || null,
              latestTicketStatus: u.latestTicketStatus || null
            });
          });
          chipsWrap.appendChild(chip);
        });
      }

      // 2. Render select options
      const currentSelectedVal = select.value;
      select.innerHTML = `<option value="">-- Choose an Agent to message --</option>`;

      if (onlineUsers.length > 0) {
        const groupOnline = document.createElement("optgroup");
        groupOnline.label = "🟢 Online Agents (Active Now)";
        onlineUsers.forEach((u) => {
          const opt = document.createElement("option");
          opt.value = u.agent;
          opt.textContent = `🟢 ${u.agent} (v${u.version || '1.0.0'} - Active now)`;
          groupOnline.appendChild(opt);
        });
        select.appendChild(groupOnline);
      }

      const offlineAgents = allAgents.filter(a => !onlineUsers.some(u => (u.agent || '').toLowerCase() === (a.agent || '').toLowerCase()));
      if (offlineAgents.length > 0) {
        const groupOffline = document.createElement("optgroup");
        groupOffline.label = "⚪ Fleet Agents (Roster)";
        offlineAgents.forEach((a) => {
          const opt = document.createElement("option");
          opt.value = a.agent;
          const timeAgo = formatTimeAgo(a.lastSeen);
          opt.textContent = `⚪ ${a.agent} (${timeAgo})`;
          groupOffline.appendChild(opt);
        });
        select.appendChild(groupOffline);
      }

      const groupOther = document.createElement("optgroup");
      groupOther.label = "✏️ Other";
      const customOpt = document.createElement("option");
      customOpt.value = "__custom__";
      customOpt.textContent = "➕ Enter Custom Agent Name...";
      groupOther.appendChild(customOpt);
      select.appendChild(groupOther);

      if (selectedAgent) {
        select.value = selectedAgent.isCustom ? "__custom__" : selectedAgent.agent;
      } else if (currentSelectedVal) {
        select.value = currentSelectedVal;
      }
    }

    function selectAgentForAdmin(agentObj) {
      selectedAgent = agentObj;
      const select = overlay.querySelector("#esc-admin-agent-select");
      const customInput = overlay.querySelector("#esc-admin-custom-name");
      const existingBanner = overlay.querySelector("#esc-admin-existing-banner");
      const existingText = overlay.querySelector("#esc-admin-existing-text");
      const openExistingBtn = overlay.querySelector("#esc-admin-open-existing-btn");
      const pillRecipient = overlay.querySelector("#esc-admin-pill-target");
      const pillOnline = overlay.querySelector("#esc-admin-pill-online");
      const agentStatusTag = overlay.querySelector("#esc-admin-agent-status-tag");
      const textArea = overlay.querySelector("#esc-support-text");
      const submitBtn = overlay.querySelector("#esc-support-submit");

      // Update chips highlight
      const chips = overlay.querySelectorAll(".esc-admin-agent-chip");
      chips.forEach((c) => {
        const strong = c.querySelector("strong");
        const name = strong ? strong.textContent : "";
        c.classList.toggle("is-selected", !!(selectedAgent && name === selectedAgent.agent));
      });

      if (!agentObj) {
        if (select) select.value = "";
        if (customInput) customInput.style.display = "none";
        if (existingBanner) existingBanner.style.display = "none";
        if (pillRecipient) pillRecipient.innerHTML = `🎯 Recipient: <strong style="color: #38bdf8; margin-left: 2px;">(Select Agent)</strong>`;
        if (pillOnline) pillOnline.innerHTML = `⚪ Offline`;
        if (agentStatusTag) agentStatusTag.textContent = "";
        if (textArea) textArea.placeholder = "Type your direct message or instruction to agent (press Ctrl+Enter to send)...";
        if (submitBtn) submitBtn.innerHTML = `<span>🚀 Send Direct Message</span>`;
        return;
      }

      if (agentObj.isCustom) {
        if (select) select.value = "__custom__";
        if (customInput) {
          customInput.style.display = "block";
          customInput.focus();
        }
        if (existingBanner) existingBanner.style.display = "none";
        const val = (customInput && customInput.value.trim()) || "Custom Agent";
        if (pillRecipient) pillRecipient.innerHTML = `🎯 Recipient: <strong style="color: #38bdf8; margin-left: 2px;">${safeEsc(val)}</strong>`;
        if (pillOnline) pillOnline.innerHTML = `✏️ Custom`;
        if (agentStatusTag) agentStatusTag.textContent = "Custom Name";
        if (textArea) textArea.placeholder = `Type your message to ${val}... (Ctrl+Enter to send)`;
        if (submitBtn) submitBtn.innerHTML = `<span>🚀 Send Direct Message to ${safeEsc(val)}</span>`;
        return;
      }

      if (customInput) customInput.style.display = "none";
      if (select) select.value = agentObj.agent;

      const isOnline = !!agentObj.online;
      if (pillRecipient) pillRecipient.innerHTML = `🎯 Recipient: <strong style="color: #38bdf8; margin-left: 2px;">${safeEsc(agentObj.agent)}</strong>`;
      if (pillOnline) {
        pillOnline.innerHTML = isOnline
          ? `<span class="esc-admin-pulse-dot" style="display:inline-block; margin-right:4px;"></span><span style="color:#34d399;font-weight:700;">Online</span>`
          : `⚪ Offline`;
      }
      if (agentStatusTag) {
        agentStatusTag.textContent = isOnline ? `🟢 Online (v${agentObj.version || '1.0.0'})` : "⚪ Offline";
        agentStatusTag.style.color = isOnline ? "#34d399" : "#94a3b8";
      }
      if (textArea) textArea.placeholder = `Type your message or instruction to ${agentObj.agent}... (Ctrl+Enter to send)`;
      if (submitBtn) submitBtn.innerHTML = `<span>🚀 Send Direct Message to ${safeEsc(agentObj.agent)}</span>`;

      // Check existing ticket/thread
      if (agentObj.latestTicketId) {
        if (existingBanner) {
          existingBanner.style.display = "flex";
          if (existingText) {
            const statusLabel = agentObj.latestTicketStatus === "resolved" ? "Resolved" : (agentObj.latestTicketStatus === "in_progress" ? "In Progress" : "Open");
            existingText.innerHTML = `Active conversation exists with <strong>${safeEsc(agentObj.agent)}</strong> (Thread #${safeEsc(agentObj.latestTicketId.slice(-6))}, ${statusLabel}).`;
          }
          if (openExistingBtn) {
            openExistingBtn.onclick = () => openThread(agentObj.latestTicketId);
          }
        }
      } else {
        if (existingBanner) existingBanner.style.display = "none";
      }
    }

    // Bind Admin Agent Selector Controls
    if (isAdmin) {
      const adminSelect = overlay.querySelector("#esc-admin-agent-select");
      const customInput = overlay.querySelector("#esc-admin-custom-name");
      const refreshAgentsBtn = overlay.querySelector("#esc-admin-refresh-agents");

      if (adminSelect) {
        adminSelect.addEventListener("change", () => {
          const val = adminSelect.value;
          if (!val) {
            selectAgentForAdmin(null);
          } else if (val === "__custom__") {
            selectAgentForAdmin({ isCustom: true, agent: "", online: false });
          } else {
            const foundOnline = (adminAgentsData.users || []).find(u => u.agent === val);
            const foundAll = (adminAgentsData.allAgents || []).find(a => a.agent === val);
            const target = foundOnline || foundAll || { agent: val, online: false };
            selectAgentForAdmin(target);
          }
        });
      }

      if (customInput) {
        customInput.addEventListener("input", () => {
          const val = customInput.value.trim();
          const pillRecipient = overlay.querySelector("#esc-admin-pill-target");
          const textArea = overlay.querySelector("#esc-support-text");
          const submitBtn = overlay.querySelector("#esc-support-submit");
          if (pillRecipient) pillRecipient.innerHTML = `🎯 Recipient: <strong style="color: #38bdf8; margin-left: 2px;">${safeEsc(val || "Custom Agent")}</strong>`;
          if (textArea) textArea.placeholder = `Type your message to ${val || 'agent'}... (Ctrl+Enter to send)`;
          if (submitBtn) submitBtn.innerHTML = `<span>🚀 Send Direct Message to ${safeEsc(val || 'Agent')}</span>`;
        });
      }

      if (refreshAgentsBtn) {
        refreshAgentsBtn.addEventListener("click", () => loadActiveAgentsForAdmin(true));
      }
    }

    // Submit New Ticket
    const submitBtn = overlay.querySelector("#esc-support-submit");
    const textArea = overlay.querySelector("#esc-support-text");

    if (textArea) {
      textArea.addEventListener("keydown", (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
          e.preventDefault();
          submitBtn.click();
        }
      });
    }

    submitBtn.addEventListener("click", () => {
      const text = textArea.value.trim();
      if (!text && !newTicketImage) {
        showToast("Please enter a description or attach a screenshot.", false);
        return;
      }

      let targetAgentName = "";
      let targetDevId = "";
      if (isAdmin) {
        if (!selectedAgent) {
          showToast("Please choose an agent to chat with.", false);
          return;
        }
        if (selectedAgent.isCustom) {
          const customInp = overlay.querySelector("#esc-admin-custom-name");
          targetAgentName = (customInp && customInp.value.trim()) || "";
          if (!targetAgentName) {
            showToast("Please enter a custom agent name.", false);
            return;
          }
        } else {
          targetAgentName = selectedAgent.agent;
          targetDevId = selectedAgent.devId || "";
        }
      }

      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span>⏳ Submitting...</span>`;

      getLicenseAuthData(({ devId, licenseKey, role }) => {
        const payload = {
          agentName: isAdmin ? targetAgentName : (currentSettings.agentName || (role === "guest" ? "Guest User" : "Staff")),
          deviceId: isAdmin ? (targetDevId || "") : devId,
          scriptVersion: SCRIPT_VERSION,
          pageUrl: window.location.href,
          text: text,
          imageBase64: newTicketImage,
          role: role,
          key: licenseKey,
          adminName: currentSettings.agentName || "Jetro (Admin)"
        };

        sendWorkerRequest({
          url: "https://hdjrz-license.rosechel05.workers.dev/api/support/ticket",
          method: "POST",
          data: payload
        }, (err, res) => {
          submitBtn.disabled = false;
          submitBtn.innerHTML = `<span>${isAdmin ? '🚀 Send Direct Message' : '🚀 Send Message'}</span>`;
          if (err || !res || !res.ok) {
            showToast("Submission failed: " + (err || (res && res.error) || "Error"), false);
            return;
          }
          showToast(isAdmin ? `🎉 Direct message sent to ${targetAgentName}!` : "🎉 Message sent to admin!");
          textArea.value = "";
          previewRemove.click();
          if (res.ticket && res.ticket.id) {
            openThread(res.ticket.id);
          } else {
            switchView("list");
          }
        });
      });
    });

    // View 2 (List Tickets / Inbox)
    const ticketsContainer = overlay.querySelector("#esc-support-tickets-container");
    const listRefreshBtn = overlay.querySelector("#esc-support-list-refresh");
    listRefreshBtn.addEventListener("click", () => loadAgentTicketsList(false));

    function loadAgentTicketsList(silent = false, onDone = null) {
      const finish = () => { if (onDone) onDone(); };
      if (!silent) {
        ticketsContainer.innerHTML = `<div style="text-align: center; padding: 20px; color: #64748b; font-size: 12px;">Loading messages...</div>`;
      }
      const fetchList = ({ devId, licenseKey, role }) => {
        const agent = currentSettings.agentName || (role === "guest" ? "Guest User" : "Staff");
        const url = `https://hdjrz-license.rosechel05.workers.dev/api/support/my-tickets?dev=${encodeURIComponent(devId || "")}&agent=${encodeURIComponent(agent)}&role=${encodeURIComponent(role)}&key=${encodeURIComponent(licenseKey)}&_t=${Date.now()}`;
        sendWorkerRequest({ url, method: "GET" }, (err, res) => {
          try {
            if (err || !res || !res.ok) {
              if (!silent) {
                ticketsContainer.innerHTML = `<div style="text-align: center; padding: 20px; color: #f87171; font-size: 12px;">Failed to load messages: ${safeEsc(err || (res && res.error) || "Error")}</div>`;
              }
              return;
            }
            const unreadCount = Number(res.unreadCount) || 0;
            if (tabUnreadBadge) {
              tabUnreadBadge.textContent = String(unreadCount);
              tabUnreadBadge.style.display = unreadCount > 0 ? "inline-block" : "none";
            }
            const dockBadge = document.getElementById("esc-dock-support-badge");
            if (dockBadge) dockBadge.style.display = unreadCount > 0 ? "block" : "none";

            const tickets = res.tickets || [];
            const newKey = tickets.map(t => `${t.id}_${t.updatedAt}_${t.unreadAdmin || t.unreadAgent || ''}`).join("|");
            if (silent && newKey === lastRenderedTicketsKey) {
              return; // No change in data, prevent DOM redraw/flicker
            }
            lastRenderedTicketsKey = newKey;

            if (tickets.length === 0) {
              ticketsContainer.innerHTML = `
                <div style="text-align: center; padding: 30px 10px; color: #64748b; font-size: 12px;">
                  ${isAdmin ? "No agent messages yet.<br>Incoming messages from fleet agents will appear here." : "No conversations yet.<br>Click <strong>'💬 Send Message / Report'</strong> above to talk with admin."}
                </div>
              `;
              return;
            }

            ticketsContainer.innerHTML = "";
            tickets.forEach((t) => {
              const item = document.createElement("div");
              item.className = "esc-support-ticket-item";
              const dateStr = t.updatedAt ? new Date(t.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' }) : "";
              const statusClass = t.status === "resolved" ? "esc-support-status-resolved" : (t.status === "in_progress" ? "esc-support-status-in_progress" : "esc-support-status-open");
              const statusLabel = t.status === "resolved" ? "Resolved" : (t.status === "in_progress" ? "In Progress" : "Open");

              const isUnread = isAdmin ? !!t.unreadAdmin : !!(t.unreadAgent || t.unread);
              const agentHeader = isAdmin
                ? `<span style="font-weight: 700; color: #38bdf8;">👤 ${safeEsc(t.agentName || "Agent")}</span>`
                : `<strong style="color: #38bdf8;">#${safeEsc(t.id ? t.id.slice(-6) : "")}</strong>`;

              const secondPill = isAdmin
                ? `<span style="font-size: 10px; color: #64748b; font-family: monospace;">#${safeEsc(t.id ? t.id.slice(-6) : "")}</span>`
                : "";

              const urlSnippet = (isAdmin && t.pageUrl) ? `<div style="font-size: 10px; color: #64748b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 2px;">🌐 ${safeEsc(t.pageUrl.replace(/^https?:\/\//, ''))}</div>` : "";

              item.innerHTML = `
                <div class="esc-support-ticket-header">
                  <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                    ${agentHeader}
                    ${secondPill}
                    <span class="esc-support-status-badge ${statusClass}">${statusLabel}</span>
                    ${isUnread ? `<span style="width: 8px; height: 8px; background: #ef4444; border-radius: 50%; display: inline-block; box-shadow: 0 0 6px rgba(239,68,68,0.7);" title="Unread"></span>` : ""}
                  </div>
                  <span style="font-size: 11px; color: #64748b;">${safeEsc(dateStr)}</span>
                </div>
                <div class="esc-support-ticket-snippet">${safeEsc(t.snippet || t.lastMessage || "(No text, screenshot attached)")}</div>
                ${urlSnippet}
              `;
              item.addEventListener("click", () => openThread(t.id));
              ticketsContainer.appendChild(item);
            });
          } finally {
            finish();
          }
        });
      };

      if (cachedAuth) {
        fetchList(cachedAuth);
      } else {
        getLicenseAuthData((auth) => {
          cachedAuth = auth;
          fetchList(auth);
        });
      }
    }

    // View 3 (Thread View)
    const threadMeta = overlay.querySelector("#esc-support-thread-meta");
    const threadMsgs = overlay.querySelector("#esc-support-thread-messages");
    const replyText = overlay.querySelector("#esc-support-reply-text");
    const replyAttachBtn = overlay.querySelector("#esc-support-reply-attach-btn");
    const replyFileInput = overlay.querySelector("#esc-support-reply-file-input");
    const replyPreviewWrap = overlay.querySelector("#esc-support-reply-preview-wrap");
    const replyPreviewImg = overlay.querySelector("#esc-support-reply-preview-img");
    const replyPreviewInfo = overlay.querySelector("#esc-support-reply-preview-info");
    const replyPreviewRemove = overlay.querySelector("#esc-support-reply-preview-remove");
    const replySubmitBtn = overlay.querySelector("#esc-support-reply-submit");

    replyAttachBtn.addEventListener("click", () => replyFileInput.click());
    replyFileInput.addEventListener("change", () => {
      if (replyFileInput.files && replyFileInput.files[0]) {
        attachReplyScreenshot(replyFileInput.files[0]);
      }
    });

    replyPreviewImg.addEventListener("click", () => {
      if (threadReplyImage) openScreenshotLightbox(threadReplyImage);
    });

    replyPreviewRemove.addEventListener("click", () => {
      threadReplyImage = null;
      replyFileInput.value = "";
      replyPreviewWrap.style.display = "none";
    });

    function attachReplyScreenshot(file) {
      showToast("Compressing screenshot...", false);
      compressImageFile(file, 1600, 0.82, (err, base64, info) => {
        if (err || !base64) {
          showToast("Failed to process image: " + err, false);
          return;
        }
        threadReplyImage = base64;
        replyPreviewImg.src = base64;
        replyPreviewInfo.textContent = `Screenshot (${info.width}x${info.height})`;
        replyPreviewWrap.style.display = "flex";
        showToast("📸 Screenshot attached to reply!");
      });
    }

    let isPollingActiveThread = false;
    let scheduleNextThreadTick = null;

    function openThread(ticketId) {
      activeTicketId = ticketId;
      switchView("thread");
      threadMeta.innerHTML = `<span>Loading thread...</span>`;
      threadMsgs.innerHTML = `<div style="text-align:center;padding:20px;color:#64748b;font-size:12px;">Loading messages...</div>`;

      // Start the zero-congestion self-scheduling thread poll loop (350ms delay, strict in-flight guard)
      if (threadPollTimer) clearTimeout(threadPollTimer);
      scheduleNextThreadTick = (delayMs = 350) => {
        if (threadPollTimer) clearTimeout(threadPollTimer);
        threadPollTimer = setTimeout(() => {
          if (currentView !== "thread" || !activeTicketId || !document.getElementById("esc-support-overlay")) {
            threadPollTimer = null;
            return;
          }
          if (isPollingActiveThread) {
            scheduleNextThreadTick(100);
            return;
          }
          isPollingActiveThread = true;
          pollActiveThreadSilently(activeTicketId, () => {
            isPollingActiveThread = false;
            scheduleNextThreadTick(350);
          });
        }, delayMs);
      };
      scheduleNextThreadTick(350);

      const runInitialLoad = ({ devId, licenseKey, role }) => {
        const agent = currentSettings.agentName || (role === "guest" ? "Guest User" : "Staff");
        const url = `https://hdjrz-license.rosechel05.workers.dev/api/support/ticket/${encodeURIComponent(ticketId)}?dev=${encodeURIComponent(devId || "")}&agent=${encodeURIComponent(agent)}&role=${encodeURIComponent(role)}&key=${encodeURIComponent(licenseKey)}&_t=${Date.now()}`;
        sendWorkerRequest({ url, method: "GET" }, (err, res) => {
          if (err || !res || !res.ok || !res.ticket) {
            threadMsgs.innerHTML = `<div style="text-align:center;padding:20px;color:#f87171;font-size:12px;">Failed to load thread: ${safeEsc(err || (res && res.error) || "Error")}</div>`;
            return;
          }
          const ticket = res.ticket;
          renderThreadHeader(ticket, licenseKey);

          // Mark read locally
          const dockBadge = document.getElementById("esc-dock-support-badge");
          if (dockBadge) dockBadge.style.display = "none";
          if (tabUnreadBadge) tabUnreadBadge.style.display = "none";
          lastSeenSupportUnread = 0;

          currentThreadMsgCount = (ticket.messages || []).length;
          renderThreadMessages(ticket.messages || []);
        });
      };

      if (cachedAuth) {
        runInitialLoad(cachedAuth);
      } else {
        getLicenseAuthData((auth) => {
          cachedAuth = auth;
          runInitialLoad(auth);
        });
      }
    }

    function renderThreadHeader(ticket, licenseKey) {
      const statusClass = ticket.status === "resolved" ? "esc-support-status-resolved" : (ticket.status === "in_progress" ? "esc-support-status-in_progress" : "esc-support-status-open");
      const statusLabel = ticket.status === "resolved" ? "Resolved" : (ticket.status === "in_progress" ? "In Progress" : "Open");

      let adminActionsHtml = "";
      if (isAdmin) {
        const isResolved = ticket.status === "resolved";
        adminActionsHtml = `
          <button type="button" id="esc-support-thread-resolve-btn" style="background: ${isResolved ? 'rgba(34, 197, 94, 0.2)' : 'rgba(148, 163, 184, 0.15)'}; border: 1px solid ${isResolved ? '#22c55e' : '#475569'}; color: ${isResolved ? '#4ade80' : '#cbd5e1'}; border-radius: 4px; padding: 2px 7px; font-size: 10px; cursor: pointer;" title="Toggle Resolved">
            ${isResolved ? "✓ Resolved" : "Mark Resolved"}
          </button>
          <button type="button" id="esc-support-thread-delete-btn" style="background: rgba(239, 68, 68, 0.12); border: 1px solid rgba(239, 68, 68, 0.3); color: #f87171; border-radius: 4px; padding: 2px 7px; font-size: 10px; cursor: pointer;" title="Delete Ticket">
            🗑️
          </button>
        `;
      }

      threadMeta.innerHTML = `
        <span style="font-weight: 600; color: #e2e8f0;">👤 ${safeEsc(ticket.agentName || "Agent")}</span>
        <span class="esc-support-status-badge ${statusClass}">${statusLabel}</span>
        ${adminActionsHtml}
        <button type="button" id="esc-support-thread-refresh-btn" style="background: rgba(56, 189, 248, 0.12); border: 1px solid rgba(56, 189, 248, 0.25); color: #38bdf8; border-radius: 4px; padding: 2px 6px; font-size: 10px; cursor: pointer;" title="Refresh messages">🔄</button>
      `;

      const refreshBtn = threadMeta.querySelector("#esc-support-thread-refresh-btn");
      if (refreshBtn) refreshBtn.addEventListener("click", () => pollActiveThreadSilently(ticket.id));

      if (isAdmin) {
        const resolveBtn = threadMeta.querySelector("#esc-support-thread-resolve-btn");
        if (resolveBtn) {
          resolveBtn.addEventListener("click", () => {
            const nextStatus = ticket.status === "resolved" ? "open" : "resolved";
            resolveBtn.disabled = true;
            sendWorkerRequest({
              url: `https://hdjrz-license.rosechel05.workers.dev/api/support/ticket/${encodeURIComponent(ticket.id)}/status`,
              method: "POST",
              data: { status: nextStatus, key: licenseKey }
            }, (err, res) => {
              resolveBtn.disabled = false;
              if (!err && res && res.ok) {
                ticket.status = nextStatus;
                renderThreadHeader(ticket, licenseKey);
                showToast(`Ticket status updated to ${nextStatus}!`);
              } else {
                showToast("Failed to update status: " + (err || "Error"), false);
              }
            });
          });
        }

        const deleteBtn = threadMeta.querySelector("#esc-support-thread-delete-btn");
        if (deleteBtn) {
          deleteBtn.addEventListener("click", () => {
            if (!confirm("Are you sure you want to delete this ticket and conversation?")) return;
            deleteBtn.disabled = true;
            sendWorkerRequest({
              url: `https://hdjrz-license.rosechel05.workers.dev/api/support/ticket/${encodeURIComponent(ticket.id)}?key=${encodeURIComponent(licenseKey)}`,
              method: "DELETE"
            }, (err, res) => {
              deleteBtn.disabled = false;
              if (!err && res && res.ok) {
                showToast("Ticket deleted!");
                switchView("list");
              } else {
                showToast("Failed to delete ticket: " + (err || "Error"), false);
              }
            });
          });
        }
      }
    }

    function pollActiveThreadSilently(ticketId, cb) {
      const finish = () => { if (cb) cb(); };
      const fetchThread = ({ devId, licenseKey, role }) => {
        const agent = currentSettings.agentName || (role === "guest" ? "Guest User" : "Staff");
        const url = `https://hdjrz-license.rosechel05.workers.dev/api/support/ticket/${encodeURIComponent(ticketId)}?dev=${encodeURIComponent(devId || "")}&agent=${encodeURIComponent(agent)}&role=${encodeURIComponent(role)}&key=${encodeURIComponent(licenseKey)}&_t=${Date.now()}`;
        sendWorkerRequest({ url, method: "GET" }, (err, res) => {
          try {
            if (!err && res && res.ok && res.ticket) {
              const msgs = res.ticket.messages || [];
              if (msgs.length !== currentThreadMsgCount) {
                currentThreadMsgCount = msgs.length;
                renderThreadMessages(msgs);
              }
              const statusClass = res.ticket.status === "resolved" ? "esc-support-status-resolved" : (res.ticket.status === "in_progress" ? "esc-support-status-in_progress" : "esc-support-status-open");
              const statusLabel = res.ticket.status === "resolved" ? "Resolved" : (res.ticket.status === "in_progress" ? "In Progress" : "Open");
              const badge = threadMeta.querySelector(".esc-support-status-badge");
              if (badge) {
                badge.className = `esc-support-status-badge ${statusClass}`;
                badge.textContent = statusLabel;
              }
            }
          } finally {
            finish();
          }
        });
      };

      if (cachedAuth) {
        fetchThread(cachedAuth);
      } else {
        getLicenseAuthData((auth) => {
          cachedAuth = auth;
          fetchThread(auth);
        });
      }
    }

    function renderThreadMessages(messages) {
      threadMsgs.innerHTML = "";
      if (messages.length === 0) {
        threadMsgs.innerHTML = `<div style="text-align:center;padding:20px;color:#64748b;font-size:12px;">No messages yet.</div>`;
        return;
      }
      messages.forEach((m) => {
        const isMsgAdmin = m.sender === "admin" || m.senderRole === "admin";
        const isMe = isAdmin ? isMsgAdmin : !isMsgAdmin;
        const bubble = document.createElement("div");
        bubble.className = `esc-support-msg ${isMe ? "esc-support-msg-me" : "esc-support-msg-other"}`;

        let senderLabel;
        if (isAdmin) {
          senderLabel = isMsgAdmin ? (m.senderName || "Jetro (Admin)") : (m.senderName || "Agent");
        } else {
          senderLabel = isMsgAdmin ? (m.senderName || "👑 Admin Support") : (m.senderName || "You");
        }

        const ts = m.timestamp || m.createdAt || Date.now();
        const timeStr = new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const imgSrc = m.image || m.imageBase64;
        let imgHtml = "";
        if (imgSrc) {
          imgHtml = `<img src="${safeEsc(imgSrc)}" class="esc-support-msg-img" title="Click to zoom screenshot">`;
        }

        bubble.innerHTML = `
          <div class="esc-support-msg-sender">
            <span>${safeEsc(senderLabel)}</span>
            <span style="opacity: 0.6; font-size: 9px; margin-left: auto;">${safeEsc(timeStr)}</span>
          </div>
          ${m.text ? `<div style="white-space: pre-wrap; word-break: break-word;">${safeEsc(m.text)}</div>` : ""}
          ${imgHtml}
        `;

        const imgEl = bubble.querySelector(".esc-support-msg-img");
        if (imgEl && imgSrc) {
          imgEl.addEventListener("click", () => openScreenshotLightbox(imgSrc));
        }

        threadMsgs.appendChild(bubble);
      });
      threadMsgs.scrollTop = threadMsgs.scrollHeight;
    }

    function appendOptimisticBubble(m) {
      const bubble = document.createElement("div");
      bubble.className = "esc-support-msg esc-support-msg-me esc-msg-optimistic";
      bubble.id = "esc-msg-optimistic";
      bubble.style.opacity = "0.82";

      const timeStr = new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      let imgHtml = "";
      if (m.image) {
        imgHtml = `<img src="${safeEsc(m.image)}" class="esc-support-msg-img" title="Click to zoom screenshot">`;
      }

      bubble.innerHTML = `
        <div class="esc-support-msg-sender">
          <span>${safeEsc(m.senderName)}</span>
          <span style="opacity: 0.6; font-size: 9px; margin-left: auto;">${safeEsc(timeStr)} ⏳</span>
        </div>
        ${m.text ? `<div style="white-space: pre-wrap; word-break: break-word;">${safeEsc(m.text)}</div>` : ""}
        ${imgHtml}
      `;

      const emptyDiv = threadMsgs.querySelector("div");
      if (emptyDiv && emptyDiv.textContent.includes("No messages yet")) {
        threadMsgs.innerHTML = "";
      }

      threadMsgs.appendChild(bubble);
      threadMsgs.scrollTop = threadMsgs.scrollHeight;
    }

    function removeOptimisticBubble() {
      const opt = threadMsgs.querySelector("#esc-msg-optimistic");
      if (opt) opt.remove();
    }

    replyText.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        replySubmitBtn.click();
      }
    });

    // Submit Reply
    replySubmitBtn.addEventListener("click", () => {
      const text = replyText.value.trim();
      const attachedImage = threadReplyImage;
      if (!text && !attachedImage) {
        showToast("Please write a message or attach a screenshot.", false);
        return;
      }
      if (!activeTicketId) return;

      const optimisticSender = isAdmin
        ? (currentSettings.agentName ? `${currentSettings.agentName} (Admin)` : "Jetro (Admin)")
        : (currentSettings.agentName || (licenseRole === "guest" ? "Guest User" : "Staff"));

      appendOptimisticBubble({
        senderName: optimisticSender,
        text: text,
        image: attachedImage,
        timestamp: Date.now()
      });

      // Clear immediately for 0ms response feel
      replyText.value = "";
      replyPreviewRemove.click();

      replySubmitBtn.disabled = true;
      replySubmitBtn.innerHTML = `⏳ Sending...`;

      getLicenseAuthData(({ devId, licenseKey, role }) => {
        const senderName = isAdmin
          ? (currentSettings.agentName ? `${currentSettings.agentName} (Admin)` : "Jetro (Admin)")
          : (currentSettings.agentName || (role === "guest" ? "Guest User" : "Staff"));

        const payload = {
          agentName: senderName,
          senderName: senderName,
          deviceId: devId,
          text: text,
          imageBase64: attachedImage,
          role: role,
          key: licenseKey
        };

        sendWorkerRequest({
          url: `https://hdjrz-license.rosechel05.workers.dev/api/support/ticket/${encodeURIComponent(activeTicketId)}/reply`,
          method: "POST",
          data: payload
        }, (err, res) => {
          replySubmitBtn.disabled = false;
          replySubmitBtn.innerHTML = `💬 Send Reply`;
          if (err || !res || !res.ok) {
            showToast("Reply failed: " + (err || (res && res.error) || "Error"), false);
            replyText.value = text;
            removeOptimisticBubble();
            return;
          }
          if (res.ticket && res.ticket.messages) {
            currentThreadMsgCount = res.ticket.messages.length;
            renderThreadMessages(res.ticket.messages);
            if (scheduleNextThreadTick) scheduleNextThreadTick(300);
          } else {
            openThread(activeTicketId);
          }
        });
      });
    });

    if (isAdmin) {
      loadAgentTicketsList();
    }

    // Initial check for unread count in tab
    checkAgentSupportUnread();
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
      } else if (request.action === "OPEN_SUPPORT") {
        openSupportModal();
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
        const path = (window.location && window.location.pathname) || "";
        if (!/\/user\/[^/]+/i.test(path) && !isUserOverviewPage()) {
          sendResponse({ publicId: "" });
          return;
        }
        const p = scrapePlayerCredentials() || {};
        const pid = kycPlainUid(p.publicId || p.userId);
        if (!pid || /^(?:input|inputs|tab|tabs|item|items|page|pages|note|notes|duplicate|duplicates|attachment|attachments|doc|docs|file|files|field|fields|select|button)$/i.test(pid)) {
          sendResponse({ publicId: "" });
          return;
        }
        const attrs = scrapeUserAttributes();
        sendResponse({
          publicId: pid,
          userId: p.userId || "",
          userCombined: p.userCombined || "",
          kycVerified: p.kycVerified || "",
          name: attrs.name || p.name || "",
          dob: attrs.dob || p.dob || ""
        });
      } else if (request.action === "INJECT_KYC_OLD_NOTE") {
        const rawTargets = request && request.targetTabIds;
        const targetIds = Array.isArray(rawTargets) ? rawTargets.map(id => String(id).replace(/[()]/g, "").trim().toLowerCase()).filter(Boolean) : [];
        const myP = scrapePlayerCredentials() || {};
        const myPublic = String(myP.publicId || "").replace(/[()]/g, "").trim().toLowerCase();
        const myUser = String(myP.userId || "").replace(/[()]/g, "").trim().toLowerCase();

        if (targetIds.length > 0) {
          const match = targetIds.some(tid => (myPublic && tid === myPublic) || (myUser && tid === myUser));
          if (!match) {
            sendResponse({ success: false, skipped: true });
            return true;
          }
        }

        const note = buildKycOldAccountNote(request && request.newAccountUid);
        injectUserNoteOnPage(note, (injected) => {
          if (injected) {
            showToast("Old account User Note injected!", true);
          }
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
        const licenseOverlay = document.getElementById("esc-license-overlay");
        if (licenseOverlay) licenseOverlay.remove();

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

  // Global safety net: ensure Escape always cancels or closes open modals
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      const overlays = Array.from(document.querySelectorAll(".esc-modal-overlay, .esc-changelog-overlay"));
      if (overlays.length > 0) {
        const topOverlay = overlays[overlays.length - 1];
        if (topOverlay) {
          const closeBtn = topOverlay.querySelector(".esc-icon-btn, #esc-modal-close, #esc-settings-close, #esc-changelog-close, #esc-reason-pick-cancel, #esc-btn-cancel, #esc-audit-close, #esc-edit-option-cancel, #esc-add-option-cancel");
          if (closeBtn && typeof closeBtn.click === "function") {
            closeBtn.click();
          } else {
            closeOverlayZoom(topOverlay);
          }
        }
      }
    }
  });

  // Initialize
  loadSettings(() => {
    loadLicenseRole(() => {
      startPageMonitor();
      if (!isLicensed()) {
        setTimeout(() => openLicenseModal(), 300);
      } else {
        try {
          if (typeof sessionStorage !== "undefined" && sessionStorage.getItem("esc_just_updated")) {
            const updatedVer = sessionStorage.getItem("esc_just_updated");
            sessionStorage.removeItem("esc_just_updated");
            setTimeout(() => {
              showToast(`🎉 Successfully updated to v${safeEsc(updatedVer)}!`);
            }, 600);
          } else if (typeof localStorage !== "undefined") {
            const lastSeen = localStorage.getItem("hdjrz_last_seen_ver");
            if (lastSeen && isVersionBelow(lastSeen, SCRIPT_VERSION)) {
              setTimeout(() => {
                showToast(`✨ hdjrzTools updated to v${safeEsc(SCRIPT_VERSION)}!`);
              }, 800);
            }
          }
          if (typeof localStorage !== "undefined") {
            localStorage.setItem("hdjrz_last_seen_ver", SCRIPT_VERSION);
          }
        } catch (e) {}
        checkAgentSupportUnread();
      }
    });
  });
})();
