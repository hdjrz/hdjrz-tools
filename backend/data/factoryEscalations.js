/**
 * Factory Escalation Definitions (Phase 9)
 * Exactly 14 default escalations imported from factory configuration.
 */
export const FACTORY_ESCALATIONS = [
  {
    "code": "ACR",
    "label": "ACR",
    "meaning": "Account Closure Request",
    "description": "Player requested to close/disable their account voluntarily.",
    "group": "Account Closure",
    "color": "#2563eb",
    "chip": {
      "text": "",
      "color": "#dc2626"
    },
    "defaultReason": "Losing player",
    "reasons": [
      "Losing player",
      "Gambling Addiction",
      "Stop playing",
      "Mental health problem",
      "Personal",
      "Not provide reason",
      "Duplicate account"
    ],
    "userNotesText": "ACR / [CID] / [Reason]",
    "zoomText": "FOR BLOCKING - Account Closure Request\n\nUser ID: [User ID]\nReason: [Reason]\nCID: [CID]\nNotes/tracker added\n\nPasuyo po TLs",
    "noteChoices": [
      {
        "label": "User Notes",
        "userNotesText": "ACR / [CID] / [Reason]"
      }
    ],
    "zoomChoices": [
      {
        "label": "Zoom",
        "zoomText": "FOR BLOCKING - Account Closure Request\n\nUser ID: [User ID]\nReason: [Reason]\nCID: [CID]\nNotes/tracker added\n\nPasuyo po TLs"
      }
    ],
    "status": "active",
    "order": 1,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-01-01T00:00:00.000Z"
  },
  {
    "code": "ACR-PAGCOR",
    "label": "ACR-PAGCOR",
    "meaning": "Account Closure Request (PAGCOR)",
    "description": "Regulatory or formal self-exclusion mandated by PAGCOR.",
    "group": "Account Closure",
    "color": "#0284c7",
    "chip": {
      "text": "",
      "color": "#dc2626"
    },
    "defaultReason": "Self-Exclusion with PAGCOR",
    "reasons": [
      "Self-Exclusion with PAGCOR"
    ],
    "userNotesText": "[CID] - ACR Self-Exclusion with PAGCOR",
    "zoomText": "FOR BLOCKING - Account Closure Request\n\nUser ID: [User ID]\nReason: Self-Exclusion with PAGCOR\nCID: [CID]\n\nNotes/tracker added\n\nPasuyo po TLs",
    "noteChoices": [
      {
        "label": "User Notes",
        "userNotesText": "[CID] - ACR Self-Exclusion with PAGCOR"
      }
    ],
    "zoomChoices": [
      {
        "label": "Zoom",
        "zoomText": "FOR BLOCKING - Account Closure Request\n\nUser ID: [User ID]\nReason: Self-Exclusion with PAGCOR\nCID: [CID]\n\nNotes/tracker added\n\nPasuyo po TLs"
      }
    ],
    "status": "active",
    "order": 2,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-01-01T00:00:00.000Z"
  },
  {
    "code": "ACR - PERMA",
    "label": "ACR - PERMA",
    "meaning": "Permanent Account Closure",
    "description": "Account permanently banned or closed with zero chance of reopening.",
    "group": "Account Closure",
    "color": "#dc2626",
    "chip": {
      "text": "",
      "color": "#dc2626"
    },
    "defaultReason": "Gambling Addiction",
    "reasons": [
      "Gambling Addiction",
      "Losing Player",
      "Stop playing",
      "Mental health problem",
      "Not provide reason"
    ],
    "userNotesText": "ACR / [CID] / Permanent Block - [Reason]",
    "zoomText": "FOR BLOCKING - Account Closure Request - Permanent\n\nUser ID: [User ID]\nReason: [Reason]\nCID: [CID]\nNotes/tracker added\n\nPasuyo po TLs",
    "noteChoices": [
      {
        "label": "User Notes",
        "userNotesText": "ACR / [CID] / Permanent Block - [Reason]"
      }
    ],
    "zoomChoices": [
      {
        "label": "Zoom",
        "zoomText": "FOR BLOCKING - Account Closure Request - Permanent\n\nUser ID: [User ID]\nReason: [Reason]\nCID: [CID]\nNotes/tracker added\n\nPasuyo po TLs"
      }
    ],
    "status": "active",
    "order": 3,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-01-01T00:00:00.000Z"
  },
  {
    "code": "REACT",
    "label": "REACT",
    "meaning": "Account Reactivation Request",
    "description": "Player reached out requesting to reopen a previously closed account.",
    "group": "Reactivation",
    "color": "#059669",
    "chip": {
      "text": "",
      "color": "#dc2626"
    },
    "defaultReason": "Wants to play again",
    "reasons": [
      "Wants to play again"
    ],
    "userNotesText": "[CID] - Reactivation - [Reason]",
    "zoomText": "Account Reactivation Request\n\nUser ID: [User ID]\nCID: [CID]\nReason: [Reason]\nName: [Name]\nDOB: [DOB]\n\nNotes/tracker added\n\nPasuyo po TLs",
    "noteChoices": [
      {
        "label": "User Notes",
        "userNotesText": "[CID] - Reactivation - [Reason]"
      }
    ],
    "zoomChoices": [
      {
        "label": "Zoom",
        "zoomText": "Account Reactivation Request\n\nUser ID: [User ID]\nCID: [CID]\nReason: [Reason]\nName: [Name]\nDOB: [DOB]\n\nNotes/tracker added\n\nPasuyo po TLs"
      }
    ],
    "status": "active",
    "order": 4,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-01-01T00:00:00.000Z"
  },
  {
    "code": "REACT NOT",
    "label": "REACT NOT",
    "meaning": "Reactivation Not Allowed",
    "description": "Reactivation declined due to permanent closure, policy, or unresolved flags.",
    "group": "Reactivation",
    "color": "#0d9488",
    "chip": {
      "text": "R.NOT",
      "color": "#065f46"
    },
    "defaultReason": "Not started",
    "reasons": [
      "Not started",
      "UA to legal"
    ],
    "userNotesText": "Reactivation - for reset KYC not started",
    "zoomText": "REACTIVATION - FOR RESET KYC NOT STARTED\n\nUser ID: [User ID]\nCID: [CID]\nNotes/tracker added\n\nPasuyo po TLs",
    "noteChoices": [
      {
        "label": "R.NOT — not started",
        "userNotesText": "Reactivation - for reset KYC not started"
      },
      {
        "label": "R.UA — UA to legal",
        "userNotesText": "UA to legal - For reset | [CID]"
      }
    ],
    "zoomChoices": [
      {
        "label": "Not started",
        "zoomText": "REACTIVATION - FOR RESET KYC NOT STARTED\n\nUser ID: [User ID]\nCID: [CID]\nNotes/tracker added\n\nPasuyo po TLs"
      },
      {
        "label": "UA to legal",
        "zoomText": "REACTIVATION - FOR RESET UA TO LEGAL\n\nUser ID: [User ID]\nCID: [CID]\nName: [Name]\nDate of Birth: [DOB]\nRegistered mobile number:\nEmail address:\n\nPasuyo po TLs"
      }
    ],
    "status": "active",
    "order": 5,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-01-01T00:00:00.000Z"
  },
  {
    "code": "NGP NON-X",
    "label": "NGP NON-X",
    "meaning": "NGP Non-Exclusive Player",
    "description": "Escalation for players tagged under Non-Exclusive Next Gen Player program.",
    "group": "Special Programs",
    "color": "#d97706",
    "chip": {
      "text": "R.UA",
      "color": "#b45309"
    },
    "defaultReason": "Underage NGP NON-XENDIT",
    "reasons": [
      "Underage NGP NON-XENDIT"
    ],
    "userNotesText": "NOT OK for RETAKE: Doc-UA | [Name] | [DOB] ([AGE])",
    "zoomText": "FOR BLOCKING - UNDERAGE NGP NON-XENDIT\n(Waiting to other details)\n\nUser ID: [User ID]\nCID: [CID]\nName: [Name]\nDate of Birth: [DOB] ([AGE])\n\nPasuyo po TLs",
    "noteChoices": [
      {
        "label": "User Notes",
        "userNotesText": "NOT OK for RETAKE: Doc-UA | [Name] | [DOB] ([AGE])"
      }
    ],
    "zoomChoices": [
      {
        "label": "Zoom",
        "zoomText": "FOR BLOCKING - UNDERAGE NGP NON-XENDIT\n(Waiting to other details)\n\nUser ID: [User ID]\nCID: [CID]\nName: [Name]\nDate of Birth: [DOB] ([AGE])\n\nPasuyo po TLs"
      }
    ],
    "status": "active",
    "order": 6,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-01-01T00:00:00.000Z"
  },
  {
    "code": "NDRP",
    "label": "NDRP",
    "meaning": "Non-Deposit Reward Program",
    "description": "Issues concerning free credits, vouchers, or no-deposit rewards.",
    "group": "Financial & Rewards",
    "color": "#7c3aed",
    "chip": {
      "text": "",
      "color": "#dc2626"
    },
    "defaultReason": "NDRP - NGP For Refund",
    "reasons": [
      "NDRP - NGP For Refund",
      "Custom watchlist"
    ],
    "userNotesText": "",
    "zoomText": "FOR BLOCKING - NDRP - NGP For Refund\n(Waiting for other details)\n\nUser ID: [User ID]\nCID: [CID]\n\n[Name]\nDate of birth (age)\n[DOB] ([AGE])\n\nPasuyo po TLs",
    "noteChoices": [
      {
        "label": "User Notes",
        "userNotesText": ""
      }
    ],
    "zoomChoices": [
      {
        "label": "NDRP blocking",
        "zoomText": "FOR BLOCKING - NDRP - NGP For Refund\n(Waiting for other details)\n\nUser ID: [User ID]\nCID: [CID]\n\n[Name]\nDate of birth (age)\n[DOB] ([AGE])\n\nPasuyo po TLs"
      },
      {
        "label": "Custom watchlist",
        "zoomText": "FOR ESCALATION - CUSTOM WATCHLIST\n\nUser ID: [User ID]\nName: [Name]\nDate of Birth: [DOB]\n\nPasuyo po TLs"
      }
    ],
    "status": "active",
    "order": 7,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-01-01T00:00:00.000Z"
  },
  {
    "code": "UA W/FUNDS",
    "label": "UA W/FUNDS",
    "meaning": "Unauthorized Access with Funds",
    "description": "Compromised or hacked account that currently holds a cash balance.",
    "group": "Security & Fraud",
    "color": "#6366f1",
    "chip": {
      "text": "For escalation",
      "color": "#b91c1c"
    },
    "defaultReason": "Underage with funds",
    "reasons": [
      "Underage with funds"
    ],
    "userNotesText": "NOT OK for RETAKE: Doc-UA | [Name] | [DOB] ([AGE])",
    "zoomText": "FOR BLOCKING - UNDERAGE WITH FUNDS\n(Waiting for national ID)\n\nUser ID: [User ID]\nCID: [CID]\nName: [Name]\nDOB : [DOB] ([AGE])\n\nPasuyo po TLs",
    "noteChoices": [
      {
        "label": "User Notes",
        "userNotesText": "NOT OK for RETAKE: Doc-UA | [Name] | [DOB] ([AGE])"
      }
    ],
    "zoomChoices": [
      {
        "label": "Zoom",
        "zoomText": "FOR BLOCKING - UNDERAGE WITH FUNDS\n(Waiting for national ID)\n\nUser ID: [User ID]\nCID: [CID]\nName: [Name]\nDOB : [DOB] ([AGE])\n\nPasuyo po TLs"
      }
    ],
    "status": "active",
    "order": 8,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-01-01T00:00:00.000Z"
  },
  {
    "code": "UA WO/FUNDS",
    "label": "UA WO/FUNDS",
    "meaning": "Underage without funds",
    "description": "Underage player with no remaining balance.",
    "group": "Security & Fraud",
    "color": "#8b5cf6",
    "chip": {
      "text": "",
      "color": "#dc2626"
    },
    "defaultReason": "Underage without funds",
    "reasons": [
      "Underage without funds"
    ],
    "userNotesText": "NOT OK for RETAKE: Doc-UA | [Name] | [DOB] ([AGE])",
    "zoomText": "FOR BLOCKING - UNDERAGE WITHOUT FUNDS\n\nUser ID: [User ID]\nCID: [CID]\nName: [Name]\nDOB : [DOB] ([AGE])\n\nPasuyo po TLs",
    "noteChoices": [
      {
        "label": "User Notes",
        "userNotesText": "NOT OK for RETAKE: Doc-UA | [Name] | [DOB] ([AGE])"
      }
    ],
    "zoomChoices": [
      {
        "label": "Zoom",
        "zoomText": "FOR BLOCKING - UNDERAGE WITHOUT FUNDS\n\nUser ID: [User ID]\nCID: [CID]\nName: [Name]\nDOB : [DOB] ([AGE])\n\nPasuyo po TLs"
      }
    ],
    "status": "active",
    "order": 9,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-01-01T00:00:00.000Z"
  },
  {
    "code": "MANUAL KYC",
    "label": "MANUAL KYC",
    "meaning": "Manual KYC Document Review",
    "description": "Automated verification failed; manual review of submitted IDs needed.",
    "group": "KYC & Verification",
    "color": "#e11d48",
    "chip": {
      "text": "",
      "color": "#dc2626"
    },
    "defaultReason": "Review Needed",
    "reasons": [
      "Review Needed",
      "Rejected",
      "Not Started",
      "Pending"
    ],
    "userNotesText": "For Manual Verification | [Name] | [DOB] ([AGE])",
    "zoomText": "For manual verification\n[Reason] in nano / verified in meta\n\nUser ID: [User ID]\nName: [Name]\nDate of Birth: [DOB] ([AGE])\n\nPasuyo po TLs",
    "noteChoices": [
      {
        "label": "User Notes",
        "userNotesText": "For Manual Verification | [Name] | [DOB] ([AGE])"
      }
    ],
    "zoomChoices": [
      {
        "label": "Zoom",
        "zoomText": "For manual verification\n[Reason] in nano / verified in meta\n\nUser ID: [User ID]\nName: [Name]\nDate of Birth: [DOB] ([AGE])\n\nPasuyo po TLs"
      }
    ],
    "status": "active",
    "order": 10,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-01-01T00:00:00.000Z"
  },
  {
    "code": "KYC SWITCH",
    "label": "KYC SWITCH",
    "meaning": "KYC Verification Switch",
    "description": "Switching player's verification method (e.g. from SMS OTP to Manual or email).",
    "group": "KYC & Verification",
    "color": "#0891b2",
    "chip": {
      "text": "",
      "color": "#0d9488"
    },
    "defaultReason": "Escalation requested",
    "reasons": [
      "Escalation requested"
    ],
    "userNotesText": "New Verified account: KYC switch - [Name] / [DOB] ([AGE]) - DUP ID's: [Verified UID]",
    "zoomText": "FOR KYC SWITCH\n\n[Rejected accounts]\n\nName: [Name]\nDate of Birth: [DOB]\n\nPasuyo po TLs",
    "noteChoices": [
      {
        "label": "New Verified account",
        "userNotesText": "New Verified account: KYC switch - [Name] / [DOB] ([AGE]) - DUP ID's: [Verified UID]"
      },
      {
        "label": "Old account",
        "userNotesText": "The Old account: KYC switch - New account UID: [New Account UID]"
      }
    ],
    "zoomChoices": [
      {
        "label": "2 accounts",
        "zoomText": "FOR KYC SWITCH\n\n[Rejected accounts]\n\nName: [Name]\nDate of Birth: [DOB]\n\nPasuyo po TLs"
      },
      {
        "label": "3 or more",
        "zoomText": "FOR KYC ASSESSMENT - Multiple Accounts (not bonus abuser)\n\n[Rejected accounts]\n\nName: [Name]\nDate of Birth: [DOB]\n\nPasuyo po TLs"
      }
    ],
    "status": "active",
    "order": 11,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-01-01T00:00:00.000Z"
  },
  {
    "code": "GLIFE.1",
    "label": "GLIFE.1",
    "meaning": "GLife Escalation Tier 1",
    "description": "First-level escalation for GCash GLife mini-app transactions or sync issues.",
    "group": "GLife Partner",
    "color": "#059669",
    "chip": {
      "text": "",
      "color": "#dc2626"
    },
    "defaultReason": "GLife mini-app sync issue / Tier 1 inquiry",
    "reasons": [
      "GLife mini-app sync issue / Tier 1 inquiry"
    ],
    "userNotesText": "GLIFE Override | [Name] | [DOB]",
    "zoomText": "FOR GLIFE OVERRIDE\n\nUser ID: [User ID]\nName: [Name]\nDate of birth: [DOB]\nNotes added\n\nPasuyo po TLs",
    "noteChoices": [
      {
        "label": "User Notes",
        "userNotesText": "GLIFE Override | [Name] | [DOB]"
      }
    ],
    "zoomChoices": [
      {
        "label": "Zoom",
        "zoomText": "FOR GLIFE OVERRIDE\n\nUser ID: [User ID]\nName: [Name]\nDate of birth: [DOB]\nNotes added\n\nPasuyo po TLs"
      }
    ],
    "status": "active",
    "order": 12,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-01-01T00:00:00.000Z"
  },
  {
    "code": "GLIFE.2",
    "label": "GLIFE.2",
    "meaning": "GLife Escalation Tier 2",
    "description": "High-priority / urgent escalation for GLife payment failures or account locks.",
    "group": "GLife Partner",
    "color": "#0f766e",
    "chip": {
      "text": "",
      "color": "#dc2626"
    },
    "defaultReason": "gLifeUserId:",
    "reasons": [
      "gLifeUserId:"
    ],
    "userNotesText": "GLife Override / [Reason][GLife ID]",
    "zoomText": "FOR GLIFE OVERRIDE\n\nUser ID: [User ID]\ngLifeUserId: [GLife ID] \nNotes/tracker added\n\nPasuyo po TLs",
    "noteChoices": [
      {
        "label": "User Notes",
        "userNotesText": "GLife Override / [Reason][GLife ID]"
      }
    ],
    "zoomChoices": [
      {
        "label": "Zoom",
        "zoomText": "FOR GLIFE OVERRIDE\n\nUser ID: [User ID]\ngLifeUserId: [GLife ID] \nNotes/tracker added\n\nPasuyo po TLs"
      }
    ],
    "status": "active",
    "order": 13,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-01-01T00:00:00.000Z"
  },
  {
    "code": "ABUSER",
    "label": "ABUSER",
    "meaning": "Bonus / Promo Abuse Flag",
    "description": "System or manual flag for exploiting promotions, multi-accounting, or fraud.",
    "group": "Risk & Compliance",
    "color": "#475569",
    "chip": {
      "text": "",
      "color": "#dc2626"
    },
    "defaultReason": "Permanently Blocked – BONUS ABUSER with Funds",
    "reasons": [
      "Permanently Blocked – BONUS ABUSER with Funds"
    ],
    "userNotesText": "ACR / [CID] / Permanently Blocked – BONUS ABUSER with Funds",
    "zoomText": "FOR BLOCKING - BONUS ABUSER with Funds\n\nUser ID: [User ID]\nCID: [CID]\nName: [Name]\nDate of Birth: [DOB]\nNotes added\n\nPasuyo po TLs",
    "noteChoices": [
      {
        "label": "User Notes",
        "userNotesText": "ACR / [CID] / Permanently Blocked – BONUS ABUSER with Funds"
      }
    ],
    "zoomChoices": [
      {
        "label": "Zoom",
        "zoomText": "FOR BLOCKING - BONUS ABUSER with Funds\n\nUser ID: [User ID]\nCID: [CID]\nName: [Name]\nDate of Birth: [DOB]\nNotes added\n\nPasuyo po TLs"
      }
    ],
    "status": "active",
    "order": 14,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-01-01T00:00:00.000Z"
  }
];
