/**
 * Escalation Templates & Dictionary Definition
 * BIT88 wording lives here: per-option User Notes (circle format), Zoom paste, reasons, and extra choices.
 * User Notes match BIT88 circles, with [CID] [Reason] [Name] [DOB] [GLife ID] so values fill.
 */

const BUTTON_COLOR_PALETTES = {
  classic_pro: {
    id: "classic_pro",
    name: "Classic Pro",
    description: "Original high-clarity functional button colors",
    swatch: ["#2563eb", "#dc2626", "#059669", "#7c3aed"],
    colors: {
      "ACR": "#2563eb",
      "ACR-PAGCOR": "#0284c7",
      "ACR - PERMA": "#dc2626",
      "REACT": "#059669",
      "REACT NOT": "#0d9488",
      "NGP NON-X": "#d97706",
      "NDRP": "#7c3aed",
      "UA W/FUNDS": "#6366f1",
      "UA WO/FUNDS": "#8b5cf6",
      "MANUAL KYC": "#e11d48",
      "KYC SWITCH": "#0891b2",
      "GLIFE.1": "#059669",
      "GLIFE.2": "#0f766e",
      "ABUSER": "#475569",
      "DISCONNECT": "#3b82f6"
    }
  },
  ocean_coral: {
    id: "ocean_coral",
    name: "Ocean Coral",
    description: "Deep slate, sky blue, and coral punch (Color Hunt #1)",
    swatch: ["#243656", "#3A5A97", "#70B2E8", "#FF7A8A"],
    colors: {
      "ACR": "#243656",
      "ACR-PAGCOR": "#3A5A97",
      "ACR - PERMA": "#FF7A8A",
      "REACT": "#10b981",
      "REACT NOT": "#2c4a6f",
      "NGP NON-X": "#f58294",
      "NDRP": "#70B2E8",
      "UA W/FUNDS": "#e05568",
      "UA WO/FUNDS": "#3A5A97",
      "MANUAL KYC": "#FF7A8A",
      "KYC SWITCH": "#70B2E8",
      "GLIFE.1": "#529ddb",
      "GLIFE.2": "#243656",
      "ABUSER": "#475569",
      "DISCONNECT": "#38bdf8"
    }
  },
  midnight_navy: {
    id: "midnight_navy",
    name: "Midnight Navy",
    description: "Deep abyss, cobalt, and warm vanilla gold (Color Hunt #2)",
    swatch: ["#010736", "#0D1C42", "#22396F", "#FCF1D0"],
    colors: {
      "ACR": "#22396F",
      "ACR-PAGCOR": "#16284f",
      "ACR - PERMA": "#9e2a44",
      "REACT": "#0f766e",
      "REACT NOT": "#1b4d5a",
      "NGP NON-X": "#c49b3b",
      "NDRP": "#3b60af",
      "UA W/FUNDS": "#b33951",
      "UA WO/FUNDS": "#22396F",
      "MANUAL KYC": "#c44d67",
      "KYC SWITCH": "#3874b3",
      "GLIFE.1": "#1e6b7b",
      "GLIFE.2": "#0D1C42",
      "ABUSER": "#1e293b",
      "DISCONNECT": "#2552a8"
    }
  },
  retro_crimson: {
    id: "retro_crimson",
    name: "Retro Crimson",
    description: "Deep wine, cherry crimson, and vintage teal (Color Hunt #3)",
    swatch: ["#4D0F13", "#991F26", "#F9DC96", "#289697"],
    colors: {
      "ACR": "#991F26",
      "ACR-PAGCOR": "#4D0F13",
      "ACR - PERMA": "#781419",
      "REACT": "#289697",
      "REACT NOT": "#1c6869",
      "NGP NON-X": "#d4a34b",
      "NDRP": "#991F26",
      "UA W/FUNDS": "#b82630",
      "UA WO/FUNDS": "#4D0F13",
      "MANUAL KYC": "#bf2e39",
      "KYC SWITCH": "#289697",
      "GLIFE.1": "#32a8a9",
      "GLIFE.2": "#1c6869",
      "ABUSER": "#381013",
      "DISCONNECT": "#c47d2b"
    }
  },
  emerald_ochre: {
    id: "emerald_ochre",
    name: "Emerald Gold",
    description: "Dark pine, forest emerald, and warm ochre (Color Hunt #6)",
    swatch: ["#183D3D", "#2D6A5D", "#C89743", "#F1E3D3"],
    colors: {
      "ACR": "#183D3D",
      "ACR-PAGCOR": "#225348",
      "ACR - PERMA": "#8c3a27",
      "REACT": "#2D6A5D",
      "REACT NOT": "#3d5a50",
      "NGP NON-X": "#C89743",
      "NDRP": "#2D6A5D",
      "UA W/FUNDS": "#96422d",
      "UA WO/FUNDS": "#183D3D",
      "MANUAL KYC": "#a8442d",
      "KYC SWITCH": "#3A7D6E",
      "GLIFE.1": "#2D6A5D",
      "GLIFE.2": "#183D3D",
      "ABUSER": "#3b2c20",
      "DISCONNECT": "#C89743"
    }
  },
  sunset_terracotta: {
    id: "sunset_terracotta",
    name: "Sunset Terracotta",
    description: "Burgundy, terracotta red, and golden amber (Color Hunt #7)",
    swatch: ["#8A2525", "#D9432F", "#F37335", "#FDC830"],
    colors: {
      "ACR": "#8A2525",
      "ACR-PAGCOR": "#6e1b1b",
      "ACR - PERMA": "#a82020",
      "REACT": "#2e7d32",
      "REACT NOT": "#4e6b50",
      "NGP NON-X": "#F37335",
      "NDRP": "#FDC830",
      "UA W/FUNDS": "#D9432F",
      "UA WO/FUNDS": "#8A2525",
      "MANUAL KYC": "#eb6b56",
      "KYC SWITCH": "#F37335",
      "GLIFE.1": "#e59a19",
      "GLIFE.2": "#8A2525",
      "ABUSER": "#3d2626",
      "DISCONNECT": "#FDC830"
    }
  },
  candy_pastel: {
    id: "candy_pastel",
    name: "Candy Pastel",
    description: "Soft rose, blush pink, and mint cyan (Color Hunt #8)",
    swatch: ["#E77F7F", "#F4A4A4", "#BBE6E4", "#818cf8"],
    colors: {
      "ACR": "#E77F7F",
      "ACR-PAGCOR": "#d96666",
      "ACR - PERMA": "#e05364",
      "REACT": "#38b2ac",
      "REACT NOT": "#4e938f",
      "NGP NON-X": "#f59e0b",
      "NDRP": "#818cf8",
      "UA W/FUNDS": "#F4A4A4",
      "UA WO/FUNDS": "#E77F7F",
      "MANUAL KYC": "#f472b6",
      "KYC SWITCH": "#38bdf8",
      "GLIFE.1": "#2dd4bf",
      "GLIFE.2": "#0d9488",
      "ABUSER": "#64748b",
      "DISCONNECT": "#60a5fa"
    }
  }
};

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
    color: "#0284c7",
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
    color: "#dc2626",
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
    color: "#0d9488",
    chip: { text: "R.NOT", color: "#065f46" },
    defaultReason: "Not started",
    reasons: ["Not started","UA to legal"],
    userNotesText: "Reactivation - for reset KYC not started",
    zoomText: `REACTIVATION - FOR RESET KYC NOT STARTED

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
        zoomText: `REACTIVATION - FOR RESET KYC NOT STARTED

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
    color: "#7c3aed",
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
    color: "#6366f1",
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
    color: "#8b5cf6",
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
    color: "#e11d48",
    chip: { text: "", color: "#dc2626" },
    defaultReason: "Review Needed",
    reasons: ["Review Needed","Rejected","Not Started","Pending"],
    userNotesText: "For Manual Verification | [Name] | [DOB]",
    zoomText: `For manual verification
[Reason] in nano / verified in meta

User ID: [User ID]
Name: [Name]
Date of Birth: [DOB]

Pasuyo po TLs`,
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
[Reason] in nano / verified in meta

