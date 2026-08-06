# AI Spending

## What this does

Shows how much CloudPilot has spent using AI (OpenAI today; provider-agnostic product name).

## Status

**Finished** — 2026-08-05  

Shipped:

- Persist usage + cost helper + `GET /ai/usage/summary`
- Kite Dashboard `AiUsageCard`
- Chat fulfillment via `show_ai_usage` handler
- `searchForAiSpend()` as a **Question** (Internal \| OpenAI classify) under `search/questions/`
- Detection: `question = ai_spend` → `IMMEDIATE_EXECUTION` / `show_ai_usage`

**Related:** [Current Development](../current/current_development.md) · [Add an Intelligence Capability](../how_to/add_intelligence_capability.md) · [Questions](../current/feature_questions.md) · [Future billing](../future/billing.md) · [Environment example](../../sample_env.md)

---

## Goal (one sentence)

Show a small **AI Usage** summary in CloudPilot (card + chat), so you can answer “How much have I spent on AI?” without leaving the product.

```text
AI Usage

Today          $0.48
This Month     $11.72
Requests       127
Average / Req  $0.0038
```

No graphs. No filters. No drill-down.

---

## What already works

Every successful OpenAI call already returns `usage` and we **persist** it.

| Piece | Status |
|-------|--------|
| `createOpenAiChatCompletion` → `result.usage` | ✅ Live |
| Persist to DB | ✅ Live — `saveAiUsageFromOpenAIResponse` after each success |
| Cost helper from model + tokens | ✅ Live — `calculateOpenAICost.js` |
| `GET /ai/usage/summary` | ✅ Live |
| Chat: “what’s my OpenAI spend?” | ✅ Live — `question = ai_spend` → `show_ai_usage` handler |
| Kite AI Usage card | ✅ Dashboard — `AiUsageCard` → `GET /ai/usage/summary` |
| Intelligence `searchForAiSpend()` | ✅ Internal \| OpenAI classify → `show_ai_usage` |

Models today: `gpt-4o-mini` / `gpt-4o` in `chatGPTconfig.js`. Pricing table only needs those (plus any model you add later).

AWS spend is a **different** path (`show_billing` → Atlas Cost Explorer). Do not mix tables or handlers.

---

## Intelligence — `searchForAiSpend()` (Step 2)

Same capability pattern as [Add an Intelligence Capability](../how_to/add_intelligence_capability.md):

```text
searchMessageForQuestion()
  → searchForAiSpend()     # question: ai_spend | null
        │
CLOUDPILOT_AI_SPEND_SEARCH = internal | openai
        │
understandMessage          # question = ai_spend
decideNextStep             # IMMEDIATE_EXECUTION → show_ai_usage
CloudPilot                 # load ai_usage summary → speakKnown
```

| Layer | Job |
|-------|-----|
| `searchForAiSpend()` in **questions** | “Is this about AI spend?” → `question = ai_spend` |
| Actions (`toggle_ec2`, …) | Unchanged — do work |
| `show_ai_usage` handler | Fulfillment only (not detected as an Action) |

OpenAI (when ENV is `openai`) only **detects** the question. It never invents dollar amounts.

**Files:**

```text
cloudPilotIntelligence/understand/search/
  searchMessageForQuestion.js            # orchestrator
  questions/searchForAiSpend.js          # one file (Internal + OpenAI)
  questions/searchForOpenRequests.js
  values/searchMessageForRegion.js
  …
CloudPilotIntelligence.js  →  export searchForAiSpend
```

```dotenv
CLOUDPILOT_AI_SPEND_SEARCH=internal
```

Detection is via `searchForAiSpend` → `question = ai_spend` (not an Action like `toggle_ec2`). Handler still fulfills the reply from the DB.

---

## Store in DB vs query OpenAI (decision)

| Approach | Pros | Cons |
|----------|------|------|
| **A. Store one row per successful CloudPilot OpenAI call** (recommended MVP) | Instant; works offline from OpenAI admin; attribute to conversation / feature / org; powers chat + card with one SQL; no admin API key | Estimated $ from your rate table (may drift slightly vs invoice); only counts calls *this app* made |
| **B. Query OpenAI org Costs / Usage API** | Closer to “true” OpenAI bill | Needs **admin** key (not the chat `OPENAI_API_KEY`); lag / UTC quirks; hard to tie to conversation or Feature 1–3; another dependency for a simple card |

**Locked for MVP: A — store locally from each response `usage` object.**

Why: CloudPilot is the command center for *this product’s* AI use. Per-response usage is already in hand. Local rows unlock “today / this month / by conversation” without OpenAI’s billing API.

**Later (not MVP):** optional reconciliation job against OpenAI Costs API for finance-grade totals. Same `ai_usage` table stays the product source for chat/UI.

Label UI copy as **Estimated** if you want honesty (`Estimated OpenAI spend`).

---

## How it works

```text
OpenAI response (success)
        ↓
Read usage (skip if missing — never fail the chat)
        ↓
calculateOpenAICost(model, inputTokens, outputTokens)
        ↓
INSERT ai_usage (one row)
```

Fire-and-forget insert after the reply is already decided. Usage save must **never** break STEP 7 / Feature 1–3.

---

## Database

