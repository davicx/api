# CloudPilot — AI Control Plane (Archived Reference)

**Status:** Archived reference — retained so no prior AI control-plane notes are lost.  
**Active work:** [Current Development](../current/current_development.md)  
**Related:** [AI Spending](../current/feature_ai_spending.md) · [Chat Formatting](../current/feature_chat_formatting.md) · [OpenAI Logs](./feature_openai_logs.md) · [Questions](../current/feature_questions.md) · [Future MVP](../future/mvp.md) · **How-to chat OpenAI:** [Use OpenAI Chat](../how_to/use_openai_chat.md)

This was the old all-in-one active AI document. Its content is preserved here; new work belongs in an individual `feature_<name>.md` document.

---

# SECTION A — Philosophy (locked)

Keep CloudPilot **deterministic by default** (fast, cheap, predictable). Optionally turn on **AI enhancements** where they clearly help — each behind its own switch.

```text
                CloudPilot
                     │
     ┌───────────────┼───────────────┐
     │               │               │
     ▼               ▼               ▼
Understand      Execute AWS      Build Response
(Rules + optional AI)  (Atlas)   (Templates + optional AI)
     │               │               │
 Optional AI    Never AI       Optional AI
```

- AI **understands** language (region today; action/intent later)
- AI **explains** and **asks** (planned Features 1–2)
- AI **never executes** AWS / never owns control flow

**Data-first:** CloudPilot owns facts. AI explains or proposes — it does not invent findings or infrastructure details.

**Two response categories:**

| Category | Use | AI? |
|----------|-----|-----|
| Explain / advise / ask naturally | Findings summary, friendly field questions | Optional |
| Commit / control flow | Mode picker, confirm delete, errors | **Never** — templates only |

---

# SECTION B — Live AI control plane (SHIPPED)

Operational truth as of 2026-07-26. Config: `config/cloudPilotAIConfig.js` → `CLOUDPILOT_AI_CONFIG`. Sample env: [sample_env.md](../../sample_env.md).

## B1 — Hierarchy

```text
CLOUDPILOT_AI_ENABLED          ← master (OFF always wins)
        │
        ├── MESSAGE_RESPONSE → internal | openai
        ├── REGION_SEARCH    → internal | openai
        └── ACTION_SEARCH    → internal | openai   (stub; not built yet)
```

Plus per-feature token limits and logs (`CLOUDPILOT_*_TOKEN_LIMIT`, `CLOUDPILOT_*_LOGS`).

History transport settings (not feature switches):

- `OPENAI_SEND_CONVERSATION_HISTORY`
- `OPENAI_CONVERSATION_HISTORY_LIMIT`

## B2 — Region search (SHIPPED)

| Piece | Location |
|-------|----------|
| Gateway + Internal + OpenAI | `cloudPilotIntelligence/understand/search/searchMessageForRegion.js` |
| Situation building block | `cloudPilotIntelligence/context/contextTypes/cloudPilotSituationContext.js` (`region` only) |
| Context assembly | `cloudPilotIntelligence/context/buildContext.js` + `buildSystemMessage.js` |
| OpenAI transport | `providers/openAI/client/openAIClient.js` |

**Public contract today:** `{ region: "us-west-2" }` or `{}`.

**Demo:** master on + `CLOUDPILOT_REGION_SEARCH=openai` + `CLOUDPILOT_OPENAI_LOGS=true` → `OPENAI` block + compact `STEP 3: Region Search` / Region Found when `CLOUDPILOT_REGION_LOGS=true`. Chat UI does **not** show those logs.

**Known MVP gap:** bare `west` often returns `{}` (don’t invent). Fallthrough can hit general-chat stub. See Section D (clarify) and Section C (when to search).

## B3 — Context rule (SHIPPED)

Every GenAI request should use the shared context system, selecting only what it needs:

| Piece | Question |
|-------|----------|
| `cloudPilotContext` | Who is CloudPilot? |
| `cloudPilotSituationContext` | What should AI look for? (today: `['region']`) |
| `currentQuestionContext` | What did the user say? |

Situation pieces describe **what to identify**. The **AI operation** owns output JSON schema (e.g. region search asks for `{ "region" }` or `{}`).

