/**
 * Audit Logging Service
 */

const MAX_AUDIT_LOGS = 500;

/**
 * Record an audit event into KV
 */
export async function logAuditEvent(env, { action, actor = "system", target = "", details = {} } = {}) {
  try {
    let logs = [];
    const raw = await env.LICENSES.get("AUDIT_LOGS");
    if (raw) {
      try { logs = JSON.parse(raw); } catch (e) {}
    }
    if (!Array.isArray(logs)) logs = [];

    const event = {
      id: "evt_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
      timestamp: new Date().toISOString(),
      action,
      actor,
      target,
      details
    };

    logs.unshift(event);
    if (logs.length > MAX_AUDIT_LOGS) {
      logs = logs.slice(0, MAX_AUDIT_LOGS);
    }

    await env.LICENSES.put("AUDIT_LOGS", JSON.stringify(logs));
    return event;
  } catch (err) {
    console.warn("[auditService] Failed to record audit event:", err);
    return null;
  }
}

/**
 * Query recent audit events
 */
export async function getAuditLogs(env, limit = 100) {
  try {
    const raw = await env.LICENSES.get("AUDIT_LOGS");
    if (!raw) return [];
    const logs = JSON.parse(raw);
    if (!Array.isArray(logs)) return [];
    return logs.slice(0, Math.min(limit, MAX_AUDIT_LOGS));
  } catch (err) {
    return [];
  }
}
