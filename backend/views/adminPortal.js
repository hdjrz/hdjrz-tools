/**
 * Master Admin Portal HTML Template
 */

export const ADMIN_PORTAL_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>hdjrzTools • Master Admin Portal</title>
  <link rel="icon" href="https://raw.githubusercontent.com/hdjrz/hdjrz-tools/main/icons/icon48.png">
  <style>
    :root {
      --bg: #060b16;
      --card-bg: #0c1527;
      --card-border: #1e293b;
      --text: #f1f5f9;
      --muted: #94a3b8;
      --primary: #2563eb;
      --primary-hover: #1d4ed8;
      --success: #10b981;
      --danger: #ef4444;
      --warning: #f59e0b;
      --font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: var(--bg);
      color: var(--text);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    /* Login Overlay */
    #login-view {
      display: flex;
      align-items: center;
      justify-content: center;
      flex: 1;
      padding: 20px;
    }
    .login-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      padding: 32px;
      width: 100%;
      max-width: 420px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5);
      text-align: center;
    }
    .login-logo {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      margin-bottom: 12px;
      box-shadow: 0 0 15px rgba(37, 99, 235, 0.4);
    }
    .login-title { font-size: 20px; font-weight: 700; color: #fff; margin-bottom: 4px; }
    .login-subtitle { font-size: 13px; color: var(--muted); margin-bottom: 24px; }
    .input-field {
      width: 100%;
      background: #060c18;
      border: 1px solid #334155;
      border-radius: 6px;
      padding: 10px 14px;
      font-size: 14px;
      color: #fff;
      margin-bottom: 16px;
      outline: none;
      transition: border-color 0.2s;
    }
    .input-field:focus { border-color: var(--primary); }
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 10px 18px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      border: none;
      transition: all 0.15s;
    }
    .btn-primary { background: var(--primary); color: #fff; width: 100%; }
    .btn-primary:hover { background: var(--primary-hover); }
    .btn-sm { padding: 4px 10px; font-size: 11.5px; border-radius: 4px; }
    .btn-danger { background: rgba(239, 68, 68, 0.2); color: #fca5a5; border: 1px solid rgba(239, 68, 68, 0.4); }
    .btn-danger:hover { background: rgba(239, 68, 68, 0.35); }
    .btn-warning { background: rgba(245, 158, 11, 0.2); color: #fde047; border: 1px solid rgba(245, 158, 11, 0.4); }
    .btn-warning:hover { background: rgba(245, 158, 11, 0.35); }
    .btn-secondary { background: #1e293b; color: #cbd5e1; border: 1px solid #334155; }
    .btn-secondary:hover { background: #334155; }

    /* Dashboard */
    #dashboard-view { display: none; flex-direction: column; flex: 1; }
    .topbar {
      background: #091120;
      border-bottom: 1px solid var(--card-border);
      padding: 12px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .brand-wrap { display: flex; align-items: center; gap: 10px; }
    .brand-wrap img { width: 28px; height: 28px; border-radius: 50%; }
    .brand-title { font-size: 15px; font-weight: 700; color: #fff; }
    .brand-badge {
      background: rgba(16, 185, 129, 0.15);
      color: #34d399;
      border: 1px solid rgba(16, 185, 129, 0.4);
      font-size: 11px;
      padding: 2px 8px;
      border-radius: 9999px;
      font-weight: 600;
    }
    .container { max-width: 1200px; margin: 0 auto; padding: 24px; width: 100%; flex: 1; }

    /* Stats Row */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
    .stat-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 8px;
      padding: 16px 20px;
    }
    .stat-title { font-size: 12px; font-weight: 600; color: var(--muted); text-transform: uppercase; margin-bottom: 6px; }
    .stat-value { font-size: 26px; font-weight: 800; color: #fff; display: flex; align-items: center; gap: 8px; }
    .online-pulse {
      width: 10px;
      height: 10px;
      background: #10b981;
      border-radius: 50%;
      box-shadow: 0 0 10px #10b981;
      animation: pulse 1.5s infinite;
    }
    @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(0.85); } }

    /* Sections */
    .section-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 24px;
    }
    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
      padding-bottom: 10px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    }
    .section-title { font-size: 15px; font-weight: 700; color: #fff; display: flex; align-items: center; gap: 8px; }

    /* Form Grid */
    .form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 16px;
      align-items: flex-end;
    }
    .form-group label { display: block; font-size: 12px; font-weight: 600; color: var(--muted); margin-bottom: 6px; }
    .form-group input, .form-group select {
      width: 100%;
      background: #060c18;
      border: 1px solid #334155;
      border-radius: 6px;
      padding: 9px 12px;
      font-size: 13.5px;
      color: #fff;
      outline: none;
    }
    .form-group input:focus, .form-group select:focus { border-color: var(--primary); }

    /* Table */
    .table-wrap { overflow-x: auto; border: 1px solid var(--card-border); border-radius: 6px; }
    table { width: 100%; border-collapse: collapse; font-size: 12.5px; text-align: left; }
    th { background: #091120; color: var(--muted); font-weight: 600; padding: 10px 14px; border-bottom: 1px solid var(--card-border); }
    td { padding: 12px 14px; border-bottom: 1px solid rgba(255, 255, 255, 0.04); }
    tr:last-child td { border-bottom: none; }
    tr:hover td { background: rgba(255, 255, 255, 0.02); }
    .key-tag { font-family: var(--font-mono); font-weight: 700; color: #60a5fa; background: rgba(37, 99, 235, 0.12); padding: 3px 8px; border-radius: 4px; border: 1px solid rgba(37, 99, 235, 0.3); }
    .badge-role { font-size: 10.5px; font-weight: 700; padding: 2px 7px; border-radius: 4px; text-transform: uppercase; }
    .badge-role.admin { background: rgba(245, 158, 11, 0.2); color: #fde047; border: 1px solid rgba(245, 158, 11, 0.4); }
    .badge-role.guest { background: rgba(148, 163, 184, 0.15); color: #cbd5e1; border: 1px solid rgba(148, 163, 184, 0.3); }
    .badge-status { font-size: 10.5px; font-weight: 700; padding: 2px 7px; border-radius: 4px; }
    .badge-status.active { background: rgba(16, 185, 129, 0.2); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.4); }
    .badge-status.frozen { background: rgba(239, 68, 68, 0.2); color: #fca5a5; border: 1px solid rgba(239, 68, 68, 0.4); }
    .actions-cell { display: flex; gap: 6px; flex-wrap: wrap; }
    .toast {
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: #0f172a;
      border: 1px solid var(--primary);
      color: #fff;
      padding: 12px 20px;
      border-radius: 8px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.5);
      font-size: 13px;
      font-weight: 600;
      display: none;
      z-index: 9999;
    }
  </style>
</head>
<body>

  <!-- Login Screen -->
  <div id="login-view">
    <div class="login-card">
      <img class="login-logo" src="https://raw.githubusercontent.com/hdjrz/hdjrz-tools/main/icons/icon48.png" alt="Logo">
      <h1 class="login-title">hdjrzTools</h1>
      <p class="login-subtitle">Private Web Admin & License Control Portal</p>
      <input type="password" id="admin-pass-input" class="input-field" placeholder="Enter Master Admin Password" autocomplete="current-password">
      <button type="button" id="login-btn" class="btn btn-primary">Unlock Portal 🚀</button>
      <p style="font-size: 11px; color: #64748b; margin-top: 14px;">Protected Cloudflare Worker Endpoint</p>
    </div>
  </div>

  <!-- Dashboard Screen -->
  <div id="dashboard-view">
    <div class="topbar">
      <div class="brand-wrap">
        <img src="https://raw.githubusercontent.com/hdjrz/hdjrz-tools/main/icons/icon48.png" alt="Logo">
        <span class="brand-title">hdjrzTools Master Admin</span>
        <span class="brand-badge">⚡ Cloudflare Edge</span>
      </div>
      <button type="button" id="logout-btn" class="btn btn-secondary btn-sm">Lock & Sign Out</button>
    </div>

    <div class="container">
      <!-- Stats Row -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-title">👥 Active Staff Online</div>
          <div class="stat-value"><span class="online-pulse"></span> <span id="stat-active-count">0</span></div>
        </div>
        <div class="stat-card">
          <div class="stat-title">🔑 Total License Keys</div>
          <div class="stat-value" id="stat-total-keys">0</div>
        </div>
        <div class="stat-card">
          <div class="stat-title">🟢 Active Keys</div>
          <div class="stat-value" style="color: #34d399;" id="stat-active-keys">0</div>
        </div>
        <div class="stat-card">
          <div class="stat-title">❄️ Frozen Keys</div>
          <div class="stat-value" style="color: #f87171;" id="stat-frozen-keys">0</div>
        </div>
      </div>

      <!-- ➕ Create New License Key -->
      <div class="section-card">
        <div class="section-header">
          <div class="section-title"><span>➕ Create New License Key</span></div>
          <span style="font-size: 12px; color: var(--muted); font-family: var(--font-mono);">Template: HDJRZ-GUEST-xxxx-xxxx</span>
        </div>
        <div class="form-grid">
          <div class="form-group">
            <label>License Role</label>
            <select id="new-key-role">
              <option value="guest" selected>Guest / Agent (Staff)</option>
              <option value="admin">Master Admin</option>
            </select>
          </div>
          <div class="form-group">
            <label>Client / Agent Name</label>
            <input type="text" id="new-key-name" placeholder="e.g. Reynald Lantano">
          </div>
          <div>
            <button type="button" id="create-key-btn" class="btn btn-primary" style="height: 38px;">
              ⚡ Generate License Key
            </button>
          </div>
        </div>
      </div>

      <!-- 🔑 Issued License Keys Table -->
      <div class="section-card">
        <div class="section-header">
          <div class="section-title"><span>🔑 Issued License Keys</span></div>
          <div style="display: flex; gap: 8px;">
            <input type="text" id="search-keys" placeholder="Search by name or key..." style="background: #060c18; border: 1px solid #334155; border-radius: 4px; padding: 4px 10px; color: #fff; font-size: 12px;">
            <button type="button" id="refresh-keys-btn" class="btn btn-secondary btn-sm">🔄 Refresh</button>
          </div>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>License Key</th>
                <th>Role</th>
                <th>Agent / Client</th>
                <th>Device Binding</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="keys-tbody">
              <tr><td colspan="7" style="text-align: center; color: var(--muted); padding: 20px;">Loading licenses...</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 📋 Active Users Online -->
      <div class="section-card">
        <div class="section-header">
          <div class="section-title"><span>📋 Currently Active Staff (Real-time Pings)</span></div>
          <span style="font-size: 11px; color: #64748b;">Auto-refreshes every 15s</span>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Status</th>
                <th>Agent Name</th>
                <th>Script Version</th>
                <th>Last Active</th>
              </tr>
            </thead>
            <tbody id="active-users-tbody">
              <tr><td colspan="4" style="text-align: center; color: var(--muted); padding: 20px;">No agents active in the last 5 minutes.</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ⚙️ Master Password Change -->
      <div class="section-card" style="margin-bottom: 0;">
        <div class="section-header">
          <div class="section-title"><span>⚙️ Master Admin Password</span></div>
        </div>
        <div style="display: flex; gap: 12px; max-width: 450px;">
          <input type="password" id="new-master-pass" placeholder="Enter new master password" style="flex: 1; background: #060c18; border: 1px solid #334155; border-radius: 6px; padding: 8px 12px; color: #fff; font-size: 13px;">
          <button type="button" id="change-pass-btn" class="btn btn-secondary btn-sm">Update Password</button>
        </div>
      </div>
    </div>
  </div>

  <div id="toast" class="toast"></div>

  <script>
    let authToken = sessionStorage.getItem("hdjrz_admin_token") || "";

    const loginView = document.getElementById("login-view");
    const dashboardView = document.getElementById("dashboard-view");
    const adminPassInput = document.getElementById("admin-pass-input");
    const loginBtn = document.getElementById("login-btn");
    const logoutBtn = document.getElementById("logout-btn");
    const toast = document.getElementById("toast");

    function showToast(msg) {
      toast.textContent = msg;
      toast.style.display = "block";
      setTimeout(() => { toast.style.display = "none"; }, 3000);
    }

    async function apiRequest(path, method = "GET", body = null) {
      const headers = { "Content-Type": "application/json" };
      if (authToken) headers["Authorization"] = "Bearer " + authToken;
      const opts = { method, headers };
      if (body) opts.body = JSON.stringify(body);
      const res = await fetch(path, opts);
      return res.json();
    }

    async function doLogin() {
      const pass = adminPassInput.value.trim();
      if (!pass) return alert("Please enter master password.");
      loginBtn.disabled = true;
      loginBtn.textContent = "Verifying...";
      try {
        const res = await apiRequest("/api/auth/login", "POST", { password: pass });
        if (res.ok && res.token) {
          authToken = res.token;
          sessionStorage.setItem("hdjrz_admin_token", authToken);
          showDashboard();
        } else {
          alert("Wrong password. Default is hdjrzAdmin2026!");
        }
      } catch (err) {
        alert("Server connection error: " + err.message);
      } finally {
        loginBtn.disabled = false;
        loginBtn.textContent = "Unlock Portal 🚀";
      }
    }

    loginBtn.addEventListener("click", doLogin);
    adminPassInput.addEventListener("keydown", (e) => { if (e.key === "Enter") doLogin(); });
    logoutBtn.addEventListener("click", () => {
      authToken = "";
      sessionStorage.removeItem("hdjrz_admin_token");
      location.reload();
    });

    function showDashboard() {
      loginView.style.display = "none";
      dashboardView.style.display = "flex";
      loadLicenses();
      loadActiveUsers();
      setInterval(loadActiveUsers, 15000);
    }

    let currentLicenses = [];

    async function loadLicenses() {
      const res = await apiRequest("/api/licenses");
      if (!res.ok) {
        if (res.error === "unauthorized") {
          authToken = "";
          sessionStorage.removeItem("hdjrz_admin_token");
          location.reload();
        }
        return;
      }
      currentLicenses = res.licenses || [];
      renderLicensesTable(currentLicenses);
    }

    function renderLicensesTable(list) {
      const tbody = document.getElementById("keys-tbody");
      const search = (document.getElementById("search-keys").value || "").toLowerCase();
      const filtered = list.filter(l => 
        (l.key || "").toLowerCase().includes(search) || 
        (l.owner || "").toLowerCase().includes(search) ||
        (l.role || "").toLowerCase().includes(search)
      );

      let activeCount = 0;
      let frozenCount = 0;

      list.forEach(l => {
        if (l.active === false) frozenCount++;
        else activeCount++;
      });

      document.getElementById("stat-total-keys").textContent = list.length;
      document.getElementById("stat-active-keys").textContent = activeCount;
      document.getElementById("stat-frozen-keys").textContent = frozenCount;

      if (!filtered.length) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--muted); padding: 20px;">No licenses found.</td></tr>';
        return;
      }

      tbody.innerHTML = filtered.map(item => {
        const isFrozen = item.active === false;
        const isBound = !!item.deviceId;
        const boundDisplay = isBound 
          ? '<span style="color:#34d399; font-weight:600;">✓ Bound (' + escapeHtml(item.deviceId.slice(0, 10)) + '...)</span>'
          : '<span style="color:#94a3b8; font-style:italic;">Unbound (Open)</span>';

        const roleClass = item.role === "admin" ? "admin" : "guest";
        const statusBadge = isFrozen
          ? '<span class="badge-status frozen">Frozen</span>'
          : '<span class="badge-status active">Active</span>';

        const createdDate = item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '—';

        return '<tr>' +
          '<td><span class="key-tag">' + escapeHtml(item.key) + '</span></td>' +
          '<td><span class="badge-role ' + roleClass + '">' + escapeHtml(item.role || "guest") + '</span></td>' +
          '<td><strong>' + escapeHtml(item.owner || "—") + '</strong></td>' +
          '<td>' + boundDisplay + '</td>' +
          '<td>' + statusBadge + '</td>' +
          '<td>' + createdDate + '</td>' +
          '<td><div class="actions-cell">' +
            (isBound ? '<button type="button" class="btn btn-warning btn-sm" onclick="resetDevice(\\'' + escapeHtml(item.key) + '\\')">🔄 Reset Device</button>' : '') +
            '<button type="button" class="btn btn-secondary btn-sm" onclick="toggleFreeze(\\'' + escapeHtml(item.key) + '\\')">' + (isFrozen ? '🟢 Unfreeze' : '🚫 Freeze') + '</button>' +
            '<button type="button" class="btn btn-danger btn-sm" onclick="deleteKey(\\'' + escapeHtml(item.key) + '\\')">🗑️</button>' +
          '</div></td>' +
        '</tr>';
      }).join("");
    }

    document.getElementById("search-keys").addEventListener("input", () => renderLicensesTable(currentLicenses));
    document.getElementById("refresh-keys-btn").addEventListener("click", loadLicenses);

    // Create New Key
    document.getElementById("create-key-btn").addEventListener("click", async () => {
      const role = document.getElementById("new-key-role").value;
      const owner = document.getElementById("new-key-name").value.trim() || "Agent";
      const btn = document.getElementById("create-key-btn");
      btn.disabled = true;
      btn.textContent = "Generating...";
      try {
        const res = await apiRequest("/api/licenses/create", "POST", { role, owner });
        if (res.ok && res.key) {
          navigator.clipboard.writeText(res.key);
          showToast("✅ Generated & Copied to clipboard: " + res.key);
          document.getElementById("new-key-name").value = "";
          loadLicenses();
        } else {
          alert("Failed to create key: " + (res.error || "Unknown error"));
        }
      } catch (e) {
        alert("Error: " + e.message);
      } finally {
        btn.disabled = false;
        btn.textContent = "⚡ Generate License Key";
      }
    });

    // Reset Device Binding
    window.resetDevice = async function(key) {
      if (!confirm("Reset device binding for " + key + "?\\n\\nThis will allow the agent to log in from their new laptop / PC immediately.")) return;
      const res = await apiRequest("/api/licenses/reset-device", "POST", { key });
      if (res.ok) {
        showToast("✓ Device binding unlocked for " + key);
        loadLicenses();
      } else {
        alert("Failed to reset: " + res.error);
      }
    };

    // Toggle Freeze
    window.toggleFreeze = async function(key) {
      const res = await apiRequest("/api/licenses/toggle-freeze", "POST", { key });
      if (res.ok) {
        showToast(res.message);
        loadLicenses();
      } else {
        alert("Failed: " + res.error);
      }
    };

    // Delete Key
    window.deleteKey = async function(key) {
      if (!confirm("Are you sure you want to permanently delete license key " + key + "?")) return;
      const res = await apiRequest("/api/licenses/delete", "POST", { key });
      if (res.ok) {
        showToast("Deleted " + key);
        loadLicenses();
      } else {
        alert("Failed to delete: " + res.error);
      }
    };

    // Active Users
    async function loadActiveUsers() {
      const res = await apiRequest("/api/agents/active");
      if (!res.ok) return;
      const tbody = document.getElementById("active-users-tbody");
      const users = res.users || [];
      document.getElementById("stat-active-count").textContent = users.length;

      if (!users.length) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--muted); padding: 20px;">No agents active in the last 5 minutes.</td></tr>';
        return;
      }

      const now = Date.now();
      tbody.innerHTML = users.map(u => {
        const diffSec = Math.round((now - (u.lastSeen || now)) / 1000);
        const timeAgo = diffSec < 60 ? "Just now" : Math.round(diffSec / 60) + "m ago";
        return '<tr>' +
          '<td><span style="color: #34d399; font-weight:700;">🟢 Online</span></td>' +
          '<td><strong>' + escapeHtml(u.agent || "Agent") + '</strong></td>' +
          '<td><span style="font-family: var(--font-mono); color: #60a5fa;">v' + escapeHtml(u.version || "1.0.0") + '</span></td>' +
          '<td>' + timeAgo + '</td>' +
        '</tr>';
      }).join("");
    }

    // Change Master Password
    document.getElementById("change-pass-btn").addEventListener("click", async () => {
      const newPass = document.getElementById("new-master-pass").value.trim();
      if (!newPass) return alert("Enter a new password");
      if (!confirm("Change Master Admin Password? Make sure to remember the new password!")) return;
      const res = await apiRequest("/api/auth/change-password", "POST", { newPassword: newPass });
      if (res.ok) {
        alert("Master Admin Password updated successfully!");
        document.getElementById("new-master-pass").value = "";
      } else {
        alert("Error: " + res.error);
      }
    });

    function escapeHtml(s) {
      return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    }

    if (authToken) {
      showDashboard();
    }
  </script>
</body>
</html>`;
