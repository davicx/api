# CloudPilot AI Invocation Rules

**Status:** Complete — archived  
**Goal:** Fix Region Search first with `shouldRunRegionSearch()`, then use the same pattern for every AI function  
**Last updated:** 2026-08-02  
**Archive note:** Phases 1–4 shipped. OpenAI stays OFF in ENV by default. Index: [finished.md](./finished.md)

---

## Philosophy

> **CloudPilot only performs expensive AI work when that specific function is actually needed.**

---

## Design rule

> **Every AI function answers two questions:**
>
> **1. Should I run?**
>
> **2. How should I run?**

These decisions must remain separate.

```text
shouldRunRegionSearch(request)

      ↓ true

runRegionSearchInternal()
  or
runRegionSearchOpenAI()
      (+ Internal fallback if OpenAI fails)
```

Same shape for every function:

```javascript
shouldRunRegionSearch()
runRegionSearchInternal()
runRegionSearchOpenAI()

shouldRespondGeneral()
respondGeneralInternal()
respondGeneralOpenAI()

shouldGenerateCLI()
generateCLIInternal()
generateCLIOpenAI()
```

Also:

```text
Internal is always available.
OpenAI is opt-in per function.
Master OFF always wins.
Prefer skipping an optional extraction over making an unnecessary live call.
```

---

## One plan, one pattern

First implement `shouldRunRegionSearch()`. Then follow the same pattern for future AI work.

```text
shouldRunRegionSearch()
shouldRespondGeneral()     (later, if needed)
shouldGenerateCLI()        (later, if needed)
shouldExplainFinding()     (later, if needed)
…
```

---

## Current function reality

| Function | Config | OpenAI implementation | Live status |
|---|---|---|---|
| General chat response | `CLOUDPILOT_MESSAGE_RESPONSE` | Yes | Phase 3 done — use Internal; OpenAI stays OFF until you flip locally |
| Region search | `CLOUDPILOT_REGION_SEARCH` | Yes | Phases 1–2 done — use Internal; OpenAI stays OFF until you flip locally |
| Action search | `CLOUDPILOT_ACTION_SEARCH` | No — config stub only | Keep `internal` |
| Capabilities presentation | Reuses `CLOUDPILOT_MESSAGE_RESPONSE` | Yes (Phase 4) | Internal default; OpenAI path ready, ENV stays OFF |

`CLOUDPILOT_ACTION_SEARCH=openai` does not currently activate OpenAI action detection. The config value exists, but no action-search code reads it.

Note: today’s region file still uses `searchMessageForRegion` / `searchMessageForRegionInternal` / `searchMessageForRegionOpenAI`. Phase 1 adds `shouldRunRegionSearch()` only. Renames to `runRegionSearchInternal` / `runRegionSearchOpenAI` can follow later if desired.

---

## Required environment model

```dotenv
# Master: false always disables all GenAI requests.
CLOUDPILOT_AI_ENABLED=true

# General chat: internal | openai
CLOUDPILOT_MESSAGE_RESPONSE=internal

# Region only: internal | openai
CLOUDPILOT_REGION_SEARCH=internal

# Not implemented yet: keep internal.
CLOUDPILOT_ACTION_SEARCH=internal
```

Recommended development states:

### Deterministic local development

```dotenv
CLOUDPILOT_AI_ENABLED=false
CLOUDPILOT_MESSAGE_RESPONSE=internal
CLOUDPILOT_REGION_SEARCH=internal
CLOUDPILOT_ACTION_SEARCH=internal
```

### Region-only live test

```dotenv
CLOUDPILOT_AI_ENABLED=true
CLOUDPILOT_MESSAGE_RESPONSE=internal
CLOUDPILOT_REGION_SEARCH=openai
CLOUDPILOT_ACTION_SEARCH=internal
```

### General chat + region live test

```dotenv
CLOUDPILOT_AI_ENABLED=true
CLOUDPILOT_MESSAGE_RESPONSE=openai
CLOUDPILOT_REGION_SEARCH=openai
CLOUDPILOT_ACTION_SEARCH=internal
```

---

## Phase 1 — Add `shouldRunRegionSearch()` first

```text
shouldRunRegionSearch(requestState) → boolean
```

Product meaning:

```text
Request is actively collecting a region
  → true  → runRegionSearchInternal() or runRegionSearchOpenAI()

Otherwise
  → false → skip entirely
```

Stage 1 body in today's pipeline:

```text
true  when: open request AND region still missing
false when: no open request OR region already known
```

Prefer **"needs / is actively collecting a region"** in comments. Open-request + missing-region is only Stage 1.

Conservative: may miss region in brand-new `Scan EC2 in Oregon`. User can provide region after the request is open. Do **not** add action-first / same-turn extraction in Phase 1.

```text
shouldRunRegionSearch() answers: Should I run?
CLOUDPILOT_REGION_SEARCH / master answer: How should I run?
```

### Acceptance checks

