/**
 * Escalation Templates & Dictionary Definition
 * BIT88 wording lives here: per-option User Notes (circle format), Zoom paste, reasons, and extra choices.
 * User Notes match BIT88 circles, with [CID] [Reason] [Name] [DOB] [GLife ID] so values fill.
 */

const DEFAULT_ESCALATION_OPTIONS = [
  {
    code: "ACR",
    label: "ACR",
    meaning: "Account Closure Request",
    description: "Player requested to close/disable their account voluntarily.",
    group: "Account Closure",
    color: "#2563eb",
    chip: { text: "", color: "#dc2626" },
    defaultReason: "Losing player",
    reasons: ["Losing player","Gambling Addiction","Stop playing","Mental health problem","Personal","Not provide reason","Duplicate account"],
    userNotesText: "ACR / [CID] / [Reason]",
    zoomText: `FOR BLOCKING - Account Closure Request

User ID: [User ID]
Reason: [Reason]
CID: [CID]
Notes/tracker added

Pasuyo po TLs`,
    noteChoices: [
      {
        "label": "User Notes",
        "userNotesText": "ACR / [CID] / [Reason]"
      }
    ],
    zoomChoices: [
      {
        label: "Zoom",
        zoomText: `FOR BLOCKING - Account Closure Request

User ID: [User ID]
Reason: [Reason]
CID: [CID]
Notes/tracker added

Pasuyo po TLs`
      }
    ]
  },
  {
    code: "ACR-PAGCOR",
    label: "ACR-PAGCOR",
    meaning: "Account Closure Request (PAGCOR)",
    description: "Regulatory or formal self-exclusion mandated by PAGCOR.",
    group: "Account Closure",
    color: "#1d4ed8",
    chip: { text: "", color: "#dc2626" },
    defaultReason: "Self-Exclusion with PAGCOR",
    reasons: ["Self-Exclusion with PAGCOR"],
    userNotesText: "[CID] - ACR Self-Exclusion with PAGCOR",
    zoomText: `FOR BLOCKING - Account Closure Request

User ID: [User ID]
Reason: Self-Exclusion with PAGCOR
CID: [CID]

Notes/tracker added

Pasuyo po TLs`,
    noteChoices: [
      {
        "label": "User Notes",
        "userNotesText": "[CID] - ACR Self-Exclusion with PAGCOR"
      }
    ],
    zoomChoices: [
      {
        label: "Zoom",
        zoomText: `FOR BLOCKING - Account Closure Request

User ID: [User ID]
Reason: Self-Exclusion with PAGCOR
CID: [CID]

Notes/tracker added

Pasuyo po TLs`
      }
    ]
  },
  {
    code: "ACR - PERMA",
    label: "ACR - PERMA",
    meaning: "Permanent Account Closure",
    description: "Account permanently banned or closed with zero chance of reopening.",
    group: "Account Closure",
    color: "#7f1d1d",
    chip: { text: "", color: "#dc2626" },
    defaultReason: "Gambling Addiction",
    reasons: ["Gambling Addiction","Losing Player","Stop playing","Mental health problem","Not provide reason"],
    userNotesText: "ACR / [CID] / Permanent Block - [Reason]",
    zoomText: `FOR BLOCKING - Account Closure Request - Permanent

User ID: [User ID]
Reason: [Reason]
CID: [CID]
Notes/tracker added

Pasuyo po TLs`,
    noteChoices: [
      {
        "label": "User Notes",
        "userNotesText": "ACR / [CID] / Permanent Block - [Reason]"
      }
    ],
    zoomChoices: [
      {
        label: "Zoom",
        zoomText: `FOR BLOCKING - Account Closure Request - Permanent

User ID: [User ID]
Reason: [Reason]
CID: [CID]
Notes/tracker added

Pasuyo po TLs`
      }
    ]
  },
  {
    code: "REACT",
    label: "REACT",
    meaning: "Account Reactivation Request",
    description: "Player reached out requesting to reopen a previously closed account.",
    group: "Reactivation",
    color: "#059669",
    chip: { text: "", color: "#dc2626" },
    defaultReason: "Wants to play again",
    reasons: ["Wants to play again"],
    userNotesText: "[CID] - Reactivation - [Reason]",
    zoomText: `Account Reactivation Request

User ID: [User ID]
CID: [CID]
Reason: [Reason]
Name: [Name]
DOB: [DOB]

Notes/tracker added

Pasuyo po TLs`,
    noteChoices: [
      {
        "label": "User Notes",
        "userNotesText": "[CID] - Reactivation - [Reason]"
      }
    ],
    zoomChoices: [
      {
        label: "Zoom",
        zoomText: `Account Reactivation Request

User ID: [User ID]
CID: [CID]
Reason: [Reason]
Name: [Name]
DOB: [DOB]

Notes/tracker added

Pasuyo po TLs`
      }
    ]
  },
  {
    code: "REACT NOT",
    label: "REACT NOT",
    meaning: "Reactivation Not Allowed",
    description: "Reactivation declined due to permanent closure, policy, or unresolved flags.",
    group: "Reactivation",
    color: "#0f766e",
    chip: { text: "R.NOT", color: "#065f46" },
    defaultReason: "Not started",
    reasons: ["Not started","UA to legal"],
    userNotesText: "Reactivation - for reset KYC not started",
    zoomText: `REACTIVATION - FOR RESET NOT STARTED

User ID: [User ID]
CID: [CID]
Notes/tracker added

Pasuyo po TLs`,
    noteChoices: [
      {
        "label": "R.NOT — not started",
        "userNotesText": "Reactivation - for reset KYC not started"
      },
      {
        "label": "R.UA — UA to legal",
        "userNotesText": "UA to legal - For reset | [CID]"
      }
    ],
    zoomChoices: [
      {
        label: "Not started",
        zoomText: `REACTIVATION - FOR RESET NOT STARTED

User ID: [User ID]
CID: [CID]
Notes/tracker added

Pasuyo po TLs`
      },
      {
        label: "UA to legal",
        zoomText: `REACTIVATION - FOR RESET UA TO LEGAL

User ID: [User ID]
CID: [CID]
Name: [Name]
Date of Birth: [DOB]
Registered mobile number:
Email address:

Pasuyo po TLs`
      }
    ]
  },
  {
    code: "NGP NON-X",
    label: "NGP NON-X",
    meaning: "NGP Non-Exclusive Player",
    description: "Escalation for players tagged under Non-Exclusive Next Gen Player program.",
    group: "Special Programs",
    color: "#d97706",
    chip: { text: "R.UA", color: "#b45309" },
    defaultReason: "Underage NGP NON-XENDIT",
    reasons: ["Underage NGP NON-XENDIT"],
    userNotesText: "NOT OK for RETAKE: Doc-UA | [Name] | [DOB] ([AGE])",
    zoomText: `FOR BLOCKING - UNDERAGE NGP NON-XENDIT
(Waiting to other details)

User ID: [User ID]
CID: [CID]
Name: [Name]
Date of Birth: [DOB] ([AGE])

Pasuyo po TLs`,
    noteChoices: [
      {
        "label": "User Notes",
        "userNotesText": "NOT OK for RETAKE: Doc-UA | [Name] | [DOB] ([AGE])"
      }
    ],
    zoomChoices: [
      {
        label: "Zoom",
        zoomText: `FOR BLOCKING - UNDERAGE NGP NON-XENDIT
(Waiting to other details)

User ID: [User ID]
CID: [CID]
Name: [Name]
Date of Birth: [DOB] ([AGE])

Pasuyo po TLs`
      }
    ]
  },
  {
    code: "NDRP",
    label: "NDRP",
    meaning: "Non-Deposit Reward Program",
    description: "Issues concerning free credits, vouchers, or no-deposit rewards.",
    group: "Financial & Rewards",
    color: "#6d28d9",
    chip: { text: "", color: "#dc2626" },
    defaultReason: "NDRP - NGP For Refund",
    reasons: ["NDRP - NGP For Refund","Custom watchlist"],
    userNotesText: "",
    zoomText: `FOR BLOCKING - NDRP - NGP For Refund
(Waiting for other details)

User ID: [User ID]
CID: [CID]

[Name]
Date of birth (age)
[DOB] ([AGE])

Pasuyo po TLs`,
    noteChoices: [
      {
        "label": "User Notes",
        "userNotesText": ""
      }
    ],
    zoomChoices: [
      {
        label: "NDRP blocking",
        zoomText: `FOR BLOCKING - NDRP - NGP For Refund
(Waiting for other details)

User ID: [User ID]
CID: [CID]

[Name]
Date of birth (age)
[DOB] ([AGE])

Pasuyo po TLs`
      },
      {
        label: "Custom watchlist",
        zoomText: `FOR ESCALATION - CUSTOM WATCHLIST

User ID: [User ID]
Name: [Name]
Date of Birth: [DOB]

Pasuyo po TLs`
      }
    ]
  },
  {
    code: "UA W/FUNDS",
    label: "UA W/FUNDS",
    meaning: "Unauthorized Access with Funds",
    description: "Compromised or hacked account that currently holds a cash balance.",
    group: "Security & Fraud",
    color: "#7c3aed",
    chip: { text: "For escalation", color: "#b91c1c" },
    defaultReason: "Underage with funds",
    reasons: ["Underage with funds"],
    userNotesText: "NOT OK for RETAKE: Doc-UA | [Name] | [DOB] ([AGE])",
    zoomText: `FOR BLOCKING - UNDERAGE WITH FUNDS
(Waiting for national ID)

User ID: [User ID]
CID: [CID]
Name: [Name]
DOB : [DOB] ([AGE])

Pasuyo po TLs`,
    noteChoices: [
      {
        "label": "User Notes",
        "userNotesText": "NOT OK for RETAKE: Doc-UA | [Name] | [DOB] ([AGE])"
      }
    ],
    zoomChoices: [
      {
        label: "Zoom",
        zoomText: `FOR BLOCKING - UNDERAGE WITH FUNDS
(Waiting for national ID)

User ID: [User ID]
CID: [CID]
Name: [Name]
DOB : [DOB] ([AGE])

Pasuyo po TLs`
      }
    ]
  },
  {
    code: "UA WO/FUNDS",
    label: "UA WO/FUNDS",
    meaning: "Underage without funds",
    description: "Underage player with no remaining balance.",
    group: "Security & Fraud",
    color: "#6d28d9",
    chip: { text: "", color: "#dc2626" },
    defaultReason: "Underage without funds",
    reasons: ["Underage without funds"],
    userNotesText: "NOT OK for RETAKE: Doc-UA | [Name] | [DOB] ([AGE])",
    zoomText: `FOR BLOCKING - UNDERAGE WITHOUT FUNDS

User ID: [User ID]
CID: [CID]
Name: [Name]
DOB : [DOB] ([AGE])

Pasuyo po TLs`,
    noteChoices: [
      {
        "label": "User Notes",
        "userNotesText": "NOT OK for RETAKE: Doc-UA | [Name] | [DOB] ([AGE])"
      }
    ],
    zoomChoices: [
      {
        label: "Zoom",
        zoomText: `FOR BLOCKING - UNDERAGE WITHOUT FUNDS

User ID: [User ID]
CID: [CID]
Name: [Name]
DOB : [DOB] ([AGE])

Pasuyo po TLs`
      }
    ]
  },
  {
    code: "MANUAL KYC",
    label: "MANUAL KYC",
    meaning: "Manual KYC Document Review",
    description: "Automated verification failed; manual review of submitted IDs needed.",
    group: "KYC & Verification",
    color: "#db2777",
    chip: { text: "", color: "#dc2626" },
    defaultReason: "Manual ID verification required",
    reasons: ["Manual ID verification required"],
    userNotesText: "For Manual Verification | [Name] | [DOB]",
    zoomText: `For manual verification
Review needed in nano / verified in meta

User ID: [User ID]
Name: [Name]
Date of Birth: [DOB]

Pasuyo tl`,
    noteChoices: [
      {
        "label": "User Notes",
        "userNotesText": "For Manual Verification | [Name] | [DOB]"
      }
    ],
    zoomChoices: [
      {
        label: "Zoom",
        zoomText: `For manual verification
Review needed in nano / verified in meta

User ID: [User ID]
Name: [Name]
Date of Birth: [DOB]

Pasuyo tl`
      }
    ]
  },
  {
    code: "KYC SWITCH",
    label: "KYC SWITCH",
    meaning: "KYC Verification Switch",
    description: "Switching player's verification method (e.g. from SMS OTP to Manual or email).",
    group: "KYC & Verification",
    color: "#0891b2",
    chip: { text: "", color: "#0d9488" },
    defaultReason: "Escalation requested",
    reasons: ["Escalation requested"],
    userNotesText: "New Verified account: KYC switch - [Name] / [DOB] ([AGE]) - DUP ID's: [Verified UID]",
    zoomText: `FOR KYC SWITCH

[Rejected accounts]

Name: [Name]
Date of Birth: [DOB]

Pasuyo po TLs`,
    noteChoices: [
      {
        "label": "New Verified account",
        "userNotesText": "New Verified account: KYC switch - [Name] / [DOB] ([AGE]) - DUP ID's: [Verified UID]"
      },
      {
        "label": "Old account",
        "userNotesText": "The Old account: KYC switch - New account UID: [New Account UID]"
      }
    ],
    zoomChoices: [
      {
        label: "2 accounts",
        zoomText: `FOR KYC SWITCH

[Rejected accounts]

Name: [Name]
Date of Birth: [DOB]

Pasuyo po TLs`
      },
      {
        label: "3 or more",
        zoomText: `FOR KYC ASSESSMENT - Multiple Accounts (not bonus abuser)

[Rejected accounts]

Name: [Name]
Date of Birth: [DOB]

Pasuyo po TLs`
      }
    ]
  },
  {
    code: "GLIFE.1",
    label: "GLIFE.1",
    meaning: "GLife Escalation Tier 1",
    description: "First-level escalation for GCash GLife mini-app transactions or sync issues.",
    group: "GLife Partner",
    color: "#0d9488",
    chip: { text: "", color: "#dc2626" },
    defaultReason: "GLife mini-app sync issue / Tier 1 inquiry",
    reasons: ["GLife mini-app sync issue / Tier 1 inquiry"],
    userNotesText: "GLIFE Override | [Name] | [DOB]",
    zoomText: `FOR GLIFE OVERRIDE

User ID: [User ID]
Name: [Name]
Date of birth: [DOB]
Notes added

Pasuyo po TLs`,
    noteChoices: [
      {
        "label": "User Notes",
        "userNotesText": "GLIFE Override | [Name] | [DOB]"
      }
    ],
    zoomChoices: [
      {
        label: "Zoom",
        zoomText: `FOR GLIFE OVERRIDE

User ID: [User ID]
Name: [Name]
Date of birth: [DOB]
Notes added

Pasuyo po TLs`
      }
    ]
  },
  {
    code: "GLIFE.2",
    label: "GLIFE.2",
    meaning: "GLife Escalation Tier 2",
    description: "High-priority / urgent escalation for GLife payment failures or account locks.",
    group: "GLife Partner",
    color: "#115e59",
    chip: { text: "", color: "#dc2626" },
    defaultReason: "gLifeUserId:",
    reasons: ["gLifeUserId:"],
    userNotesText: "GLife Override / [Reason][GLife ID]",
    zoomText: `FOR GLIFE OVERRIDE

User ID: [User ID]
gLifeUserId: [GLife ID] 
Notes/tracker added

Pasuyo po TLs`,
    noteChoices: [
      {
        "label": "User Notes",
        "userNotesText": "GLife Override / [Reason][GLife ID]"
      }
    ],
    zoomChoices: [
      {
        label: "Zoom",
        zoomText: `FOR GLIFE OVERRIDE

User ID: [User ID]
gLifeUserId: [GLife ID] 
Notes/tracker added

Pasuyo po TLs`
      }
    ]
  },
  {
    code: "ABUSER",
    label: "ABUSER",
    meaning: "Bonus / Promo Abuse Flag",
    description: "System or manual flag for exploiting promotions, multi-accounting, or fraud.",
    group: "Risk & Compliance",
    color: "#334155",
    chip: { text: "", color: "#dc2626" },
    defaultReason: "Permanently Blocked – BONUS ABUSER with Funds",
    reasons: ["Permanently Blocked – BONUS ABUSER with Funds"],
    userNotesText: "ACR / [CID] / Permanently Blocked – BONUS ABUSER with Funds",
    zoomText: `FOR BLOCKING - BONUS ABUSER with Funds

User ID: [User ID]
CID: [CID]
Name: [Name]
Date of Birth: [DOB]
Notes added

Pasuyo po TLs`,
    noteChoices: [
      {
        "label": "User Notes",
        "userNotesText": "ACR / [CID] / Permanently Blocked – BONUS ABUSER with Funds"
      }
    ],
    zoomChoices: [
      {
        label: "Zoom",
        zoomText: `FOR BLOCKING - BONUS ABUSER with Funds

User ID: [User ID]
CID: [CID]
Name: [Name]
Date of Birth: [DOB]
Notes added

Pasuyo po TLs`
      }
    ]
  }
];

