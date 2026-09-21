/**
 * Authentication Middleware
 */
import { verifyAdminAuthHeader } from "../services/authService.js";
import { UnauthorizedError } from "../utils/errors.js";

/**
 * Authenticate incoming request as Admin
 */
export async function authenticateAdmin(request, env) {
  const url = new URL(request.url);
  const authHeader = request.headers.get("Authorization") || "";
  const directPass = request.headers.get("X-Admin-Password")
    || url.searchParams.get("key")
    || url.searchParams.get("password")
    || "";

  const isValid = await verifyAdminAuthHeader(env, authHeader, directPass);
  if (!isValid) {
    throw new UnauthorizedError("Unauthorized: Admin credentials required", "unauthorized");
  }
  return { role: "admin" };
}

/**
 * Optional authentication: returns { role: 'admin' } or { role: 'anonymous' }
 */
export async function checkAuth(request, env) {
  const url = new URL(request.url);
  const authHeader = request.headers.get("Authorization") || "";
  const directPass = request.headers.get("X-Admin-Password")
    || url.searchParams.get("key")
    || url.searchParams.get("password")
    || "";

  const isValid = await verifyAdminAuthHeader(env, authHeader, directPass);
  return isValid ? { role: "admin" } : { role: "anonymous" };
}