## B4 — Not shipped from the old chat plan

- Feature 1 Explain findings  
- Feature 2 Friendly request asks  
- Feature 3 Full `understandIntent` / `AIService`  
- Old flags: `OPENAI_EXPLAIN_FINDINGS`, `OPENAI_FRIENDLY_REQUESTS`, `OPENAI_INTENT_UNDERSTANDING`, `OPEN_AI_LIVE_SEND_ALL_MESSAGES_WILL_CAUSE_BILLING` (replaced by master + `MESSAGE_RESPONSE`)

## B5 — OpenAI demo chat list (besides region)

What you can flip on for a room / rehearsal **today**. Atlas can stay in **Test** mode (no AWS creates).

### Live OpenAI (env)

| What | Env | Example |
|------|-----|---------|
| **Region search** | `CLOUDPILOT_REGION_SEARCH=openai` | `scan ec2 in oregon` / `us-west-2` |
| **General chat replies** | `CLOUDPILOT_MESSAGE_RESPONSE=openai` | `hello`, `what can you do?` |
| **AI usage** | (no OpenAI to *answer*) | `ai usage` / `openai spend` |

Suggested OpenAI demo env:

```env
CLOUDPILOT_AI_ENABLED=true
CLOUDPILOT_REGION_SEARCH=openai
CLOUDPILOT_MESSAGE_RESPONSE=openai
CLOUDPILOT_REGION_LOGS=true
CLOUDPILOT_MESSAGE_LOGS=true
```

How-to for chat path: [Use OpenAI Chat](../how_to/use_openai_chat.md).

### Deterministic (not OpenAI — still part of full demo)

| Beat | Example |
|------|---------|
| Scan | `scan ec2` |
| Field fill (structured) | `region: "us-west-2"` |
| Modes | Instructions / CLI / **PR** / Automatic |
| Toggle | confirm → Automatic |
| History / Undo | `undo` / status |
| AWS billing | `show my aws bill` (Atlas) |

### Planned OpenAI (not for this demo yet)

| Feature | Would cover |
|---------|-------------|
| Explain findings | Scan → “Why?” in plain English |
| Friendly request asks | “Keep us-west-2?” instead of checklist |
| Action / intent | “don’t scan” / natural corrections |
| Recommendations | “Do this first…” |

### Minimal OpenAI + no-AWS rehearsal

1. General chat on → short question  
2. Start scan → region via OpenAI  
3. Finish scan (Atlas **Test** mocks OK)  
4. PR mode → GitHub (no AWS)  
5. `ai usage` → see OpenAI spend  

---

# SECTION C — CloudPilot AI Invocation Rules (**DONE**)

**Archived plan:** [cloud_pilot_openai_rollout.md](../finished/cloud_pilot_openai_rollout.md) · Index: [finished.md](../finished/finished.md)

Philosophy: only perform expensive AI work when that function is actually needed.

Every AI function answers two questions: **Should I run?** then **How should I run?**

Shipped (OpenAI ENV stays off by default):

```text
shouldRunRegionSearch()
  true  → actively collecting region → Internal
  false → skip

General chat → Internal response path

shouldRespondCapabilities()
  → respondCapabilitiesInternal() or respondCapabilitiesOpenAI()
  → Internal default / fallback
```

Recommended ENV:

```dotenv
CLOUDPILOT_AI_ENABLED=false
CLOUDPILOT_MESSAGE_RESPONSE=internal
CLOUDPILOT_REGION_SEARCH=internal
CLOUDPILOT_ACTION_SEARCH=internal
```

### OpenAI logging audit (next before live OpenAI)

**Plan:** [OpenAI Logs](./feature_openai_logs.md)

Long-term direction: one block **per capability invocation**, numbered per user message:

```text
OPENAI: Region Search (Request 1)
OPENAI: General Chat (Request 2)
```

Each block still answers: context loaded, exact Messages sent, response, cost.  
`CLOUDPILOT_OPENAI_LOGS` turns the blocks on/off. Compact region pipeline line stays separate.

Before turning on any live OpenAI path, finish Phase 1 of that plan (header + request counter).

Deferred from this plan (Stage 2 region, action-search OpenAI, Intelligence respond/explain/…): see [to_do.md](../future/to_do.md).

