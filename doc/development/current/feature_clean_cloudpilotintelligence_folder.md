# Feature: Clean `cloudPilotIntelligence/` folder

**Status:** Architecture ideas refining. **Do not code / do not add or rename folders yet.**

Goal: make Intelligence a **service CloudPilot calls**, not a second application.

Package identity:

> CloudPilot Intelligence provides reasoning and language transformations that CloudPilot can perform using internal logic, OpenAI, or other intelligence providers. It does not own application workflow or AWS execution.

Related: `feature_clean_cloudpilot_folder.md` (application/orchestration mess).  
Scan conversation product work: `feature_better_chat.md`.

---

## Locked boundary

| Package | Owns |
| --- | --- |
| **`cloudPilot/`** | Application turn: decide, request state, permissions/capabilities, execute/retrieve, product workflow |
| **`cloudPilotIntelligence/`** | Thinking / language **services**: understand, improve, respond (+ shared context infrastructure) |

Intelligence does **not** decide whether an EC2 instance should be paused or whether a scan should run. CloudPilot does.

```text
CloudPilot = orchestrator
CloudPilot Intelligence = service CloudPilot asks when it needs intelligence
```

Conceptual front door (aspirational API shape — not implemented):

```js
CloudPilotIntelligence.understand(message, context)
CloudPilotIntelligence.improve(data, context)
CloudPilotIntelligence.respond(context)
```

**Rule going forward (anti-sprawl):**

> Prefer a small number of general-purpose functions and existing folders. Do not create a new file, folder, class, or specialized function merely because a new use case has a different name. Split only when the implementation or responsibility is materially different.

Start general. Split only when two uses actually need meaningfully different behavior.

---

## Three intelligence operations (meaningful verbs)

These are different jobs. Do not collapse them into one “AI chat” folder.

### `understand` — human language → structured meaning

Input is ambiguous user text:

```text
"yeah do that one in Oregon"
```

Output is structured meaning:

```js
{ confirmation: true, region: "us-west-2" }
```

Today this mostly lives under `understand/` (action, region, values, questions, …).

### `improve` — existing content → clearer content (same facts)

**One general operation** — not a folder of subtype files:

```js
CloudPilotIntelligence.improve(data, context)
```

```text
INPUT: whatever CloudPilot wants improved
+ CONTEXT / INSTRUCTION: what "better" means here
        ↓
CloudPilot Intelligence
        ↓
OUTPUT: improved version (same facts)
```

Same function, different goals via context — e.g.:

```js
improve(rule, { goal: "Make this understandable to a developer" });
improve(awsFinding, { goal: "Make this concise and explain the important risk" });
improve(documentation, { goal: "Easier for a new engineer" });
```

Do **not** start with:

```text
improve/improveFinding.js
improve/improveRule.js
improve/improveTechnicalMessage.js
…
```

unless those later need materially different implementation. Concept OK; empty `improve/` folder OK; no subtype sprawl until a real call site exists.

### `respond` — grounded context/results → user-facing message

```js
CloudPilotIntelligence.respond(context)
```

CloudPilot already understood, decided, and optionally acted/retrieved. Now it has question + state + findings (+ capabilities/history as needed) and asks: **what should I say?**

Today this mostly lives under `conversation/` (`generateGeneralMessageReply`, `generateRequestMessageReply`). Eventual rename target: `respond/`.

### How callers should think about Intelligence

CloudPilot should **not** have to know:

```text
run OpenAI region classifier
then internal action matcher
then OpenAI response generator
```

It asks Intelligence to **understand**, **improve**, or **respond**. The Intelligence implementation decides Internal vs OpenAI vs several small checks underneath.

`understand` may still keep specialized extractors **internally** (region/action/values) where deterministic behavior differs — but callers should prefer one `understand(message, context)` entry over a zoo of public APIs.

---

## What I would *not* keep as top-level ops (for now)

