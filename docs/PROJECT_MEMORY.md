# hdjrzTools Chrome Extension & Userscript — Project Memory

## 0. Overview & Purpose
**Current Production Version**: `v1.4.5` (Dual-Channel Release Architecture, Centralized Web Admin Portal, Staged Template Deployment Pipeline)

This tool automates player escalation workflows on backoffice User Overview pages (e.g. `nano-admin.bet88.ph`):
- **Dynamic Player Scraping (Any Client / Any Player)**: Reads player credentials directly from the DOM (`User ID`, `Public ID`, `Affiliate`, `Created Date`, `KYC Status`, `Username`, `Maya Mini App ID`, `DOB`, `Name`). Operates dynamically for *all* searched users with **zero hardcoded sample fallbacks**.
- **Dynamic User ID Extraction**: Scrapes whatever is in the "User ID" on screen. If the client ID has parentheses (e.g. `15511274 (4LG14LGG)`), the parenthetical ID is prioritized. If it's a numeric or plain ID (e.g. `1172031960185783`), that exact ID is used in `{userId}`.
- **Interactive User ID Input in Confirmation Modal**: The confirmation modal displays a prominent, editable "Client User ID" field. If scraped from screen, it is auto-filled. If opening a new client or if not detected, the agent can type/paste any User ID and the live note preview updates in real time.
- **Dual-Tier License & Device Security**: Authenticated against Cloudflare Worker API (`https://hdjrz-license.rosechel05.workers.dev/`) with hardware-bound device IDs (`hdjrzLicenseDeviceId`).
  - **👑 Administrator**: Access to Web Admin Portal, early-access release channels, template staging/publishing, active user telemetry, and full configuration.
  - **🛡️ Staff Agent**: Clean, locked-down player escalation workflow; cloud templates sync-only mode; admin links and export tools suppressed.
- **Web Admin Portal (`/admin`)**: Centralized web dashboard for license key generation, device resets, live staff telemetry, staged template authoring, automated 8-point validation, and release channel management.
- **Dual-Channel Release Architecture**: Allows Admins to test new updates on Admin devices first (`adminLatestVersion`) while keeping all staff agents on stable production (`agentLatestVersion`), deployable with 1-click fleet promotion from a single unified `main` branch.

---

## 1. Stack & Architecture
- **Client Platform**: Tampermonkey Userscript (`hdjrzTools.user.js` / `dist/bundle.js`) & Chrome Extension (Manifest V3)
- **Edge Backend**: Cloudflare Worker with KV storage (`LICENSES`), RESTful modular API (`backend/` router architecture) and standalone deployment script (`license/worker.js`)
- **Permissions**: `GM_xmlhttpRequest`, `GM_setValue`, `GM_getValue`, `GM_setClipboard`, `storage`, `clipboardWrite`
- **Host Permissions**: `<all_urls>` (runs on backoffice domain/IP and authorized web pages)
- **Directory Layout**:
  - `manifest.json`: Extension Manifest V3 definition
  - `content/templates.js`: Escalation presets (all 14 types), per-option User Notes / Zoom wording, sequence order, and note renderer
  - `content/content.js`: Universal DOM scraper, horizontal/vertical dock renderer, confirmation modal, in-page settings modal, clipboard & User Notes injector, update management
  - `content/content.css`: Theme styles, dock layout, chips, modal styling, haptic animations, toast notifications
  - `backend/`: Modular Cloudflare Worker backend:
    - `worker.js`: Cloudflare Worker entry point and static asset/proxy handler
    - `routes/`: RESTful routes (`auth.js`, `licenses.js`, `agents.js`, `templates.js`, `escalations.js`, `audits.js`, `system.js`)
    - `services/`: Business logic services (`licenseService.js`, `systemService.js`, `templateService.js`, `escalationService.js`, `auditService.js`)
    - `views/adminPortal.js`: Full Web Admin Portal HTML/CSS/JS single-page application
  - `license/worker.js`: Standalone bundled Cloudflare Worker script for manual web editor deployment
  - `build-userscript.js`: Build script with `javascript-obfuscator` integration (`npm run build`)
  - `dist/bundle.js`: Compiled and obfuscated bundle
  - `hdjrzTools.user.js`: Compiled Tampermonkey userscript
  - `hdjrzTools.loader.user.js`: Lightweight userscript auto-loader
  - `docs/PROJECT_MEMORY.md`: Authoritative architectural documentation and memory bank

---

## 2. Dynamic User ID Extraction & Targeting
When viewing any client on the backoffice overview page:
- **Universal DOM Parsing**:
  - Checks line-by-line page text for `User ID: ...`, `Player ID: ...`, `Account ID: ...`.
  - Checks table cells `<th>User ID</th><td>...</td>`, sibling cells, definition lists (`<dt>` / `<dd>`), and input values.
  - Checks URL search parameters (`?userId=...`, `?id=...`).
- **Parentheses Prioritization**:
  - If the client User ID is formatted with parentheses (e.g. `15511274 (4LG14LGG)`), the parenthetical code is used as the target User ID `{userId}`.
  - If the client User ID is a standard numeric or alphanumeric ID without parentheses (e.g. `1172031960185783`), that exact ID is used as `{userId}`.
- **No Hardcoded Sample IDs**:
  - There are NO hardcoded sample IDs (e.g. no fake fallbacks).
  - If no client is detected, the toolbar displays `No Player Detected` and the confirmation modal lets the agent enter or paste the client ID.
- **Dynamic Tokens**:
  - `{userId}`: Target client User ID (from screen or modal input).
  - `{targetId}`: Same as `{userId}`.
  - `{numericId}`: Numeric portion of the client ID.
  - `{publicId}`: Parenthetical portion (if present).
  - `{userCombined}`: Full combined User ID as shown on screen.
