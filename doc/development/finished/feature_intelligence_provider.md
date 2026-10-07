# Intelligence Provider — One operation, interchangeable implementations

## What this does

Prove one narrow rule with **Region Search only**:

> **CloudPilot has one operation. Internal and OpenAI are interchangeable implementations of that operation.**

Not a giant provider framework. Not friendly reply. Not the Important Fixes rename pass.

## Current step

**Finished** — Search TASK family uses one operation context → Internal | OpenAI (inventory Internal-only for now).

## Next

[Important Fixes](./feature_important_fixes.md) is finished. Leftovers: [Message Reply Follow-ups](../future/feature_message_reply_followups.md).  
Do **not** expand this pattern to Request Message Reply / General Chat unless a new feature asks.

**Status:** Finished — 2026-08-16 (Search family follow-through)  
**Codename:** `feature_intelligence_provider`  
**Came from:** Mid-[Important Fixes](./feature_important_fixes.md) — naming felt stuck because Internal vs OpenAI looked like two flows.  
**Related:** [How-to](../how_to/intelligence_provider.md) · [Important Fixes](./feature_important_fixes.md) · [Message Reply Follow-ups](../future/feature_message_reply_followups.md) · [Intelligence front door](./feature_intelligence_front_door.md) · [CloudPilot Context](../how_to/cloud_pilot_context.md) · [CloudPilot Turn](../how_to/cloud_pilot_turn.md)

---

## Goal (one sentence)

Make Region Search look like **one CloudPilot operation** that returns the same result shape whether Internal or OpenAI produced it, so callers never care which provider ran.

---

## Locked target shape

```text
searchRegion()
    ↓
getRegionSearchContext()
    ↓
RegionSearchContext
    ↓
CloudPilotIntelligence
    ↓
choose provider
   ┌────┴────┐
Internal   OpenAI
   │          │
   └────┬─────┘
        ↓
 SAME RESULT
```

Both implementations receive the **same** `RegionSearchContext` object:

```text
Internal(context)
OpenAI(context)
```

```text
RegionSearchContext
       ├──→ Internal(context) ──┐
       │                        ├──→ RegionSearchResult
       └──→ OpenAI(context) ────┘
```

### Locked rules