| Placeholder | Why defer |
| --- | --- |
| **`generate/`** | Fuzzy — respond and improve both “generate.” Only add when there is a concrete product verb (generate Terraform / CLI / docs / remediation plan). |
| **`explain/`** | Often just `improve` (“rewrite clearly”) or a later product distinction: improve = clearer wording, explain = why it matters. Wait until the product needs both. |

Do not organize today’s code around hypothetical folders.

---

## The whole turn (not a context phase)

**Handoff rule:** `understand/` returns meaning to CloudPilot. Intelligence does **not** jump from understanding into S3/EC2 retrieval or execution. CloudPilot fulfills; then may ask Intelligence to `respond` (or `improve`).

```text
User: "What S3 buckets do I have?"
              │
              ▼
       CloudPilot receives turn
              │
              ▼
CloudPilotIntelligence.understand(...)
              │
              ▼
        UNDERSTAND → "They need S3 inventory"
              │
              ▼
     RETURN TO CLOUDPILOT
              │
              ▼
      CloudPilot DECIDE → "I can retrieve this"
              │
              ▼
         FULFILL → Scan S3 / Atlas
              │
              ▼
         S3 DATA RETURNS
              │
              ▼
CloudPilotIntelligence.respond(...)
              │
              ▼
            USER
```

Whole-system stages:

```text
UNDERSTAND → DECIDE → FULFILL → RESPOND
```

| Stage | Owner | Job |
| --- | --- | --- |
| **UNDERSTAND** | Intelligence | Human language → structured meaning |
| **DECIDE** | CloudPilot | What does this understanding require? |
| **FULFILL** | CloudPilot | Make it true: retrieve, start/continue/execute request, or do nothing |
| **RESPOND** | Intelligence (when needed) | Say it to the user from grounded results |
| **IMPROVE** | Intelligence (optional) | Refine existing content/facts before or while responding |
| **CONTEXT** | Intelligence infrastructure | What each Intelligence call needs — not a turn stage |

**FULFILL** is preferred over “ACTION” at the turn level: answering “What S3 buckets do I have?” is fulfillment via retrieve, not the same kind of “action” as “Pause my EC2.”

Do **not** add a `fulfill/` folder (or `decide/` / `action/` / `retrieve/` inside Intelligence). **FULFILL is a mental name** for what existing `scans/`, `execution/`, and `executionModes/` already do. Architecture-driven folder creation is what we are avoiding.

### FULFILL: information vs remediation

Separate **what** needs fulfilling from **how** it gets fulfilled.

```text
WHAT                          HOW
pause_ec2                     automatic | cli | pr | instructions
retrieve S3 inventory         scan_s3 → Atlas   (not a remediation mode)
```

The four remediation / execution modes are **not** Intelligence types. They are four ways CloudPilot can fulfill a remediation decision:

```text
1. Instructions
2. CLI
3. PR
4. Automatic
```

```text
                    FULFILL
                       │
           ┌───────────┴───────────┐
           │                       │
      INFORMATION              REMEDIATION
           │                       │
       Scan / Get             Execution Mode
       Atlas / AWS                 │
                            ┌──────┼──────┬──────┐
                            ▼      ▼      ▼      ▼
                          Instr   CLI     PR    Auto
```

This matches existing `executionModes/` (and informational `scans/`). Master registry = actions (WHAT) + execution modes (HOW for remediations).

```text
USER
 │
 ▼
UNDERSTAND   Intelligence
 │
 ▼
DECIDE       CloudPilot
 │
 ▼
FULFILL      CloudPilot
 │
 ├── Need information? → Scan / Atlas / AWS
 └── Need remediation? → Instructions | CLI | PR | Automatic
 │
 ▼
RESPOND      Intelligence
 │
 ▼
USER
```

Examples:

| Mode | After DECIDE pause_ec2 | FULFILL | RESPOND |
| --- | --- | --- | --- |
| Automatic | mode = automatic | `executionModes/automatic` → runAction → pause handler → Atlas | “i-123 has been paused.” |
| CLI | mode = CLI | `executionModes/cli` → command text (no AWS change) | present the command |
| PR | mode = PR | open proposed infra change | “Here’s the PR…” |
| Instructions | mode = instructions | walkthrough | present steps |

