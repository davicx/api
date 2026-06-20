# Step One — Cleanup (before Capability Layer)

**Purpose:** Remove dead code and unused files **before** implementing the capability layer (Steps C1–C7). Cleanup first → smaller diffs, honest grep, no moving HTTP twice.

**Status:** Planned — not started.

**Do this before:** [step_one_cleanup.md](./step_one_cleanup.md) (Phase U1–U3), then Step C1.

**Related:**

| Doc | Role |
|-----|------|
| [capability_migration.md](./capability_migration.md) | Capability layer — C0–C9 |
| [single_capabiity_change.md](./single_capabiity_change.md) | New & changed files for capabilities |
| [architecture.md](./architecture.md) | Four layers, pipeline reference |
| [current_development.md](./current_development.md) | Active checklist |

**Last reviewed:** 2026-06-09

---

## Why this order

1. Capability moves are mostly **import swaps** — dead code makes it hard to know what's actually called.
2. **Separate PRs** — cleanup vs capabilities are easier to review.
3. **Avoid double moves** — don't extract `toggleEC2` into `capabilities/`, then delete a file that still had the old copy in comments.

```text
Phase U  (this doc)     →  clean live tree
Phase C  (entry points) →  capabilities C1–C7
```

---

## Phase U steps

| Step | Focus | Risk |
|------|--------|------|
| **U1** | Dead comment blocks in live files | Low — smoke chat after |
| **U2** | Dead functions + unused imports in live files | Low |
| **U3** | Legacy `functions/functions.js` audit | Medium |
| **U4** | `doc/code/` snapshot archives | None (docs only) |
| **U5** | `state/ActionState.js` memory path | Medium — defer until DB-only confirmed |

---

## U1 — Dead comment blocks (highest value)

### Primary target: `services/cloudPilotMessageFunctions.js`

**Live path:** lines **45–210** — STEPS 1–7 (`processMessage`).

**Remove (after confirming nothing live references it):**

| Lines (approx) | Content |
|----------------|---------|
| ~213–560 | Old pipeline inside `/* … */` |
| ~562–588 | Commented `detectUserRequest` |
| ~754+ | Duplicate commented `processMessage` |

**Keep:**

| Function | Why |
|----------|-----|
| `processMessage` (45–210) | Live orchestrator |
| `getActionDefinition` | Exported / used externally |
| `getCurrentUserMessage` | STEP 1 |
| `cloneActionStatus` | Outcome shaping |
| `normalizeProcessMessageContext` | Context helper |

**Verify after U1:** App boots; `"scan ec2"`, `"toggle ec2"`, `"hi"` smokes pass.

---

## U2 — Dead functions + unused imports

### `services/cloudPilotMessageFunctions.js`

**Unused on live path (candidates to remove with dead block):**

| Import / function | Notes |
|-------------------|--------|
| `Functions` (`../functions/functions.js`) | Only used in commented old pipeline |
| `AtlasExecution` | Only in dead/commented paths in this file |
| `CloudPilotChat` | Only in dead/commented paths **in this file** — still live via `buildCloudPilotResponse.js` |
| `shouldStartNewAction` | Old pipeline only |
| `resolveNullActionEvent` | Old pipeline only |
| `handleGeneralChat` (local) | Replaced by `buildGeneralChatResponse.js` |
| `handleCloudPilotChatOLD` | Dead |

### Other live files

| File | Action |
|------|--------|
| `understanding/understandMessage.js` | Remove commented pre-Slice-1 block |

### Do not delete (still live)

| File | Used by |
|------|---------|
| `chat/CloudPilotChat.js` | `responses/buildCloudPilotResponse.js` (STEP 7) |
| `classes/AtlasExecution.js` | `CloudPilotChat.js` |
| All handlers, formatters, `actionRegistry.js` | STEP 6 |

**Verify after U2:** Same smokes as U1; grep for removed symbol names returns nothing in live code.

---

## U3 — `functions/functions.js` audit

**Location:** `application/atlas/functions/functions.js`

