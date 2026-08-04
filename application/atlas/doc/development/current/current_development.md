# Current Development — What We Are Working On

**Last updated:** 2026-08-04  

This is the active-work dashboard. It contains only features we are working on now.

## How to use these docs

- Each active feature is named `feature_<name>.md`.
- Start at **What this does**, then check **Current step**.
- Say “do Step 1” or “do Step 1A” when you want to continue.
- Completed work moves to `../finished/`.
- Reusable developer recipes live in `../how_to/`.
- Architecture decisions live in `../architecture/`.

## Active Features

| Feature | What it does | Current step |
|---------|--------------|--------------|
| [Intelligence Front Door](./feature_intelligence_front_door.md) | One place for all GenAI: Conversation `chat()`, then Understand. | Step 1 — Design locked |
| [Organizational Knowledge](./feature_organizational_knowledge.md) | Explains why an S3 bucket exists in the organization. | Step 1 — Database + demo rows |
| [Questions](./feature_questions.md) | CloudPilot answers things it already knows, starting with open requests. | Step 1 — Open Requests |
| [OpenAI Logs](./feature_openai_logs.md) | Shows each OpenAI request, response, and cost in the API logs. | Step 2 — Verify all current AI paths |
| [AI Spending](./feature_ai_spending.md) | Shows what CloudPilot spends on OpenAI. | Step 1 — Build the Kite spending card |
| [GitHub Pull Requests](./feature_github_pull_requests.md) | Creates a safe GitHub pull request instead of changing AWS directly. | Step 1 — Finish the real PR demo |
| [Chat Formatting](./feature_chat_formatting.md) | Makes chat replies easier to read with bold text and bullets. | Step 1 — Render formatted chat text in Kite |

## Useful References

- [How-to guides](../how_to/README.md)
- [Architecture](../architecture/)
- [Finished work](../finished/finished.md)
- [Future ideas](../future/future.md)
- [Environment example](../../sample_env.md)

## Safety

OpenAI is currently off for live calls. Turn it on only when testing a feature that explicitly says to do so.
