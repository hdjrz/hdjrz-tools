# hdjrzTools

> Streamlines player escalation workflows on backoffice User Overview pages: extracts player credentials directly from the DOM, formats User Notes, pins them, copies escalation trackers to clipboard, and launches Zoom workspace.

---

## ⚡ Quick Install (For Agents)

### Step 1: Install Tampermonkey
Install the free **Tampermonkey** extension for Google Chrome:
👉 [Install Tampermonkey from Chrome Web Store](https://chromewebstore.google.com/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)

### Step 2: Install hdjrzTools (1 Click)
Click this direct installation link:
👉 **[Install hdjrzTools Userscript](https://raw.githubusercontent.com/hdjrz/hdjrz-tools/main/hdjrzTools.user.js)**

Tampermonkey will open an installation screen — click **"Install"**.

That's it! Open or refresh your backoffice page (`https://nano-admin.bet88.ph`), and the hdjrzTools floating bar will appear ready to use.

---

## 🔄 Automatic Updates

You do **not** need to manually download or install updates.

Tampermonkey checks GitHub automatically for new versions. Whenever the admin updates templates, wording, or features and pushes to `main`:
1. Tampermonkey detects the update.
2. The latest version is applied on your next page refresh.

To check for updates manually at any time:
- Click the **Tampermonkey icon** in your browser toolbar.
- Click **"Check for userscript updates"**.

---

## 🛠️ Key Features

- **Dynamic Player Scraping**: Automatically reads `User ID`, `Public ID`, `Name`, `DOB`, `Age`, `KYC Status`, and existing `CID` notes from the backoffice screen.
- **Accidental Click Prevention**: Every escalation selection opens a confirmation modal with full live note preview.
- **1-Click Injection**: On **Confirm & Execute**, automatically clicks the `+` button in backoffice User Notes, injects the formatted note, copies the Zoom tracker to your clipboard, and launches Zoom (`zoomus://`).
- **Two-Tab & 3+ Tab KYC SWITCH**: Seamless cross-tab communication connects old and new player accounts across multiple open tabs.
- **Customization & Presets**: Includes the standard 14 escalation presets with full Settings customizer, reason selector, and audit logs.
- **Cloudflare Licensing**: Role-based access control (Admin / Guest) managed via Cloudflare Workers KV.

---

## 💻 Developer & Maintenance Guide

### Project Structure
```text
├── content/
│   ├── templates.js        # Escalation presets, templates, and note renderers
│   ├── content.js          # Core DOM scraper, UI bar, modal, and injector
│   └── content.css         # Theme styles, bar layout, modals, toasts
├── icons/                  # Product icons & branding assets
├── license/                # Cloudflare Worker license source
├── build-userscript.js     # Bundles source files into hdjrzTools.user.js
├── hdjrzTools.user.js      # Compiled standalone Tampermonkey Userscript
└── README.md
```

### Making Changes and Rebuilding

1. Edit the source files in `content/` (e.g. `content/templates.js`, `content/content.js`, `content/content.css`).
2. Run the build command:
   ```bash
   node build-userscript.js
   ```
   *(or `npm run build`)*
3. Bump the version number in `build-userscript.js` (e.g., `1.0.1`) when releasing a new version.
4. Commit and push to GitHub:
   ```bash
   git add .
   git commit -m "Update escalation templates"
   git push origin main
   ```
All agents will receive the update automatically!
