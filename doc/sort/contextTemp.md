# Context Temp — CloudPilot Intelligence Context (working notes)

**Status:** Temporary scratch doc for improving OpenAI context quality  
**Created:** 2026-09-06  
**Code root:** `cloudPilotIntelligence/context/`  

> Temporary scratch for OpenAI context quality.  
> **Active conversation / Current State rebuild:** [development/current/feature_conversation.md](./development/current/feature_conversation.md)  
> Longer-term how-to: [development/how_to/cloud_pilot_context.md](./development/how_to/cloud_pilot_context.md)  
> Finished feature write-up: [development/finished/feature_cloud_pilot_context.md](./development/finished/feature_cloud_pilot_context.md)

---

## One-sentence model

> **Search understands language. CloudPilot owns truth. Chat communicates truth.**

Context code **collects** structured pieces (`buildContext.js`) and **renders** them into an English system message (`buildSystemMessage.js`). It does **not** call OpenAI itself.

---

## Folder map

```text
cloudPilotIntelligence/context/
│
├── buildContext.js              # Collect → aiContext object
├── buildSystemMessage.js        # aiContext → system prompt string
│
├── contextTypes/                # Chat / shared “pieces” (data only)
│   ├── cloudPilotContext.js              # IDENTITY
│   ├── cloudPilotSituationContext.js     # SITUATION (selectable blocks)
│   ├── cloudPilotCurrentStateContext.js  # CURRENT STATE (open request facts)
│   ├── currentQuestionContext.js         # CURRENT QUESTION (this turn)
│   └── organizationKnowledgeContext.js   # KNOWLEDGE (org slice)
│
├── classes/
│   ├── CurrentQuestionContext.js         # Builds question data from processMessageContext
│   └── ConversationHistoryContext.js     # Past DB messages → OpenAI roles (NOT in system msg)
│
└── operationContext/            # Search/Question TASK payloads (separate from Chat Identity)
    ├── getRegionSearchContext.js
    ├── getActionSearchContext.js
    ├── getAiSpendSearchContext.js
    ├── getOpenRequestsSearchContext.js
    ├── getOrganizationalKnowledgeSearchContext.js
    ├── getEc2InventorySearchContext.js
    └── getS3InventorySearchContext.js
```

**Related (not under `context/`):**

| Path | Role |
|------|------|
| `cloudPilot/chat/presentation/getRequestMessageReplyContext.js` | Request **presentation** facts JSON (rephrase templates) — **not** Chat Identity |
| `cloudPilotIntelligence/conversation/generateGeneralMessageReply.js` | General Chat: `buildAIContext` → `buildAISystemMessage` → history → OpenAI |
| `cloudPilotIntelligence/conversation/generateRequestMessageReply.js` | Request polish: TASK + SPEAK FACTS (no Identity) |
| `config/cloudPilotAIConfig.js` | Master AI, history, logs, token limits |
| `providers/openAI/client/openAIClient.js` | Completions + logging |

---

## Pipeline (General Chat)

```text
processMessageContext
        │
        ▼
buildAIContext(processMessageContext, options?)
        │  cloudPilot | situation | currentState | currentQuestion | knowledge
        ▼
buildAISystemMessage(aiContext)
        │  English sections joined
        ▼
+ ConversationHistoryContext.getMessages(N)   ← separate messages[], not system string
+ current user message
        ▼
OpenAI chat completion
```

**Default Chat options** (`generateGeneralMessageReply`):

- `includeIdentity: true` (default)
- `includeCurrentState: true` (default)
- `includeKnowledge: true` (default)
- `situationTypes`: **not passed** → Situation section usually empty for Chat

**Search** must use tiny TASK context (`operationContext/`) and typically:

```js
buildAIContext(processMessageContext, {
  includeIdentity: false,
  includeCurrentState: false,
  situationTypes: ['region'] // when applicable
});
```

Invariant: **Chat Identity must never become the Search system prompt.**

---

## Context types (what goes in the system message)

Order in `buildAISystemMessage`:

1. **IDENTITY** — `cloudPilotContext`  
2. **SITUATION** — `cloudPilotSituationContext` (if any pieces selected)  
3. **KNOWLEDGE** — org / product  
4. **CURRENT STATE** — open request (+ create_ec2 facts)  
5. **CURRENT QUESTION** — this turn’s message (+ optional selected finding)

### 1) Identity — `contextTypes/cloudPilotContext.js`

Static product voice: name, intro, voice bullets, productDescription, executionModes, grounding, conversation rules.

**Grounding (critical for quality):** never invent user’s AWS resources, costs, requests, findings; use facts only when provided in context.

Toggle logs: `CLOUDPILOT_CONTEXT_LOGS` → “Building Identity Context”.

### 2) Situation — `contextTypes/cloudPilotSituationContext.js`

Selectable **building blocks** (data only). Today:

| Key | Purpose |
|-----|---------|
| `region` | Identify AWS region from message (no invent / no default) |
| `ai_spend` | Classify AI/OpenAI spend questions |
| `open_requests` | Classify open-request questions |

Pieces describe **what to look for**, not JSON schema (schema lives on the operation / OpenAI adapter).

### 3) Current State — `contextTypes/cloudPilotCurrentStateContext.js`

Factual open request only (Chat):

- `openRequest.label` (from `actionMap` actionLabel)
- `openRequest.waitingFor` (missing fields)
- Extra `createEc2` knowledge when pending action is `create_ec2`

**Not** prose instructions like “the user is trying to…”.

### 4) Current Question — `currentQuestionContext.js` + class

From `processMessageContext`:

