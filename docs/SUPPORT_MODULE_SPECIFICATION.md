# hdjrzTools: Real-Time Agent-to-Admin Support & Bug Telemetry System
**Specification & Architecture Document**  
**Version:** 1.0.0  
**Target Integration:** `hdjrzTools` (Client Userscript & Cloudflare Worker Admin Portal)

---

## 1. Executive Summary

The **Support & Bug Telemetry System** bridges the gap between active shift agents using the `hdjrzTools` userscript and the team administrator. It enables staff agents to instantly report glitches, workflow bottlenecks, or questions with **live screenshots** pasted directly from their clipboard (`Ctrl + V`), alongside automatic diagnostic metadata (installed script version, device ID, current page/tab, timestamp). The Administrator reviews these tickets in real-time inside the **Web Admin Portal (`/admin`)**, views full-resolution expandable screenshots, and chats back with solutions that trigger real-time notifications on the agent's screen.

---

## 2. User Experience & Workflows

### 2.1 Agent Experience (In-Page Userscript)

```
+-----------------------------------------------------------------------------------+
| [Hdjrz Tools Dock]   [ACR] [REACT] [KYC SWITCH] ... [⚙ Settings] [💬 Support (1)] |
+-----------------------------------------------------------------------------------+
                                                                     │
                                                                     ▼ (Opens Modal)
+───────────────────────────────────────────────────────────────────────────────────+
| 💬 Agent Support & Bug Reporter                                              [✕] |
├───────────────────────────────────────────────────────────────────────────────────┤
| 👤 Agent: Robin Almarez   | 🛡️ Version: v1.6.2   | 🌐 Tab: Overview / KYC         |
├───────────────────────────────────────────────────────────────────────────────────┤
| 📜 Conversation History:                                                          |
|   [Robin - 10:24 PM]: The "Verified to rejected" scanner is stuck on scanning.   |
|   [Screenshot attached: 1280x720 (Click to view)]                                 |
|                                                                                   |
|   [👑 Admin Jetro - 10:26 PM]: Please refresh your other tab and try again now!   |
├───────────────────────────────────────────────────────────────────────────────────┤
| 📝 Describe the problem or question:                                             |
| [ Type your message here...                                                     ] |
|                                                                                   |
| 📷 Screenshot:                                                                    |
| [ 📋 Paste image with Ctrl+V or click to upload file                            ] |
| [Preview thumbnail: screenshot_20260920.png (210 KB) ✕ Remove]                   |
|                                                                                   |
| [ Cancel ]                                                  [ 🚀 Send to Admin ] |
+───────────────────────────────────────────────────────────────────────────────────+
```

1. **Floating Dock Access**:
   - A modern, glowing **`💬 Support`** icon button integrated into the right-hand side of the escalation dock (beside the Settings gear).
   - If an Admin replies, the button animates with a pulsing green badge: `💬 Support (1)`.
2. **Instant Clipboard Paste (`Ctrl + V`)**:
   - Agents can capture their screen using Windows Snip (`Win + Shift + S`) or PrintScreen, click anywhere in the modal or text area, and press **`Ctrl + V`**.
   - The script detects the `clipboardData.items` blob, validates it as an image, automatically downsamples/compresses it to WebP/JPEG format (target size: ~150KB–250KB), and renders an instant visual preview thumbnail.
   - Traditional file browsing via drag-and-drop or file picker is also supported as an alternative.
3. **Automatic Environmental Telemetry**:
   - Every ticket payload automatically attaches:
     - **Agent Name**: Stored profile name (e.g. "Robin Almarez").
     - **Hardware Device ID**: Unique device fingerprint.
     - **License Key**: Used to track user identity.
     - **Script Version**: Current installed version (e.g. `v1.6.2`).
     - **Active URL / Context**: Current page URL (e.g. player overview or KYC verification table).
     - **Browser Platform**: OS & Chrome version.
4. **Real-Time Reply Notification**:
   - The userscript's periodic heartbeat detects new unread admin replies.
   - When an unread admin reply is found, a non-intrusive banner appears:
     > `👑 Admin replied to your ticket: "Fix deployed, please refresh your tab!"`
   - Plays a subtle audio chime.

---

### 2.2 Administrator Experience (Master Web Admin Portal)

```
+───────────────────────────────────────────────────────────────────────────────────+
| 👑 hdjrzTools Master Admin Portal                                     [🚪 Logout] |
+───────────────────────────────────────────────────────────────────────────────────+
| [👥 Telemetry] [🔑 Licenses] [📋 Templates] [💬 Support Inbox (2)] [⚙ Channels]   |
+───────────────────────────────────────────────────────────────────────────────────+
|                                                                                   |
| 📥 Agent Support & Bug Tickets                                 [🔄 Refresh]      |
| Filter: [ All Status ▼ ]  [ All Agents ▼ ]   Search: [ Search tickets...        ] |
|                                                                                   |
| ┌───────────────────────────────────────────────────────────────────────────────┐ |
| │ 🟡 OPEN  #TK-1082 | Robin Almarez (v1.6.2)              2 mins ago (10:24 PM) │ |
| │ Issue: "Verified to rejected scanner is stuck on scanning..."                 │ |
| │ 📷 1 Screenshot Attached   | 🌐 nano-admin.bet88.ph/player/kyc                │ |
| └───────────────────────────────────────────────────────────────────────────────┘ |
| ┌───────────────────────────────────────────────────────────────────────────────┐ |
| │ 🟢 RESOLVED #TK-1081 | Deniel Obligado (v1.6.1)        1 hour ago (09:15 PM) │ |
| │ Issue: "Font size on dark mode buttons" | Resolved by Jetro                   │ |
| └───────────────────────────────────────────────────────────────────────────────┘ |
+───────────────────────────────────────────────────────────────────────────────────+
```

