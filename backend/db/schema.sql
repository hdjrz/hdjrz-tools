-- Cloudflare D1 Support Chat Schema
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
);

CREATE INDEX IF NOT EXISTS idx_tickets_updated ON support_tickets(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_tickets_device ON support_tickets(device_id);
CREATE INDEX IF NOT EXISTS idx_tickets_agent ON support_tickets(agent_name);

CREATE TABLE IF NOT EXISTS support_messages (
  id TEXT PRIMARY KEY,
  ticket_id TEXT NOT NULL,
  sender TEXT NOT NULL,
  sender_name TEXT,
  text TEXT,
  image TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (ticket_id) REFERENCES support_tickets(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_msgs_ticket ON support_messages(ticket_id, created_at ASC);