- **Template Output Example**:
  `ACR / 4LG14LGG / Losing player` or `ACR / 1172031960185783 / Losing player`

---

## 3. Dynamic Options Management (Add / Remove / Click Reason)
Under Settings (gear) — **one screen**:
1. Rows stay one line: badge, name, **Edit**, **Remove**. Name tap does not expand.
2. **Edit** opens a popup for that button’s **User Notes**, **Zoom copy**, and **Reasons** (first reason is default) on every code, including **KYC SWITCH** and **ACR-PAGCOR**. **+ Add reason** keeps a blank row until Apply. Extra note/Zoom boxes show if the preset already has them. Apply updates the list in memory; **Save Changes** still writes storage. Guest licenses always use the factory 14 codes (not extra imported buttons). Import overlays that JSON’s reasons, User Notes, and Zoom onto those codes. They cannot Edit, Remove, Add, Restore, or Export; they can Import, change Defaults, and open Audit. Guest rows are badge + name only (no per-button User Notes/Zoom flags). Guests use Defaults: Open Zoom on Confirm & Execute, Insert User Notes on Confirm, and Copy Zoom text to clipboard. Return to Users list is admin-only (guest Confirm stays on the player). If a button has two or more reasons in Settings, tapping it opens **Which reason?** (that Settings list only). Confirm has no reason dropdown. After Which reason?, Confirm has no User Notes or Zoom dropdowns except **KYC SWITCH** (**2 accounts or 3 or more**, then Which reason? if needed). The first pick still pairs notes/Zoom (REACT NOT, NDRP Custom watchlist, and the rest). **KYC SWITCH** still writes New Verified notes on this tab and Old account on the other tab.
3. KYC SWITCH / REACT NOT / NDRP show their extra note or Zoom boxes with plain labels in the Edit popup.
4. **+ Add a button** beside **Restore 14 Presets** opens a popover: Button name, then checkboxes for **Reason**, **User Notes**, and **Zoom copy**. Reason uses the same list as Edit (**+ Add reason**, first is default). Only the ticked fields show templates. Unticked fields save empty (Zoom-only if User Notes is off). **Add to bar** then **Save Changes**.
5. **Restore 14 Presets** then **Save Changes** (full reset). User Notes from BIT88 apply on load without Restore; missing presets (e.g. UA WO/FUNDS) are appended.
6. Hidden on purpose: glossary, templates tab, color/chip, Auto Find User. Defaults sit in the **right** column: agent name (blank by default — each agent types their own; no factory name such as Katherine Semana), Zoom URL, Bar layout (Horizontal / Vertical), the four action checkboxes (Zoom, User Notes, clipboard, return to Users), and **Audit**. Those four apply to **every** button. Confirm does not show them and cannot change them. **Save Changes** writes to `chrome.storage.local` so Zoom/User Notes wording is not dropped. Footer **Export** (admin) / **Import** backup buttons, reasons, and Defaults as `hdjrzTools-settings.json` (not Audit). Guest sees Import only. Audit list is Player UID + process; click opens the full row.

---

## 4. Default 14 Escalation Presets (Image 2 Sequence)

| # | Code | Full Meaning | Group | Top Chip Indicator | Button Color | Default Click Reason |
|---|---|---|---|---|---|---|
| 1 | **ACR** | Account Closure Request | Account Closure | Red | `#2563eb` (Blue) | `Losing player` |
| 2 | **ACR-PAGCOR** | Account Closure Request (PAGCOR) | Account Closure | Red | `#1d4ed8` (Deep Blue) | `PAGCOR exclusion list / regulatory compliance` |
| 3 | **ACR - PERMA** | Permanent Account Closure | Account Closure | Red | `#7f1d1d` (Maroon) | `Permanent closure requested / Non-negotiable ban` |
| 4 | **REACT** | Account Reactivation Request | Reactivation | Red | `#059669` (Green) | `Player requested account reactivation` |
| 5 | **REACT NOT** | Reactivation Not Allowed | Reactivation | Green (`R.NOT`) | `#0f766e` (Dark Teal) | `Not eligible for reactivation / Permanent exclusion` |
| 6 | **NGP NON-X** | NGP Non-Exclusive Player | Special Programs | Amber (`R.UA`) | `#d97706` (Orange) | `NGP Non-Exclusive review` |
| 7 | **NDRP** | Non-Deposit Reward Program | Financial & Rewards | Red | `#6d28d9` (Purple) | `Non-Deposit Reward credited / claim inquiry` |
| 8 | **UA W/FUNDS** | Unauthorized Access / Underage with Funds | Security & Fraud | Red (`For escalation`) | `#7c3aed` (Bright Purple) | `Suspected account takeover with remaining balance` |
| 9 | **UA WO/FUNDS** | Underage without funds | Security & Fraud | Red | `#6d28d9` (Purple) | `Underage without funds` |
| 10 | **MANUAL KYC** | Manual KYC Document Review | KYC & Verification | Red | `#db2777` (Pink) | `Review Needed` |
| 11 | **KYC SWITCH** | KYC Verification Switch | KYC & Verification | Teal | `#0891b2` (Cyan) | `Switch verification channel requested` |
| 12 | **GLIFE.1** | GLife Escalation Tier 1 | GLife Partner | Red | `#0d9488` (Teal) | `GLife mini-app sync issue / Tier 1 inquiry` |
| 13 | **GLIFE.2** | GLife Escalation Tier 2 | GLife Partner | Red | `#115e59` (Deep Teal) | `GLife Tier 2 high-priority escalation` |
| 14 | **ABUSER** | Bonus / Promotion Abuse Flag | Risk & Compliance | Red | `#334155` (Slate) | `Bonus / Promotional abuse flagged` |

**Bar layout:** Horizontal = **1 row** across the top (can sit the full width / middle). Vertical = stacked buttons in a right-side column (not centered). There is no yellow “Always enter and pin the notes…” footer.

