/**
 * Agent-to-Admin Support & Bug Telemetry Service
 * Supports Cloudflare D1 (SQL) for zero-latency, strongly-consistent chat,
 * with automatic fallback to Cloudflare KV (env.LICENSES).
 */
import { AppError, NotFoundError, ValidationError } from "../utils/errors.js";

const INDEX_KEY = "SUPPORT_TICKETS_INDEX";
const MAX_STORED_TICKETS = 200;

// =========================================================================
// Cloudflare D1 SQL Schema & Initialization
// =========================================================================

let d1Initialized = false;

export async function ensureD1Tables(env) {
  if (!env.DB || d1Initialized) return;
  try {
    // 1. Create support_tickets table
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS support_tickets (
        id TEXT PRIMARY KEY,
        agent_name TEXT,
        device_id TEXT,
        role TEXT,
        script_version TEXT,
        page_url TEXT,
        status TEXT DEFAULT 'open',
        created_at INTEGER,
        updated_at INTEGER,
        last_message TEXT,
        unread_admin INTEGER DEFAULT 1,
        unread_agent INTEGER DEFAULT 0,
        has_image INTEGER DEFAULT 0
      )
    `).run();

    // 2. Create support_messages table
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS support_messages (
        id TEXT PRIMARY KEY,
        ticket_id TEXT NOT NULL,
        sender TEXT NOT NULL,
        sender_name TEXT,
        text TEXT,
        image TEXT,
        created_at INTEGER NOT NULL
      )
    `).run();

    // 3. Create indexes safely
    try { await env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_tickets_updated ON support_tickets(updated_at DESC)`).run(); } catch (_) {}
    try { await env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_tickets_device ON support_tickets(device_id)`).run(); } catch (_) {}
    try { await env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_tickets_agent ON support_tickets(agent_name)`).run(); } catch (_) {}
    try { await env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_msgs_ticket ON support_messages(ticket_id, created_at ASC)`).run(); } catch (_) {}

    d1Initialized = true;
  } catch (err) {
    console.warn("[supportService] D1 table initialization warning:", err.message);
  }
}

export async function getD1Health(env) {
  if (!env.DB) {
    return { status: "no_binding", bound: false };
  }
  try {
    await ensureD1Tables(env);
    const tablesRes = await env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    const tables = (tablesRes.results || []).map(r => r.name);
    let ticketCount = 0;
    let messageCount = 0;
    try {
      const tc = await env.DB.prepare("SELECT count(*) as count FROM support_tickets").first();
      ticketCount = tc ? tc.count : 0;
    } catch (_) {}
    try {
      const mc = await env.DB.prepare("SELECT count(*) as count FROM support_messages").first();
      messageCount = mc ? mc.count : 0;
    } catch (_) {}
    return {
      status: "connected",
      bound: true,
      tables,
      ticketCount,
      messageCount
    };
  } catch (err) {
    return {
      status: "error",
      bound: true,
      error: err.message || String(err)
    };
  }
}

// =========================================================================
// KV Fallback Helpers
// =========================================================================

