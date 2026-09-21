/**
 * Support & Bug Report Routes (/api/support/* and /admin/api/support/*)
 */
import { parseJsonBody } from "../middleware/validation.js";
import { requireAdmin } from "../middleware/authorization.js";
import { verifyAdminAuthHeader } from "../services/authService.js";
import { UnauthorizedError } from "../utils/errors.js";
import {
  createTicket,
  listTickets,
  getTicketDetail,
  addReplyToTicket,
  updateTicketStatus,
  deleteTicket,
  getAgentTickets,
  markAgentTicketsRead,
  getD1Health
} from "../services/supportService.js";
import { jsonSuccess } from "../utils/response.js";

export async function handleSupportRoutes(request, env, url, ctx = null) {
  const method = request.method;
  const path = url.pathname;

  // =========================================================================
  // 1. Diagnostic & Health Endpoints
  // =========================================================================

  // GET /api/support/health - Check D1 database status & tables
  if (method === "GET" && path === "/api/support/health") {
    const health = await getD1Health(env);
    return jsonSuccess({
      ok: true,
      d1: health,
      kvActive: !!env.LICENSES,
      timestamp: Date.now()
    });
  }

  // =========================================================================
  // 2. Client Endpoints (Agents & In-Extension Admin)
  // =========================================================================

  // POST /api/support/ticket - Create a new support/bug report or direct admin message
  if (method === "POST" && path === "/api/support/ticket") {
    const body = await parseJsonBody(request);
    const authHeader = request.headers.get("Authorization") || "";
    const directPass = request.headers.get("X-Admin-Password") || body.key || (url.searchParams.get("key")) || "";
    const isAdmin = (body.role === "admin") && (await verifyAdminAuthHeader(env, authHeader, directPass));

    const ticket = await createTicket(env, {
      agentName: body.agentName,
      deviceId: body.deviceId,
      scriptVersion: body.scriptVersion,
      pageUrl: body.pageUrl,
      text: body.text,
      imageBase64: body.imageBase64,
      role: body.role,
      senderRole: isAdmin ? "admin" : "agent",
      senderName: isAdmin ? (body.adminName || "Jetro (Admin)") : body.agentName
    });
    return jsonSuccess({ message: "Ticket submitted successfully!", ticket });
  }

  // GET /api/support/my-tickets - Check active tickets and unread count
  if (method === "GET" && path === "/api/support/my-tickets") {
    const deviceId = String(url.searchParams.get("dev") || "").trim();
    const agentName = String(url.searchParams.get("agent") || "").trim();
    const role = String(url.searchParams.get("role") || "").trim().toLowerCase();
    const key = String(url.searchParams.get("key") || "").trim();

    const authHeader = request.headers.get("Authorization") || "";
    const directPass = request.headers.get("X-Admin-Password") || key || "";
    const isAdmin = (role === "admin") && (await verifyAdminAuthHeader(env, authHeader, directPass));

    if (isAdmin) {
      const data = await listTickets(env, { status: "all", limit: 50 });
      const unreadCount = (data.tickets || []).filter(t => t.unreadAdmin).length;
      return jsonSuccess({
        isAdmin: true,
        tickets: data.tickets || [],
        unreadCount
      });
    }

    const res = await getAgentTickets(env, deviceId, agentName);
    return jsonSuccess({ isAdmin: false, ...res });
  }

  // GET /api/support/ticket/:id - View single ticket thread
  if (method === "GET" && path.startsWith("/api/support/ticket/")) {
    const ticketId = path.replace("/api/support/ticket/", "").trim();
    const deviceId = String(url.searchParams.get("dev") || "").trim();
    const agentName = String(url.searchParams.get("agent") || "").trim();
    const role = String(url.searchParams.get("role") || "").trim().toLowerCase();
    const key = String(url.searchParams.get("key") || "").trim();

    const authHeader = request.headers.get("Authorization") || "";
    const directPass = request.headers.get("X-Admin-Password") || key || "";
    const isAdmin = (role === "admin") && (await verifyAdminAuthHeader(env, authHeader, directPass));

    const ticket = await getTicketDetail(env, ticketId, isAdmin, !isAdmin, ctx);
    return jsonSuccess({ ticket, isAdmin });
  }

  // POST /api/support/ticket/:id/reply - Reply to a ticket
  if (method === "POST" && path.match(/^\/api\/support\/ticket\/[^\/]+\/reply$/)) {
    const ticketId = path.split("/")[4];
    const body = await parseJsonBody(request);
    const role = String(body.role || url.searchParams.get("role") || "").trim().toLowerCase();
    const key = String(body.key || url.searchParams.get("key") || "").trim();

    const authHeader = request.headers.get("Authorization") || "";
    const directPass = request.headers.get("X-Admin-Password") || key || "";
    const isAdmin = (role === "admin") && (await verifyAdminAuthHeader(env, authHeader, directPass));

    const senderRole = isAdmin ? "admin" : "agent";
    const defaultName = isAdmin ? "Jetro (Admin)" : (body.agentName || "Agent");

    const ticket = await addReplyToTicket(env, ticketId, {
      sender: senderRole,
      senderName: body.senderName || defaultName,
      text: body.text,
      imageBase64: body.imageBase64
    });
    return jsonSuccess({ message: "Reply sent!", ticket, isAdmin });
  }

  // POST /api/support/ticket/:id/status - Update status from extension (Admin)
  if (method === "POST" && path.match(/^\/api\/support\/ticket\/[^\/]+\/status$/)) {
    const ticketId = path.split("/")[4];
    const body = await parseJsonBody(request);
    const key = String(body.key || url.searchParams.get("key") || "").trim();
    const authHeader = request.headers.get("Authorization") || "";
    const directPass = request.headers.get("X-Admin-Password") || key || "";
    const isAdmin = await verifyAdminAuthHeader(env, authHeader, directPass);
    if (!isAdmin) throw new UnauthorizedError("Admin authorization required", "unauthorized");

    const ticket = await updateTicketStatus(env, ticketId, body.status);
    return jsonSuccess({ message: `Status updated to '${body.status}'`, ticket });
  }

  // DELETE /api/support/ticket/:id - Delete ticket from extension (Admin)
  if (method === "DELETE" && path.startsWith("/api/support/ticket/")) {
    const ticketId = path.replace("/api/support/ticket/", "").trim();
    const key = String(url.searchParams.get("key") || "").trim();
    const authHeader = request.headers.get("Authorization") || "";
    const directPass = request.headers.get("X-Admin-Password") || key || "";
    const isAdmin = await verifyAdminAuthHeader(env, authHeader, directPass);
    if (!isAdmin) throw new UnauthorizedError("Admin authorization required", "unauthorized");

    const result = await deleteTicket(env, ticketId);
    return jsonSuccess(result);
  }

  // =========================================================================
  // 2. Admin Portal Endpoints
  // =========================================================================

  // GET /admin/api/support/tickets - Admin view all tickets
  if (method === "GET" && (path === "/admin/api/support/tickets" || path === "/api/admin/support/tickets")) {
    await requireAdmin(request, env);
    const status = (url.searchParams.get("status") || "").trim().toLowerCase();
    const search = (url.searchParams.get("search") || "").trim();
    const limit = Math.min(parseInt(url.searchParams.get("limit"), 10) || 50, 100);
    const offset = parseInt(url.searchParams.get("offset"), 10) || 0;

    const data = await listTickets(env, { status, search, limit, offset });
    return jsonSuccess(data);
  }

  // GET /admin/api/support/ticket/:id - Admin view single ticket with screenshot
  if (method === "GET" && path.startsWith("/admin/api/support/ticket/")) {
    await requireAdmin(request, env);
    const ticketId = path.replace("/admin/api/support/ticket/", "").trim();
    const ticket = await getTicketDetail(env, ticketId, true, false, ctx);
    return jsonSuccess({ ticket });
  }

  // POST /admin/api/support/ticket/:id/reply - Admin reply to an agent's ticket
  if (method === "POST" && path.match(/^\/admin\/api\/support\/ticket\/[^\/]+\/reply$/)) {
    await requireAdmin(request, env);
    const ticketId = path.split("/")[5];
    const body = await parseJsonBody(request);
    const ticket = await addReplyToTicket(env, ticketId, {
      sender: "admin",
      senderName: body.senderName || "Admin",
      text: body.text,
      imageBase64: body.imageBase64
    });
    return jsonSuccess({ message: "Admin reply sent!", ticket });
  }

  // POST /admin/api/support/ticket/:id/status - Admin update ticket status
  if (method === "POST" && path.match(/^\/admin\/api\/support\/ticket\/[^\/]+\/status$/)) {
    await requireAdmin(request, env);
    const ticketId = path.split("/")[5];
    const body = await parseJsonBody(request);
    const ticket = await updateTicketStatus(env, ticketId, body.status);
    return jsonSuccess({ message: `Ticket status set to '${body.status}'`, ticket });
  }

  // DELETE /admin/api/support/ticket/:id - Admin permanently delete a ticket
  if (method === "DELETE" && path.startsWith("/admin/api/support/ticket/")) {
    await requireAdmin(request, env);
    const ticketId = path.replace("/admin/api/support/ticket/", "").trim();
    const result = await deleteTicket(env, ticketId);
    return jsonSuccess(result);
  }

  return null;
}
