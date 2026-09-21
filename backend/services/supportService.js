/**
 * Agent-to-Admin Support & Bug Telemetry Service
 */
import { AppError, NotFoundError, ValidationError } from "../utils/errors.js";

const INDEX_KEY = "SUPPORT_TICKETS_INDEX";
const MAX_STORED_TICKETS = 200;

/**
 * Retrieve the summary index of all support tickets
 */
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

/**
 * Persist the summary index of tickets
 */
async function saveTicketsIndex(env, index) {
  const trimmed = index.slice(0, MAX_STORED_TICKETS);
  await env.LICENSES.put(INDEX_KEY, JSON.stringify(trimmed));
}

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

  const firstMsg = {
    id: `msg_${now}_1`,
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
    status: "open", // open, in_progress, resolved
    createdAt: now,
    updatedAt: now,
    messages: [firstMsg]
  };

  // 1. Save full ticket object
  await env.LICENSES.put(`TICKET_${id}`, JSON.stringify(ticket));

  // 2. Prepend to summary index
  const summary = {
    id,
    agentName,
    deviceId,
    scriptVersion,
    pageUrl: pageUrl.slice(0, 150),
    status: "open",
    createdAt: now,
    updatedAt: now,
    lastMessage: cleanText ? cleanText.slice(0, 120) : "📷 [Screenshot Attached]",
    unreadAdmin: true,
    unreadAgent: false,
    hasImage: !!imageBase64
  };

  const index = await getTicketsIndex(env);
  index.unshift(summary);
  await saveTicketsIndex(env, index);

  return ticket;
}

/**
 * Retrieve list of tickets with optional status & search filter
 */
export async function listTickets(env, { status = "", search = "", limit = 50, offset = 0 } = {}) {
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
    tickets: paginated
  };
}

/**
 * Retrieve full ticket details including conversation messages and screenshot
 */
export async function getTicketDetail(env, ticketId, markAdminRead = false) {
  const raw = await env.LICENSES.get(`TICKET_${ticketId}`);
  if (!raw) {
    throw new NotFoundError(`Ticket '${ticketId}' not found`, "ticket_not_found");
  }

  const ticket = JSON.parse(raw);

  if (markAdminRead) {
    const index = await getTicketsIndex(env);
    const item = index.find(t => t.id === ticketId);
    if (item && item.unreadAdmin) {
      item.unreadAdmin = false;
      await saveTicketsIndex(env, index);
    }
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

  const raw = await env.LICENSES.get(`TICKET_${ticketId}`);
  if (!raw) {
    throw new NotFoundError(`Ticket '${ticketId}' not found`, "ticket_not_found");
  }

  const ticket = JSON.parse(raw);
  const now = Date.now();

  const newMsg = {
    id: `msg_${now}_${Math.random().toString(36).slice(2, 5)}`,
    sender,
    senderName,
    text: cleanText,
    image: imageBase64 || null,
    timestamp: now
  };

  ticket.messages.push(newMsg);
  ticket.updatedAt = now;
  // If agent replies, reopen ticket so it appears as Open for admin
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
    s.lastMessage = cleanText ? cleanText.slice(0, 120) : "📷 [Screenshot Attached]";
    s.status = ticket.status;
    if (sender === "admin") {
      s.unreadAgent = true;
      s.unreadAdmin = false;
    } else {
      s.unreadAdmin = true;
      s.unreadAgent = false;
    }
    // Move updated ticket to top
    index.splice(summaryIdx, 1);
    index.unshift(s);
    await saveTicketsIndex(env, index);
  }

  return ticket;
}

/**
 * Update the status of a ticket (open, in_progress, resolved)
 */
export async function updateTicketStatus(env, ticketId, status) {
  const allowed = ["open", "in_progress", "resolved"];
  if (!allowed.includes(status)) {
    throw new ValidationError(`Invalid status '${status}'. Must be one of: ${allowed.join(", ")}`, "invalid_status");
  }

  const raw = await env.LICENSES.get(`TICKET_${ticketId}`);
  if (!raw) {
    throw new NotFoundError(`Ticket '${ticketId}' not found`, "ticket_not_found");
  }

  const ticket = JSON.parse(raw);
  ticket.status = status;
  ticket.updatedAt = Date.now();
  await env.LICENSES.put(`TICKET_${ticketId}`, JSON.stringify(ticket));

  const index = await getTicketsIndex(env);
  const item = index.find(t => t.id === ticketId);
  if (item) {
    item.status = status;
    item.updatedAt = ticket.updatedAt;
    await saveTicketsIndex(env, index);
  }

  return ticket;
}

/**
 * Permanently delete a ticket and clean up storage
 */
export async function deleteTicket(env, ticketId) {
  await env.LICENSES.delete(`TICKET_${ticketId}`);
  const index = await getTicketsIndex(env);
  const filtered = index.filter(t => t.id !== ticketId);
  await saveTicketsIndex(env, filtered);
  return { deleted: true, ticketId };
}

/**
 * Fetch agent's active tickets and check for unread admin responses
 */
export async function getAgentTickets(env, deviceId, agentName) {
  if (!deviceId && !agentName) return { tickets: [], unreadCount: 0 };
  const index = await getTicketsIndex(env);

  const myTickets = index.filter(t =>
    (deviceId && t.deviceId === deviceId) ||
    (agentName && t.agentName === agentName)
  ).slice(0, 10);

  const unreadCount = myTickets.filter(t => t.unreadAgent).length;

  return {
    tickets: myTickets,
    unreadCount
  };
}

/**
 * Mark agent's tickets as read by agent
 */
export async function markAgentTicketsRead(env, deviceId, agentName, ticketId = null) {
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
}
