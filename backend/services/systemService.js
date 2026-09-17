/**
 * System Configuration & Version Enforcement Service
 */
import { AppError } from "../utils/errors.js";

export const DEFAULT_SYSTEM_CONFIG = {
  minRequiredVersion: "1.1.4",
  latestVersion: "1.4.5",
  killSwitch: false,
  killSwitchMessage: "hdjrzTools is temporarily disabled for emergency maintenance.",
  allowedDomains: ["nano-admin.bet88.ph"]
};

let cachedGhVersion = null;
let cachedGhVersionTime = 0;

export function parseSemver(v) {
  const parts = String(v || "").replace(/[^0-9.]/g, "").split(".").map(n => parseInt(n, 10) || 0);
  while (parts.length < 3) parts.push(0);
  return parts;
}

export function isVersionBelow(clientVer, minVer) {
  if (!clientVer || !minVer) return false;
  if (clientVer === "1.9.0" || clientVer === "1.9") return true;
  const a = parseSemver(clientVer);
  const b = parseSemver(minVer);
  for (let i = 0; i < 3; i++) {
    if (a[i] < b[i]) return true;
    if (a[i] > b[i]) return false;
  }
  return false;
}

/**
 * Poll live package.json version from GitHub (cached for 60s)
 */
export async function getLiveGitHubVersion(env) {
  const now = Date.now();
  if (cachedGhVersion && (now - cachedGhVersionTime < 60000)) {
    return cachedGhVersion;
  }
  try {
    const headers = { "User-Agent": "hdjrz-version-sync" };
    if (env && env.GITHUB_TOKEN) {
      headers["Authorization"] = `token ${env.GITHUB_TOKEN}`;
    }
    const resp = await fetch(`https://raw.githubusercontent.com/hdjrz/hdjrz-tools/main/package.json?ts=${now}`, { headers });
    if (resp.ok) {
      const data = await resp.json();
      if (data && data.version) {
        cachedGhVersion = String(data.version).trim();
        cachedGhVersionTime = now;
        return cachedGhVersion;
      }
    }
  } catch (e) {}
  return null;
}

/**
 * Retrieve system configuration merged from KV and defaults
 */
export async function getSystemConfig(env) {
  let cfg = { ...DEFAULT_SYSTEM_CONFIG };
  try {
    const raw = await env.LICENSES.get("SYSTEM_CONFIG");
    if (raw) {
      const kv = JSON.parse(raw);
      cfg = { ...cfg, ...kv };
    }
  } catch (e) {}

  try {
    const liveGhVer = await getLiveGitHubVersion(env);
    if (liveGhVer && !isVersionBelow(liveGhVer, cfg.latestVersion)) {
      cfg.latestVersion = liveGhVer;
    }
  } catch (e) {}

  if (isVersionBelow(cfg.latestVersion, DEFAULT_SYSTEM_CONFIG.latestVersion)) {
    cfg.latestVersion = DEFAULT_SYSTEM_CONFIG.latestVersion;
  }
  if (isVersionBelow(cfg.minRequiredVersion, DEFAULT_SYSTEM_CONFIG.minRequiredVersion)) {
    cfg.minRequiredVersion = DEFAULT_SYSTEM_CONFIG.minRequiredVersion;
  }
  return cfg;
}

/**
 * Update system configuration in KV
 */
export async function updateSystemConfig(env, updates = {}) {
  const current = await getSystemConfig(env);
  const updated = {
    ...current,
    minRequiredVersion: updates.minRequiredVersion ? String(updates.minRequiredVersion).trim() : current.minRequiredVersion,
    latestVersion: updates.latestVersion ? String(updates.latestVersion).trim() : current.latestVersion,
    killSwitch: typeof updates.killSwitch === "boolean" ? updates.killSwitch : current.killSwitch,
    killSwitchMessage: updates.killSwitchMessage ? String(updates.killSwitchMessage).trim() : current.killSwitchMessage,
    allowedDomains: Array.isArray(updates.allowedDomains) ? updates.allowedDomains : current.allowedDomains
  };
  await env.LICENSES.put("SYSTEM_CONFIG", JSON.stringify(updated));
  return updated;
}

/**
 * Verify client version, killswitch, and domain authorization
 */
export async function checkSystemAccess(env, { clientVer = "", domain = "" } = {}) {
  const cfg = await getSystemConfig(env);

  if (cfg.killSwitch) {
    return {
      allowed: false,
      reason: "kill_switch",
      message: cfg.killSwitchMessage || "hdjrzTools is temporarily disabled for emergency maintenance."
    };
  }

  if (domain && Array.isArray(cfg.allowedDomains) && cfg.allowedDomains.length > 0) {
    const isAllowed = cfg.allowedDomains.some(d => domain === d || domain.endsWith("." + d));
    if (!isAllowed) {
      return {
        allowed: false,
        reason: "unauthorized_domain",
        domain,
        message: `hdjrzTools is not authorized to run on ${domain}`
      };
    }
  }

  if (clientVer && isVersionBelow(clientVer, cfg.minRequiredVersion)) {
    return {
      allowed: false,
      reason: "outdated_version",
      clientVersion: clientVer,
      minRequiredVersion: cfg.minRequiredVersion,
      latestVersion: cfg.latestVersion,
      updateUrl: "https://hdjrz-license.rosechel05.workers.dev/script.user.js",
      message: `⚠️ Critical Update Required: Your version (v${clientVer}) is out of date. Update to v${cfg.latestVersion} to continue.`
    };
  }

  return { allowed: true, config: cfg };
}