---

## 5. Key Operational Rules & UX
1. **User Note Injection on Confirm & Execute**:
   - Confirm is preview-only. Pasting CID or User ID updates the live preview only.
   - On **Confirm & Execute**, the extension clicks the `+` button in the User Notes card if needed and injects that button’s User Notes text.
   - Then it copies the Zoom note, shows the toast, and opens Zoom only if those Settings Defaults are on.
   - Changing Reason in Confirm updates preview only until Confirm & Execute.
2. **Accidental Click Prevention & Dual Preview**:
   - Clicking an escalation category (bar, keyboard, or toolbar trigger) opens Confirm as preview only. If that button has **two or more reasons** (preset or Settings), a **Which reason?** popup appears first and Confirm uses that pick — even if old Settings saved only one reason. **KYC SWITCH** opens **2 ACCOUNTS / 3 OR MORE** only, then Confirm. Horizontal stays 1 row; Vertical stacks the same 14 buttons on the right.
   - Confirm stays within ~92vh. User Notes and Zoom previews show the full note (no inner scroll). The body scrolls only if KYC SWITCH is taller than the screen. Header and Confirm/Cancel stay on screen.
   - On clicking **Confirm & Execute**, User Notes / clipboard / Zoom / return follow Settings Defaults for all codes (KYC 2-account still skips return so the other tab can be pinned).
3. **In-Page Settings Access (CID from User Notes & Zoom Desktop Protocol)**:
   - The gear button on the bar opens an in-page modal overlay. Settings, Confirm, and ACR/KYC reason-pick use the same spring popover. Settings overlay stays clear. Reduced motion fades ~180ms instead.
   - Agents can configure options, click reasons, agent name, and Zoom link (defaulting to `zoomus://` for the installed PC Zoom desktop app).
   - CID is filled from the latest User Notes line (`CODE / CID / reason`) when the note uses Insert CID. If no note exists yet and that code requires CID, Confirm lets the agent type CID once. CID is only on ACR, ACR-PAGCOR, ACR - PERMA, REACT, REACT NOT, NGP NON-X, UA W/FUNDS, UA WO/FUNDS, NDRP, and ABUSER. Settings never requires curly-brace tokens.
4. **Universal Page Visibility**:
   - The horizontal bar loads by default on any web page.
   - On backoffice User Overview: automatically detects the live client's User ID and displays the full `Player: {numeric} ({publicId})` (vertical bar wraps; does not clip).
   - On pages where no player is detected: cleanly displays `No Player Detected`. Clicking any button opens the modal with an editable User ID field so you can enter or test any client ID.
5. **Close and Toggle Controls**:
   - Close (`✕`) button directly on the bar header hides it on the current tab.
   - The browser extension popup includes a **Toggle Floating Bar (Show / Hide)** button to bring the bar back or dismiss it anytime.
6. **Bar layout (Horizontal or Vertical)**:
   - **Horizontal** (default): one options row, inset `8px` left and right across the top.
   - **Vertical**: pinned `right: 8px`, ~220px wide, buttons stacked; header row is **hdjrzTools** with refresh / Settings / minimize / close on the right, player ID on the next line (full ID, wraps). **Minimize** hides the 14 buttons only; the header stays. The list still scrolls if it is taller than the window, but the scrollbar is hidden. Drag moves it up/down only. Tooltips open to the left. Horizontal minimized is a **single-row pill**: logo + short player ID + Expand only.
   - Standalone chip indicator strips above buttons stay off the live dock.
   - Any configured tag (e.g. `R.NOT`, `R.UA`, `For escalation`) is in the button hover tooltip.
   - Buttons stay 32px tall with `nowrap` + ellipsis.
7. **hdjrzTools branding**:
   - Product name is **hdjrzTools** (bar, Chrome extension name, popup, options). The circular JET mark stays as the icon:
     - Extension icons: `icons/icon16.png`, `icons/icon48.png`, `icons/icon128.png` (and original in `icons/jet-logo.jpg`).
     - Floating bar header: circular logo next to "hdjrzTools".
     - Confirmation and in-page settings modals: branded with the JET logo.
     - Extension popup (`options/popup.html`) & options page (`options/options.html`): displays the JET logo.
     - `web_accessible_resources` configured in `manifest.json` for content script access.
8. **Self-Contained Safe Template Engine & Fallbacks**:
   - `content/content.js` provides `safeRenderEscalationNote` and `safeRenderFinalEscalationNote` with built-in fallbacks.
   - Even if `templates.js` is delayed or `window.renderEscalationNote` is undefined, escalation buttons and confirmation modals will never throw runtime errors.
9. **Recursion & Re-Entrancy Guard (No Stack Overflow)**:
   - `setNativeInputValue` includes an `isInjectingNote` re-entrancy lock and value-equality check (`inputEl.value === value`).
   - Prevents reactive single-page app frameworks (React/Vue/Angular on `nano-admin.bet88.ph`) from firing recursive event cycles that could cause `RangeError: Maximum call stack size exceeded`.
   - All DOM queries for notes containers, plus buttons, and inputs strictly filter out extension UI elements (`#escalation-helper-dock`, `.esc-modal-overlay`, `.esc-toast`).
   - Modal input syncing is debounced to avoid event floods during live typing.
10. **Users Search List Return (Auto Navigation)**:
   - After an escalation is completed (`Confirm & Execute` or tap pipeline), the extension automatically navigates the current tab back to `https://nano-admin.bet88.ph/users` (configurable via `usersListUrl` and toggled with `autoReturnToUsers`).
   - Gives a brief ~700ms grace period so in-page notes and state changes persist before redirecting.
   - Automatically skipped if the tab is already on the clean `/users` search screen.
