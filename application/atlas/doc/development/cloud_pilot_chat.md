# CloudPilot Chat — context, knowledge & enhanced replies

**Last reviewed:** 2026-07-15

> **Related:** [mvp.md](./mvp.md) · [long_term/make_scans_useful.md](./long_term/make_scans_useful.md) · [long_term/remediations.md](./long_term/remediations.md) · [architecture/architecture.md](./architecture/architecture.md)

**Status:** AI context + system message shipped. **C1b:** `ConversationHistoryContext.getMessages(n)` + STEP 7c (human names) + `OPEN AI MESSAGE` structured payload; history sent when live billing is on.

**Folder layout:**

```text
services/context/
├── contextTypes/
│   ├── cloudPilotContext.js               ← Type 1: Identity (CloudPilot personality)
│   ├── currentQuestionContext.js          ← Type 2: Situation (what's happening now)
│   └── organizationKnowledgeContext.js    ← Type 3: Knowledge — org slice (empty MVP)
├── classes/
│   ├── CurrentQuestionContext.js          ← Situation builder for this turn
│   └── ConversationHistoryContext.js      ← Past turns from DB → { role, content }
├── buildAIContext.js                      ← Collect Identity + Situation + Knowledge
└── buildAISystemMessage.js                ← Write English system message

services/config/
    openAIChatConfig.js                    ← Live send, history limit, log flags
```

**Naming note:** `cloudPilotContext` / `currentQuestionContext` / `organizationKnowledgeContext` stay. **Roles** are Identity / Situation / Knowledge.

**Stable pattern:** CloudPilot **knows** three things (Identity / Situation / Knowledge). Separately, the **chat thread** is conversation history — not a 4th context type. History is loaded by `ConversationHistoryContext` from existing `messages` / `conversations` tables.

---

## Conversation history — `ConversationHistoryContext` (C1b)

**Log-only shipped.** Config: `OPENAI_SEND_CONVERSATION_HISTORY`, `OPENAI_CONVERSATION_HISTORY_LIMIT` (message **rows**, not exchanges).

### Why a class

Identity / Situation / Knowledge are small builders. Chat history is different:

- Talks to the **database** (`messages` table — already saving user + CloudPilot replies)
- Maps DB rows → OpenAI `{ role, content }` shape
- Caller passes **count** via `getMessages(messageHistoryCount)`
- Belongs under `context/classes/`

```text
services/context/classes/ConversationHistoryContext.js
```

### Job (one sentence)

> **Load recent chat message rows for a conversation and format them for the AI request.**

Not Identity. Not Situation. Not Knowledge. Just the thread.

### Reuse existing storage

| Existing | Role |
|----------|------|
| `conversations` | Thread |
| `messages` | User + CloudPilot captions (`message_from`, `message_caption`) |
| `Message.getConversationMessages(conversationID)` | Already loads the thread |
| `Message.createMessageText` | Already saves each turn |

**Do not** create `cloudpilot_conversation_messages`. Map what you already have.

### Methods (MVP)

| Method | What |
|--------|------|
| **`getMessages(messageHistoryCount)`** | Last N **rows**, oldest → newest, exclude current user message already saved this turn |
| Format | Map rows → `[{ role: 'user' \| 'assistant', content: '…' }, …]` |

```text
message_from = davey (user)     → role: user
message_from = CloudPilot       → role: assistant
message_caption                 → content
```

### Where it fits in speakGeneral

```text
buildAIContext()
buildAISystemMessage()          ← STEP 7b (system only — no history text)

ConversationHistoryContext.getMessages(limit)   ← STEP 7c log

sendGeneralChat(...)            ← STEP 7d — still current message only until send is wired
```

When `OPENAI_SEND_CONVERSATION_HISTORY=false` → skip history load / STEP 7c.

### What this class does **not** do

- No Identity / Situation / Knowledge building
- No system message writing (`buildAISystemMessage` stays separate)
- No OpenAI API call (yet)
- No summarization / embeddings
- No new chat tables

### OpenAI request (after send wiring)

```text
System     = buildAISystemMessage(aiContext)
Messages   = [...conversationHistory, { role: 'user', content: current }]
```

Config owns **whether** and **how many**. The class owns **get + format**.

---

## Data-first context (locked — think data, not prompts)

Context builders assemble **structured information**. Only **`buildCloudPilotInstructions.js`** turns that into English for OpenAI.

```text
Identity (data)  +  Situation (data)  +  Knowledge (data)
                        ↓
              buildCloudPilotInstructions()
                        ↓
                 English prompt
                        ↓
                    OpenAI
```

