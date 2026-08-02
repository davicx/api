# Project B — CloudPilot Intelligence Facade

**Status:** Phase 1 complete — stop before Phase 2  
**Scope:** `cloudPilotIntelligence/` facade + migrate existing understanding behind it  
**Work type:** Facade + move existing understand code; preserve behavior  
**Last updated:** 2026-08-02

---

## Goal

```text
CloudPilot should depend on CloudPilotIntelligence for all AI-assisted
thinking work.

CloudPilotIntelligence decides whether that work is performed by
Internal implementations or OpenAI based on configuration.
```

```text
CloudPilot
  ↓
CloudPilotIntelligence
  ↓
Internal  OR  OpenAI   (config chooses)
```

---

## Project B deliverables

Project B establishes the CloudPilotIntelligence facade and migrates existing understanding functionality behind it.

### Build

- CloudPilotIntelligence facade entry (understand path only for live work)
- Internal / OpenAI selection behind that facade for understanding

### Migrate (no behavior change)

Move the existing understanding implementation from  
`cloudPilot/chat/understand/`  
behind the CloudPilotIntelligence facade without changing behavior.

Initial live capabilities (existing code, re-homed / wrapped):

- `understandMessage()`
- `understandRegion()` / region search (`searchMessageForRegion`)
- `understandAction()` / action search (existing extractors)
- `understandResource()` / resource-related extractors as already used by understand

These should support Internal / OpenAI selection behind the facade where that toggle already exists (region today); do not invent new toggles unless required to preserve current behavior.

### Placeholders only (do not implement)

Additional capabilities remain empty scaffolds / placeholders until later projects:

- `respond()`
- `explain()`
- `improve()`
- `generate()`

---

## Locked rules

- Minimal change: move / wrap existing understand code; do not rewrite extractors.
- CloudPilot pipeline calls Intelligence for understanding — not OpenAI / rules / regex directly.
- Preserve current exports’ calling contracts at the pipeline boundary as much as possible (update imports only where required).
- Do not redesign `actionMap`, requests, execution, actions, or executionModes.
- Do not touch scan / remediation / findings work.
- Prefer your FUNCTIONS / STEP comment style on new facade entry files.

---

## Suggested phases

### Phase 1 — Facade skeleton

- [x] Add Intelligence facade entry that can host `understand*` methods.
- [x] Keep `respond` / `explain` / `improve` / `generate` as placeholders.
- [x] Smoke: module loads; no pipeline behavior change yet.
- [x] Commit. Stop.

### Phase 2 — Migrate understand behind facade

- [ ] Move existing `cloudPilot/chat/understand/**` behind Intelligence.
- [ ] Wire CloudPilot STEP 3 to call Intelligence understand APIs.
- [ ] Preserve Internal / OpenAI region behavior.
- [ ] Smoke: general chat + request understanding still work.
- [ ] Commit. Stop.

### Phase 3 — Cleanup + docs

- [ ] Remove empty leftover understand folders under `chat/` if empty.
- [ ] Update README / current docs paths.
- [ ] Confirm no direct OpenAI / regex calls from CloudPilot understand path.
- [ ] Commit. Stop.

---

## Out of scope

- Implementing full `respond` / `explain` / `improve` / `generate` behavior
- New AI product features or prompt redesign
- Folder reorganization of `actions/` / `executionModes/` / `scans/`
- Findings / remediations layer
- Action API redesign

---

## Roadmap context

```text
Project A  →  Organize CloudPilot responsibilities
Project C  →  Organize execution (actions + executionModes)
Project B  →  Organize intelligence (facade + understand migration)
```

| Project | What | Doc |
|---|---|---|
| A | Responsibility folders | [finished/cloud_pilot_refactor.md](../finished/cloud_pilot_refactor.md) |
| C | `actions/` + `executionModes/` | [finished/cloud_pilot_project_c.md](../finished/cloud_pilot_project_c.md) |
| B | Intelligence facade (this doc) | current |

---

## Success criteria

1. CloudPilot depends on CloudPilotIntelligence for understanding.
2. Existing understand behavior is unchanged.
3. Internal / OpenAI selection for understanding remains config-driven inside Intelligence.
4. `respond` / `explain` / `improve` / `generate` are still placeholders.
5. Docs updated; Project B marked complete only after Phase 3.

---

## Next

Say **go** to start Phase 2 (migrate `chat/understand/` behind the facade).
