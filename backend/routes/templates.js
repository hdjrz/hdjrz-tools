/**
 * Remote Template Routes (/api/templates/* and legacy /config/templates)
 */
import { parseJsonBody, validateRequired } from "../middleware/validation.js";
import { requireActiveLicense } from "../middleware/authorization.js";
import { getRemoteTemplates, publishRemoteTemplates } from "../services/templateService.js";
import { recordAgentHeartbeat, getActiveAgents } from "../services/agentService.js";
import { checkSystemAccess } from "../services/systemService.js";
import { jsonSuccess, jsonError } from "../utils/response.js";
import { ForbiddenError, AppError } from "../utils/errors.js";

export async function handleTemplateRoutes(request, env, url) {
  const method = request.method;
  const path = url.pathname;

  // GET /api/templates or legacy GET /config/templates
  if (method === "GET" && (path === "/api/templates" || path === "/config/templates")) {
    const clientVer = String(url.searchParams.get("v") || "0.0.0").trim();
    const clientDomain = String(url.searchParams.get("domain") || "").trim();

    // Check system enforcement (killswitch, domain, minRequiredVersion)
    const access = await checkSystemAccess(env, { clientVer, domain: clientDomain });
    if (!access.allowed) {
      return jsonError(access.reason, access.message, 403, {
        blocked: true,
        ...access
      });
    }

    const agentName = String(url.searchParams.get("agent") || "").trim();
    const devId = String(url.searchParams.get("dev") || "").trim();

    if (devId || agentName) {
      await recordAgentHeartbeat(env, {
        agent: agentName,
        version: clientVer,
        devId
      });
    }

    const tmplData = await getRemoteTemplates(env);
    const activeList = await getActiveAgents(env);

    const syncedAgents = activeList
      .filter(a => a.version === tmplData.version || a.version === String(tmplData.version))
      .map(a => a.agent);

    return jsonSuccess({
      version: tmplData.version,
      updatedAt: tmplData.updatedAt,
      options: tmplData.options,
      totalActive: activeList.length,
      syncedCount: syncedAgents.length,
      syncedAgents,
      activeUsers: activeList,
      systemConfig: {
        minRequiredVersion: access.config.minRequiredVersion,
        latestVersion: access.config.latestVersion,
        killSwitch: access.config.killSwitch
      }
    }, 200, { "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0" });
  }

  // POST /api/templates or legacy POST /config/templates
  if (method === "POST" && (path === "/api/templates" || path === "/config/templates")) {
    const body = await parseJsonBody(request);
    validateRequired(body, ["key", "options"]);

    const license = await requireActiveLicense(env, body.key);
    if (license.role !== "admin") {
      throw new ForbiddenError("Admin license key required to publish templates", "admin_required");
    }

    const tmpl = await publishRemoteTemplates(env, {
      adminKey: body.key,
      options: body.options
    });

    const activeList = await getActiveAgents(env);

    return jsonSuccess({
      version: tmpl.version,
      updatedAt: tmpl.updatedAt,
      totalActive: activeList.length
    });
  }

  return null;
}