```sql
CREATE TABLE ai_usage (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    organization_id VARCHAR(100) NULL,
    conversation_id VARCHAR(100) NULL,
    request_id VARCHAR(100) NULL,
    feature VARCHAR(50) NULL,          -- optional: explain_findings | friendly_requests | intent | general_chat
    model VARCHAR(100) NOT NULL,
    input_tokens INT NOT NULL,
    output_tokens INT NOT NULL,
    total_tokens INT NOT NULL,
    estimated_cost DECIMAL(10,6) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_ai_usage_created (created_at),
    INDEX idx_ai_usage_org_created (organization_id, created_at)
);
```

Keep it simple. `feature` is optional MVP polish so Feature 1–3 costs are separable later.

---

## Cost helper

One file, e.g. `services/engines/llm/openai/calculateOpenAICost.js`:

- Know pricing only for models CloudPilot uses (`gpt-4o-mini`, `gpt-4o`, …)
- Input: model, input tokens, output tokens  
- Output: estimated USD  
- Pricing changes → update **one** table in that file (point at https://openai.com/api/pricing/)

Unknown model → cost `0` + warn log (still save token counts), or skip cost field — prefer save tokens with `0` and log.

---

## API

```text
GET /ai/usage/summary
```

Returns aggregates only:

```json
{
  "today_cost": 0.48,
  "month_cost": 11.72,
  "today_requests": 42,
  "month_requests": 127,
  "average_request_cost": 0.0038
}
```

SQL spirit (scope by `organization_id` when you have it):

- Today cost / requests: `DATE(created_at) = CURRENT_DATE`
- Month cost / requests: same calendar month (or month start → now)
- Average: `AVG(estimated_cost)` for the month (or all-time — pick one and document; recommend **month**)

Independent from `/billing` / Atlas.

---

## Chat (CloudPilot)

Tiny intents — do **not** fold into AWS `show_billing`.

| User says | Behavior |
|-----------|----------|
| “How much have I spent on OpenAI?” / “AI spend today” / “OpenAI costs” | Read `ai_usage` summary → template reply |
| “Show all costs” / “AWS + OpenAI” | **Deferred** — needs AWS `show_billing` + AI summary combined |

Suggested action id: `show_ai_usage` — immediate execution, like `show_billing`, but hits local DB not Atlas.

Templates are enough for MVP (deterministic numbers). No OpenAI needed to *answer* about spend — only optional for *detecting* the question via `searchForAiSpend`.

---

## Kite UI

Small card:

```text
AI Usage
Today's Cost    $0.48
Month           $11.72
Requests        127
Average         $0.0038
```

`GET /ai/usage/summary` only. No chart. No drill-down.

---

## Files (planned)

| Piece | Where |
|-------|--------|
| SQL | `doc/sql/ai_usage.sql` (+ `master_sql.sql`) ✅ |
| Cost helper | `services/engines/llm/openai/calculateOpenAICost.js` ✅ |
| Persist | `services/aiUsage/functions/saveAiUsage.js` ← hooked from `createOpenAiChatCompletion` ✅ |
| DB class | `services/aiUsage/classes/AiUsage.js` ✅ |
| Summary route | `routes/aiUsageRoutes.js` → `GET /ai/usage/summary` ✅ |
| Chat action | `actionMap.show_ai_usage` + `scans/aiUsage/showAiUsageHandler.js` ✅ |
| Kite card | `kite/.../AiUsageCard.js` + `aiUsageAPI.js` ✅ |
| `searchForAiSpend` | Intelligence facade + Internal \| OpenAI ✅ |

**Do not** put AI usage into AWS billing handlers or Navigator billing tables.

---

## MVP slices

1. [x] Table + cost helper + save after successful OpenAI calls  
2. [x] `GET /ai/usage/summary`  
3. [x] Kite AI Usage card  
4. [x] Chat `show_ai_usage` (“what’s my OpenAI spend?”) via actionMap / handler  
5. [x] `searchForAiSpend()` — Intelligence detect (Internal \| OpenAI)  
6. [ ] Explicitly out: combined AWS + OpenAI; OpenAI Costs API reconciliation; charts  

---

## Future (enabled by this table — don’t build)

- Cost by project / org / user / conversation / model / feature flag  
- Daily chart  
- Chat: “Why did AI costs increase this week?”  
- Reconcile vs OpenAI org Costs API  
- “Show all costs” = AWS billing + AI usage in one reply  

---

## Success criteria

- [x] Every successful CloudPilot OpenAI call can leave one `ai_usage` row (when usage present)  
- [x] Failed / missing usage → chat still works; no insert required  
- [x] Summary endpoint + card show today / month / requests / average  
- [x] Chat answers AI spend without opening the provider dashboard  
- [x] AWS billing path untouched  
- [x] Detection can go through `searchForAiSpend()` without inventing numbers  

---

## Changelog

| Date | Change |
|------|--------|
| 2026-07-22 | Initial plan — store-per-call MVP; OpenAI Costs API deferred; separate from AWS billing |
| 2026-07-24 | API slices 1–2 shipped — persist + `GET /ai/usage/summary` |
| 2026-07-24 | Chat `show_ai_usage` — immediate informational action |
| 2026-08-05 | How-to for Intelligence capabilities; plan `searchForAiSpend()` (classify only) |
| 2026-08-05 | Shipped Kite `AiUsageCard` + `searchForAiSpend` (Internal \| OpenAI) + ENV |
| 2026-08-05 | Moved to `finished/` |