**Why:** Same objects can drive chat, dashboard copy, remediation text, API responses, and docs later. OpenAI is **one consumer** of CloudPilot knowledge — not where knowledge lives.

**Rule:** Context provider files return **data**. They do not write prompt strings (except `buildCloudPilotInstructions.js`).

---

### Standard return shape (every provider)

```js
{
    loaded: true,
    type: "identity" | "situation" | "knowledge",
    data: { /* structured fields — concept names, not prompt prose */ }
}
```

Predictable. Debug = log `{ type, data }` and see exactly what CloudPilot knew.

Use **concept names** (`communication.tone`, `findings[].ruleId`) — not arbitrary keys (`yourPersonality`) — so the model stays readable six months from now.

---

### Type 1 — Identity (data, not string)

**Target — single source of truth:**

```js
// identity/cloudPilotIdentity.js
const cloudPilotIdentity = {
    name: "CloudPilot",
    role: "Cloud infrastructure assistant",
    communication: { tone: "clear", jargon: "avoid_when_possible" },
    goals: [
        "help users understand cloud infrastructure",
        "help users safely manage cloud resources"
    ],
    principles: [
        "explain what is happening",
        "explain why it matters",
        "explain possible risks",
        "explain possible impact"
    ],
    constraints: [
        "never invent AWS findings",
        "CloudPilot owns cloud knowledge",
        "only explain facts provided by CloudPilot"
    ]
};
```

`getCloudPilotContext()` → `{ loaded: true, type: "identity", data: cloudPilotIdentity }`.

**Do not maintain** a parallel `CLOUDPILOT_PERSONALITY_TEXT` string — `buildCloudPilotInstructions()` derives "You are CloudPilot…" from this object.

Stays in **code** — product definition, not DB.

---

### Type 2 — Situation (data)

Pipeline assembles state — **no English in builders:**

```js
{
    loaded: true,
    type: "situation",
    data: {
        userMessage: "scan my EC2",
        currentTask: "Review EC2 findings",
        findings: [
            { ruleId: "ec2_low_cpu", cpuAverage: 2, lookbackDays: 7, estimatedSavings: 18 }
        ],
        selectedResource: { instanceId: "i-…", name: "dev-web-server" },
        openRequest: null,
        previousAction: null,
        executionMode: null,
        capabilities: ["instructions", "cli", "pull_request", "automatic"],
        dashboardData: null
    }
}
```

Built from: request row, handler formatter, decision — not invented in the LLM.

---

### Type 3 — Knowledge (data) — product + organization

#### Product knowledge (repo)

One file per rule — **data objects**, not paragraphs:

```js
// knowledge/product/ec2LowCpu.js
{
    ruleId: "ec2_low_cpu",
    title: "Underutilized EC2 Instance",
    meaning: "The instance has consistently low CPU utilization.",
    whyItMatters: "Running instances with low utilization can create unnecessary cost.",
    possibleImpact: "Stopping or deleting may affect applications if still in use.",
    recommendation: "Verify the instance is no longer needed before removing it."
}
```

MVP: `ec2_low_cpu`, `missing_team_tag` only.

#### Organization knowledge (DB later)

```js
{
    organizationName: "Atlas",
    requiredTags: ["Team", "Environment"],
    deploymentMethod: "Terraform",
    autoRemediationEnabled: false
}
```

`getOrganizationKnowledgeContext({ groupID })` → `{ loaded, type: "knowledge", data: { organization: …, product: [rule snippets for active findings] } }`.

---

### Target folder layout (evolution from today)

```text
services/context/
├── identity/
│   └── cloudPilotIdentity.js          ← data export
├── situation/
│   └── buildSituationContext.js       ← assembles pipeline state into data
├── knowledge/
│   ├── product/
│   │   ├── ec2LowCpu.js
│   │   └── missingTeamTag.js
│   └── organization/
│       └── organizationKnowledgeContext.js   ← DB read later
├── builders/
│   ├── buildConversationContext.js    ← merges { identity, situation, knowledge }
│   └── buildCloudPilotInstructions.js           ← ONLY file that writes English
```

**Today:** `contextTypes/` + transitional string personality — migrate to `cloudPilotIdentity` data + renderer (C2/C5).

---

### Prompt debug logging (development feature)

When ChatGPT says something weird, the prompt log should immediately explain why.

**STEP 8 (after buildCloudPilotInstructions, before OpenAI):**

```text
STEP 8: Build System Prompt
------------------------------------
<full rendered prompt>
------------------------------------
Sending to OpenAI...
```

**Config (implementation later):**

```env
OPENAI_LOG_PROMPTS=true
```

