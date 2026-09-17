/**
 * License Key Lifecycle & Device Binding Service
 */
import { generateLicenseKey } from "../utils/crypto.js";
import { AppError, NotFoundError, UnauthorizedError, ForbiddenError } from "../utils/errors.js";
import { getSystemConfig, isVersionBelow } from "./systemService.js";
import { logAuditEvent } from "./auditService.js";

const SYSTEM_KEYS = new Set([
  "SYSTEM_CONFIG",
  "REMOTE_TEMPLATES",
  "ACTIVE_AGENTS",
  "ADMIN_PASSWORD",
  "AUDIT_LOGS"
]);

/**
 * List all issued licenses (excluding internal system KV keys)
 */
export async function listLicenses(env) {
  const list = await env.LICENSES.list({ limit: 500 });
  const licenses = [];

  for (const item of list.keys) {
    if (SYSTEM_KEYS.has(item.name)) continue;
    const raw = await env.LICENSES.get(item.name);
    let record = {
      key: item.name,
      role: "guest",
      owner: "—",
      deviceId: "",
      active: true,
      createdAt: null,
      usedAt: null
    };

    try {
      const parsed = JSON.parse(raw);
      if (typeof parsed === "object" && parsed !== null) {
        record = { ...record, ...parsed, key: item.name };
      } else if (typeof parsed === "string") {
        record.role = parsed;
      }
    } catch (e) {
      if (raw === "admin" || raw === "guest") record.role = raw;
    }
    licenses.push(record);
  }

  return licenses;
}

/**
 * Create a new license key (HDJRZ-GUEST-xxxx-xxxx or HDJRZ-ADMIN-xxxx-xxxx)
 */
export async function createLicense(env, { role = "guest", owner = "Agent" } = {}, actor = "admin") {
  const normalizedRole = role === "admin" ? "admin" : "guest";
  const normalizedOwner = String(owner || "").trim() || "Agent";
  const newKey = generateLicenseKey(normalizedRole);

  const newRecord = {
    role: normalizedRole,
    owner: normalizedOwner,
    deviceId: "",
    active: true,
    createdAt: new Date().toISOString(),
    usedAt: null
  };

  await env.LICENSES.put(newKey, JSON.stringify(newRecord));

  await logAuditEvent(env, {
    action: "KEY_CREATED",
    actor,
    target: newKey,
    details: { role: normalizedRole, owner: normalizedOwner }
  });

  return { key: newKey, license: newRecord };
}

/**
 * Reset device binding (unlocking a key so user can switch devices)
 */
export async function resetDeviceBinding(env, key, actor = "admin") {
  const targetKey = String(key || "").trim();
  if (!targetKey) throw new AppError("License key is required", 400, "missing_key");

  const raw = await env.LICENSES.get(targetKey);
  if (!raw) throw new NotFoundError(`License key ${targetKey} not found`);

  let row = {};
  try { row = JSON.parse(raw); } catch (e) {}
  const prevDevice = row.deviceId || "";
  row.deviceId = "";
  await env.LICENSES.put(targetKey, JSON.stringify(row));

  await logAuditEvent(env, {
    action: "DEVICE_RESET",
    actor,
    target: targetKey,
    details: { previousDeviceId: prevDevice }
  });

  return { key: targetKey, message: `Device binding reset for ${targetKey}` };
}

/**
 * Toggle freeze / active status of a license key
 */
export async function toggleFreezeLicense(env, key, actor = "admin") {
  const targetKey = String(key || "").trim();
  if (!targetKey) throw new AppError("License key is required", 400, "missing_key");

  const raw = await env.LICENSES.get(targetKey);
  if (!raw) throw new NotFoundError(`License key ${targetKey} not found`);

  let row = {};
  try { row = JSON.parse(raw); } catch (e) {}
  row.active = row.active === false ? true : false;
  await env.LICENSES.put(targetKey, JSON.stringify(row));

  await logAuditEvent(env, {
    action: row.active ? "KEY_UNFROZEN" : "KEY_FROZEN",
    actor,
    target: targetKey,
    details: { active: row.active }
  });

  return {
    key: targetKey,
    active: row.active,
    message: `Key ${targetKey} is now ${row.active ? "Active" : "Frozen"}`
  };
}

/**
 * Permanently delete a license key
 */
