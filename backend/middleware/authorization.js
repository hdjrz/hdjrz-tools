/**
 * Authorization Middleware
 */
import { authenticateAdmin } from "./authentication.js";
import { ForbiddenError, UnauthorizedError } from "../utils/errors.js";

/**
 * Require caller to be an authorized Administrator
 */
export async function requireAdmin(request, env) {
  return await authenticateAdmin(request, env);
}

/**
 * Verify that a license key is valid, non-empty, and active
 */
export async function requireActiveLicense(env, key) {
  const cleanKey = String(key || "").trim();
  if (!cleanKey) {
    throw new UnauthorizedError("License key is required", "missing_key");
  }
  const raw = await env.LICENSES.get(cleanKey);
  if (!raw) {
    throw new UnauthorizedError("Invalid license key", "invalid_key");
  }
  let row = {};
  try { row = JSON.parse(raw); } catch (e) {}
  if (row.active === false) {
    throw new ForbiddenError("License key is frozen or deactivated", "revoked");
  }
  return { key: cleanKey, role: row.role || "guest", ...row };
}