| Environment | Log |
|-------------|-----|
| **Development** | Full rendered prompt + response + token count (optional) |
| **Production** | Nothing (or redacted summary only) |

Log the **rendered prompt** — the same string sent to OpenAI — not a separate debug format.

**Quality bar:** Read the log and think *"Yes, that's exactly what CloudPilot knows right now."* If yes, context system is working.

---

### Pipeline (locked — store data, render prompt, optionally log)

**Do not store prompts.** Store structured context. **Render** to a human-readable prompt in one place before OpenAI.

```text
Identity data (JS object)
Situation data (JS object)
Knowledge data (JS object)
        │
        ▼
buildConversationContext()     ← merge; no English
        │
        ▼
buildCloudPilotInstructions()            ← ONLY renderer: data → human-readable prompt
        │
        ├── Log prompt (dev only, optional)   ← STEP 8
        ▼
OpenAI API
        │
        ▼
Natural reply (category 1 — AI response)
```

**Three benefits of render-from-data:**
1. **Easy debugging** — read the prompt log; see exactly what CloudPilot knew
2. **Easy prompt tuning** — change one renderer, not scattered strings
3. **Easy to understand logs** — if the prompt looks right, the system is right

**One source of truth:** never maintain `CLOUDPILOT_PERSONALITY_TEXT` as a separate string. Always:

```text
cloudPilotIdentity { name, communication, principles, … }
        ↓
buildCloudPilotInstructions()
        ↓
"You are CloudPilot…"   ← derived, not stored
```

---

### What `buildCloudPilotInstructions` does (only renderer)

**Input:** `{ identity, situation, knowledge }` — each `{ loaded, type, data }`.

**Output:** one **human-readable** system prompt string (not raw JSON dump to OpenAI for MVP — **render** fields into readable sections).

**Example output** (what OpenAI receives — and what dev logs show):

```text
==================================================
IDENTITY
==================================================

You are CloudPilot.

CloudPilot helps users understand and safely manage
cloud infrastructure.

Speak clearly. Avoid unnecessary jargon.

Always explain:
• what is happening
• why it matters
• possible risks

Never invent AWS findings.

==================================================
CURRENT SITUATION
==================================================

The user asked:
"Scan my EC2 instances."

Current task:
Review EC2 findings

Current findings:
• Underutilized EC2 instance — Average CPU: 2%, estimated savings: $18/month
• Missing Team tag on dev-web-server

==================================================
PRODUCT KNOWLEDGE
==================================================

Underutilized instances often create unnecessary cost.
Missing Team tags make ownership difficult to determine.

==================================================
ORGANIZATION KNOWLEDGE
==================================================

Organization: Kite
(required tags: Team, Environment — when DB wired)

==================================================
END
==================================================
```

**Rules for the renderer:**
- Derive all prose from `.data` fields — no second copy of personality in a string constant
- Skip empty sections (e.g. Organization when `{}`)
- No AWS business logic — only formatting
- Same data objects feed dashboard/templates; renderer is **OpenAI-specific presentation**

**Never** store pre-written finding sentences as the source. Store `{ ruleId, cpuAverage, estimatedSavings, recommendation }`; renderer turns that into bullets.

**Tuning:** improve section layout in **this file only** — data unchanged.

---

### Reuse beyond OpenAI

| Consumer | Uses same data |
|----------|----------------|
| Chat (OpenAI) | `buildCloudPilotInstructions()` |
| Dashboard recommendation card | `finding` + product rule `.title`, `.whyItMatters` |
| Handler message builder (no AI) | `recommendation` field from rule object |
| Future docs / tooltips | export rule modules |

This is why data-first beats prompt-first.

---

## Core idea (locked)

Do **not** think of this as “OpenAI context.” Think of it as **CloudPilot Context**.

```text
User
    ↓
CloudPilot
    ↓
Build Context
    ↓
OpenAI (optional)
    ↓
Response
```

Context belongs to **CloudPilot**. Today it may be sent to OpenAI. Tomorrow it could go to another model, or a local model. The pipeline stays the same.

**Defining strength:** Most AI cloud tools dump raw AWS data into an LLM or let the LLM reason from live resources. CloudPilot is different:

1. **Atlas** discovers facts.
2. **CloudPilot** interprets and curates those facts (Knowledge).
3. **OpenAI** (optional) turns trusted information into clear, natural language.

CloudPilot owns cloud knowledge. OpenAI owns conversation — not discovery.

**Best demo quality comes from curated facts in Situation + Knowledge**, not from personality prose. OpenAI turns pre-written findings into natural language; it does not invent AWS state.

---

## Long-term flow (locked)

