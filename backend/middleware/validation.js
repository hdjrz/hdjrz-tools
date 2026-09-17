/**
 * Request Validation Middleware & Helpers
 */
import { AppError } from "../utils/errors.js";

/**
 * Safely parse JSON from incoming request body
 */
export async function parseJsonBody(request) {
  try {
    const text = await request.text();
    if (!text || !text.trim()) return {};
    return JSON.parse(text);
  } catch (err) {
    throw new AppError("Invalid JSON request body", 400, "invalid_json");
  }
}

/**
 * Validate that specified fields exist and are non-empty
 */
export function validateRequired(data = {}, fields = []) {
  for (const field of fields) {
    const val = data[field];
    if (val === undefined || val === null || (typeof val === "string" && val.trim() === "")) {
      throw new AppError(`Missing required field: ${field}`, 400, "missing_field");
    }
  }
}

/**
 * Helper to safely sanitize a string
 */
export function sanitizeString(val, fallback = "") {
  return typeof val === "string" ? val.trim() : fallback;
}