Superseded for field extraction by `understanding/search/*`.

| Consumer | What it uses |
|----------|--------------|
| `logic/messages.js` | `Functions.addHeader`, `Functions.addFooter` |
| `cloudPilotMessageFunctions.js` (dead) | `extractStructuredFields`, `determineRequestReadiness`, etc. |

**Goal:** Trim to what `messages.js` still needs, or move header/footer to a tiny util (e.g. `logic/logHelpers.js`).

**Functions likely removable after U1–U2:**

- `extractAwsRegion`, `extractInstanceType`, `extractName`, `extractInstanceId`
- `extractStructuredFields`, `fieldExtractors`
- `determineRequestReadiness`, `determineActionEvent`, `determineExecutionModeEvent`
- `extractExecutionMode`, `shouldStartExecution`, `userConfirmedAction`

**Verify after U3:** `POST /message` still logs header/footer; chat smokes pass.

---

## U4 — Doc snapshots (optional, low urgency)

Not runtime — safe to archive or delete when confident.

```text
application/atlas/doc/code/allCode.js
application/atlas/doc/code/allCodeTwo.js
application/atlas/doc/code/allCodeThree.js
application/atlas/doc/code/commentedCode.js
application/atlas/doc/code/buildAllCodeThree.js
doc/allCode/…                         ← repo-root duplicates (if present)
```

**Options:**

- Move to `doc/archive/code-snapshots/`
- Leave in place and skip until capability work is done
- Delete only after confirming nothing links to them

**No chat smoke required** — docs only.

---

## U5 — `state/ActionState.js` memory path (defer)

**Location:** `application/atlas/state/ActionState.js`

Still used as **in-memory fallback** in `requests/functions/requestLoadFunctions.js` when not in DB mode.

**Only remove when:**

- DB mode is always on in dev/prod
- Tests don't rely on in-memory state

Track in [current_development.md](./current_development.md) — not part of U1–U2.

---

## Smoke checklist (after U1–U3)

Run before starting capability Step C1:

| Message | Expect |
|---------|--------|
| `"hi"` | General chat path (STEP 7); no request row |
| `"scan ec2"` → region → `"yes"` | Scan runs; Navigator; no history row |
| `"toggle ec2"` → fields → automatic → `"yes"` | Toggle runs; `STEP 6B: HISTORY SAVED` |

Also confirm:

- [ ] App boots without require errors
- [ ] No references to removed symbols in live `services/` code
- [ ] `cloudPilotMessageFunctions.js` is ~200 lines (not ~1000)

---

## Recommended sequence

```text
U1  →  trim cloudPilotMessageFunctions comment blocks
U2  →  remove dead helpers + unused imports
     →  smoke test
C1  →  scaffold capabilities/          ← capability_migration.md
C2  →  toggleEC2 first slice
U3  →  trim functions.js (when ready)
C3–C7 → remaining capabilities
U4  →  doc archives (optional)
U5  →  ActionState memory path (when DB-only)
```

---

## Files touched summary

| Step | Files likely changed |
|------|----------------------|
| U1 | `services/cloudPilotMessageFunctions.js` |
| U2 | `services/cloudPilotMessageFunctions.js`, `understanding/understandMessage.js` |
| U3 | `functions/functions.js`, possibly `logic/messages.js` |
| U4 | `doc/code/*` (move/delete only) |
| U5 | `state/ActionState.js`, `requests/functions/requestLoadFunctions.js` |

**Not touched in U1–U2:** handlers, `atlasEC2Functions.js`, registry, decision, requests, history, executions.

---

## Exit criteria (Phase U complete)

- [ ] Live `processMessage` is the only pipeline in `cloudPilotMessageFunctions.js`
- [ ] No unused imports in cleaned files
- [ ] `functions/functions.js` trimmed or scoped to header/footer only
- [ ] Chat smokes green
- [ ] Ready to start **C1** without grep noise from dead code

---

## Changelog

| Date | Change |
|------|--------|
| 2026-06-09 | Initial plan — U1–U5 before capability layer |