```text
User Message
        │
        ▼
CloudPilot Pipeline
        │
        ▼
Build Context
────────────────────────
Identity      Who am I? How do I speak? Boundaries?
Situation     What's happening right now? (full state)
Knowledge     What background should I use? (product + org)
────────────────────────
        │
        ▼
buildCloudPilotInstructions()   ← almost no logic; join sections
        │
        ▼
OpenAI (optional)
        │
        ▼
Natural CloudPilot Response
```

All intelligence lives in **building the context objects**. Prompt builder only formats. Debug = print Identity, Situation, Knowledge and see why CloudPilot answered.

---

## Architecture

```text
Atlas
    ↓
Raw AWS facts (rule_id, resource ids, states)

CloudPilot Knowledge
    ↓
Rule meanings, tradeoffs, confidence, action labels

Context Builder
    ↓
general_context + relevant_context + org_knowledge + current_facts

OpenAI (optional)
    ↓
Natural explanation

CloudPilot UI
    ↓
Chat reply (+ dashboard detail when applicable)
```

**Never send raw AWS output to OpenAI.** Send curated facts CloudPilot already trusts.

---

## The three context types — by **role**, not source

| Role | File (today) | Question | MVP source | Later source |
|------|--------------|----------|------------|--------------|
| **1 — Identity** | `cloudPilotContext.js` | Who am I? How should I speak? Goals? Boundaries? | **Code** — product voice | Env/file tuning; **never DB** |
| **2 — Situation** | `currentQuestionContext.js` | **What's happening right now?** (whole state, not just user text) | Pipeline + handler output | Same; richer fields over time |
| **3 — Knowledge** | `organizationKnowledgeContext.js` + `services/knowledge/` | What background should I know before answering? | Product: repo files; Org: `{}` | Product: Git; Org: **DB**; integrations later |

---

### Type 1 — Identity

Never really changes. Part of the product — **stays in code forever.**

```js
getCloudPilotContext() → { loaded: true, text: CLOUDPILOT_PERSONALITY_TEXT }
```

Covers: who CloudPilot is, tone, goals, boundaries (“never invent AWS findings”).

---

### Type 2 — Situation (most important for MVP)

Answers: **“What is happening right now?”** — the entire situation, not prompt engineering.

**Target shape** (fields appear as pipeline provides them; empty keys omitted):

```js
{
    userMessage: "scan my EC2",

    previousAction: null,

    openRequest: {
        action: "scan_ec2",
        displayName: "Kite EC2 scan",
        status: "waiting_on_confirmation",
        collected: { region: "us-west-2" }
    },

    currentTask: "Review EC2 findings",

    selectedResource: {
        instanceId: "i-…",
        name: "dev-web-server"
    },

    findings: [
        {
            rule: "ec2_low_cpu",
            cpuAverage: 2,
            lookbackDays: 7,
            estimatedSavings: 18
        },
        {
            rule: "missing_team_tag"
        }
    ],

    dashboardData: null,

    executionMode: null,

    capabilities: ["instructions", "cli", "pull_request", "automatic"]
}
```

This is **current CloudPilot state** — assembled from request row, last handler, decision. Not raw Atlas JSON.

**MVP today:** `{ userMessage }` only. **Next:** populate after scan, open request, capabilities help.

| When | What to fill in Situation |
|------|---------------------------|
| Idle chat | `userMessage` |
| “What can you do?” | `userMessage` + supported EC2 capabilities list |
| Open request | `openRequest`, `executionMode`, `capabilities` |
| After scan | `findings`, `selectedResource`, `currentTask`, `dashboardData` summary |
| After action | `previousAction` |

---

### Type 3 — Knowledge (two slices)

Answers: **“What background knowledge should CloudPilot know?”**

Do **not** conflate with Situation. Situation = live state this turn. Knowledge = durable reference material.

#### Product knowledge (ships with CloudPilot)

- AWS rule meanings (`ec2_low_cpu`, `missing_team_tag`)
- Risk, impact, suggested fixes, “why it matters”
- **Lives in Git:** `services/knowledge/ec2Rules.js` (C5)
- Version controlled; CloudPilot owns truth

**Quality bar for demo** — store **data objects**; presentation is derived:

```js
// source of truth (knowledge/product/ec2LowCpu.js)
{ ruleId: "ec2_low_cpu", cpuAverage: 2, estimatedSavings: 18, recommendation: "…" }
```

OpenAI receives JSON via `buildCloudPilotInstructions()` and **speaks** it — it does not invent facts.

#### Organization knowledge (per company)