const ESCALATION_DICTIONARY = {};
DEFAULT_ESCALATION_OPTIONS.forEach(opt => {
  if (!Array.isArray(opt.reasons) || !opt.reasons.length) {
    opt.reasons = [opt.defaultReason || "Escalation requested"];
  }
  if (!opt.noteChoices || !opt.noteChoices.length) {
    opt.noteChoices = [{ label: "User Notes", userNotesText: opt.userNotesText || "" }];
  }
  if (!opt.zoomChoices || !opt.zoomChoices.length) {
    opt.zoomChoices = [{ label: "Zoom", zoomText: opt.zoomText || "" }];
  }
  opt.userNotesText = opt.noteChoices[0].userNotesText;
  opt.zoomText = opt.zoomChoices[0].zoomText;
  ESCALATION_DICTIONARY[opt.code] = opt;
});

const ESCALATION_KEYS_ORDER = DEFAULT_ESCALATION_OPTIONS.map(opt => opt.code);

const DEFAULT_FINAL_NOTE_TEMPLATE = `{meaning}

User ID: {userCombined}
Reason: {reason}
CID: {cid}
Notes/tracker added

Pasuyo tl`;

const DEFAULT_SETTINGS = {
  agentName: "",
  zoomUrl: "zoomus://",
  autoOpenZoom: true,
  autoPinNote: true,
  autoCopyClipboard: true,
  usersListUrl: "https://nano-admin.bet88.ph/users",
  autoReturnToUsers: true,
  autoFindAndView: false,
  barLayout: "horizontal",
  customTemplates: {},
  customOptions: null,
  notesWordingVersion: 0
};

