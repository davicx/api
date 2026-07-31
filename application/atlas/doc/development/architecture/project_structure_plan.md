# CloudPilot — Project Structure Plan (move / rename only)

**Purpose of this doc:** Shareable plan for updating **folders and file layout** under `api/application/atlas/`.  
**Work type:** Move / rename + fix `require()` paths. **Do not rewrite business logic.**  
**Not in this doc:** Product AI prompts, new OpenAI features, Atlas behavior changes.

**Full migration phases + every file path:** [responsibility_refactor.md](./responsibility_refactor.md)

**Last reviewed:** 2026-07-31

---

## Goal

Organize by **responsibility**. Top-level folders each answer one question.

```text
api/application/atlas/

├── routes/                       → How do HTTP requests enter?
├── logic/                        → What workflow runs for that route?
├── functions/                    → Shared helpers / DB classes
│
├── cloudPilot/                   → What features / pipeline does CloudPilot perform?
│   ├── cloudPilotMessageFunctions.js   # STEPS 1–7 entry
│   ├── actionMap.js
│   ├── decision/                 # STEP 4
│   ├── conversation/             # Speak / general / request (NOT understand)
│   ├── scans/
│   ├── changes/
│   ├── requests/
│   ├── history/
│   ├── execution/
│   ├── billing/
│   ├── inventory/
│   ├── aiUsage/
│   └── navigator/
│
├── cloudPilotIntelligence/       → How does CloudPilot think?
│   ├── index.js                  # PUBLIC FACADE — only import this from outside
│   ├── understand/
│   ├── respond/                  # scaffold (later)
│   ├── explain/                  # scaffold (later)
│   ├── improve/                  # scaffold (later)
│   └── generate/                 # scaffold (later)
│
├── providers/                    → What external systems do we talk to?
│   ├── atlas/                    # Node → Atlas HTTP (today’s “AWS via Atlas”)
│   ├── openAI/
│   │   ├── client/
│   │   ├── context/
│   │   └── usage/
│   ├── aws/                      # EMPTY scaffold — future direct AWS
│   ├── github/
│   ├── gmail/                    # EMPTY scaffold
│   ├── jira/                     # EMPTY scaffold (optional)
│   ├── slack/                    # EMPTY scaffold (optional)
│   └── azure/                    # EMPTY scaffold (optional)
│
├── config/
└── doc/                          # Planning only (not runtime)
```

---

## Biggest moves (today → after)

```text
TODAY                                 →  AFTER
────────────────────────────────────────────────────────────────
cloudPilot/conversation/understand/** →  cloudPilotIntelligence/understand/
ai/*                                  →  providers/openAI/{client,context,usage}/
aws/*                                 →  providers/atlas/
services/actions/...                  →  cloudPilot/{scans,changes,billing,inventory,aiUsage}/
services/actions/actionMap.js         →  cloudPilot/actionMap.js
services/navigator/                   →  cloudPilot/navigator/
services/                             →  deleted after absorb
```

**Stay under `cloudPilot/`:** pipeline entry, decision, conversation speak, requests, execution, history, change strategies.

**Understand leaves conversation** and moves to intelligence.

---

## cloudPilotIntelligence — facade + coding style

### Public entry: `index.js`

Outside code should **not** deep-import dozens of search files. It uses the facade:

```javascript
const CloudPilotIntelligence = require('../cloudPilotIntelligence');

const region = await CloudPilotIntelligence.searchForRegion(message);
const response = await CloudPilotIntelligence.respondGeneral(context);
```

`index.js` only re-exports public jobs:

```javascript
module.exports = {
    searchForRegion: require('./understand/region/searchForRegion').searchForRegion,
    searchForAction: require('./understand/action/searchForAction').searchForAction,
    // later: respondGeneral, explainFinding, …
};
```

Anything prefixed with `CloudPilotIntelligence` is intelligence. Providers (OpenAI, etc.) stay behind it.

### Understand layout (near-term)

