/**
 * Authentication Routes (/api/auth/* and legacy /admin/api/auth)
 */
import { parseJsonBody, validateRequired } from "../middleware/validation.js";
import { requireAdmin } from "../middleware/authorization.js";
import { loginAdmin, changeAdminPassword, verifyAdminAuthHeader } from "../services/authService.js";
import { jsonSuccess, jsonError } from "../utils/response.js";

export async function handleAuthRoutes(request, env, url) {
  const method = request.method;
  const path = url.pathname;

  // POST /api/auth/login or legacy POST /admin/api/auth
  if (method === "POST" && (path === "/api/auth/login" || path === "/admin/api/auth")) {
    const body = await parseJsonBody(request);
    const pass = body.password || body.pass || body.key || "";
    if (!pass) return jsonError("missing_password", "Password or admin key is required", 400);
    const res = await loginAdmin(env, pass);
    return jsonSuccess({ token: res.token, role: res.role });
  }

  // POST /api/auth/verify
  if (method === "POST" && path === "/api/auth/verify") {
    const authHeader = request.headers.get("Authorization") || "";
    const directPass = request.headers.get("X-Admin-Password") || "";
    const isValid = await verifyAdminAuthHeader(env, authHeader, directPass);
    if (!isValid) return jsonError("unauthorized", "Invalid or expired session token", 401);
    return jsonSuccess({ valid: true, role: "admin" });
  }

  // POST /api/auth/change-password or legacy POST /admin/api/change-password
  if (method === "POST" && (path === "/api/auth/change-password" || path === "/admin/api/change-password")) {
    await requireAdmin(request, env);
    const body = await parseJsonBody(request);
    validateRequired(body, ["newPassword"]);
    await changeAdminPassword(env, body.newPassword);
    return jsonSuccess({ message: "Master password updated successfully" });
  }

  return null;
}
