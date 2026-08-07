# Current Development — What We Are Working On

**Last updated:** 2026-08-07  

This is the active-work dashboard. It contains only features we are working on now.

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
| [CloudPilot Context](./feature_cloud_pilot_context.md) | Chat Identity vs tiny Search context; Situation for open requests; inventory ≠ General Chat. | Plan locked — **awaiting Step A (Identity)** |
| [EC2 Pause / Resume](./feature_pause_instance.md) | `pause_ec2` / `resume_ec2` for one instance (separate from toggle). | Phase 1–2 done — **awaiting approval to code** |
| [Organizational Knowledge](./feature_organizational_knowledge.md) | Why an S3 bucket exists (org facts + tags). | Step 1 — DB + tags SQL ready; apply when ready |
| [GitHub Pull Requests](./feature_github_pull_requests.md) | Creates a safe GitHub pull request instead of changing AWS directly. | Step 1 — Finish the real PR demo |

## Just finished

| Feature | What shipped |
|---------|----------------|
| [Chat Message UI](../finished/feature_chat_message_ui.md) | Markdown in Kite + ChatGPT-like bubbles (no gray card) |
| [Questions](../finished/feature_questions.md) | Question search path + open-requests speak + guardrail vs general OpenAI chat |
| [AI Spending](../finished/feature_ai_spending.md) | Kite usage card + `searchForAiSpend` Question (Internal \| OpenAI) + summary API |
| [Intelligence Front Door](../finished/feature_intelligence_front_door.md) | GenAI goes through `CloudPilotIntelligence.chat()`; `speakGeneral` is voice only |
| [OpenAI Logs](../finished/feature_openai_logs.md) | Pipeline STEPs first; then `OPENAI: Capability (Request N)`; Total + FOOTER |

## Useful References

- [How-to guides](../how_to/README.md) — including [Add an Intelligence Capability](../how_to/add_intelligence_capability.md)
- [Architecture](../architecture/)
- [Finished work](../finished/finished.md)
- [Future ideas](../future/future.md)
- [Environment example](../../sample_env.md)

## Safety

OpenAI is currently off for live calls. Turn it on only when testing a feature that explicitly says to do so.
