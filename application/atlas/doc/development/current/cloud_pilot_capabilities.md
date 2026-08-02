# CloudPilot Capabilities Response

**Status:** Plan — not started  
**Scope:** Let users ask what CloudPilot can do, using the current action catalog as the source of truth  
**Work type:** One informational action + curated internal response + optional OpenAI presentation  
**Last updated:** 2026-08-02

---

## Goal

When a user asks questions such as:

```text
What can you do?
What do you do?
What are your capabilities?
What services do you support?
Help
```

CloudPilot should return a useful, accurate description of its current supported work.

The response must work in both modes:

- **Internal:** deterministic curated response; no OpenAI request.
- **OpenAI:** same verified capability facts, presented naturally through the existing general-message OpenAI switch.

---

## Important accuracy rule

Only describe capabilities that exist in the live `actionMap`.

Current action catalog supports:

### Explore AWS

- Inventory AWS resources
- Scan EC2
- Scan S3
- View AWS billing

### Manage EC2

- Create EC2 instances
- Delete EC2 instances
- Toggle between primary and secondary EC2 instances
- Update EC2 tags

### Work your way

For supported EC2 changes:

- Guided instructions
- AWS CLI commands (where currently available)
- Pull request delivery (where currently available)
- Automatic execution after the existing request / confirmation flow

### CloudPilot

- View recorded OpenAI usage / spend

Do **not** promise RDS management, RDS read access, or generic AWS troubleshooting until an actual action supports it.

---

## Target behavior

```text
User: "What can you do?"
  ↓
actionMap detects show_capabilities
  ↓
Immediate informational execution
  ↓
Capabilities handler
  ├── Internal → curated deterministic response
  └── OpenAI → existing message-response setting, with curated facts supplied
  ↓
CloudPilot response
```

This is an informational action. It creates no request row, runs no AWS mutation, and records no history.

---

## Design decisions

### 1. Use an explicit `show_capabilities` action

Add `show_capabilities` to `cloudPilot/actionMap.js`, following existing immediate informational actions:

```text
actionTier: informational
requiresWorkflow: false
requiresExecution: true
requiredFields: []
executionFunction: showCapabilitiesHandler
```

This matters because the current immediate-execution path only calls an action handler when both `requiresWorkflow: false` and `requiresExecution: true`.

### 2. Curated content first

Do not derive the user-facing response automatically from every `actionMap` field in this first pass.

Use a small curated capability response so the product language is clear and unsupported work is not accidentally advertised.

The action map remains the verification checklist whenever the response is updated.

### 3. Preserve the existing AI toggle

Use the existing settings:

```text
CLOUDPILOT_AI_ENABLED=false
  → Internal response always

CLOUDPILOT_AI_ENABLED=true
CLOUDPILOT_MESSAGE_RESPONSE=internal
  → Internal response

CLOUDPILOT_AI_ENABLED=true
CLOUDPILOT_MESSAGE_RESPONSE=openai
  → OpenAI presents the supplied verified capabilities
```

Do not add a separate capabilities-specific OpenAI toggle in the first pass.

### 4. OpenAI may improve wording, not facts

When OpenAI is enabled, pass the curated capabilities as grounded context and instruct it:

```text
Only describe the listed capabilities.
Do not claim support for services or actions not listed.
```

The internal response remains the fallback if OpenAI fails.

---

## Target files

```text
cloudPilot/
├── actionMap.js
└── chat/
    └── capabilities/
        ├── showCapabilitiesHandler.js
        └── capabilitiesFunctions.js       # only if response / OpenAI helpers need extraction
```

The handler belongs with chat because its product is a response, not an AWS scan or mutation.

---

## Suggested execution phases

### Phase 1 — Internal capability response

1. Add `show_capabilities` to `actionMap`.
2. Add `showCapabilitiesHandler`.
3. Add exact match phrases.
4. Return the curated deterministic response.
5. Verify it follows immediate execution with no request row / AWS call / history record.
6. Commit and stop.

### Phase 2 — Optional OpenAI presentation

1. Reuse the existing `MESSAGE_RESPONSE` Internal / OpenAI switch.
2. Pass curated capabilities as grounded context when OpenAI is enabled.
3. Keep the deterministic response as failure fallback.
4. Verify OpenAI cannot advertise unsupported work.
5. Commit and stop.

### Phase 3 — Docs

1. Add the capability question to README / product examples.
2. Update this plan with supported phrases and current limitations.
3. Commit and stop.

---

## Out of scope

- RDS support
- New AWS actions
- Generic AWS troubleshooting promises
- Dynamic actionMap-to-marketing copy generation
- New OpenAI configuration switches
- Changes to request, execution, history, or Intelligence architecture

---

## Acceptance checks

### Internal mode

```text
CLOUDPILOT_AI_ENABLED=false
User: "What can you do?"
Expected: curated capabilities response; no OpenAI call.
```

### OpenAI mode

```text
CLOUDPILOT_AI_ENABLED=true
CLOUDPILOT_MESSAGE_RESPONSE=openai
User: "What can you do?"
Expected: natural response limited to curated supported capabilities.
```

### Safety

- No request row created
- No AWS mutation
- No history entry
- No RDS promise
- Existing general-chat behavior unchanged for unrelated messages

---

## Next

Review this plan, then say **go** to start Phase 1 (internal response only).
