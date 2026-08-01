# CloudPilot — Project Structure Plan (move / rename only)

**Purpose of this doc:** Shareable plan for updating **folders and file layout** under `api/application/atlas/`.  
**Work type:** Move / rename + fix `require()` paths. **Do not rewrite business logic.**  
**Not in this doc:** Product AI prompts, new OpenAI features, Atlas behavior changes.

**Full migration phases + every file path:** [responsibility_refactor.md](./responsibility_refactor.md)

**Last reviewed:** 2026-08-01  
**Phase status:** Superseded by [cloud_pilot_refactor.md](./cloud_pilot_refactor.md) — Project A complete. Intelligence facade is Project B.

---

## Goal

Organize by **responsibility**. Top-level folders each answer one question.

```text
api/application/atlas/

├── routes/                       → How do HTTP requests enter?
├── logic/                        → What workflow runs for that route?
├── functions/                    → Shared helpers / DB classes
│
├── cloudPilot/                   → What CloudPilot DOES
│   ├── cloudPilotMessageFunctions.js   # STEPS 1–7 entry
│   ├── actionMap.js
│   ├── decision/                 # STEP 4
│   ├── conversation/             # Speak / general / request (NOT understand)
│   ├── scans/
│   ├── changes/
│   ├── requests/
│   ├── history/
│   ├── execution/
│   ├── billing/
│   ├── inventory/
│   ├── aiUsage/
│   └── navigator/
│
├── cloudPilotIntelligence/       → How CloudPilot THINKS
│   ├── context/                  # CloudPilot-owned knowledge for intelligence ops
│   ├── understand/
│   ├── respond/                  # scaffold (later — Project B)
│   ├── explain/                  # scaffold (later)
│   ├── improve/                  # scaffold (later)
│   └── generate/                 # scaffold (later)
│
├── providers/                    → What EXTERNAL SYSTEMS CloudPilot talks to
│   ├── atlas/                    # Node → Atlas HTTP (today)
│   ├── openAI/
│   │   ├── client/
│   │   └── usage/                # NO context/ here
│   ├── aws/                      # EMPTY — future direct AWS
│   ├── github/
│   └── gmail/                    # EMPTY scaffold
│
├── config/
└── doc/                          # Planning only
```

### Locked boundary

```text
cloudPilot/              → WHAT CloudPilot does
cloudPilotIntelligence/  → HOW CloudPilot thinks (includes context/)
providers/               → WHAT EXTERNAL SYSTEMS it communicates with
```

---

## IMPORTANT — Context location (corrected)

**Do NOT put context under `providers/openAI/`.**

```text
ai/context/**  →  cloudPilotIntelligence/context/**
```

Context is what CloudPilot **knows** when thinking. OpenAI (or Claude later) only **consumes** it.

```text
providers/openAI/
  client/
  usage/
  # no context/
```

---

## Biggest moves (today → after)

```text
TODAY                                 →  AFTER
────────────────────────────────────────────────────────────────
cloudPilot/conversation/understand/** →  cloudPilotIntelligence/understand/
ai/context/**                         →  cloudPilotIntelligence/context/
ai/client/**                          →  providers/openAI/client/
ai/usage/**                           →  providers/openAI/usage/
aws/**                                →  providers/atlas/
config/github/githubClient.js         →  providers/github/githubClient.js
services/actions/...                  →  cloudPilot/{scans,changes,billing,inventory,aiUsage}/
services/actions/actionMap.js         →  cloudPilot/actionMap.js
services/navigator/                   →  cloudPilot/navigator/
services/                             →  deleted after absorb
```

---

## Migration phases

| Phase | Do | Status |
|-------|-----|--------|
| **1** | Empty scaffolds only | **Done** |
| **2** | Move providers + context (atlas, openAI client/usage, intelligence context, github) | **Done** |
| **3** | Absorb `services/` → `cloudPilot/` | **Done** |
| **4** | Move understand → `cloudPilotIntelligence/understand/` | Waiting |
| **5** | Delete empty `ai/`, `aws/`, `services/`; refresh README | Partial (`ai`/`aws`/`services` gone; README pending) |

**Project A** = this structure refactor.  
**Project B** = Intelligence facade / Internal|OpenAI redesign — **after** Project A. Do not mix.

---

## Strict rules

MOVE · RENAME PATHS · FIX `require()` · VERIFY  

Do **not:** rewrite logic, change signatures, change ENV behavior, implement respond/explain/generate, put context under OpenAI.

---

## Success

1. Existing `.js` files still exist at new paths  
2. Behavior unchanged  
3. Context under `cloudPilotIntelligence/context/`  
4. `providers/openAI/` has **no** `context/`  
5. Atlas ≠ AWS scaffold  

Detail: [responsibility_refactor.md](./responsibility_refactor.md)