- Team tag required, Terraform only, no auto-delete on prod, change windows, etc.
- **Lives in database** later (`groupID` → standards blob)
- **Today:** `organizationKnowledgeContext.js` returns `{}`

Company A vs Company B policies — absolutely DB-backed long term.

**Assembler merges both slices** into Type 3 for `buildCloudPilotInstructions()`:

```js
knowledge: {
    product: [ /* snippets from ec2Rules.js for active findings */ ],
    organization: { /* from DB */ }
}
```

---

## Will context come from a database?

| Data | Role | Database? |
|------|------|-----------|
| Identity / personality | Type 1 | **No** — product |
| Situation (findings, request, resource) | Type 2 | **Pipeline** (+ request row already in MySQL) |
| Product knowledge (rule meanings) | Type 3 | **No** — repo (`services/knowledge/`) |
| Organization standards | Type 3 | **Yes** — per org/group |
| Chat history in prompt | Situation (optional) | Messages table — **not MVP** |

```text
services/knowledge/  ──► Knowledge (product)
                              │
request row + handler ──► Situation ◄──┘ (findings trigger product snippets)
                              │
organizationKnowledgeContext ──► Knowledge (org, DB later)
                              │
cloudPilotContext ──► Identity
                              │
                    buildCloudPilotInstructions()
```

---

CloudPilot owns `{ findings, principles, organization, capabilities }` as **data**.

OpenAI receives **human-readable explanation of those facts** — rendered once, loggable, tunable.

Those are different responsibilities.

---

```text
Atlas     →  raw facts
Knowledge →  product rule data objects
Situation →  findings[], selectedResource, currentTask
Context   →  merge Identity + Situation + Knowledge (data)
Renderer  →  buildCloudPilotInstructions() → readable prompt
OpenAI    →  natural paragraph
Logs      →  same prompt string (dev)
```

---

## Builders — `buildCloudPilotInstructions()` is the only renderer

**Conversation context:** `buildConversationContext()`

```js
{
    identity: { loaded, type: "identity", data: { … } },
    situation: { loaded, type: "situation", data: { … } },
    knowledge: { loaded, type: "knowledge", data: { product: [], organization: {} } }
}
```

**Renderer:** `buildCloudPilotInstructions(context)` → human-readable string (see Pipeline section above).

```js
const context = buildConversationContext(input);
const systemPrompt = buildCloudPilotInstructions(context);
// if OPENAI_LOG_PROMPTS: log STEP 8 systemPrompt
// OpenAI: system = systemPrompt, user = context.situation.data.userMessage
```

No AWS logic in renderer. Intelligence stays in **assembling** `.data`; renderer only **formats**.

---

## MVP demo — what “working pretty good” means

Three prompts must feel natural with `OPEN_AI_LIVE_SEND_ALL_MESSAGES_WILL_CAUSE_BILLING=true`:

### A) “What can you do?”

**Situation** includes supported EC2 capabilities (from [mvp.md](./mvp.md) M0b manifest):

```text
CURRENT SITUATION
userMessage: what can you do?
capabilities: [ scan, create, delete, tag, undo tag ]
note: S3/RDS coming soon — do not offer as available
```

### B) After EC2 scan (main demo — C4)

**Situation** carries live state; **Knowledge (product)** carries curated finding prose:

```js
// Situation
findings: [
  { rule: "ec2_low_cpu", cpuAverage: 2, lookbackDays: 7, estimatedSavings: 18,
    resourceName: "dev-web-server" },
  { rule: "missing_team_tag", resourceName: "dev-web-server" }
]
currentTask: "Review EC2 findings"
```

```js
// Knowledge (product) — data objects from knowledge/product/*.js
[
  { ruleId: "ec2_low_cpu", title: "…", meaning: "…", whyItMatters: "…", … }
]
```

Target chat output: combined paragraph from [mvp.md](./mvp.md) demo script Beat 3 — **via OpenAI**, not pre-stored prose.

**Where it runs:** after `scan_ec2` handler success — optional AI wrap on `cloudPilotMessage`; `navigatorResponse` unchanged.

### C) General cloud question (no action)

**Situation** = `userMessage` only. **Identity** provides voice. **Knowledge** empty unless org standards exist later.

OpenAI rephrases; must not invent AWS resources. **Fallback:** template if AI off or fails.

---

---

## Two response categories (locked boundary)

Every user-facing message is **either** an AI response **or** a CloudPilot template response. **Protect this boundary** — do not let OpenAI creep into deterministic flows.

### 1. AI responses (OpenAI)

**Conversations** — explain, advise, compare, help decide.

