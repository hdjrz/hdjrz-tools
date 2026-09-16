/**
 * Paste this into Cloudflare: Workers → hdjrz-license → Edit code → Deploy.
 * Binding name must stay LICENSES.
 */
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
    if (!key || !device) {
      return json({ ok: false, error: "missing" }, cors);
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
