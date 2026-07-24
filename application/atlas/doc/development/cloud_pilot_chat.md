# CloudPilot Chat — AI enhancements

**Last reviewed:** 2026-07-22  
**Status:** Locked — ready to build; deterministic pipeline stays default  
**Related:** [mvp.md](./mvp.md) · [architecture/action_map.md](./architecture/action_map.md) · [architecture/architecture.md](./architecture/architecture.md) · [long_term/make_scans_useful.md](./long_term/make_scans_useful.md) · [ai_usage.md](./ai_usage.md)

**Supersedes:** `upgrade_request_chat.md` · `upgrade_understand_message.md` (folded in here)

---

## Goal (one sentence)

Keep CloudPilot **deterministic by default** (fast, cheap, predictable), and optionally turn on **AI enhancements** where they clearly improve the experience — each behind its own flag.

---

## Philosophy (locked)

```text
                CloudPilot
                     │
     ┌───────────────┼───────────────┐
     │               │               │
     ▼               ▼               ▼
Understand      Execute AWS      Build Response
(Rules)          (Atlas)        (Templates/Data)
     │               │               │
     │               │               │
 Optional AI    Never AI       Optional AI
 Enhancement                   Enhancement
```

- AI **understands** (Feature 3)
- AI **explains** (Feature 1) and **asks** (Feature 2)
- AI **never executes**

---

## Three AI features (independent) + future placeholder

Think **enhancements**, not “OpenAI is on.”

| # | Feature | When it runs | Flag | Job |
|---|---------|--------------|------|-----|
| **1** | Explain findings | After CloudPilot has curated findings (scan, cost, security, inventory, remediations, …) | `OPENAI_EXPLAIN_FINDINGS` | Explain findings in plain English, prioritized |
| **2** | Friendly request conversations | STEP 7 when collecting fields / guiding a request | `OPENAI_FRIENDLY_REQUESTS` | Ask like a teammate, not an API form |
| **3** | Better intent understanding | STEP 3 | `OPENAI_INTENT_UNDERSTANDING` | Parse natural language → same `messageUnderstanding` contract |
| **4** | AI recommendations *(future — not MVP)* | After findings exist | TBD | Rank / advise *what to do first* (reasoning, not explanation) |

Demo Features 1–3 independently. Costs stay under control. Compare AI vs non-AI easily.

```env
OPENAI_API_KEY=…

# Master billing gate (existing) — must be true for any live OpenAI call
OPEN_AI_LIVE_SEND_ALL_MESSAGES_WILL_CAUSE_BILLING=false

# Per-feature enhancements (all default false / off)
OPENAI_EXPLAIN_FINDINGS=false
OPENAI_FRIENDLY_REQUESTS=false
OPENAI_INTENT_UNDERSTANDING=false

# Shared: how much thread to send when a feature needs history
OPENAI_SEND_CONVERSATION_HISTORY=true
OPENAI_CONVERSATION_HISTORY_LIMIT=10
```

If a feature flag is on but key missing / timeout / bad output → **fall back to today’s deterministic path**. Product never depends on AI being up.

---

## Architecture (locked)

```text
Deterministic CloudPilot pipeline
        │
        ├── STEP 3 Understand ──► (optional) AI enhancement ──► same messageUnderstanding
        ├── STEP 4–6 Decide / work ──► unchanged  (Never AI)
        ├── Atlas / AWS ──► curated facts ──► (optional) AI explain findings ──► chat
        └── STEP 7 Speak ──► (optional) AI friendly request asks
                            templates always for confirm / modes / delete / errors
```

Each enhancement is isolated. No OpenAI code leaks into workflow logic.

### AIService (single owner)

Instead of calling OpenAI from many places:

```text
AIService
├── explainFindings()        ← Feature 1
├── makeFriendlyRequest()    ← Feature 2
├── understandIntent()       ← Feature 3
└── (existing general chat helpers as needed)
# later: recommendNextActions()  ← Feature 4
```

Pipeline stays clean:

```js
// STEP 3
if (OPENAI_INTENT_UNDERSTANDING) {
    messageUnderstanding = await AIService.understandIntent(...);
} else {
    messageUnderstanding = await understandMessage(...);
}
// always validate; on failure → understandMessage()

// After findings exist (scan, cost, security, …)
if (OPENAI_EXPLAIN_FINDINGS) {
    cloudPilotMessage = await AIService.explainFindings(curatedFindings);
} else {
    cloudPilotMessage = templateFromFormatter(...);
}
```

SDK stays in `engines/llm/openai/`. `AIService` is the only product-facing AI API.

---

## Shared substrate (already partly shipped)

All three features reuse the same foundations — **do not invent a fourth “memory” system**.

| Piece | Role |
|-------|------|
| Identity / Situation / Knowledge | Structured context (`services/context/`) — data first, not prompt strings |
| `buildAISystemMessage` / instructions renderer | English for the model from data |
| `ConversationHistoryContext` | Last N message rows from existing `messages` table |
| Templates / `outcomeRegistry` | Confirmations, modes 1–4, delete warnings, errors — **never AI** |

