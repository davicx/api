# Intelligence Provider — One operation, interchangeable implementations

## What this does

Prove one narrow rule with **Region Search only**:

> **CloudPilot has one operation. Internal and OpenAI are interchangeable implementations of that operation.**

Not a giant provider framework. Not friendly reply. Not the Important Fixes rename pass.

## Current step

**Plan locked** — awaiting **Step 1** (inspect Region Search as it exists today).

## Next

Say **do Step 1** to inspect Region Search against the locked rules below. Do **not** code until that inspection is reviewed.

**Status:** Active (plan locked — awaiting Step 1)  
**Codename:** `feature_intelligence_provider`  
**Came from:** Mid-[Important Fixes](./feature_important_fixes.md) — naming felt stuck because Internal vs OpenAI looked like two flows.  
**Related:** [Important Fixes](./feature_important_fixes.md) *(frozen until this ships)* · [Intelligence front door](../finished/feature_intelligence_front_door.md) · [CloudPilot Context](../how_to/cloud_pilot_context.md) · [CloudPilot Turn](../how_to/cloud_pilot_turn.md)

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
    ├── getRegionSearchContext.js         # this feature (Step 2 if needed)
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
- Renaming every Intelligence capability at once
- Resuming [Important Fixes](./feature_important_fixes.md) Step 4
- Live OpenAI smokes just to prove structure (OpenAI off / preview-only when verifying)

---

## Strong rules

> If changing the shape requires changing how CloudPilot continues after Region Search, stop and explain why.

> Prefer clarifying the existing Region Search entry over inventing a new framework.

Prefer:

- one context helper for this operation
- one result shape
- provider choice behind the door
- preserving OpenAI ON/OFF and Internal fallback behavior exactly

---

## Steps

### Step 1 — Inspect Region Search only (no code changes)

- [ ] Map today's Region Search: caller → Intelligence door → Internal / OpenAI → result
- [ ] Verify whether both providers receive the **same** Region Search context object today
- [ ] If Internal currently gets a specially reduced/different input while OpenAI gets a constructed context, **call that out as a gap**. Do **not** fix it yet
- [ ] Check whether `buildRegionOpenAIMessages()` both **builds** context and **adapts** it for OpenAI — if yes, flag as a gap
- [ ] Say whether callers already ignore the provider
- [ ] List the smallest gaps vs the locked rules (if any)
- [ ] Estimate: **SMALL / MEDIUM / LARGE**
- [ ] No renames of Important Fixes names, no friendly-reply work, no generic provider framework
- [ ] Do **not** force Identity into Region Search

### Step 2 — Unify Region Search to the locked shape (behavior identical)

- [ ] Make Region Search match the locked rules if Step 1 found real gaps
- [ ] One `RegionSearchContext` object for the operation; pass that **same object** to every provider
- [ ] Put the assembler under `context/operationContext/getRegionSearchContext.js` (not inside OpenAI code)
- [ ] Keep OpenAI message building as a provider adapter only
- [ ] One result shape continuing into the normal CloudPilot flow
- [ ] Keep env switches and fallbacks working exactly as today
- [ ] Do **not** treat Internal as “regex forever” — only as today's Internal implementation
- [ ] Do **not** add friendly-reply / general-chat operationContext files yet

### Step 3 — Document the pattern (then stop)

- [ ] Short how-to or note: one operation → one context → provider implementations
- [ ] Do **not** apply to friendly reply yet unless a later feature asks
- [ ] Unfreeze Important Fixes only after this is accepted

### Step 4 — Optional later (not this feature)

- [ ] Next Intelligence operation that needs the same clarity (only if asked)
- [ ] Resume [Important Fixes](./feature_important_fixes.md) Step 4 rename
