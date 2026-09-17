/**
 * Audit Log Routes (/api/audit/*)
 */
import { parseJsonBody } from "../middleware/validation.js";
import { requireAdmin } from "../middleware/authorization.js";
import { getAuditLogs, logAuditEvent } from "../services/auditService.js";
import { jsonSuccess } from "../utils/response.js";

export async function handleAuditRoutes(request, env, url) {
  const method = request.method;
  const path = url.pathname;

  // GET /api/audit/logs
  if (method === "GET" && (path === "/api/audit/logs" || path === "/api/audit")) {
    await requireAdmin(request, env);
    const limit = parseInt(url.searchParams.get("limit") || "100", 10);
    const logs = await getAuditLogs(env, limit);
    return jsonSuccess({ logs, count: logs.length });
  }

  // POST /api/audit/log
  if (method === "POST" && (path === "/api/audit/log" || path === "/api/audit")) {
    await requireAdmin(request, env);
    const body = await parseJsonBody(request);
    const event = await logAuditEvent(env, {
      action: body.action || "GENERIC_EVENT",
      actor: body.actor || "admin",
      target: body.target || "",
      details: body.details || {}
    });
    return jsonSuccess({ event });
  }

  return null;
}
