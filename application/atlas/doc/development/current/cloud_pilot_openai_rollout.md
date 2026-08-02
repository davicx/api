# CloudPilot AI Feature Gates

**Status:** Plan — not started  
**Goal:** Fix Region Search first, then use the same conservative gate pattern for every implemented AI feature
**Last updated:** 2026-08-02

---

## One plan, one pattern

```text
Internal is always available.
OpenAI is opt-in per feature.
Master OFF always wins.
Avoid unnecessary live calls over extracting optional information.
```

First implement the Region Search gate. Then follow this same pattern for future AI work instead of adding one-off OpenAI calls.

```text
1. Does the current request need this feature?
   NO  → do not call Internal or OpenAI feature work.
   YES → continue.

2. Is OpenAI enabled for this feature?
   NO  → use Internal implementation.
   YES → use OpenAI with deterministic facts / context.

3. If OpenAI fails
   → use Internal fallback when available.
```

CloudPilot must never use OpenAI just because a feature is available. It should call AI only when the current request needs that feature.

---

## Current feature reality

| Feature | Config | OpenAI implementation | Live status |
|---|---|---|---|
| General chat response | `CLOUDPILOT_MESSAGE_RESPONSE` | Yes | Can enable now |
| Region search | `CLOUDPILOT_REGION_SEARCH` | Yes | Enable only after conservative Region Search gate |
| Action search | `CLOUDPILOT_ACTION_SEARCH` | No — config stub only | Do not set to `openai` |
| Capabilities response | Uses message response later | Not yet — Phase 2 of capabilities plan | Internal only today |

`CLOUDPILOT_ACTION_SEARCH=openai` does not currently activate OpenAI action detection. The config value exists, but no action-search code reads it.

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

## Phase 1 — Fix Region Search first

Before enabling OpenAI Region Search live, implement this conservative gate:

```text
Open request + region missing
  → Region Search may run

No open request OR region already known
  → Region Search must skip
```

This is intentionally conservative. It may miss the region in a brand-new combined message such as `Scan EC2 in Oregon`, but it prevents unnecessary live calls.

### Acceptance checks

- `Hello` → no Region Search
- `What can you do?` → no Region Search
- Open `scan_ec2` request missing region + `Oregon` → Region Search runs
- Open request with stored region + any message → no Region Search
- Internal/OpenAI setting remains unchanged; only call timing changes

Commit and stop.

---

## Phase 2 — Apply the pattern to implemented AI features

After Phase 1 is verified:

1. Enable Region Search with `CLOUDPILOT_REGION_SEARCH=openai`.
2. Verify logs and usage only appear for the gated region cases.
3. Enable General Chat with `CLOUDPILOT_MESSAGE_RESPONSE=openai`.
4. Verify request-flow templates remain deterministic; only general conversation uses OpenAI.
5. Keep `CLOUDPILOT_ACTION_SEARCH=internal`.

### Safety checks

- Set `CLOUDPILOT_AI_ENABLED=false` and confirm both paths use Internal behavior.
- Simulate / observe an OpenAI failure and confirm current Internal fallback behavior remains safe.
- Confirm no destructive action executes because of an OpenAI response.

Commit configuration / docs only if source-controlled configuration changes are needed. Do not commit `.env` secrets.

---

## Phase 3 — Follow the pattern for capabilities (later)

The `show_capabilities` internal response is actionMap-driven now.

Later, add optional OpenAI presentation only by:

```text
actionMap catalog
  ↓
grounded capabilities facts
  ↓
OpenAI wording
  ↓
internal catalog response fallback
```

OpenAI may improve wording but must not invent actions, services, or execution modes.

Do not add a new capabilities-specific environment variable in this phase; reuse `CLOUDPILOT_MESSAGE_RESPONSE`.

---

## Later work (not part of this rollout)

- Implement OpenAI action search before ever setting `CLOUDPILOT_ACTION_SEARCH=openai`
- Stage 2 region ordering: detect action first, then search region only if the detected action requires it
- User-specific capability visibility
- `respond`, `explain`, `improve`, and `generate` Intelligence capabilities

---

## Next

Implement Phase 1 only: conservative Region Search gate. Do not enable or add another OpenAI feature until its call gate is clear.
