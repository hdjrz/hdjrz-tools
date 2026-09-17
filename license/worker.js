/**
 * Paste this into Cloudflare: Workers → hdjrz-license → Edit code → Deploy.
 * Binding name must stay LICENSES.
 */

const DEFAULT_SYSTEM_CONFIG = {
  minRequiredVersion: "1.1.4",
  latestVersion: "1.3.5",
  killSwitch: false,
  killSwitchMessage: "hdjrzTools is temporarily disabled for emergency maintenance.",
  allowedDomains: ["nano-admin.bet88.ph"]
};

function parseSemver(v) {
  const parts = String(v || "").replace(/[^0-9.]/g, "").split(".").map(n => parseInt(n, 10) || 0);
  while (parts.length < 3) parts.push(0);
  return parts;
}

function isVersionBelow(clientVer, minVer) {
  if (!clientVer || !minVer) return false;
  if (clientVer === "1.9.0" || clientVer === "1.9") {
    return true;
  }
  const a = parseSemver(clientVer);
  const b = parseSemver(minVer);
  for (let i = 0; i < 3; i++) {
    if (a[i] < b[i]) return true;
    if (a[i] > b[i]) return false;
  }
  return false;
}

let cachedGhVersion = null;
let cachedGhVersionTime = 0;

async function getLiveGitHubVersion(env) {
  const now = Date.now();
  if (cachedGhVersion && (now - cachedGhVersionTime < 60000)) {
    return cachedGhVersion;
  }
  try {
    const headers = { "User-Agent": "hdjrz-version-sync" };
    if (env && env.GITHUB_TOKEN) {
      headers["Authorization"] = `token ${env.GITHUB_TOKEN}`;
    }
    const resp = await fetch(`https://raw.githubusercontent.com/hdjrz/hdjrz-tools/main/package.json?ts=${now}`, { headers });
    if (resp.ok) {
      const data = await resp.json();
      if (data && data.version) {
        cachedGhVersion = String(data.version).trim();
        cachedGhVersionTime = now;
        return cachedGhVersion;
      }
    }
  } catch (e) {}
  return null;
}

async function getSystemConfig(env) {
  let cfg = { ...DEFAULT_SYSTEM_CONFIG };
  try {
    const raw = await env.LICENSES.get("SYSTEM_CONFIG");
    if (raw) {
      const kv = JSON.parse(raw);
      cfg = { ...cfg, ...kv };
    }
  } catch (e) {}

  try {
    const liveGhVer = await getLiveGitHubVersion(env);
    if (liveGhVer && !isVersionBelow(liveGhVer, cfg.latestVersion)) {
      cfg.latestVersion = liveGhVer;
    }
  } catch (e) {}

  if (isVersionBelow(cfg.latestVersion, DEFAULT_SYSTEM_CONFIG.latestVersion)) {
    cfg.latestVersion = DEFAULT_SYSTEM_CONFIG.latestVersion;
  }
  if (isVersionBelow(cfg.minRequiredVersion, DEFAULT_SYSTEM_CONFIG.minRequiredVersion)) {
    cfg.minRequiredVersion = DEFAULT_SYSTEM_CONFIG.minRequiredVersion;
  }
  return cfg;
}

async function getAdminPassword(env) {
  try {
    const custom = await env.LICENSES.get("ADMIN_PASSWORD");
    if (custom && custom.trim()) return custom.trim();
  } catch (e) {}
  return (env && env.ADMIN_PASSWORD) || "hdjrzAdmin2026!";
}

async function verifyAdminAuth(request, env) {
  const master = await getAdminPassword(env);
  const authHeader = request.headers.get("Authorization") || "";
  const directPass = request.headers.get("X-Admin-Password") || "";
  if (directPass && directPass === master) return true;
  if (authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7).trim();
    if (token === master) return true;
    try {
      const decoded = atob(token);
      const [type, ts, prefix] = decoded.split(":");
      if (type === "admin" && master.startsWith(prefix)) {
        if (Date.now() - Number(ts) < 7 * 24 * 60 * 60 * 1000) return true;
      }
    } catch (e) {}
  }
  return false;
}

