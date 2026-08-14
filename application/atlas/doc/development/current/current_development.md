# Current Development — What We Are Working On

**Last updated:** 2026-08-14  

This is the active-work dashboard. It contains only features we are working on now.

## End-of-day handoff — 2026-08-14

[Feature Chat](../finished/feature_chat.md) shipped
(friendly request presentation; templates stay Internal + fallback).
[Friendly Dashboard](../finished/feature_friendly_dashboard.md) shipped
(S3 findings-first UI; Fix→Chat coming soon). Step 6 (real S3 remediations) moved to
[future](../future/feature_s3_remediation_modes.md). MVP boundary remains in
[CloudPilot MVP](./feature_mvp.md). Finished work lives in
[finished/](../finished/finished.md).

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
| [Important Fixes](./feature_important_fixes.md) | Clear Turn / A–B vocabulary; request vs speak vs chat vs present vs write; nest `pricing/` later; `questions/` TBD. | Plan locked — **awaiting Step 1** |
| [CloudPilot Safety](./feature_cloud_pilot_safety.md) | Spending guardrails before OpenAI calls; OpenAI is the first service. | Plan locked — **awaiting Step 1** |

## Just finished

| Feature | What shipped |
|---------|----------------|
| [Feature Chat](../finished/feature_chat.md) | Friendly request presentation when OpenAI is on; templates stay Internal + fallback |
| [Friendly Dashboard](../finished/feature_friendly_dashboard.md) | S3 findings-first Dashboard; Fix→Chat coming soon; original tables behind View original tables |
| [S3 inventory ask](../finished/feature_s3_inventory_ask.md) | Natural “what S3 buckets do I have?” → Question `s3_inventory` → `scan_s3` |
| [Organizational Knowledge](../finished/feature_organizational_knowledge.md) | S3 org facts + tags; search extract → DB resolve → Chat Knowledge / Internal speak |

## Useful References

- [How-to guides](../how_to/how_to_guides.md) — including [CloudPilot Context](../how_to/cloud_pilot_context.md) and [inventory question → scan](../how_to/route_inventory_question_to_scan.md)
- [Architecture](../architecture/)
- [Finished work](../finished/finished.md)
- [Future ideas](../future/future.md) — including [GitHub Pull Requests](../future/feature_github_pull_requests.md) and [S3 remediation modes](../future/feature_s3_remediation_modes.md)
- [Environment example](../../sample_env.md)

## Safety

Master AI switch: **`CLOUDPILOT_AI_ENABLED`** in `api/.env` (false = all GenAI off).
Restart the API after changing it. Turn it on only when testing a feature that
explicitly says to do so.
