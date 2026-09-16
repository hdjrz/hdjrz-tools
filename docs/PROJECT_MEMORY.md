# hdjrzTools Chrome Extension — Project Memory

## 0. Overview & Purpose
This Chrome Extension automates player escalation workflows on backoffice User Overview pages:
- **Dynamic Player Scraping (Any Client / Any Player)**: Reads player credentials directly from the DOM (`User ID`, `Public ID`, `Affiliate`, `Created Date`, `KYC Status`, `Username`). It operates dynamically for *all* searched users, with **zero hardcoded sample fallbacks**.
- **Dynamic User ID Extraction**: Scrapes whatever is in the "User ID" on screen. If the client ID has parentheses (e.g. `15511274 (4LG14LGG)`), the parenthetical ID is prioritized. If it's a numeric or plain ID (e.g. `1172031960185783`), that exact ID is used in `{userId}`.
- **Interactive User ID Input in Confirmation Modal**: The confirmation modal displays a prominent, editable "Client User ID" field. If scraped from screen, it is auto-filled. If opening a new client or if not detected, the agent can type/paste any User ID and the live note preview updates in real time. Empty Confirm fields use short placeholders only (`Enter Client User ID`, `Player CID`, `Enter Verified User ID`) — no example IDs.
- **First-run license**: Until a valid key is entered, only the license popover shows — the floating options bar appears after Unlock. Unlock POSTs to `https://hdjrz-license.rosechel05.workers.dev/` with a per-Chrome `hdjrzLicenseDeviceId`. Role is stored in `chrome.storage.local` (`hdjrzLicenseRole`) plus a session flag (`hdjrzLicenseAlive`). Reloading the extension on `chrome://extensions` or Load unpacked of a new zip always shows the key box again (session flag is gone); the Cloudflare KV seat is **not** freed. Refreshing a backoffice page without reloading the extension stays unlocked. `hdjrzLicenseDeviceId` is kept so the same Chrome can type the same KV key. **Settings Sign out** POSTs `action: release` so KV goes back to `{"role":"guest","deviceId":""}` or `{"role":"admin","deviceId":""}` for that key (only if this Chrome’s device id matches). Worker source to paste in Cloudflare is `license/worker.js`. **Admin** (Worker role): full Settings (Edit, Add, Restore, Export/Import, Save wording). **Guest**: factory 14 buttons; Import of `hdjrzTools-settings.json` applies that file’s reasons, User Notes, and Zoom onto those 14 codes (Defaults too). Extra imported buttons are ignored. Export stays admin-only. Keys live in Cloudflare KV (`LICENSES`), not in the zip. This is a gate, not encryption.
- **Dynamic Options Manager (Add / Remove / Edit Click Reason)**: Agents can add new buttons, remove unneeded options, customize button colors and chip markers, and define the exact "Reason when clicked" for each button.
- **Accidental Click Prevention**: Every escalation selection opens a confirmation modal (preview only). The Confirm card stays within ~92vh. User Notes and Zoom previews show the full text (no 44px/88px clip). Confirm hides the User Notes preview when that button has no User Notes (NDRP, UA WO/FUNDS, and custom Zoom-only). The body scrolls only if KYC SWITCH fields are taller than the screen. Settings stays within 90vh. User Notes, clipboard copy, and Zoom open only on **Confirm & Execute**. Pasting CID or User ID only updates the preview. Enter in those fields does not execute. **Which reason?** uses the reasons in Settings only, including **ACR-PAGCOR**. Factory extras (NGP Underage, NDRP Custom watchlist, KYC/PAGCOR, and the rest) are written into Settings on wording version 17 so they can be edited. Confirm has **no** Escalation Reason dropdown; notes and Zoom use the first pick. **KYC SWITCH** opens **2 ACCOUNTS / 3 OR MORE**. Factory KYC SWITCH has one reason (`Escalation requested`), so Confirm has no extra Which reason? unless Settings has two or more reasons.
- **User Notes Injection**: On **Confirm & Execute**, targets the `+` button in the backoffice **User Notes** section and fills **that button’s chosen User Notes sentence**. If a button has no User Notes (NDRP / UA WO/FUNDS Zoom-only), it skips typing and still copies Zoom.
- **CID from existing User Notes**: After the player overview is open, the extension reads the latest `CODE / CID / reason` line in User Notes (example `ACR / 1172031960185783 / Losing player`) and uses the middle value as `{cid}`. Agents do not type CID when it is already on the player. Confirm shows **Player CID** (and the CID summary) only for **ACR**, **ACR-PAGCOR**, **ACR - PERMA**, **REACT**, **REACT NOT**, **NGP NON-X**, **UA W/FUNDS**, **UA WO/FUNDS**, **NDRP**, and **ABUSER**. If that field is shown and empty, **Confirm & Execute** is blocked until CID is typed. Hide CID for MANUAL KYC, KYC SWITCH, GLIFE.1, GLIFE.2, and any other code. **KYC SWITCH** Confirm still uses User ID + Verified UID only.
- **Per-button wording (BIT88 process, plain language)**:
  - Each option stores `userNotesText`, `zoomText`, `reasons[]`, and optional `noteChoices` / `zoomChoices`.
  - Settings never asks agents to type curly-brace tokens.
  - Insert chips: User ID, CID, Reason, Name, DOB, Age, GLife ID (`[User ID]`, `[CID]`, `[Reason]`, `[Name]`, `[DOB]`, `[AGE]`, `[GLife ID]`).
  - User Notes follow BIT88 circle wording (chips fill live values). ACR `ACR / [CID] / [Reason]`; ACR-PAGCOR `[CID] - ACR Self-Exclusion with PAGCOR`; ACR - PERMA `ACR / [CID] / Permanent Block - [Reason]`; REACT `[CID] - Reactivation - [Reason]`; REACT NOT `Reactivation - for reset KYC not started` or `UA to legal - For reset | [CID]`; NGP / UA W/FUNDS `NOT OK for RETAKE: Doc-UA | [Name] | [DOB]`; NDRP and UA WO/FUNDS empty (Zoom-only); MANUAL KYC `For Manual Verification | [Name] | [DOB]`; KYC SWITCH the two BIT88 sentences; GLIFE.1 `GLIFE Override | [Name] | [DOB]`; GLIFE.2 `GLife Override / [GLife ID]`; ABUSER `ACR / [CID] / Permanently Blocked – BONUS ABUSER with Funds`. Old saved Settings pick up notes **and Zoom** on wording version 15 and factory reason lists on wording version 18 (live BIT88 Settings JSON; KYC SWITCH one reason).
  - Name/DOB come from User Attributes first (`firstName` / `First Name` / `th`+`td` / `dt`+`dd`, plus middle and full name). If name or DOB is still blank, fill **only the missing field** from pinned User Notes for NGP NON-X, UA W/FUNDS, UA WO/FUNDS, GLIFE.1, GLIFE.2, MANUAL KYC, KYC SWITCH, REACT, and REACT NOT. Notes may be split across lines — join them so `ALL CAPS name` + `Date of birth` + date still fills (example `MECHAEL BAYANG PATANO JR`), not the TL line (`Hiede Labaguis`). Title Case on the line above Date of birth is accepted if there is no ALL CAPS run. Still accept pipe `|` and `Name:` / `DOB:`. NGP/UA lines like `NOT OK for RETAKE: Doc-UA PRINCE ARCHIROW ESPIRITU MARTINEZ | 03 Jun, 2008 (18)` and `NAME | 03 Jun, 2008 (18) / UA` fill Name/DOB when attributes are empty — do not skip `NOT OK for RETAKE`. Skip only a short `NOT OK` line with no name and no date. Confirm’s **Name / DOB** row and Zoom use that fill. **NDRP** Name comes from User Attributes unless a User Note actually says NDRP; never use a KYC/other note as Name.
  - KYC SWITCH Confirm has no reason dropdown. Zoom Name/DOB from User Attributes. If the rejected-to-verify tab is `NULL` / empty, use Name/DOB from the **Verified** other tab (e.g. Juan Dela Cruz). New Verified User Notes: `New Verified account: KYC switch - [Name] / [DOB] ([AGE]) - DUP ID's: [Verified UID]` — always close the age `)`. If age is empty, omit `()`. Example `New Verified account: KYC switch - REYNALD LANTANO LEONGAS / 26 Jun, 1992 (34) - DUP ID's: 4LP9G4GQ/AWDUH/AWDKUA/AKWDBWA`. DOB is `D MMM, YYYY`. DUP IDs have no extra parentheses and are joined with `/` (no spaces). Old account follows the Settings sentence. If that wording has no `()` around the new UID, the live note does not add them. Only close a `)` when Settings already opened `UID:(`. Default preset is still `The Old account: KYC switch - New account UID:([New Account UID])`. Saved Settings pick up wording via `notesWordingVersion` 18. Factory 14 matches the live BIT88 Settings JSON (KYC SWITCH one reason → 2 ACCOUNTS / 3 OR MORE only; ACR uses the live reason list). Every button Edit includes Reasons.
  - Zoom / Final escalation note has **no UTC clock stamp** and **no agent name**. Keep `Date of Birth` / `DOB`. Confirm’s Agent Name row stays in the summary only. Confirm hides User Notes when the note is empty. **REACT** Zoom `Name:` is the player name from User Attributes, or `gLifeUserId` when name is empty; omit a blank `DOB:` line. REACT User Notes stay `[CID] - Reactivation - [Reason]`. NDRP blocking Zoom is the refund template. UA W/FUNDS Zoom is `FOR BLOCKING - UNDERAGE WITH FUNDS - waiting for national ID` plus User ID / CID / Name / DOB. UA WO/FUNDS is Zoom-only: `FOR BLOCKING - UNDERAGE WITHOUT FUNDS` plus User ID / CID / Name / DOB (`Pasuyo po TLs`). NDRP Name comes from User Attributes unless a User Note actually says NDRP; never use a KYC/other note as Name. Strip `YYYY-MM-DD HH:MM:SS UTC` from Zoom.
  - **Two-tab KYC SWITCH (2 ACCOUNTS):** BIT88 uses a green circle on the new player and a red circle on the old player (no tab sync). Escalation pairs **exactly one other** User Overview tab (different User ID). Confirm auto-fills Verified-to-rejected only from that live other tab, or from what the agent pastes. **Do not** read an old DUP ID from User Notes on this page — one tab means no second user. Confirm & Execute writes New Verified notes here and fills the Old-account note on the other tab from the **Settings Old account** sentence (no second Confirm, no Zoom arm there). Auto-return to `/users` is skipped so the agent can pin the other tab. Same User ID in two tabs does not pair. Zoom is `FOR KYC SWITCH` with combined User IDs: this tab `Rejected wants to verify.`, then the other tab `Verified to rejected.`
  - **3 OR MORE tabs:** Confirm on the new player. Hide the **Verified to rejected** input. New Verified DUP ID's / Confirm summary list **other-tab** public IDs only (not old notes on this page) as `4LP9G4GQ/AWDUH/AWDKUA`. Zoom is `FOR KYC ASSESSMENT`. Line 1 is always this tab `Rejected wants to verify.` Line 2 is the **Verified** other tab `Verified to rejected.` even if that tab is last (e.g. tab 4). Remaining other tabs are `Rejected.` Combined User IDs (`15335978 (LJMQ9GXL)`). Confirm & Execute still writes the Old-account note on every other distinct player tab.
