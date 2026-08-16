# Feature Chat — Friendly Request Presentation

## What this does

Keep CloudPilot’s **deterministic request speak** as the permanent Internal voice and fallback. When OpenAI is on, rephrase those same facts so field asks and other slightly robotic request messages feel conversational.

CloudPilot still decides what’s missing and which values to suggest. OpenAI only presents them.

## Current step

**Finished** — 2026-08-14. Steps 1–3 done.

## Next

_(none — archived)_ Naming / folder cleanup: [Important Fixes](./feature_important_fixes.md). Message Reply leftovers: [feature_message_reply_followups](../future/feature_message_reply_followups.md). Off-topic chat later: [feature_chat_guardrails](../future/feature_chat_guardrails.md).

**Status:** Finished  
**Codename:** `feature_chat`  
**Related:** [Current Development](../current/current_development.md) · [CloudPilot Context](./feature_cloud_pilot_context.md) · [Chat Message UI](./feature_chat_message_ui.md) · [Use OpenAI Chat](../how_to/use_openai_chat.md) · [AI Control Plane](./cloud_pilot_ai_control_plane.md) · **Later:** [Off-topic chat guardrails](../future/feature_chat_guardrails.md) · [Important Fixes](./feature_important_fixes.md) · [Message Reply Follow-ups](../future/feature_message_reply_followups.md)

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
| `CloudPilotMessage.speakRequest` | Templates first; optional OpenAI presentation of speak facts |
| `presentation/buildRequestSpeakFacts.js` | CloudPilot speak-facts payload |
| `conversation/presentRequestMessage.js` | Intelligence present() — Internal skip / OpenAI wording |
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
- Phase 2: other robotic request lines (mode ask tone, “Great, I now have the region”, confirmation polish) — same pattern. Mode options 1–4 stay CloudPilot-owned.

**Out (for now):**

- Changing Understand / Decide / request state machine
- Auto-collecting suggested region
- Letting OpenAI invent missing fields or values
- Rewriting Questions / `speakKnown` facts via this path
- Changing execution outcome copy or error messages in Phase 1
- Letting OpenAI rewrite the mode picker **options** (1–4 stay fixed; intro tone is presentation-only)
- New presentation framework / engine

---

## Steps

### Step 1 — Speak facts + missing-field presentation

- [x] Define speak-facts shape from `requestState` + field/name examples
- [x] Always build existing template message first
- [x] When AI on + `MESSAGE_RESPONSE=openai`: present missing-field / request-name asks
- [x] On OpenAI failure: return template unchanged
- [x] Prompt rules: only use payload fields/values; keep suggestions confirmable

### Step 2 — Broaden to other robotic request messages

- [x] Awaiting execution mode (tone only; keep 1–4 options)
- [x] Field acknowledgement lines (“Great, I now have the region”)
- [x] Awaiting confirmation polish
- [x] Same fallback and fact-ownership rules

### Step 3 — Acceptance smoke

- [x] AI OFF → exact current field-prompt copy (including `region: "us-west-2"`)
- [x] AI ON → friendly rephrase; still mentions suggested region + request name
- [x] OpenAI error → Internal template; request continues
- [x] Model cannot invent a different region or extra field
- [x] Works for multiple actions (not scan-only)

**How Step 3 was proven (2026-08-14):** offline, no live OpenAI.

- Master AI off + `MESSAGE_RESPONSE=openai`: `speakRequest` for `scan_ec2` / `scan_s3` / `create_ec2` returns the Internal template unchanged (`region: "us-west-2"`, action-specific request name). Soft-fill is suggestion-only (not written to `collected`).
- Present is a no-op (`success: false`, source `internal`); the request still succeeds with the template.
- Simulated friendly copy that keeps `us-west-2` + `Kite EC2 scan` passes the fact guard. `us-east-1` only, or a dropped request name, is rejected (template would be sent). Speak-facts suggestions are only CloudPilot fields.
- Same path covers mode-ask (1–4 locked) and confirmation (collected region required).

Live OpenAI wording quality was not billed. Turn `CLOUDPILOT_AI_ENABLED=true` with `CLOUDPILOT_MESSAGE_RESPONSE=openai` when you want to hear the friendly copy.

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