const ADMIN_PORTAL_HTML = "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"UTF-8\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n  <title>hdjrzTools • Master Admin Portal</title>\n  <link rel=\"icon\" href=\"https://raw.githubusercontent.com/hdjrz/hdjrz-tools/main/icons/icon48.png\">\n  <style>\n    :root {\n      --bg: #060b16;\n      --card-bg: #0c1527;\n      --card-border: #1e293b;\n      --text: #f1f5f9;\n      --muted: #94a3b8;\n      --primary: #2563eb;\n      --primary-hover: #1d4ed8;\n      --success: #10b981;\n      --danger: #ef4444;\n      --warning: #f59e0b;\n      --font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;\n    }\n    * { box-sizing: border-box; margin: 0; padding: 0; }\n    body {\n      background: var(--bg);\n      color: var(--text);\n      font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Helvetica, Arial, sans-serif;\n      min-height: 100vh;\n      display: flex;\n      flex-direction: column;\n    }\n    /* Login Overlay */\n    #login-view {\n      display: flex;\n      align-items: center;\n      justify-content: center;\n      flex: 1;\n      padding: 20px;\n    }\n    .login-card {\n      background: var(--card-bg);\n      border: 1px solid var(--card-border);\n      border-radius: 12px;\n      padding: 32px;\n      width: 100%;\n      max-width: 420px;\n      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5);\n      text-align: center;\n    }\n    .login-logo {\n      width: 48px;\n      height: 48px;\n      border-radius: 50%;\n      margin-bottom: 12px;\n      box-shadow: 0 0 15px rgba(37, 99, 235, 0.4);\n    }\n    .login-title { font-size: 20px; font-weight: 700; color: #fff; margin-bottom: 4px; }\n    .login-subtitle { font-size: 13px; color: var(--muted); margin-bottom: 24px; }\n    .input-field {\n      width: 100%;\n      background: #060c18;\n      border: 1px solid #334155;\n      border-radius: 6px;\n      padding: 10px 14px;\n      font-size: 14px;\n      color: #fff;\n      margin-bottom: 16px;\n      outline: none;\n      transition: border-color 0.2s;\n    }\n    .input-field:focus { border-color: var(--primary); }\n    .btn {\n      display: inline-flex;\n      align-items: center;\n      justify-content: center;\n      gap: 6px;\n      padding: 10px 18px;\n      border-radius: 6px;\n      font-size: 13px;\n      font-weight: 600;\n      cursor: pointer;\n      border: none;\n      transition: all 0.15s;\n    }\n    .btn-primary { background: var(--primary); color: #fff; width: 100%; }\n    .btn-primary:hover { background: var(--primary-hover); }\n    .btn-sm { padding: 4px 10px; font-size: 11.5px; border-radius: 4px; }\n    .btn-danger { background: rgba(239, 68, 68, 0.2); color: #fca5a5; border: 1px solid rgba(239, 68, 68, 0.4); }\n    .btn-danger:hover { background: rgba(239, 68, 68, 0.35); }\n    .btn-warning { background: rgba(245, 158, 11, 0.2); color: #fde047; border: 1px solid rgba(245, 158, 11, 0.4); }\n    .btn-warning:hover { background: rgba(245, 158, 11, 0.35); }\n    .btn-secondary { background: #1e293b; color: #cbd5e1; border: 1px solid #334155; }\n    .btn-secondary:hover { background: #334155; }\n\n    /* Dashboard */\n    #dashboard-view { display: none; flex-direction: column; flex: 1; }\n    .topbar {\n      background: #091120;\n      border-bottom: 1px solid var(--card-border);\n      padding: 12px 24px;\n      display: flex;\n      align-items: center;\n      justify-content: space-between;\n    }\n    .brand-wrap { display: flex; align-items: center; gap: 10px; }\n    .brand-wrap img { width: 28px; height: 28px; border-radius: 50%; }\n    .brand-title { font-size: 15px; font-weight: 700; color: #fff; }\n    .brand-badge {\n      background: rgba(16, 185, 129, 0.15);\n      color: #34d399;\n      border: 1px solid rgba(16, 185, 129, 0.4);\n      font-size: 11px;\n      padding: 2px 8px;\n      border-radius: 9999px;\n      font-weight: 600;\n    }\n    .container { max-width: 1200px; margin: 0 auto; padding: 24px; width: 100%; flex: 1; }\n\n    /* Stats Row */\n    .stats-grid {\n      display: grid;\n      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));\n      gap: 16px;\n      margin-bottom: 24px;\n    }\n    .stat-card {\n      background: var(--card-bg);\n      border: 1px solid var(--card-border);\n      border-radius: 8px;\n      padding: 16px 20px;\n    }\n    .stat-title { font-size: 12px; font-weight: 600; color: var(--muted); text-transform: uppercase; margin-bottom: 6px; }\n    .stat-value { font-size: 26px; font-weight: 800; color: #fff; display: flex; align-items: center; gap: 8px; }\n    .online-pulse {\n      width: 10px;\n      height: 10px;\n      background: #10b981;\n      border-radius: 50%;\n      box-shadow: 0 0 10px #10b981;\n      animation: pulse 1.5s infinite;\n    }\n    @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(0.85); } }\n\n    /* Sections */\n    .section-card {\n      background: var(--card-bg);\n      border: 1px solid var(--card-border);\n      border-radius: 8px;\n      padding: 20px;\n      margin-bottom: 24px;\n    }\n    .section-header {\n      display: flex;\n      align-items: center;\n      justify-content: space-between;\n      margin-bottom: 16px;\n      padding-bottom: 10px;\n      border-bottom: 1px solid rgba(255, 255, 255, 0.06);\n    }\n    .section-title { font-size: 15px; font-weight: 700; color: #fff; display: flex; align-items: center; gap: 8px; }\n\n    /* Form Grid */\n    .form-grid {\n      display: grid;\n      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));\n      gap: 16px;\n      align-items: flex-end;\n    }\n    .form-group label { display: block; font-size: 12px; font-weight: 600; color: var(--muted); margin-bottom: 6px; }\n    .form-group input, .form-group select {\n      width: 100%;\n      background: #060c18;\n      border: 1px solid #334155;\n      border-radius: 6px;\n      padding: 9px 12px;\n      font-size: 13.5px;\n      color: #fff;\n      outline: none;\n    }\n    .form-group input:focus, .form-group select:focus { border-color: var(--primary); }\n\n    /* Table */\n    .table-wrap { overflow-x: auto; border: 1px solid var(--card-border); border-radius: 6px; }\n    table { width: 100%; border-collapse: collapse; font-size: 12.5px; text-align: left; }\n    th { background: #091120; color: var(--muted); font-weight: 600; padding: 10px 14px; border-bottom: 1px solid var(--card-border); }\n    td { padding: 12px 14px; border-bottom: 1px solid rgba(255, 255, 255, 0.04); }\n    tr:last-child td { border-bottom: none; }\n    tr:hover td { background: rgba(255, 255, 255, 0.02); }\n    .key-tag { font-family: var(--font-mono); font-weight: 700; color: #60a5fa; background: rgba(37, 99, 235, 0.12); padding: 3px 8px; border-radius: 4px; border: 1px solid rgba(37, 99, 235, 0.3); }\n    .badge-role { font-size: 10.5px; font-weight: 700; padding: 2px 7px; border-radius: 4px; text-transform: uppercase; }\n    .badge-role.admin { background: rgba(245, 158, 11, 0.2); color: #fde047; border: 1px solid rgba(245, 158, 11, 0.4); }\n    .badge-role.guest { background: rgba(148, 163, 184, 0.15); color: #cbd5e1; border: 1px solid rgba(148, 163, 184, 0.3); }\n    .badge-status { font-size: 10.5px; font-weight: 700; padding: 2px 7px; border-radius: 4px; }\n    .badge-status.active { background: rgba(16, 185, 129, 0.2); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.4); }\n    .badge-status.frozen { background: rgba(239, 68, 68, 0.2); color: #fca5a5; border: 1px solid rgba(239, 68, 68, 0.4); }\n    .actions-cell { display: flex; gap: 6px; flex-wrap: wrap; }\n    .toast {\n      position: fixed;\n      bottom: 24px;\n      right: 24px;\n      background: #0f172a;\n      border: 1px solid var(--primary);\n      color: #fff;\n      padding: 12px 20px;\n      border-radius: 8px;\n      box-shadow: 0 10px 25px rgba(0,0,0,0.5);\n      font-size: 13px;\n      font-weight: 600;\n      display: none;\n      z-index: 9999;\n    }\n  </style>\n</head>\n<body>\n\n  <!-- Login Screen -->\n  <div id=\"login-view\">\n    <div class=\"login-card\">\n      <img class=\"login-logo\" src=\"https://raw.githubusercontent.com/hdjrz/hdjrz-tools/main/icons/icon48.png\" alt=\"Logo\">\n      <h1 class=\"login-title\">hdjrzTools</h1>\n      <p class=\"login-subtitle\">Private Web Admin & License Control Portal</p>\n      <input type=\"password\" id=\"admin-pass-input\" class=\"input-field\" placeholder=\"Enter Master Admin Password\" autocomplete=\"current-password\">\n      <button type=\"button\" id=\"login-btn\" class=\"btn btn-primary\">Unlock Portal 🚀</button>\n      <p style=\"font-size: 11px; color: #64748b; margin-top: 14px;\">Protected Cloudflare Worker Endpoint</p>\n    </div>\n  </div>\n\n  <!-- Dashboard Screen -->\n  <div id=\"dashboard-view\">\n    <div class=\"topbar\">\n      <div class=\"brand-wrap\">\n        <img src=\"https://raw.githubusercontent.com/hdjrz/hdjrz-tools/main/icons/icon48.png\" alt=\"Logo\">\n        <span class=\"brand-title\">hdjrzTools Master Admin</span>\n        <span class=\"brand-badge\">⚡ Cloudflare Edge</span>\n      </div>\n      <button type=\"button\" id=\"logout-btn\" class=\"btn btn-secondary btn-sm\">Lock & Sign Out</button>\n    </div>\n\n    <div class=\"container\">\n      <!-- Stats Row -->\n      <div class=\"stats-grid\">\n        <div class=\"stat-card\">\n          <div class=\"stat-title\">👥 Active Staff Online</div>\n          <div class=\"stat-value\"><span class=\"online-pulse\"></span> <span id=\"stat-active-count\">0</span></div>\n        </div>\n        <div class=\"stat-card\">\n          <div class=\"stat-title\">🔑 Total License Keys</div>\n          <div class=\"stat-value\" id=\"stat-total-keys\">0</div>\n        </div>\n        <div class=\"stat-card\">\n          <div class=\"stat-title\">🟢 Active Keys</div>\n          <div class=\"stat-value\" style=\"color: #34d399;\" id=\"stat-active-keys\">0</div>\n        </div>\n        <div class=\"stat-card\">\n          <div class=\"stat-title\">❄️ Frozen Keys</div>\n          <div class=\"stat-value\" style=\"color: #f87171;\" id=\"stat-frozen-keys\">0</div>\n        </div>\n      </div>\n\n      <!-- ➕ Create New License Key -->\n      <div class=\"section-card\">\n        <div class=\"section-header\">\n          <div class=\"section-title\"><span>➕ Create New License Key</span></div>\n          <span style=\"font-size: 12px; color: var(--muted); font-family: var(--font-mono);\">Template: HDJRZ-GUEST-xxxx-xxxx</span>\n        </div>\n        <div class=\"form-grid\">\n          <div class=\"form-group\">\n            <label>License Role</label>\n            <select id=\"new-key-role\">\n              <option value=\"guest\" selected>Guest / Agent (Staff)</option>\n              <option value=\"admin\">Master Admin</option>\n            </select>\n          </div>\n          <div class=\"form-group\">\n            <label>Client / Agent Name</label>\n            <input type=\"text\" id=\"new-key-name\" placeholder=\"e.g. Reynald Lantano\">\n          </div>\n          <div>\n            <button type=\"button\" id=\"create-key-btn\" class=\"btn btn-primary\" style=\"height: 38px;\">\n              ⚡ Generate License Key\n            </button>\n          </div>\n        </div>\n      </div>\n\n      <!-- 🔑 Issued License Keys Table -->\n      <div class=\"section-card\">\n        <div class=\"section-header\">\n          <div class=\"section-title\"><span>🔑 Issued License Keys</span></div>\n          <div style=\"display: flex; gap: 8px;\">\n            <input type=\"text\" id=\"search-keys\" placeholder=\"Search by name or key...\" style=\"background: #060c18; border: 1px solid #334155; border-radius: 4px; padding: 4px 10px; color: #fff; font-size: 12px;\">\n            <button type=\"button\" id=\"refresh-keys-btn\" class=\"btn btn-secondary btn-sm\">🔄 Refresh</button>\n          </div>\n        </div>\n        <div class=\"table-wrap\">\n          <table>\n            <thead>\n              <tr>\n                <th>License Key</th>\n                <th>Role</th>\n                <th>Agent / Client</th>\n                <th>Device Binding</th>\n                <th>Status</th>\n                <th>Created</th>\n                <th>Actions</th>\n              </tr>\n            </thead>\n            <tbody id=\"keys-tbody\">\n              <tr><td colspan=\"7\" style=\"text-align: center; color: var(--muted); padding: 20px;\">Loading licenses...</td></tr>\n            </tbody>\n          </table>\n        </div>\n      </div>\n\n      <!-- 📋 Active Users Online -->\n      <div class=\"section-card\">\n        <div class=\"section-header\">\n          <div class=\"section-title\"><span>📋 Currently Active Staff (Real-time Pings)</span></div>\n          <span style=\"font-size: 11px; color: #64748b;\">Auto-refreshes every 15s</span>\n        </div>\n        <div class=\"table-wrap\">\n          <table>\n            <thead>\n              <tr>\n                <th>Status</th>\n                <th>Agent Name</th>\n                <th>Script Version</th>\n                <th>Last Active</th>\n              </tr>\n            </thead>\n            <tbody id=\"active-users-tbody\">\n              <tr><td colspan=\"4\" style=\"text-align: center; color: var(--muted); padding: 20px;\">No agents active in the last 5 minutes.</td></tr>\n            </tbody>\n          </table>\n        </div>\n      </div>\n\n      <!-- ⚙️ Master Password Change -->\n      <div class=\"section-card\" style=\"margin-bottom: 0;\">\n        <div class=\"section-header\">\n          <div class=\"section-title\"><span>⚙️ Master Admin Password</span></div>\n        </div>\n        <div style=\"display: flex; gap: 12px; max-width: 450px;\">\n          <input type=\"password\" id=\"new-master-pass\" placeholder=\"Enter new master password\" style=\"flex: 1; background: #060c18; border: 1px solid #334155; border-radius: 6px; padding: 8px 12px; color: #fff; font-size: 13px;\">\n          <button type=\"button\" id=\"change-pass-btn\" class=\"btn btn-secondary btn-sm\">Update Password</button>\n        </div>\n      </div>\n    </div>\n  </div>\n\n  <div id=\"toast\" class=\"toast\"></div>\n\n  <script>\n    let authToken = sessionStorage.getItem(\"hdjrz_admin_token\") || \"\";\n\n    const loginView = document.getElementById(\"login-view\");\n    const dashboardView = document.getElementById(\"dashboard-view\");\n    const adminPassInput = document.getElementById(\"admin-pass-input\");\n    const loginBtn = document.getElementById(\"login-btn\");\n    const logoutBtn = document.getElementById(\"logout-btn\");\n    const toast = document.getElementById(\"toast\");\n\n    function showToast(msg) {\n      toast.textContent = msg;\n      toast.style.display = \"block\";\n      setTimeout(() => { toast.style.display = \"none\"; }, 3000);\n    }\n\n    async function apiRequest(path, method = \"GET\", body = null) {\n      const headers = { \"Content-Type\": \"application/json\" };\n      if (authToken) headers[\"Authorization\"] = \"Bearer \" + authToken;\n      const opts = { method, headers };\n      if (body) opts.body = JSON.stringify(body);\n      const res = await fetch(path, opts);\n      return res.json();\n    }\n\n    async function doLogin() {\n      const pass = adminPassInput.value.trim();\n      if (!pass) return alert(\"Please enter master password.\");\n      loginBtn.disabled = true;\n      loginBtn.textContent = \"Verifying...\";\n      try {\n        const res = await apiRequest(\"/admin/api/auth\", \"POST\", { password: pass });\n        if (res.ok && res.token) {\n          authToken = res.token;\n          sessionStorage.setItem(\"hdjrz_admin_token\", authToken);\n          showDashboard();\n        } else {\n          alert(\"Wrong password. Default is hdjrzAdmin2026!\");\n        }\n      } catch (err) {\n        alert(\"Server connection error: \" + err.message);\n      } finally {\n        loginBtn.disabled = false;\n        loginBtn.textContent = \"Unlock Portal 🚀\";\n      }\n    }\n\n    loginBtn.addEventListener(\"click\", doLogin);\n    adminPassInput.addEventListener(\"keydown\", (e) => { if (e.key === \"Enter\") doLogin(); });\n    logoutBtn.addEventListener(\"click\", () => {\n      authToken = \"\";\n      sessionStorage.removeItem(\"hdjrz_admin_token\");\n      location.reload();\n    });\n\n    function showDashboard() {\n      loginView.style.display = \"none\";\n      dashboardView.style.display = \"flex\";\n      loadLicenses();\n      loadActiveUsers();\n      setInterval(loadActiveUsers, 15000);\n    }\n\n    let currentLicenses = [];\n\n    async function loadLicenses() {\n      const res = await apiRequest(\"/admin/api/licenses\");\n      if (!res.ok) {\n        if (res.error === \"unauthorized\") {\n          authToken = \"\";\n          sessionStorage.removeItem(\"hdjrz_admin_token\");\n          location.reload();\n        }\n        return;\n      }\n      currentLicenses = res.licenses || [];\n      renderLicensesTable(currentLicenses);\n    }\n\n    function renderLicensesTable(list) {\n      const tbody = document.getElementById(\"keys-tbody\");\n      const search = (document.getElementById(\"search-keys\").value || \"\").toLowerCase();\n      const filtered = list.filter(l => \n        (l.key || \"\").toLowerCase().includes(search) || \n        (l.owner || \"\").toLowerCase().includes(search) ||\n        (l.role || \"\").toLowerCase().includes(search)\n      );\n\n      let activeCount = 0;\n      let frozenCount = 0;\n\n      list.forEach(l => {\n        if (l.active === false) frozenCount++;\n        else activeCount++;\n      });\n\n      document.getElementById(\"stat-total-keys\").textContent = list.length;\n      document.getElementById(\"stat-active-keys\").textContent = activeCount;\n      document.getElementById(\"stat-frozen-keys\").textContent = frozenCount;\n\n      if (!filtered.length) {\n        tbody.innerHTML = '<tr><td colspan=\"7\" style=\"text-align: center; color: var(--muted); padding: 20px;\">No licenses found.</td></tr>';\n        return;\n      }\n\n      tbody.innerHTML = filtered.map(item => {\n        const isFrozen = item.active === false;\n        const isBound = !!item.deviceId;\n        const boundDisplay = isBound \n          ? '<span style=\"color:#34d399; font-weight:600;\">✓ Bound (' + escapeHtml(item.deviceId.slice(0, 10)) + '...)</span>'\n          : '<span style=\"color:#94a3b8; font-style:italic;\">Unbound (Open)</span>';\n\n        const roleClass = item.role === \"admin\" ? \"admin\" : \"guest\";\n        const statusBadge = isFrozen\n          ? '<span class=\"badge-status frozen\">Frozen</span>'\n          : '<span class=\"badge-status active\">Active</span>';\n\n        const createdDate = item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '—';\n\n        return '<tr>' +\n          '<td><span class=\"key-tag\">' + escapeHtml(item.key) + '</span></td>' +\n          '<td><span class=\"badge-role ' + roleClass + '\">' + escapeHtml(item.role || \"guest\") + '</span></td>' +\n          '<td><strong>' + escapeHtml(item.owner || \"—\") + '</strong></td>' +\n          '<td>' + boundDisplay + '</td>' +\n          '<td>' + statusBadge + '</td>' +\n          '<td>' + createdDate + '</td>' +\n          '<td><div class=\"actions-cell\">' +\n            (isBound ? '<button type=\"button\" class=\"btn btn-warning btn-sm\" onclick=\"resetDevice(\\'' + escapeHtml(item.key) + '\\')\">🔄 Reset Device</button>' : '') +\n            '<button type=\"button\" class=\"btn btn-secondary btn-sm\" onclick=\"toggleFreeze(\\'' + escapeHtml(item.key) + '\\')\">' + (isFrozen ? '🟢 Unfreeze' : '🚫 Freeze') + '</button>' +\n            '<button type=\"button\" class=\"btn btn-danger btn-sm\" onclick=\"deleteKey(\\'' + escapeHtml(item.key) + '\\')\">🗑️</button>' +\n          '</div></td>' +\n        '</tr>';\n      }).join(\"\");\n    }\n\n    document.getElementById(\"search-keys\").addEventListener(\"input\", () => renderLicensesTable(currentLicenses));\n    document.getElementById(\"refresh-keys-btn\").addEventListener(\"click\", loadLicenses);\n\n    // Create New Key\n    document.getElementById(\"create-key-btn\").addEventListener(\"click\", async () => {\n      const role = document.getElementById(\"new-key-role\").value;\n      const owner = document.getElementById(\"new-key-name\").value.trim() || \"Agent\";\n      const btn = document.getElementById(\"create-key-btn\");\n      btn.disabled = true;\n      btn.textContent = \"Generating...\";\n      try {\n        const res = await apiRequest(\"/admin/api/licenses/create\", \"POST\", { role, owner });\n        if (res.ok && res.key) {\n          navigator.clipboard.writeText(res.key);\n          showToast(\"✅ Generated & Copied to clipboard: \" + res.key);\n          document.getElementById(\"new-key-name\").value = \"\";\n          loadLicenses();\n        } else {\n          alert(\"Failed to create key: \" + (res.error || \"Unknown error\"));\n        }\n      } catch (e) {\n        alert(\"Error: \" + e.message);\n      } finally {\n        btn.disabled = false;\n        btn.textContent = \"⚡ Generate License Key\";\n      }\n    });\n\n    // Reset Device Binding\n    window.resetDevice = async function(key) {\n      if (!confirm(\"Reset device binding for \" + key + \"?\\n\\nThis will allow the agent to log in from their new laptop / PC immediately.\")) return;\n      const res = await apiRequest(\"/admin/api/licenses/reset-device\", \"POST\", { key });\n      if (res.ok) {\n        showToast(\"✓ Device binding unlocked for \" + key);\n        loadLicenses();\n      } else {\n        alert(\"Failed to reset: \" + res.error);\n      }\n    };\n\n    // Toggle Freeze\n    window.toggleFreeze = async function(key) {\n      const res = await apiRequest(\"/admin/api/licenses/toggle-freeze\", \"POST\", { key });\n      if (res.ok) {\n        showToast(res.message);\n        loadLicenses();\n      } else {\n        alert(\"Failed: \" + res.error);\n      }\n    };\n\n    // Delete Key\n    window.deleteKey = async function(key) {\n      if (!confirm(\"Are you sure you want to permanently delete license key \" + key + \"?\")) return;\n      const res = await apiRequest(\"/admin/api/licenses/delete\", \"POST\", { key });\n      if (res.ok) {\n        showToast(\"Deleted \" + key);\n        loadLicenses();\n      } else {\n        alert(\"Failed to delete: \" + res.error);\n      }\n    };\n\n    // Active Users\n    async function loadActiveUsers() {\n      const res = await apiRequest(\"/admin/api/active-users\");\n      if (!res.ok) return;\n      const tbody = document.getElementById(\"active-users-tbody\");\n      const users = res.users || [];\n      document.getElementById(\"stat-active-count\").textContent = users.length;\n\n      if (!users.length) {\n        tbody.innerHTML = '<tr><td colspan=\"4\" style=\"text-align: center; color: var(--muted); padding: 20px;\">No agents active in the last 5 minutes.</td></tr>';\n        return;\n      }\n\n      const now = Date.now();\n      tbody.innerHTML = users.map(u => {\n        const diffSec = Math.round((now - (u.lastSeen || now)) / 1000);\n        const timeAgo = diffSec < 60 ? \"Just now\" : Math.round(diffSec / 60) + \"m ago\";\n        return '<tr>' +\n          '<td><span style=\"color: #34d399; font-weight:700;\">🟢 Online</span></td>' +\n          '<td><strong>' + escapeHtml(u.agent || \"Agent\") + '</strong></td>' +\n          '<td><span style=\"font-family: var(--font-mono); color: #60a5fa;\">v' + escapeHtml(u.version || \"1.0.0\") + '</span></td>' +\n          '<td>' + timeAgo + '</td>' +\n        '</tr>';\n      }).join(\"\");\n    }\n\n    // Change Master Password\n    document.getElementById(\"change-pass-btn\").addEventListener(\"click\", async () => {\n      const newPass = document.getElementById(\"new-master-pass\").value.trim();\n      if (!newPass) return alert(\"Enter a new password\");\n      if (!confirm(\"Change Master Admin Password? Make sure to remember the new password!\")) return;\n      const res = await apiRequest(\"/admin/api/change-password\", \"POST\", { newPassword: newPass });\n      if (res.ok) {\n        alert(\"Master Admin Password updated successfully!\");\n        document.getElementById(\"new-master-pass\").value = \"\";\n      } else {\n        alert(\"Error: \" + res.error);\n      }\n    });\n\n    function escapeHtml(s) {\n      return String(s || \"\").replace(/&/g, \"&amp;\").replace(/</g, \"&lt;\").replace(/>/g, \"&gt;\").replace(/\"/g, \"&quot;\");\n    }\n\n    if (authToken) {\n      showDashboard();\n    }\n  </script>\n</body>\n</html>";