```text
cloudPilotIntelligence/
├── index.js
└── understand/
    ├── understandMessage.js              # orchestrates extractors (STEP 3)
    ├── region/
    │   └── searchForRegion.js            # entry + internal + AI in ONE file for now
    ├── action/
    │   └── searchForAction.js
    ├── resource/
    │   └── searchForResource.js          # group instance / name / type / tag over time
    ├── conversation/
    │   └── understandConversation.js
    ├── reply/
    └── values/
```

Later, if a file grows, split:

```text
region/
  searchForRegion.js           # entry / switch only
  searchForRegionInternal.js
  searchForRegionOpenAI.js
```

**For now:** prefer **one file** with labeled functions (matches existing API style like `posts.js`).

### Coding style (locked) — entry switches implementation

Same pattern as existing API files: comment blocks + `Function A1`, `Function A2`, …

```javascript
/*
FUNCTIONS A: Region search
    1) Function A1: searchForRegion          ← public entry
    2) Function A2: searchForRegionInternal
    3) Function A3: searchForRegionAI
*/

// Function A1: Public entry — pick implementation from config
async function searchForRegion(message) {
    switch (config.REGION_SEARCH) {   // e.g. CLOUDPILOT_REGION_SEARCH → internal | openai
        case 'openai':
        case 'ai':
            return searchForRegionAI(message);

        case 'internal':
        default:
            return searchForRegionInternal(message);
    }
}

// Function A2: Deterministic / regex
function searchForRegionInternal(message) { … }

// Function A3: OpenAI (calls providers/openAI/…)
async function searchForRegionAI(message) { … }

module.exports = {
    searchForRegion,
    searchForRegionInternal,
    searchForRegionAI
};
```

**Master AI off always wins** (see `config/cloudPilotAIConfig.js`) — even if feature is set to `openai`.

Rest of CloudPilot always calls:

```text
CloudPilotIntelligence.searchForRegion(message)
```

Never cares whether the answer came from regex or OpenAI.

---

## providers/openAI (not “intelligence”)

OpenAI packaging stays a **provider**:

```text
providers/openAI/
  client/     → HTTP / SDK
  context/    → Identity / Situation / Knowledge / history builders
  usage/      → cost / ai_usage persist
```

Intelligence **calls** the provider when the AI path runs. Intelligence does **not** own the OpenAI wire format.

Today’s Atlas HTTP lives under **`providers/atlas/`** (not `providers/aws/` yet). `providers/aws/` is an empty future scaffold for direct AWS SDK.

---

## Flow after structure (behavior unchanged)

```text
HTTP → routes → logic
  → cloudPilot/cloudPilotMessageFunctions (STEPS 1–7)
       STEP 3  CloudPilotIntelligence.understand…
       STEP 4  cloudPilot/decision
       STEP 5–7 cloudPilot/conversation + requests + execution + history
       features cloudPilot/scans | changes | billing | …
       HOW      providers/atlas | providers/openAI | providers/github
```

---

## Scope checklist

| Do | Do not |
|----|--------|
| Create folders / move files / fix imports | Rewrite match rules or prompts |
| Add `cloudPilotIntelligence/index.js` facade | Implement Claude / new LLMs in this pass |
| Empty scaffolds for respond/explain/… and aws/gmail/… | Fill scaffolds with product features |
| Keep STEPS 1–7 contracts | Mix product AI work into the same PR as moves |

---

## Phases (summary)

1. Scaffolds (empty folders + facade stub)  
2. Move `providers/atlas` + `providers/openAI`  
3. Absorb `services/` → `cloudPilot/`  
4. Move understand → `cloudPilotIntelligence/` + wire `index.js`  
5. Delete empty `ai/`, `aws/`, `services/`; refresh README  

Detail: [responsibility_refactor.md](./responsibility_refactor.md)

---

## Success

- Top-level matches the tree above  
- Outside code can use `CloudPilotIntelligence.searchForRegion` (etc.)  
- Smoke: message pipeline, scan, toggle, billing, region internal + OpenAI  
- No intentional behavior change from the moves alone  