| Examples | Path |
|----------|------|
| Explain a scan | Identity + Situation + Knowledge → `buildCloudPilotInstructions()` → OpenAI |
| Answer general AWS questions | Same (Situation minimal) |
| Explain why a finding matters | Product knowledge data + Situation findings |
| Compare options / help decide whether to fix | Situation + Knowledge |
| “What can you do?” (when AI on) | Situation + static capabilities data |

```text
Identity + Situation + Knowledge
        ↓
buildCloudPilotInstructions()   ← JSON sections MVP; presentation layer only
        ↓
OpenAI
        ↓
Natural explanation
```

**Entry point:** `CloudPilotMessage.speakGeneral()` and (C4) optional AI wrap after scan explainers.

Requires: `OPEN_AI_LIVE_SEND_ALL_MESSAGES_WILL_CAUSE_BILLING=true` + `OPENAI_API_KEY`. **Fallback** to templates if off or error.

---

### 2. CloudPilot responses (templates)

**Deterministic** — control flow, legal-style copy, execution status. **Never OpenAI.**

| Examples | Why template |
|----------|----------------|
| Missing required field | Exact prompt every time |
| Confirmation dialog | User must trust wording |
| Mode picker (1–4) | Product differentiator — consistent labels |
| Delete warning (“cannot be undone”) | Safety — no paraphrase |
| Execution started / success / failure | Status — no token spend |
| Pre-execute summary with savings + undo line | Deterministic when product chooses |
| Undo complete | Trust + audit clarity |
| Errors (`atlas_unreachable`, etc.) | Supportability |
| Capabilities list when AI is off | Exact MVP manifest |

Example (template — not OpenAI):

```text
Delete EC2 instance dev-web-server

Estimated savings: $18/month
This cannot be undone.

Would you like me to execute this action?
```

No tokens. No inconsistent wording. No model drift.

**Entry points:** `CloudPilotMessage.speakRequest()` → `RequestTemplates`; `speakKnown()` → execution outcomes / `outcomeRegistry`.

---

### Routing rule

| If the message is… | Use |
|--------------------|-----|
| Explaining / advising / conversational | AI (when enabled) |
| Collecting fields, confirming, executing, error codes | **Template always** |

OpenAI **explains**. Templates **commit**.

When in doubt: if wrong wording could cause a wrong click or wrong safety expectation → **template**.

---

## Design principle — reusable context objects

Every context / knowledge object should pass:

> **“Could something besides OpenAI use this?”**

| Good (data) | Consumers |
|-------------|-----------|
| `{ ruleId, cpuAverage, estimatedSavings }` | Dashboard, OpenAI, API, logs, mobile, analytics |
| `{ ruleId, title, whyItMatters, recommendation }` | Navigator card, template fallback, OpenAI |

| Bad (prompt-as-source) | Consumers |
|------------------------|-----------|
| `"This EC2 instance appears underutilized and may save $18…"` | OpenAI only |

If only OpenAI can use it, it's in the wrong layer.

---

## Separation of responsibilities (summary)

| Piece | Responsibility |
|-------|----------------|
| **CloudPilot** | Owns facts — structured data (identity, situation, knowledge) |
| **`buildConversationContext()`** | Merge data from pipeline + knowledge modules |
| **`buildCloudPilotInstructions()`** | **Render** data → human-readable prompt (single source of rendered English) |
| **Prompt logs (dev)** | Same string as sent to OpenAI — best developer tool |
| **OpenAI** | Natural language for **category 1** only |
| **Templates / outcomeRegistry** | **Category 2** — deterministic; never through renderer or OpenAI |

**Do not store prompts.** Store data. Render. Log (dev). Send.

---

## Toggle (one flag for MVP)

```env
OPEN_AI_LIVE_SEND_ALL_MESSAGES_WILL_CAUSE_BILLING=true
OPENAI_API_KEY=…
```

| Flag | Behavior |
|------|----------|
| `false` (or unset) | CloudPilot templates / deterministic copy → reply |
| `true` | CloudPilot Context → OpenAI → reply |

If OpenAI fails or `OPENAI_API_KEY` missing: **fall back to templates**. Product never depends on AI being on.

Optional later: split `OPENAI_ENHANCED_CHAT` vs `OPENAI_ENHANCED_PRESENTATION`. Start with one master flag.

---

# CHAT

Chat is the primary experience. Dashboard supports it; chat leads.

## General context

Rarely changes. **CloudPilot personality** — not AWS knowledge.

```text
You are CloudPilot.

CloudPilot helps users understand and safely manage cloud infrastructure.

Always explain:
• what is happening
• why it matters
• possible risks
• possible impact

Prefer clear language over technical jargon.

Never invent AWS findings.

CloudPilot owns cloud knowledge.
You help explain it naturally.
```

