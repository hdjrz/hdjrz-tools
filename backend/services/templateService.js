/**
 * Remote Template Management Service (Phase 11: Draft → Validate → Preview → Publish)
 * Enforces mandatory staged deployment pipeline:
 * Admin edits → Draft → Validate → Preview → Publish → New template version → Agents synchronize.
 * Never edit and immediately modify production!
 */
import { AppError } from "../utils/errors.js";
import { logAuditEvent } from "./auditService.js";

const DRAFT_KV_KEY = "TEMPLATE_DRAFT";
const PROD_KV_KEY = "REMOTE_TEMPLATES";

/**
 * Retrieve current published remote button templates (Production)
 */
export async function getRemoteTemplates(env) {
  const raw = await env.LICENSES.get(PROD_KV_KEY);
  if (!raw) {
    return { version: 0, updatedAt: null, options: [] };
  }
  try {
    const parsed = JSON.parse(raw);
    return {
      version: typeof parsed.version === "number" ? parsed.version : 0,
      updatedAt: parsed.updatedAt || null,
      publishedBy: parsed.publishedBy || "admin",
      options: Array.isArray(parsed.options) ? parsed.options : []
    };
  } catch (e) {
    return { version: 0, updatedAt: null, options: [] };
  }
}

/**
 * Retrieve current template draft
 * Auto-initializes from production if no draft exists
 */
export async function getTemplateDraft(env) {
  const raw = await env.LICENSES.get(DRAFT_KV_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        return parsed;
      }
    } catch (e) {}
  }

  // Fallback: initialize draft from current production
  const prod = await getRemoteTemplates(env);
  return {
    status: "clean", // "clean" | "draft" | "validated" | "published"
    updatedAt: null,
    updatedBy: null,
    validated: true,
    validationErrors: [],
    validationWarnings: [],
    notes: "",
    options: JSON.parse(JSON.stringify(prod.options || []))
  };
}

/**
 * Validate template options array against schema and integrity rules
 */
