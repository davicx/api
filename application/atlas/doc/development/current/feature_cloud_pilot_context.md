# CloudPilot Context

## What this does

Fix how CloudPilot uses OpenAI context so responses feel like an engineer beside you — and so **Search** calls stop getting a full CloudPilot personality dump.

Two separate problems (do not mix them):

1. **General Chat** has the wrong Identity / instructions → report-style answers (Why / Risks / Impact).
2. **Search OpenAI** gets far too much context → should be tiny classifiers/extractors.

Third issue underneath:

> “How many EC2 instances are running?” must not be General Chat inventing an answer from open-request chatter. CloudPilot must retrieve AWS state (Question / scan path).

## Current step

**Plan locked — awaiting approval to code.**  
Next: **Step A — Rewrite General Chat Identity** (remove mandatory why/risks/impact).

## Next

Say **do Step A** when ready to change Identity / chat context only.

**Status:** Active  
**Codename:** `cloudPilotContext`  
**Related:** [Current Development](./current_development.md) · [Use OpenAI Chat](../how_to/use_openai_chat.md) · [Questions](../finished/feature_questions.md) · [Intelligence Front Door](../finished/feature_intelligence_front_door.md) · Prior work lived as “Be Cool Man” (Internal scan detection shipped; live wording still wrong)

---

## One-sentence rule

> **Search gets only the information required to classify/extract. Chat gets the information required to converse. CloudPilot—not OpenAI—provides user-specific truth.**

---

## Steps (immediate — keep small)

### Step A — Rewrite General Chat Identity

- [ ] Remove universal “explain why / risks / impact” as mandatory communication principles
- [ ] Install conversational engineer voice (concise, direct, no report sections by default)
- [ ] Accurate CloudPilot product blurb (what it actually does + execution modes)
- [ ] Keep grounding: never invent AWS / requests / costs / findings
- [ ] Move why/risks/impact to a future ACTION EXPLANATION / REMEDIATION RESPONSE context only
- [ ] Smoke with OpenAI off (system message text) then brief live: `hello`, `what is cloud pilot?`, `what is a region`

### Step B — Tiny Region Search context

- [ ] Region OpenAI prompt = TASK + examples + current message + JSON only
- [ ] Semantic rule: user is **providing** a region for the open request — not merely mentioning one
- [ ] No Identity, no product philosophy, no Knowledge, no conversation history (default)
- [ ] Logs should read: Task / Current Message / Examples — Identity Not Used
- [ ] Accept: “US West 2” / “USA Weste 2” → `us-west-2`; “What is US West 2?” → `{}`

### Step C — Tiny Open Requests Search context

- [ ] Same pattern as Region Search (TASK + examples + message + JSON)
- [ ] No Identity / history / AWS knowledge
- [ ] Classify only — CloudPilot still loads and speaks real open requests

### Step D — Situation for General Chat (small)

- [ ] When one open request exists, inject a tiny CURRENT STATE block into Chat context
- [ ] Use only when relevant to the current question
- [ ] Example: Scan EC2 waiting for region → “what is a region” can mention continuing with `us-west-2`
- [ ] Soften open-requests speak: drop Request ID unless user asks for details (optional polish)

### Step E — EC2 inventory Question (separate from wording)

- [ ] “how many EC2… / what’s running…” must not stay in General Chat
- [ ] Prefer Question `ec2_inventory` (or reuse / extend Action → `scan_ec2`) so Atlas retrieves truth
- [ ] OpenAI may classify need; CloudPilot obtains data; Chat may polish the grounded answer later

Do **not** build a giant universal context system in this feature.

---

# 1. Diagnosis — why current responses feel bad

Live demo symptoms:

| User | Bad behavior |
|------|----------------|
| `hello` | Stiff: “How can I assist you today with your cloud infrastructure needs?” |
| `what is cloud pilot?` | Generic essay + Why / Risks / Impact sections |
| `what is a region` | Same report template; Situation unused |
| `do I have any open requests` | Deterministic answer OK but leaks Request ID 43 |
| `how many ec2 instances…` | General Chat reasons from open request instead of checking AWS |

Root causes:

1. Identity still pushes report-style communication principles → model obeys literally.
2. Search uses the same rich CloudPilot context stack as Chat.
3. Inventory questions still fall through to `general_chat` when they need CloudPilot facts.

Prior “Be Cool Man” Step 1 marked concise rules as done in docs, but **live OpenAI wording still shows the report behavior** — Identity / system message must be fixed for real.

---

# 2. What good responses should sound like

CloudPilot = **knowledgeable engineer beside you**, not documentation / consultant / support bot.

### `hello`

```text
Hey! What can I help you with?
```

Not: “Hello! How can I assist you today with your cloud infrastructure needs?”

### `what is cloud pilot?`

```text
CloudPilot helps you understand and manage your AWS infrastructure through conversation.

You can ask what’s running, scan for issues or unnecessary costs, and make changes through
instructions, CLI commands, pull requests, or safe automation.
```

