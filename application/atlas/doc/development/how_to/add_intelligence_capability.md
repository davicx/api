# CloudPilot Intelligence — Adding a New Capability

**Status:** Development guide  
**Goal:** Every Intelligence capability has one public entry point. Internal and OpenAI are implementations of that capability — not the product.

**Related:** [Use OpenAI Chat](./use_openai_chat.md) · [Intelligence Front Door](../finished/feature_intelligence_front_door.md) · [Questions](../current/feature_questions.md) · [AI Spending](../finished/feature_ai_spending.md)

---

## Philosophy

CloudPilotIntelligence is the product's brain.

Every capability exposes **one public function**. Callers never know whether the work is Internal or OpenAI (or a future provider).

```text
CloudPilot
        │
        ▼
CloudPilotIntelligence
        │
        ▼
searchForRegion()
        │
        ▼
Configuration decides implementation
        │
   ┌────┴────┐
Internal   OpenAI
```

> **CloudPilot owns the capability. Providers are just implementations.**

`searchForRegion` is a CloudPilot feature. `searchForRegionOpenAI` is one way to implement it. Same idea as actions, scans, and execution modes: stable front door, interchangeable backends.

---

## Standard pattern

```text
Capability (public)
    │
    ▼
Should it run?
    │
    ▼
Choose implementation (ENV + master)
    │
 ┌──┴──┐
Internal
OpenAI
```

The public function is the only entry point callers use.

Also remember:

| Layer | Answers | Must never |
|-------|---------|------------|
| **Search** (Intelligence) | “What is the user asking about / extracting?” | Own product DB facts or invent the user answer |
| **CloudPilot** | “Given that hit, what do I do?” | Call OpenAI implementation files directly |

---

## Folder structure (target)

```text
cloudPilotIntelligence/
  CloudPilotIntelligence.js          # facade — re-exports public API
  understand/
    search/
      searchMessageForValues.js      # values orchestrator
      searchMessageForAction.js
      searchMessageForConversation.js
      searchMessageForReply.js
      values/                        # value extractors
        searchMessageForRegion.js
        searchForAiSpend.js
        …
      helpers/
        searchMessageForStructuredFields.js
```

- Public file owns orchestration.
- Implementation files own the work.
- Facade exposes `searchForRegion` so CloudPilot only imports `CloudPilotIntelligence`.

**Today (honest):** region still lives as `search/values/searchMessageForRegion.js` with Internal/OpenAI in one file, exported as `understandRegion` on the facade. New capabilities should use the **target** names and split files below. Renames can follow later.

---

## Public function

Keep orchestration thin.

```javascript
async function searchForRegion(message, requestState) {
    if (!shouldRunRegionSearch(requestState)) {
        return {};
    }

    const mode = CLOUDPILOT_AI_CONFIG.regionSearch; // internal | openai
    const masterOff = !CLOUDPILOT_AI_CONFIG.aiEnabled;

    if (mode === 'openai' && !masterOff) {
        return searchForRegionOpenAI(message);
    }

    if (mode === 'openai' && masterOff) {
        // Preview / fallback — same shape as Internal; do not live-send
        return searchForRegionInternal(message);
    }

    return searchForRegionInternal(message);
}
```

Responsibilities:

- One stable API
- `shouldRun?`
- Select implementation (`CLOUDPILOT_*_SEARCH` + master `CLOUDPILOT_AI_ENABLED`)
- Same return shape on every path
- Hide providers from callers

Do **not** put product DB loads or user-facing copy here.

---

## Internal implementation

```text
searchForRegionInternal()
```

- Deterministic logic (phrases, regex, rules, parsing)
- No OpenAI
- Same object shape as OpenAI path

---

## OpenAI implementation

```text
searchForRegionOpenAI()
```

- Build prompt / messages
- Call OpenAI via `providers/openAI`
- Validate / normalize response
- Return the **same object shape** as Internal

Caller must not care which path ran.

---

## ENV

Each capability gets its own switch (independent; master OFF always wins):

```dotenv
CLOUDPILOT_AI_ENABLED=false
CLOUDPILOT_REGION_SEARCH=internal
CLOUDPILOT_OPEN_REQUESTS_SEARCH=internal
CLOUDPILOT_AI_SPEND_SEARCH=internal
# later: CLOUDPILOT_KNOWLEDGE_SEARCH=internal
```

Values: `internal` | `openai` (later: `claude`, `gemini`, …).

---

## Naming

| Role | Name |
|------|------|
| Public | `searchForThing()` |
| Internal | `searchForThingInternal()` |
| OpenAI | `searchForThingOpenAI()` |
| Later | `searchForThingClaude()`, `searchForThingGemini()`, … |

Examples:

```text
searchForRegion()
searchForOpenRequests()
searchForAiSpend()
searchForOrganizationalKnowledge()   # later
```

---

## Adding a new capability (checklist)

1. [ ] Name it `searchForThing` (product capability, not “OpenAI feature”).
2. [ ] Add one file under `understand/search/values/` (or root `search/` if not a value extractor):
   - `searchForThing.js` — shouldRun + Internal + OpenAI in one file (Phase 1)
   - Split Internal/OpenAI files only when the capability earns it
3. [ ] Export from `CloudPilotIntelligence.js`.
4. [ ] Add `CLOUDPILOT_THING_SEARCH` to `cloudPilotAIConfig.js` + `sample_env.md`.
5. [ ] Return the same shape from Internal and OpenAI (`{}` when no hit).
6. [ ] Wire CloudPilot fulfillment (load data / speak / execute) — **not** inside search.
7. [ ] Smoke: Internal on; master off + openai still no live send; openai on when ready.

---

## Example — AI spend

```text
searchForAiSpend()
        │
CLOUDPILOT_AI_SPEND_SEARCH
        │
   ┌────┴────┐
Internal   OpenAI     # classify only
        │
        ▼
CloudPilot            # load ai_usage summary → speakKnown
```

See [AI Spending](../finished/feature_ai_spending.md).

---

## Future providers

```text
searchForRegion()
        │
   ┌────┼────┬────┐
Internal OpenAI Claude Gemini …
```

Only the public orchestrator gains new cases. Callers stay on `searchForRegion()`.

---

## Rules

- Every capability has exactly one public function.
- Callers always use the public function (or the Intelligence facade).
- Internal and OpenAI return the same object shape.
- Implementation files never call each other.
- The public function owns provider selection (+ `shouldRun` + master).
- New providers must not require caller changes.
- Search classifies / extracts; CloudPilot owns facts and answers.

---

## Why this matters

Today and tomorrow the call site stays:

```text
CloudPilotIntelligence.searchForRegion(...)
```

Only the implementation behind it changes. The rest of CloudPilot stays product-centric, not AI-vendor-centric.
