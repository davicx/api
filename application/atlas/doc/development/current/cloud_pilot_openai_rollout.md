# CloudPilot AI Invocation Rules

**Status:** Phase 1 done — `shouldRunRegionSearch()` (next: verify live, then Phase 2)  
**Goal:** Fix Region Search first with `shouldRunRegionSearch()`, then use the same pattern for every AI function  
**Last updated:** 2026-08-02

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
| General chat response | `CLOUDPILOT_MESSAGE_RESPONSE` | Yes | Can enable after its should-run path is clear |
| Region search | `CLOUDPILOT_REGION_SEARCH` | Yes | Enable only after Phase 1 `shouldRunRegionSearch()` |
| Action search | `CLOUDPILOT_ACTION_SEARCH` | No — config stub only | Keep `internal` |
| Capabilities presentation | Reuses message response later | Not yet | Internal catalog only today |

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

## Phase 2 — Enable Region Search OpenAI

After Phase 1 is verified:

1. Enable with `CLOUDPILOT_REGION_SEARCH=openai`.
2. Verify usage only when `shouldRunRegionSearch()` is true.
3. Keep General Chat Internal if testing one variable at a time.
4. Keep `CLOUDPILOT_ACTION_SEARCH=internal`.

### Safety checks

- Master OFF → Internal behavior
- Skipped messages → no OpenAI usage
- No destructive action from an OpenAI response

Do not commit `.env` secrets.

---

## Phase 3 — Enable General Chat OpenAI

After Phase 2 is verified:

1. Enable with `CLOUDPILOT_MESSAGE_RESPONSE=openai`.
2. Request-flow templates stay deterministic.
3. Only general conversation uses OpenAI message response.
4. Keep `CLOUDPILOT_ACTION_SEARCH=internal`.

### Safety checks

- Master OFF → Internal general-chat behavior
- OpenAI failure → Internal fallback
- No request mutation or AWS execution from OpenAI wording

Commit and stop.

---

## Phase 4 — Same pattern for capabilities (later)

```text
shouldRun…()   // capabilities response needed?
  ↓ true
Build grounded actionMap catalog
  ↓
respond…Internal() or respond…OpenAI()
  ↓
Internal fallback if OpenAI fails
```

OpenAI may improve wording but must not invent actions, services, or modes. Reuse `CLOUDPILOT_MESSAGE_RESPONSE`; no new capabilities env var.

---

## Later work (not part of this rollout)

- Implement OpenAI action search before setting `CLOUDPILOT_ACTION_SEARCH=openai`
- Stage 2 region: detect action first, then `shouldRunRegionSearch()` when that action needs region
- User-specific capability visibility
- `respond`, `explain`, `improve`, and `generate` Intelligence functions

---

## Next

Phase 1 implemented: `shouldRunRegionSearch()`.  
Next: verify acceptance checks live, then Phase 2 (enable Region OpenAI).  
Do not enable another OpenAI function until its **Should I run?** decision is clear.