export async function getTicketsIndex(env) {
  try {
    const raw = await env.LICENSES.get(INDEX_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch (e) {
    return [];
  }
}

async function saveTicketsIndex(env, index) {
  const trimmed = index.slice(0, MAX_STORED_TICKETS);
  await env.LICENSES.put(INDEX_KEY, JSON.stringify(trimmed));
}

// =========================================================================
// Unified Ticket & Chat Operations (D1 with KV Fallback)
// =========================================================================

/**
 * Create a new support / bug report ticket from an agent
 */
export async function createTicket(env, {
  agentName = "Staff Agent",
  deviceId = "",
  scriptVersion = "1.0.0",
  pageUrl = "",
  text = "",
  imageBase64 = null,
  role = "guest"
} = {}) {
  const cleanText = String(text || "").trim();
  if (!cleanText && !imageBase64) {
    throw new ValidationError("Message text or a screenshot is required.", "missing_content");
  }

  const now = Date.now();
  const id = `tk_${now}_${Math.random().toString(36).slice(2, 6)}`;
  const firstMsgId = `msg_${now}_1`;
  const lastMsg = cleanText ? cleanText.slice(0, 120) : "📷 [Screenshot Attached]";

  const firstMsg = {
    id: firstMsgId,
    sender: "agent",
    senderName: agentName,
    text: cleanText,
    image: imageBase64 || null,
    timestamp: now
  };

  const ticket = {
    id,
    agentName,
    deviceId,
    role,
    scriptVersion,
    pageUrl: pageUrl.slice(0, 500),
    status: "open",
    createdAt: now,
    updatedAt: now,
    messages: [firstMsg]
  };

  // Primary: Cloudflare D1 (Immediate Read-After-Write Consistency)
  if (env.DB) {
    try {
      await ensureD1Tables(env);
      await env.DB.prepare(`
        INSERT INTO support_tickets (id, agent_name, device_id, role, script_version, page_url, status, created_at, updated_at, last_message, unread_admin, unread_agent, has_image)
        VALUES (?, ?, ?, ?, ?, ?, 'open', ?, ?, ?, 1, 0, ?)
      `).bind(id, agentName, deviceId, role, scriptVersion, pageUrl.slice(0, 500), now, now, lastMsg, imageBase64 ? 1 : 0).run();

      await env.DB.prepare(`
        INSERT INTO support_messages (id, ticket_id, sender, sender_name, text, image, created_at)
        VALUES (?, ?, 'agent', ?, ?, ?, ?)
      `).bind(firstMsgId, id, agentName, cleanText, imageBase64 || null, now).run();
    } catch (err) {
      console.warn("[supportService] D1 createTicket error, falling back to KV:", err.message);
    }
  }

  // Backup / Fallback: Cloudflare KV
  try {
    await env.LICENSES.put(`TICKET_${id}`, JSON.stringify(ticket));
    const summary = {
      id,
      agentName,
      deviceId,
      scriptVersion,
      pageUrl: pageUrl.slice(0, 150),
      status: "open",
      createdAt: now,
      updatedAt: now,
      lastMessage: lastMsg,
      unreadAdmin: true,
      unreadAgent: false,
      hasImage: !!imageBase64
    };
    const index = await getTicketsIndex(env);
    index.unshift(summary);
    await saveTicketsIndex(env, index);
  } catch (err) {
    if (!env.DB) throw err;
  }

  return ticket;
}

/**
 * Retrieve full ticket details including conversation messages and screenshot
 */
export async function getTicketDetail(env, ticketId, markAdminRead = false, markAgentRead = false) {
  // 1. Try D1 if bound
  if (env.DB) {
    try {
      await ensureD1Tables(env);
      const ticketRow = await env.DB.prepare(`SELECT * FROM support_tickets WHERE id = ?`).bind(ticketId).first();
      if (ticketRow) {
        // Fast conditional unread reset: ONLY execute UPDATE if unread was actually set!
        if (markAdminRead && ticketRow.unread_admin) {
          await env.DB.prepare(`UPDATE support_tickets SET unread_admin = 0 WHERE id = ?`).bind(ticketId).run();
          ticketRow.unread_admin = 0;
        }
        if (markAgentRead && ticketRow.unread_agent) {
          await env.DB.prepare(`UPDATE support_tickets SET unread_agent = 0 WHERE id = ?`).bind(ticketId).run();
          ticketRow.unread_agent = 0;
        }

        const msgRows = await env.DB.prepare(`SELECT * FROM support_messages WHERE ticket_id = ? ORDER BY created_at ASC`).bind(ticketId).all();
        const messages = (msgRows.results || []).map(r => ({
          id: r.id,
          sender: r.sender,
          senderName: r.sender_name,
          text: r.text || "",
          image: r.image || null,
          timestamp: r.created_at
        }));

        return {
          id: ticketRow.id,
          agentName: ticketRow.agent_name,
          deviceId: ticketRow.device_id,
          role: ticketRow.role,
          scriptVersion: ticketRow.script_version,
          pageUrl: ticketRow.page_url,
          status: ticketRow.status,
          createdAt: ticketRow.created_at,
          updatedAt: ticketRow.updated_at,
          messages,
          storage: "d1"
        };
      }
    } catch (err) {
      console.warn("[supportService] D1 getTicketDetail warning:", err.message);
    }
  }

  // 2. KV Fallback
  const raw = await env.LICENSES.get(`TICKET_${ticketId}`);
  if (!raw) {
    throw new NotFoundError(`Ticket '${ticketId}' not found`, "ticket_not_found");
  }

  const ticket = JSON.parse(raw);
  ticket.storage = "kv";

  if (markAdminRead && ticket.unreadAdmin) {
    ticket.unreadAdmin = false;
  }
  if (markAgentRead && ticket.unreadAgent) {
    ticket.unreadAgent = false;
  }

  return ticket;
}

/**
 * Append a reply message to an existing ticket
 */
export async function addReplyToTicket(env, ticketId, {
  sender = "agent", // 'agent' or 'admin'
  senderName = "Staff",
  text = "",
  imageBase64 = null
} = {}) {
  const cleanText = String(text || "").trim();
  if (!cleanText && !imageBase64) {
    throw new ValidationError("Reply text or screenshot is required", "empty_reply");
  }

  const now = Date.now();
  const newMsgId = `msg_${now}_${Math.random().toString(36).slice(2, 5)}`;
  const nextStatus = sender === "agent" ? "open" : undefined;
  const lastMsg = cleanText ? cleanText.slice(0, 120) : "📷 [Screenshot Attached]";

  // 1. Primary: Cloudflare D1
  if (env.DB) {
    try {
      await ensureD1Tables(env);
      const ticketRow = await env.DB.prepare(`SELECT id, status FROM support_tickets WHERE id = ?`).bind(ticketId).first();
      if (ticketRow) {
        const effectiveStatus = nextStatus || ticketRow.status;
        const unreadAdmin = sender === "agent" ? 1 : 0;
        const unreadAgent = sender === "admin" ? 1 : 0;

        // Atomically batch insert message and update ticket in ONE single round-trip
        const stmtInsert = env.DB.prepare(`
          INSERT INTO support_messages (id, ticket_id, sender, sender_name, text, image, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).bind(newMsgId, ticketId, sender, senderName, cleanText, imageBase64 || null, now);

        const stmtUpdate = env.DB.prepare(`
          UPDATE support_tickets
          SET updated_at = ?, status = ?, last_message = ?, unread_admin = ?, unread_agent = ?, has_image = CASE WHEN ? IS NOT NULL THEN 1 ELSE has_image END
          WHERE id = ?
        `).bind(now, effectiveStatus, lastMsg, unreadAdmin, unreadAgent, imageBase64 || null, ticketId);

        await env.DB.batch([stmtInsert, stmtUpdate]);

        return await getTicketDetail(env, ticketId, false, false);
      }
    } catch (err) {
      console.warn("[supportService] D1 addReplyToTicket error, falling back to KV:", err.message);
    }
  }

  // 2. KV Fallback
  const raw = await env.LICENSES.get(`TICKET_${ticketId}`);
  if (!raw) {
    throw new NotFoundError(`Ticket '${ticketId}' not found`, "ticket_not_found");
  }

  const ticket = JSON.parse(raw);
  const newMsg = {
    id: newMsgId,
    sender,
    senderName,
    text: cleanText,
    image: imageBase64 || null,
    timestamp: now
  };

  ticket.messages.push(newMsg);
  ticket.updatedAt = now;
  if (sender === "agent") {
    ticket.status = "open";
  }

  await env.LICENSES.put(`TICKET_${ticketId}`, JSON.stringify(ticket));

  // Update summary in index
  const index = await getTicketsIndex(env);
  const summaryIdx = index.findIndex(t => t.id === ticketId);
  if (summaryIdx >= 0) {
    const s = index[summaryIdx];
    s.updatedAt = now;
    s.lastMessage = lastMsg;
    s.status = ticket.status;
    if (sender === "admin") {
      s.unreadAgent = true;
      s.unreadAdmin = false;
    } else {
      s.unreadAdmin = true;
      s.unreadAgent = false;
    }
    index.splice(summaryIdx, 1);
    index.unshift(s);
    await saveTicketsIndex(env, index);
  }

  return ticket;
}

async function syncKvReply(env, ticketId, newMsg, status) {
  try {
    const raw = await env.LICENSES.get(`TICKET_${ticketId}`);
    if (!raw) return;
    const ticket = JSON.parse(raw);
    ticket.messages.push(newMsg);
    ticket.updatedAt = newMsg.timestamp;
    ticket.status = status;
    await env.LICENSES.put(`TICKET_${ticketId}`, JSON.stringify(ticket));
  } catch (_) {}
}

/**
 * Update the status of a ticket (open, in_progress, resolved)
 */
export async function updateTicketStatus(env, ticketId, status) {
  const allowed = ["open", "in_progress", "resolved"];
  if (!allowed.includes(status)) {
    throw new ValidationError(`Invalid status '${status}'. Must be one of: ${allowed.join(", ")}`, "invalid_status");
  }

  const now = Date.now();

  if (env.DB) {
    try {
      await ensureD1Tables(env);
      await env.DB.prepare(`UPDATE support_tickets SET status = ?, updated_at = ? WHERE id = ?`).bind(status, now, ticketId).run();
    } catch (err) {
      console.warn("[supportService] D1 updateTicketStatus error:", err.message);
    }
  }

  try {
    const raw = await env.LICENSES.get(`TICKET_${ticketId}`);
    if (raw) {
      const ticket = JSON.parse(raw);
      ticket.status = status;
      ticket.updatedAt = now;
      await env.LICENSES.put(`TICKET_${ticketId}`, JSON.stringify(ticket));

      const index = await getTicketsIndex(env);
      const item = index.find(t => t.id === ticketId);
      if (item) {
        item.status = status;
        item.updatedAt = now;
        await saveTicketsIndex(env, index);
      }
    }
  } catch (_) {}

  return await getTicketDetail(env, ticketId, false);
}

/**
 * Permanently delete a ticket and clean up storage
 */
export async function deleteTicket(env, ticketId) {
  if (env.DB) {
    try {
      await ensureD1Tables(env);
      await env.DB.prepare(`DELETE FROM support_messages WHERE ticket_id = ?`).bind(ticketId).run();
      await env.DB.prepare(`DELETE FROM support_tickets WHERE id = ?`).bind(ticketId).run();
    } catch (err) {
      console.warn("[supportService] D1 deleteTicket error:", err.message);
    }
  }

  try {
    await env.LICENSES.delete(`TICKET_${ticketId}`);
    const index = await getTicketsIndex(env);
    const filtered = index.filter(t => t.id !== ticketId);
    await saveTicketsIndex(env, filtered);
  } catch (_) {}

  return { deleted: true, ticketId };
}

/**
 * Fetch agent's active tickets and check for unread admin responses
 */
export async function getAgentTickets(env, deviceId, agentName) {
  if (!deviceId && !agentName) return { tickets: [], unreadCount: 0 };

  if (env.DB) {
    try {
      await ensureD1Tables(env);
      const rows = await env.DB.prepare(`
        SELECT * FROM support_tickets
        WHERE (? != '' AND device_id = ?) OR (? != '' AND agent_name = ?)
        ORDER BY updated_at DESC LIMIT 10
      `).bind(deviceId || "", deviceId || "", agentName || "", agentName || "").all();

      const tickets = (rows.results || []).map(r => ({
        id: r.id,
        agentName: r.agent_name,
        deviceId: r.device_id,
        scriptVersion: r.script_version,
        pageUrl: r.page_url,
        status: r.status,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
        lastMessage: r.last_message,
        unreadAdmin: !!r.unread_admin,
        unreadAgent: !!r.unread_agent,
        hasImage: !!r.has_image
      }));
      const unreadCount = tickets.filter(t => t.unreadAgent).length;
      return { tickets, unreadCount, storage: "d1" };
    } catch (err) {
      console.warn("[supportService] D1 getAgentTickets error, falling back to KV:", err.message);
    }
  }

  // KV Fallback
  const index = await getTicketsIndex(env);
  const myTickets = index.filter(t =>
    (deviceId && t.deviceId === deviceId) ||
    (agentName && t.agentName === agentName)
  ).slice(0, 10);

  const unreadCount = myTickets.filter(t => t.unreadAgent).length;
  return {
    tickets: myTickets,
    unreadCount,
    storage: "kv"
  };
}

/**
 * Retrieve list of tickets with optional status & search filter (Admin)
 */
export async function listTickets(env, { status = "", search = "", limit = 50, offset = 0 } = {}) {
  if (env.DB) {
    try {
      await ensureD1Tables(env);
      let sql = `SELECT * FROM support_tickets WHERE 1=1`;
      const params = [];

      if (status && status !== "all") {
        if (status === "active") {
          sql += ` AND (status = 'open' OR status = 'in_progress')`;
        } else if (status === "unread") {
          sql += ` AND unread_admin = 1`;
        } else {
          sql += ` AND status = ?`;
          params.push(status);
        }
      }

      if (search) {
        const q = `%${search.toLowerCase()}%`;
        sql += ` AND (LOWER(agent_name) LIKE ? OR LOWER(last_message) LIKE ? OR LOWER(id) LIKE ?)`;
        params.push(q, q, q);
      }

      sql += ` ORDER BY updated_at DESC LIMIT ? OFFSET ?`;
      params.push(limit, offset);

      const rows = await env.DB.prepare(sql).bind(...params).all();
      const countRow = await env.DB.prepare(`SELECT COUNT(*) as total FROM support_tickets`).first();

      const tickets = (rows.results || []).map(r => ({
        id: r.id,
        agentName: r.agent_name,
        deviceId: r.device_id,
        scriptVersion: r.script_version,
        pageUrl: r.page_url,
        status: r.status,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
        lastMessage: r.last_message,
        unreadAdmin: !!r.unread_admin,
        unreadAgent: !!r.unread_agent,
        hasImage: !!r.has_image
      }));

      return {
        total: countRow ? countRow.total : tickets.length,
        tickets,
        storage: "d1"
      };
    } catch (err) {
      console.warn("[supportService] D1 listTickets error, falling back to KV:", err.message);
    }
  }

  // KV Fallback
  let index = await getTicketsIndex(env);

  if (status && status !== "all") {
    if (status === "active") {
      index = index.filter(t => t.status === "open" || t.status === "in_progress");
    } else if (status === "unread") {
      index = index.filter(t => t.unreadAdmin);
    } else {
      index = index.filter(t => t.status === status);
    }
  }

  if (search) {
    const q = search.toLowerCase();
    index = index.filter(t =>
      (t.agentName && t.agentName.toLowerCase().includes(q)) ||
      (t.lastMessage && t.lastMessage.toLowerCase().includes(q)) ||
      (t.scriptVersion && t.scriptVersion.toLowerCase().includes(q)) ||
      (t.id && t.id.toLowerCase().includes(q))
    );
  }

  const total = index.length;
  const paginated = index.slice(offset, offset + limit);

  return {
    total,
    tickets: paginated,
    storage: "kv"
  };
}

/**
 * Mark agent's tickets as read by agent
 */
export async function markAgentTicketsRead(env, deviceId, agentName, ticketId = null) {
  if (env.DB) {
    try {
      await ensureD1Tables(env);
      if (ticketId) {
        await env.DB.prepare(`UPDATE support_tickets SET unread_agent = 0 WHERE id = ?`).bind(ticketId).run();
      } else {
        await env.DB.prepare(`UPDATE support_tickets SET unread_agent = 0 WHERE (? != '' AND device_id = ?) OR (? != '' AND agent_name = ?)`).bind(deviceId || "", deviceId || "", agentName || "", agentName || "").run();
      }
    } catch (err) {
      console.warn("[supportService] D1 markAgentTicketsRead error:", err.message);
    }
  }

  // KV Fallback
  try {
    const index = await getTicketsIndex(env);
    let changed = false;

    for (const t of index) {
      if (ticketId && t.id !== ticketId) continue;
      if ((deviceId && t.deviceId === deviceId) || (agentName && t.agentName === agentName)) {
        if (t.unreadAgent) {
          t.unreadAgent = false;
          changed = true;
        }
      }
    }

    if (changed) {
      await saveTicketsIndex(env, index);
    }
  } catch (_) {}
}
