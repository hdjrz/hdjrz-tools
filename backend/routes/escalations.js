/**
 * Escalation Library Routes (/api/escalations/*)
 * Managed model for escalation definitions (Phase 9)
 */
import { parseJsonBody } from "../middleware/validation.js";
import { requireAdmin } from "../middleware/authorization.js";
import {
  getEscalationLibrary,
  getEscalationByCode,
  createEscalation,
  updateEscalation,
  toggleEscalationStatus,
  deleteEscalation,
  resetToFactory
} from "../services/escalationService.js";
import { jsonSuccess } from "../utils/response.js";

export async function handleEscalationRoutes(request, env, url) {
  const method = request.method;
  const path = url.pathname;

  if (!path.startsWith("/api/escalations")) {
    return null;
  }

  // 1. GET /api/escalations (supports ?status=active|inactive|all)
  if (method === "GET" && path === "/api/escalations") {
    const status = url.searchParams.get("status") || "";
    const res = await getEscalationLibrary(env, { status });
    return jsonSuccess(res, 200, {
      "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0"
    });
  }

  // 2. POST /api/escalations/reset-factory
  if (method === "POST" && path === "/api/escalations/reset-factory") {
    await requireAdmin(request, env);
    const res = await resetToFactory(env, "admin");
    return jsonSuccess({
      message: "Reset escalation library to factory defaults successfully",
      count: res.count,
      escalations: res.escalations
    });
  }

  // 3. POST /api/escalations (Create new escalation)
  if (method === "POST" && path === "/api/escalations") {
    await requireAdmin(request, env);
    const body = await parseJsonBody(request);
    const created = await createEscalation(env, body, "admin");
    return jsonSuccess(created, 201);
  }

  // Subpath routing: /api/escalations/:code and /api/escalations/:code/*
  const subPath = path.slice("/api/escalations/".length);
  if (!subPath) return null;

  // 4. POST /api/escalations/:code/toggle-status
  if (subPath.endsWith("/toggle-status")) {
    const code = decodeURIComponent(subPath.slice(0, -"/toggle-status".length));
    if (method === "POST") {
      await requireAdmin(request, env);
      const updated = await toggleEscalationStatus(env, code, "admin");
      return jsonSuccess({
        message: `Escalation "${updated.code}" status changed to ${updated.status}`,
        escalation: updated
      });
    }
  }

  const code = decodeURIComponent(subPath);

  // 5. GET /api/escalations/:code
  if (method === "GET") {
    const item = await getEscalationByCode(env, code);
    return jsonSuccess(item, 200, {
      "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0"
    });
  }

  // 6. PUT or PATCH /api/escalations/:code
  if (method === "PUT" || method === "PATCH") {
    await requireAdmin(request, env);
    const body = await parseJsonBody(request);
    const updated = await updateEscalation(env, code, body, "admin");
    return jsonSuccess(updated);
  }

  // 7. DELETE /api/escalations/:code
  if (method === "DELETE") {
    await requireAdmin(request, env);
    const deleted = await deleteEscalation(env, code, "admin");
    return jsonSuccess(deleted);
  }

  return null;
}