### Conversation history = enough context

Prefer the last ~10 messages over long-term DB memory.

```text
User: Let's work on S3.
User: Show bucket hello.
User: scan
→ Feature 3 can infer scan_s3 + bucket hello (plus region from earlier turns)
```

```text
User: Create an EC2.
CloudPilot: What region?
User: Actually never mind.
User: Scan it instead.
→ “it” = EC2 from history — no new memory tables
```

**Do not** add long-term memory for these features. History is simpler and less surprising.

### Data-first rule (locked)

CloudPilot **owns facts**. AI **explains or proposes** — it does not discover AWS state or invent findings.

**AI should never be the only place where information exists.** If the dashboard cannot render it without OpenAI, the data belongs in CloudPilot first.

```text
Structured data (findings, missing fields, actionMap)
        ↓
Optional AI enhancement
        ↓
User-facing English  OR  structured understanding JSON
```

Same objects can feed dashboard, templates, logs, and AI. If only OpenAI can use a string, it is in the wrong layer. That protects you from prompt engineering becoming the data layer.

### Two response categories (locked)

| Category | Use | AI? |
|----------|-----|-----|
| **Explain / advise / ask naturally** | Findings summary, “what does this mean?”, friendly field questions | Optional (flags above) |
| **Commit / control flow** | Mode picker, confirm delete, execution status, safety copy | **Never** — templates only |

OpenAI **explains**. Templates **commit**. Wrong wording that could cause a bad click → template.

---

## Feature 1 — Explain findings

**Highest ROI for demos.** Broader than “scan responses”: EC2 / S3 scans, cost reports, security findings, inventory, Terraform diffs, remediation results — any curated CloudPilot findings. Atlas / upstream stay exactly the same.

```text
CloudPilot curated findings
  ↓
OpenAI (optional) — OPENAI_EXPLAIN_FINDINGS
  ↓
Friendly chat caption
```

`navigatorResponse` / dashboard data stays factual and unchanged.

### Example input (curated)

```json
{
  "instance_id": "i-123",
  "name": "web-prod-1",
  "cpu_average": 1.2,
  "rule": "ec2_low_cpu",
  "days": 7
}
```

### Prompt spirit (locked)

- Explain these findings to an engineer  
- Keep it short  
- **Do not explain every finding equally — prioritize**  
- Lead with the most important issue, then briefly note secondary ones  
- Do not invent information  

### Example output

> **The most important issue:** `web-prod-1` has averaged only **1.2% CPU** over the last 7 days. It may be oversized and could save money if downsized.
>
> **Also worth noting:** `api-dev` is missing a **Team** tag, making ownership difficult.

Not a flat “Found 5 findings…” list.

### Rules

- Send **CloudPilot-curated** findings (rule ids, metrics, names CloudPilot already trusts) — not an unfiltered Atlas blob  
- Never invent resources or metrics  
- Off / fail → existing message builders (`atlasEC2MessageBuilder`, etc.)  
- Knowledge snippets (`ec2Rules.js`) enrich Situation before the call when available  

**Was:** Phase C4 / “friendly scan responses.” Same idea; renamed for breadth.

---

## Feature 2 — Friendly request conversations

Instead of an API checklist:

```text
We need:
region
instance_type
request_name
```

Teammate tone — **ask for one thing at a time**:

> Great, let's create that EC2 instance.  
> Should we keep this in **us-west-2**?

Not a paragraph of questions:

> ~~Great! What region? What instance type? What VPC? What subnet?~~

Backend truth unchanged:

```text
missing = [region, instance_type, ...]
collected = { ... }
```

Execution modes, PR, Automatic, History, Undo **do not change**. Only how CloudPilot *asks* improves.

### Progression

| Level | Behavior |
|-------|----------|
| **Off / structured (today)** | Explicit field checklist / `field: "value"` |
| **On — conversational ask** | **One** natural question for the next missing field; hide raw field ids |
| **Polish** | Suggest defaults from history (“keep us-west-2?”); short confirm when many values filled |

Rich free-text → values is primarily **Feature 3** (intent). Feature 2 owns **phrasing questions**, not a second intent engine.

### Must not / may

| Must not | May |
|----------|-----|
| Ask for multiple fields in one turn | Phrase the **next** question only |
| Pick mode 1–4 | Suggest safe defaults for user confirm |
| Call Atlas / open PRs | Hide engineer field-id language |
| Invent fields outside `actionMap` | |

Fail → Level 1 structured templates.

---

## Feature 3 — Better intent understanding

STEP 3 only. Same output contract whether rules or AI run:

```js
{
  action,
  values,
  reply,
  conversation,
  ambiguous,
  candidates,
  source,
  confidence
}
```

Everything after STEP 3 stays identical. **This is why Feature 3 exists:**

```text
don't scan ec2  →  general_chat / cancel
                   NOT scan_ec2
```

### Router

```text
understandMessageRouter()
        │
   ┌────┴─────┐
   │          │
rules      OpenAI
understandMessage()   AIService.understandIntent()
```