### `what is a region` (with open Scan EC2 waiting on region)

```text
An AWS region is the geographic area where your resources run, such as us-west-2 (Oregon)
or us-east-1 (N. Virginia).

Your EC2 scan is currently waiting for a region, so you could reply with something like us-west-2.
```

Concept + Situation. No Why / Risks / Impact sections.

### `do I have any open requests`

```text
You have 1 open request:

Scan EC2 — waiting for a region.

You can reply with something like us-west-2 to continue.
```

Do **not** show Request ID unless the user asks for details.

### `how many ec2 instances do I have running right now`

Ideal:

```text
You have 3 running EC2 instances in us-west-2.
```

Or if region is required:

```text
Which region should I check? For example, us-west-2.
```

**Not** “You currently have 1 open request…” — that answers a different question.

---

# 3. General Chat Identity (target)

Delete from **universal** Identity:

```text
Communication principles:
- explain what is happening
- explain why it matters
- explain possible risks
- explain possible impact
```

Those belong later under **ACTION EXPLANATION** / **REMEDIATION RESPONSE** only — not every chat turn.

Target Identity (draft for implementation):

```text
You are CloudPilot, an AI assistant for understanding and managing AWS infrastructure.

VOICE

Be conversational, clear, and concise.

Answer the user's question directly.
Prefer a short useful answer over a long explanation.
Do not automatically structure answers into sections.
Do not automatically explain risks, impact, or why something matters.
Explain those things when they are relevant or the user asks.

Speak like a knowledgeable engineer helping another person,
not like documentation, a consultant, or a customer support bot.

CLOUDPILOT

CloudPilot can understand AWS infrastructure, answer questions about it,
scan resources, identify issues, and help users safely make changes.

CloudPilot may carry out work through:
- instructions
- CLI commands
- pull requests
- automatic execution

GROUNDING

Never invent the user's AWS resources, costs, requests, findings, or state.

CloudPilot owns user-specific facts.
Use user-specific facts only when they are provided in the current context.

You may use general AWS knowledge to explain concepts.

CONVERSATION

Use conversation history when it helps understand what the user means.

If CloudPilot provides relevant current state, incorporate it naturally.

Do not repeat old information merely because it appears in conversation history.
Always answer the user's current question first.
```

This should massively improve `hello`, `what is a region`, `what is CloudPilot`, and normal follow-ups.

---

# 4. Search vs Chat — different jobs, different context

```text
                    CLOUDPILOT INTELLIGENCE

                         User Message
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼

           SEARCH          CLOUDPILOT        CHAT
         / UNDERSTAND        FACTS

       What does the       What is true?     How should
       user mean?                          I explain it?

       tiny context         database         rich context
       tiny output          AWS / Atlas      conversation
       classification       requests         natural answer
       extraction           knowledge
```

| Path | OpenAI role | Context size |
|------|-------------|--------------|
| **Search** | Language / classify / extract | TASK + examples + current message |
| **CloudPilot** | (not OpenAI) owns truth | DB, Atlas, open requests |
| **Chat** | Communicate | Identity + product + Situation + question + history when useful |

Optional builders later (do not force everything through one stack):

```text
buildSearchContext()   // tiny
buildChatContext()     // rich
```

---

# 5. Region Search — tiny context

Region Search is **not speaking to the user**. It is:

```text
searchForRegion(message) → { region } | {}
```

### Semantic question (locked)

> Is the user **supplying** this region **for the current open request**?

Not merely “clearly identifies a region” — that false-positives:

```text
What is US West 2?     → must return {}
```

### Examples (acceptance)

| Message | Result |
|---------|--------|
| `I want to use US West 2` | FOUND `us-west-2` |
| `I want to use USA West 2` | FOUND `us-west-2` |
| `I want to use USA Weste 2` | FOUND `us-west-2` |
| `What is US West 2` | NONE `{}` |
| `Why do you want a region like US West 2` | NONE `{}` |
| `I dont want to use US West 2` | NONE `{}` |

### Target OpenAI prompt shape

```text
TASK

Determine whether the user is PROVIDING an AWS region
to be used for the current request.

Return the normalized AWS region if provided.

Do not return a region when the user is:
- asking about a region
- mentioning a region as an example
- rejecting a region
- discussing regions generally

Interpret obvious natural-language names and minor spelling mistakes.

EXAMPLES

"I want to use US West 2"
{"region":"us-west-2"}

"use USA West 2"
{"region":"us-west-2"}

"I want to use USA Weste 2"
{"region":"us-west-2"}

"What is US West 2?"
{}

"Why do you want a region like US West 2?"
{}

"I don't want to use US West 2"
{}

CURRENT MESSAGE

"<user message>"

Return JSON only.
```

### What Region Search does **not** need

- Full CloudPilot Identity / tone / goals
- Org knowledge
- Remediation safety essays
- Conversation history (default)
- “OpenAI may already know regions” as a reason to send a region encyclopedia — examples + TASK are enough

