/**
 * Agent Activity Routes (/api/agents/* and legacy /admin/api/active-users)
 */
import { parseJsonBody } from "../middleware/validation.js";
import { requireAdmin } from "../middleware/authorization.js";
import { getActiveAgents, recordAgentHeartbeat } from "../services/agentService.js";
import { jsonSuccess } from "../utils/response.js";

export async function handleAgentRoutes(request, env, url) {
  const method = request.method;
  const path = url.pathname;

  // GET /api/agents/active or legacy GET /admin/api/active-users
  if (method === "GET" && (path === "/api/agents/active" || path === "/admin/api/active-users")) {
    await requireAdmin(request, env);
    const users = await getActiveAgents(env);
    return jsonSuccess({ users, count: users.length });
  }

  // POST /api/agents/heartbeat
  if (method === "POST" && path === "/api/agents/heartbeat") {
    const body = await parseJsonBody(request);
    const activeList = await recordAgentHeartbeat(env, {
      agent: body.agent,
      version: body.version,
      devId: body.devId
    });
    return jsonSuccess({ totalActive: activeList.length });
  }

  return null;
}