Informational (“What S3 buckets do I have?”): FULFILL via scan/get — no remediation mode.

### `processMessage` as conductor (mental model — not a rewrite)

Today: `cloudPilot/chat/cloudPilotMessageFunctions.js` → `processMessage`.

Conceptual shape:

```js
async function processMessage(message) {
    // 1. What does the user mean?
    const understanding =
        await CloudPilotIntelligence.understand(message, state);

    // 2. CloudPilot decides what that understanding requires
    const decision =
        decideNextStep(understanding, state);

    // 3. CloudPilot fulfills it
    const result =
        await fulfillDecision(decision);

    // 4. Intelligence helps communicate the grounded result
    return CloudPilotIntelligence.respond({
        message,
        understanding,
        decision,
        result
    });
}
```

Not necessarily that exact code — **that mental model**.

`fulfillDecision` might mean:

```text
ANSWER_GENERAL     → nothing to retrieve
GET_S3_DATA        → S3 handler → Atlas
GET_EC2_DATA       → EC2 handler → Atlas
START_REQUEST      → requests/
CONTINUE_REQUEST   → requests/
EXECUTE_REQUEST    → execution/
```

```text
                    cloudPilot/
                        │ owns turn
                        ▼
                ┌── UNDERSTAND ──┐
                │  Intelligence  │
                └───────┬────────┘
                        │ returns meaning
                        ▼
                ┌───── DECIDE ─────┐
                │    CloudPilot    │
                └────────┬─────────┘
                         │
                         ▼
                ┌──── FULFILL ─────┐
                │    CloudPilot    │
                │ scan / action /  │
                │ request / answer │
                └────────┬─────────┘
                         │ real result
                         ▼
                ┌──── RESPOND ─────┐
                │   Intelligence   │
                └────────┬─────────┘
                         ▼
                        USER
```

So Intelligence’s top-level stays complete as:

```text
understand/ | improve/ | respond/ | context/ | CloudPilotIntelligence.js
```

The “missing piece” is not another Intelligence folder — it is a clear **handoff** inside the CloudPilot turn orchestrator.

**Context is not a pipeline stage** between Decide and Fulfill.

---

## Context = shared infrastructure for Intelligence calls

```text
                 CloudPilotIntelligence
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
      UNDERSTAND       IMPROVE        RESPOND
          │              │              │
          └──────────────┼──────────────┘
                         ▼
                       CONTEXT
                 "What does THIS call need?"
                         │
                  ┌──────┴──────┐
                  ▼             ▼
              Internal        OpenAI / future
```

Not every call needs every ingredient:

| Call | Typical needs |
| --- | --- |
| `understandRegion` | Current Question; maybe slim Current State |
| `improveFinding` | Original finding; maybe Capabilities; not History |
| `respond` (final) | Identity, Capabilities, Current State, Question, History, real findings |

### Where recipes (`masterContext`) belong

Prefer recipes **inside `context/`**, not as a sibling “capability” next to understand/improve/respond:

```text
context/
├── contextTypes/          WHAT each ingredient contains
├── masterContext/         WHICH ingredients THIS call gets (recipes) — only when needed
├── operationContext/      specialized search task payloads (while still needed)
├── buildContext.js
└── buildSystemMessage.js
```

**Same anti-sprawl rule for recipes:** do not auto-create `masterRegionContext`, `masterActionContext`, `masterFinalContext`, … just because calls *can* differ. Start with a **general** context-building mechanism (`buildAIContext` + options). Introduce a specialized recipe file only when requirements diverge enough to justify one.

Today `masterFinalResponseContext.js` already exists at Intelligence root — leave it; do not proliferate siblings until Scan chat is stable and a second recipe is clearly needed. Preference remains: recipes live under `context/` eventually, not as a fourth intelligence verb.

---

## Target Intelligence top-level (aspirational — not a rename sprint)

