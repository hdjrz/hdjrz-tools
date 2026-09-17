/**
 * Agent Activity & Telemetry Service
 */

const ACTIVE_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Record an agent presence heartbeat
 */
export async function recordAgentHeartbeat(env, { agent = "Agent", version = "1.0.0", devId = "" } = {}) {
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

  const id = devId || ("agent_" + agent);
  activeMap[id] = {
    agent: agent || "Agent",
    version: version || "1.0.0",
    lastSeen: now
  };

  try {
    await env.LICENSES.put("ACTIVE_AGENTS", JSON.stringify(activeMap));
  } catch (e) {}

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