---

# SECTION C2 — Open Requests (**PLAN**)

**Plan:** [Questions](../current/feature_questions.md) · [Open Requests design](../architecture/open_requests.md)

User asks: **What open requests do I have?**

```text
Phase 1  Chat answer from grounded open request(s) — Internal
Phase 2  Navigator table in chat
Phase 3  Dashboard
Phase 4  Multi-open (only when product ready; today = one open per conversation)
```

Intent `list_open` already exists; speak path still needs a real open-requests response (like history).

---

# SECTION D — Ambiguous region / clarify (AFTER DEMO MVP)

**Status:** Future — after Section C. Detail also in [future_work.md § AI region understanding](../future/future.md#ai-region-understanding--ambiguous-vs-not-provided).

Today only two outcomes: FOUND / empty. Need three:

| Outcome | Example | Behavior |
|---------|---------|----------|
| FOUND | `Oregon` | → `us-west-2` |
| AMBIGUOUS | `west` | → clarify options; **do not guess** |
| NOT PROVIDED | `yes` | → no region signal; re-ask missing if waiting |

Also: waiting on fields + nothing applicable → **re-ask missing**, not general-chat stub.

Pattern: **confident → fill; ambiguous → clarify; never silently invent.**

---

# SECTION E — Planned chat enhancements (from cloud_pilot_chat)

Product roadmap for Features 1–3. Independent of the region gateway. Build when ready; deterministic path stays default.

## E1 — Feature 1: Explain findings

After CloudPilot has curated findings (scan, cost, security, …), optional OpenAI → short prioritized English. Navigator data unchanged. Fail → existing message builders.

## E2 — Feature 2: Friendly request conversations

STEP 7 speak: one natural question at a time instead of field checklists. Modes / confirm / delete stay templates. Fail → structured templates.

## E3 — Feature 3: Broader intent understanding

STEP 3 only — same `messageUnderstanding` contract. Long-term may combine situation pieces (`region`, `action`, …) in one call. Validate vs `actionMap`; fail → rules.

**Note:** Region OpenAI is a **purposeful** first slice of understanding — not the full Feature 3 router yet.

## E4 — Feature 4: Recommendations *(later)*

Advise *what to do first* — different from Feature 1 explanation. After 1–3 prove out.

---

# SECTION F — What stays deterministic forever

- `actionMap` required fields and match rules (always available)  
- STEP 4 `decideNextStep`  
- Request workflow / modes 1–4 / PR / Automatic / History / Undo  
- Safety confirmations and error copy  
- Atlas HTTP and AWS execution  

AI never owns control flow.

---

# SECTION G — Code map (current paths)

| Topic | Location |
|-------|----------|
| AI config | `config/cloudPilotAIConfig.js` |
| Region search | `cloudPilotIntelligence/understand/search/searchMessageForRegion.js` |
| Values / STEP 3 | `cloudPilotIntelligence/understand/` + `CloudPilotIntelligence.js` |
| Context | `cloudPilotIntelligence/context/` |
| OpenAI client | `providers/openAI/client/openAIClient.js` |
| Speak | `cloudPilot/chat/CloudPilotMessage.js` |
| Sample `.env` | [sample_env.md](../../sample_env.md) |
| Chat OpenAI how-to | [Use OpenAI Chat](../how_to/use_openai_chat.md) |

---

# SECTION H — Suggested build order

1. [x] Master + feature ENV + `cloudPilotAIConfig`  
2. [x] Region OpenAI + situation context + region logs  
3. [ ] **When to run Region Search** (Section C) ← **next**  
4. [ ] Ambiguous region clarify (Section D) — after demo MVP  
5. [ ] Feature 2 / 1 / broader Feature 3 as needed  
6. [ ] Action search OpenAI (same purposeful pattern as region)  

---

# Changelog

| Date | Change |
|------|--------|
| 2026-07-22 | Original `cloud_pilot_chat.md` — Features 1–3 plan |
| 2026-07-26 | Region OpenAI + AI control plane shipped |
| 2026-07-26 | Merged into this file; added when-to-search + ambiguous region |
| 2026-07-27 | B5 OpenAI demo chat list; Section C marked NEXT + build notes |