**Source (planned):** `services/knowledge/generalContext.js` or env-loaded string for demo tuning.

## Relevant context

Changes every request. This is where replies feel aware.

**Example — S3 policy work:**

```text
Current Task

Action: Update S3 Bucket Policy
Bucket: photos-production
Pending Confirmation: Yes

Current Findings
• Public Access Block disabled
• Bucket encryption enabled
• Versioning disabled
```

**Example — EC2 scan:**

```text
Current Task

EC2 Scan

Found:
• 2 stopped instances
• 1 instance with no Name tag
• 1 instance using t2.micro
```

**Example — PR remediation:**

```text
Current Task

Action: create_ec2
Delivery: Pull Request
PR #42 awaiting merge
```

**Built from (planned):** `requestState`, `decision`, scan summary, remediation status — whatever the pipeline already knows at speak time.

## Org knowledge

Can be empty for months.

```js
org_knowledge: ""
```

**Eventually:**

```text
Company standards

Production buckets must have:
• Versioning
• Encryption
• Block Public Access

PCI workloads require KMS encryption.
```

or

```text
Terraform repository: infra/aws/s3.tf
CloudPilot should recommend infrastructure PRs before console changes.
```

**Source (later):** org config table, env, or repo-linked file. Not MVP.

## Current facts (structured)

Not explanation — **facts only**. OpenAI must not discover anything; it explains what CloudPilot already knows.

```json
{
  "bucket": "kite-production",
  "findings": [
    "public_access_block_disabled",
    "versioning_disabled"
  ],
  "recommendation_count": 2
}
```

Knowledge layer expands each `rule_id` into meaning / risk / tradeoff **before** or **inside** context assembly — not inside the LLM’s imagination.

## Plug-in points (chat)

| Location | Role today | Enhanced mode |
|----------|------------|---------------|
| `CloudPilotMessage.speakGeneral` | OpenAI stub | `buildCloudPilotContext` → `sendGeneralChat` |
| `openAIFunctions.sendGeneralChatDuringWorkflow` | Inline workflow prompt | Use `relevant_context` from builder |
| `CloudPilotMessage.speakRequest` | Templates only | Optional AI wrap for explainers; keep confirmations deterministic |
| Post-scan / post-action | Template + `navigatorResponse` | Short AI summary in `cloudPilotMessage` |

**Rule:** Templates stay for structure (field prompts, confirmations, errors, “PR opened”). AI enhances explanation — not control flow.

## Chat implementation phases

### Phase C1 — Context builder + toggle ✅

- [x] `contextTypes/cloudPilotContext.js` — Type 1 personality
- [x] `contextTypes/currentQuestionContext.js` — Type 2 (userMessage only for now)
- [x] `contextTypes/organizationKnowledgeContext.js` — Type 3 empty object
- [x] `buildConversationContext.js` — merges types _(update imports to `contextTypes/` when wiring)_
- [x] `buildCloudPilotInstructions.js`
- [x] `OPEN_AI_LIVE_SEND_ALL_MESSAGES_WILL_CAUSE_BILLING` in `speakGeneral`
- [x] STEP 7a log + OpenAI when enabled
- [x] `sendGeneralChat` accepts system prompt

### Phase C1b — Conversation history (`ConversationHistoryContext`)

- [x] `context/classes/ConversationHistoryContext.js` — `getMessages(messageHistoryCount)`
- [x] Reuse `Message.getConversationMessages`; take last N **rows**; exclude current user message
- [x] STEP 7c log (oldest → newest, real speaker names); does not modify system message
- [x] `OPEN AI MESSAGE` log — structured `{ role, content }` payload
- [x] Wire into `sendGeneralChat({ systemMessage, conversationHistory, userMessage })`
- [x] STEP 8 — speak outcome (STEP 7 = context)

### Phase C2 — General chat reliable (MVP Step 0 partial)

- [ ] Fallback to template/stub when API key missing or OpenAI errors (not empty reply)
- [ ] Capabilities intent in Type 2 + template fallback ([mvp.md](./mvp.md) M0b)

### Phase C3 — Workflow-aware Type 2

- [ ] Pass `requestState` into builder when open request exists (action, display_name, missing fields)
- [ ] “What am I waiting on?” answered from request row — no LLM guessing

### Phase C4 — Post-scan summaries (**MVP Step 3 — highest demo value**)

- [ ] After `scan_ec2` success: build `current_facts` from formatter output
- [ ] Load 2 rule snippets from `services/knowledge/ec2Rules.js`
- [ ] AI wrap `cloudPilotMessage` when enabled; else use `atlasEC2MessageBuilder` template
- [ ] Never pass raw Atlas JSON to OpenAI

