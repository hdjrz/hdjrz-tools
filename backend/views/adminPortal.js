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
      white-space: nowrap;
      transition: all 0.15s;
    }
    .btn-primary { background: var(--primary); color: #fff; }
    .btn-primary:hover { background: var(--primary-hover); }
    .login-card .btn-primary { width: 100%; }
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
    .pipeline-stepper {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #060c18;
      border: 1px solid #1e293b;
      border-radius: 8px;
      padding: 12px 18px;
      margin-bottom: 16px;
      font-size: 12px;
      font-weight: 600;
    }
    .pipeline-step { display: flex; align-items: center; gap: 6px; color: var(--muted); }
    .pipeline-step.active { color: #60a5fa; }
    .pipeline-step.done { color: #34d399; }
    .pipeline-arrow { color: #334155; font-size: 14px; }
    .diff-badge { font-size: 11px; font-weight: 700; padding: 2px 6px; border-radius: 4px; }
    .diff-badge.add { background: rgba(16, 185, 129, 0.2); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.4); }
    .diff-badge.mod { background: rgba(245, 158, 11, 0.2); color: #fde047; border: 1px solid rgba(245, 158, 11, 0.4); }
    .diff-badge.del { background: rgba(239, 68, 68, 0.2); color: #fca5a5; border: 1px solid rgba(239, 68, 68, 0.4); }
    .preview-pill-dock {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      padding: 14px;
      background: #060c18;
      border: 1px solid #1e293b;
      border-radius: 8px;
      margin-top: 10px;
    }
    .preview-pill {
      font-size: 11px;
      font-weight: 700;
      padding: 5px 10px;
      border-radius: 6px;
      border: 1px solid;
      display: flex;
      align-items: center;
      gap: 5px;
      letter-spacing: 0.3px;
    }
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(4, 9, 20, 0.85);
      backdrop-filter: blur(6px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 99999;
      padding: 20px;
    }
    .modal-card {
      background: #091120;
      border: 1px solid #1e293b;
      border-radius: 12px;
      padding: 24px;
      width: 100%;
      max-width: 520px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
    }
    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 18px;
      padding-bottom: 12px;
      border-bottom: 1px solid #1e293b;
    }
    .val-checklist {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .val-checklist-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 14px;
      border-radius: 6px;
      background: #060c18;
      border: 1px solid #1e293b;
      font-size: 13px;
      font-weight: 600;
    }
    .val-checklist-item.passed {
      color: #34d399;
      border-color: rgba(16, 185, 129, 0.3);
      background: rgba(16, 185, 129, 0.05);
    }
    .val-checklist-item.failed {
      color: #fca5a5;
      border-color: rgba(239, 68, 68, 0.3);
      background: rgba(239, 68, 68, 0.08);
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
        <div class="stat-card">
          <div class="stat-title">📚 Escalations</div>
          <div class="stat-value" style="color: #60a5fa;" id="stat-escalations-count">14 Active</div>
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

      <!-- 🚀 Template Deployment Pipeline (Draft → Validate → Preview → Publish) -->
      <div class="section-card">
        <div class="section-header">
          <div class="section-title"><span>🚀 Template Deployment Pipeline</span></div>
          <div style="font-size: 12px; font-family: var(--font-mono);">
            <span style="color: var(--muted);">Live Production:</span>
            <span id="pipeline-prod-badge" style="color: #34d399; font-weight: 700;">v0 (0 buttons)</span>
          </div>
        </div>

        <!-- Visual Workflow Stepper -->
        <div class="pipeline-stepper">
          <div class="pipeline-step active" id="step-draft"><span>1️⃣ Admin Edits (Draft)</span></div>
          <div class="pipeline-arrow">➔</div>
          <div class="pipeline-step" id="step-validate"><span>2️⃣ Automated Validation</span></div>
          <div class="pipeline-arrow">➔</div>
          <div class="pipeline-step" id="step-preview"><span>3️⃣ Visual Preview & Diff</span></div>
          <div class="pipeline-arrow">➔</div>
          <div class="pipeline-step" id="step-publish"><span>4️⃣ Production Release (vN+1)</span></div>
        </div>

        <!-- Action Toolbar -->
        <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px; align-items: center; justify-content: space-between;">
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            <button type="button" id="pipeline-load-esc-btn" class="btn btn-secondary btn-sm">📥 Load from Escalation Library</button>
            <button type="button" id="pipeline-validate-btn" class="btn btn-secondary btn-sm">🔍 Validate Draft</button>
            <button type="button" id="pipeline-preview-btn" class="btn btn-secondary btn-sm">👁️ Preview & Diff</button>
            <button type="button" id="pipeline-discard-btn" class="btn btn-danger btn-sm">↺ Discard Draft</button>
          </div>
          <div>
            <button type="button" id="pipeline-publish-btn" class="btn btn-primary btn-sm" style="background: #10b981; border: 1px solid #059669;" disabled>
              🚀 Publish Draft to Production
            </button>
          </div>
        </div>

        <!-- Status & Validation Report Box -->
        <div id="pipeline-status-box" style="background: #091120; border: 1px solid #1e293b; border-radius: 8px; padding: 12px 16px; margin-bottom: 14px;">
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span id="pipeline-val-badge" class="badge-status active">🟢 Validated</span>
              <span id="pipeline-status-msg" style="font-size: 12.5px; color: #cbd5e1;">Draft is currently synchronized with production.</span>
            </div>
            <span id="pipeline-draft-meta" style="font-size: 11px; color: var(--muted); font-family: var(--font-mono);"></span>
          </div>
          <div id="pipeline-val-issues" style="margin-top: 10px; display: none; font-size: 12px;"></div>
        </div>

        <!-- Production Diff Breakdown -->
        <div id="pipeline-diff-box" style="background: #060c18; border: 1px solid #1e293b; border-radius: 8px; padding: 12px 16px; margin-bottom: 14px;">
          <div style="font-size: 12px; font-weight: 700; color: #94a3b8; text-transform: uppercase; margin-bottom: 8px;">
            📊 Changes vs Live Production
          </div>
          <div id="pipeline-diff-summary" style="display: flex; gap: 16px; font-size: 12.5px; flex-wrap: wrap;">
            <div><span class="diff-badge add" id="diff-add-badge">+ 0</span> <span style="color: var(--muted);">Added</span></div>
            <div><span class="diff-badge mod" id="diff-mod-badge">~ 0</span> <span style="color: var(--muted);">Modified</span></div>
            <div><span class="diff-badge del" id="diff-del-badge">- 0</span> <span style="color: var(--muted);">Removed</span></div>
            <div><span style="color: #60a5fa; font-weight:700;" id="pipeline-unchanged-count">0</span> <span style="color: var(--muted);">Unchanged</span></div>
          </div>
          <div id="pipeline-diff-details" style="margin-top: 8px; font-size: 11.5px; color: #cbd5e1;"></div>
        </div>

        <!-- Button Visual Preview Strip -->
        <div style="margin-top: 14px;">
          <div style="font-size: 12px; font-weight: 700; color: #94a3b8; text-transform: uppercase; margin-bottom: 6px;">
            🎨 Live Button Dock Preview (<span id="pipeline-preview-count">0</span> buttons)
          </div>
          <div class="preview-pill-dock" id="pipeline-button-dock">
            <span style="color: var(--muted); font-size: 12px;">No draft buttons to preview.</span>
          </div>
        </div>
      </div>

      <!-- 📚 Escalation Library (14 Definitions) -->
      <div class="section-card">
        <div class="section-header">
          <div class="section-title"><span>📚 Escalation Library (<span id="escalation-total-count">14</span> Definitions)</span></div>
          <div style="display: flex; gap: 8px; align-items: center;">
            <select id="filter-escalation-status" style="background: #060c18; border: 1px solid #334155; border-radius: 4px; padding: 4px 10px; color: #fff; font-size: 12px;">
              <option value="all">All Statuses</option>
              <option value="active" selected>Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
            <button type="button" id="reset-escalations-btn" class="btn btn-warning btn-sm">↺ Restore 14 Factory Presets</button>
            <button type="button" id="refresh-escalations-btn" class="btn btn-secondary btn-sm">🔄 Refresh</button>
          </div>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th style="width: 40px;">#</th>
                <th style="width: 130px;">Code</th>
                <th style="width: 140px;">Button Label</th>
                <th style="width: 160px;">Category / Group</th>
                <th>Meaning & Description</th>
                <th style="width: 100px;">Status</th>
                <th style="width: 140px;">Actions</th>
              </tr>
            </thead>
            <tbody id="escalations-tbody">
              <tr><td colspan="7" style="text-align: center; color: var(--muted); padding: 20px;">Loading escalation library...</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 🚀 Release Channels & Fleet Rollout -->
      <div class="section-card">
        <div class="section-header">
          <div class="section-title"><span>🚀 Release Channels &amp; Fleet Rollout</span></div>
          <span style="font-size: 11px; color: var(--muted);">Staged rollouts: Test updates on Admin devices first before releasing to Agents</span>
        </div>
        <div class="form-grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));">
          <div class="form-group">
            <label style="display: flex; align-items: center; gap: 5px;">
              <span>👑 Admin Channel Version</span>
              <span style="font-size: 10px; color: #60a5fa;">(Early Access)</span>
            </label>
            <input type="text" id="channel-admin-version" placeholder="e.g. 1.5.0">
          </div>
          <div class="form-group">
            <label style="display: flex; align-items: center; gap: 5px;">
              <span>🛡️ Agent Fleet Version</span>
              <span style="font-size: 10px; color: #34d399;">(Production)</span>
            </label>
            <input type="text" id="channel-agent-version" placeholder="e.g. 1.4.5">
          </div>
          <div class="form-group">
            <label style="display: flex; align-items: center; gap: 5px;">
              <span>⚠️ Min Enforced Version</span>
              <span style="font-size: 10px; color: #f87171;">(Mandatory)</span>
            </label>
            <input type="text" id="channel-min-version" placeholder="e.g. 1.1.4">
          </div>
          <div class="form-group">
            <label style="display: flex; align-items: center; gap: 5px;">
              <span>🔊 Fleet Success Sound</span>
              <span style="font-size: 10px; color: #38bdf8;">(Staff Fleet)</span>
            </label>
            <select id="channel-fleet-sound" style="width: 100%; background: #060c18; border: 1px solid #334155; border-radius: 6px; padding: 8px 12px; color: #fff; font-size: 13px;">
              <option value="voice">🔊 Voice Shoutout ("Arigathanks")</option>
              <option value="chime">🔔 Melodic Bell Chime (Standard)</option>
            </select>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 10px; margin-top: 14px; flex-wrap: wrap;">
          <button type="button" id="save-channels-btn" class="btn btn-secondary" style="height: 38px; padding: 0 18px; font-size: 13px; font-weight: 600; white-space: nowrap;">
            💾 Save Channels
          </button>
          <button type="button" id="promote-channel-btn" class="btn btn-primary" style="height: 38px; width: auto; padding: 0 18px; background: #10b981; border: 1px solid #059669; font-size: 13px; font-weight: 600; white-space: nowrap;" title="Instantly promote the Admin Channel version to all Agents">
            🚀 Promote to Fleet
          </button>
        </div>
        <div id="channel-status-banner" style="margin-top: 12px; padding: 10px 14px; background: #060c18; border: 1px solid #1e293b; border-radius: 6px; font-size: 12px; display: flex; align-items: center; justify-content: space-between;">
          <span id="channel-status-text" style="color: #cbd5e1;">Loading release channels...</span>
          <span id="channel-status-badge" class="badge-status active">Synchronized</span>
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

  <!-- Pre-Publish Validation Modal (Phase 12) -->
  <div id="validation-modal" class="modal-overlay" style="display:none;">
    <div class="modal-card">
      <div class="modal-header">
        <div>
          <h2 style="font-size: 16px; font-weight: 800; color: #fff; letter-spacing: 0.5px;">VALIDATION</h2>
          <div style="font-size: 12px; color: var(--muted); margin-top: 2px;">Pre-publishing system & schema verification</div>
        </div>
        <span id="val-modal-ver-target" class="key-tag" style="background: rgba(16, 185, 129, 0.15); color: #34d399; border-color: rgba(16, 185, 129, 0.4);">
          Publish v1
        </span>
      </div>

      <div class="val-checklist" id="val-checklist-items">
        <!-- 8 checks dynamically rendered with ✓ or ✗ -->
      </div>

      <div id="val-modal-error-box" style="margin-top: 14px; padding: 10px 14px; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 6px; font-size: 12px; color: #fca5a5; display: none;"></div>

      <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; padding-top: 14px; border-top: 1px solid #1e293b;">
        <button type="button" id="val-modal-cancel-btn" class="btn btn-secondary btn-sm" style="padding: 8px 18px; font-size: 13px;">Cancel</button>
        <button type="button" id="val-modal-publish-btn" class="btn btn-primary btn-sm" style="background: #10b981; border: 1px solid #059669; padding: 8px 18px; font-size: 13px;">
          Publish v1
        </button>
      </div>
    </div>
  </div>

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
      loadEscalations();
      loadPipelineStatus();
      loadReleaseChannels();
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

    // Escalation Library Management
    let currentEscalations = [];

    async function loadEscalations() {
      const filterElem = document.getElementById("filter-escalation-status");
      const filter = filterElem ? filterElem.value : "all";
      const queryParam = filter === "all" ? "" : ("?status=" + encodeURIComponent(filter));
      const res = await apiRequest("/api/escalations" + queryParam);
      if (!res.ok) return;

      currentEscalations = res.escalations || [];
      const total = typeof res.total === "number" ? res.total : currentEscalations.length;
      const countElem = document.getElementById("escalation-total-count");
      if (countElem) countElem.textContent = total;

      const activeCount = currentEscalations.filter(e => e.status !== "inactive").length;
      const statElem = document.getElementById("stat-escalations-count");
      if (statElem) statElem.textContent = activeCount + " Active";

      renderEscalationsTable(currentEscalations);
    }

    function renderEscalationsTable(list) {
      const tbody = document.getElementById("escalations-tbody");
      if (!tbody) return;
      if (!list.length) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--muted); padding: 20px;">No escalations found.</td></tr>';
        return;
      }

      tbody.innerHTML = list.map((item, idx) => {
        const isActive = item.status !== "inactive";
        const statusBadge = isActive
          ? '<span class="badge-status active">🟢 Active</span>'
          : '<span class="badge-status frozen">⚪ Inactive</span>';
        const color = item.color || "#2563eb";
        const orderNum = item.order || (idx + 1);

        return '<tr>' +
          '<td style="color: var(--muted); font-weight:600;">' + orderNum + '</td>' +
          '<td><span class="key-tag" style="background: ' + color + '22; border-color: ' + color + '66; color: ' + color + ';">' + escapeHtml(item.code) + '</span></td>' +
          '<td><strong>' + escapeHtml(item.label) + '</strong></td>' +
          '<td><span class="badge-role guest">' + escapeHtml(item.group || "General") + '</span></td>' +
          '<td><div style="font-weight:600; color:#cbd5e1;">' + escapeHtml(item.meaning || "") + '</div><div style="font-size:11px; color:var(--muted);">' + escapeHtml(item.description || "") + '</div></td>' +
          '<td>' + statusBadge + '</td>' +
          '<td><div class="actions-cell">' +
            '<button type="button" class="btn ' + (isActive ? 'btn-secondary' : 'btn-primary') + ' btn-sm" onclick="toggleEscalationStatus(\\'' + escapeHtml(item.code) + '\\')">' +
              (isActive ? '🚫 Deactivate' : '🟢 Activate') +
            '</button>' +
          '</div></td>' +
        '</tr>';
      }).join("");
    }

    window.toggleEscalationStatus = async function(code) {
      const res = await apiRequest("/api/escalations/" + encodeURIComponent(code) + "/toggle-status", "POST");
      if (res.ok) {
        showToast("✓ " + (res.message || "Escalation status updated"));
        loadEscalations();
      } else {
        alert("Failed to toggle status: " + (res.error || "Unknown error"));
      }
    };

    const resetEscBtn = document.getElementById("reset-escalations-btn");
    if (resetEscBtn) {
      resetEscBtn.addEventListener("click", async () => {
        if (!confirm("Restore all 14 factory escalation presets to Active status?\\n\\nThis will reset any customized templates to factory defaults.")) return;
        const res = await apiRequest("/api/escalations/reset-factory", "POST");
        if (res.ok) {
          showToast("✓ Restored " + (res.count || 14) + " factory escalations");
          loadEscalations();
        } else {
          alert("Failed to restore factory escalations: " + (res.error || "Unknown error"));
        }
      });
    }

    const refreshEscBtn = document.getElementById("refresh-escalations-btn");
    if (refreshEscBtn) refreshEscBtn.addEventListener("click", loadEscalations);

    // Template Deployment Pipeline (Draft → Validate → Preview → Publish)
    let currentPipelineData = null;

    async function loadPipelineStatus() {
      const res = await apiRequest("/api/templates/preview");
      if (!res.ok) return;
      currentPipelineData = res;

      const prod = res.production || { version: 0, count: 0 };
      const draft = res.draft || { status: "clean", count: 0, validated: false };
      const diff = res.diff || { added: [], modified: [], removed: [], unchangedCount: 0 };
      const options = res.options || [];

      // Update Production Badge
      document.getElementById("pipeline-prod-badge").textContent = "v" + prod.version + " (" + prod.count + " buttons)";

      // Update Stepper state
      const stepDraft = document.getElementById("step-draft");
      const stepVal = document.getElementById("step-validate");
      const stepPrev = document.getElementById("step-preview");
      const stepPub = document.getElementById("step-publish");

      if (stepDraft) stepDraft.className = "pipeline-step " + (draft.status === "draft" ? "active" : "done");
      if (stepVal) stepVal.className = "pipeline-step " + (draft.validated ? "done" : (draft.status === "draft" ? "active" : ""));
      if (stepPrev) stepPrev.className = "pipeline-step " + (diff.hasChanges ? "active" : "");
      if (stepPub) stepPub.className = "pipeline-step " + (draft.status === "published" ? "done" : "");

      // Update Validation Box
      const valBadge = document.getElementById("pipeline-val-badge");
      const statusMsg = document.getElementById("pipeline-status-msg");
      const draftMeta = document.getElementById("pipeline-draft-meta");
      const issuesBox = document.getElementById("pipeline-val-issues");
      const pubBtn = document.getElementById("pipeline-publish-btn");

      if (draft.validated) {
        valBadge.className = "badge-status active";
        valBadge.textContent = "🟢 Validated & Ready";
        statusMsg.textContent = diff.hasChanges 
          ? "Draft has verified changes ready for deployment (" + draft.count + " buttons)." 
          : "Draft is clean and synchronized with live production.";
        issuesBox.style.display = "none";
        pubBtn.disabled = !diff.hasChanges;
      } else {
        valBadge.className = "badge-status frozen";
        valBadge.textContent = "🔴 Validation Issues";
        statusMsg.textContent = "Draft has issues that must be resolved before publishing.";
        issuesBox.style.display = "block";
        issuesBox.innerHTML = (draft.validationErrors || []).map(e => '<div style="color:#fca5a5; margin-top:3px;">• ' + escapeHtml(e) + '</div>').join("");
        pubBtn.disabled = true;
      }

      if (draft.updatedAt) {
        draftMeta.textContent = "Draft updated: " + new Date(draft.updatedAt).toLocaleTimeString();
      } else {
        draftMeta.textContent = "";
      }

      // Update Diff Summary
      document.getElementById("diff-add-badge").textContent = "+ " + diff.added.length;
      document.getElementById("diff-mod-badge").textContent = "~ " + diff.modified.length;
      document.getElementById("diff-del-badge").textContent = "- " + diff.removed.length;
      document.getElementById("pipeline-unchanged-count").textContent = diff.unchangedCount;

      const diffDetails = document.getElementById("pipeline-diff-details");
      let detailsHtml = "";
      if (diff.added.length > 0) {
        detailsHtml += '<div style="color:#34d399; margin-bottom:4px;"><strong>Added:</strong> ' + diff.added.map(a => escapeHtml(a.code)).join(", ") + '</div>';
      }
      if (diff.modified.length > 0) {
        detailsHtml += '<div style="color:#fde047; margin-bottom:4px;"><strong>Modified:</strong> ' + diff.modified.map(m => escapeHtml(m.code + ' (' + m.changes.join(", ") + ')')).join("; ") + '</div>';
      }
      if (diff.removed.length > 0) {
        detailsHtml += '<div style="color:#fca5a5; margin-bottom:4px;"><strong>Removed:</strong> ' + diff.removed.map(r => escapeHtml(r.code)).join(", ") + '</div>';
      }
      if (!diff.hasChanges) {
        detailsHtml = '<span style="color:var(--muted); font-style:italic;">No pending changes between draft and production.</span>';
      }
      diffDetails.innerHTML = detailsHtml;

      // Update Button Preview Dock
      document.getElementById("pipeline-preview-count").textContent = options.length;
      const dock = document.getElementById("pipeline-button-dock");
      if (!options.length) {
        dock.innerHTML = '<span style="color: var(--muted); font-size: 12px;">No draft buttons to preview.</span>';
      } else {
        dock.innerHTML = options.map(opt => {
          const col = opt.color || "#2563eb";
          return '<div class="preview-pill" style="background: ' + col + '22; border-color: ' + col + '66; color: ' + col + ';">' +
            '<span style="opacity:0.7; font-size:10px;">[' + escapeHtml(opt.group || "General") + ']</span> ' +
            '<span>' + escapeHtml(opt.label || opt.code) + '</span>' +
          '</div>';
        }).join("");
      }
    }

    // Load active escalations into draft
    const loadEscToDraftBtn = document.getElementById("pipeline-load-esc-btn");
    if (loadEscToDraftBtn) {
      loadEscToDraftBtn.addEventListener("click", async () => {
        if (!confirm("Load all active escalations from Escalation Library into the Draft pipeline?")) return;
        loadEscToDraftBtn.disabled = true;
        try {
          const escRes = await apiRequest("/api/escalations?status=active");
          if (!escRes.ok || !escRes.escalations) throw new Error(escRes.error || "Failed loading escalations");
          
          const draftRes = await apiRequest("/api/templates/draft", "POST", {
            options: escRes.escalations,
            notes: "Imported from Escalation Library"
          });
          if (draftRes.ok) {
            showToast("✓ Imported " + escRes.escalations.length + " escalations into Draft");
            loadPipelineStatus();
          } else {
            alert("Failed saving draft: " + draftRes.error);
          }
        } catch (err) {
          alert("Error: " + err.message);
        } finally {
          loadEscToDraftBtn.disabled = false;
        }
      });
    }

    // Validate Draft
    const validateBtn = document.getElementById("pipeline-validate-btn");
    if (validateBtn) {
      validateBtn.addEventListener("click", async () => {
        const res = await apiRequest("/api/templates/draft/validate", "POST", {});
        if (res.ok) {
          if (res.valid) {
            showToast("✓ Draft passed all automated validation checks!");
          } else {
            alert("Validation failed with " + res.errors.length + " errors:\\n" + res.errors.join("\\n"));
          }
          loadPipelineStatus();
        } else {
          alert("Error: " + res.error);
        }
      });
    }

    // Preview & Diff
    const previewBtn = document.getElementById("pipeline-preview-btn");
    if (previewBtn) {
      previewBtn.addEventListener("click", () => {
        loadPipelineStatus();
        showToast("✓ Visual preview & diff refreshed");
      });
    }

    // Discard Draft
    const discardBtn = document.getElementById("pipeline-discard-btn");
    if (discardBtn) {
      discardBtn.addEventListener("click", async () => {
        if (!confirm("Discard all draft modifications and revert back to live production?\\n\\nAny un-published draft changes will be lost.")) return;
        const res = await apiRequest("/api/templates/draft/discard", "POST");
        if (res.ok) {
          showToast("✓ Draft discarded and reset to production");
          loadPipelineStatus();
        } else {
          alert("Error: " + res.error);
        }
      });
    }

    // Pre-Publish Validation Modal (Phase 12)
    const valModal = document.getElementById("validation-modal");
    const valModalCancelBtn = document.getElementById("val-modal-cancel-btn");
    const valModalPublishBtn = document.getElementById("val-modal-publish-btn");
    const valChecklistItems = document.getElementById("val-checklist-items");
    const valModalErrorBox = document.getElementById("val-modal-error-box");
    const valModalVerTarget = document.getElementById("val-modal-ver-target");

    function closeValidationModal() {
      if (valModal) valModal.style.display = "none";
    }

    if (valModalCancelBtn) {
      valModalCancelBtn.addEventListener("click", closeValidationModal);
    }

    async function openValidationModal() {
      if (!valModal) return;
      const targetVer = ((currentPipelineData && currentPipelineData.production && currentPipelineData.production.version) || 0) + 1;
      valModalVerTarget.textContent = "v" + targetVer + " Candidate";
      valModalPublishBtn.textContent = "Publish v" + targetVer;
      valModalPublishBtn.disabled = true;

      valChecklistItems.innerHTML = '<div style="color:var(--muted); text-align:center; padding:12px;">Running 8-point pre-publish verification...</div>';
      valModalErrorBox.style.display = "none";
      valModal.style.display = "flex";

      try {
        const res = await apiRequest("/api/templates/draft/validate", "POST", {});
        if (!res.ok) throw new Error(res.error || "Validation request failed");

        const checks = res.checks || [];
        valChecklistItems.innerHTML = checks.map(c => {
          const isPassed = c.passed === true;
          return '<div class="val-checklist-item ' + (isPassed ? 'passed' : 'failed') + '">' +
            '<span>' + (isPassed ? '✓ ' : '✗ ') + escapeHtml(c.label) + '</span>' +
            '<span style="font-size:11px; opacity:0.85;">' + (isPassed ? 'Verified' : 'Failed') + '</span>' +
          '</div>';
        }).join("");

        if (res.valid) {
          valModalPublishBtn.disabled = false;
          valModalErrorBox.style.display = "none";
        } else {
          valModalPublishBtn.disabled = true;
          valModalErrorBox.style.display = "block";
          valModalErrorBox.innerHTML = '<strong>Validation Blocking Release:</strong><br>' +
            (res.errors || []).map(e => '• ' + escapeHtml(e)).join("<br>");
        }
      } catch (err) {
        valChecklistItems.innerHTML = '<div style="color:#fca5a5; padding:10px;">Error running validation: ' + escapeHtml(err.message) + '</div>';
        valModalPublishBtn.disabled = true;
      }
    }

    const publishBtn = document.getElementById("pipeline-publish-btn");
    if (publishBtn) {
      publishBtn.addEventListener("click", openValidationModal);
    }

    if (valModalPublishBtn) {
      valModalPublishBtn.addEventListener("click", async () => {
        const targetVer = ((currentPipelineData && currentPipelineData.production && currentPipelineData.production.version) || 0) + 1;
        valModalPublishBtn.disabled = true;
        valModalPublishBtn.textContent = "Publishing v" + targetVer + "...";

        try {
          const res = await apiRequest("/api/templates/draft/publish", "POST");
          if (res.ok) {
            closeValidationModal();
            showToast("🚀 Successfully published v" + res.version + " to production!");
            loadPipelineStatus();
          } else {
            alert("Publish failed: " + (res.error || "Unknown error"));
          }
        } catch (err) {
          alert("Error: " + err.message);
        } finally {
          valModalPublishBtn.disabled = false;
          valModalPublishBtn.textContent = "Publish v" + targetVer;
        }
      });
    }

    // Release Channels & Fleet Rollout
    async function loadReleaseChannels() {
      try {
        const res = await apiRequest("/api/system/config");
        if (res.ok && res.config) {
          const c = res.config;
          const adminV = c.adminLatestVersion || c.latestVersion || "1.4.5";
          const agentV = c.agentLatestVersion || c.latestVersion || "1.4.5";
          const minV = c.minRequiredVersion || "1.1.4";

          document.getElementById("channel-admin-version").value = adminV;
          document.getElementById("channel-agent-version").value = agentV;
          document.getElementById("channel-min-version").value = minV;

          const soundVal = c.fleetSuccessSound || "voice";
          const soundEl = document.getElementById("channel-fleet-sound");
          if (soundEl) soundEl.value = soundVal;

          const isStaged = adminV !== agentV;
          const banner = document.getElementById("channel-status-text");
          const badge = document.getElementById("channel-status-badge");
          if (isStaged) {
            banner.innerHTML = "👑 <strong>Staged Early Access:</strong> Admins are on <strong>v" + escapeHtml(adminV) + "</strong> while Agents remain on stable <strong>v" + escapeHtml(agentV) + "</strong>.";
            badge.className = "badge-status frozen";
            badge.textContent = "Staged Testing";
          } else {
            banner.innerHTML = "🟢 <strong>Fleet Aligned:</strong> All Admins &amp; Agents are on <strong>v" + escapeHtml(agentV) + "</strong>.";
            badge.className = "badge-status active";
            badge.textContent = "Fleet Aligned";
          }
        }
      } catch (err) {
        console.error("Failed to load release channels", err);
      }
    }

    document.getElementById("save-channels-btn").addEventListener("click", async () => {
      const adminV = document.getElementById("channel-admin-version").value.trim();
      const agentV = document.getElementById("channel-agent-version").value.trim();
      const minV = document.getElementById("channel-min-version").value.trim();
      const fleetSound = (document.getElementById("channel-fleet-sound") && document.getElementById("channel-fleet-sound").value) || "voice";
      if (!adminV || !agentV || !minV) return alert("Please fill in all version fields.");

      const btn = document.getElementById("save-channels-btn");
      btn.disabled = true;
      btn.textContent = "Saving...";
      try {
        const res = await apiRequest("/api/system/config", "POST", {
          adminLatestVersion: adminV,
          agentLatestVersion: agentV,
          latestVersion: agentV,
          minRequiredVersion: minV,
          fleetSuccessSound: fleetSound
        });
        if (res.ok) {
          showToast("💾 Release channels saved successfully!");
          loadReleaseChannels();
        } else {
          alert("Error: " + (res.error || "Failed to update"));
        }
      } catch (err) {
        alert("Error: " + err.message);
      } finally {
        btn.disabled = false;
        btn.textContent = "💾 Save Channels";
      }
    });

    document.getElementById("promote-channel-btn").addEventListener("click", async () => {
      const adminV = document.getElementById("channel-admin-version").value.trim();
      if (!confirm("Are you sure you want to promote Admin version v" + adminV + " to all staff agents?")) return;

      const btn = document.getElementById("promote-channel-btn");
      btn.disabled = true;
      btn.textContent = "Promoting...";
      try {
        const res = await apiRequest("/api/system/promote-channel", "POST");
        if (res.ok) {
          showToast("🚀 v" + adminV + " successfully released to all staff agents!");
          loadReleaseChannels();
        } else {
          alert("Error: " + (res.error || "Failed to promote channel"));
        }
      } catch (err) {
        alert("Error: " + err.message);
      } finally {
        btn.disabled = false;
        btn.textContent = "🚀 Promote to Fleet";
      }
    });

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
