/**
 * Managed Escalation Library Service (Phase 9)
 * Stores and manages 14 factory escalations in KV with status toggling, CRUD, and auto-seeding.
 */
import { FACTORY_ESCALATIONS } from "../data/factoryEscalations.js";
import { AppError, NotFoundError } from "../utils/errors.js";
import { logAuditEvent } from "./auditService.js";

const KV_KEY = "ESCALATION_LIBRARY";

/**
 * Retrieve all escalation definitions from KV.
 * Auto-seeds with 14 factory escalations if KV is uninitialized.
 * Supports filtering by status: 'active' | 'inactive' | 'all'.
 */
export async function getEscalationLibrary(env, filter = {}) {
  const raw = await env.LICENSES.get(KV_KEY);
  let list = null;

  if (raw) {
    try {
      list = JSON.parse(raw);
    } catch (e) {
      list = null;
    }
  }

  // Auto-seed if not yet initialized or invalid
  if (!Array.isArray(list) || list.length === 0) {
    list = JSON.parse(JSON.stringify(FACTORY_ESCALATIONS));
    await env.LICENSES.put(KV_KEY, JSON.stringify(list));
    await logAuditEvent(env, {
      action: "ESCALATIONS_INITIALIZED",
      actor: "system",
      target: KV_KEY,
      details: { count: list.length }
    });
  }

  // Sort by order ascending
  list.sort((a, b) => {
    const ordA = typeof a.order === "number" ? a.order : 999;
    const ordB = typeof b.order === "number" ? b.order : 999;
    return ordA - ordB;
  });

  const total = list.length;
  let filtered = list;

  if (filter && filter.status) {
    const reqStatus = String(filter.status).trim().toLowerCase();
    if (reqStatus === "active" || reqStatus === "inactive") {
      filtered = list.filter(item => (item.status || "active").toLowerCase() === reqStatus);
    }
  }

  return {
    total,
    count: filtered.length,
    escalations: filtered
  };
}

/**
 * Retrieve a single escalation definition by code
 */
export async function getEscalationByCode(env, code) {
  const targetCode = String(code || "").trim().toUpperCase();
  if (!targetCode) {
    throw new AppError("Escalation code is required", 400, "missing_code");
  }

  const { escalations } = await getEscalationLibrary(env);
  const found = escalations.find(e => String(e.code || "").toUpperCase() === targetCode);
  if (!found) {
    throw new NotFoundError(`Escalation with code "${targetCode}" not found`, "not_found");
  }
  return found;
}

/**
 * Create a new escalation definition
 */
export async function createEscalation(env, data = {}, actor = "admin") {
  const code = String(data.code || "").trim().toUpperCase();
  const label = String(data.label || "").trim();

  if (!code) {
    throw new AppError("Escalation code is required", 400, "missing_code");
  }
  if (!label) {
    throw new AppError("Escalation label is required", 400, "missing_label");
  }

  const { escalations } = await getEscalationLibrary(env);
  const exists = escalations.some(e => String(e.code || "").toUpperCase() === code);
  if (exists) {
    throw new AppError(`Escalation code "${code}" already exists`, 409, "duplicate_code");
  }

  const newItem = {
    code,
    label,
    meaning: String(data.meaning || "").trim(),
    description: String(data.description || "").trim(),
    group: String(data.group || "General").trim(),
    color: String(data.color || "#2563eb").trim(),
    chip: data.chip || { text: "", color: "#dc2626" },
    defaultReason: String(data.defaultReason || (Array.isArray(data.reasons) && data.reasons[0]) || "Escalation requested").trim(),
    reasons: Array.isArray(data.reasons) && data.reasons.length ? data.reasons : ["Escalation requested"],
    userNotesText: String(data.userNotesText || "").trim(),
    zoomText: String(data.zoomText || "").trim(),
    noteChoices: Array.isArray(data.noteChoices) ? data.noteChoices : [],
    zoomChoices: Array.isArray(data.zoomChoices) ? data.zoomChoices : [],
    status: data.status === "inactive" ? "inactive" : "active",
    order: typeof data.order === "number" ? data.order : escalations.length + 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  escalations.push(newItem);
  await env.LICENSES.put(KV_KEY, JSON.stringify(escalations));

  await logAuditEvent(env, {
    action: "ESCALATION_CREATED",
    actor,
    target: code,
    details: { code, label, status: newItem.status }
  });

  return newItem;
}

/**
 * Update an existing escalation definition
 */
export async function updateEscalation(env, code, updates = {}, actor = "admin") {
  const targetCode = String(code || "").trim().toUpperCase();
  if (!targetCode) {
    throw new AppError("Escalation code is required", 400, "missing_code");
  }

  const { escalations } = await getEscalationLibrary(env);
  const idx = escalations.findIndex(e => String(e.code || "").toUpperCase() === targetCode);
  if (idx === -1) {
    throw new NotFoundError(`Escalation with code "${targetCode}" not found`, "not_found");
  }

  const current = escalations[idx];

  // If code is being changed, check for collision
  if (updates.code && String(updates.code).trim().toUpperCase() !== targetCode) {
    const newCode = String(updates.code).trim().toUpperCase();
    const collision = escalations.some(e => String(e.code || "").toUpperCase() === newCode);
    if (collision) {
      throw new AppError(`Escalation code "${newCode}" already exists`, 409, "duplicate_code");
    }
    current.code = newCode;
  }

  const allowedFields = [
    "label", "meaning", "description", "group", "color",
    "chip", "defaultReason", "reasons", "userNotesText",
    "zoomText", "noteChoices", "zoomChoices", "status", "order"
  ];

  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      if (field === "status") {
        current.status = updates.status === "inactive" ? "inactive" : "active";
      } else {
        current[field] = updates[field];
      }
    }
  }

  current.updatedAt = new Date().toISOString();
  escalations[idx] = current;

  await env.LICENSES.put(KV_KEY, JSON.stringify(escalations));

  await logAuditEvent(env, {
    action: "ESCALATION_UPDATED",
    actor,
    target: current.code,
    details: { code: current.code, updates }
  });

  return current;
}

