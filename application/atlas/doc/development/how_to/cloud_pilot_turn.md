# CloudPilot Turn — Message, Process, Reply

**Status:** Development guide  
**Use when:** Reading or changing CloudPilot messaging code and you need to know which layer you are in.

**Related:** [Important Fixes](../current/feature_important_fixes.md) · [CloudPilot Context](./cloud_pilot_context.md) · [Intelligence front door](../finished/feature_intelligence_front_door.md)

---

## One-sentence rule

> **One Turn is one user Message in, one CloudPilot Reply out.**

```text
ONE TURN
= Message → Process Message → Prepare Reply → Reply
```

`processMessage()` in `cloudPilot/chat/cloudPilotMessageFunctions.js` is the **whole Turn**, not only the Process Message half.

---

## Vocabulary

| Term | Meaning |
|------|---------|
| **Message** | One incoming user message. |
| **Process Message** | Understand, search/gather, decide, execute. |
| **Search** | Retrieve information needed to process the message. Part of Process Message. |
| **Message Context** | Information assembled for one Intelligence operation. Not a Turn stage. |
| **Prepare Reply** | Build the one final response the user will receive. |
| **Reply** | The final message returned to the user. |
| **Conversation** | History/container of Message ↔ Reply turns. **Not** a processing stage. |
| **CloudPilotIntelligence** | The brain. GenAI front door. Internal / OpenAI / future provider stay inside it. |
| **CloudPilotMessage** | The voice. Prepares the one user-facing Reply. |
| **Request** | A job the user wants done. Not a speaking verb. |

Keep these two words sacred:

```text
Message = one thing the user sent CloudPilot
Reply   = one thing CloudPilot sends the user
```

Calls into Intelligence are **not** more user Messages. They are Intelligence operations that receive Message Context.

---

## Who does what

```text
Prepare  → CloudPilotMessage (voice) gets the final Reply ready
Generate → CloudPilotIntelligence (brain) generates wording
Build    → construct data/text deterministically
```

From Prepare Reply, ask the brain. Do not choose Internal vs OpenAI by name:

```text
CloudPilotMessage.prepareRequestReply()
        ↓
CloudPilotIntelligence.generateFriendlyRequestReply()

CloudPilotMessage.prepareGeneralReply()
        ↓
CloudPilotIntelligence.generateGeneralReply()
```

Those `prepare` / `generate` names are the **direction**. Current code still says `speakRequest`, `speakGeneral`, `presentRequestMessage`, `chat()`. Do not rename until a later step is asked for.

---

## Diagnostic

When lost in the tree, ask:

```text
Is this understanding, searching, deciding, or doing?
  → Process Message

Is this assembling input for one Intelligence call?
  → Message Context

Is this getting the words the user will see?
  → Prepare Reply

Is this history of previous turns?
  → Conversation
```

---

## Current code map (names not changed yet)

| Today | Layer |
|-------|--------|
| `processMessage()` | **Turn** |
| `understandMessage`, region/action/question search | Process Message |
| `decideNextStep`, collect fields, execute | Process Message |
| `buildRequestSpeakFacts()` | Prepare Reply helper — known request info, **not** Message Context |
| `buildRequestPresentationMessages()` | Message Context for friendly request wording |
| `speakRequest` / `speakGeneral` / `speakKnown` | Prepare Reply (voice) |
| `chat()` / `presentRequestMessage()` | Intelligence generate entries |
| `presentRequestMessageOpenAI()` / `presentRequestMessageInternal()` | Provider details **inside** Intelligence. Not architectural names. |

Legacy words still in code: `speak`, `chat`, `present`, `write`, `known`. Treat them as current implementation names, not the mental model.

---

## Do not

- Rename functions or move folders from this guide
- Call OpenAI directly from the mental model; go through CloudPilotIntelligence
- Treat Conversation as a processing stage
- Invent AWS / request facts in General Chat — see [CloudPilot Context](./cloud_pilot_context.md)
