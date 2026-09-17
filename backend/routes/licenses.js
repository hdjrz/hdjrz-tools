/**
 * License Routes (/api/licenses/* and legacy endpoints)
 */
import { parseJsonBody, validateRequired } from "../middleware/validation.js";
import { requireAdmin } from "../middleware/authorization.js";
import {
  listLicenses,
  createLicense,
  activateOrVerifyLicense,
  resetDeviceBinding,
  toggleFreezeLicense,
  deleteLicense
} from "../services/licenseService.js";
import { jsonSuccess } from "../utils/response.js";

export async function handleLicenseRoutes(request, env, url) {
  const method = request.method;
  const path = url.pathname;

  // GET /api/licenses or legacy GET /admin/api/licenses
  if (method === "GET" && (path === "/api/licenses" || path === "/admin/api/licenses")) {
    await requireAdmin(request, env);
    const licenses = await listLicenses(env);
    return jsonSuccess({ licenses, count: licenses.length });
  }

  // POST /api/licenses/create or POST /api/licenses or legacy POST /admin/api/licenses/create
  if (method === "POST" && (
    path === "/api/licenses" ||
    path === "/api/licenses/create" ||
    path === "/admin/api/licenses/create"
  )) {
    await requireAdmin(request, env);
    const body = await parseJsonBody(request);
    const res = await createLicense(env, { role: body.role, owner: body.owner });
    return jsonSuccess({ key: res.key, license: res.license });
  }

  // POST /api/licenses/reset-device or legacy POST /admin/api/licenses/reset-device
  if (method === "POST" && (
    path === "/api/licenses/reset-device" ||
    path === "/admin/api/licenses/reset-device"
  )) {
    await requireAdmin(request, env);
    const body = await parseJsonBody(request);
    validateRequired(body, ["key"]);
    const res = await resetDeviceBinding(env, body.key);
    return jsonSuccess(res);
  }

  // POST /api/licenses/toggle-freeze or legacy POST /admin/api/licenses/toggle-freeze
  if (method === "POST" && (
    path === "/api/licenses/toggle-freeze" ||
    path === "/admin/api/licenses/toggle-freeze"
  )) {
    await requireAdmin(request, env);
    const body = await parseJsonBody(request);
    validateRequired(body, ["key"]);
    const res = await toggleFreezeLicense(env, body.key);
    return jsonSuccess(res);
  }

  // DELETE /api/licenses or POST /api/licenses/delete or legacy POST /admin/api/licenses/delete
  if ((method === "DELETE" && path.startsWith("/api/licenses/")) ||
      (method === "POST" && (path === "/api/licenses/delete" || path === "/admin/api/licenses/delete"))) {
    await requireAdmin(request, env);
    let key = "";
    if (method === "DELETE") {
      key = path.replace("/api/licenses/", "").trim();
    } else {
      const body = await parseJsonBody(request);
      key = body.key;
    }
    const res = await deleteLicense(env, key);
    return jsonSuccess(res);
  }

  // POST /api/licenses/activate or POST /api/licenses/verify or legacy root POST /
  if (method === "POST" && (
    path === "/api/licenses/activate" ||
    path === "/api/licenses/verify" ||
    path === "/"
  )) {
    const body = await parseJsonBody(request);
    validateRequired(body, ["key", "deviceId"]);
    const res = await activateOrVerifyLicense(env, {
      key: body.key,
      deviceId: body.deviceId,
      action: body.action,
      version: body.version
    });
    return jsonSuccess(res);
  }

  return null;
}
