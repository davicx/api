# Current Development — What We Are Working On

**Last updated:** 2026-08-12  

This is the active-work dashboard. It contains only features we are working on now.

## End-of-day handoff — 2026-08-12

MVP product boundary in [CloudPilot MVP](./feature_mvp.md).
[GitHub Pull Requests](../future/feature_github_pull_requests.md) deferred to future
(Steps 0–6 shipped; Step 7 E2E later). Finished work lives in
[finished/](../finished/finished.md) — not listed here.

## How to use these docs

- Each active feature is named `feature_<name>.md`.
- Start at **What this does**, then check **Current step**.
- Say “do Step 1” or “do Step A” when you want to continue.
- Completed work moves to `../finished/`.
- Deferred / later work moves to `../future/`.
- Reusable developer recipes live in `../how_to/`.
- Architecture decisions live in `../architecture/`.

## Active Features

| Feature | What it does | Current step |
|---------|--------------|--------------|
| [CloudPilot MVP](./feature_mvp.md) | EC2 operating boundary: create, delete, pause/resume, history UI, PR concept. | Plan locked — track **works / passed** |
| [Useful Price](./feature_useful_price.md) | Stored EC2 hourly rates → daily/monthly **estimates** in speak + scan **Cost** column (`t3.nano` / `t3.micro` us-west-2). | Steps 1–3 done — **next: Step 4 optional or Step 5 acceptance** |
| [Feature Chat](./feature_chat.md) | Friendly request presentation when OpenAI is on; deterministic templates stay Internal + fallback. | Plan locked — **awaiting Step 1** |
| [Organizational Knowledge](./feature_organizational_knowledge.md) | Why an S3 bucket exists (org facts + tags). | Step 1 — DB + tags SQL ready; apply when ready |
| [CloudPilot Safety](./feature_cloud_pilot_safety.md) | Spending guardrails before OpenAI calls; OpenAI is the first service. | Plan locked — **awaiting Step 1** |

## Useful References

- [How-to guides](../how_to/how_to_guides.md) — including [CloudPilot Context](../how_to/cloud_pilot_context.md)
- [Architecture](../architecture/)
- [Finished work](../finished/finished.md)
- [Future ideas](../future/future.md) — including [GitHub Pull Requests](../future/feature_github_pull_requests.md)
- [Environment example](../../sample_env.md)

## Safety

Master AI switch: **`CLOUDPILOT_AI_ENABLED`** in `api/.env` (false = all GenAI off).
Restart the API after changing it. Turn it on only when testing a feature that
explicitly says to do so.
