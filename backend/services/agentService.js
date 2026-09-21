/**
 * Agent Activity & Telemetry Service
 */

const ACTIVE_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Record an agent presence heartbeat
 */
export async function recordAgentHeartbeat(env, { agent = "Agent", version = "1.0.0", devId = "", key = "" } = {}) {
  let activeMap = {};
  try {
    const raw = await env.LICENSES.get("ACTIVE_AGENTS");
    if (raw) activeMap = JSON.parse(raw);
  } catch (e) {}

  const now = Date.now();

  // Prune agents inactive for > 5 minutes
  for (const k in activeMap) {
    if (!activeMap[k] || (now - (activeMap[k].lastSeen || 0)) > ACTIVE_TIMEOUT_MS) {
      delete activeMap[k];
    }
  }

  const id = devId || (key ? "key_" + key : "agent_" + agent);
  activeMap[id] = {
    agent: agent || "Agent",
    version: version || "1.0.0",
    lastSeen: now,
    devId: devId || "",
    key: key || ""
  };

  try {
    await env.LICENSES.put("ACTIVE_AGENTS", JSON.stringify(activeMap));
  } catch (e) {}

  // 1. Persist persistent device to agent mapping so names persist across reboots / offline
  if (devId && agent && agent !== "Agent") {
    try {
      let devMap = {};
      const rawDev = await env.LICENSES.get("DEVICE_AGENTS");
      if (rawDev) devMap = JSON.parse(rawDev);
      devMap[devId] = agent;
      await env.LICENSES.put("DEVICE_AGENTS", JSON.stringify(devMap));
    } catch (e) {}
  }

  // 2. If key is provided and agent name is known, update the license record directly in KV!
  if (key && agent && agent !== "Agent") {
    try {
      const rawLic = await env.LICENSES.get(key);
      if (rawLic) {
        let licData = JSON.parse(rawLic);
        if (typeof licData === "object" && licData !== null) {
          if (licData.owner !== agent || (devId && !licData.deviceId)) {
            licData.owner = agent;
            if (devId) licData.deviceId = devId;
            licData.lastSeen = now;
            await env.LICENSES.put(key, JSON.stringify(licData));
          }
        }
      }
    } catch (e) {}
  }

  return Object.values(activeMap);
}

/**
 * Retrieve active online agents
 */
export async function getActiveAgents(env) {
  let activeMap = {};
  try {
    const raw = await env.LICENSES.get("ACTIVE_AGENTS");
    if (raw) activeMap = JSON.parse(raw);
  } catch (e) {}

  const now = Date.now();
  let modified = false;

  for (const k in activeMap) {
    if (!activeMap[k] || (now - (activeMap[k].lastSeen || 0)) > ACTIVE_TIMEOUT_MS) {
      delete activeMap[k];
      modified = true;
    }
  }

  if (modified) {
    try {
      await env.LICENSES.put("ACTIVE_AGENTS", JSON.stringify(activeMap));
    } catch (e) {}
  }

  return Object.values(activeMap).map(a => ({
    agent: a.agent || "Agent",
    version: a.version || "1.0.0",
    lastSeen: a.lastSeen || now,
    devId: a.devId || "",
    online: true
  }));
}

/**
 * Retrieve comprehensive roster of active and known fleet agents with latest ticket info
 */
export async function getAgentRoster(env) {
  const activeUsers = await getActiveAgents(env);
  const now = Date.now();
  const agentMap = new Map();

  // 1. Seed with active agents
  for (const u of activeUsers) {
    const key = (u.agent || "Agent").trim().toLowerCase();
    agentMap.set(key, {
      agent: u.agent || "Agent",
      version: u.version || "1.0.0",
      lastSeen: u.lastSeen || now,
      devId: u.devId || "",
      online: true,
      latestTicketId: null,
      latestTicketStatus: null,
      latestTicketUpdatedAt: null
    });
  }

  // 2. Fetch known agents from DEVICE_AGENTS
  try {
    const rawDev = await env.LICENSES.get("DEVICE_AGENTS");
    if (rawDev) {
      const devObj = JSON.parse(rawDev);
      for (const devId in devObj) {
        const name = String(devObj[devId] || "").trim();
        if (name && name !== "Agent") {
          const key = name.toLowerCase();
          if (!agentMap.has(key)) {
            agentMap.set(key, {
              agent: name,
              version: "1.0.0",
              lastSeen: null,
              devId: devId,
              online: false,
              latestTicketId: null,
              latestTicketStatus: null,
              latestTicketUpdatedAt: null
            });
          }
        }
      }
    }
  } catch (_) {}

  // 3. Fetch known owners from issued licenses
  try {
    const list = await env.LICENSES.list({ limit: 300 });
    for (const item of list.keys) {
      if (!item.name.startsWith("HDJRZ-")) continue;
      try {
        const rawLic = await env.LICENSES.get(item.name);
        if (rawLic) {
          const lic = JSON.parse(rawLic);
          if (lic && lic.owner && lic.owner !== "—" && lic.role !== "admin") {
            const key = lic.owner.trim().toLowerCase();
            if (!agentMap.has(key)) {
              agentMap.set(key, {
                agent: lic.owner.trim(),
                version: "1.0.0",
                lastSeen: lic.lastSeen || null,
                devId: lic.deviceId || "",
                online: false,
                latestTicketId: null,
                latestTicketStatus: null,
                latestTicketUpdatedAt: null
              });
            } else if (lic.deviceId && !agentMap.get(key).devId) {
              agentMap.get(key).devId = lic.deviceId;
            }
          }
        }
      } catch (_) {}
    }
  } catch (_) {}

  // 4. Attach latest ticket info from D1
  if (env.DB) {
    try {
      const ticketRows = await env.DB.prepare(`
        SELECT agent_name, id, status, updated_at
        FROM support_tickets
        ORDER BY updated_at DESC LIMIT 100
      `).all();
      if (ticketRows && ticketRows.results) {
        for (const t of ticketRows.results) {
          const name = String(t.agent_name || "").trim();
          if (!name) continue;
          const key = name.toLowerCase();
          if (!agentMap.has(key)) {
            agentMap.set(key, {
              agent: name,
              version: "1.0.0",
              lastSeen: t.updated_at,
              devId: "",
              online: false,
              latestTicketId: t.id,
              latestTicketStatus: t.status,
              latestTicketUpdatedAt: t.updated_at
            });
          } else {
            const existing = agentMap.get(key);
            if (!existing.latestTicketId) {
              existing.latestTicketId = t.id;
              existing.latestTicketStatus = t.status;
              existing.latestTicketUpdatedAt = t.updated_at;
            }
          }
        }
      }
    } catch (_) {}
  }

  const allAgents = Array.from(agentMap.values()).sort((a, b) => {
    if (a.online && !b.online) return -1;
    if (!a.online && b.online) return 1;
    return (b.lastSeen || 0) - (a.lastSeen || 0);
  });

  return {
    activeUsers,
    allAgents
  };
}
