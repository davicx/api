# Project C — Actions + Execution Modes

**Status:** Complete — code moved, imports updated, smoke-required  
**Scope:** `application/atlas/cloudPilot/` only  
**Work type:** Mostly folder moves / file renames, import updates, smoke verify, commit  
**Last updated:** 2026-08-02

This project is still primarily an organizational cleanup, but the layout should now better match the existing Atlas / application coding style:

```text
Logic
  ↓
Functions
  ↓
Action / shared service
```

The goal is to make execution-mode files read top-to-bottom like workflows, while keeping code churn low because the current system already works.

---

## Locked goals

- Create `actions/` for reusable mutation operations.
- Create `executionModes/` for Automatic, CLI, Instructions, and PR.
- Keep `execution/` as the existing pipeline STEP 6 orchestration layer.
- Make each execution mode easy to read as a workflow.
- Prefer moving / renaming existing files over rewriting logic.
- No behavior changes.

---

## Mental model

```text
User
  ↓
Request
  ↓
Execution
  ↓
Load Action
  ↓
Run Selected Execution Mode
  ↓
Response
```

Current CloudPilot is still request-driven. This project does **not** add a new findings/remediations layer.

Use this simpler separation:

- **Scans** → discover information.
- **Actions** → own reusable mutation behavior.
- **Execution Modes** → decide how an action is applied.
- **Execution** → pipeline layer that runs the selected work.

More precise relationship:

```text
Execution
  ├── loads the Action
  └── sends it through the selected Execution Mode
```

This distinction matters:

- **Action** = what CloudPilot knows how to do
- **Execution Mode** = how CloudPilot applies or presents that action

Examples:

```text
toggleEC2 Action + Automatic Mode = actually toggle EC2
toggleEC2 Action + CLI Mode       = return CLI needed to toggle EC2
```

Project C should not blur those responsibilities.

---

## Coding-style rule for this project

Execution mode files should read like orchestration files in the main application codebase:

```text
1. Load Action
2. Prepare Execution
3. Perform Mode-Specific Work
4. Finalize (if needed)
5. Build Response
```

Almost every step should call another function.

That means:

- `*Logic.js` answers: **what are the steps?**
- `*Functions.js` answers: **how is a step performed?**
- action files answer: **how does this specific action behave?**

Do **not** turn helpers into a dumping ground. Add a `*Functions.js` file only when it improves readability or holds real reusable steps.

### Execution pipeline wording

Because `execution/` stays as STEP 6 orchestration, use this wording in the plan:

```text
Execution pipeline

1. Load the selected action.
2. Load the selected execution mode.
3. Pass the request and action into the execution mode.
4. Return the mode response.
```

For Project C, prefer this architecture direction, but keep the minimal-change rule:

- if current code already lets a mode load its own action, do not redesign that just for this move;
- only change what is required by folder/file moves and import updates.

---

## Target structure

```text
cloudPilot/
├── actions/
│   ├── createEC2/
│   │   └── createEC2Handler.js
│   ├── deleteEC2/
│   │   └── deleteEC2Handler.js
│   ├── toggleEC2/
│   │   └── toggleEC2Handler.js
│   └── updateEC2Tag/
│       └── updateEC2TagHandler.js
├── executionModes/
│   ├── automatic/
│   │   └── AutomaticLogic.js
│   ├── cli/
│   │   ├── CliLogic.js
│   │   └── cliTemplates.js
│   ├── instructions/
│   │   └── InstructionsLogic.js
│   └── pr/
│       ├── PrLogic.js
│       ├── prTemplates.js
│       └── createToggleEc2PullRequest.js
├── execution/
├── scans/
├── requests/
├── history/
├── chat/
└── actionMap.js
```

### Notes on this layout

- Keep existing action handler filenames.
- Keep existing helper/template files when they already exist and work.
- Rename the current strategy entry files into clearer mode-specific `*Logic.js` names.
- Do **not** force new `*Functions.js` files everywhere on day one if the logic file stays short enough without them.

