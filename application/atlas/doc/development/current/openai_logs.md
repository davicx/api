# CloudPilot — OpenAI Logging

**Status:** Plan — follow-on to current OPENAI block  
**Goal:** Log each AI capability invocation separately so Future Dave can see how many requests ran, why, what was sent, what came back, and cost  
**Work type:** Logging format + per-message request counter  
**Last updated:** 2026-08-02  
**Related:** [current.md](./current.md) (OpenAI logging audit) · [sample_env.md](../../sample_env.md) · archived invocation rules [finished/cloud_pilot_openai_rollout.md](../finished/cloud_pilot_openai_rollout.md)

---

## Goal

Make OpenAI logging clearly show **each individual AI capability invocation**.

Instead of one generic `OPENAI` section for the whole turn, every AI capability logs its own block.

That makes it obvious:

* how many OpenAI requests were made for this user message
* why each request was made (capability)
* what was sent
* what was returned
* what each request cost

---

## Design question (for Future Dave)

> **Exactly how many OpenAI requests did CloudPilot make for this user message, and why?**

---

## Desired format

Header names the capability and the request number within this user message:

```text
--------------------------------------------------
OPENAI: Region Search (Request 1)
--------------------------------------------------

Model:
gpt-4o-mini

Status:
Executed

Conversation History:
Disabled

Context Loaded
✓ Identity
✓ Situation
✓ Current Question
Knowledge: Not Used

Messages
----------------------------------
[
  ...
]

Response
----------------------------------
{}

Usage
----------------------------------
Prompt Tokens: 196
Completion Tokens: 1
Estimated Cost: $0.000030
```

Later in the same turn:

```text
--------------------------------------------------
OPENAI: General Chat (Request 2)
--------------------------------------------------

Model:
gpt-4o-mini

Status:
Preview (AI Disabled)

Conversation History:
Enabled
Messages Included: 12

Context Loaded
✓ Identity
✓ Current Question
✓ Knowledge

Messages
----------------------------------
[
  ...
]

Response
----------------------------------
(none — AI disabled)

Usage
----------------------------------
(none)
```

---

## Timeline mental model

CloudPilot Intelligence is multiple independent AI capabilities. Logs should read as a timeline:

```text
STEP 2 Initial State

OPENAI: Region Search (Request 1)

STEP 3 Understanding

STEP 4 Decision

OPENAI: General Chat (Request 2)

STEP 5 …
```

Immediately obvious:

* request count
* which capability
* order of invocations

Pipeline STEPs stay CloudPilot’s workflow. Each `OPENAI: …` block is one AI transaction.

---

## Request numbering

During **one user message**, number sequentially:

```text
OPENAI: Region Search (Request 1)
OPENAI: Action Search (Request 2)
OPENAI: General Chat (Request 3)
```

Reset the counter at the start of the next user message (`processMessage` entry).

Preview blocks (AI disabled) still consume a request number if that capability ran its “would send” path — they are still capability invocations for debugging.

---

## Keep existing information

Each block still shows:

| Section | Meaning |
|---|---|
| Capability (in header) | Which Intelligence function |
| Model | Model used |
| Status | `Executed` or `Preview (AI Disabled)` |
| Conversation History | Enabled/Disabled + count |
| Context Loaded | Identity / Situation / Current Question / Knowledge |
| Messages | Exact API messages array |
| Response | Exact model response (or none if preview) |
| Usage | Tokens + estimated cost |

Only the **header** changes from a bare `OPENAI` to:

```text
OPENAI: <Capability> (Request N)
```

Section title **Messages** (not Payload / Request) — matches the OpenAI API messages array.

---

## Capabilities that should use this format

Today / soon:

* Region Search
* General Chat
* Capabilities presentation

Later (same header pattern):

* Action Search
* Finding Explanation
* CLI Generation
* Terraform Generation
* any new Intelligence function

Every new AI capability must call the shared logger — no one-off formats.

---

## Relationship to ENV switches

Keep independent switches (not one `LOGS_ON`):

```dotenv
CLOUDPILOT_OPENAI_LOGS=true          # master for these OPENAI: Capability blocks
CLOUDPILOT_REGION_LOGS=true          # compact STEP 3: Region Search / Region Found
CLOUDPILOT_MESSAGE_LOGS=false        # verbose STEP 7a–7c
CLOUDPILOT_CONTEXT_LOGS=false        # Building Identity / Situation dumps
CLOUDPILOT_ACTION_STATE_LOGS=false   # INITIAL / FINAL ACTION STATE
CLOUDPILOT_ACTION_LOGS=false
```

`CLOUDPILOT_OPENAI_LOGS=false` turns off all per-capability OpenAI blocks.

Compact region pipeline line stays separate (CloudPilot result, not the AI dump).

---

## Later (optional)

```dotenv
CLOUDPILOT_OPENAI_LOG_LEVEL=verbose   # full Messages JSON (default for now)
CLOUDPILOT_OPENAI_LOG_LEVEL=summary   # char counts / short response, no full JSON
```

Do not block Phase 1 on summary mode.

---

## Phased implementation

### Phase 1 — Header + request counter

1. Shared logger header: `OPENAI: ${capability} (Request ${n})`.
2. Per-`processMessage` counter: increment on each `logOpenAI` call; reset at message start.
3. Rename section label to **Messages** if not already.
4. Keep Status Preview / Executed behavior.
5. Verify Region Search + General Chat in one turn show Request 1 / Request 2.
6. Commit and stop.

### Phase 2 — All current AI paths

1. Capabilities presentation uses same header + counter.
2. Any other live OpenAI call sites use the same logger only.
3. Smoke: skip region → only General Chat as Request 1.

### Phase 3 — Docs + summary level (optional)

1. Update `sample_env.md` / `chat_use_open_ai.md` examples to the new header.
2. Optional `CLOUDPILOT_OPENAI_LOG_LEVEL`.

---

## Out of scope

- Removing pipeline STEPs
- Deleting verbose builders (gate with ENV only)
- Changing when capabilities run (`shouldRun…` stays separate)
- Billing / usage DB schema changes

---

## Acceptance checks (Phase 1)

- One user message, region + general chat → two blocks, Request 1 then Request 2
- Next user message → numbering resets to Request 1
- Preview still labeled `Preview (AI Disabled)` and shows full Messages that would be sent
- `CLOUDPILOT_OPENAI_LOGS=false` → no OPENAI capability blocks
- Compact `STEP 3: Region Search` / Region Found still works with `CLOUDPILOT_REGION_LOGS`

---

## Next

Say **go** to start Phase 1 (header + per-message request counter only).