function ageFromDob(dobStr) {
  const raw = String(dobStr || "").trim();
  if (!raw) return "";
  let d = new Date(raw);
  if (isNaN(d.getTime())) {
    const m = raw.match(/^(\d{1,2})\s+([A-Za-z]{3,9}),?\s+(\d{4})$/);
    if (m) d = new Date(`${m[2]} ${m[1]}, ${m[3]}`);
  }
  if (isNaN(d.getTime())) return "";
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const monthDiff = today.getMonth() - d.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < d.getDate())) age -= 1;
  if (age < 0 || age > 120) return "";
  return String(age);
}

/**
 * Fills [User ID], [CID], [Reason], [Name], [DOB], [AGE] and legacy curly tokens.
 */
function renderEscalationNote(templateStr, data) {
  let text = templateStr || "";
  data = data || {};

  const effectiveUserId = data.userId || data.targetId || data.publicId || data.numericId || "";
  const numericId = data.numericId || effectiveUserId;
  const publicId = data.publicId || "";
  const cidVal = data.cid ? String(data.cid).trim() : "";
  const combined = data.userCombined || (publicId ? `${numericId} (${publicId})` : numericId);
  const reasonVal = data.reason || "";
  const meaningVal = data.meaning || "";
  const codeVal = data.code || "";
  const nameVal = data.name || "";
  const dobVal = data.dob || data.dateOfBirth || "";
  const ageVal = data.age || ageFromDob(dobVal);

  const replacements = {
    "[User ID]": combined || effectiveUserId,
    "[CID]": cidVal,
    "[Reason]": reasonVal,
    "[CODE]": codeVal,
    "[Meaning]": meaningVal,
    "[Name]": nameVal,
    "[DOB]": dobVal,
    "[Dob]": dobVal,
    "[AGE]": ageVal,
    "[Verified UID]": data.verifiedUid || "",
    "[New Account UID]": data.newAccountUid || "",
    "[Rejected accounts]": data.rejectedAccounts || "",
    "[Note Date]": data.noteDate || "",
    "[Date]": data.noteDate || "",
    "[GLife ID]": data.gLifeUserId || "",
    "{code}": codeVal,
    "{meaning}": meaningVal,
    "{userId}": effectiveUserId,
    "{targetId}": effectiveUserId,
    "{numericId}": numericId,
    "{publicId}": publicId,
    "{userCombined}": combined,
    "{username}": data.username || "N/A",
    "{affiliate}": data.affiliate || "N/A",
    "{createdDate}": data.createdDate || "",
    "{agentName}": data.agentName || "",
    "{reason}": reasonVal,
    "{cid}": cidVal,
    "{CID}": cidVal,
    "{name}": nameVal,
    "{dob}": dobVal,
    "{date}": new Date().toISOString().split("T")[0],
    "{timestamp}": new Date().toISOString().replace("T", " ").substring(0, 19) + " UTC"
  };

  for (const [token, val] of Object.entries(replacements)) {
    text = String(text).split(token).join(val);
  }

  if (cidVal) {
    text = text.replace(/\/\s*CID\s*\//g, `/ ${cidVal} /`);
    text = text.replace(/^CID:\s*$/m, `CID: ${cidVal}`);
    text = text.replace(/^CID:\s*$/gm, `CID: ${cidVal}`);
  }

  return String(text).replace(/^\s+|\s+$/g, "");
}

function renderFinalEscalationNote(data, customTemplate) {
  const tpl = customTemplate || DEFAULT_FINAL_NOTE_TEMPLATE;
  return renderEscalationNote(tpl, data);
}

if (typeof window !== "undefined") {
  window.DEFAULT_ESCALATION_OPTIONS = DEFAULT_ESCALATION_OPTIONS;
  window.DEFAULT_FINAL_NOTE_TEMPLATE = DEFAULT_FINAL_NOTE_TEMPLATE;
  window.EscalationDictionary = ESCALATION_DICTIONARY;
  window.EscalationKeysOrder = ESCALATION_KEYS_ORDER;
  window.DefaultEscalationSettings = DEFAULT_SETTINGS;
  window.renderEscalationNote = renderEscalationNote;
  window.renderFinalEscalationNote = renderFinalEscalationNote;
}

if (typeof globalThis !== "undefined") {
  globalThis.DEFAULT_ESCALATION_OPTIONS = DEFAULT_ESCALATION_OPTIONS;
  globalThis.DEFAULT_FINAL_NOTE_TEMPLATE = DEFAULT_FINAL_NOTE_TEMPLATE;
  globalThis.EscalationDictionary = ESCALATION_DICTIONARY;
  globalThis.EscalationKeysOrder = ESCALATION_KEYS_ORDER;
  globalThis.DefaultEscalationSettings = DEFAULT_SETTINGS;
  globalThis.renderEscalationNote = renderEscalationNote;
  globalThis.renderFinalEscalationNote = renderFinalEscalationNote;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    DEFAULT_ESCALATION_OPTIONS,
    DEFAULT_FINAL_NOTE_TEMPLATE,
    ESCALATION_DICTIONARY,
    ESCALATION_KEYS_ORDER,
    DEFAULT_SETTINGS,
    renderEscalationNote,
    renderFinalEscalationNote
  };
}
