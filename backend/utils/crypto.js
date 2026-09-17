/**
 * Crypto and String Utilities
 */

/**
 * Generate a 4-character random alphanumeric string (avoiding ambiguous chars)
 */
export function generateRandomChunk(len = 4) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let str = "";
  for (let i = 0; i < len; i++) {
    str += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return str;
}

/**
 * Generate standard license key (HDJRZ-GUEST-xxxx-xxxx or HDJRZ-ADMIN-xxxx-xxxx)
 */
export function generateLicenseKey(role = "guest") {
  const prefix = role === "admin" ? "HDJRZ-ADMIN" : "HDJRZ-GUEST";
  return `${prefix}-${generateRandomChunk(4)}-${generateRandomChunk(4)}`;
}

/**
 * Mint base64 admin bearer token: "admin:<timestamp>:<prefix>"
 */
export function createAdminToken(masterPassword) {
  const prefix = String(masterPassword || "").slice(0, 4);
  const raw = `admin:${Date.now()}:${prefix}`;
  return btoa(raw);
}

/**
 * Decode and verify admin bearer token structure and age (valid for 7 days)
 */
export function verifyAdminToken(token, masterPassword) {
  if (!token || !masterPassword) return false;
  if (token === masterPassword) return true;
  try {
    const decoded = atob(token);
    const [type, ts, prefix] = decoded.split(":");
    if (type !== "admin") return false;
    if (!masterPassword.startsWith(prefix)) return false;
    const age = Date.now() - Number(ts);
    const maxAgeMs = 7 * 24 * 60 * 60 * 1000; // 7 days
    return age >= 0 && age < maxAgeMs;
  } catch (e) {
    return false;
  }
}

/**
 * HTML sanitization helper
 */
export function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
