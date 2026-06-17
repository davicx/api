# Future Development

**Last reviewed:** 2026-06-11

> Read [architecture.md](./architecture.md) first. Active work: [current_development.md](./current_development.md).

---

## Kite

- [ ] React Query cache for Navigator — `["navigator-data", groupID, conversationID]`
- [ ] Better column formatting (`currency`, `status` alignment)
- [ ] Opt-in developer `raw` mode (default off)
- [ ] Multi-open requests UI — table with **Run** per row; `run 1` disambiguation
- [ ] Learn / Test / Live mode indicator in UI (when product mode ships)

### Kite polish — details

Persist Navigator data with clear cache invalidation rules. File naming cleanup pass (separate chore). Avoid premature abstraction (schema engines, dynamic plugin registries).

---

## API

### Learn / Test / Live modes (product vision)

Most AWS tools are **Production** or **Read Only**. CloudPilot could offer:

```text
Learn  →  Test  →  Live
```

| Mode | Purpose | Example: “Create EC2 instance” |
|------|---------|--------------------------------|
| **Learn** | Explain only; no execution | What an instance is, cost estimate, what would happen |
| **Test** | Execute against mocks | “Created mock instance `i-test-123`” — nothing in AWS |
| **Live** | Execute against AWS | “Created instance `i-0abc123`” |

**Onboarding progression:**

```text
1. Connect ReadOnly AWS role
2. Run scans
3. Test mode — practice create / delete / toggle
4. Gain trust
5. Enable Live mode
```

**Today:** Test = Atlas `main.py` Test imports + `MOCK_*` data. **Future:** per-user/deployment mode in API; user-facing copy (“You are in TEST mode”); Learn handlers in orchestration (no Atlas call).

Navigator / cross-app items stay under **API** as parent. Kite renders mode indicator when wired.

### Execution persistence (Phase 2)

- `cloudpilot_executions` table — audit trail separate from request row
- `operation_id` + shared mutation metadata (Stage 0.5)
- `Executions.js` — CRUD; long-running runs survive Node restart
- Retries = new execution row on same request

### Multi-open requests (Phase 2 product)

- Relax one-open-per-conversation
- Named confirm only when ambiguous
- Optional `action_name` slug; resolution rules 1–6

### EC2 hardening (Stage 5+)

- Toggle by tags (`cloudpilot-role`) — no raw IDs in chat
- Delete safety — only `cloudpilot-managed=true`
- Destructive confirmation copy upgrades
- `automatic_safe` / rollback / monitoring modes
- Navigator adapters for create/delete/toggle results
- Waiters after create (running) / delete (terminated)

### Platform & more actions

- Rollback / undo — see [development_undo_feature.md](./development_undo_feature.md) (after automatic toggle E2E)
- Per-user / multi-account AWS credentials
- Bulk actions (“delete 5 instances” → 5 request rows)
- `resize_ec2`, security scan, cost report, RDS, IAM, Terraform

### Field collection polish

- Implicit bare ID confirm — “Did you mean `secondary_instance_id: …`?”

### CLEAN UP (code — after field hardening)

**Goal:** Remove dead code from pipeline rebuild. One PR per phase; curl smoke after each.

| Phase | Scope |
|-------|--------|
| **1** | Delete orphaned `state/conversationStateFunctions.js`, `focusedWorkflowFunctions.js`, `workflowConversationFunctions.js`; unused import in `messages.js` |
| **2** | Strip commented STEP 4–8 + appendix blocks in `cloudPilotMessageFunctions.js`; dead imports |
| **3** | Gut `functions/functions.js` duplicates; move remaining helpers |
| **4** | Mark `doc/code/allCode*.js` historical; retire legacy SQL doc pointer |

### Deprecated

- **`atlas_actions`** table — superseded by `cloudpilot_requests`
- **“Workflow”** in code identifiers — rename pass later (`workflowId` → `requestId`)

### Policy & schema

- Policy fields on routes (`allowed`, `reasonNotAllowed`)
- Full schema migration per `database.md`

---

## Atlas

- [ ] Toggle by tags/roles in core (MVP uses instance IDs)
- [ ] Delete safety tag gate in core
- [ ] `DEFAULT_AMIS` / AMI strategy hardening
- [ ] Waiters in create/delete responses (running / terminated)
- [ ] Product Test mode — API-driven route selection (not only `main.py` flip)

### Atlas Stage 0+ — details

Optional hardening: broader `ClientError` wrapping, tag-based toggle in `toggle_instances.py`, operation metadata echo for future `operation_id` audit.

**Learn mode:** No Atlas changes — explain-only lives in API orchestration.

**Live product mode:** Same Live routes; deployment/config selects endpoint base or Atlas profile.