11. **Auto 'Find User' & 'View' on Search Page (`https://nano-admin.bet88.ph/users`)**:
   - **Currently disabled** (`autoFindAndView` default `false`). Do not auto-click Find User or open overview until Joshua asks to enable it. The Settings checkbox remains so it can be turned on later.
   - When on the `/users` search page, the extension automatically binds to the **Find By Id Or Uid** input.
   - **First-paint guard**: Loading `/users` (including an existing URL search such as `/users/userIdOrUid/N3633P6/offset/0`) does **not** auto-click Find User. Search only starts after the agent types, pastes, or presses Enter.
   - **Same User ID can be searched again**: Paste or Enter on the same ID (e.g. `N3633P6` again after returning from overview) still runs Find User then opens that player’s overview. There is no skip for a previously searched ID.
   - **Delayed Find, then open overview by URL (not View click)**:
     1. Debounces typing/paste (~900ms) so the full ID is in the box.
     2. Clicks **Find User**.
     3. Waits ~700ms for the Results row to refresh.
     4. Finds the matching result row (or the first result after Find User).
     5. Opens overview in the same tab: prefer an `<a href>` to `/user/{id}`, otherwise navigate to `https://nano-admin.bet88.ph/user/{numericId}` from the row’s ID cell. A View-button click is only a last resort.
     6. If the overview cannot be opened within ~8s, shows a timeout toast.
   - **Seamless Escalation Loop**:
     1. Paste ID on `/users` (same or different) -> extension clicks **Find User** -> opens `/user/{id}` overview.
     2. Player Overview opens -> floating bar detects player -> agent taps escalation button (e.g. `[ACR]`).
     3. User Note injected, final 5-line note copied to clipboard, Zoom app launched.
     4. Extension automatically returns tab to `/users` ready for the next player (or the same player again).

---

## 6. How to Load and Test
1. Open Google Chrome and go to `chrome://extensions`.
2. Toggle **Developer mode** (top right) to ON.
3. Click the **Reload (🔄)** icon on the **hdjrzTools** card.
4. Open any client in your backoffice system:
   - Notice the toolbar reads the client's actual User ID from the screen (e.g. `1754988 (N3633P6)`).
   - Click any button (e.g. `ACR`):
     - The confirmation modal displays that client's complete User ID in the editable Target User ID field (`1754988 (N3633P6)`).
     - Live preview 1 displays that button’s User Notes (preset ACR still: `ACR / 1172031960185783 / Losing player` when CID is in existing User Notes).
     - Live preview 2 displays that button’s Zoom text (preset still the 5-line tracker with User ID, Reason, and CID).
     - Click **Confirm & Execute**: the short note is typed into the User Notes field, and the 5-line final note is copied to clipboard and Zoom workspace opens ready for `Ctrl+V`!
    - After completion, notice the extension automatically returns the tab back to `https://nano-admin.bet88.ph/users`!
5. **Auto Find User is off.** Pasting an ID on `/users` should not click Find User or open overview. Turn it on later in Settings only when Joshua asks.

---

## 7. Tampermonkey Distribution, Build Pipeline & Versioning Rules

### 7.1 Build Pipeline & Code Obfuscation
- **Target Platform**: Tampermonkey Userscript (Chrome / Edge / Firefox) hosted on GitHub (`https://github.com/hdjrz/hdjrz-tools`).
- **Build Script**: `build-userscript.js` (executed via `npm run build`).
- **Bundling Process**:
  1. Reads `version` from `package.json`.
  2. Constructs the Userscript metadata header (`// ==UserScript==`) with `@updateURL` and `@downloadURL` pointing to `https://raw.githubusercontent.com/hdjrz/hdjrz-tools/main/hdjrzTools.user.js`.
  3. Wraps `content/templates.js`, `content/content.css`, and `content/content.js` into an isolated execution scope.
  4. Embeds the `hdjrzChrome` shim/polyfill layer to map Chrome Extension storage APIs (`chrome.storage.local`, `chrome.storage.session`, `chrome.runtime`, `navigator.clipboard`) to `GM_getValue`, `GM_setValue`, `GM_setClipboard`, and `localStorage`.
  5. Runs `javascript-obfuscator` to compress and scramble production output into `hdjrzTools.user.js` to protect commercial IP.

### 7.2 Why Tampermonkey Update Checks Fail ("Narf! No update found, sry!")
- **Rule 1: `@version` MUST be incremented**: Tampermonkey compares the local script's `@version` string against the `@version` line in the remote file at `@updateURL`. If `package.json` version is **not** bumped before building (e.g. staying at `1.1.0`), Tampermonkey sees matching version numbers and reports:
  > *"Narf! No update found, sry!"*
  **Always bump `package.json` version** (e.g. `1.1.0` -> `1.1.1`) before running `npm run build` and pushing to GitHub `main`.
- **Rule 2: GitHub Raw CDN Caching (3–5 minute latency)**:
  - `raw.githubusercontent.com` caches files at edge CDNs for ~3 to 5 minutes.
  - Immediately after pushing a new release to GitHub, Tampermonkey's update check may still fetch the cached HTTP response showing the old version.
  - **Workaround**: Wait 3–5 minutes for GitHub CDN cache invalidation, or force-install by opening `https://raw.githubusercontent.com/hdjrz/hdjrz-tools/main/hdjrzTools.user.js` directly in the browser address bar.

### 7.3 Storage Wording Migration (`BIT88_NOTES_WORDING_VERSION`)
- Modifying default note presets or Zoom templates in `content/templates.js` does **not** automatically update existing user options stored in browser local storage (`localStorage` / `GM_getValue`).
- **Migration Mechanism**:
  - `BIT88_NOTES_WORDING_VERSION` in `content/content.js` tracks the schema version of default note templates.
  - When the script initializes, if `loadedWordingVersion < BIT88_NOTES_WORDING_VERSION`, `applyBit88UserNotesToSavedOptions()` runs automatically to overwrite saved note templates with updated factory presets while preserving custom user-added buttons.
  - **Rule**: Bumping `BIT88_NOTES_WORDING_VERSION` is required whenever default note wording or Zoom formulas are changed in code releases.