### Phase C5 — Knowledge files

- [ ] `services/knowledge/ec2Rules.js` — `ec2_low_cpu`, `ec2_missing_team_tag` only for MVP
- [ ] Same pattern later for S3 when unhidden

### Phase C6 — Org knowledge from database

- [ ] Table or JSON column keyed by `groupID`
- [ ] `getOrganizationKnowledgeContext({ groupID })` reads DB; default `{}`
- [ ] Not required for MVP demo

---

# DASHBOARD

**Separate thinking track** — do not block CHAT phases on dashboard work. Document intent here; implement after chat context pattern is proven.

## Problem

Scan dashboards (especially S3) can feel overwhelming — many rows, repeated findings, console-like density. Users need guidance, not more data.

## Direction (not final spec)

**Do not replace the dashboard with OpenAI.** Keep the table factual. Make chat the human layer.

```text
────────────────────────

CloudPilot Summary          ← chat (OpenAI optional)

Your bucket has 6 recommendations.

The most important issue is that Block Public Access is partially disabled,
which could allow accidental public exposure.

Versioning is also turned off, meaning deleted objects may not be recoverable.

The remaining recommendations are lower priority improvements.

────────────────────────

Detailed Findings           ← dashboard (unchanged data model)

(Table — full navigatorResponse)
```

## Principles (dashboard)

1. **Dashboard = detail** — accurate, sortable, complete when user wants depth.
2. **Chat = summary** — what matters, in order, with tradeoffs.
3. **Same facts both places** — summary built from `current_facts` + Knowledge, not a second scan.
4. **Aggregation before display** — “4 buckets — encryption disabled” beats 4 identical rows (see [make_scans_useful.md](./make_scans_useful.md)).
5. **AI rewrites presentation only** — never invents findings for the table.

## Dashboard ideas to think through (later)

- [ ] Optional collapsed “summary” block above Navigator table in Kite (fed from same chat summary text)
- [ ] Group findings by severity / rule_id in UI
- [ ] Account-wide scan: aggregated themes first, drill-down second
- [ ] Terminology: Findings → Recommendations (chat + table headers)
- [ ] Confidence + scope per row (“applies to 4 of 4 buckets”)
- [ ] Whether summary is chat-only vs duplicated in dashboard header

**Explicitly deferred:** Navigator/React changes until CHAT context + post-scan summary path works in API.

---

## How this connects to existing code

| Topic | Location |
|-------|----------|
| OpenAI SDK | `services/engines/llm/openai/openAIFunctions.js` |
| General speak (stub) | `services/conversation/CloudPilotMessage.js` → `speakGeneral` |
| Workflow chat | `sendGeneralChatDuringWorkflow` |
| Context types | `services/context/contextTypes/` |
| Merge + prompt | `buildConversationContext.js`, `buildCloudPilotInstructions.js` |
| Rule knowledge (C5) | `services/knowledge/ec2Rules.js` (planned) |
| Model config | `services/config/chatGPTconfig.js` |

---

## Open decisions (minor)

1. **One flag vs split** — `OPEN_AI_LIVE_SEND_ALL_MESSAGES_WILL_CAUSE_BILLING` only for MVP?
2. **Post-scan:** AI wrap on `cloudPilotMessage` (C4) vs template-only with AI for follow-up questions?
3. **Prompt presentation** — stay JSON until proven insufficient; then format in `buildCloudPilotInstructions` only
4. **Dashboard summary** — chat-only for MVP demo?

**Decided:** Two response categories, data-first context, render-from-data pipeline, `OPENAI_LOG_PROMPTS` for dev, identity derived never duplicated as string — see sections above.

---

## Changelog

| Date | Change |
|------|--------|
| 2026-07-06 | Initial plan — CHAT + DASHBOARD sections; context builder architecture |
| 2026-07-09 | contextTypes/ folder; MVP demo prompts; phases aligned to mvp.md |
| 2026-07-09 | Identity / Situation / Knowledge by role; product vs org knowledge |
| 2026-07-09 | Data-first `{ loaded, type, data }`; target folder layout |
| 2026-07-09 | Two response categories: AI vs templates; reusable object principle |
| 2026-07-09 | Render pipeline locked: store data → buildCloudPilotInstructions → human-readable → log (dev) → OpenAI; no stored prompts |
| 2026-07-12 | Folder → `buildAIContext` / `buildAISystemMessage`; `openAIChatConfig`; planned `classes/CloudPilotContext` for chat history from existing `messages` table |
