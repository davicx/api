# To Do

**Last reviewed:** 2026-07-27

> **Active work:** [billing.md](./billing.md) · [scans.md](./scans.md) · **[remediations.md](./remediations.md)** · **[current.md](../current/current.md)** (AI — **next: when to run Region Search**)  
> **Architecture refactor (finished):** **[responsibility_refactor.md](../finished/responsibility_refactor.md)** · **Finished index:** [finished.md](../finished/finished.md)  
> **History (MVP done):** [history.md](../finished/history.md) · **Deferred:** [future_work.md](./future.md)  
> **Done:** [finished.md](../finished/finished.md) · **Architecture & reference:** [architecture/](../architecture/)

---

## Checklist (in order)

### Current

**History MVP is complete** — see [history.md](../finished/history.md) and [finished.md](../finished/finished.md). Deferred history items: [future_work.md](./future.md).

**Active product areas:** [billing.md](./billing.md) (B1 shipped; polish optional). **PR remediations (mode 3):** [remediations.md](./remediations.md) · [pr_strategy.md](../current/pr_strategy.md). **AI (live + planned):** [current.md](../current/current.md). **AI usage / OpenAI spend:** [ai_usage.md](../current/ai_usage.md). **CloudPilot org work (finished A/B/C):** [finished.md](../finished/finished.md).

#### Remediations — PR delivery (phased — [remediations.md](./remediations.md))

- [x] Phase 0 — `cloudpilot_infrastructure` repo scaffold
- [x] Phase 1 — `config/github/githubClient.js`
- [x] Phase 2 script — `test/scripts/createDemoPullRequest.js`
- [ ] Phase 2 run — real PR on GitHub (stop here until demo works)
- [ ] Phase 3 — `cloudpilot-apply.yml` + `POST /github/apply` + Atlas
- [ ] Phase 4 — wire `change/strategies/pr.js` (`create_ec2` only)
- [ ] Phase 5 — history after PR apply
- [ ] Phase 6 — undo revert PR

#### CloudPilot AI ([current.md](../current/current.md)) — **next**

Shared (shipped)
- [x] Context + conversation history foundation
- [x] Master + per-feature ENV (`cloudPilotAIConfig.js`)
- [x] Region OpenAI + situation context + region logs
- [x] Message response OpenAI path (see [chat_use_open_ai.md](../../instructions/chat_use_open_ai.md))
- [x] Demo chat list documented (Section B5)

**Next — `shouldRunRegionSearch()`, then reuse AI Invocation Rules** ([cloud_pilot_openai_rollout.md](../current/cloud_pilot_openai_rollout.md))
- [x] Do **not** run Region Search on every message
- [x] Add `shouldRunRegionSearch()` — true when request is actively collecting a region (Stage 1: open request + region missing)
- [x] Then choose implementation: Internal | OpenAI (keep switches; only change **when** it runs)
- [x] Skip when `shouldRunRegionSearch()` is false
- [x] Optional log when skipped (`REGION_LOGS`)
- [ ] Later (not this slice): same-turn “Scan EC2 in Oregon” without open request yet

After that
- [ ] Ambiguous region clarify (Section D) — after demo MVP

