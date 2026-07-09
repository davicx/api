# CloudPilot Chat — context, knowledge & enhanced replies

**Last reviewed:** 2026-07-06

> **Related:** [make_scans_useful.md](./make_scans_useful.md) · [remediations.md](./remediations.md) · [To_do.md](./To_do.md) · [architecture/architecture.md](./architecture/architecture.md)

**Status:** C1 shipped — General Conversation context builds and logs (STEP 7a). `OPENAI_ENHANCED_REPLIES=false` keeps stub reply; `true` calls OpenAI with `buildSystemPrompt()`.

**Folder:** `services/context/` — `cloudPilotContext.js`, `currentQuestionContext.js`, `organizationKnowledgeContext.js`, `buildGeneralConversationContext.js`, `buildSystemPrompt.js`

---

## Core idea (locked)

Do **not** think of this as “OpenAI context.” Think of it as **CloudPilot Context**.

```text
User
    ↓
CloudPilot
    ↓
Build Context
    ↓
OpenAI (optional)
    ↓
Response
```

Context belongs to **CloudPilot**. Today it may be sent to OpenAI. Tomorrow it could go to another model, or a local model. The pipeline stays the same.

**Defining strength:** Most AI cloud tools dump raw AWS data into an LLM or let the LLM reason from live resources. CloudPilot is different:

1. **Atlas** discovers facts.
2. **CloudPilot** interprets and curates those facts (Knowledge).
3. **OpenAI** (optional) turns trusted information into clear, natural language.

CloudPilot owns cloud knowledge. OpenAI owns communication — not discovery.

---

## Architecture

```text
Atlas
    ↓
Raw AWS facts (rule_id, resource ids, states)

CloudPilot Knowledge
    ↓
Rule meanings, tradeoffs, confidence, action labels

Context Builder
    ↓
general_context + relevant_context + org_knowledge + current_facts

OpenAI (optional)
    ↓
Natural explanation

CloudPilot UI
    ↓
Chat reply (+ dashboard detail when applicable)
```

**Never send raw AWS output to OpenAI.** Send curated facts CloudPilot already trusts.

Example chain:

```text
Atlas     →  { "rule_id": "public_access_block_disabled" }
Knowledge →  meaning, risk, tradeoff (static per rule_id)
Context   →  assembled prompt sections
OpenAI    →  “Your bucket could accidentally become public…”
```

Aligns with [make_scans_useful.md](./make_scans_useful.md) Layer 1 → Layer 2 → Layer 3.

---

## One builder, one shape

**File (planned):** `services/knowledge/buildCloudPilotContext.js`

Returns:

```js
{
    general_context: "...",
    relevant_context: "...",
    org_knowledge: "",
    current_facts: { ... },   // structured facts, not prose
    ai_enabled: true
}
```

Builder assembles a system prompt (or message bundle) from non-empty sections. Empty strings are fine.

---

## Toggle (one flag for MVP)

```env
OPENAI_ENHANCED_REPLIES=true
```

| Flag | Behavior |
|------|----------|
| `false` (or unset) | CloudPilot templates / deterministic copy → reply |
| `true` | CloudPilot Context → OpenAI → reply |

If OpenAI fails or `OPENAI_API_KEY` missing: **fall back to templates**. Product never depends on AI being on.

Optional later: split `OPENAI_ENHANCED_CHAT` vs `OPENAI_ENHANCED_PRESENTATION`. Start with one master flag.

---

# CHAT

Chat is the primary experience. Dashboard supports it; chat leads.

## General context

Rarely changes. **CloudPilot personality** — not AWS knowledge.

```text
You are CloudPilot.

CloudPilot helps users understand and safely manage cloud infrastructure.

Always explain:
• what is happening
• why it matters
• possible risks
• possible impact

Prefer clear language over technical jargon.

Never invent AWS findings.

CloudPilot owns cloud knowledge.
You help explain it naturally.
```

**Source (planned):** `services/knowledge/generalContext.js` or env-loaded string for demo tuning.

## Relevant context

Changes every request. This is where replies feel aware.

**Example — S3 policy work:**

```text
Current Task

Action: Update S3 Bucket Policy
Bucket: photos-production
Pending Confirmation: Yes

Current Findings
• Public Access Block disabled
• Bucket encryption enabled
• Versioning disabled
```

**Example — EC2 scan:**

```text
Current Task

EC2 Scan

Found:
• 2 stopped instances
• 1 instance with no Name tag
• 1 instance using t2.micro
```

**Example — PR remediation:**

```text
Current Task

Action: create_ec2
Delivery: Pull Request
PR #42 awaiting merge
```

**Built from (planned):** `requestState`, `decision`, scan summary, remediation status — whatever the pipeline already knows at speak time.

## Org knowledge

Can be empty for months.

```js
org_knowledge: ""
```

**Eventually:**

```text
Company standards

Production buckets must have:
• Versioning
• Encryption
• Block Public Access

PCI workloads require KMS encryption.
```

or

```text
Terraform repository: infra/aws/s3.tf
CloudPilot should recommend infrastructure PRs before console changes.
```

**Source (later):** org config table, env, or repo-linked file. Not MVP.

## Current facts (structured)

Not explanation — **facts only**. OpenAI must not discover anything; it explains what CloudPilot already knows.

```json
{
  "bucket": "kite-production",
  "findings": [
    "public_access_block_disabled",
    "versioning_disabled"
  ],
  "recommendation_count": 2
}
```

Knowledge layer expands each `rule_id` into meaning / risk / tradeoff **before** or **inside** context assembly — not inside the LLM’s imagination.

## Plug-in points (chat)