1. The caller says **`searchRegion()`** (or today's public door), not `searchRegionWithOpenAI()` / `searchRegionInternal()`.
2. There is **one Region Search context** — one object built once for the operation.
3. There is **one expected Region Search result**.
4. **Literally the same context object** goes to every provider. Internal may only *use* `context.userMessage` today. That is fine. **Do not reduce or reshape the context before giving it to Internal.**
5. Provider selection happens **inside CloudPilotIntelligence** (or the module it owns for this operation).
6. Nothing outside Intelligence should need to know which provider ran.
7. Adding a third provider later should **not** change the caller.

### Provider contract (locked)

```text
SAME OPERATION
SAME CONTEXT IN
SAME RESULT OUT
DIFFERENT IMPLEMENTATION
```

### What `Internal` means

`Internal` means **CloudPilot's internally selected implementation**, not “simple regex forever.”

Today it may be regex. Later it could be a local LLM, another model, richer deterministic code, or something else. The contract must still be the same context in and the same result out.

### Context belongs to the operation, not to OpenAI

```text
CloudPilot Context (building blocks / helpers)
    │
    ├── General Chat Context
    │     ├── Identity
    │     ├── Situation
    │     ├── Current State
    │     ├── Current Question
    │     └── Knowledge
    │
    └── Region Search Context
          ├── Current Question (or userMessage)
          └── Situation / region-search instructions
          (NO Identity)
```

Then for Region Search only:

```text
getRegionSearchContext()
    ↓
RegionSearchContext
    ↓
Internal(context)  or  OpenAI(context)
    ↓
RegionSearchResult
```

**Same context** means the same object between providers for **one operation**.
It does **not** mean every operation gets General Chat’s five blocks.

```text
General Chat   → GeneralChatContext
Region Search  → RegionSearchContext
Friendly Reply → FriendlyReplyContext   (later, not this feature)
```

Within Region Search:

```text
Internal(RegionSearchContext)
OpenAI(RegionSearchContext)
FutureProvider(RegionSearchContext)
```

Identical input contract. Do **not** give Region Search Identity “for consistency.”

### Folder clarity (locked preference)

Two levels of context. Do not hide operation assemblers inside OpenAI code.

```text
cloudPilotIntelligence/context/
├── contextTypes/
│   ├── cloudPilotContext.js              # Identity
│   ├── cloudPilotSituationContext.js     # Situation
│   ├── cloudPilotCurrentStateContext.js  # Current State
│   ├── currentQuestionContext.js         # Current Question
│   └── organizationKnowledgeContext.js   # Knowledge
│
└── operationContext/
    ├── getRegionSearchContext.js         # only if Step 1 proves it is needed
    └── …                                 # later ops only when asked
```

| Folder | Meaning |
|--------|---------|
| `contextTypes/` | Building blocks CloudPilot knows how to represent |
| `operationContext/` | Assemble the context needed for a particular operation |

Avoid provider-named folders: `openAIContext/`, `aiContext/`, `providerContext/`.

Alternate folder name that is also fine: `context/operations/getRegionSearchContext.js`. Prefer **`operationContext/`** unless Step 2 finds a strong reason to use `operations/`.

```text
getRegionSearchContext()     ← CloudPilot operation contract
        ↓
RegionSearchContext
        ↓
searchRegion(context)
        ↓
CloudPilotIntelligence
   ├── Internal(context)
   └── OpenAI(context)
         ↓
   buildRegionOpenAIMessages(context)   ← OpenAI adapter only
```

Later (not this feature unless asked):

```text
operationContext/
├── getRegionSearchContext.js
├── getFriendlyReplyContext.js
├── getGeneralChatContext.js
└── …
```

Six months from now: “What does CloudPilot send into Region Search?” → `context/operationContext/getRegionSearchContext.js`.

### Likely Step 1 gap to look for

Today `buildRegionOpenAIMessages()` may be doing **two jobs**:

1. deciding / building Region Search context
2. translating that into OpenAI messages

If so, that is a gap. Target shape later (Step 2, not Step 1):

```text
getRegionSearchContext()
        ↓
RegionSearchContext
        ↓
    provider
   /        \
Internal   OpenAI
             ↓
   buildRegionOpenAIMessages(context)   ← OpenAI adapter only
```

`buildRegionOpenAIMessages()` should not **be** the Region Search context. It should only adapt an already-built context for OpenAI.

---

## Why Region Search first

Today Region Search already has:

- one public entry (`searchMessageForRegion` / `CloudPilotIntelligence.understandRegion`)
- Internal regex path
- OpenAI TASK path
- same return idea: `{ region }` or `{}`

It is the cleanest place to prove the principle without touching friendly reply, General Chat, or Important Fixes names.

---

## Non-goals

- Friendly reply / `presentRequestMessage` / facts renaming
- General Chat / `chat()` refactor
- A generic provider registry or plugin system
- A `Provider` interface, `IntelligenceProvider` base class, or `executeOperation()`
- Generic `OperationContext` / `OperationResult` types
- Renaming every Intelligence capability at once
- Creating `getRegionSearchContext.js` just because the plan drew it
- Resuming [Important Fixes](./feature_important_fixes.md) Step 4
- Live OpenAI smokes just to prove structure (OpenAI off / preview-only when verifying)

---

## Strong rules

> If changing the shape requires changing how CloudPilot continues after Region Search, stop and explain why.

> Prefer clarifying the existing Region Search entry over inventing a new framework.

> If today's code already satisfies part of the contract, leave that part alone. Keep the feature as small as possible.

Prefer:

- one context helper for this operation **only if needed**
- one result shape
- provider choice behind the door
- preserving OpenAI ON/OFF and Internal fallback behavior exactly

---

## Steps

### Step 1 — Inspect Region Search only (no code changes)

Produce a small **today vs target** map. Not proposed code.

```text
TODAY
caller
  ↓
Intelligence
  ↓
what EXACTLY gets constructed?
  ↓
Internal / OpenAI
  ↓
what EXACTLY comes back?
```

Then compare that against the locked target.

- [x] Map today's Region Search: caller → Intelligence door → Internal / OpenAI → result
- [x] Verify whether both providers receive the **same** Region Search context object today
- [x] If Internal currently gets a specially reduced/different input while OpenAI gets a constructed context, **call that out as a gap**. Do **not** fix it yet
- [x] Check whether `buildRegionOpenAIMessages()` both **builds** context and **adapts** it for OpenAI — if yes, flag as a gap
- [x] Say whether callers already ignore the provider
- [x] List the smallest gaps vs the locked rules (if any)
- [x] Do **not** assume `getRegionSearchContext.js` must be created
- [x] Estimate: **SMALL / MEDIUM / LARGE**
- [x] No renames of Important Fixes names, no friendly-reply work, no generic provider framework
- [x] Do **not** force Identity into Region Search

#### Step 1 result — today vs target

**Estimate: SMALL**

##### TODAY

```text
caller
  searchMessageForValues(message, requestState)
  (also CloudPilotIntelligence.understandRegion → same file)
        ↓
searchMessageForRegion(message, requestState)
        ↓
shouldRunRegionSearch(requestState)     ← gate only; uses pendingAction + missing includes "region"
        ↓
choose provider (inside this module, via CLOUDPILOT_REGION_SEARCH + CLOUDPILOT_AI_ENABLED)
   ┌────────────────┴────────────────┐
Internal                             OpenAI
searchMessageForRegionInternal(      searchMessageForRegionOpenAI(
  message   ← STRING ONLY              message   ← STRING ONLY
)                                    )
                                       ↓
                                     buildRegionOpenAIMessages(message)
                                       = TASK rules + examples + CURRENT MESSAGE
                                       = OpenAI messages payload
        ↓
return {}  or  { region: "us-west-2" }
        ↓
caller merges values.region — does not care which provider ran
```

Notes on today:

- `requestState` is used for the **gate**, then dropped. Neither Internal nor OpenAI receives it.
- Both providers take a **raw string** (`message`), not a `RegionSearchContext` object.
- When Internal is selected, `buildRegionOpenAIMessages(message)` still runs for **preview logging only**; Internal still only gets the string.
- `cloudPilotSituationContext` has a `region` building block, but Region Search OpenAI does **not** use it — TASK text is hardcoded in `buildRegionOpenAIMessages`.

##### Already matches the locked target

| Rule | Today |
|------|--------|
| Caller does not say OpenAI/Internal | Yes — `searchMessageForRegion` / `understandRegion` |
| One result shape | Yes — `{}` or `{ region }` |
| Callers ignore provider | Yes — only read `regionResult.region` |
| Provider choice behind Intelligence door | Yes — inside the Region Search module owned by Intelligence |
| No Identity on Search | Yes — tiny TASK only |
| Third provider would not change caller | Mostly yes already |

##### Gaps (do not fix in Step 1)

1. **No shared Region Search context object.** Both get `message` string. Target wants one `RegionSearchContext` passed as `Internal(context)` / `OpenAI(context)` even if Internal only *reads* `userMessage`.
2. **`buildRegionOpenAIMessages()` does two jobs:** embeds operation TASK content **and** formats OpenAI messages. That is both “build context” and “OpenAI adapter.”
3. **OpenAI effectively gets richer input than Internal.** OpenAI sees TASK + examples + message. Internal sees only the message string. Same *string* argument type, not the same operation context object.
4. **`getRegionSearchContext.js` does not exist today.** Do not create it unless Step 2 needs it to close gap 1. Leave alone anything that already matches.

##### Step 2 implication (not code)

Smallest possible fix if approved later: introduce one Region Search context object (possibly via `operationContext/getRegionSearchContext.js`), pass that **same object** to Internal and OpenAI, and keep `buildRegionOpenAIMessages(context)` as OpenAI-only adapter. Do not add Provider frameworks. Do not touch friendly reply.

### Step 2 — Unify Region Search to the locked shape (behavior identical)

Only close the gaps Step 1 found. Leave satisfied parts alone.

- [x] Make Region Search match the locked rules **only where Step 1 found real gaps**
- [x] One `RegionSearchContext` object for the operation; pass that **same object** to every provider
- [x] Add `context/operationContext/getRegionSearchContext.js` **only if needed** (not inside OpenAI code)
- [x] Keep OpenAI message building as a provider adapter only
- [x] One result shape continuing into the normal CloudPilot flow
- [x] Keep env switches and fallbacks working exactly as today
- [x] Do **not** treat Internal as “regex forever” — only as today's Internal implementation
- [x] Do **not** add friendly-reply / general-chat operationContext files yet
- [x] Do **not** add Provider interfaces, registries, or generic execute helpers

#### Step 2 result

```text
getRegionSearchContext(message)
        ↓
RegionSearchContext { userMessage, task }
        ↓
Internal(context)     OpenAI(context)
  uses userMessage      buildRegionOpenAIMessages(context)
        ↓
{} or { region }
```

- Callers unchanged (`searchMessageForRegion` / `understandRegion`)
- `buildRegionOpenAIMessages` is adapter-only
- Preview logging when Internal still uses the same context object

### Step 3 — Document the pattern (then stop)

- [x] Short how-to or note: one operation → one context → provider implementations — [intelligence_provider.md](../how_to/intelligence_provider.md)
- [x] Do **not** apply to friendly reply yet unless a later feature asks
- [x] Unfreeze Important Fixes only after this is accepted

### Step 4 — Finish the Search TASK family (same pattern)

- [x] Action Search — `getActionSearchContext` → same object → Internal | OpenAI
- [x] AI Spend Search — `getAiSpendSearchContext`
- [x] Open Requests Search — `getOpenRequestsSearchContext`
- [x] Organizational Knowledge Search — `getOrganizationalKnowledgeSearchContext`
- [x] EC2 / S3 Inventory Search — operation context → Internal (no OpenAI path yet)
- [x] Do **not** touch Friendly Reply / General Chat
- [x] Do **not** add provider frameworks
- [x] Update [intelligence_provider.md](../how_to/intelligence_provider.md) for the Search family

**Stop here.** Search has one consistent architecture.
