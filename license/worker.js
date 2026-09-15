/**
 * Paste this into Cloudflare: Workers → hdjrz-license → Edit code → Deploy.
 * Binding name must stay LICENSES.
 */
export default {
  async fetch(request, env) {
    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Content-Type": "application/json"
    };
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: cors });
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
