# Feature Chat — Friendly Request Presentation

## What this does

Keep CloudPilot’s **deterministic request speak** as the permanent Internal voice and fallback. When OpenAI is on, rephrase those same facts so field asks and other slightly robotic request messages feel conversational.

CloudPilot still decides what’s missing and which values to suggest. OpenAI only presents them.

## Current step

**Plan locked — awaiting Step 1.**

## Next

Say **do Step 1** to add speak facts + wire `speakRequest` presentation (missing-field asks first) with template fallback.

**Status:** Active (plan)  
**Codename:** `feature_chat`  
**Related:** [Current Development](./current_development.md) · [CloudPilot Context](../finished/feature_cloud_pilot_context.md) · [Chat Message UI](../finished/feature_chat_message_ui.md) · [Use OpenAI Chat](../how_to/use_openai_chat.md) · [AI Control Plane](../finished/cloud_pilot_ai_control_plane.md) · **Later:** [Off-topic chat guardrails](../future/feature_chat_guardrails.md)

---

## Goal (one sentence)

**Deterministic behavior underneath, conversational layer on top** — OpenAI never decides missing fields or invents their values; it makes CloudPilot’s known state pleasant to interact with.

---

## Feeling we want

**OpenAI OFF (keep exactly):**

```text
We also need the following information

region: "us-west-2"

Do you want to name this request?

request_name: "Kite EC2 scan"
```

**OpenAI ON (presentation only):**

```text
I can scan your EC2 instances for potential issues and opportunities to reduce costs.

It looks like **us-west-2** may be the region you want to scan. Is that right?

I can also give this request a name so it's easier to find later. Something like **“Kite EC2 scan”** would work well.
```

---

## Locked decisions

| Topic | Decision |
|-------|----------|
| Who decides facts | **CloudPilot** — missing fields, suggestions, optional request name |
| Who speaks when AI off | **Templates** — `requestTemplates.js` / `fieldPromptExamples.js` unchanged as Internal voice |
| Who speaks when AI on | **OpenAI presentation** — wording only |
| Soft-fill region | Suggestion / example only — **not** auto-collected |
| Fallback | OpenAI fail → template message; workflow continues |
| Config (v1) | Reuse `CLOUDPILOT_AI_ENABLED` + `CLOUDPILOT_MESSAGE_RESPONSE` |
| Separate flag later? | Optional `CLOUDPILOT_FRIENDLY_REQUESTS` if request tone must split from general chat |
| Route | **Not** general chat — request presentation path beside `speakRequest` |
| Understand / Decide | **Unchanged** — no new missing-field logic in the model |
| Scope pattern | Same pattern for **all** slightly robotic request messages — not scan/region-only |

---

## Architecture

```text
Decide
  ↓
build speak facts  (CloudPilot)
  ↓
build template message  (always — Internal + fallback)
  ↓
MESSAGE_RESPONSE=openai and master AI on?
  ├── no  → send template message
  └── yes → present(facts + template) → friendly message
              └── on failure → template message
```

### CloudPilot decides (facts)

```text
{
  action: "scan_ec2",
  action_summary: "scan EC2 for issues / cost opportunities",
  missing: ["region"],
  suggestions: {
    region: "us-west-2",
    request_name: "Kite EC2 scan"
  },
  optional_prompts: ["request_name"],
  collected: { ... },
  template_message: "<deterministic copy>"
}
```

### OpenAI speaks (voice)

Uses only the fact payload. Must not invent fields or values. Keep suggested values visible and confirmable.

---

## Where it lives today

| Piece | Role |
|-------|------|
| `CloudPilotMessage.speakRequest` | Always templates today — even when `MESSAGE_RESPONSE=openai` |
| `templates/requestTemplates.js` | Workflow UX copy |
| `templates/fieldPromptExamples.js` | `region: "…"` / request-name prompt lines |
| `RequestConversation.js` | Routes to `speakRequest` / `speakKnown` |
| General `chat()` | **Out of scope** for this feature’s request presentation |

Note: old `OPENAI_FRIENDLY_REQUESTS` was removed from the control plane; this feature rebuilds that idea under the current switches.

---

## V1 boundaries

**In:**

- Speak-facts object from request state + soft-fill / name examples
- Presentation wrapper on `speakRequest` with template fallback
- Phase 1: missing-field asks (`new_action`, `missing_fields_given`, in-progress field prompts) + optional request name
- Phase 2: other robotic request lines (mode ask tone, “Great, I now have the region”, confirmation polish) — same pattern

**Out (for now):**

- Changing Understand / Decide / request state machine
- Auto-collecting suggested region
- Letting OpenAI invent missing fields or values
- Rewriting Questions / `speakKnown` facts via this path
- Changing execution outcome copy or error messages in Phase 1
- Letting OpenAI rewrite the mode picker **options** (1–4 stay fixed; tone around them can come later)
- New presentation framework / engine

---

## Steps

### Step 1 — Speak facts + missing-field presentation

- [ ] Define speak-facts shape from `requestState` + field/name examples
- [ ] Always build existing template message first
- [ ] When AI on + `MESSAGE_RESPONSE=openai`: present missing-field / request-name asks
- [ ] On OpenAI failure: return template unchanged
- [ ] Prompt rules: only use payload fields/values; keep suggestions confirmable

### Step 2 — Broaden to other robotic request messages

- [ ] Awaiting execution mode (tone only; keep 1–4 options)
- [ ] Field acknowledgement lines (“Great, I now have the region”)
- [ ] Awaiting confirmation polish
- [ ] Same fallback and fact-ownership rules

### Step 3 — Acceptance smoke

- [ ] AI OFF → exact current field-prompt copy (including `region: "us-west-2"`)
- [ ] AI ON → friendly rephrase; still mentions suggested region + request name
- [ ] OpenAI error → Internal template; request continues
- [ ] Model cannot invent a different region or extra field
- [ ] Works for multiple actions (not scan-only)

---

## Acceptance (summary)

1. Deterministic templates remain the OFF path and the ON fallback.  
2. OpenAI is presentation-only.  
3. Soft-fill values stay suggestions until the user confirms / provides them.  
4. One pattern for request speak — no one-off region special case.

---

## Non-goals

- OpenAI deciding workflow state
- Replacing templates
- Merging request presentation into general chat
- Soft-fill auto-write into `collected`