---

## 8. Multi-Tab & Cross-Tab Architectural Rules

### 8.1 Multi-Tab License Persistence
- **SessionStorage Isolation Issue**: Chrome `sessionStorage` is strictly tab-isolated. Using `sessionStorage` for license status checks caused new Nano tabs to lose license state, re-triggering key input dialogs or modal race conditions (`openLicenseModal`).
- **Persistent Storage Rule**:
  - License role and device binding MUST be stored using persistent storage (`localStorageApi()` / `GM_getValue()`) under `hdjrzLicenseRole` and `hdjrzLicenseDeviceId`.
  - On page load, `loadLicenseRole()` checks persistent storage. If a valid role (`admin` or `guest`) is found, `esc-license-overlay` is automatically suppressed and dismissed across all current and new tabs.

### 8.2 Cross-Tab KYC SWITCH Communication (`BroadcastChannel`)
- **Tampermonkey Tab ID Absence**: Unlike WebExtensions, Tampermonkey userscripts do not have access to Chrome's `chrome.tabs` numerical `tabId`s.
- **BroadcastChannel Implementation**:
  - Uses HTML5 `BroadcastChannel("hdjrz_kyc_channel")` for cross-tab communication.
  - Tabs identify each other using normalized `publicId` / `userId` (e.g. `4LP9G4GQ` or `17347812`).
  - **KYC SWITCH Workflow**:
    1. Clicking Confirm & Execute on the New Verified player tab broadcasts a `KYC_INJECT_COMMAND` message over `hdjrz_kyc_channel` with `targetTabIds` containing the target Old Account's `publicId`/`userId`.
    2. The Old Account player tab listening on `hdjrz_kyc_channel` receives the message, matches its own `publicId`/`userId`, and injects the Old Account User Note (`The Old account: KYC switch - New account UID:(...)`) into its own DOM automatically without requiring a second confirmation modal.

---

## 9. Live Remote Templates & Cloud Sync Architecture

### 9.1 Overview & Benefits
- Eliminates the need to rebuild userscripts, bump version numbers, commit to git, or wait for Tampermonkey CDN caching whenever reason lists or note templates are updated.
- Admins update wording or reasons directly in their Settings modal and click **Sync** (or it updates automatically), instantly broadcasting the new templates to all active agents across the company within 30–60 seconds.

### 9.2 Cloudflare Worker Endpoints (`license/worker.js`)
- Uses the **existing `LICENSES` KV namespace** in Cloudflare (no new KV namespace needed):
  - `GET /config/templates?agent=...&v=...&dev=...`: Public/client endpoint returning active cloud templates `{ ok: true, version, updatedAt, options, totalActive, syncedCount, syncedAgents }`.
    - Also records active agent heartbeats in KV key `"ACTIVE_AGENTS"` (with 5-minute inactivity auto-cleanup), tracking which agents are online and whether they have the latest template version.
    - Set with `Cache-Control: no-cache, no-store, must-revalidate, max-age=0` so updates and telemetry are received immediately without CDN caching delay.
  - `POST /config/templates`: Admin-only endpoint requiring a valid `admin` license key. Increments version and stores `{ version, updatedAt, publishedBy, options }` under key `"REMOTE_TEMPLATES"` in KV, returning `{ ok: true, version, updatedAt, totalActive }`.

### 9.3 In-App UI, Sync Button & Telemetry Badge
- **Placement**: Situated in the Settings modal footer, placed **between Import and Sign out**:
  `[Export] [Import] [Sync 🔄] [🟢 v2 • 3/3 synced] [Sign out] ... [Cancel] [Save Changes]`
- **Spinning Animation**: Clicking Sync engages a smooth CSS spin animation (`.esc-sync-icon.is-spinning` with `@keyframes escSpin`).
- **Live Sync Telemetry Badge (`.esc-sync-badge`)**:
  - Positioned directly next to the Sync button.
  - For Admins: Displays live online agent stats, e.g. `🟢 v2 • 3/3 synced` with hover tooltip listing connected agent names.
  - For Staff: Displays cloud version indicator `🟢 v2 Cloud`.
- **Role-Based Action**:
  - **Admin**: Publishes current working options to Cloudflare KV (`REMOTE_TEMPLATES`), immediately showing `Syncing X agent(s)...` on the badge and confirming via toast.
  - **Guest / Staff**: Instantly pulls latest cloud templates into the active session without page reload.

### 9.4 Real-Time Zero-Refresh Architecture
- **Instant In-Memory Update (`applyRemoteOptionsLive`)**:
  - Updates `currentSettings.customOptions`, `currentSettings.remoteTemplatesVersion`, `window.EscalationDictionary`, and immediately calls `updateHorizontalDockButtons()` so the bar updates live in-place on the screen without reloading the page.
- **Cross-Tab Immediate Broadcast**:
  - When any tab receives or publishes new templates, it broadcasts a `SYNC_TEMPLATES_LIVE` event over `BroadcastChannel("hdjrz_kyc_channel")`, updating all other open tabs in 0ms without waiting for background polling.
- **Fast 25-Second Polling & Tab Focus Sync**:
  - Background polling interval is set to 25 seconds (short lightweight KV reads).
  - Also listens to `window.addEventListener("focus", ...)`, ensuring that whenever an agent switches back to the Nano Admin tab, it checks for updates immediately.

---

## 10. Remote Emergency Forced Version Enforcement & Kill Switch

