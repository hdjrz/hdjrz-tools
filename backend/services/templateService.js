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

export const ALLOWED_TOKENS = new Set([
  "[CID]",
  "[Reason]",
  "[User ID]",
  "[Name]",
  "[DOB]",
  "[AGE]",
  "[Verified UID]",
  "[Rejected accounts]",
  "[New Account UID]",
  "[GLife ID]"
]);

/**
 * Validate template options array against the 8-point pre-publish checklist:
 * 1. JSON valid
 * 2. All escalation codes valid
 * 3. Every required reason exists
 * 4. User Note template valid
 * 5. Zoom template valid
 * 6. Tokens valid
 * 7. No duplicate reasons
 * 8. Required fields present
 */
export function validateTemplateDraft(options) {
  const errors = [];
  const warnings = [];
  const checks = [];

  // Check 1: JSON valid
  let jsonPassed = true;
  let jsonMsg = "Valid JSON array of template options";
  if (!Array.isArray(options)) {
    jsonPassed = false;
    jsonMsg = "Templates must be a JSON array of option objects";
    errors.push(jsonMsg);
  } else if (options.length === 0) {
    jsonPassed = false;
    jsonMsg = "Template array cannot be empty";
    errors.push(jsonMsg);
  } else {
    for (let i = 0; i < options.length; i++) {
      const opt = options[i];
      if (!opt || typeof opt !== "object") {
        jsonPassed = false;
        jsonMsg = `Item #${i + 1} is not a valid JSON object`;
        errors.push(jsonMsg);
        break;
      }
    }
  }
  checks.push({ id: "jsonValid", label: "JSON valid", passed: jsonPassed, message: jsonMsg });

  if (!jsonPassed) {
    const remaining = [
      { id: "escalationCodesValid", label: "All escalation codes valid" },
      { id: "requiredReasonsExist", label: "Every required reason exists" },
      { id: "userNoteTemplateValid", label: "User Note template valid" },
      { id: "zoomTemplateValid", label: "Zoom template valid" },
      { id: "tokensValid", label: "Tokens valid" },
      { id: "noDuplicateReasons", label: "No duplicate reasons" },
      { id: "requiredFieldsPresent", label: "Required fields present" }
    ];
    remaining.forEach(item => {
      checks.push({ id: item.id, label: item.label, passed: false, message: "Blocked by invalid JSON structure" });
    });
    return { valid: false, checks, errors, warnings };
  }

  // Check 2: All escalation codes valid
  const seenCodes = new Set();
  let codesPassed = true;
  let codesMsg = `All ${options.length} escalation codes are unique and valid`;
  for (let i = 0; i < options.length; i++) {
    const opt = options[i];
    const code = String(opt.code || "").trim();
    if (!code || code.length < 2) {
      codesPassed = false;
      codesMsg = `Item #${i + 1} has invalid or missing escalation code: "${code}"`;
      errors.push(codesMsg);
      break;
    }
    const upper = code.toUpperCase();
    if (seenCodes.has(upper)) {
      codesPassed = false;
      codesMsg = `Duplicate escalation code "${code}" found at item #${i + 1}`;
      errors.push(codesMsg);
      break;
    }
    seenCodes.add(upper);
  }
  checks.push({ id: "escalationCodesValid", label: "All escalation codes valid", passed: codesPassed, message: codesMsg });

  // Check 3: Every required reason exists
  let reasonsPassed = true;
  let reasonsMsg = "Every option defines non-empty reasons and valid defaultReason";
  for (let i = 0; i < options.length; i++) {
    const opt = options[i];
    const code = opt.code || `Item #${i + 1}`;
    if (!Array.isArray(opt.reasons) || opt.reasons.length === 0) {
      reasonsPassed = false;
      reasonsMsg = `Option "${code}" has an empty reasons list`;
      errors.push(reasonsMsg);
      break;
    }
    const def = String(opt.defaultReason || "").trim();
    if (!def) {
      reasonsPassed = false;
      reasonsMsg = `Option "${code}" is missing defaultReason`;
      errors.push(reasonsMsg);
      break;
    }
    const exists = opt.reasons.some(r => String(r || "").trim().toLowerCase() === def.toLowerCase());
    if (!exists) {
      reasonsPassed = false;
      reasonsMsg = `Option "${code}" defaultReason "${def}" does not exist in its reasons list`;
      errors.push(reasonsMsg);
      break;
    }
  }
  checks.push({ id: "requiredReasonsExist", label: "Every required reason exists", passed: reasonsPassed, message: reasonsMsg });

  // Check 4: User Note template valid
  let notePassed = true;
  let noteMsg = "User Note templates are correctly defined across all options";
  for (let i = 0; i < options.length; i++) {
    const opt = options[i];
    const code = opt.code || `Item #${i + 1}`;
    const hasNotesText = typeof opt.userNotesText === "string";
    const hasNoteChoices = Array.isArray(opt.noteChoices) && opt.noteChoices.length > 0 && opt.noteChoices.every(c => typeof c.userNotesText === "string");
    const hasZoom = (typeof opt.zoomText === "string" && opt.zoomText.trim().length > 0) || (Array.isArray(opt.zoomChoices) && opt.zoomChoices.length > 0);

    if (!hasNotesText && !hasNoteChoices) {
      notePassed = false;
      noteMsg = `Option "${code}" is missing a valid User Note template definition`;
      errors.push(noteMsg);
      break;
    }
    const noteLen = (opt.userNotesText || "").trim().length + (opt.noteChoices ? opt.noteChoices.reduce((acc, c) => acc + (c.userNotesText || "").trim().length, 0) : 0);
    if (noteLen === 0 && !hasZoom) {
      notePassed = false;
      noteMsg = `Option "${code}" has empty User Notes and no Zoom template`;
      errors.push(noteMsg);
      break;
    }
  }
  checks.push({ id: "userNoteTemplateValid", label: "User Note template valid", passed: notePassed, message: noteMsg });

  // Check 5: Zoom template valid
  let zoomPassed = true;
  let zoomMsg = "Zoom templates are correctly defined across all options";
  for (let i = 0; i < options.length; i++) {
    const opt = options[i];
    const code = opt.code || `Item #${i + 1}`;
    const hasZoomText = typeof opt.zoomText === "string";
    const hasZoomChoices = Array.isArray(opt.zoomChoices) && opt.zoomChoices.length > 0 && opt.zoomChoices.every(c => typeof c.zoomText === "string");
    const hasNotes = (typeof opt.userNotesText === "string" && opt.userNotesText.trim().length > 0) || (Array.isArray(opt.noteChoices) && opt.noteChoices.length > 0);

    if (!hasZoomText && !hasZoomChoices) {
      zoomPassed = false;
      zoomMsg = `Option "${code}" is missing a valid Zoom template definition`;
      errors.push(zoomMsg);
      break;
    }
    const zoomLen = (opt.zoomText || "").trim().length + (opt.zoomChoices ? opt.zoomChoices.reduce((acc, c) => acc + (c.zoomText || "").trim().length, 0) : 0);
    if (zoomLen === 0 && !hasNotes) {
      zoomPassed = false;
      zoomMsg = `Option "${code}" has empty Zoom template and no User Notes template`;
      errors.push(zoomMsg);
      break;
    }
  }
  checks.push({ id: "zoomTemplateValid", label: "Zoom template valid", passed: zoomPassed, message: zoomMsg });

  // Check 6: Tokens valid
  let tokensPassed = true;
  let tokensMsg = "All template tokens conform to recognized placeholders";
  for (let i = 0; i < options.length; i++) {
    const opt = options[i];
    const code = opt.code || `Item #${i + 1}`;
    const texts = [opt.userNotesText, opt.zoomText];
    if (Array.isArray(opt.noteChoices)) opt.noteChoices.forEach(c => texts.push(c.userNotesText));
    if (Array.isArray(opt.zoomChoices)) opt.zoomChoices.forEach(c => texts.push(c.zoomText));

    for (const t of texts) {
      if (!t || typeof t !== "string") continue;
      // Check unclosed brackets
      const unclosed = t.match(/\[[A-Za-z0-9 _\-\/]+(?![^\]]*\])/g);
      if (unclosed) {
        tokensPassed = false;
        tokensMsg = `Option "${code}" contains potentially unclosed token bracket: "${unclosed[0]}"`;
        errors.push(tokensMsg);
        break;
      }
      // Check tokens
      const matches = t.match(/\[.*?\]/g) || [];
      for (const m of matches) {
        if (!ALLOWED_TOKENS.has(m)) {
          tokensPassed = false;
          tokensMsg = `Option "${code}" contains unrecognized token "${m}". Allowed: ${Array.from(ALLOWED_TOKENS).join(", ")}`;
          errors.push(tokensMsg);
          break;
        }
      }
      if (!tokensPassed) break;
    }
    if (!tokensPassed) break;
  }
  checks.push({ id: "tokensValid", label: "Tokens valid", passed: tokensPassed, message: tokensMsg });

  // Check 7: No duplicate reasons
  let dupReasonsPassed = true;
  let dupReasonsMsg = "No duplicate reasons found in any escalation option";
  for (let i = 0; i < options.length; i++) {
    const opt = options[i];
    const code = opt.code || `Item #${i + 1}`;
    if (!Array.isArray(opt.reasons)) continue;
    const s = new Set();
    for (const r of opt.reasons) {
      const clean = String(r || "").trim().toLowerCase();
      if (s.has(clean)) {
        dupReasonsPassed = false;
        dupReasonsMsg = `Option "${code}" contains duplicate reason: "${r}"`;
        errors.push(dupReasonsMsg);
        break;
      }
      s.add(clean);
    }
    if (!dupReasonsPassed) break;
  }
  checks.push({ id: "noDuplicateReasons", label: "No duplicate reasons", passed: dupReasonsPassed, message: dupReasonsMsg });

  // Check 8: Required fields present
  let reqPassed = true;
  let reqMsg = "All required fields (code, label, group, color, defaultReason, reasons) are present";
  const reqFields = ["code", "label", "group", "color", "defaultReason", "reasons"];
  for (let i = 0; i < options.length; i++) {
    const opt = options[i];
    const code = opt.code || `Item #${i + 1}`;
    for (const f of reqFields) {
      if (opt[f] === undefined || opt[f] === null || String(opt[f]).trim() === "") {
        reqPassed = false;
        reqMsg = `Option "${code}" is missing required field "${f}"`;
        errors.push(reqMsg);
        break;
      }
    }
    if (!reqPassed) break;
  }
  checks.push({ id: "requiredFieldsPresent", label: "Required fields present", passed: reqPassed, message: reqMsg });

  const allPassed = checks.every(c => c.passed);

  return {
    valid: allPassed,
    checks,
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
    validationChecks: validation.checks,
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
      validationChecks: validation.checks,
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

  // Strict 8-Point Validation Gate
  const validation = validateTemplateDraft(draft.options);
  if (!validation.valid) {
    const failedCheckLabels = validation.checks.filter(c => !c.passed).map(c => c.label);
    throw new AppError(
      `Cannot publish invalid draft. Failed checks: ${failedCheckLabels.join(", ")}. Details: ${validation.errors.join("; ")}`,
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