1. **Dedicated Portal Tab (`#tab-support`)**:
   - A dedicated tab in the Admin Portal navigation header with an active counter badge displaying unread/open tickets.
2. **Conversation Thread View**:
   - Clicking a ticket opens the complete conversation thread between the Admin and the Agent.
   - Displays all historical messages with accurate timestamps and sender attribution.
3. **Interactive High-Resolution Lightbox**:
   - Clicking on a screenshot thumbnail expands it to full screen in a zoomable, draggable lightbox modal so the Admin can inspect player IDs, form inputs, and error details clearly.
4. **Admin Response Actions**:
   - **Quick Reply Input**: Send answers or debugging requests directly to the agent.
   - **Status Toggle**: Switch ticket between `🟡 Open`, `🔵 In Progress`, and `🟢 Resolved`.
   - **Delete / Archive**: Clean up obsolete tickets.

---

## 3. Data Architecture & Storage Strategy

### 3.1 Efficient Edge Image Storage (Cloudflare KV)
Cloudflare KV supports values up to **25 MB** per key. 
To optimize edge read/write latency and keep KV lightweight:
- **Client-Side Compression**: The userscript resizes screenshots on an off-screen HTML5 `<canvas>` (maximum 1600px width, 85% JPEG/WebP quality).
- This produces high-clarity screenshots of **~120 KB – 280 KB**, which load instantaneously across the network.
- Stored as standard Data URIs (`data:image/jpeg;base64,...`) embedded in the ticket conversation structure or indexed under separate KV image keys (`IMAGE_<id>`).

### 3.2 Data Schema

#### `SUPPORT_TICKETS_INDEX` (List of all tickets metadata)
```json
[
  {
    "id": "tk_1726849200_a8f9",
    "agentName": "Robin Almarez",
    "deviceId": "dev_93f82a1b",
    "scriptVersion": "1.6.2",
    "pageUrl": "https://nano-admin.bet88.ph/admin/player-detail?id=12345",
    "status": "open",
    "createdAt": 1726849200000,
    "updatedAt": 1726849320000,
    "lastMessage": "Verified to rejected scanner is stuck...",
    "unreadAdmin": true,
    "unreadAgent": false,
    "hasImage": true
  }
]
```

#### `TICKET_<id>` (Full conversation & screenshot payload)
```json
{
  "id": "tk_1726849200_a8f9",
  "agentName": "Robin Almarez",
  "deviceId": "dev_93f82a1b",
  "scriptVersion": "1.6.2",
  "pageUrl": "https://nano-admin.bet88.ph/admin/player-detail?id=12345",
  "status": "open",
  "createdAt": 1726849200000,
  "updatedAt": 1726849320000,
  "messages": [
    {
      "id": "msg_1",
      "sender": "agent",
      "senderName": "Robin Almarez",
      "text": "The verified to rejected scanner is stuck on scanning even with other tab open.",
      "image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ...",
      "timestamp": 1726849200000
    },
    {
      "id": "msg_2",
      "sender": "admin",
      "senderName": "Jetro (Admin)",
      "text": "Please refresh your other player overview tab and test again.",
      "image": null,
      "timestamp": 1726849320000
    }
  ]
}
```

---

## 4. API Endpoints Specification

| Method | Endpoint | Access | Purpose |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/support/ticket` | Agent | Create a new ticket with optional screenshot and diagnostics |
| `GET` | `/api/support/my-tickets` | Agent | Retrieve active tickets & unread status for the current agent/device |
| `POST` | `/api/support/ticket/:id/reply` | Agent / Admin | Append a reply message to an existing ticket |
| `GET` | `/admin/api/support/tickets` | Admin | Retrieve all tickets with filtering & unread indicators |
| `GET` | `/admin/api/support/ticket/:id` | Admin | Retrieve complete conversation history & full-size screenshot |
| `POST` | `/admin/api/support/ticket/:id/status` | Admin | Update ticket status (`open`, `in_progress`, `resolved`) |
| `DELETE` | `/admin/api/support/ticket/:id` | Admin | Permanently delete a ticket |

---

## 5. Security & Reliability Controls
1. **Rate Limiting**: Agents can create a maximum of 5 tickets per 10 minutes per device ID to prevent abuse or spam.
2. **Payload Size Guard**: Enforce a strict 4 MB maximum request body size on Cloudflare Worker.
3. **Admin Authentication**: All `/admin/api/support/*` endpoints require verified Admin session or Master Password authorization.
4. **XSS Protection**: All user and admin input strings are escaped via standard HTML entity encoding before rendering in the DOM or Admin Portal.
