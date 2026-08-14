# Feature Chat Guardrails — Off-Topic Conversation

## What this does

Allow occasional non-technical conversation so CloudPilot feels natural, but prevent a conversation from drifting indefinitely away from CloudPilot’s purpose.

Casual answers are fine. Becoming a worse general ChatGPT is not.

## Status

**Future / backlog — do nothing for MVP demos.**

Current off-topic answers (e.g. LOTR) are harmless and even useful as a smoke that general chat works. Prioritize scan behavior, AI usage, and [Feature Chat](../finished/feature_chat.md) (friendlier request-field responses) before this.

**Codename:** `feature_chat_guardrails`  
**Related:** [Feature Chat](../finished/feature_chat.md) · [CloudPilot Context](../finished/feature_cloud_pilot_context.md) · [Future work](./future.md) · [Current Development](../current/current_development.md)

---

## Goal (one sentence)

Allow a little off-topic chat, then gently recenter on technology / cloud / engineering work using a **consecutive conversation streak** — not a lifetime counter.

---

## Proposed behavior

### 1st off-topic — answer normally + gentle redirect

User: *Which LOTR movie is your favorite?*

```text
I’d probably go with The Return of the King — hard to beat that ending.

I’m mainly here to help with technology, AWS, and your engineering work,
but I’m happy to entertain the occasional LOTR question.
```

Nicer than refusing.

### 2nd–3rd off-topic — still answer, shorter

User: *Who's your favorite character?*

```text
Sam is hard to beat.

But I should probably earn my keep eventually — what are we building or fixing?
```

### ~4th consecutive off-topic — stop answering the unrelated question

User: *What about Harry Potter?*

```text
I’m going to pull us back to work. I’m here primarily to help with your
technology, AWS, and engineering tasks. What can I help you with?
```

Use a **deterministic redirect** here — don’t keep spending tokens on the off-topic thread.

---

## Important: consecutive, not lifetime

```text
AWS question        → offTopicCount = 0
LOTR                → 1
LOTR                → 2
AWS question        → 0
Star Wars           → 1
```

A months-long conversation must not get blocked because the user asked four unrelated questions over time. Reset on any in-domain turn.

---

## Implementation sketch (later)

```text
User Message
    ↓
General Chat
    ↓
Is this related to CloudPilot's domain?
    ↓
YES → normal response + reset offTopicCount
NO  → increment offTopicCount
    ↓
1–3 → OpenAI can answer + remind user of CloudPilot's purpose
4+  → deterministic redirect (no off-topic answer)
```

Keep it small. Prefer a streak on the conversation (request/session state or recent message classification), not a new product platform.

---

## In-domain should be broad

Do **not** restrict to AWS only. Allow at least:

```text
AWS
software engineering
programming
databases
SQL
GitHub
DevOps
cloud
architecture
debugging
security
infrastructure
engineering questions
CloudPilot itself
workplace / technical questions
```

The filter only needs to catch things that are **clearly unrelated** (movies, sports, pure trivia, etc.).

---

## Locked when we pick this up

| Topic | Decision |
|-------|----------|
| Scope | General chat only — not request field collection / Questions |
| Counter | **Consecutive streak** per conversation; reset on in-domain |
| Soft limit | Answer + purpose reminder (~1–3) |
| Hard limit | Deterministic redirect (~4+); stop answering off-topic |
| Domain | Broad tech / engineering — not AWS-only |
| MVP | **Out** — backlog only |

---

## Non-goals (for this feature)

- Refusing the first casual question
- Lifetime / account-wide off-topic quotas
- Turning CloudPilot into a content-moderation system
- Blocking request workflows or Questions

---

## Priority reminder

Suggested order before this:

1. Scan behavior  
2. AI usage (live path)  
3. Friendlier OpenAI request-field responses — [feature_chat](../finished/feature_chat.md) (done)  
4. **This** off-topic guardrail
