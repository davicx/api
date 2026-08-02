# Project B — CloudPilot Intelligence Facade

**Status:** Next current plan — not started  
**Scope:** `cloudPilotIntelligence/` facade + migrate understanding behind it  
**Last updated:** 2026-08-02

---

## Goal

CloudPilot should call Intelligence for thinking work, not OpenAI / rules / regex directly.

```text
CloudPilot
  ↓
CloudPilotIntelligence.understand / respond / explain / generate
  ↓
Internal rules  OR  OpenAI  (behind toggles)
```

---

## Locked direction (from Project A)

- Build the `CloudPilotIntelligence` facade.
- Move temporary `cloudPilot/chat/understand/` behind Intelligence.
- Finish Internal / OpenAI selection behind that facade.
- CloudPilot must not call OpenAI / rules / regex directly once this is done.

---

## Out of scope for now

- No more folder reorganization of `actions/` / `executionModes/` / `scans/`
- No findings / remediations layer
- No action API redesign

---

## Completed before this

| Project | What | Doc |
|---|---|---|
| A | Responsibility folders (`chat`, `requests`, `scans`, …) | [finished/cloud_pilot_refactor.md](../finished/cloud_pilot_refactor.md) |
| C | `actions/` + `executionModes/` + style pass | [finished/cloud_pilot_project_c.md](../finished/cloud_pilot_project_c.md) |

---

## Next

Write the detailed Project B execution plan before coding. Stop after plan approval.
