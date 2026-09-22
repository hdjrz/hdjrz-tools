/**
 * Agent Activity Routes (/api/agents/* and legacy /admin/api/active-users)
 */
import { parseJsonBody } from "../middleware/validation.js";
import { requireAdmin } from "../middleware/authorization.js";
import { getActiveAgents, getAgentRoster, recordAgentHeartbeat, removeAgentPresence } from "../services/agentService.js";
import { jsonSuccess } from "../utils/response.js";

export async function handleAgentRoutes(request, env, url) {
  const method = request.method;
  const path = url.pathname;

  // GET /api/agents/active or legacy GET /admin/api/active-users
  if (method === "GET" && (path === "/api/agents/active" || path === "/admin/api/active-users")) {
    await requireAdmin(request, env);
    const roster = await getAgentRoster(env);
    return jsonSuccess({
      users: roster.activeUsers,
      allAgents: roster.allAgents,
      count: roster.activeUsers.length
    });
  }

  // POST /api/agents/heartbeat
  if (method === "POST" && path === "/api/agents/heartbeat") {
    const body = await parseJsonBody(request);
    const activeList = await recordAgentHeartbeat(env, {
      agent: body.agent,
      version: body.version,
      devId: body.devId,
      key: body.key
    });
    return jsonSuccess({ totalActive: activeList.length });
  }

  // POST /api/agents/offline (Client tab close or signout notification)
  if (method === "POST" && path === "/api/agents/offline") {
    const body = await parseJsonBody(request);
    await removeAgentPresence(env, {
      agent: body.agent,
      devId: body.devId,
      key: body.key
    });
    return jsonSuccess({ ok: true });
  }

  // POST /api/agents/disconnect (Admin force-disconnects agent or clears ghost session)
  if (method === "POST" && (path === "/api/agents/disconnect" || path === "/admin/api/agents/disconnect")) {
    await requireAdmin(request, env);
    const body = await parseJsonBody(request);
    await removeAgentPresence(env, {
      agent: body.agent,
      devId: body.devId,
      key: body.key
    });
    const roster = await getAgentRoster(env);
    return jsonSuccess({
      ok: true,
      users: roster.activeUsers,
      allAgents: roster.allAgents,
      count: roster.activeUsers.length
    });
  }

  return null;
}