User ID: [User ID]
Name: [Name]
Date of Birth: [DOB]

Pasuyo po TLs`
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
    color: "#059669",
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
    color: "#0f766e",
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
    color: "#475569",
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
  soundFeedback: true,
  customTemplates: {},
  customOptions: null,
  notesWordingVersion: 0,
  remoteTemplatesVersion: 0,
  tlMentions: "@Jetro",
  successSound: "voice"
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

function getPagcorAgeInfo(dobStr) {
  const ageStr = ageFromDob(dobStr);
  if (!ageStr) return null;
  const age = parseInt(ageStr, 10);
  if (isNaN(age)) return null;

  if (age < 18) {
    return {
      age,
      status: "Minor (< 18)",
      badgeClass: "is-minor",
      badgeIcon: "🔴",
      badgeText: `🔴 Minor (${age})`,
      bracket: "Minor (< 18)",
      noteText: `${age} (Minor < 18)`
    };
  } else if (age < 21) {
    return {
      age,
      status: "PAGCOR Restricted (18 to 20)",
      badgeClass: "is-pagcor-restricted",
      badgeIcon: "🟠",
      badgeText: `🟠 PAGCOR Restricted (${age})`,
      bracket: "PAGCOR Restricted (18 to 20)",
      noteText: `${age} (PAGCOR Restricted 18-20)`
    };
  } else {
    return {
      age,
      status: "Legal (21+)",
      badgeClass: "is-legal",
      badgeIcon: "🟢",
      badgeText: `🟢 Legal (${age})`,
      bracket: "Legal (21+)",
      noteText: `${age} (Legal 21+)`
    };
  }
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
  const pagcorInfo = getPagcorAgeInfo(dobVal);

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
    "[PAGCOR AGE]": pagcorInfo ? pagcorInfo.bracket : "",
    "[AGE BRACKET]": pagcorInfo ? pagcorInfo.bracket : "",
    "[AGE WITH STATUS]": pagcorInfo ? pagcorInfo.noteText : ageVal,
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

function applyTlMentionsToNote(text, tlMentions) {
  if (!text) return "";
  const m = (tlMentions != null ? String(tlMentions) : "@Jetro").trim();
  const pasuyoRegex = /(?:Pasuyo(?:\s+po)?\s+TLs?)(?:\s+@[^\r\n]*)?/i;
  if (pasuyoRegex.test(text)) {
    return text.replace(pasuyoRegex, m ? `Pasuyo po TLs ${m}` : "Pasuyo po TLs");
  } else if (m) {
    return text.trim() + `\n\nPasuyo po TLs ${m}`;
  }
  return text;
}

function renderFinalEscalationNote(data, customTemplate, tlMentions) {
  const tpl = customTemplate || DEFAULT_FINAL_NOTE_TEMPLATE;
  const baseNote = renderEscalationNote(tpl, data);
  const mentions = tlMentions != null ? tlMentions : (data && data.tlMentions);
  return applyTlMentionsToNote(baseNote, mentions);
}

if (typeof window !== "undefined") {
  window.DEFAULT_ESCALATION_OPTIONS = DEFAULT_ESCALATION_OPTIONS;
  window.BUTTON_COLOR_PALETTES = BUTTON_COLOR_PALETTES;
  window.DEFAULT_FINAL_NOTE_TEMPLATE = DEFAULT_FINAL_NOTE_TEMPLATE;
  window.EscalationDictionary = ESCALATION_DICTIONARY;
  window.EscalationKeysOrder = ESCALATION_KEYS_ORDER;
  window.DefaultEscalationSettings = DEFAULT_SETTINGS;
  window.renderEscalationNote = renderEscalationNote;
  window.renderFinalEscalationNote = renderFinalEscalationNote;
  window.applyTlMentionsToNote = applyTlMentionsToNote;
  window.getPagcorAgeInfo = getPagcorAgeInfo;
}

if (typeof globalThis !== "undefined") {
  globalThis.DEFAULT_ESCALATION_OPTIONS = DEFAULT_ESCALATION_OPTIONS;
  globalThis.BUTTON_COLOR_PALETTES = BUTTON_COLOR_PALETTES;
  globalThis.DEFAULT_FINAL_NOTE_TEMPLATE = DEFAULT_FINAL_NOTE_TEMPLATE;
  globalThis.EscalationDictionary = ESCALATION_DICTIONARY;
  globalThis.EscalationKeysOrder = ESCALATION_KEYS_ORDER;
  globalThis.DefaultEscalationSettings = DEFAULT_SETTINGS;
  globalThis.renderEscalationNote = renderEscalationNote;
  globalThis.renderFinalEscalationNote = renderFinalEscalationNote;
  globalThis.applyTlMentionsToNote = applyTlMentionsToNote;
  globalThis.getPagcorAgeInfo = getPagcorAgeInfo;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    DEFAULT_ESCALATION_OPTIONS,
    BUTTON_COLOR_PALETTES,
    DEFAULT_FINAL_NOTE_TEMPLATE,
    ESCALATION_DICTIONARY,
    ESCALATION_KEYS_ORDER,
    DEFAULT_SETTINGS,
    renderEscalationNote,
    renderFinalEscalationNote,
    applyTlMentionsToNote,
    getPagcorAgeInfo
  };
}
