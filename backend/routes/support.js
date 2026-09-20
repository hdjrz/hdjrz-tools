/**
 * Support & Bug Report Routes (/api/support/* and /admin/api/support/*)
 */
import { parseJsonBody } from "../middleware/validation.js";
import { requireAdmin } from "../middleware/authorization.js";
import {
  createTicket,
  listTickets,
  getTicketDetail,
  addReplyToTicket,
  updateTicketStatus,
  deleteTicket,
  getAgentTickets,
  markAgentTicketsRead
} from "../services/supportService.js";
import { jsonSuccess } from "../utils/response.js";

export async function handleSupportRoutes(request, env, url) {
  const method = request.method;
  const path = url.pathname;

  // =========================================================================
  // 1. Agent Client Endpoints
  // =========================================================================

  // POST /api/support/ticket - Create a new support/bug report
  if (method === "POST" && path === "/api/support/ticket") {
    const body = await parseJsonBody(request);
    const ticket = await createTicket(env, {
      agentName: body.agentName,
      deviceId: body.deviceId,
      scriptVersion: body.scriptVersion,
      pageUrl: body.pageUrl,
      text: body.text,
      imageBase64: body.imageBase64,
      role: body.role
    });
    return jsonSuccess({ message: "Ticket submitted successfully!", ticket });
  }

  // GET /api/support/my-tickets - Check agent's active tickets and unread count
  if (method === "GET" && path === "/api/support/my-tickets") {
    const deviceId = String(url.searchParams.get("dev") || "").trim();
    const agentName = String(url.searchParams.get("agent") || "").trim();
    const res = await getAgentTickets(env, deviceId, agentName);
    return jsonSuccess(res);
  }

  // GET /api/support/ticket/:id - Agent view single ticket thread
  if (method === "GET" && path.startsWith("/api/support/ticket/")) {
    const ticketId = path.replace("/api/support/ticket/", "").trim();
    const deviceId = String(url.searchParams.get("dev") || "").trim();
    const agentName = String(url.searchParams.get("agent") || "").trim();
    const ticket = await getTicketDetail(env, ticketId, false);
    // Mark as read for this agent
    await markAgentTicketsRead(env, deviceId, agentName, ticketId);
    return jsonSuccess({ ticket });
  }

  // POST /api/support/ticket/:id/reply - Agent reply to a ticket
  if (method === "POST" && path.match(/^\/api\/support\/ticket\/[^\/]+\/reply$/)) {
    const ticketId = path.split("/")[4];
    const body = await parseJsonBody(request);
    const ticket = await addReplyToTicket(env, ticketId, {
      sender: "agent",
      senderName: body.senderName || "Agent",
      text: body.text,
      imageBase64: body.imageBase64
    });
    return jsonSuccess({ message: "Reply sent!", ticket });
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
    const ticket = await getTicketDetail(env, ticketId, true);
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