Feature 3 — broader intent — see current_development Section E
- [ ] Router + rules parser untouched; validate vs `actionMap`
- [ ] Fall back to rules on AI failure; STEP 3 engine logs
- [ ] Region FOUND / AMBIGUOUS / NOT PROVIDED — see [future_work.md](./future.md#ai-region-understanding--ambiguous-vs-not-provided)

Feature 1 — Explain findings
- [ ] Curated findings → prioritized friendly chat; Navigator unchanged
- [ ] Knowledge snippets per `rule_id` (quality)

Feature 2 — Friendly request conversations
- [ ] Natural **one-field-at-a-time** asks; hide checklist / field ids
- [ ] Suggest defaults from history; structured fallback forever

- [ ] Dashboard summary — deferred (see doc)

#### AI Usage — OpenAI spend ([ai_usage.md](../current/ai_usage.md))

- [x] Persist `usage` → `ai_usage` + `calculateOpenAICost` (after successful OpenAI calls)
- [x] `GET /ai/usage/summary`
- [x] Chat `show_ai_usage` (OpenAI only; AWS+AI combo deferred)
- [ ] Kite AI Usage card

### Future

#### Kite

- [ ] Send `conversationID` on every message
- [ ] Render `CloudPilotActionStatus` (status, missing, collected, request id, displayName)
- [ ] Render `navigatorResponse` (stats / tables from scan + inventory)
- [ ] Open actions dashboard table _(blocked on API P3C)_
- [ ] React Query cache for Navigator — `["navigator-data", groupID, conversationID]`
- [ ] Better column formatting (`currency`, `status` alignment)
- [ ] Opt-in developer `raw` mode (default off)
- [ ] Multi-open requests UI — table with **Run** per row; `run 1` disambiguation — see [future_work.md § Open requests dashboard](./future.md#open-requests-dashboard--run-when-ready)
- [ ] Learn / Test / Live mode indicator in UI (when product mode ships)

#### API — hardening & smoke

- [ ] **Field hardening P0** — EC2 ID, region, instance_type, malformed syntax + parser tests
- [ ] Test-mode smoke — create / toggle / delete / scan with Atlas Test imports
- [ ] `scan_ec2` `atlas_unreachable` parity (mutations already handle; scan may throw)
- [ ] Manual error smoke — Atlas stopped → friendly message, API stays up
- [ ] **P3C** — `open_actions` Navigator table in API response
- [ ] D2 — `cancelRequest` fully wired in `applyDecision` _(verify / finish)_
- [ ] Schema migration — `cloudpilot_actions` + `cloudpilot_requests` + `cloudpilot_executions`
- [ ] Restart mid-flow — verify DB source of truth after `display_name` fix
- [ ] `ActionState.js` memory mode — gate to tests only; remove Map when green
- [ ] `inventory_aws` request row — decide if informational inventory needs persisted row
- [ ] Implicit bare ID confirm — “Did you mean `secondary_instance_id: …`?”

#### API — capabilities & cleanup

- [ ] **Capability layer C1–C7** — [capability_migration.md](./capability_migration.md)
- [ ] **Step one cleanup U1–U3** — [architecture/step_one_cleanup.md](./step_one_cleanup.md)
- [ ] Code cleanup phases — dead comments, `functions.js` duplicates, historical `doc/code/` _(see Future details)_

#### API — product & platform

- [ ] **Saved Actions** — named reusable operations (structured request + `display_name`; `run Kite Security Scan` / fuzzy `kite security`; not “macros”)
- [ ] Learn / Test / Live modes (product vision)
- [ ] Execution persistence — `cloudpilot_executions` table
- [ ] Multi-open requests (relax one-open-per-conversation)
- [ ] Toggle by tags (`cloudpilot-role`) — no raw IDs in chat
- [ ] Delete safety — only `cloudpilot-managed=true`
- [ ] Destructive confirmation copy upgrades
- [ ] `automatic_safe` / rollback / monitoring modes
- [ ] Navigator adapters for create/delete/toggle results
- [ ] Waiters after create (running) / delete (terminated)
- [ ] Per-user / multi-account AWS credentials
- [ ] Bulk actions (“delete 5 instances” → 5 request rows)
- [ ] More actions — `resize_ec2`, security scan, cost report, RDS, IAM, Terraform
- [ ] Policy fields on routes (`allowed`, `reasonNotAllowed`)
- [ ] Wire live OpenAI in `CloudPilotMessage.speakGeneral()`
- [ ] `context.js` / `prompts.js` per conversation side

#### Scan expansion

Planning docs (bill investigation — **no code**):

- [scans.md](./scans.md) — active scan MVP (EC2 → S3 → RDS → IAM → SG → Lambda)

- [ ] `ec2_low_cpu` — only evaluate when `state == running`
- [ ] Register all EC2 rules in `rule_registry.py` (aliases per rule)
- [ ] EC2 recommendation copy pass — all demo rules
- [ ] `MOCK_SCAN_EC2_DATA` — one clean sample finding per rule for Test mode
- [ ] Navigator findings table — optional **Rule** column
- [ ] Security Groups scanner + 3 rules + `POST /scan/security-groups` + `scan_security_groups` action
- [ ] EBS scanner (later)
- [ ] RDS scanner (later)
- [ ] `scan_aws` orchestration (way later)

#### Atlas

- [ ] Test-mode smoke — confirm `(TEST MOCK)` logs on create / toggle / delete / scan
- [ ] Optional — capture live `MOCK_CREATE_DATA`
- [ ] Optional — add `Atlas Response:` log on live `POST /ec2/create`
- [ ] Toggle by tags/roles in core (MVP uses instance IDs)
- [ ] Delete safety tag gate in core
- [ ] `DEFAULT_AMIS` / AMI strategy hardening
- [ ] Waiters in create/delete responses (running / terminated)
- [ ] Product Test mode — API-driven route selection (not only `main.py` flip)

---

## Full description

### Current

See **[future_work.md](./future.md)** for deferred History items (H8, H11, targeted undo, tag polish). Platform and Kite backlog remains below.

---

### Future

#### Kite integration

Connect Kite to `POST /message`. Required: `conversationID` on every message. Render `CloudPilotActionStatus`, `navigatorResponse`, and (when P3C ships) open actions table. Polish: React Query cache, column formatting, multi-open UI, mode indicator. History dashboard: shipped — see [finished.md](../finished/finished.md).

#### API — field hardening P0

**Priority:** Before new actions (`resize_ec2`, etc.). Reject invalid EC2 IDs, regions, instance types, and malformed `field: "value"` syntax before confirm/Atlas. Parser unit tests for unclosed-quote regression.

**Touch points:** `understanding/search/`, decision/requests merge, optional `fieldValidators.js`.

#### API — capabilities & code cleanup

Standardize HOW layer under `capabilities/` (C1–C7). Pre-cleanup U1–U3 removes dead pipeline code. See [capability_migration.md](./capability_migration.md) and [step_one_cleanup.md](./step_one_cleanup.md).

#### API — Learn / Test / Live

Product modes: **Learn** (explain only), **Test** (mocks), **Live** (AWS). Today Test = Atlas `main.py` import toggle. Future: per-deployment mode, user-facing copy, Learn handlers without Atlas.

#### API — Saved Actions (future)

**Do not implement yet.** First-class **named actions** (not “macros” — people associate macros with recorded UI/scripts). Solves real usability: stop re-entering the same fields for frequent operations.

**Flow:**

```text
scan kite s3 for security issues
  → action: scan_s3, parameters: { bucket, scan_type, region, … }
Save as "Kite Security Scan"
  …
run Kite Security Scan
  or even: kite security
```

Same for changes:

```text
toggle kite backup off
  → action: update_ec2_tag, instance, tag, value
CloudPilot still confirms:
  "This will update Enabled on Kite Backup from true to false. Continue?"
```

**Store the structured request, not chat text:**

```json
{
  "action": "scan_s3",
  "parameters": {
    "bucket": "kite",
    "scan_type": "security"
  },
  "display_name": "Kite Security Scan"
}
```

If NLU improves later, saved actions still work — they are not tied to the original utterance.

**Product surface:**

```text
Saved Actions
  • Kite Security Scan
  • Daily Cost Scan
  • Toggle Backup
  • Deploy Dev
  • Resize Web Server
```

Chat: `Run Daily Cost Scan` / `Run Toggle Backup`.

**Pairs with History / Undo (three complementary concepts):**

| Concept | Role |
|---------|------|
| **Scan** | Discover resources |
| **Saved Actions** | Reusable operations (things users do often) |
| **History** | Completed operations (things already done) |
| **Undo** | Reverse a completed change |

```text
Saved Actions → Run "Toggle Backup" → History → Undo
```

**Depends on:** durable named action store (may start as `request_name` / `display_name` on requests, later first-class table), resolve by name / fuzzy match, confirm before destructive runs.

**Related:** multi-open requests, P3C Run button, soft-fill from last scan, [future_work.md](./future.md).

#### API — execution & requests

`cloudpilot_executions` audit table; multi-open requests; `operation_id`; long-running runs survive restart.

#### Scan expansion

**Principle:** See [scans.md](./scans.md) for service order and MVP rules. Quality bar: plain-English title, severity, category, concrete recommendation. S3 demo tier shipped — [finished.md](../finished/finished.md).

#### Atlas (future)

Tag-based toggle, delete safety gates, AMI hardening, waiters, API-driven Test mode.

#### Deprecated / rename (when ready)

- `atlas_actions` table — superseded by `cloudpilot_requests`
- `workflowId` → `requestId` rename pass in code identifiers
