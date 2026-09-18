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
  const clean = String(password || "").trim();
  const master = await getAdminPassword(env);

  // 1. Check master password
  if (clean === master) {
    const token = createAdminToken(master);
    return { token, role: "admin" };
  }

  // 2. Check if entered password is a valid Admin License Key
  if (clean.startsWith("HDJRZ-ADMIN-") || clean.startsWith("HDJRZ-")) {
    try {
      const raw = await env.LICENSES.get(clean);
      if (raw) {
        let row = {};
        try { row = JSON.parse(raw); } catch (e) {
          if (raw === "admin") row = { role: "admin", active: true };
        }
        if (row.role === "admin" && row.active !== false) {
          const token = createAdminToken(master);
          return { token, role: "admin" };
        }
      }
    } catch (e) {}
  }

  throw new AppError("Invalid master password or admin key. (Default: hdjrzAdmin2026!)", 401, "invalid_password");
}

/**
 * Verify admin bearer token or direct password
 */
export async function verifyAdminAuthHeader(env, authHeader = "", directPass = "") {
  const master = await getAdminPassword(env);
  const cleanDirect = String(directPass || "").trim();
  if (cleanDirect && cleanDirect === master) return true;
  if (cleanDirect && (cleanDirect.startsWith("HDJRZ-ADMIN-") || cleanDirect.startsWith("HDJRZ-"))) {
    try {
      const raw = await env.LICENSES.get(cleanDirect);
      if (raw) {
        const row = JSON.parse(raw);
        if (row && row.role === "admin" && row.active !== false) return true;
      }
    } catch (e) {}
  }

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7).trim();
    if (token === master) return true;
    if (token.startsWith("HDJRZ-ADMIN-") || token.startsWith("HDJRZ-")) {
      try {
        const raw = await env.LICENSES.get(token);
        if (raw) {
          const row = JSON.parse(raw);
          if (row && row.role === "admin" && row.active !== false) return true;
        }
      } catch (e) {}
    }
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
