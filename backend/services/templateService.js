/**
 * Remote Template Management Service
 */
import { AppError } from "../utils/errors.js";
import { logAuditEvent } from "./auditService.js";

/**
 * Retrieve current published remote button templates
 */
export async function getRemoteTemplates(env) {
  const raw = await env.LICENSES.get("REMOTE_TEMPLATES");
  if (!raw) {
    return { version: 0, updatedAt: null, options: [] };
  }
  try {
    return JSON.parse(raw);
  } catch (e) {
    return { version: 0, updatedAt: null, options: [] };
  }
}

/**
 * Publish updated team templates to KV (increments version)
 */
export async function publishRemoteTemplates(env, { adminKey = "", options = [] } = {}) {
  if (!Array.isArray(options) || !options.length) {
    throw new AppError("Invalid options array", 400, "invalid_options");
  }

  let currentVersion = 1;
  try {
    const existing = await getRemoteTemplates(env);
    if (typeof existing.version === "number") {
      currentVersion = existing.version + 1;
    }
  } catch (e) {}

  const storePayload = {
    version: currentVersion,
    updatedAt: new Date().toISOString(),
    publishedBy: adminKey ? (adminKey.slice(0, 4) + "***") : "admin",
    options: options
  };

  await env.LICENSES.put("REMOTE_TEMPLATES", JSON.stringify(storePayload));

  await logAuditEvent(env, {
    action: "TEMPLATES_PUBLISHED",
    actor: adminKey || "admin",
    target: `v${currentVersion}`,
    details: { buttonCount: options.length, version: currentVersion }
  });

  return storePayload;
}
