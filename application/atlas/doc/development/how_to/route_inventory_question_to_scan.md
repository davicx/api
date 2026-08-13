# How to: Route an inventory-style question → scan Action

**Status:** Development guide  
**Use when:** Users ask “what X do I have?” / “how many X?” / “show my X” and the
answer must come from **Atlas** (or another CloudPilot-owned inventory), not
General Chat.

**Reference implementation (shipped):** EC2 — `ec2_inventory` → `scan_ec2`  
**Next consumer (plan):** S3 — [feature_s3_inventory_ask](../current/feature_s3_inventory_ask.md) → `scan_s3`

**Related:** [CloudPilot Context](./cloud_pilot_context.md) · [Add Intelligence Capability](./add_intelligence_capability.md) · [Questions](../finished/feature_questions.md) · [Add a New Action](./add_new_action.md)

---

## One-sentence rule

> **Inventory-style language is a Question. Fulfillment reuses the scan Action. Chat never invents the list.**

```text
"how many EC2 instances do I have?"  →  Question ec2_inventory  →  scan_ec2
"what S3 buckets do I have?"         →  Question s3_inventory   →  scan_s3
"scan ec2" / "scan s3"               →  Action only (explicit)
"what is EC2?" / "what is S3?"       →  General Chat (definition)
```

---

## Why this pattern exists

Without it, natural questions fall through to General Chat and OpenAI **guesses**
AWS state. CloudPilot Context Step E fixed that for EC2. **Every new service
that supports “what do I have?” should copy this — not invent a one-off.**

| Layer | Job | Must never |
|-------|-----|------------|
| **Question Search** | Detect “they want current account data for service X” | Invent resources / counts |
| **decideNextStep** | Map `*_inventory` → existing `scan_*` request | Send inventory Questions to `GENERAL_CHAT` |
| **scan_* Action** | Collect fields, confirm, call Atlas, speak + Navigator | Care whether intent was Question or Action |
| **General Chat** | Definitions, advice, chit-chat | Answer “what do I have in AWS?” from imagination |

---

## Standard shape

```text
1) Action match (explicit + natural)
      matchesScanXIntent(message)
      - "scan" + service → true
      - inventory-style ask about owned resources → true
      - "what is <service>?" → false

2) Question classifier (natural only)
      searchForXInventory(message)
      - shouldRun gate (service signal, not definition, not explicit scan)
      - Internal classify → { question: 'x_inventory' } or {}
      - Explicit "scan" → {}  (Action owns it)

3) Question orchestrator
      searchMessageForQuestion → return 'x_inventory' when hit

4) Decision
      resolveQuestionDecision:
        if question === 'x_inventory':
          buildNewRequestDecision({ action: 'scan_x', values })

5) Fulfillment
      Existing scan_x handler / Atlas route — unchanged
```

Intelligence only **classifies**. CloudPilot **owns** the scan and the facts.

---

## EC2 map (copy from here)

| Piece | Location |
|-------|----------|
| Intent | `cloudPilot/actionMap.js` → `matchesScanEC2Intent` + `scan_ec2.match` |
| Question | `understand/search/questions/searchForEc2Inventory.js` |
| Orchestrator | `searchMessageForQuestion.js` (family includes `ec2_inventory`) |
| Decision | `requests/decideNextStep.js` → `resolveQuestionDecision` (`ec2_inventory` → `scan_ec2`) |
| Atlas | `POST /scan/ec2` (live or `ec2_scan_routes_test`) |

Semantic split (keep forever):

| User says | Path |
|-----------|------|
| `scan my EC2` | Action `scan_ec2` |
| `how many EC2 are running?` | Question `ec2_inventory` → same `scan_ec2` |

---

## Checklist for a new service (e.g. S3, later RDS)

Use this every time — do not skip the Question layer even if Action match alone
“mostly works.” Questions keep OpenAI chat from owning AWS truth.

### A. Product

- [ ] Phrase list: show / list / how many / what|which / do I have / my|our …
- [ ] Explicit command still works (`scan <service>`)
- [ ] Definition phrases stay General Chat (`what is …`)
- [ ] Org-knowledge / purpose asks stay on their own path if they exist

### B. Code (mirror EC2)

- [ ] `matchesScanXIntent` + wire `scan_x.match`
- [ ] `searchForXInventory.js` (shouldRun + Internal; skip explicit scan)
- [ ] Register in `searchMessageForQuestion.js`
- [ ] `resolveQuestionDecision`: `x_inventory` → `scan_x`
- [ ] Confirm Atlas route exists (and **test mock** if local Atlas is the norm)

### C. Local Atlas

- [ ] Prefer **scan** test router with sample resources (S3 already has this)
- [ ] Do **not** block the feature on empty `inventory_aws` mock unless product
      explicitly wants the inventory Action instead

### D. Verify

- [ ] Natural ask → new request `scan_x` (logs / request row)
- [ ] Explicit `scan x` → same Action, no Question needed
- [ ] Definition → General Chat
- [ ] Completing the scan returns real (or mock) resources — not invented Chat text

---

## Decision: scan vs inventory Action

| Prefer **scan_*** when… | Prefer **inventory_*** when… |
|-------------------------|------------------------------|
| You already have `scan_x` + Navigator + findings | You only need a thin cross-service list |
| Local test mock exists for `/scan/x` | Inventory mock is populated and product is “list everything” |
| UX is “check this service and show issues” | UX is account-wide catalog with no findings |

Default for “what \<service\> do I have?” in CloudPilot today: **Question → scan_***.

---

## Anti-patterns

```text
❌ Broaden only Action match and skip Question
   → MESSAGE_RESPONSE=openai can still invent if Action misses

❌ New handler that duplicates Atlas scan “just for questions”
   → two sources of truth

❌ Fulfill via General Chat + “please call a tool” prose
   → Chat does not own AWS lists

❌ Treat org-knowledge “what is this bucket for?” as inventory
   → purpose DB ≠ account listing
```

---

## Env / logs

No new master switch required for Internal Question classify (EC2 inventory MVP
is Internal-only). Use existing scan + message logs:

```env
CLOUDPILOT_MESSAGE_LOGS=true
# plus any scan / understand logs you already use
```

Watch: Question hit → decision action `scan_*` → Atlas test log `(TEST MOCK)`.

---

## Doc updates when you ship one

- [ ] Feature plan acceptance → `finished/`
- [ ] [chat_prompts.md](../../chat_prompts.md) — add natural phrases
- [ ] This how-to — add a one-line row under “Shipped consumers” below

### Shipped consumers

| Service | Question | Action | Feature doc |
|---------|----------|--------|-------------|
| EC2 | `ec2_inventory` | `scan_ec2` | [feature_cloud_pilot_context](../finished/feature_cloud_pilot_context.md) (Step E) |
| S3 | `s3_inventory` | `scan_s3` | [feature_s3_inventory_ask](../current/feature_s3_inventory_ask.md) *(planned)* |