### Desired logs

```text
OPENAI: Region Search

Context Loaded
Identity: Not Used
✓ Task
✓ Current Message
✓ Examples
History: Not Used
Knowledge: Not Used
```

### History later (out of scope now)

```text
use the same one
```

needs history — that is a separate `contextualReferenceSearch()` feature later. Do not make every extractor history-aware yet.

---

# 6. Open Requests Search — same tiny treatment

Classify only. Do not answer. Do not invent requests.

```text
TASK

Determine whether the user is asking to see CloudPilot requests
that are currently open, pending, or waiting.

EXAMPLES

"do I have any open requests" → {"open_requests":true}
"what am I waiting on" → {"open_requests":true}
"scan ec2" → {}
"what is a request?" → {}

CURRENT MESSAGE
...
Return JSON only.
```

No Identity. No AWS knowledge. No conversation history.

---

# 7. General Chat — rich context (inverted from Search)

### Search

```text
TASK
EXAMPLES
CURRENT MESSAGE
OUTPUT FORMAT
```

### General Chat

```text
IDENTITY          ← Step A rewrite
PRODUCT KNOWLEDGE
CURRENT STATE     ← Step D tiny Situation when open request exists
CURRENT QUESTION
CONVERSATION HISTORY (when useful)
```

### Situation MVP (Step D)

If there is one open request, Chat may receive ~15 tokens of truth:

```text
CURRENT CLOUDPILOT STATE

Open request:
Scan EC2
Waiting for: region

Use this information only when relevant to the user's current question.
```

Then `what is a region` can connect concept → next step without dumping all CloudPilot state.

Do **not** dump everything CloudPilot knows. Selective is enough for MVP.

---

# 8. “How many EC2…” — understanding, not prompt polish

Wrong today:

```text
how many ec2 instances do I have running right now
  → Action = general_chat
  → OpenAI talks about the open request
```

Desired pattern:

```text
User asks inventory question
  → Question / Action detects need for EC2 data (ec2_inventory or scan_ec2)
  → CloudPilot collects region if needed
  → Atlas retrieves truth
  → CloudPilot responds with real counts
  → OpenAI may optionally polish grounded wording later
```

OpenAI detects **what information is needed**.  
CloudPilot **obtains** the information.  
OpenAI may help **explain** grounded results.

Prior Be Cool Man work broadened Internal Action matching toward `scan_ec2` — keep that direction; if live still routes to General Chat, Step E fixes the understanding path explicitly (Question `ec2_inventory` and/or stronger Action Search).

---

# 9. Scope control

### Do now (Steps A–E)

- Identity rewrite for Chat
- Tiny Search prompts (Region, Open Requests)
- Tiny Situation for Chat when open request exists
- Inventory question routing so AWS truth isn’t faked in Chat

### Do not do now

- Giant universal context framework
- History-aware value extractors for “the same one”
- Full ACTION EXPLANATION context pack (only remove bad universal principles)
- Redesigning the whole Intelligence pipeline

---

# 10. Acceptance (after Steps A–D; E separate)

| # | Input | Expect |
|---|--------|--------|
| 1 | `hello` | Short greeting — not enterprise opener |
| 2 | `what is cloud pilot?` | Product-accurate, concise — no Why/Risks/Impact sections |
| 3 | `what is a region` + open scan waiting on region | Short definition + tie to open request |
| 4 | Region provide `I want to use USA Weste 2` | Search → `us-west-2` |
| 5 | Region ask `What is US West 2?` | Search → `{}` |
| 6 | Region reject `I dont want to use US West 2` | Search → `{}` |
| 7 | `do I have any open requests` | Natural list; no Request ID by default |
| 8 | `how many ec2…` | Not General Chat inventing from open request — Question/scan path (Step E) |

---

# 11. Prior work (Be Cool Man) — keep / don’t lose

Already useful and should remain:

- [x] Internal broadening for natural EC2 data questions → `scan_ec2` (where shipped)
- [x] OpenAI Action Search allowlist against `actionMap`
- [x] Preserve known region when same open scan intent returns
- [x] Boundary: general knowledge vs CloudPilot-owned facts (conceptually)

Still failing live (this doc’s job):

- [ ] Chat Identity / voice in real OpenAI answers
- [ ] Search context size and semantics (provide vs mention)
- [ ] Situation used in Chat for open request
- [ ] Inventory questions never answered as pure General Chat

---

# Long-term direction (not this feature’s coding scope)

Grow toward:

```text
OpenAI understands language / plans need for info
  → CloudPilot decides capabilities + owns facts
  → OpenAI explains grounded results
```

Not endless one-off `searchForX` phrase files — but **Search stays tiny classifiers**; Chat stays rich communicator; CloudPilot stays source of truth.

Near-term transition remains: better Identity + tiny Search + Situation + inventory Question/Action — prove the boundary without a mega-refactor.
