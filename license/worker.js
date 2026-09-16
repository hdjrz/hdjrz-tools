/**
 * Paste this into Cloudflare: Workers → hdjrz-license → Edit code → Deploy.
 * Binding name must stay LICENSES.
 */

const DEFAULT_SYSTEM_CONFIG = {
  minRequiredVersion: "1.1.4",
  latestVersion: "1.1.8",
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
  const a = parseSemver(clientVer);
  const b = parseSemver(minVer);
  for (let i = 0; i < 3; i++) {
    if (a[i] < b[i]) return true;
    if (a[i] > b[i]) return false;
  }
  return false;
}

async function getSystemConfig(env) {
  try {
    const raw = await env.LICENSES.get("SYSTEM_CONFIG");
    if (raw) return { ...DEFAULT_SYSTEM_CONFIG, ...JSON.parse(raw) };
  } catch (e) {}
  return { ...DEFAULT_SYSTEM_CONFIG };
}

export default {
  async fetch(request, env) {
    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Content-Type": "application/json"
    };

    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: cors });
    }

    // Zero-cache Userscript endpoint for instant Tampermonkey updates
    if (request.method === "GET" && (url.pathname === "/script.user.js" || url.pathname === "/hdjrzTools.user.js")) {
      try {
        const headers = { "User-Agent": "Tampermonkey-Updater" };
        if (env.GITHUB_TOKEN) {
          headers["Authorization"] = `token ${env.GITHUB_TOKEN}`;
        }
        const ghUrl = `https://raw.githubusercontent.com/hdjrz/hdjrz-tools/main/hdjrzTools.user.js?ts=${Date.now()}`;
        const resp = await fetch(ghUrl, { headers });
        if (resp.ok) {
          const scriptText = await resp.text();
          return new Response(scriptText, {
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

    // Remote Templates & System Enforcement: GET endpoint
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
            latestVersion: sysConfig.latestVersion || "1.1.6",
            updateUrl: "https://hdjrz-license.rosechel05.workers.dev/script.user.js",
            message: `⚠️ Critical Update Required: Your version (v${clientVer}) is out of date. Update to v${sysConfig.latestVersion || "1.1.6"} to continue.`
          }), { headers: { ...cors, "Cache-Control": "no-cache, no-store" } });
        }

        const raw = await env.LICENSES.get("REMOTE_TEMPLATES");
        let tmplData = raw ? JSON.parse(raw) : null;
        if (!tmplData) {
          return new Response(JSON.stringify({ ok: false, error: "not_configured" }), { headers: cors });
        }

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

        // Register current ping if device ID or agent name provided
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

    // Remote Templates: POST endpoint for admin to publish live cloud templates
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

    // System Enforcement Config: GET endpoint
    if (request.method === "GET" && url.pathname === "/config/system") {
      const sysConfig = await getSystemConfig(env);
      return json({ ok: true, config: sysConfig }, cors);
    }

    // System Enforcement Config: POST endpoint (Admin only)
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

    if (request.method !== "POST") {
      return json({ ok: false, error: "missing" }, cors);
    }

    let body = {};
    try {
      body = await request.json();
    } catch (e) {}

    const key = String(body.key || "").trim();
    const device = String(body.deviceId || "").trim();
    const action = String(body.action || "").trim();
    const clientVer = String(body.version || "").trim();

    if (!key || !device) {
      return json({ ok: false, error: "missing" }, cors);
    }

    // Check emergency kill switch on license activation
    const sysConfig = await getSystemConfig(env);
    if (sysConfig.killSwitch) {
      return json({ ok: false, error: "kill_switch", message: sysConfig.killSwitchMessage }, cors);
    }
    if (clientVer && isVersionBelow(clientVer, sysConfig.minRequiredVersion)) {
      return json({
        ok: false,
        error: "outdated_version",
        message: `Version v${clientVer} is obsolete. Minimum required is v${sysConfig.minRequiredVersion}.`,
        minRequiredVersion: sysConfig.minRequiredVersion,
        latestVersion: sysConfig.latestVersion
      }, cors);
    }

    const raw = await env.LICENSES.get(key);
    if (!raw) {
      return json({ ok: false, error: "invalid" }, cors);
    }

    let row;
    try {
      row = JSON.parse(raw);
    } catch (e) {
      return json({ ok: false, error: "invalid" }, cors);
    }

    const used = String(row.deviceId || "").trim();
    const role = row.role === "admin" ? "admin" : "guest";

    if (action === "release") {
      if (used && used !== device) {
        return json({ ok: false, error: "already_used" }, cors);
      }
      await env.LICENSES.put(key, JSON.stringify({ role, deviceId: "" }));
      return json({ ok: true, role }, cors);
    }

    if (!used) {
      row.role = role;
      row.deviceId = device;
      row.usedAt = new Date().toISOString();
      await env.LICENSES.put(key, JSON.stringify(row));
      return json({ ok: true, role }, cors);
    }
    if (used === device) {
      return json({ ok: true, role }, cors);
    }
    return json({ ok: false, error: "already_used" }, cors);
  }
};

function json(obj, cors) {
  return new Response(JSON.stringify(obj), { headers: cors });
}
