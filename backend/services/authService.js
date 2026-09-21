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
  const clean = String(password || "").trim();
  return clean === master || clean.toLowerCase() === master.toLowerCase();
}

/**
 * Authenticate admin and return session token
 */
export async function loginAdmin(env, password) {
  const clean = String(password || "").trim();
  const master = await getAdminPassword(env);

  // 1. Check master password (case-insensitive for convenience)
  if (clean === master || clean.toLowerCase() === master.toLowerCase()) {
    const token = createAdminToken(master);
    return { token, role: "admin" };
  }

  // 2. Check if entered password is a valid Admin License Key (case-insensitive)
  const cleanUpper = clean.toUpperCase();
  if (cleanUpper.startsWith("HDJRZ-ADMIN-") || cleanUpper.startsWith("HDJRZ-")) {
    try {
      let raw = await env.LICENSES.get(clean);
      if (!raw && clean !== cleanUpper) {
        raw = await env.LICENSES.get(cleanUpper);
      }
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
  if (cleanDirect && (cleanDirect === master || cleanDirect.toLowerCase() === master.toLowerCase())) return true;
  if (cleanDirect && (cleanDirect.toUpperCase().startsWith("HDJRZ-ADMIN-") || cleanDirect.toUpperCase().startsWith("HDJRZ-"))) {
    const directUpper = cleanDirect.toUpperCase();
    try {
      let raw = await env.LICENSES.get(cleanDirect);
      if (!raw && cleanDirect !== directUpper) {
        raw = await env.LICENSES.get(directUpper);
      }
      if (raw) {
        let row = {};
        try { row = JSON.parse(raw); } catch (e) {
          if (raw === "admin") row = { role: "admin", active: true };
        }
        if (row && row.role === "admin" && row.active !== false) return true;
      }
    } catch (e) {}
  }

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7).trim();
    if (token === master || token.toLowerCase() === master.toLowerCase()) return true;
    const tokenUpper = token.toUpperCase();
    if (tokenUpper.startsWith("HDJRZ-ADMIN-") || tokenUpper.startsWith("HDJRZ-")) {
      try {
        let raw = await env.LICENSES.get(token);
        if (!raw && token !== tokenUpper) {
          raw = await env.LICENSES.get(tokenUpper);
        }
        if (raw) {
          let row = {};
          try { row = JSON.parse(raw); } catch (e) {
            if (raw === "admin") row = { role: "admin", active: true };
          }
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