export async function deleteLicense(env, key, actor = "admin") {
  const targetKey = String(key || "").trim();
  if (!targetKey) throw new AppError("License key is required", 400, "missing_key");

  const raw = await env.LICENSES.get(targetKey);
  if (!raw) throw new NotFoundError(`License key ${targetKey} not found`);

  await env.LICENSES.delete(targetKey);

  await logAuditEvent(env, {
    action: "KEY_DELETED",
    actor,
    target: targetKey
  });

  return { key: targetKey, message: `Key ${targetKey} deleted` };
}

/**
 * Activate, verify, or release a license key for a client device
 */
export async function activateOrVerifyLicense(env, { key = "", deviceId = "", action = "", version = "1.1.4" } = {}) {
  const cleanKey = String(key || "").trim();
  const cleanDevice = String(deviceId || "").trim();
  const cleanVersion = String(version || "1.1.4").trim();

  if (!cleanKey || !cleanDevice) {
    throw new AppError("Missing license key or deviceId", 400, "missing");
  }

  const sysConfig = await getSystemConfig(env);
  if (sysConfig.killSwitch) {
    throw new ForbiddenError(sysConfig.killSwitchMessage || "hdjrzTools is temporarily disabled for emergency maintenance.", "kill_switch");
  }

  if (isVersionBelow(cleanVersion, sysConfig.minRequiredVersion)) {
    throw new AppError(
      `⚠️ Critical Update Required: Your script version (v${cleanVersion}) is obsolete. Please update to v${sysConfig.latestVersion}.`,
      426,
      "outdated_version"
    );
  }

  const raw = await env.LICENSES.get(cleanKey);
  if (!raw) {
    throw new UnauthorizedError("Invalid license key", "invalid");
  }

  let row = {};
  try {
    row = JSON.parse(raw);
  } catch (e) {
    if (typeof raw === "string" && (raw.trim() === "admin" || raw.trim() === "guest")) {
      row = { role: raw.trim(), deviceId: "", active: true };
    } else {
      throw new UnauthorizedError("Invalid license data", "invalid");
    }
  }

  if (typeof row !== "object" || row === null) {
    if (row === "admin" || row === "guest") {
      row = { role: row, deviceId: "", active: true };
    } else {
      throw new UnauthorizedError("Invalid license structure", "invalid");
    }
  }

  if (row.active === false) {
    throw new ForbiddenError("🚫 This license key has been deactivated or frozen by Admin.", "revoked");
  }

  const role = (row.role === "admin" || row === "admin") ? "admin" : "guest";
  const used = String(row.deviceId || "").trim();

  // Action: release device
  if (action === "release") {
    if (used && used !== cleanDevice && role !== "admin") {
      throw new ForbiddenError("Device mismatch for release", "already_used");
    }
    await env.LICENSES.put(cleanKey, JSON.stringify({ ...row, role, deviceId: "" }));
    await logAuditEvent(env, { action: "DEVICE_RELEASED", actor: cleanKey, target: cleanDevice });
    return { ok: true, role };
  }

  const verMeta = {
    latestVersion: sysConfig.latestVersion,
    minRequiredVersion: sysConfig.minRequiredVersion,
    updateUrl: "https://hdjrz-license.rosechel05.workers.dev/script.user.js"
  };

  // Master Admin: always allow login and re-bind device seamlessly
  if (role === "admin") {
    row.role = "admin";
    row.deviceId = cleanDevice;
    row.usedAt = new Date().toISOString();
    await env.LICENSES.put(cleanKey, JSON.stringify(row));
    return { ok: true, role: "admin", ...verMeta };
  }

  // First time activation (unbound key)
  if (!used) {
    row.role = role;
    row.deviceId = cleanDevice;
    row.usedAt = new Date().toISOString();
    await env.LICENSES.put(cleanKey, JSON.stringify(row));
    await logAuditEvent(env, { action: "KEY_BOUND", actor: cleanKey, target: cleanDevice });
    return { ok: true, role, ...verMeta };
  }

  // Already bound to this exact device
  if (used === cleanDevice) {
    return { ok: true, role, ...verMeta };
  }

  // Already bound to another device
  throw new ForbiddenError("This license key is already bound to another device. Ask Admin to reset device binding.", "already_used");
}