export default {
  async fetch(request, env) {
    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "*, Content-Type, Cache-Control, Pragma, Authorization, X-Requested-With, X-Admin-Password",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS, HEAD",
      "Content-Type": "application/json"
    };

    try {
      const url = new URL(request.url);

      if (request.method === "OPTIONS") {
        return new Response(null, { headers: cors });
      }

      // =========================================================================
      // 1. Private Web Admin Portal (GET /admin)
      // =========================================================================
      if (url.pathname === "/admin" || url.pathname === "/admin/") {
        return new Response(ADMIN_PORTAL_HTML, {
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Cache-Control": "no-cache, no-store, must-revalidate"
          }
        });
      }

      // Admin Auth API
      if (request.method === "POST" && url.pathname === "/admin/api/auth") {
        let body = {};
        try { body = await request.json(); } catch (e) {}
        const pass = String(body.password || "").trim();
        const master = await getAdminPassword(env);
        if (pass === master) {
          const token = btoa("admin:" + Date.now() + ":" + master.slice(0, 4));
          return json({ ok: true, token }, cors);
        }
        return json({ ok: false, error: "invalid_password" }, cors);
      }

      // Admin API: List Licenses
      if (request.method === "GET" && url.pathname === "/admin/api/licenses") {
        if (!(await verifyAdminAuth(request, env))) {
          return json({ ok: false, error: "unauthorized" }, cors, 401);
        }
        const list = await env.LICENSES.list({ limit: 500 });
        const systemKeys = new Set(["SYSTEM_CONFIG", "REMOTE_TEMPLATES", "ACTIVE_AGENTS", "ADMIN_PASSWORD"]);
        const licenses = [];
        for (const item of list.keys) {
          if (systemKeys.has(item.name)) continue;
          const raw = await env.LICENSES.get(item.name);
          let record = { key: item.name, role: "guest", owner: "—", deviceId: "", active: true, createdAt: null, usedAt: null };
          try {
            const parsed = JSON.parse(raw);
            if (typeof parsed === "object" && parsed !== null) {
              record = { ...record, ...parsed, key: item.name };
            } else if (typeof parsed === "string") {
              record.role = parsed;
            }
          } catch (e) {
            if (raw === "admin" || raw === "guest") record.role = raw;
          }
          licenses.push(record);
        }
        return json({ ok: true, licenses }, cors);
      }

      // Admin API: Create License Key (Template: HDJRZ-GUEST-xxxx-xxxx)
      if (request.method === "POST" && url.pathname === "/admin/api/licenses/create") {
        if (!(await verifyAdminAuth(request, env))) {
          return json({ ok: false, error: "unauthorized" }, cors, 401);
        }
        let body = {};
        try { body = await request.json(); } catch (e) {}
        const role = body.role === "admin" ? "admin" : "guest";
        const owner = String(body.owner || "").trim() || "Agent";

        function gen4() {
          const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
          let s = "";
          for (let i = 0; i < 4; i++) s += chars.charAt(Math.floor(Math.random() * chars.length));
          return s;
        }
        const prefix = role === "admin" ? "HDJRZ-ADMIN" : "HDJRZ-GUEST";
        const newKey = `${prefix}-${gen4()}-${gen4()}`;

        const newRecord = {
          role,
          owner,
          deviceId: "",
          active: true,
          createdAt: new Date().toISOString(),
          usedAt: null
        };
        await env.LICENSES.put(newKey, JSON.stringify(newRecord));
        return json({ ok: true, key: newKey, license: newRecord }, cors);
      }

      // Admin API: Reset Device Binding (1-click unlock)
      if (request.method === "POST" && url.pathname === "/admin/api/licenses/reset-device") {
        if (!(await verifyAdminAuth(request, env))) {
          return json({ ok: false, error: "unauthorized" }, cors, 401);
        }
        let body = {};
        try { body = await request.json(); } catch (e) {}
        const targetKey = String(body.key || "").trim();
        if (!targetKey) return json({ ok: false, error: "missing_key" }, cors);
        const raw = await env.LICENSES.get(targetKey);
        if (!raw) return json({ ok: false, error: "not_found" }, cors);
        let row = {};
        try { row = JSON.parse(raw); } catch (e) {}
        row.deviceId = "";
        await env.LICENSES.put(targetKey, JSON.stringify(row));
        return json({ ok: true, message: `Device binding reset for ${targetKey}` }, cors);
      }

      // Admin API: Revoke / Freeze / Unfreeze Key
      if (request.method === "POST" && url.pathname === "/admin/api/licenses/toggle-freeze") {
        if (!(await verifyAdminAuth(request, env))) {
          return json({ ok: false, error: "unauthorized" }, cors, 401);
        }
        let body = {};
        try { body = await request.json(); } catch (e) {}
        const targetKey = String(body.key || "").trim();
        if (!targetKey) return json({ ok: false, error: "missing_key" }, cors);
        const raw = await env.LICENSES.get(targetKey);
        if (!raw) return json({ ok: false, error: "not_found" }, cors);
        let row = {};
        try { row = JSON.parse(raw); } catch (e) {}
        row.active = row.active === false ? true : false;
        await env.LICENSES.put(targetKey, JSON.stringify(row));
        return json({ ok: true, active: row.active, message: `Key ${targetKey} is now ${row.active ? "Active" : "Frozen"}` }, cors);
      }

      // Admin API: Delete Key
      if (request.method === "POST" && url.pathname === "/admin/api/licenses/delete") {
        if (!(await verifyAdminAuth(request, env))) {
          return json({ ok: false, error: "unauthorized" }, cors, 401);
        }
        let body = {};
        try { body = await request.json(); } catch (e) {}
        const targetKey = String(body.key || "").trim();
        if (!targetKey) return json({ ok: false, error: "missing_key" }, cors);
        await env.LICENSES.delete(targetKey);
        return json({ ok: true, message: `Key ${targetKey} deleted` }, cors);
      }

      // Admin API: Active Users List
      if (request.method === "GET" && url.pathname === "/admin/api/active-users") {
        if (!(await verifyAdminAuth(request, env))) {
          return json({ ok: false, error: "unauthorized" }, cors, 401);
        }
        let activeMap = {};
        try {
          const rawActive = await env.LICENSES.get("ACTIVE_AGENTS");
          if (rawActive) activeMap = JSON.parse(rawActive);
        } catch (e) {}
        const now = Date.now();
        const users = Object.values(activeMap)
          .filter(a => a && (now - (a.lastSeen || 0)) <= 5 * 60 * 1000)
          .map(a => ({
            agent: a.agent || "Agent",
            version: a.version || "1.0.0",
            lastSeen: a.lastSeen || now,
            online: true
          }));
        return json({ ok: true, users, count: users.length }, cors);
      }

      // Admin API: Change Master Password
      if (request.method === "POST" && url.pathname === "/admin/api/change-password") {
        if (!(await verifyAdminAuth(request, env))) {
          return json({ ok: false, error: "unauthorized" }, cors, 401);
        }
        let body = {};
        try { body = await request.json(); } catch (e) {}
        const newPass = String(body.newPassword || "").trim();
        if (!newPass || newPass.length < 6) {
          return json({ ok: false, error: "Password must be at least 6 characters" }, cors);
        }
        await env.LICENSES.put("ADMIN_PASSWORD", newPass);
        return json({ ok: true, message: "Master password updated successfully" }, cors);
      }

      // =========================================================================
      // 2. Zero-cache Userscript, Bundle & Metadata Endpoints
      // =========================================================================
      if ((request.method === "GET" || request.method === "HEAD") && (
        url.pathname === "/bundle.js" ||
        url.pathname === "/loader.user.js" ||
        url.pathname === "/script.user.js" ||
        url.pathname === "/script.meta.js" ||
        url.pathname === "/hdjrzTools.user.js"
      )) {
        if (request.method === "HEAD") {
          return new Response(null, {
            headers: {
              "Content-Type": "text/javascript; charset=utf-8",
              "Access-Control-Allow-Origin": "*",
              "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
              "Pragma": "no-cache",
              "Expires": "0"
            }
          });
        }
        try {
          const headers = { "User-Agent": "Tampermonkey-Updater" };
          if (env.GITHUB_TOKEN) {
            headers["Authorization"] = `token ${env.GITHUB_TOKEN}`;
          }
          let targetFile = "hdjrzTools.user.js";
          if (url.pathname === "/bundle.js") {
            targetFile = "dist/bundle.js";
          } else if (url.pathname === "/loader.user.js") {
            targetFile = "hdjrzTools.loader.user.js";
          }
          const ghUrl = `https://raw.githubusercontent.com/hdjrz/hdjrz-tools/main/${targetFile}?ts=${Date.now()}`;
          const resp = await fetch(ghUrl, { headers });
          if (resp.ok) {
            const scriptText = await resp.text();
            let responseBody = scriptText;

            if (url.pathname.endsWith(".meta.js")) {
              const metaMatch = scriptText.match(/\/\/\s*==UserScript==[\s\S]*?\/\/\s*==\/UserScript==/);
              if (metaMatch) responseBody = metaMatch[0] + "\n";
            }

            return new Response(responseBody, {
              headers: {
                "Content-Type": "text/javascript; charset=utf-8",
                "Access-Control-Allow-Origin": "*",
                "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
                "Pragma": "no-cache",
                "Expires": "0"
              }
            });
          }
        } catch (e) {}
        return new Response("// Error fetching script from GitHub", { status: 500 });
      }

      // =========================================================================
      // 3. Remote Templates & System Enforcement: GET endpoint
      // =========================================================================
      if (request.method === "GET" && url.pathname === "/config/templates") {
        try {
          const sysConfig = await getSystemConfig(env);
          const clientVer = String(url.searchParams.get("v") || "0.0.0").trim();
          const clientDomain = String(url.searchParams.get("domain") || "").trim();

          // 1. Emergency Kill Switch check
          if (sysConfig.killSwitch) {
            return new Response(JSON.stringify({
              ok: false,
              blocked: true,
              reason: "kill_switch",
              message: sysConfig.killSwitchMessage || "hdjrzTools is temporarily disabled for emergency maintenance."
            }), { headers: { ...cors, "Cache-Control": "no-cache, no-store" } });
          }

          // 2. Domain check
          if (clientDomain && Array.isArray(sysConfig.allowedDomains) && sysConfig.allowedDomains.length > 0) {
            const isAllowed = sysConfig.allowedDomains.some(d => clientDomain === d || clientDomain.endsWith("." + d));
            if (!isAllowed) {
              return new Response(JSON.stringify({
                ok: false,
                blocked: true,
                reason: "unauthorized_domain",
                domain: clientDomain,
                message: "hdjrzTools is not authorized to run on " + clientDomain
              }), { headers: { ...cors, "Cache-Control": "no-cache, no-store" } });
            }
          }

          // 3. Minimum Version Enforcement
          if (clientVer && isVersionBelow(clientVer, sysConfig.minRequiredVersion)) {
            return new Response(JSON.stringify({
              ok: false,
              blocked: true,
              reason: "outdated_version",
              clientVersion: clientVer,
              minRequiredVersion: sysConfig.minRequiredVersion,
              latestVersion: sysConfig.latestVersion || "1.3.4",
              updateUrl: "https://hdjrz-license.rosechel05.workers.dev/script.user.js",
              message: `⚠️ Critical Update Required: Your version (v${clientVer}) is out of date. Update to v${sysConfig.latestVersion || "1.3.4"} to continue.`
            }), { headers: { ...cors, "Cache-Control": "no-cache, no-store" } });
          }

          const raw = await env.LICENSES.get("REMOTE_TEMPLATES");
          let tmplData = raw ? JSON.parse(raw) : { version: 0, updatedAt: null, options: [] };

          const agentName = String(url.searchParams.get("agent") || "").trim();
          const devId = String(url.searchParams.get("dev") || "").trim();

          let activeMap = {};
          try {
            const rawActive = await env.LICENSES.get("ACTIVE_AGENTS");
            if (rawActive) activeMap = JSON.parse(rawActive);
          } catch (e) {}

          const now = Date.now();
          // Clean up agents inactive for more than 5 minutes
          for (const k in activeMap) {
            if (!activeMap[k] || (now - (activeMap[k].lastSeen || 0)) > 5 * 60 * 1000) {
              delete activeMap[k];
            }
          }

          if (devId || agentName) {
            const id = devId || ("agent_" + agentName);
            activeMap[id] = {
              agent: agentName || "Agent",
              version: clientVer || "1.0.0",
              lastSeen: now
            };
            try {
              await env.LICENSES.put("ACTIVE_AGENTS", JSON.stringify(activeMap));
            } catch (e) {}
          }

          const activeList = Object.values(activeMap);
          const syncedAgents = activeList
            .filter(a => a.version === tmplData.version || a.version === String(tmplData.version))
            .map(a => a.agent);

          const responsePayload = {
            ok: true,
            version: tmplData.version,
            updatedAt: tmplData.updatedAt,
            options: tmplData.options,
            totalActive: activeList.length,
            syncedCount: syncedAgents.length,
            syncedAgents: syncedAgents,
            activeUsers: activeList.map(a => ({ agent: a.agent, version: a.version, lastSeen: a.lastSeen })),
            systemConfig: {
              minRequiredVersion: sysConfig.minRequiredVersion,
              latestVersion: sysConfig.latestVersion,
              killSwitch: sysConfig.killSwitch
            }
          };

          return new Response(JSON.stringify(responsePayload), {
            headers: {
              ...cors,
              "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0"
            }
          });
        } catch (e) {
          return new Response(JSON.stringify({ ok: false, error: "server_error" }), {
            headers: cors
          });
        }
      }

      // =========================================================================
      // 4. Remote Templates: POST endpoint for admin
      // =========================================================================
      if (request.method === "POST" && url.pathname === "/config/templates") {
        let payload = {};
        try { payload = await request.json(); } catch (e) {}
        const adminKey = String(payload.key || "").trim();
        const options = payload.options;
        if (!adminKey || !Array.isArray(options) || !options.length) {
          return json({ ok: false, error: "invalid_payload" }, cors);
        }
        const rawLicense = await env.LICENSES.get(adminKey);
        if (!rawLicense) {
          return json({ ok: false, error: "unauthorized" }, cors);
        }
        let row = {};
        try { row = JSON.parse(rawLicense); } catch (e) {}
        if (row.role !== "admin") {
          return json({ ok: false, error: "admin_required" }, cors);
        }

        let currentVersion = 1;
        try {
          const existing = await env.LICENSES.get("REMOTE_TEMPLATES");
          if (existing) {
            const parsed = JSON.parse(existing);
            if (typeof parsed.version === "number") currentVersion = parsed.version + 1;
          }
        } catch (e) {}

        let activeMap = {};
        try {
          const rawActive = await env.LICENSES.get("ACTIVE_AGENTS");
          if (rawActive) activeMap = JSON.parse(rawActive);
        } catch (e) {}
        const totalActive = Object.keys(activeMap).length;

        const storePayload = {
          version: currentVersion,
          updatedAt: new Date().toISOString(),
          publishedBy: adminKey.slice(0, 4) + "***",
          options: options
        };
        await env.LICENSES.put("REMOTE_TEMPLATES", JSON.stringify(storePayload));
        return json({ ok: true, version: currentVersion, updatedAt: storePayload.updatedAt, totalActive }, cors);
      }

      // =========================================================================
      // 5. System Enforcement Config: GET & POST
      // =========================================================================
      if (request.method === "GET" && url.pathname === "/config/system") {
        const sysConfig = await getSystemConfig(env);
        return json({ ok: true, config: sysConfig }, cors);
      }

      if (request.method === "POST" && url.pathname === "/config/system") {
        let payload = {};
        try { payload = await request.json(); } catch (e) {}
        const adminKey = String(payload.key || "").trim();
        if (!adminKey) return json({ ok: false, error: "unauthorized" }, cors);
        const rawLicense = await env.LICENSES.get(adminKey);
        if (!rawLicense) return json({ ok: false, error: "unauthorized" }, cors);
        let row = {};
        try { row = JSON.parse(rawLicense); } catch (e) {}
        if (row.role !== "admin") return json({ ok: false, error: "admin_required" }, cors);

        const current = await getSystemConfig(env);
        const updated = {
          ...current,
          minRequiredVersion: payload.minRequiredVersion ? String(payload.minRequiredVersion).trim() : current.minRequiredVersion,
          latestVersion: payload.latestVersion ? String(payload.latestVersion).trim() : current.latestVersion,
          killSwitch: typeof payload.killSwitch === "boolean" ? payload.killSwitch : current.killSwitch,
          killSwitchMessage: payload.killSwitchMessage ? String(payload.killSwitchMessage).trim() : current.killSwitchMessage,
          allowedDomains: Array.isArray(payload.allowedDomains) ? payload.allowedDomains : current.allowedDomains
        };
        await env.LICENSES.put("SYSTEM_CONFIG", JSON.stringify(updated));
        return json({ ok: true, config: updated }, cors);
      }

      // =========================================================================
      // 6. License Activation & Verification Endpoint (POST /)
      // =========================================================================
      if (request.method !== "POST") {
        return json({ ok: false, error: "missing" }, cors);
      }

      let body = {};
      try { body = await request.json(); } catch (e) {}

      const key = String(body.key || "").trim();
      const device = String(body.deviceId || "").trim();
      const action = String(body.action || "").trim();
      const clientVer = String(body.version || "1.1.4").trim();

      if (!key || !device) {
        return json({ ok: false, error: "missing" }, cors);
      }

      const sysConfig = await getSystemConfig(env);
      if (sysConfig.killSwitch) {
        return json({ ok: false, error: "kill_switch", message: sysConfig.killSwitchMessage }, cors);
      }
      if (isVersionBelow(clientVer, sysConfig.minRequiredVersion)) {
        return json({
          ok: false,
          error: "outdated_version",
          message: `⚠️ Critical Update Required: Your script version (v${clientVer}) is obsolete. Please update to v${sysConfig.latestVersion || "1.3.4"}.`,
          minRequiredVersion: sysConfig.minRequiredVersion,
          latestVersion: sysConfig.latestVersion
        }, cors);
      }

      const raw = await env.LICENSES.get(key);
      if (!raw) {
        return json({ ok: false, error: "invalid" }, cors);
      }

      let row = {};
      try {
        row = JSON.parse(raw);
      } catch (e) {
        if (typeof raw === "string" && (raw.trim() === "admin" || raw.trim() === "guest")) {
          row = { role: raw.trim(), deviceId: "", active: true };
        } else {
          return json({ ok: false, error: "invalid" }, cors);
        }
      }

      if (typeof row !== "object" || row === null) {
        if (row === "admin" || row === "guest") {
          row = { role: row, deviceId: "", active: true };
        } else {
          return json({ ok: false, error: "invalid" }, cors);
        }
      }

      // Check if license is frozen / deactivated
      if (row.active === false) {
        return json({ ok: false, error: "revoked", message: "🚫 This license key has been deactivated or frozen by Admin." }, cors);
      }

      const role = (row.role === "admin" || row === "admin") ? "admin" : "guest";
      const used = String(row.deviceId || "").trim();

      if (action === "release") {
        if (used && used !== device && role !== "admin") {
          return json({ ok: false, error: "already_used" }, cors);
        }
        await env.LICENSES.put(key, JSON.stringify({ ...row, role, deviceId: "" }));
        return json({ ok: true, role }, cors);
      }

      const verMeta = {
        latestVersion: sysConfig.latestVersion,
        minRequiredVersion: sysConfig.minRequiredVersion,
        updateUrl: "https://hdjrz-license.rosechel05.workers.dev/script.user.js"
      };

      // Admin role: Always allow master admin to log in and re-bind device seamlessly
      if (role === "admin") {
        row.role = "admin";
        row.deviceId = device;
        row.usedAt = new Date().toISOString();
        await env.LICENSES.put(key, JSON.stringify(row));
        return json({ ok: true, role: "admin", ...verMeta }, cors);
      }

      if (!used) {
        row.role = role;
        row.deviceId = device;
        row.usedAt = new Date().toISOString();
        await env.LICENSES.put(key, JSON.stringify(row));
        return json({ ok: true, role, ...verMeta }, cors);
      }
      if (used === device) {
        return json({ ok: true, role, ...verMeta }, cors);
      }
      return json({ ok: false, error: "already_used" }, cors);
    } catch (fatalErr) {
      console.error("[hdjrz-license worker fatal error]:", fatalErr);
      return new Response(JSON.stringify({
        ok: false,
        error: "server_error",
        message: String(fatalErr && fatalErr.message ? fatalErr.message : fatalErr)
      }), {
        status: 500,
        headers: cors
      });
    }
  }
};

function json(obj, cors, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: cors });
}