- `userMessage`
- Optional slim `selectedFinding` (scalars only: ruleId, instanceId, title, CPU, types, region, …)

Open-request facts belong in Current State, **not** here.

### 5) Knowledge — `organizationKnowledgeContext.js`

When General Chat has already loaded org knowledge onto `processMessageContext.organizationKnowledge` with status `found` | `ambiguous` and a `contextBlock`.

`product: []` today (placeholder for later AWS rule meanings).

Loaded in `generateGeneralMessageReply` via `attachOrganizationKnowledgeToContext` (search → DB).

---

## Conversation history (not a contextType section)

`classes/ConversationHistoryContext.js`

- Loads last N **message rows** from DB (`OPENAI_CONVERSATION_HISTORY_LIMIT`, default 12)
- Formats `{ role, content, speakerName }`
- Drops current user message if already saved
- Drops placeholder assistant stubs (`Open AI will respond when Live`)

Controlled by `OPENAI_SEND_CONVERSATION_HISTORY` + `CLOUDPILOT_AI_ENABLED` / `CLOUDPILOT_MESSAGE_RESPONSE=openai`.

---

## Operation context (Search / Questions)

These are **separate** from Chat Identity. Each builds a small `{ userMessage, task: { purpose, … } }` for classify/extract.

| File | Operation |
|------|-----------|
| `getRegionSearchContext.js` | Region extract + examples + `{}` / `{"region":…}` |
| `getActionSearchContext.js` | Action catalog from `actionMap` |
| `getAiSpendSearchContext.js` | AI spend question classify |
| `getOpenRequestsSearchContext.js` | Open requests question classify |
| `getOrganizationalKnowledgeSearchContext.js` | Org-knowledge reference extract |
| `getEc2InventorySearchContext.js` | EC2 inventory question → scan path |
| `getS3InventorySearchContext.js` | S3 inventory question → scan path |

---

## Request Message Reply context (presentation)

**File:** `cloudPilot/chat/presentation/getRequestMessageReplyContext.js`  
**Consumer:** `generateRequestMessageReply.js`

Not Identity. SPEAK FACTS for polishing templates (`awaiting_confirmation`, missing fields, etc.).

Recent MVP fix: confirmation must keep confirm/cancel line and must **not** invent async “scan started / hold on” language.

When improving Chat quality, don’t conflate this path with General Chat context.

---

## Env / debug (useful while improving OpenAI)

| Env | Why |
|-----|-----|
| `CLOUDPILOT_AI_ENABLED` | Master switch |
| `CLOUDPILOT_MESSAGE_RESPONSE=openai\|internal` | Live Chat wording vs stub |
| `CLOUDPILOT_CONTEXT_LOGS` | Dump each context piece as built |
| `CLOUDPILOT_MESSAGE_LOGS` | AI context + system message + history in Chat |
| `CLOUDPILOT_OPENAI_LOGS` | Full OpenAI request/response blocks |
| `OPENAI_SEND_CONVERSATION_HISTORY` | Include history or not |
| `OPENAI_CONVERSATION_HISTORY_LIMIT` | How many prior rows |

Offline check without spending tokens: build with Internal, enable logs, inspect `buildAISystemMessage` output.

---

## Likely gaps when OpenAI “doesn’t work well”

Working hypotheses to investigate next (not fixes yet):

1. **Thin Current State** — only label + missing fields. No collected values, findings summary, last scan results, or “selected resource” beyond optional `selectedFinding` on the request body.
2. **Pronouns / “this instance”** — history may help, but there is little structured “focus resource” in Current State.
3. **Situation empty on Chat** — Chat rarely passes `situationTypes`; Identity alone may not constrain answers about findings / environment.
4. **Knowledge product slice empty** — no AWS rule / finding explanations in Knowledge yet.
5. **History pollution** — long or misleading prior turns; limit / filtering may need tuning.
6. **Wrong path** — inventory / spend / open-request questions falling through to General Chat inventing facts (should stay Search/Question → CloudPilot truth).
7. **Two prompt systems** — Chat Identity vs Request Presentation vs Operation TASK; improving the wrong one won’t fix the symptom.

---

## Identity text (current source of truth)

Canonical object: `cloudPilotIdentity` in `cloudPilotContext.js` (name, intro, voice, productDescription, executionModes, grounding, conversation).

Edit there + `writeIdentity` in `buildSystemMessage.js` when changing Chat voice. Prove with `buildAISystemMessage` + logs before live smoke.

---

## Suggested inspect order when iterating

1. Reproduce with `CLOUDPILOT_CONTEXT_LOGS=1` + `CLOUDPILOT_MESSAGE_LOGS=1` + `CLOUDPILOT_OPENAI_LOGS=1`.
2. Confirm which path ran (General Chat vs Search vs Request Presentation) from STEP / OPENAI capability logs.
3. Read the actual system message sections present/absent.
4. Check whether facts the model needed existed in Current State / Knowledge / history — or whether Chat was asked to invent them.
5. Only then change Identity, Current State builders, or Situation pieces — **one type at a time**.

---

## Related docs

- [how_to/cloud_pilot_context.md](./development/how_to/cloud_pilot_context.md)
- [how_to/use_openai_chat.md](./development/how_to/use_openai_chat.md)
- [finished/feature_cloud_pilot_context.md](./development/finished/feature_cloud_pilot_context.md)
- [finished/feature_intelligence_front_door.md](./development/finished/feature_intelligence_front_door.md)
- [feature_mvp.md](./development/feature_mvp.md) — priorities include conversational context + pronouns + honest MESSAGE_RESPONSE wording