| Location | Role today | Enhanced mode |
|----------|------------|---------------|
| `CloudPilotMessage.speakGeneral` | OpenAI stub | `buildCloudPilotContext` → `sendGeneralChat` |
| `openAIFunctions.sendGeneralChatDuringWorkflow` | Inline workflow prompt | Use `relevant_context` from builder |
| `CloudPilotMessage.speakRequest` | Templates only | Optional AI wrap for explainers; keep confirmations deterministic |
| Post-scan / post-action | Template + `navigatorResponse` | Short AI summary in `cloudPilotMessage` |

**Rule:** Templates stay for structure (field prompts, confirmations, errors, “PR opened”). AI enhances explanation — not control flow.

## Chat implementation phases

### Phase C1 — Context builder + toggle

- [x] `services/context/cloudPilotContext.js` — `getCloudPilotContext()`
- [x] `services/context/currentQuestionContext.js` — `buildCurrentQuestionContext()`
- [x] `services/context/organizationKnowledgeContext.js` — `getOrganizationKnowledgeContext()`
- [x] `services/context/buildGeneralConversationContext.js`
- [x] `services/context/buildSystemPrompt.js`
- [x] `OPENAI_ENHANCED_REPLIES` env flag (read in `speakGeneral`, not builder)
- [x] STEP 7a log + STEP 7b speak
- [x] `sendGeneralChat` accepts optional system prompt

### Phase C2 — General chat live

- [ ] Wire `speakGeneral` → context builder → OpenAI when enabled
- [ ] Fallback to current stub/templates when disabled or API error

### Phase C3 — Workflow-aware replies

- [ ] Build `relevant_context` from active request (action, collected, missing, display name)
- [ ] Unify with `sendGeneralChatDuringWorkflow` (avoid duplicate prompt logic)

### Phase C4 — Post-scan / post-action summaries (chat only)

- [ ] After `scan_s3` / `scan_ec2`: pass `current_facts` + top rule knowledge into context
- [ ] Chat returns 4–6 line human summary; full data unchanged in `navigatorResponse`

### Phase C5 — Knowledge files

- [ ] `services/knowledge/s3Rules.js` (or JSON) keyed by `rule_id` — meaning, risk, tradeoff, confidence
- [ ] Same pattern for EC2 rules when needed

### Phase C6 — Org knowledge

- [ ] Load `org_knowledge` from config when available
- [ ] Empty string default

---

# DASHBOARD

**Separate thinking track** — do not block CHAT phases on dashboard work. Document intent here; implement after chat context pattern is proven.

## Problem

Scan dashboards (especially S3) can feel overwhelming — many rows, repeated findings, console-like density. Users need guidance, not more data.

## Direction (not final spec)

**Do not replace the dashboard with OpenAI.** Keep the table factual. Make chat the human layer.

```text
────────────────────────

CloudPilot Summary          ← chat (OpenAI optional)

Your bucket has 6 recommendations.

The most important issue is that Block Public Access is partially disabled,
which could allow accidental public exposure.

Versioning is also turned off, meaning deleted objects may not be recoverable.

The remaining recommendations are lower priority improvements.

────────────────────────

Detailed Findings           ← dashboard (unchanged data model)

(Table — full navigatorResponse)
```

## Principles (dashboard)

1. **Dashboard = detail** — accurate, sortable, complete when user wants depth.
2. **Chat = summary** — what matters, in order, with tradeoffs.
3. **Same facts both places** — summary built from `current_facts` + Knowledge, not a second scan.
4. **Aggregation before display** — “4 buckets — encryption disabled” beats 4 identical rows (see [make_scans_useful.md](./make_scans_useful.md)).
5. **AI rewrites presentation only** — never invents findings for the table.

## Dashboard ideas to think through (later)

- [ ] Optional collapsed “summary” block above Navigator table in Kite (fed from same chat summary text)
- [ ] Group findings by severity / rule_id in UI
- [ ] Account-wide scan: aggregated themes first, drill-down second
- [ ] Terminology: Findings → Recommendations (chat + table headers)
- [ ] Confidence + scope per row (“applies to 4 of 4 buckets”)
- [ ] Whether summary is chat-only vs duplicated in dashboard header

**Explicitly deferred:** Navigator/React changes until CHAT context + post-scan summary path works in API.

---

## How this connects to existing code

| Topic | Location |
|-------|----------|
| OpenAI SDK | `services/engines/llm/openai/openAIFunctions.js` |
| General speak (stub) | `services/conversation/CloudPilotMessage.js` → `speakGeneral` |
| Workflow chat | `sendGeneralChatDuringWorkflow` |
| Scan philosophy | `doc/development/make_scans_useful.md` |
| Navigator tables | `services/actions/s3/scanS3/atlasS3ScanNavigatorAdapter.js` |
| Model config | `services/config/chatGPTconfig.js` |

---

## Open decisions

1. **One flag vs split** — start with `OPENAI_ENHANCED_REPLIES` only?
2. **speakRequest** — AI on all request messages or only “explainer” chat types?
3. **Knowledge format** — JS module vs JSON per rule_id?
4. **current_facts schema** — versioned object for scan vs request vs PR?
5. **Dashboard summary** — chat-only for MVP demo?

**Decided:**

- Name: **CloudPilot Context**, not OpenAI context
- Folder: **`services/knowledge/`**
- Atlas facts → Knowledge → Context → OpenAI (optional)
- Never invent findings in the LLM
- Templates remain when AI off or fails
- Dashboard changes tracked separately in this doc

---

## Changelog

| Date | Change |
|------|--------|
| 2026-07-06 | Initial plan — CHAT + DASHBOARD sections; context builder architecture |