export function validateTemplateDraft(options) {
  const errors = [];
  const warnings = [];

  if (!Array.isArray(options)) {
    return { valid: false, errors: ["Templates must be an array of option objects"], warnings };
  }

  if (options.length === 0) {
    errors.push("Template list cannot be empty");
    return { valid: false, errors, warnings };
  }

  const seenCodes = new Set();
  const knownPlaceholders = ["[CID]", "[User ID]", "[Reason]", "[DOB]", "[Name]"];

  options.forEach((opt, idx) => {
    const itemNum = idx + 1;
    if (!opt || typeof opt !== "object") {
      errors.push(`Item #${itemNum} is not a valid object`);
      return;
    }

    // 1. Code validation
    const code = String(opt.code || "").trim();
    if (!code) {
      errors.push(`Item #${itemNum} is missing a unique code`);
    } else {
      const upper = code.toUpperCase();
      if (seenCodes.has(upper)) {
        errors.push(`Duplicate escalation code "${code}" found at item #${itemNum}`);
      }
      seenCodes.add(upper);
    }

    // 2. Label validation
    const label = String(opt.label || "").trim();
    if (!label) {
      errors.push(`Item #${itemNum} (${code || "unnamed"}) is missing a button label`);
    }

    // 3. Category / Group validation
    const group = String(opt.group || "").trim();
    if (!group) {
      warnings.push(`Item #${itemNum} (${code || "unnamed"}) has no category/group; will default to "General"`);
    }

    // 4. Reasons validation
    if (!Array.isArray(opt.reasons) || opt.reasons.length === 0) {
      warnings.push(`Item #${itemNum} (${code}) has an empty reasons list`);
    }

    // 5. Placeholder syntax check in Zoom & UserNotes
    const checkPlaceholders = (text, fieldName) => {
      if (!text || typeof text !== "string") return;
      const unclosedMatch = text.match(/\[[A-Za-z0-9 ]+(?!\])/g);
      if (unclosedMatch) {
        unclosedMatch.forEach(match => {
          if (!match.endsWith("]")) {
            warnings.push(`Item #${itemNum} (${code}) has potentially unclosed placeholder "${match}" in ${fieldName}`);
          }
        });
      }
    };

    checkPlaceholders(opt.userNotesText, "userNotesText");
    checkPlaceholders(opt.zoomText, "zoomText");

    if (Array.isArray(opt.noteChoices)) {
      opt.noteChoices.forEach((nc, cIdx) => {
        checkPlaceholders(nc.userNotesText, `noteChoices[${cIdx}]`);
      });
    }

    if (Array.isArray(opt.zoomChoices)) {
      opt.zoomChoices.forEach((zc, zIdx) => {
        checkPlaceholders(zc.zoomText, `zoomChoices[${zIdx}]`);
      });
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Save draft options without modifying production
 */
export async function saveTemplateDraft(env, { adminKey = "", options = [], notes = "" } = {}) {
  if (!Array.isArray(options)) {
    throw new AppError("Invalid options array", 400, "invalid_options");
  }

  const validation = validateTemplateDraft(options);

  const draft = {
    status: validation.valid ? "validated" : "draft",
    updatedAt: new Date().toISOString(),
    updatedBy: adminKey ? (adminKey.slice(0, 4) + "***") : "admin",
    validated: validation.valid,
    validationErrors: validation.errors,
    validationWarnings: validation.warnings,
    notes: String(notes || "").trim(),
    options
  };

  await env.LICENSES.put(DRAFT_KV_KEY, JSON.stringify(draft));

  await logAuditEvent(env, {
    action: "TEMPLATE_DRAFT_SAVED",
    actor: adminKey || "admin",
    target: "draft",
    details: {
      buttonCount: options.length,
      validated: validation.valid,
      errorCount: validation.errors.length,
      warningCount: validation.warnings.length
    }
  });

  return draft;
}

/**
 * Generate preview & granular diff between Production and Draft
 */
export async function getTemplatePreview(env) {
  const prod = await getRemoteTemplates(env);
  const draft = await getTemplateDraft(env);

  const prodMap = new Map();
  prod.options.forEach(opt => {
    if (opt && opt.code) prodMap.set(String(opt.code).toUpperCase(), opt);
  });

  const draftMap = new Map();
  draft.options.forEach(opt => {
    if (opt && opt.code) draftMap.set(String(opt.code).toUpperCase(), opt);
  });

  const added = [];
  const modified = [];
  const removed = [];
  let unchangedCount = 0;

  // Detect Added & Modified
  for (const [code, draftOpt] of draftMap.entries()) {
    if (!prodMap.has(code)) {
      added.push({
        code: draftOpt.code,
        label: draftOpt.label,
        group: draftOpt.group || "General",
        color: draftOpt.color
      });
    } else {
      const prodOpt = prodMap.get(code);
      const changes = [];

      if (prodOpt.label !== draftOpt.label) changes.push(`label: "${prodOpt.label}" → "${draftOpt.label}"`);
      if (prodOpt.group !== draftOpt.group) changes.push(`group: "${prodOpt.group}" → "${draftOpt.group}"`);
      if (prodOpt.color !== draftOpt.color) changes.push(`color: "${prodOpt.color}" → "${draftOpt.color}"`);
      if (prodOpt.defaultReason !== draftOpt.defaultReason) changes.push(`defaultReason: "${prodOpt.defaultReason}" → "${draftOpt.defaultReason}"`);
      if (prodOpt.userNotesText !== draftOpt.userNotesText) changes.push("userNotesText modified");
      if (prodOpt.zoomText !== draftOpt.zoomText) changes.push("zoomText modified");

      const prodReasons = JSON.stringify(prodOpt.reasons || []);
      const draftReasons = JSON.stringify(draftOpt.reasons || []);
      if (prodReasons !== draftReasons) changes.push("reasons list modified");

      if (changes.length > 0) {
        modified.push({
          code: draftOpt.code,
          label: draftOpt.label,
          changes
        });
      } else {
        unchangedCount++;
      }
    }
  }

  // Detect Removed
  for (const [code, prodOpt] of prodMap.entries()) {
    if (!draftMap.has(code)) {
      removed.push({
        code: prodOpt.code,
        label: prodOpt.label,
        group: prodOpt.group || "General"
      });
    }
  }

  // Re-run validation for current preview
  const validation = validateTemplateDraft(draft.options);

  return {
    production: {
      version: prod.version,
      updatedAt: prod.updatedAt,
      count: prod.options.length
    },
    draft: {
      status: draft.status,
      updatedAt: draft.updatedAt,
      updatedBy: draft.updatedBy,
      count: draft.options.length,
      validated: validation.valid,
      validationErrors: validation.errors,
      validationWarnings: validation.warnings
    },
    diff: {
      added,
      modified,
      removed,
      unchangedCount,
      hasChanges: (added.length > 0 || modified.length > 0 || removed.length > 0)
    },
    options: draft.options
  };
}

/**
 * Publish draft to production (MANDATORY GATE: Cannot publish invalid draft)
 * Promotes TEMPLATE_DRAFT to REMOTE_TEMPLATES, increments production version
 */
export async function publishDraftToProduction(env, { adminKey = "" } = {}) {
  const draft = await getTemplateDraft(env);

  if (!Array.isArray(draft.options) || draft.options.length === 0) {
    throw new AppError("Draft is empty. Cannot publish empty templates.", 400, "empty_draft");
  }

  // Strict Validation Gate
  const validation = validateTemplateDraft(draft.options);
  if (!validation.valid) {
    throw new AppError(
      `Cannot publish invalid draft: ${validation.errors.join("; ")}`,
      400,
      "validation_failed"
    );
  }

  // Bump production version
  const prod = await getRemoteTemplates(env);
  const newVersion = (prod.version || 0) + 1;
  const publishedAt = new Date().toISOString();
  const publisher = adminKey ? (adminKey.slice(0, 4) + "***") : "admin";

  const storePayload = {
    version: newVersion,
    updatedAt: publishedAt,
    publishedBy: publisher,
    options: draft.options
  };

  // Atomically write to production
  await env.LICENSES.put(PROD_KV_KEY, JSON.stringify(storePayload));

  // Mark draft as published
  draft.status = "published";
  draft.publishedVersion = newVersion;
  draft.publishedAt = publishedAt;
  draft.validated = true;
  draft.validationErrors = [];
  await env.LICENSES.put(DRAFT_KV_KEY, JSON.stringify(draft));

  await logAuditEvent(env, {
    action: "TEMPLATES_PUBLISHED_FROM_DRAFT",
    actor: adminKey || "admin",
    target: `v${newVersion}`,
    details: {
      version: newVersion,
      buttonCount: draft.options.length,
      publishedAt
    }
  });

  return {
    ok: true,
    version: newVersion,
    publishedAt,
    count: draft.options.length,
    publishedBy: publisher
  };
}

/**
 * Discard draft and revert to live production options
 */
export async function discardTemplateDraft(env, { adminKey = "" } = {}) {
  const prod = await getRemoteTemplates(env);

  const draft = {
    status: "clean",
    updatedAt: new Date().toISOString(),
    updatedBy: adminKey ? (adminKey.slice(0, 4) + "***") : "admin",
    validated: true,
    validationErrors: [],
    validationWarnings: [],
    notes: "Reset to production",
    options: JSON.parse(JSON.stringify(prod.options || []))
  };

  await env.LICENSES.put(DRAFT_KV_KEY, JSON.stringify(draft));

  await logAuditEvent(env, {
    action: "TEMPLATE_DRAFT_DISCARDED",
    actor: adminKey || "admin",
    target: "draft",
    details: { buttonCount: prod.options.length }
  });

  return {
    ok: true,
    message: "Draft discarded and reset to live production options",
    count: prod.options.length
  };
}

/**
 * Legacy support: redirects direct publish requests through the draft pipeline
 */
export async function publishRemoteTemplates(env, { adminKey = "", options = [] } = {}) {
  // Save to draft first
  const draft = await saveTemplateDraft(env, { adminKey, options, notes: "Saved via API" });
  if (!draft.validated) {
    throw new AppError(`Draft validation failed: ${draft.validationErrors.join("; ")}`, 400, "validation_failed");
  }
  // Publish validated draft
  return await publishDraftToProduction(env, { adminKey });
}
