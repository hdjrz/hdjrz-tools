/**
 * System Configuration Routes (/api/system/* and legacy /config/system)
 */
import { parseJsonBody } from "../middleware/validation.js";
import { requireAdmin, requireActiveLicense } from "../middleware/authorization.js";
import { getSystemConfig, updateSystemConfig } from "../services/systemService.js";
import { logAuditEvent } from "../services/auditService.js";
import { jsonSuccess, jsonError } from "../utils/response.js";
import { ForbiddenError } from "../utils/errors.js";

export async function handleSystemRoutes(request, env, url) {
  const method = request.method;
  const path = url.pathname;

  // GET /api/system/config or legacy GET /config/system
  if (method === "GET" && (path === "/api/system/config" || path === "/config/system")) {
    const config = await getSystemConfig(env);
    return jsonSuccess({ config });
  }

  // GET /api/system/version
  if (method === "GET" && path === "/api/system/version") {
    const config = await getSystemConfig(env);
    return jsonSuccess({
      latestVersion: config.latestVersion,
      minRequiredVersion: config.minRequiredVersion
    });
  }

  // POST /api/system/config or legacy POST /config/system
  if (method === "POST" && (path === "/api/system/config" || path === "/config/system")) {
    const body = await parseJsonBody(request);
    let actor = "admin";

    if (body.key) {
      const license = await requireActiveLicense(env, body.key);
      if (license.role !== "admin") {
        throw new ForbiddenError("Admin license key required", "admin_required");
      }
      actor = body.key;
    } else {
      await requireAdmin(request, env);
    }

    const updated = await updateSystemConfig(env, body);

    await logAuditEvent(env, {
      action: "SYSTEM_CONFIG_UPDATED",
      actor,
      details: updated
    });

    return jsonSuccess({ config: updated });
  }

  return null;
}
