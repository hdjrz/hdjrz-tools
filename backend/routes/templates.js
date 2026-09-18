/**
 * Remote Template Routes (/api/templates/* and legacy /config/templates)
 * Implements Phase 11: Draft → Validate → Preview → Publish pipeline
 */
import { parseJsonBody, validateRequired } from "../middleware/validation.js";
import { requireAdmin, requireActiveLicense } from "../middleware/authorization.js";
import {
  getRemoteTemplates,
  getTemplateDraft,
  saveTemplateDraft,
  validateTemplateDraft,
  getTemplatePreview,
  publishDraftToProduction,
  discardTemplateDraft
} from "../services/templateService.js";
import { recordAgentHeartbeat, getActiveAgents } from "../services/agentService.js";
import { checkSystemAccess } from "../services/systemService.js";
import { jsonSuccess, jsonError } from "../utils/response.js";
import { ForbiddenError, AppError } from "../utils/errors.js";

async function authenticateAdminOrAdminLicense(request, env, body = {}) {
  const licenseKey = body.key || request.headers.get("X-License-Key") || "";
  if (licenseKey) {
    const license = await requireActiveLicense(env, licenseKey);
    if (license.role !== "admin") {
      throw new ForbiddenError("Admin license key required to perform this action", "admin_required");
    }
    return { role: "admin", actor: license.key };
  }
  await requireAdmin(request, env);
  return { role: "admin", actor: "admin" };
}

export async function handleTemplateRoutes(request, env, url) {
  const method = request.method;
  const path = url.pathname;

  // 1. GET /api/templates/draft (Admin session or Admin license)
  if (method === "GET" && path === "/api/templates/draft") {
    const key = url.searchParams.get("key") || "";
    await authenticateAdminOrAdminLicense(request, env, { key });
    const draft = await getTemplateDraft(env);
    return jsonSuccess(draft);
  }

  // 2. POST /api/templates/draft (Save draft without modifying production)
  if (method === "POST" && path === "/api/templates/draft") {
    const body = await parseJsonBody(request);
    validateRequired(body, ["options"]);
    const auth = await authenticateAdminOrAdminLicense(request, env, body);
    const draft = await saveTemplateDraft(env, {
      adminKey: auth.actor,
      options: body.options,
      notes: body.notes
    });
    return jsonSuccess({
      message: "Draft saved successfully. Validate and preview before publishing.",
      draft
    });
  }

  // 3. POST /api/templates/draft/validate (Run automated integrity & schema check)
  if (method === "POST" && path === "/api/templates/draft/validate") {
    const body = await parseJsonBody(request).catch(() => ({}));
    await authenticateAdminOrAdminLicense(request, env, body);
    let optionsToValidate = body.options;
    if (!optionsToValidate) {
      const draft = await getTemplateDraft(env);
      optionsToValidate = draft.options;
    }
    const validation = validateTemplateDraft(optionsToValidate);
    return jsonSuccess({
      valid: validation.valid,
      checks: validation.checks,
      errors: validation.errors,
      warnings: validation.warnings,
      count: Array.isArray(optionsToValidate) ? optionsToValidate.length : 0
    });
  }

  // 4. GET /api/templates/preview (Retrieve visual preview & side-by-side production diff)
  if (method === "GET" && path === "/api/templates/preview") {
    const key = url.searchParams.get("key") || "";
    await authenticateAdminOrAdminLicense(request, env, { key });
    const preview = await getTemplatePreview(env);
    return jsonSuccess(preview);
  }

  // 5. POST /api/templates/draft/publish (MANDATORY GATE: Atomic publish to production)
  if (method === "POST" && path === "/api/templates/draft/publish") {
    const body = await parseJsonBody(request).catch(() => ({}));
    const auth = await authenticateAdminOrAdminLicense(request, env, body);
    const published = await publishDraftToProduction(env, { adminKey: auth.actor });
    const activeList = await getActiveAgents(env);
    return jsonSuccess({
      message: `Templates successfully published to Production as v${published.version}!`,
      version: published.version,
      publishedAt: published.publishedAt,
      count: published.count,
      totalActiveAgents: activeList.length
    });
  }

  // 6. POST /api/templates/draft/discard (Discard draft and revert to production)
  if (method === "POST" && path === "/api/templates/draft/discard") {
    const body = await parseJsonBody(request).catch(() => ({}));
    const auth = await authenticateAdminOrAdminLicense(request, env, body);
    const res = await discardTemplateDraft(env, { adminKey: auth.actor });
    return jsonSuccess(res);
  }

  // 7. GET /api/templates or legacy GET /config/templates (Client synchronization)
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
        killSwitch: access.config.killSwitch,
        fleetSuccessSound: access.config.fleetSuccessSound || "voice"
      }
    }, 200, { "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0" });
  }

  // 8. POST /api/templates or legacy POST /config/templates
  // MANDATORY ENFORCEMENT: Never edit and immediately modify production!
  // Saves edits to draft pipeline and requires preview/publish.
  if (method === "POST" && (path === "/api/templates" || path === "/config/templates")) {
    const body = await parseJsonBody(request);
    validateRequired(body, ["options"]);

    let adminActor = "admin";
    if (body.key) {
      const license = await requireActiveLicense(env, body.key);
      if (license.role !== "admin") {
        throw new ForbiddenError("Admin license key required to manage templates", "admin_required");
      }
      adminActor = body.key;
    } else {
      await requireAdmin(request, env);
    }

    // Save to draft pipeline (Leaves production REMOTE_TEMPLATES untouched!)
    const draft = await saveTemplateDraft(env, {
      adminKey: adminActor,
      options: body.options,
      notes: "Saved via client configuration"
    });

    const activeList = await getActiveAgents(env);

    return jsonSuccess({
      draftCreated: true,
      status: draft.status,
      validated: draft.validated,
      validationErrors: draft.validationErrors,
      validationWarnings: draft.validationWarnings,
      message: "Template edits saved to Draft. Use Preview and Publish to deploy to live production.",
      totalActive: activeList.length
    });
  }

  return null;
}