```text
cloudPilotIntelligence/

├── understand/              Human language → structured meaning
├── improve/                 Existing facts → clearer form (when we have a call site)
├── respond/                 Grounded package → user message  (today: conversation/)
├── context/                 Shared assemble/render + recipes (when justified)
└── CloudPilotIntelligence.js
```

Those folders should **not** automatically fill with specialized functions. Complexity stays underneath only where behavior is materially different.

Today:

- `conversation/` ≈ future `respond/`
- `improve/` empty — concept OK; one general `improve(data, context)` when first needed
- `explain/`, `generate/` — remove or leave empty; do not fill

Do **not** put DECIDE or ACTION/execution inside Intelligence — those stay in `cloudPilot/`.

---

## CloudPilot application (against this model)

```text
cloudPilot/
├── masterCloudPilotCapabilities.js   What am I allowed / capable of?
├── chat/                             Own the overall user-message turn
├── requests/                         Decide / manage persistent request workflow
├── execution/ + executionModes/      Execute approved work / how to deliver it
├── scans/                            Read AWS / gather information
├── actions/                          Change AWS
└── supporting data…                  history, pricing, knowledge, questions speak…
```

---

## Decide vocabulary (replace “Request vs General Chat” as the only fork)

Ask: **What does this message REQUIRE CloudPilot to do?**

| | Meaning | Today’s rough label |
| --- | --- | --- |
| **A** | Continue / change / cancel existing request | Request conversation |
| **B** | Start a new request | Request conversation |
| **C** | Retrieve information and answer | Often mislabeled “general” or forced through scan request |
| **D** | Answer without taking / retrieving CloudPilot data | True “general chat” |

Examples:

- “What tags does my S3 bucket have?” → **C** (retrieve), not D  
- “What is an S3 bucket?” → **D**  
- “Scan my S3 buckets” → **B** then confirm → execute  
- “yes” (with open scan waiting) → **A** → execute  

AI helps understand; **CloudPilot** checks capabilities and invokes handlers. AI does not secretly run AWS.

---

## Example flows (conceptual)

### “What tags does my S3 bucket have?”

```text
CloudPilot receives message
  → Intelligence UNDERSTAND
  → { intent: question, subject: s3, requestedFact: tags }
  → CloudPilot DECIDE (capabilities allow tags)
  → CloudPilot GET (S3 path → Atlas → AWS)
  → optional Intelligence IMPROVE on raw finding text
  → CloudPilot RESPOND (Intelligence may help wording with real findings)
  → "Bucket X has these tags…"
```

### “Scan my S3 buckets” → “yes”

```text
UNDERSTAND → scan_s3 action
CloudPilot DECIDE → create/update request, need confirmation
RESPOND → "Ready to scan. Run it?"

UNDERSTAND → confirmation
CloudPilot DECIDE using Current State
EXECUTE → Atlas
RESPOND with real result
```

---

## What went wrong recently (for cleanup mindset)

- Architecture layers and recipes were added while Scan conversation was still fragile  
- Extra folders / concepts ahead of working MVP made the turn hard to follow  
- Prefer: **small fixes that restore a clear UNDERSTAND → DECIDE → FULFILL → RESPOND path** before more Intelligence architecture  

`masterFinalResponseContext` / Capabilities projection may stay as-is if they work; **stop expanding** recipes and folder renames until chat turns are reliable again.

---

## Cleanup principles (when we touch code later)

1. **Start general; split only when behavior is materially different**  
2. Do not create `generate/` / `explain/` structure until product needs them  
3. `improve` = one general op + goal in context — not improveFinding/improveRule files  
4. Do not move decide/execute into Intelligence  
5. Context (+ recipes) stay shared Intelligence infrastructure; add recipe files sparingly  
6. Prefer deleting dead placeholders over adding symmetry stubs  
7. Small changes that make the live path readable beat large refactors  

**Next:** Stabilize Scan S3 / Scan EC2 conversation with the smallest possible fixes. Use this doc as the north star — not a build ticket to reorganize everything now.