- `Hello` → false → no Region Search
- `What can you do?` → false → no Region Search
- Open `scan_ec2` actively collecting region + `Oregon` → true → Region Search runs
- Open request with region already known → false → no Region Search
- Internal vs OpenAI setting unchanged; only **when** it runs changes

Commit and stop.

---

## Phase 2 — Verify Region Search works (OpenAI stays OFF)

Phase 1 already decided **Should I run?**  
Phase 2 confirms **How should I run?** stays safe and useful with OpenAI disabled.

### Required ENV (do not flip OpenAI on)

```dotenv
CLOUDPILOT_AI_ENABLED=false
CLOUDPILOT_MESSAGE_RESPONSE=internal
CLOUDPILOT_REGION_SEARCH=internal
CLOUDPILOT_ACTION_SEARCH=internal
```

Optional while testing timing:

```dotenv
CLOUDPILOT_REGION_LOGS=true
```

### What must work

1. No open request / region not needed → `shouldRunRegionSearch()` false → skip (no Internal, no OpenAI).
2. Open request actively collecting region → Region Search runs **Internal**.
3. Region already known → skip.
4. Master OFF always wins: even if `CLOUDPILOT_REGION_SEARCH=openai` were set locally, no live OpenAI call.

### Safety checks

- Skipped messages do not call OpenAI.
- Collecting-region messages use Internal and can still fill region (e.g. `us-west-2`).
- No destructive action from AI wording.

### Optional later (local only — not this Phase 2)

When you want a live Region OpenAI test:

```dotenv
CLOUDPILOT_AI_ENABLED=true
CLOUDPILOT_MESSAGE_RESPONSE=internal
CLOUDPILOT_REGION_SEARCH=openai
CLOUDPILOT_ACTION_SEARCH=internal
```

Do not commit `.env` secrets. Do not enable General Chat OpenAI until Phase 3.

Commit and stop.

---

## Phase 3 — Verify General Chat works (OpenAI stays OFF)

Phase 3 confirms general conversation stays deterministic with OpenAI disabled.

### Required ENV (do not flip OpenAI on)

```dotenv
CLOUDPILOT_AI_ENABLED=false
CLOUDPILOT_MESSAGE_RESPONSE=internal
CLOUDPILOT_REGION_SEARCH=internal
CLOUDPILOT_ACTION_SEARCH=internal
```

### What must work

1. General chat (`Hello`, `What can you do?`) → Internal response path (no live OpenAI).
2. Request-flow templates stay deterministic (not OpenAI wording).
3. Region Search still obeys `shouldRunRegionSearch()` (Phases 1–2).
4. Master OFF always wins: even if `CLOUDPILOT_MESSAGE_RESPONSE=openai` were set locally, no live OpenAI call.

### Safety checks

- No OpenAI usage for general chat while ENV stays off.
- OpenAI failure path (when enabled later) keeps Internal fallback — already in place; not exercised while OFF.
- No request mutation or AWS execution from OpenAI wording.

### Optional later (local only — not this Phase 3)

When you want a live General Chat OpenAI test:

```dotenv
CLOUDPILOT_AI_ENABLED=true
CLOUDPILOT_MESSAGE_RESPONSE=openai
CLOUDPILOT_REGION_SEARCH=internal
CLOUDPILOT_ACTION_SEARCH=internal
```

Do not commit `.env` secrets. Keep Action Search Internal.

Commit and stop.

---

## Phase 4 — Capabilities presentation (same pattern; OpenAI stays OFF)

```text
shouldRespondCapabilities()
  ↓ true
Build grounded actionMap catalog
  ↓
respondCapabilitiesInternal()
  or
respondCapabilitiesOpenAI()
  ↓
Internal fallback if OpenAI fails
```

OpenAI may improve wording but must not invent actions, services, or modes. Reuses `CLOUDPILOT_MESSAGE_RESPONSE`; no new capabilities env var.

### Required ENV (do not flip OpenAI on)

```dotenv
CLOUDPILOT_AI_ENABLED=false
CLOUDPILOT_MESSAGE_RESPONSE=internal
CLOUDPILOT_REGION_SEARCH=internal
CLOUDPILOT_ACTION_SEARCH=internal
```

### What must work

1. `What can you do?` → Internal capabilities message from `actionMap`.
2. Master OFF / message Internal → no live OpenAI call.
3. When OpenAI is enabled later → same catalog facts; Internal fallback on failure.

### Optional later (local only)

```dotenv
CLOUDPILOT_AI_ENABLED=true
CLOUDPILOT_MESSAGE_RESPONSE=openai
```

Do not commit `.env` secrets.

---

## Later work (deferred — not part of this archived plan)

- Implement OpenAI action search before setting `CLOUDPILOT_ACTION_SEARCH=openai`
- Stage 2 region: detect action first, then `shouldRunRegionSearch()` when that action needs region
- User-specific capability visibility
- `respond`, `explain`, `improve`, and `generate` Intelligence functions

---

## Archive note

Phases 1–4 complete. Optional local OpenAI flips and deferred items above live under [current.md](../current/current.md) / [to_do.md](../future/to_do.md) / [future.md](../future/future.md).
