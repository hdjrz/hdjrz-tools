/**
 * Authentication Service
 */
import { createAdminToken, verifyAdminToken } from "../utils/crypto.js";
import { AppError } from "../utils/errors.js";

/**
 * Retrieve master admin password from KV or env fallback
 */
export async function getAdminPassword(env) {
  try {
    const custom = await env.LICENSES.get("ADMIN_PASSWORD");
    if (custom && custom.trim()) return custom.trim();
  } catch (e) {}
  return (env && env.ADMIN_PASSWORD) || "hdjrzAdmin2026!";
}

/**
 * Check if the provided password matches master password
 */
export async function verifyMasterPassword(env, password) {
  const master = await getAdminPassword(env);
  return password === master;
}

/**
 * Authenticate admin and return session token
 */
export async function loginAdmin(env, password) {
  const isMatch = await verifyMasterPassword(env, password);
  if (!isMatch) {
    throw new AppError("Invalid master password", 401, "invalid_password");
  }
  const token = createAdminToken(password);
  return { token, role: "admin" };
}

/**
 * Verify admin bearer token or direct password
 */
export async function verifyAdminAuthHeader(env, authHeader = "", directPass = "") {
  const master = await getAdminPassword(env);
  if (directPass && directPass === master) return true;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7).trim();
    if (token === master) return true;
    return verifyAdminToken(token, master);
  }
  return false;
}

/**
 * Update master admin password
 */
export async function changeAdminPassword(env, newPassword) {
  const trimmed = String(newPassword || "").trim();
  if (!trimmed || trimmed.length < 6) {
    throw new AppError("Password must be at least 6 characters long", 400, "invalid_password_length");
  }
  await env.LICENSES.put("ADMIN_PASSWORD", trimmed);
  return { success: true };
}