- **Clipboard & Zoom Automation**: Copies the final note to clipboard (`Ctrl+V`) and launches Zoom on **Confirm & Execute** (not after Add Comment).
- **In-Page Settings Modal**: Gear opens **one tab**. Body is two columns: button wording on the **left**, **Defaults** on the **right** (~240px: agent name, Zoom URL, **Bar layout** Horizontal/Vertical, Open Zoom on Confirm & Execute, insert User Notes, copy clipboard, return to Users list, **Audit**). The left list is a dashed Zoom-style box as tall as the **Defaults** column (remaining buttons scroll; scrollbar hidden). Name tap does not expand. **Edit** opens a spring popover for that button’s User Notes, Zoom, and Reasons. Apply writes the working list; **Save Changes** still persists. Settings stays open behind Edit or Add (Escape closes that popover first). **+ Add a button** sits beside **Restore 14 Presets** and opens a spring popover (same as Edit), not a form inside Settings. Stacks vertically only if the window is too narrow. Settings overlay is **clear** (no dim, no blur). Settings, Confirm, Audit, Edit-button, and the ACR/KYC **reason-pick** card use the same rectangular **spring popover** (Web Animations API, ~380ms open / ~260ms close, `cubic-bezier(0.22, 1, 0.36, 1)`): uniform scale + fade from the live trigger, no mesh. Confirm and reason-pick may use a light independent dim (~0.2). Confirm Zoom/User Notes show full text (`max-height` ~92vh). `prefers-reduced-motion: reduce` fades ~180ms. Dialogs keep `role="dialog"` `aria-modal="true"`. While any of these overlays is open, the backoffice page cannot scroll. Auto Find User, glossary, templates tab, and colors stay hidden. Button wording, Defaults, and layout save in `chrome.storage.local` (sync is only a one-time migrate). Settings footer **Export** / **Import** save a `hdjrzTools-settings.json` of buttons, reasons, User Notes, Zoom, and Defaults (not Audit). After a new install or Remove + Load unpacked, Import that file to restore custom reasons. Reload without Remove keeps Settings. **Audit** lists Confirm & Execute rows as **Player UID** then process (button), newest first, about 200 rows — not filtered to the open client. Click a row to show the full audit (time, reason, User Notes, Zoom). Edit **+ Add reason** keeps a blank row until Apply.

---

## 1. Stack & Architecture
- **Platform**: Google Chrome Extension (Manifest V3)
- **Permissions**: `storage`, `clipboardWrite`, `tabs`
- **Host Permissions**: `<all_urls>` (runs on backoffice domain/IP and any web page)
- **Directory Layout**:
  - `manifest.json`: Extension Manifest V3 definition
  - `content/templates.js`: Escalation presets (all 14 types), per-option User Notes / Zoom wording, sequence order, and note renderer
  - `content/content.js`: Universal DOM scraper, horizontal toolbar renderer, confirmation modal with editable User ID, in-page settings modal, clipboard & User Notes injector
  - `content/content.css`: Theme styles, horizontal bar layout, chips, confirmation & settings modal styling, toast notifications
  - `background/background.js`: Service worker for Zoom tab/app, KYC sibling-tab find/inject, and default storage initialization
  - `options/options.html`, `options.js`, `options.css`: Backup extension options page
  - `options/popup.html`, `popup.js`: Quick status popup in the browser toolbar with toolbar toggle
  - `icons/`: 16x16, 48x48, 128x128 PNG extension icons

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