### 10.1 Master Control in Cloudflare KV (`SYSTEM_CONFIG`)
- Key `"SYSTEM_CONFIG"` in the `LICENSES` KV namespace holds the master security configuration:
  ```json
  {
    "minRequiredVersion": "1.1.4",
    "latestVersion": "1.1.6",
    "killSwitch": false,
    "killSwitchMessage": "hdjrzTools is temporarily disabled for emergency maintenance.",
    "allowedDomains": ["nano-admin.bet88.ph"]
  }
  ```
- **Endpoints**:
  - `GET /config/system`: Returns active configuration.
  - `POST /config/system`: Admin-only endpoint (authenticated with admin key) to update minimum required version, trigger kill switch, or update allowed domains.

### 10.2 Gatekeeper & Semver Enforcement
- `isVersionBelow(clientVer, minVer)`: Robust 3-part semver comparison (e.g. `1.0.8 < 1.1.4`).
- **Enforcement triggers**:
  - **License Activation**: Outdated versions or active kill switch blocks key binding.
  - **Startup & Background Polling**: `GET /config/templates?v=...&domain=...` checks version, domain, and kill switch every 25 seconds and on tab focus.
- **Unavoidable Lockout Modal (`triggerEmergencyLockout`)**:
  - If blocked:
    1. Immediately removes toolbar (`dockElement.remove()`) and active modals.
    2. Sets `isLockedOut = true`, suppressing toolbar rendering, settings, and escalation shortcuts.
    3. Traps keyboard events (`keydown`) to prevent closing.
    4. Displays an unavoidable full-screen frosted overlay (`.esc-enforcement-overlay` with z-index `2147483647`):
       - **Outdated version**: Displays `⚠️ Critical Update Required`, compares installed version against minimum/latest, and offers a 1-click update button linking to `/script.user.js`.
       - **Kill switch**: Displays `🛑 Emergency System Lock` with admin maintenance message.
---

## 11. PAGCOR Legal Age Calculator & Smart Badging

### 11.1 Regulatory Purpose
- Under Philippine PAGCOR regulations, casino gaming legal age is **21**, not 18.
- To eliminate mental math errors during high-pressure shifts, the extension automatically parses the player's Date of Birth (DOB) and computes their precise legal standing.

### 11.2 Age Brackets & Smart Badges
- **🔴 Minor (< 18)**:
  - Strict ban; unauthorized under civil and gaming law.
  - Rendered with `.esc-pagcor-badge.is-minor`: `🔴 Minor ({age})`.
- **🟠 PAGCOR Restricted (18 to 20)**:
  - Legal adult under civil law (18+), but strictly underage for casino operations under PAGCOR rules (< 21).
  - Rendered with `.esc-pagcor-badge.is-pagcor-restricted`: `🟠 PAGCOR Restricted ({age})`.
- **🟢 Legal (21+)**:
  - Eligible adult for all gaming operations.
  - Rendered with `.esc-pagcor-badge.is-legal`: `🟢 Legal ({age})`.

### 11.3 UI & Template Integration
- **Confirmation Modal**: Rendered in the `esc-player-summary` next to `Name / DOB`:
  `Name / DOB: Juan Dela Cruz / 15 Mar, 2007  [🟠 PAGCOR Restricted (19)]`
- **Template Tokens**:
  - `[AGE]`: Numeric age string (e.g. `19`).
  - `[PAGCOR AGE]` / `[AGE BRACKET]`: Legal status text (e.g. `PAGCOR Restricted (18 to 20)`).
  - `[AGE WITH STATUS]`: Combined string (e.g. `19 (PAGCOR Restricted 18-20)`).
- **Settings Chips**: Added `[PAGCOR AGE]` to the chip insert toolbar.

---

## 12. Live Zero-Refresh Lockout & Policy Enforcement (v1.1.9)

### 12.1 Real-Time Triggering Without Tab Refresh
- **Problem Solved**: Previously, background interval was 25 seconds and lacked visibility/activity hooks, causing agents to not see lockout banners until a manual tab reload occurred.
- **7-Second Fast Polling**: Background check interval reduced from 25s to **7 seconds** (`7000ms`), with initial post-load check at 400ms.
- **Zero-Cache Network Requests**: Appended `&_t=${Date.now()}` with `cache: "no-store"` and `Cache-Control: no-cache, no-store, must-revalidate` to eliminate any browser/proxy cache caching old responses.
- **HTML5 Visibility & Focus Hooks**:
  - `document.addEventListener("visibilitychange")`: When the agent switches into or un-minimizes the tab (`visibilityState === "visible"`), policy check fires immediately.
  - `window.addEventListener("focus")`: Immediate check on window focus.
- **User Activity Heartbeat**:
  - Debounced listener on `mousemove`, `keydown`, `click`, `scroll`, `touchstart`: If > 6 seconds have elapsed since the last check, fires an immediate background policy audit.
- **Cross-Tab Broadcast Synchronization**:
  - When any open tab receives `blocked: true`, it immediately broadcasts `{ action: "EMERGENCY_LOCKOUT", payload }` over `BroadcastChannel("hdjrz_kyc_channel")`.
  - All other sibling tabs open across the browser dismantle their dock and display the lockout overlay within **0 milliseconds** synchronously.

### 12.2 Automated Post-Update Reload & Seamless Activation
- **Problem Solved**: When agents clicked "Click Here to Update", Tampermonkey updated the script storage, but the browser tab continued running the old in-memory script with the lockout banner visible, confusing agents into wondering why the modal hadn't disappeared.
- **2-Step Interactive Guidance**:
  - Clicking `#esc-enforce-update-btn` seamlessly transforms the modal into Step 2:
    - Step 1: Click "Update" in Tampermonkey (tab opened).
    - Step 2: Click the prominent green pulsing reload button `#esc-enforce-reload-btn`.
- **Auto-Reload on Tab Return**:
  - When the agent finishes in Tampermonkey and switches back to the `nano-admin.bet88.ph` tab, `document.addEventListener("visibilitychange")` detects `sessionStorage.getItem("esc_update_initiated")`, displays `⚡ Update detected! Reloading page now...`, and automatically calls `window.location.reload()` after 500ms!
