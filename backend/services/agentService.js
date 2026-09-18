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
    online: true
  }));
}
