# Current Development — What We Are Working On

**Last updated:** 2026-08-29  

This is the active-work dashboard. It contains only features we are working on now.

## End-of-day handoff — 2026-08-29

[Useful Price](../finished/feature_useful_price.md) shipped
(create/scan cost speak, pause ~24h savings, `ec2_compute_cost` Question).
Earlier: [Feature Chat](../finished/feature_chat.md), [Friendly Dashboard](../finished/feature_friendly_dashboard.md).
MVP boundary remains in [CloudPilot MVP](../feature_mvp.md)
([archived EC2 operate MVP](../future/feature_mvp_ec2_operating_boundary.md)).
Finished work lives in [finished/](../finished/finished.md).

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
| [Feature Conversation](./feature_conversation.md) | Better conversation now (Phase 1); tools / broader AWS / memory / remediations later (Phases 2–6). | Plan locked — **Phase 1 awaiting start** |
| [CloudPilot MVP](../feature_mvp.md) | Canonical: Find → Understand → Explain → Act → Verify (EC2 + S3); Terraform resize PR preview only. | Active — track **works / passed** |
| [Spending Hard Limit](./feature_spending_hard_limit.md) | Monthly **hard cap** on AWS (Cost Explorer) + OpenAI; block paid actions at limit. | Plan locked — **Phase 1 = Safety (OpenAI) awaiting Step 1** |
| [CloudPilot Safety](./feature_cloud_pilot_safety.md) | Phase 1 detail: OpenAI gate only (`cloud_pilot_safety` + `checkSpendingLimit`). | Plan locked — **awaiting Step 1** |

## Just finished

| Feature | What shipped |
|---------|----------------|
| [Useful Price](../finished/feature_useful_price.md) | Hourly rates → create/scan/pause estimates + “what am I paying?” Question |
| [Important Fixes](../finished/feature_important_fixes.md) | Turn + Message / Response / Message Reply vocabulary; speak/present/friendly renames — [follow-ups](../future/feature_message_reply_followups.md) |
| [Intelligence Provider](../finished/feature_intelligence_provider.md) | Search TASK family: one context object → Internal \| OpenAI → same result; [how-to](../how_to/intelligence_provider.md) |
| [Feature Chat](../finished/feature_chat.md) | Friendly request presentation when OpenAI is on; templates stay Internal + fallback |
| [Friendly Dashboard](../finished/feature_friendly_dashboard.md) | S3 findings-first Dashboard; Fix→Chat coming soon; original tables behind View original tables |
| [S3 inventory ask](../finished/feature_s3_inventory_ask.md) | Natural “what S3 buckets do I have?” → Question `s3_inventory` → `scan_s3` |
| [Organizational Knowledge](../finished/feature_organizational_knowledge.md) | S3 org facts + tags; search extract → DB resolve → Chat Knowledge / Internal speak |

## Useful References

- [How-to guides](../how_to/how_to_guides.md) — including [CloudPilot Context](../how_to/cloud_pilot_context.md), [Intelligence Provider](../how_to/intelligence_provider.md), and [inventory question → scan](../how_to/route_inventory_question_to_scan.md)
- [Architecture](../architecture/)
- [Finished work](../finished/finished.md)
- [Future ideas](../future/future.md) — including [GitHub Pull Requests](../future/feature_github_pull_requests.md) and [S3 remediation modes](../future/feature_s3_remediation_modes.md)
- [Environment example](../../sample_env.md)

## Safety

Master AI switch: **`CLOUDPILOT_AI_ENABLED`** in `api/.env` (false = all GenAI off).
Restart the API after changing it. Turn it on only when testing a feature that
explicitly says to do so.