- **Cross-Tab Auto-Reload (`NEW_VERSION_ACTIVATED`)**:
  - Once any updated tab reloads and starts the new version, it broadcasts `{ action: "NEW_VERSION_ACTIVATED", version }` over `BroadcastChannel`.
  - Any other sibling tabs that are currently locked out receive the broadcast and automatically reload themselves with zero user intervention!
- **Success Toast**:
  - On first boot after update, displays a celebratory toast: `🎉 Successfully updated to v{SCRIPT_VERSION}!`.

---

## 13. Audio / Visual Haptic Chime on Success (v1.2.0)

### 13.1 Feature Overview
- **Why Agents Love It**: Provides instant auditory and visual confirmation during fast-paced multitasking shifts.
- **Triggers**:
  - ✅ **User Note safely pinned** into Nano admin.
  - ✅ **Zoom escalation tracker copied** to clipboard.
  - ✅ Clicking **"🔊 Test"** in Settings.
- **Auditory Feedback (`playSuccessChime`)**:
  - Synthesized via Web Audio API (`AudioContext`).
  - Zero external media assets, zero CDN latency, works completely offline.
  - Harmonically tuned dual-sine chime: 587.33 Hz (D5) transitioning to 880 Hz (A5) with smooth exponential decay.
  - Soft, modern, non-fatiguing volume envelope (peak 0.15 gain).
- **Visual Feedback (`triggerSuccessRipple`)**:
  - Subtilt green edge ripple vignette (`.esc-success-ripple`) that pulses outward over 650ms.
  - Toast entry pop animation (`.is-success-animated`) highlighting the green checkmark.
- **Settings Toggle & Testing**:
  - Setting: `currentSettings.soundFeedback` (default `true`).
  - Checkbox in Settings modal: `🔔 Success Chime & Green Ripple`.
  - Dedicated `🔊 Test` button next to the checkbox for instant auditioning.

---

## 14. Fast Keyboard Navigation & Universal Modal Controls (v1.2.4)