---

## Mode responsibilities

### Automatic

```text
AutomaticLogic

1. Receive Action
2. Prepare Execution Context
3. Execute Action
4. Save History
5. Build Response
```

This is the mode that actually runs the change.

### CLI

```text
CliLogic

1. Receive Action
2. Prepare Inputs
3. Generate CLI Output
4. Build Response
```

No history because nothing changes in AWS.

### Instructions

```text
InstructionsLogic

1. Receive Action
2. Prepare Inputs
3. Generate Instructions
4. Build Response
```

No history because nothing changes in AWS.

### PR

```text
PrLogic

1. Receive Action
2. Prepare Inputs
3. Generate Infrastructure Changes
4. Create Pull Request
5. Build Response
```

This may keep using existing PR helper files; the point is to make the main entry file easy to follow.

---

## Exact move / rename plan

### Actions

| Current | Move to |
|---|---|
| `remediations/createEC2/` | `actions/createEC2/` |
| `remediations/deleteEC2/` | `actions/deleteEC2/` |
| `remediations/toggleEC2/` | `actions/toggleEC2/` |
| `remediations/updateEC2Tag/` | `actions/updateEC2Tag/` |

### Execution modes

| Current | Move / rename to |
|---|---|
| `remediations/strategies/automatic.js` | `executionModes/automatic/AutomaticLogic.js` |
| `remediations/strategies/cli.js` | `executionModes/cli/CliLogic.js` |
| `remediations/cli/cliTemplates.js` | `executionModes/cli/cliTemplates.js` |
| `remediations/strategies/instructions.js` | `executionModes/instructions/InstructionsLogic.js` |
| `remediations/strategies/pr.js` | `executionModes/pr/PrLogic.js` |
| `remediations/pr/prTemplates.js` | `executionModes/pr/prTemplates.js` |
| `remediations/pr/createToggleEc2PullRequest.js` | `executionModes/pr/createToggleEc2PullRequest.js` |

---

## What stays the same

- `execution/` keeps its current STEP 6 pipeline responsibility.
- `actionMap.js` remains the central action registry.
- `requests/`, `chat/`, `history/`, and `scans/` stay where they are.
- Existing action handler logic stays the same.
- Existing behavior for automatic / CLI / instructions / PR stays the same.

---

## Minimal-change rule

This project should avoid a large rewrite.

Preferred order:

1. Move folders.
2. Rename entry files where clarity improves a lot.
3. Update imports.
4. Smoke-test the existing flows.
5. Delete empty `remediations/`.
6. Commit.

Only add new helper files if a moved logic file becomes hard to read.

When moving a strategy file to a `*Logic.js` file:

- preserve its existing exports and calling contract unless an import update absolutely requires a change;
- do **not** rename internal functions merely for consistency;
- do **not** refactor working logic just because the file name changed.

---

## Verification

Minimum smoke checks after the move:

- `toggle_ec2` automatic still runs.
- `create_ec2` CLI response still builds.
- instructions mode still returns curated instruction payloads.
- `toggle_ec2` PR mode still builds / returns PR payload.
- no stale `remediations/` imports remain in runtime CloudPilot files.

---

## Out of scope

- No new `remediations/` folder.
- No findings model.
- No new abstractions beyond clearer mode/action organization.
- No `actionMap` redesign.
- No request-flow redesign.
- No chat / Intelligence redesign.
- No action method API redesign in this pass.

That last point matters:

Future work may let actions expose methods like `execute()`, `getCLI()`, `getInstructions()`, or `generatePullRequest()`, but Project C should **not** require that rewrite if moves + light renames are enough.

---

## Related

- Project A (complete): [cloud_pilot_refactor.md](./cloud_pilot_refactor.md)
- Atlas README: [../../../README.md](../../../README.md)