Keep the rules parser untouched. Do not bury OpenAI inside `understandMessage.js`.

### Full intent — not “just extract values”

| User says | Understanding may become |
|-----------|--------------------------|
| `don't scan ec2` | cancel / `general_chat` — **not** `scan_ec2` |
| `actually I meant S3` | `action = scan_s3` |
| `yeah that's fine` | `reply = yes` |
| `Scan EC2 in us-west-2, call it Kite` | `scan_ec2` + `values` |

Validate against `actionMap` + known reply / conversation tokens. Strip unknown keys. Fail → rules.

### Logs

```text
STEP 3: Message Understanding
Understanding Engine: Rules | GenAI
Source: …  Confidence: …  Action: …
```

### Must not

Pick execution mode, call Atlas, open PRs, invent actions/fields, write user-facing prose (that is Feature 1 / 2 / templates).

---

## Feature 4 — AI recommendations *(future — not MVP)*

Different from Feature 1.

| | Feature 1 | Feature 4 |
|--|-----------|-----------|
| Says | Here’s what happened / what these findings mean | Here’s what I’d do **first** |
| Kind | Explanation | Reasoning / prioritization advice |

Example today (Feature 1):

> Instance averages 1.2% CPU.

Example later (Feature 4):

> I would review this instance before the public S3 bucket because it represents an ongoing cost every month.

Leave a placeholder on `AIService` (`recommendNextActions`) when scaffolding — do not build until Features 1–3 prove out.

---

## What stays deterministic forever

- `actionMap` required fields and match rules (rules engine always available)  
- STEP 4 `decideNextStep`  
- Request workflow / modes 1–4 / PR / Automatic / History / Undo  
- Safety confirmations and error copy  
- Atlas HTTP and AWS execution  

AI never owns control flow.

---

## Roadmap

1. [x] Three feature flags in ENV/config (default off) — no behavior change  
2. [ ] **Feature 3 first** — intent router + `understandIntent` + fallback to rules (replaces rigid `searchMessageFor*` when on)  
3. [ ] **Feature 1** — explain findings (EC2 first, same path for S3/cost/etc. later)  
4. [ ] **Feature 2** — friendly request asks — one field at a time (STEP 7)  
5. [ ] Wire conversation history (last N) into Features 2–3 where it helps  
6. [ ] Knowledge snippets for findings (`ec2Rules.js`) as Feature 1 quality improves  
7. [ ] **Feature 4** — recommendations (after 1–3)  

Not blockers for EC2 dry-run / PR MVP. Ship deterministic first; flip flags for demos.

---

## Success criteria

- [ ] All three flags off → behavior identical to today  
- [ ] Each flag can be demoed alone  
- [ ] AI failure → deterministic fallback; chat still works  
- [ ] STEP 4+ unchanged when Feature 3 is on  
- [ ] Navigator/table data unchanged when Feature 1 is on  
- [ ] Modes / confirm / delete / errors never go through OpenAI  
- [ ] No long-term memory tables for these features  
- [ ] Feature 2 never asks for more than one field per turn  

---

## Shipped foundation (keep using)

```text
services/context/
├── contextTypes/          Identity / Situation / Knowledge
├── classes/
│   └── ConversationHistoryContext.js
├── buildAIContext.js
└── buildAISystemMessage.js

services/config/openAIChatConfig.js
services/engines/llm/openai/openAIFunctions.js
services/conversation/CloudPilotMessage.js   ← speakGeneral / speakRequest
```

General chat (`speakGeneral`) remains available; Feature 1–3 are the productized enhancement map above.

**Dev:** `OPENAI_LOG_PROMPTS` / request logs — log the same payload sent to the model.

---

## Dashboard (deferred)

Keep the table factual. Chat (Feature 1) is the human summary layer. Do not replace Navigator with OpenAI. See [make_scans_useful.md](./long_term/make_scans_useful.md).

---

## Code map

| Topic | Location |
|-------|----------|
| OpenAI SDK | `services/engines/llm/openai/openAIFunctions.js` |
| Chat config | `services/config/openAIChatConfig.js`, `chatGPTconfig.js` |
| Speak | `services/conversation/CloudPilotMessage.js` |
| Context | `services/context/` |
| Understand (rules) | `services/understanding/understandMessage.js` |
| AIService (planned) | e.g. `services/engines/llm/AIService.js` (or under `conversation/`) |

---

## Changelog

| Date | Change |
|------|--------|
| 2026-07-06 … 07-15 | Original chat context plan (Identity / Situation / Knowledge, history, phases C1–C6) |
| 2026-07-20 | `upgrade_request_chat` — conversational field asks |
| 2026-07-21 | `upgrade_understand_message` — STEP 3 GenAI intent |
| 2026-07-22 | Merged into this doc — three features, three flags, AIService |
| 2026-07-22 | Review tweaks: Feature 1 → explain findings; philosophy diagram; data-first sentence; prioritize prompt; one-ask rule; Feature 4 placeholder |