### 14.1 Keyboard Navigation
- **Enter to Execute**: Pressing `Enter` anywhere inside the confirmation modal (`.esc-modal-overlay`) immediately executes the escalation — pins the User Note, copies the Zoom tracker, and opens the Zoom workspace without requiring a mouse click.
- **Esc to Cancel**: Universal dismissal across all modals (Confirmation, Settings, What's New, Reason Picker, or Audit logs).
- **Form Safety**: Pressing Enter while typing inside the editable User ID or CID inputs updates the preview in real time without accidentally triggering early submission.

---

## 15. In-Tool Zero-Popup Auto-Updates & Live Discovery (v1.2.5)

### 15.1 In-Tool Zero-Popup Updates
- **Problem Solved**: Standard userscript updates opened raw GitHub tabs or Tampermonkey installation dialogs that disrupted staff mid-shift.
- **`performInToolUpdate`**: Directly downloads and hot-swaps the userscript payload in the background using Tampermonkey's elevated `GM_xmlhttpRequest` bridge.
- **Live Visual Progress**: Displays real-time download and installation progress right on the screen.
- **Bypasses Website CSP**: By using `GM_xmlhttpRequest`, all updates and heartbeats route outside page Content Security Policies.

---

## 16. Enterprise Legal Age Status Badge on Dock (v1.2.6 – v1.2.7)

### 16.1 Live Toolbar Evaluation
- **Minimalist Status Dot Badge**: Sleek status pill embedded directly beside the player ID on the floating dock.
- **Real-Time Evaluation**: As soon as player attributes or notes load, evaluates the age against PAGCOR compliance rules:
  - 🟢 **Legal (21+)**: Fully compliant adult.
  - 🟠 **Restricted (18–20)**: Civil adult, but restricted from casino gaming under PAGCOR regulations.
  - 🔴 **Minor (<18)**: Prohibited underage account.
- **Alignment**: Height (32px) and rectangular radius (4px) match the dock elements seamlessly.

---

## 17. Side-by-Side Account Comparator Modal for KYC Switch (v1.2.8)

### 17.1 Real-Time Cross-Tab Account Comparison
- **Visual Sibling Comparison**: In KYC Switch operations (2 ACCOUNTS), the confirmation modal renders a side-by-side visual comparison between the **New Account (Wants to Verify)** and the **Old Duplicate Account (Verified to Rejected)**.
- **Live Attribute Diff**: Displays Public ID, Numeric ID, Full Name, Verification Status, and Registration Date side-by-side.
- **Cross-Tab Synchronization**: Uses `BroadcastChannel("hdjrz_kyc_channel")` to scrape and pair attributes between concurrent tabs without tab reloading.

---

## 18. Escalation Library Architecture (v1.4.0)

### 18.1 Managed Definition Model
- Defined in `backend/services/escalationService.js`:
  - 14 standardized escalation codes (`ACR`, `ACR-PAGCOR`, `ACR - PERMA`, `REACT`, `REACT NOT`, `NGP NON-X`, `NDRP`, `UA W/FUNDS`, `UA WO/FUNDS`, `MANUAL KYC`, `KYC SWITCH`, `GLIFE.1`, `GLIFE.2`, `ABUSER`).
- **RESTful Endpoints**:
  - `GET /api/escalations`: Lists all definitions with active state, button labels, descriptions, and category groupings.
  - `POST /api/escalations/toggle`: Toggles an escalation between active and inactive.
  - `POST /api/escalations/reset`: Restores all 14 standard definitions to factory presets.

---

## 19. Staged Template Deployment Pipeline (v1.4.1)

### 19.1 4-Step Production Pipeline
Replaces direct writes to production templates with an enterprise 4-stage pipeline:
1. **1️⃣ Admin Edits (Draft)**: Admins edit button wording, reasons, and templates in the Web Admin Portal or extension. Changes are saved as a staged candidate in KV key `"TEMPLATE_DRAFT"`.
2. **2️⃣ Automated Validation**: The draft undergoes strict 8-point automated validation.
3. **3️⃣ Visual Preview & Diff**: Full visual comparison vs live production (`+ Added`, `~ Modified`, `- Removed`, `Unchanged`) plus live interactive button dock preview.
4. **4️⃣ Production Release (vN → vN+1)**: One-click atomic promotion to live `"REMOTE_TEMPLATES"` KV key, broadcasting the new template version to all active workstations worldwide within seconds.

---

## 20. 8-Point Automated Template Validation Engine (v1.4.2)

### 20.1 Engine Rules (`validateTemplateDraft`)
Before any template draft can be published, it must pass 8 automated checks:
1. **JSON Syntax & Structure**: Valid object array structure with version metadata.
2. **Standard Escalation Codes**: Every preset matches a recognized system escalation code.
3. **Required Reasons Presence**: All 14 standard definitions must have at least one defined reason.
4. **User Note Template Syntax**: Valid placeholders, balanced brackets, and correct chip formatting.
5. **Zoom Escalation Template Syntax**: Valid tracker formulas and token syntax.
6. **Token Integrity**: Tokens match recognized system variables (`[User ID]`, `[CID]`, `[Name]`, `[DOB]`, etc.).
7. **No Duplicate Reasons**: Reasons within a button must be unique.
8. **Required Field Schema**: Mandatory properties (`id`, `label`, `userNotesText`, `zoomText`) must be present.

---

## 21. Maya Mini App Native Scraper (v1.4.3)

### 21.1 Dynamic Extraction
- Automatically parses and extracts player details from Maya Mini App DOM elements:
  - `mayaminiapp-firstName`
  - `mayaminiapp-lastName`
  - `mayaminiapp-dateOfBirth`
  - `mayaMiniAppId`
- **Robust Date Parsing**: Converts `MM-DD-YYYY` formats into standard `D MMM, YYYY` and computes precise PAGCOR legal age status.

---

## 22. Update Requirement Transparency (v1.4.4)

### 22.1 Update Status Transparency
- **⚠️ Required Update**: Triggered when the installed version is below the Cloudflare `minRequiredVersion`. Displays prominent red badges and warning alerts.
- **🚀 Optional Update**: Triggered when a new feature release is available but older versions remain compliant. Displays friendly blue badges without blocking workflows.
- **What's New Changelog**:
  - Condensed single-line bullet highlights.
  - Scrollbars completely hidden (`scrollbar-width: none; ::-webkit-scrollbar { display: none; }`) for a clean, modern aesthetic.

---

## 23. Centralized Publishing & Streamlined Settings UI (v1.4.5)

### 23.1 Removal of In-Page Publishing
- To eliminate accidental overwrites of company-wide templates from agent workstations, in-page publishing was removed from the extension Settings modal.
- Publishing is strictly managed through the **Web Admin Portal (`/admin`)**.

### 23.2 Streamlined Settings Hierarchy
- **Cloud & Backup Tab**:
  - Contains **`🔄 Sync from Cloud`** as its single, clear action.
  - Removed all duplicate "Admin Portal" buttons and redundant jump links from the **Active Users Online** box.
  - Contains **Export** / **Import** for local configuration files.
- **Account & License Tab**:
  - Established as the single authoritative home for administrative actions.
  - Features **`🌐 Web Admin Portal ↗`** alongside **`Sign out`** under **Session & License Management**.
  - Displays Role, Installed Version, Server Version, Update Status, Device Status, and Release Channel.

---

## 24. Dual-Channel Release Architecture & Fleet Rollout (v1.4.5+)

### 24.1 Architecture & Problem Solved
- **Problem Solved**: Avoids the need to create and maintain separate Git branches (`admin`, `agent`, `main`), which causes merge conflicts and requires agents to reinstall Tampermonkey scripts.
- **Single `main` Branch**: All staff and admins install and update from the single `main` branch.
- **Role-Aware Cloudflare Edge Routing**:
  - When an **Admin** device heartbeats, Cloudflare evaluates versioning against `adminLatestVersion` (Early Access channel).
  - When an **Agent** device heartbeats, Cloudflare evaluates versioning against `agentLatestVersion` (Production Fleet channel).
- **1-Click Fleet Promotion**:
  - In the Web Admin Portal, the **"🚀 Release Channels & Fleet Rollout"** card allows admins to set `adminLatestVersion` (e.g. `1.5.0`) to test on admin devices while agents stay on `1.4.5`.
  - Clicking **`🚀 Promote to Fleet`** atomically syncs `agentLatestVersion = adminLatestVersion` in KV, releasing the update to all staff workstations simultaneously!

---

## 25. Master Web Admin Portal Architecture (`/admin`)

### 25.1 Edge Web Application
- Served directly by Cloudflare Worker at `https://hdjrz-license.rosechel05.workers.dev/admin`.
- Authenticated via Master Admin Password (stored in KV `"ADMIN_PASSWORD"`, rotatable from the portal).

### 25.2 Integrated Control Center
1. **Live Staff Telemetry**: Real-time monitor of active staff, current script versions, and last seen timestamps.
2. **License Key Management**: Generate Admin or Staff keys, view hardware device bindings, 1-click device binding reset, freeze/unfreeze keys, and permanent key deletion.
3. **Template Deployment Pipeline**: Staged candidate editor, 8-point automated validation report, live visual preview & diff, and production release trigger.
4. **Escalation Library**: View and toggle all 14 managed escalation definitions.
5. **Release Channels & Fleet Rollout**: Configure early-access Admin versions vs stable Agent Fleet versions with 1-click promotion.
6. **Master Password Rotation**: Secure password update tool directly on the edge.

