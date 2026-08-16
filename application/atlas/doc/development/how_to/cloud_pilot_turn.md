# CloudPilot Turn — User Message to Reply Message

**Status:** Development guide  
**Use when:** Reading or changing CloudPilot messaging code and you need to know which stage you are in.

**Related:** [Important Fixes](../current/feature_important_fixes.md) · [CloudPilot Context](./cloud_pilot_context.md) · [Intelligence front door](../finished/feature_intelligence_front_door.md)

---

## One-sentence rule

> **One Turn is one User Message in, one Reply Message out.**

```text
USER MESSAGE
    ↓
UNDERSTAND MESSAGE
    ↓
HANDLE REQUEST
    ↓
PREPARE MESSAGE REPLY
    ↓
REPLY MESSAGE
```

`processMessage()` in `cloudPilot/chat/cloudPilotMessageFunctions.js` is the **whole Turn**, not one of those stages.

---

## Vocabulary

| Term | Meaning |
|------|---------|
| **User Message** | One incoming message from the user. |
| **Understand Message** | Figure out what the user means. |
| **Handle Request** | Do the CloudPilot work. Skip if there is no request. |
| **Prepare Message Reply** | Create the one message to send back. |
| **Reply Message** | Send / store / return that final message. |
| **Context** | Shared utility: `get…Context()` for one Intelligence / OpenAI call. **Not a stage.** |
| **Request** | A job the user wants done (`create_ec2`, `scan_ec2`). |
| **Conversation** | History of User Message ↔ Reply Message turns. **Not a stage.** |
| **Turn** | The whole flow. |

Keep these two words sacred:

```text
User Message  = one thing the user sent CloudPilot
Reply Message = one thing CloudPilot sends the user
```

---

## Context is not a stage

Anytime a stage needs Intelligence:

```js
const context = getFullMessageContext(...)
const context = getSearchRegionContext(...)
const context = getFriendlyReplyContext(...)
```

Prefer **`get` over `build`**. If a function assembles information for OpenAI, it belongs conceptually under `context`.

Folders do not have to match stages. `context/`, `search/`, `requests/` can live underneath the Turn.

---

## Diagnostic

```text
Figuring out what the user means?
  → Understand Message

Doing CloudPilot work (scan, create, lookup)?
  → Handle Request

Assembling information for OpenAI / Intelligence?
  → Context (get … Context)

Creating the one message to send back?
  → Prepare Message Reply

Sending / storing / returning it?
  → Reply Message
```

---

## Current code map

`speak*` and `processMessage` are still older Prepare / Turn names (optional later rename).

| Today | Stage / role |
|-------|--------|
| `processMessage()` | **Turn** |
| `understandMessage`, region/action/question search | Understand Message |
| `decideNextStep`, collect fields, execute | Handle Request |
| `speakRequest` / `speakGeneral` / `speakKnown` | Prepare Message Reply front doors |
| `getRequestReplyFacts()` | Known facts for Request Reply |
| `getFriendlyReplyContext()` | Context for friendly rewrite |
| `generateFriendlyReply()` / `generateGeneralReply()` | Intelligence reply generators |
| `shouldTryFriendlyReply()` / `replyContainsRequiredFacts()` | Friendly-reply gate + fact guard |

---

## Do not

- Rename functions or move folders from this guide
- Treat Context or Conversation as Turn stages
- Call OpenAI directly from the mental model; go through CloudPilotIntelligence
- Invent AWS / request facts in General Chat — see [CloudPilot Context](./cloud_pilot_context.md)
