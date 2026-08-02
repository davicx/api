# CloudPilot Capabilities Response

**Status:** Phase 1 complete — stop before Phase 2  
**Scope:** Let users ask what CloudPilot can do, using the current action catalog as the source of truth  
**Work type:** One informational action + dynamic catalog response + optional OpenAI presentation
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

CloudPilot should explain **how it can help you today** using a useful, accurate description of its live action catalog.

The response must work in both modes:

- **Internal:** deterministic response generated from the live action catalog; no OpenAI request.
- **OpenAI:** same catalog facts, presented naturally through the existing general-message OpenAI switch.

---

## Source of truth

The response must be generated from the live `actionMap`.

```text
New action registered in actionMap
  ↓
show_capabilities response includes it automatically
```

Do not scan arbitrary project files to decide what CloudPilot can do. A file can be experimental, unused, or a lower-level provider helper. `actionMap` is the existing registry that says what CloudPilot can detect and run.

For this first version, show every action that is:

- `allowed: true`
- user-facing
- not `general_chat`
- not the `show_capabilities` action itself

Use the existing action data:

```text
actionLabel
executionModes (when present)
```

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
  ├── Internal → deterministic response generated from actionMap
  └── OpenAI → existing message-response setting, with actionMap facts supplied
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

### 2. Dynamic action catalog first

Do derive the response automatically from `actionMap` in this first pass.

The handler should:

1. Load eligible actions from `actionMap`.
2. Build a stable capabilities payload.
3. Format it into user-facing sections.

Do not use `actionTier` for user-facing sections. It is an internal orchestration property, not product presentation metadata.

Instead, each user-facing action may add optional capability metadata:

```text
capability: {
  section: 'Explore AWS',
  description: 'Scan EC2 instances for issues and recommendations.'
}
```

Examples:

```text
scan_ec2      → section: Explore AWS
create_ec2    → section: Manage EC2
show_ai_usage → section: CloudPilot
```

When metadata is absent:

```text
section     → Other
description → actionLabel
```

That fallback means a newly registered action remains visible automatically. Adding `capability.section` and `capability.description` makes its presentation better, but is not required for it to appear.

For actions with `executionModes`, show those modes below the action:

```text
Switch between primary and secondary instances
• Instructions
• AWS CLI
• Pull Request
• Automatic
```

This describes an existing action’s supported delivery choices; it does not claim every action supports every mode.

### 3. All current users first; per-user filtering later

Today, return every eligible action to every user.

Later, use the same catalog builder with user permissions to filter the actions before formatting:

```text
actionMap
  ↓
user permission filter (later)
  ↓
capabilities response
```

Do not build users, roles, or authorization rules in this project.

### 4. Future visibility flag (not built now)

Later, an action may add:

```text
capability: {
  visible: false
}
```

The catalog builder can then omit registered actions that are not ready for user discovery.

For this first pass, show every eligible action. Do not add an `experimental` or `visible` filter yet.

### 5. Preserve the existing AI toggle

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

### 6. OpenAI may improve wording, not facts

When OpenAI is enabled, pass the generated action catalog as grounded context and instruct it:

```text
Only describe the listed capabilities.
Do not claim support for services or actions not listed.
```

The internal dynamic response remains the fallback if OpenAI fails.

---

## Target files

```text
cloudPilot/
├── actionMap.js
└── chat/
    └── capabilities/
        ├── showCapabilitiesHandler.js
        └── capabilitiesFunctions.js       # loads catalog + builds response
```

The handler belongs with chat because its product is a response, not an AWS scan or mutation.

---

## Suggested execution phases

### Phase 1 — Internal capability response

- [x] Add `show_capabilities` to `actionMap`.
- [x] Add `showCapabilitiesHandler`.
- [x] Add exact match phrases.
- [x] Build the deterministic response from all eligible `actionMap` actions.
  - Read optional `capability.section` / `capability.description`.
  - Default missing metadata to `Other` / `actionLabel`.
  - Show `executionModes` beside the matching action.
- [x] Verify it follows immediate execution with no request row / AWS call / history record.
- [x] Commit and stop.

### Phase 2 — Optional OpenAI presentation

1. Reuse the existing `MESSAGE_RESPONSE` Internal / OpenAI switch.
2. Pass the generated action catalog as grounded context when OpenAI is enabled.
3. Keep the deterministic response as failure fallback.
4. Verify OpenAI cannot advertise unsupported work.
5. Commit and stop.

### Phase 3 — Docs

1. Add the capability question to README / product examples.
2. Update this plan with supported phrases and current limitations.
3. Commit and stop.

---

## Out of scope

- New AWS actions
- Generic AWS troubleshooting promises
- New OpenAI configuration switches
- Changes to request, execution, history, or Intelligence architecture
- User-specific capability filtering (later)
- Visibility / experimental filtering (later)

---

## Acceptance checks

### Internal mode

```text
CLOUDPILOT_AI_ENABLED=false
User: "What can you do?"
Expected: deterministic response generated from the eligible action catalog; no OpenAI call.
```

### OpenAI mode

```text
CLOUDPILOT_AI_ENABLED=true
CLOUDPILOT_MESSAGE_RESPONSE=openai
User: "What can you do?"
Expected: natural response limited to the generated action catalog.
```

### Safety

- No request row created
- No AWS mutation
- No history entry
- Newly registered allowed user-facing action appears without changing the handler
- All current users see the same eligible action catalog
- Action sections come from `capability.section`, never from `actionTier`
- Actions with execution modes show only their own supported modes
- Existing general-chat behavior unchanged for unrelated messages

---

## Next

Say **go** to start Phase 2 (optional OpenAI presentation).