/**
 * Toggle escalation status between active and inactive
 */
export async function toggleEscalationStatus(env, code, actor = "admin") {
  const targetCode = String(code || "").trim().toUpperCase();
  if (!targetCode) {
    throw new AppError("Escalation code is required", 400, "missing_code");
  }

  const { escalations } = await getEscalationLibrary(env);
  const idx = escalations.findIndex(e => String(e.code || "").toUpperCase() === targetCode);
  if (idx === -1) {
    throw new NotFoundError(`Escalation with code "${targetCode}" not found`, "not_found");
  }

  const current = escalations[idx];
  const oldStatus = current.status || "active";
  const newStatus = oldStatus === "active" ? "inactive" : "active";

  current.status = newStatus;
  current.updatedAt = new Date().toISOString();
  escalations[idx] = current;

  await env.LICENSES.put(KV_KEY, JSON.stringify(escalations));

  await logAuditEvent(env, {
    action: "ESCALATION_STATUS_TOGGLED",
    actor,
    target: current.code,
    details: { code: current.code, oldStatus, newStatus }
  });

  return current;
}

/**
 * Delete an escalation definition
 */
export async function deleteEscalation(env, code, actor = "admin") {
  const targetCode = String(code || "").trim().toUpperCase();
  if (!targetCode) {
    throw new AppError("Escalation code is required", 400, "missing_code");
  }

  const { escalations } = await getEscalationLibrary(env);
  const idx = escalations.findIndex(e => String(e.code || "").toUpperCase() === targetCode);
  if (idx === -1) {
    throw new NotFoundError(`Escalation with code "${targetCode}" not found`, "not_found");
  }

  const deleted = escalations.splice(idx, 1)[0];
  await env.LICENSES.put(KV_KEY, JSON.stringify(escalations));

  await logAuditEvent(env, {
    action: "ESCALATION_DELETED",
    actor,
    target: targetCode,
    details: { code: targetCode, label: deleted.label }
  });

  return { code: targetCode, deleted: true };
}

/**
 * Reset escalation library to factory defaults (14 active escalations)
 */
export async function resetToFactory(env, actor = "admin") {
  const now = new Date().toISOString();
  const resetList = FACTORY_ESCALATIONS.map(item => ({
    ...item,
    status: "active",
    updatedAt: now
  }));

  await env.LICENSES.put(KV_KEY, JSON.stringify(resetList));

  await logAuditEvent(env, {
    action: "ESCALATION_RESET_FACTORY",
    actor,
    target: KV_KEY,
    details: { count: resetList.length }
  });

  return {
    count: resetList.length,
    escalations: resetList
  };
}
