# Current Development — What We Are Working On

**Last updated:** 2026-08-11  

This is the active-work dashboard. It contains only features we are working on now.

## End-of-day handoff — 2026-08-11

MVP product boundary locked in [CloudPilot MVP](./feature_mvp.md)
(Create / Delete / Pause-Resume / History UI / PR concept). Friendly Create is
at Step 0 complete → next Step 1.

## How to use these docs

- Each active feature is named `feature_<name>.md`.
- Start at **What this does**, then check **Current step**.
- Say “do Step 1” or “do Step A” when you want to continue.
- Completed work moves to `../finished/`.
- Reusable developer recipes live in `../how_to/`.
- Architecture decisions live in `../architecture/`.

## Active Features

| Feature | What it does | Current step |
|---------|--------------|--------------|
| [CloudPilot MVP](./feature_mvp.md) | EC2 operating boundary: create, delete, pause/resume, history UI, PR concept. | Plan locked — track **works / passed** |
| [Feature Chat](./feature_chat.md) | Friendly request presentation when OpenAI is on; deterministic templates stay Internal + fallback. | Plan locked — **awaiting Step 1** |
| [Friendly Create EC2](./feature_friendly_create_instance.md) | Guide / review / confirm / success for `create_ec2` (`create_ec2_context`) — not Atlas changes. | Step 0 done — speak-point map; **next: Step 1** |
| [Organizational Knowledge](./feature_organizational_knowledge.md) | Why an S3 bucket exists (org facts + tags). | Step 1 — DB + tags SQL ready; apply when ready |
| [CloudPilot Safety](./feature_cloud_pilot_safety.md) | Spending guardrails before OpenAI calls; OpenAI is the first service. | Plan locked — **awaiting Step 1** |
| [GitHub Pull Requests](./feature_github_pull_requests.md) | Creates a safe GitHub pull request instead of changing AWS directly. | Steps 0–6 mostly shipped; **Step 7 manual E2E** still open |

## Just finished

| Feature | What shipped |
|---------|----------------|
| [CloudPilot Context](../finished/feature_cloud_pilot_context.md) | Chat Identity vs tiny Search TASK; CURRENT STATE; `ec2_inventory` → `scan_ec2` |
| [Verify Request Target](../finished/feature_verify_request.md) | Atlas Test infra + `verifyResource` gate + not-found → `scan_ec2` offer |
| [CloudPilot Images](../finished/feature_images.md) | `cloud_pilot_images` catalog + loader join + bucket URL + drop legacy `image` |
| [EC2 Pause / Resume](../finished/feature_pause_instance.md) | `pause_ec2` / `resume_ec2` (Atlas Test acceptance; live AWS optional) |
| [Chat Message UI](../finished/feature_chat_message_ui.md) | Markdown in Kite + ChatGPT-like bubbles (no gray card) |
| [Questions](../finished/feature_questions.md) | Question search path + open-requests speak + guardrail vs general OpenAI chat |
| [AI Spending](../finished/feature_ai_spending.md) | Kite usage card + `searchForAiSpend` Question (Internal \| OpenAI) + summary API |
| [Intelligence Front Door](../finished/feature_intelligence_front_door.md) | GenAI goes through `CloudPilotIntelligence.chat()`; `speakGeneral` is voice only |
| [OpenAI Logs](../finished/feature_openai_logs.md) | Pipeline STEPs first; then `OPENAI: Capability (Request N)`; Total + FOOTER |

## Useful References

- [How-to guides](../how_to/how_to_guides.md) — including [CloudPilot Context](../how_to/cloud_pilot_context.md)
- [Architecture](../architecture/)
- [Finished work](../finished/finished.md)
- [Future ideas](../future/future.md)
- [Environment example](../../sample_env.md)

## Safety

OpenAI is currently off for live calls. Turn it on only when testing a feature that explicitly says to do so.
